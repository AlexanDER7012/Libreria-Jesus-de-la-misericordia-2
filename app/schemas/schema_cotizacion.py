from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

# ===================== DetalleCotizacion =====================

class DetalleCotizacionCreate(BaseModel):
    id_producto: int
    cantidad: float

class DetalleCotizacionResponse(BaseModel):
    id: int
    id_cotizacion: int
    id_producto: int
    cantidad: Optional[float] = None
    precio_unitario: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Cotizacion =====================

class CotizacionCreate(BaseModel):
    id_cliente: int
    observaciones: Optional[str] = None
    detalles: List[DetalleCotizacionCreate]

class CotizacionResponse(BaseModel):
    id: int
    id_cliente: Optional[int] = None
    numero_expediente: Optional[str] = None
    fecha: Optional[datetime] = None
    total: Optional[float] = None
    estado: Optional[str] = None
    archivo_pdf: Optional[str] = None
    observaciones: Optional[str] = None
    detalles: List[DetalleCotizacionResponse] = []
    model_config = ConfigDict(from_attributes=True)

# ===================== Cotizacion -> Venta =====================
# Usado por el frontend para prellenar el formulario de "Nueva Venta"
# a partir de una cotizacion ya Aceptada.

class CotizacionParaVentaDetalleItem(BaseModel):
    id_producto: int
    producto: str
    cantidad: float
    precio_unitario: float  # precio ACTUAL del producto, no el congelado en la cotizacion


class CotizacionParaVentaResponse(BaseModel):
    id_cotizacion: int
    id_cliente: Optional[int] = None
    numero_expediente: Optional[str] = None
    detalles: List[CotizacionParaVentaDetalleItem]
