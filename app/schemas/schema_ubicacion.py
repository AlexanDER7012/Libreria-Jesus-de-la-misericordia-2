"""
app/schemas/schema_ubicacion.py
----------------------------------
Formas del JSON que entra y sale de la API para Ubicacion y Sububicacion.
"""

from datetime import time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.validators import TelefonoValidatorMixin


# ===================== Sububicacion =====================

class SububicacionBase(BaseModel):
    tipo: Optional[str] = None  # "Exhibicion" o "Almacenamiento"
    encargado: Optional[str] = None


class SububicacionCreate(SububicacionBase):
    nombre: str
    id_ubicacion: int


class SububicacionUpdate(SububicacionBase):
    nombre: Optional[str] = None
    activo: Optional[int] = None


class SububicacionResponse(SububicacionBase):
    id: int
    id_ubicacion: int
    nombre: Optional[str] = None
    activo: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ===================== Ubicacion =====================

class UbicacionBase(BaseModel):
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    encargado: Optional[str] = None
    hora_apertura: Optional[time] = None
    hora_cierre: Optional[time] = None


class UbicacionCreate(UbicacionBase, TelefonoValidatorMixin):
    nombre: str


class UbicacionUpdate(UbicacionBase, TelefonoValidatorMixin):
    nombre: Optional[str] = None
    activo: Optional[int] = None


class UbicacionResponse(UbicacionBase):
    # NO hereda TelefonoValidatorMixin (ver nota en schema_cliente.py)
    id: int
    nombre: Optional[str] = None
    activo: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class UbicacionConSububicaciones(UbicacionResponse):
    """Igual que UbicacionResponse, pero incluye la lista de sus sububicaciones."""
    sububicaciones: List[SububicacionResponse] = []
