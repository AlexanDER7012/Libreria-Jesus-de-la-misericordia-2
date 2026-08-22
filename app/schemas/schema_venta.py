from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ===================== DetalleVenta =====================
class DetalleVentaCreate(BaseModel):
    id_producto: int
    cantidad: float

class DetalleVentaResponse(BaseModel):
    id: int
    id_venta: int
    id_producto: int
    cantidad: Optional[float] = None
    precio_unitario: Optional[float] = None
    costo_unitario: Optional[float] = None
    subtotal: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== MetodoPagoVenta =====================

class MetodoPagoVentaCreate(BaseModel):
    id_tipo_pago: int
    monto: float
    referencia: Optional[str] = None

class MetodoPagoVentaResponse(MetodoPagoVentaCreate):
    id: int
    id_venta: int
    model_config = ConfigDict(from_attributes=True)


# ===================== Venta =====================

class VentaCreate(BaseModel):
    id_cliente: Optional[int] = None
    id_usuario: int
    id_ubicacion: int
    id_cotizacion: Optional[int] = None
    id_caja_turno: int
    descuento_porcentaje: Optional[float] = 0
    observaciones: Optional[str] = None
    detalles: List[DetalleVentaCreate]
    pagos: List[MetodoPagoVentaCreate]  

class VentaResponse(BaseModel):
    id: int
    fecha: Optional[datetime] = None
    id_cliente: Optional[int] = None
    id_usuario: Optional[int] = None
    id_ubicacion: Optional[int] = None
    id_cotizacion: Optional[int] = None
    id_caja_turno: Optional[int] = None
    subtotal: Optional[float] = None
    descuento: Optional[float] = None
    descuento_porcentaje: Optional[float] = None
    total: Optional[float] = None
    referencia_pago: Optional[str] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None
    detalles: List[DetalleVentaResponse] = []
    pagos: List[MetodoPagoVentaResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ===================== ServicioAdicional (+ detalle_servicio) =====================

class DetalleServicioCreate(BaseModel):
    material: str
    cantidad: float
    costo_unitario: float

class DetalleServicioResponse(DetalleServicioCreate):
    id: int
    id_servicio_adicional: int
    subtotal: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class ServicioAdicionalCreate(BaseModel):
    id_venta: Optional[int] = None
    id_cliente: Optional[int] = None
    tipo_servicio: str  # Impresion, Emplasticado, PagoCirculacion
    descripcion: Optional[str] = None
    monto_mano_obra: Optional[float] = 0
    detalles: List[DetalleServicioCreate] = []  # materiales usados (vacío si no aplica, ej. pago de circulación)


class ServicioAdicionalResponse(BaseModel):
    id: int
    id_venta: Optional[int] = None
    id_cliente: Optional[int] = None
    tipo_servicio: Optional[str] = None
    descripcion: Optional[str] = None
    monto_material: Optional[float] = None
    monto_mano_obra: Optional[float] = None
    total: Optional[float] = None
    detalles: List[DetalleServicioResponse] = []
    model_config = ConfigDict(from_attributes=True)
