from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ===================== DetalleCompra =====================

class DetalleCompraCreate(BaseModel):
    id_producto: int
    cantidad_comprada: float
    cantidad_unidades: float
    costo_unitario: float


class DetalleCompraResponse(DetalleCompraCreate):
    id: int
    id_compra: int
    subtotal: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Compra =====================

class CompraCreate(BaseModel):
    id_proveedor: int
    id_ubicacion_destino: Optional[int] = None
    numero_factura: Optional[str] = None
    id_usuario_registra: Optional[int] = None
    iva: Optional[float] = 0
    fecha_vencimiento_pago: Optional[date] = None
    observaciones: Optional[str] = None
    detalles: List[DetalleCompraCreate]


class CompraResponse(BaseModel):
    id: int
    id_proveedor: Optional[int] = None
    id_ubicacion_destino: Optional[int] = None
    numero_factura: Optional[str] = None
    fecha: Optional[datetime] = None
    subtotal: Optional[float] = None
    iva: Optional[float] = None
    total: Optional[float] = None
    estado: Optional[str] = None
    fecha_recepcion: Optional[datetime] = None
    id_usuario_registra: Optional[int] = None
    observaciones: Optional[str] = None
    fecha_vencimiento_pago: Optional[date] = None
    saldo_pendiente: Optional[float] = None
    detalles: List[DetalleCompraResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ===================== NotaEntrega =====================

class NotaEntregaCreate(BaseModel):
    numero_nota: Optional[str] = None
    id_usuario_receptor: int
    conforme: int 
    observaciones: Optional[str] = None  


class NotaEntregaResponse(NotaEntregaCreate):
    id: int
    id_compra: int
    fecha_recepcion: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== CompraPago =====================

class CompraPagoCreate(BaseModel):
    id_tipo_pago: Optional[int] = None
    monto: float
    referencia: Optional[str] = None
    observaciones: Optional[str] = None


class CompraPagoResponse(CompraPagoCreate):
    id: int
    id_compra: int
    fecha_pago: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== DevolucionCompra =====================

class DevolucionCompraCreate(BaseModel):
    id_compra: Optional[int] = None
    id_proveedor: int
    id_usuario: Optional[int] = None
    motivo: str
    observaciones: Optional[str] = None


class DevolucionCompraResponse(DevolucionCompraCreate):
    id: int
    fecha: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
