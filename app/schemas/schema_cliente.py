"""
app/schemas/schema_cliente.py
------------------------
Formas del JSON que entra y sale de la API para el recurso Cliente.
No confundir con app/models/cliente.py (esa es la tabla real en MySQL).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.validators import TelefonoValidatorMixin


class ClienteBase(BaseModel):
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    nit: Optional[str] = None
    tipo_cliente: Optional[str] = None


class ClienteCreate(ClienteBase, TelefonoValidatorMixin):
    # Aunque la BD permite nombre vacío, aquí sí lo exigimos: no tiene
    # sentido dejar crear un cliente sin nombre desde la API.
    nombre: str


class ClienteUpdate(ClienteBase, TelefonoValidatorMixin):
    nombre: Optional[str] = None
    activo: Optional[int] = None


class ClienteResponse(ClienteBase):
    # OJO: a propósito NO hereda TelefonoValidatorMixin -- esta clase lee
    # datos que YA existen en la base de datos, algunos guardados antes
    # de que existiera esta validación. Si heredara el mixin, un registro
    # viejo con teléfono mal formado tumbaría el GET con un 500.
    id: int
    nombre: Optional[str] = None
    fecha_registro: Optional[datetime] = None
    activo: Optional[int] = None

    # Permite que Pydantic lea directo un objeto SQLAlchemy (no solo un dict)
    model_config = ConfigDict(from_attributes=True)
