from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validators import validar_telefono


# ===================== TipoProveedor =====================

class TipoProveedorBase(BaseModel):
    descripcion: Optional[str] = None


class TipoProveedorCreate(TipoProveedorBase):
    nombre: str


class TipoProveedorResponse(TipoProveedorBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ===================== Proveedor =====================

class ProveedorBase(BaseModel):
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    contacto: Optional[str] = None
    id_tipo_proveedor: Optional[int] = None
    nit: Optional[str] = None
    codigo_proveedor: Optional[str] = None
    dias_credito: Optional[int] = None

    @field_validator("telefono")
    @classmethod
    def _validar_telefono(cls, v):
        return validar_telefono(v)

class ProveedorCreate(ProveedorBase):
    nombre: str

class ProveedorUpdate(ProveedorBase):
    nombre: Optional[str] = None
    activo: Optional[int] = None


class ProveedorResponse(ProveedorBase):
    id: int
    nombre: Optional[str] = None
    activo: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== DetallePedido =====================

class DetallePedidoCreate(BaseModel):
    id_producto: int
    cantidad_pedida: float
    cantidad_sugerida: Optional[float] = None
    observaciones: Optional[str] = None


class DetallePedidoResponse(DetallePedidoCreate):
    id: int
    id_pedido: int
    model_config = ConfigDict(from_attributes=True)


# ===================== Pedido =====================

class PedidoCreate(BaseModel):
    id_usuario: Optional[int] = None
    id_proveedor: Optional[int] = None
    observaciones: Optional[str] = None


class PedidoResponse(BaseModel):
    id: int
    fecha: Optional[datetime] = None
    id_usuario: Optional[int] = None
    id_proveedor: Optional[int] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None
    detalles: List[DetallePedidoResponse] = []
    model_config = ConfigDict(from_attributes=True)

class PedidoTotalResponse(BaseModel):
    id_pedido: int
    total: float
    alcanza_minimo: bool  # True si total >= Q500
