from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ClienteBase(BaseModel):
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    nit: Optional[str] = None
    tipo_cliente: Optional[str] = None


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


    model_config = ConfigDict(from_attributes=True)
