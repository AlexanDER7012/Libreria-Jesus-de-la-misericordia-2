"""
app/schemas/schema_cliente.py
------------------------
Formas del JSON que entra y sale de la API para el recurso Cliente.
No confundir con app/models/cliente.py (esa es la tabla real en MySQL).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validators import validar_telefono


class ClienteBase(BaseModel):
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    nit: Optional[str] = None
    tipo_cliente: Optional[str] = None

    @field_validator("telefono")
    @classmethod
    def _validar_telefono(cls, v):
        return validar_telefono(v)


class ClienteCreate(ClienteBase):
    nombre: str


class ClienteUpdate(ClienteBase):
    nombre: Optional[str] = None
    activo: Optional[int] = None


class ClienteResponse(ClienteBase):
    id: int
    nombre: Optional[str] = None
    fecha_registro: Optional[datetime] = None
    activo: Optional[int] = None

    # Permite que Pydantic lea directo un objeto SQLAlchemy (no solo un dict)
    model_config = ConfigDict(from_attributes=True)
