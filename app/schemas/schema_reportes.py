from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

class VentasDiariasResponse(BaseModel):
    fecha: date
    cantidad_ventas: int
    subtotal: float
    descuento: float
    total: float

class ConciliacionPagoItem(BaseModel):
    tipo_pago: str
    monto: float

class ConciliacionPagosResponse(BaseModel):
    fecha: date
    total_general: float
    desglose: List[ConciliacionPagoItem]

class CuadreCajaResponse(BaseModel):
    id_turno: int
    id_ubicacion: Optional[int] = None
    fecha_apertura: Optional[datetime] = None
    fecha_cierre: Optional[datetime] = None
    fondo_inicial: float
    total_ventas: float
    total_contado: Optional[float] = None
    diferencia: Optional[float] = None
    estado: str

class UtilidadItem(BaseModel):
    id_producto: int
    producto: str
    cantidad_vendida: float
    ingresos: float
    costo: float
    utilidad: float
    margen_porcentaje: float

class UtilidadResponse(BaseModel):
    desde: date
    hasta: date
    total_ingresos: float
    total_costo: float
    total_utilidad: float
    detalle: List[UtilidadItem]

class ProductoMasVendidoItem(BaseModel):
    id_producto: int
    producto: str
    cantidad_vendida: float
    total_vendido: float
