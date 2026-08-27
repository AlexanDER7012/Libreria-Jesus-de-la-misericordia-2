from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

class VentasDiariasResponse(BaseModel):
    desde: date
    hasta: date
    cantidad_ventas: int
    subtotal: float
    descuento: float
    total: float

class ConciliacionPagoItem(BaseModel):
    tipo_pago: str
    monto: float

class ConciliacionPagosResponse(BaseModel):
    desde: date
    hasta: date
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

# ===================== COMPRAS =====================

class CompraResumenResponse(BaseModel):
    desde: date
    hasta: date
    cantidad_compras: int
    total_comprado: float
    total_pendiente: float


class CompraPorProveedorItem(BaseModel):
    id_proveedor: Optional[int] = None
    proveedor: str
    cantidad_compras: int
    total_comprado: float


class CompraPorProveedorResponse(BaseModel):
    desde: date
    hasta: date
    detalle: List[CompraPorProveedorItem]


class CuentaPorPagarItem(BaseModel):
    id_compra: int
    proveedor: str
    numero_factura: Optional[str] = None
    total: float
    saldo_pendiente: float
    fecha_vencimiento_pago: Optional[date] = None


class CuentasPorPagarResponse(BaseModel):
    total_pendiente: float
    cantidad_compras: int
    detalle: List[CuentaPorPagarItem]


# ===================== INVENTARIO =====================

class StockBajoItem(BaseModel):
    id_producto: int
    producto: str
    stock_actual: float
    stock_minimo: float


class StockBajoResponse(BaseModel):
    cantidad: int
    detalle: List[StockBajoItem]


class MovimientoResumenItem(BaseModel):
    tipo_movimiento: str
    cantidad_movimientos: int
    total_unidades: float


class MovimientoResumenResponse(BaseModel):
    desde: date
    hasta: date
    detalle: List[MovimientoResumenItem]


class InventarioValorizadoItem(BaseModel):
    id_producto: int
    producto: str
    stock_actual: float
    costo_unitario: float
    valor_total: float


class InventarioValorizadoResponse(BaseModel):
    fecha_corte: date
    valor_total_inventario: float
    detalle: List[InventarioValorizadoItem]


# ===================== USUARIOS =====================

class LoginResumenItem(BaseModel):
    id_usuario: int
    nombre_usuario: str
    logins_exitosos: int
    logins_fallidos: int


class LoginResumenResponse(BaseModel):
    desde: date
    hasta: date
    detalle: List[LoginResumenItem]


class UsuarioMasActivoItem(BaseModel):
    id_usuario: int
    nombre_usuario: str
    cantidad_acciones: int


class UsuariosMasActivosResponse(BaseModel):
    desde: date
    hasta: date
    detalle: List[UsuarioMasActivoItem]


class BitacoraItem(BaseModel):
    id: int
    id_usuario: Optional[int] = None
    nombre_usuario: Optional[str] = None
    fecha: Optional[datetime] = None
    accion: Optional[str] = None
    modulo: Optional[str] = None


class BitacoraResponse(BaseModel):
    desde: date
    hasta: date
    cantidad: int
    detalle: List[BitacoraItem]
