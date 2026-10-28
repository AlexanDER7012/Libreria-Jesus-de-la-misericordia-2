"""
app/routers/router_ubicacion.py
-----------------------------------
Endpoints de Ubicacion (sucursales) y Sububicacion (estantes/bodega dentro
de cada sucursal). Son dos recursos relacionados, por eso van en el mismo
archivo pero con dos APIRouter separados: 'router' y 'sub_router'.

En main.py se registran así:
    app.include_router(router_ubicacion.router, prefix="/ubicaciones", tags=["Ubicaciones"])
    app.include_router(router_ubicacion.sub_router, prefix="/sububicaciones", tags=["Sububicaciones"])
"""

from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.security import get_current_user, requiere_permiso
from app.bitacora import registrar_actividad
from app.models.model_usuario import Usuario
from app.models.model_ubicacion import Ubicacion, Sububicacion
from app.schemas.schema_ubicacion import (
    UbicacionCreate,
    UbicacionUpdate,
    UbicacionResponse,
    UbicacionConSububicaciones,
    SububicacionCreate,
    SububicacionUpdate,
    SububicacionResponse,
)

router = APIRouter()       # /ubicaciones
sub_router = APIRouter()   # /sububicaciones


def _validar_puede_inactivar(db: Session, ubicacion: Ubicacion) -> None:
    """No deja inactivar la ubicación donde se vende, ni una con mercadería o caja abierta."""
    from app.models.model_configuracion import ConfiguracionGeneral
    from app.models.model_caja import CajaTurno
    from app.models.model_inventario import InventarioUbicacion
    from sqlalchemy import func

    config = db.query(ConfiguracionGeneral).first()
    if config and config.id_ubicacion == ubicacion.id:
        raise HTTPException(
            status_code=400,
            detail=f"'{ubicacion.nombre}' es la ubicación principal (donde se vende). Cambia la ubicación principal en Configuración General antes de inactivarla.",
        )
    if db.query(CajaTurno).filter(CajaTurno.id_ubicacion == ubicacion.id, CajaTurno.estado == "Abierto").first():
        raise HTTPException(status_code=400, detail=f"'{ubicacion.nombre}' tiene un turno de caja abierto. Ciérralo primero.")
    unidades = (
        db.query(func.coalesce(func.sum(InventarioUbicacion.cantidad), 0))
        .filter(InventarioUbicacion.id_ubicacion == ubicacion.id)
        .scalar()
    )
    if float(unidades or 0) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"'{ubicacion.nombre}' todavía tiene {float(unidades):g} unidades en inventario. Trasládalas a otra ubicación antes de inactivarla.",
        )


def _validar_horario(apertura, cierre) -> None:
    if apertura and cierre and apertura >= cierre:
        raise HTTPException(status_code=400, detail="La hora de apertura debe ser antes de la hora de cierre")


# ===================================================================
# UBICACION (sucursales)
# ===================================================================

@router.get("", response_model=List[UbicacionResponse])
def listar_ubicaciones(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    buscar: Optional[str] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Lista sucursales. Por defecto solo las activas. buscar: coincidencia en nombre. Paginado: ?skip=0&limit=50."""
    query = db.query(Ubicacion)
    if estado == "activos":
        query = query.filter(Ubicacion.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Ubicacion.activo == 0)
    if buscar:
        query = query.filter(Ubicacion.nombre.ilike(f"%{buscar}%"))
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/{ubicacion_id}", response_model=UbicacionConSububicaciones)
def obtener_ubicacion(ubicacion_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Obtiene una sucursal por su id, incluyendo sus sububicaciones."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return ubicacion


@router.post("", response_model=UbicacionResponse, status_code=201)
def crear_ubicacion(datos: UbicacionCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Crear"))):
    """Crea una nueva sucursal."""
    from app.catalogos import validar_nombre_unico
    datos.nombre = validar_nombre_unico(db, Ubicacion, datos.nombre, "una ubicación")
    _validar_horario(datos.hora_apertura, datos.hora_cierre)
    nueva = Ubicacion(**datos.model_dump(exclude={"activo"}), activo=1)
    db.add(nueva)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Ubicacion",
        detalle=f"Creó la sucursal '{nueva.nombre}'",
    )
    db.commit()
    db.refresh(nueva)
    return nueva


@router.put("/{ubicacion_id}", response_model=UbicacionResponse)
def actualizar_ubicacion(ubicacion_id: int, datos: UbicacionUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Editar"))):
    """Actualiza uno o varios campos de una sucursal existente."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")

    if datos.nombre is not None:
        from app.catalogos import validar_nombre_unico
        datos.nombre = validar_nombre_unico(db, Ubicacion, datos.nombre, "otra ubicación", excluir_id=ubicacion.id)
    cambios = datos.model_dump(exclude_unset=True)
    _validar_horario(
        cambios.get("hora_apertura", ubicacion.hora_apertura),
        cambios.get("hora_cierre", ubicacion.hora_cierre),
    )
    if cambios.get("activo") == 0 and ubicacion.activo != 0:
        _validar_puede_inactivar(db, ubicacion)
    for campo, valor in cambios.items():
        setattr(ubicacion, campo, valor)

    cambios_texto = ", ".join(f"{campo}: {valor}" for campo, valor in cambios.items()) or "sin cambios"
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Ubicacion",
        detalle=f"Actualizó la sucursal '{ubicacion.nombre}' ({cambios_texto})",
    )
    db.commit()
    db.refresh(ubicacion)
    return ubicacion


@router.delete("/{ubicacion_id}", response_model=UbicacionResponse)
def eliminar_ubicacion(ubicacion_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Eliminar"))):
    """Baja lógica: activo pasa de 1 a 0."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")

    _validar_puede_inactivar(db, ubicacion)
    ubicacion.activo = 0
    registrar_actividad(
        db, usuario_actual.id, "ELIMINAR", "Ubicacion",
        detalle=f"Desactivó la sucursal '{ubicacion.nombre}'",
    )
    db.commit()
    db.refresh(ubicacion)
    return ubicacion


@router.get("/{ubicacion_id}/sububicaciones", response_model=List[SububicacionResponse])
def listar_sububicaciones_de_ubicacion(ubicacion_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Lista las sububicaciones (estantes/bodega) de una sucursal específica."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return db.query(Sububicacion).filter(Sububicacion.id_ubicacion == ubicacion_id).all()


# ===================================================================
# SUBUBICACION (estantes / bodega dentro de cada sucursal)
# ===================================================================

@sub_router.get("", response_model=List[SububicacionResponse])
def listar_sububicaciones(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    buscar: Optional[str] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Lista todas las sububicaciones (de cualquier sucursal). Por defecto solo activas. Paginado: ?skip=0&limit=50."""
    query = db.query(Sububicacion)
    if estado == "activos":
        query = query.filter(Sububicacion.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Sububicacion.activo == 0)
    if buscar:
        query = query.filter(Sububicacion.nombre.ilike(f"%{buscar}%"))
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@sub_router.get("/{sububicacion_id}", response_model=SububicacionResponse)
def obtener_sububicacion(sububicacion_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    sub = db.query(Sububicacion).filter(Sububicacion.id == sububicacion_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sububicación no encontrada")
    return sub


@sub_router.post("", response_model=SububicacionResponse, status_code=201)
def crear_sububicacion(datos: SububicacionCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Crear"))):
    """Crea una nueva sububicación. Debe indicar a qué ubicacion (sucursal) pertenece."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == datos.id_ubicacion).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="La ubicación (sucursal) indicada no existe")

    nueva = Sububicacion(**datos.model_dump(), activo=1)
    db.add(nueva)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Sububicacion",
        detalle=f"Creó la sububicación '{nueva.nombre}' en la sucursal '{ubicacion.nombre}'",
    )
    db.commit()
    db.refresh(nueva)
    return nueva


@sub_router.put("/{sububicacion_id}", response_model=SububicacionResponse)
def actualizar_sububicacion(sububicacion_id: int, datos: SububicacionUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Editar"))):
    sub = db.query(Sububicacion).filter(Sububicacion.id == sububicacion_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sububicación no encontrada")

    cambios = datos.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(sub, campo, valor)

    cambios_texto = ", ".join(f"{campo}: {valor}" for campo, valor in cambios.items()) or "sin cambios"
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Sububicacion",
        detalle=f"Actualizó la sububicación '{sub.nombre}' ({cambios_texto})",
    )
    db.commit()
    db.refresh(sub)
    return sub


@sub_router.delete("/{sububicacion_id}", response_model=SububicacionResponse)
def eliminar_sububicacion(sububicacion_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Configuracion", "Eliminar"))):
    """Baja lógica: activo pasa de 1 a 0."""
    sub = db.query(Sububicacion).filter(Sububicacion.id == sububicacion_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sububicación no encontrada")

    sub.activo = 0
    registrar_actividad(
        db, usuario_actual.id, "ELIMINAR", "Sububicacion",
        detalle=f"Desactivó la sububicación '{sub.nombre}'",
    )
    db.commit()
    db.refresh(sub)
    return sub