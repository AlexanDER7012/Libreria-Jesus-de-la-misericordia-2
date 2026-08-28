from datetime import time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validators import validar_telefono


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

    @field_validator("telefono")
    @classmethod
    def _validar_telefono(cls, v):
        return validar_telefono(v)


class UbicacionCreate(UbicacionBase):
    nombre: str


class UbicacionUpdate(UbicacionBase):
    nombre: Optional[str] = None
    activo: Optional[int] = None


class UbicacionResponse(UbicacionBase):
    id: int
    nombre: Optional[str] = None
    activo: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class UbicacionConSububicaciones(UbicacionResponse):
    sububicaciones: List[SububicacionResponse] = []
