from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
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


# ===================================================================
# UBICACION (sucursales)
# ===================================================================

@router.get("/", response_model=List[UbicacionResponse])
def listar_ubicaciones(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    db: Session = Depends(get_db),
):
    """Lista sucursales. Por defecto solo las activas."""
    query = db.query(Ubicacion)
    if estado == "activos":
        query = query.filter(Ubicacion.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Ubicacion.activo == 0)
    return query.all()


@router.get("/{ubicacion_id}", response_model=UbicacionConSububicaciones)
def obtener_ubicacion(ubicacion_id: int, db: Session = Depends(get_db)):
    """Obtiene una sucursal por su id, incluyendo sus sububicaciones."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return ubicacion


@router.post("/", response_model=UbicacionResponse, status_code=201)
def crear_ubicacion(datos: UbicacionCreate, db: Session = Depends(get_db)):
    """Crea una nueva sucursal."""
    nueva = Ubicacion(**datos.model_dump(), activo=1)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.put("/{ubicacion_id}", response_model=UbicacionResponse)
def actualizar_ubicacion(ubicacion_id: int, datos: UbicacionUpdate, db: Session = Depends(get_db)):
    """Actualiza uno o varios campos de una sucursal existente."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(ubicacion, campo, valor)

    db.commit()
    db.refresh(ubicacion)
    return ubicacion


@router.delete("/{ubicacion_id}", response_model=UbicacionResponse)
def eliminar_ubicacion(ubicacion_id: int, db: Session = Depends(get_db)):
    """Baja lógica: activo pasa de 1 a 0."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")

    ubicacion.activo = 0
    db.commit()
    db.refresh(ubicacion)
    return ubicacion


@router.get("/{ubicacion_id}/sububicaciones", response_model=List[SububicacionResponse])
def listar_sububicaciones_de_ubicacion(ubicacion_id: int, db: Session = Depends(get_db)):
    """Lista las sububicaciones (estantes/bodega) de una sucursal específica."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == ubicacion_id).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return db.query(Sububicacion).filter(Sububicacion.id_ubicacion == ubicacion_id).all()


# ===================================================================
# SUBUBICACION (estantes / bodega dentro de cada sucursal)
# ===================================================================

@sub_router.get("/", response_model=List[SububicacionResponse])
def listar_sububicaciones(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    db: Session = Depends(get_db),
):
    """Lista todas las sububicaciones (de cualquier sucursal). Por defecto solo activas."""
    query = db.query(Sububicacion)
    if estado == "activos":
        query = query.filter(Sububicacion.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Sububicacion.activo == 0)
    return query.all()


@sub_router.get("/{sububicacion_id}", response_model=SububicacionResponse)
def obtener_sububicacion(sububicacion_id: int, db: Session = Depends(get_db)):
    sub = db.query(Sububicacion).filter(Sububicacion.id == sububicacion_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sububicación no encontrada")
    return sub


@sub_router.post("/", response_model=SububicacionResponse, status_code=201)
def crear_sububicacion(datos: SububicacionCreate, db: Session = Depends(get_db)):
    """Crea una nueva sububicación. Debe indicar a qué ubicacion (sucursal) pertenece."""
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id == datos.id_ubicacion).first()
    if not ubicacion:
        raise HTTPException(status_code=404, detail="La ubicación (sucursal) indicada no existe")

    nueva = Sububicacion(**datos.model_dump(), activo=1)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@sub_router.put("/{sububicacion_id}", response_model=SububicacionResponse)
def actualizar_sububicacion(sububicacion_id: int, datos: SububicacionUpdate, db: Session = Depends(get_db)):
    sub = db.query(Sububicacion).filter(Sububicacion.id == sububicacion_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sububicación no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(sub, campo, valor)

    db.commit()
    db.refresh(sub)
    return sub


@sub_router.delete("/{sububicacion_id}", response_model=SububicacionResponse)
def eliminar_sububicacion(sububicacion_id: int, db: Session = Depends(get_db)):
    """Baja lógica: activo pasa de 1 a 0."""
    sub = db.query(Sububicacion).filter(Sububicacion.id == sububicacion_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sububicación no encontrada")

    sub.activo = 0
    db.commit()
    db.refresh(sub)
    return sub
