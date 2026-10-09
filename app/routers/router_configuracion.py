from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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