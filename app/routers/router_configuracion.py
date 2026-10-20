import logging
import os
import re
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.security import get_current_user, requiere_permiso
from app.bitacora import registrar_actividad, limpiar_bitacora_antigua, contar_bitacora_a_borrar
from app.models.model_usuario import Usuario
from app.models.model_configuracion import ConfiguracionGeneral, MetaFinanciera
from app.schemas.schema_configuracion import (
    ConfiguracionGeneralUpdate, ConfiguracionGeneralResponse,
    MetaFinancieraCreate, MetaFinancieraResponse,
)

router = APIRouter()        # /configuracion
router_meta = APIRouter()   # /metas-financieras

logger = logging.getLogger(__name__)
DIRECTORIO_BACKUPS = Path("/var/backups/libreria")
PATRON_ARCHIVO_BACKUP = re.compile(r"^[a-zA-Z0-9_-]+\.(backup|sql)$")


def _preparar_directorio_backups() -> Path:
    """Crea el directorio de backups y limita sus permisos al propietario."""
    try:
        if DIRECTORIO_BACKUPS.is_symlink():
            raise HTTPException(status_code=500, detail="El directorio de backups no puede ser un enlace simbólico")
        DIRECTORIO_BACKUPS.mkdir(mode=0o700, parents=True, exist_ok=True)
        os.chmod(DIRECTORIO_BACKUPS, 0o700)
    except OSError as error:
        logger.exception("No se pudo preparar el directorio de backups")
        raise HTTPException(status_code=500, detail=f"No se pudo preparar el directorio de backups: {error}") from error
    return DIRECTORIO_BACKUPS


def _obtener_archivo_backup_seguro(nombre_archivo: str) -> Path:
    """Valida el nombre y garantiza que el archivo esté dentro del directorio autorizado."""
    nombre_seguro = Path(nombre_archivo).name
    if nombre_seguro != nombre_archivo or not PATRON_ARCHIVO_BACKUP.fullmatch(nombre_seguro):
        raise HTTPException(status_code=400, detail="Nombre de archivo de backup inválido")

    directorio_sin_resolver = _preparar_directorio_backups()
    ruta_sin_resolver = directorio_sin_resolver / nombre_seguro
    if ruta_sin_resolver.is_symlink():
        raise HTTPException(status_code=404, detail="Backup no encontrado")

    directorio = directorio_sin_resolver.resolve()
    ruta = ruta_sin_resolver.resolve()
    if ruta.parent != directorio:
        raise HTTPException(status_code=400, detail="Ruta de backup inválida")
    return ruta


def _rotar_backups(directorio: Path) -> None:
    """Elimina backups regulares con más de 30 días de antigüedad."""
    fecha_limite = datetime.now(timezone.utc) - timedelta(days=30)
    for archivo in directorio.iterdir():
        if not PATRON_ARCHIVO_BACKUP.fullmatch(archivo.name) or archivo.is_symlink() or not archivo.is_file():
            continue
        fecha_modificacion = datetime.fromtimestamp(archivo.stat().st_mtime, tz=timezone.utc)
        if fecha_modificacion < fecha_limite:
            archivo.unlink()


@router.post("/backup")
def generar_backup(
    usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Editar")),
):
    """Genera un backup comprimido de PostgreSQL y lo devuelve como descarga."""
    directorio = _preparar_directorio_backups()
    try:
        datos_url = urlparse(settings.DATABASE_URL)
        if datos_url.scheme not in {"postgres", "postgresql", "postgresql+psycopg2"}:
            raise ValueError("DATABASE_URL no utiliza PostgreSQL")

        usuario = unquote(datos_url.username or "")
        password = unquote(datos_url.password or "")
        host = datos_url.hostname or "localhost"
        puerto = str(datos_url.port or 5432)
        nombre_bd = unquote(datos_url.path.lstrip("/"))
        if not usuario or not nombre_bd:
            raise ValueError("DATABASE_URL debe incluir usuario y nombre de base de datos")
    except ValueError as error:
        raise HTTPException(status_code=500, detail=f"Configuración de PostgreSQL inválida: {error}") from error

    momento = datetime.now().astimezone()
    base_nombre = f"backup_libreria_{momento.strftime('%Y%m%d_%H%M%S')}"
    ruta_salida = directorio / f"{base_nombre}.backup"
    indice = 1
    while ruta_salida.exists():
        ruta_salida = directorio / f"{base_nombre}_{indice}.backup"
        indice += 1

    entorno = os.environ.copy()
    entorno["PGPASSWORD"] = password
    comando = [
        "pg_dump",
        "-h", host,
        "-p", puerto,
        "-U", usuario,
        "-d", nombre_bd,
        "-F", "c",
        "-f", str(ruta_salida),
    ]
    try:
        resultado = subprocess.run(
            comando,
            shell=False,
            env=entorno,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail="No se encontró pg_dump. Instala postgresql-client en el servidor.") from error
    except OSError as error:
        logger.exception("No se pudo ejecutar pg_dump")
        raise HTTPException(status_code=500, detail=f"No se pudo ejecutar pg_dump: {error}") from error

    if resultado.returncode != 0:
        try:
            ruta_salida.unlink(missing_ok=True)
        except OSError:
            logger.exception("No se pudo eliminar el archivo parcial de pg_dump: %s", ruta_salida)
        detalle = resultado.stderr.strip() or f"pg_dump terminó con código {resultado.returncode}"
        logger.error("pg_dump falló: %s", detalle)
        raise HTTPException(status_code=500, detail=f"pg_dump falló: {detalle}")

    try:
        _rotar_backups(directorio)
    except OSError:
        logger.exception("No se pudieron eliminar backups con más de 30 días")

    tamano = ruta_salida.stat().st_size
    logger.info(
        "Backup generado el %s; tamaño=%s bytes; ruta=%s; usuario_id=%s",
        datetime.now().astimezone().isoformat(),
        tamano,
        ruta_salida,
        usuario_actual.id,
    )
    return FileResponse(
        path=str(ruta_salida),
        media_type="application/octet-stream",
        filename=ruta_salida.name,
    )


@router.get("/backup/listar")
def listar_backups(
    usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Ver")),
):
    """Lista los backups disponibles, del más reciente al más antiguo."""
    directorio = _preparar_directorio_backups()
    backups = []
    for archivo in directorio.iterdir():
        if (
            not PATRON_ARCHIVO_BACKUP.fullmatch(archivo.name)
            or archivo.is_symlink()
            or not archivo.is_file()
        ):
            continue
        datos = archivo.stat()
        backups.append({
            "nombre": archivo.name,
            "fecha": datetime.fromtimestamp(datos.st_mtime).astimezone().isoformat(),
            "tamano_mb": round(datos.st_size / (1024 * 1024), 2),
        })
    backups.sort(key=lambda backup: backup["fecha"], reverse=True)
    return backups


@router.get("/backup/descargar/{nombre_archivo}")
def descargar_backup(
    nombre_archivo: str,
    usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Ver")),
):
    """Descarga un backup cuyo nombre y ubicación hayan sido validados."""
    ruta = _obtener_archivo_backup_seguro(nombre_archivo)
    if not ruta.is_file():
        raise HTTPException(status_code=404, detail="Backup no encontrado")
    return FileResponse(
        path=str(ruta),
        media_type="application/octet-stream",
        filename=ruta.name,
    )


@router.delete("/backup/{nombre_archivo}", status_code=204)
def eliminar_backup(
    nombre_archivo: str,
    usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Eliminar")),
):
    """Elimina un archivo de backup previamente validado."""
    ruta = _obtener_archivo_backup_seguro(nombre_archivo)
    if not ruta.is_file():
        raise HTTPException(status_code=404, detail="Backup no encontrado")
    try:
        ruta.unlink()
    except OSError as error:
        logger.exception("No se pudo eliminar el backup %s", ruta)
        raise HTTPException(status_code=500, detail=f"No se pudo eliminar el backup: {error}") from error
    logger.info("Backup eliminado: %s; usuario_id=%s", ruta, usuario_actual.id)
    return None


def _obtener_o_crear_configuracion(db: Session) -> ConfiguracionGeneral:
    config = db.query(ConfiguracionGeneral).first()
    if not config:
        config = ConfiguracionGeneral(
            nombre_negocio="Librería y Papelería Jesús de la Misericordia",
            moneda="GTQ",
            monto_caja_chica_default=500.00,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


# ===================================================================
# CONFIGURACION_GENERAL (singleton)
# ===================================================================

@router.get("", response_model=ConfiguracionGeneralResponse)
def obtener_configuracion(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Trae la configuración general. Si nunca se ha creado, la crea con valores por defecto."""
    return _obtener_o_crear_configuracion(db)


@router.get("/bitacora-a-borrar")
def bitacora_a_borrar(dias: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Cuántos registros de bitácora se borrarían al conservar solo 'dias' días
    (para avisar antes de guardar el cambio)."""
    return {"dias": dias, "cantidad": contar_bitacora_a_borrar(db, dias)}


@router.put("", response_model=ConfiguracionGeneralResponse)
def actualizar_configuracion(datos: ConfiguracionGeneralUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Editar"))):
    config = _obtener_o_crear_configuracion(db)
    cambios = datos.model_dump(exclude_unset=True)
    if cambios.get("dias_retencion_bitacora") is not None and cambios["dias_retencion_bitacora"] < 0:
        raise HTTPException(status_code=400, detail="Los días de la bitácora no pueden ser negativos (usa 0 para no borrar nunca)")
    for campo, valor in cambios.items():
        setattr(config, campo, valor)
    cambios_texto = ", ".join(f"{campo}: {valor}" for campo, valor in cambios.items()) or "sin cambios"
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Configuracion",
        detalle=f"Actualizó la configuración general ({cambios_texto})",
    )
    db.commit()
    db.refresh(config)

    # Si se cambió cuánto tiempo se guarda la bitácora, aplicarlo de una vez
    if "dias_retencion_bitacora" in cambios:
        limpiar_bitacora_antigua(db, forzar=True, id_usuario=usuario_actual.id)

    return config


# ===================================================================
# META_FINANCIERA
# ===================================================================

@router_meta.get("", response_model=List[MetaFinancieraResponse])
def listar_metas(anio: Optional[int] = None, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    query = db.query(MetaFinanciera).order_by(MetaFinanciera.anio.desc(), MetaFinanciera.mes.desc())
    if anio is not None:
        query = query.filter(MetaFinanciera.anio == anio)
    return query.all()


@router_meta.post("", response_model=MetaFinancieraResponse, status_code=201)
def crear_meta(datos: MetaFinancieraCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Crear"))):
    existente = db.query(MetaFinanciera).filter(
        MetaFinanciera.mes == datos.mes, MetaFinanciera.anio == datos.anio
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe una meta para {datos.mes}/{datos.anio}")

    nueva = MetaFinanciera(**datos.model_dump())
    db.add(nueva)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "MetaFinanciera",
        detalle=f"Creó la meta financiera de {datos.mes}/{datos.anio}",
    )
    db.commit()
    db.refresh(nueva)
    return nueva


@router_meta.put("/{meta_id}", response_model=MetaFinancieraResponse)
def actualizar_meta(meta_id: int, datos: MetaFinancieraCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Editar"))):
    meta = db.query(MetaFinanciera).filter(MetaFinanciera.id == meta_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta financiera no encontrada")
    for campo, valor in datos.model_dump().items():
        setattr(meta, campo, valor)
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "MetaFinanciera",
        detalle=f"Actualizó la meta financiera de {meta.mes}/{meta.anio}",
    )
    db.commit()
    db.refresh(meta)
    return meta


@router_meta.delete("/{meta_id}", status_code=204)
def eliminar_meta(meta_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Eliminar"))):
    meta = db.query(MetaFinanciera).filter(MetaFinanciera.id == meta_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta financiera no encontrada")
    detalle_meta = f"Eliminó la meta financiera de {meta.mes}/{meta.anio}"
    db.delete(meta)
    registrar_actividad(db, usuario_actual.id, "ELIMINAR", "MetaFinanciera", detalle=detalle_meta)
    db.commit()
    return None