from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ===================== TipoMovimientoInventario =====================

class TipoMovimientoInventarioBase(BaseModel):
    descripcion: Optional[str] = None
    signo: int  

class TipoMovimientoInventarioCreate(TipoMovimientoInventarioBase):
    nombre: str

class TipoMovimientoInventarioResponse(TipoMovimientoInventarioBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== MovimientoInventario =====================

class MovimientoInventarioDetalleCreate(BaseModel):
    id_producto: int
    cantidad: float
    costo_unitario: Optional[float] = None
    precio_unitario: Optional[float] = None

class MovimientoInventarioDetalleResponse(MovimientoInventarioDetalleCreate):
    id: int
    id_movimiento_cabecera: int
    model_config = ConfigDict(from_attributes=True)

class MovimientoInventarioCreate(BaseModel):
    id_usuario: Optional[int] = None
    id_tipo_movimiento: int
    id_ubicacion_origen: Optional[int] = None
    id_sububicacion_origen: Optional[int] = None
    id_ubicacion_destino: Optional[int] = None
    id_sububicacion_destino: Optional[int] = None
    tabla_referencia: Optional[str] = None
    id_referencia: Optional[int] = None
    referencia: Optional[str] = None
    observaciones: Optional[str] = None
    detalles: List[MovimientoInventarioDetalleCreate] 


class MovimientoInventarioResponse(BaseModel):
    id: int
    fecha: Optional[datetime] = None
    id_usuario: Optional[int] = None
    id_tipo_movimiento: int
    id_ubicacion_origen: Optional[int] = None
    id_sububicacion_origen: Optional[int] = None
    id_ubicacion_destino: Optional[int] = None
    id_sububicacion_destino: Optional[int] = None
    tabla_referencia: Optional[str] = None
    id_referencia: Optional[int] = None
    referencia: Optional[str] = None
    observaciones: Optional[str] = None
    detalles: List[MovimientoInventarioDetalleResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ===================== InventarioFisico =====================

class InventarioFisicoCreate(BaseModel):
    id_producto: int
    id_ubicacion: Optional[int] = None
    id_sububicacion: Optional[int] = None
    stock_real: float
    id_usuario: Optional[int] = None
    observaciones: Optional[str] = None

class InventarioFisicoResponse(BaseModel):
    id: int
    id_producto: int
    id_ubicacion: Optional[int] = None
    id_sububicacion: Optional[int] = None
    fecha: Optional[datetime] = None
    stock_sistema: Optional[float] = None
    stock_real: Optional[float] = None
    diferencia: Optional[float] = None
    id_usuario: Optional[int] = None
    observaciones: Optional[str] = None
    ajustado: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# ===================== TrasladoSucursal =====================

class TrasladoSucursalCreate(BaseModel):
    id_producto: int
    cantidad: float
    id_ubicacion_origen: int
    id_ubicacion_destino: int
    id_sububicacion_origen: Optional[int] = None
    id_sububicacion_destino: Optional[int] = None
    costo_unitario: Optional[float] = None
    metodo_traslado: str  # "Uber Moto" o "Empleado Interno"
    id_usuario_autoriza: Optional[int] = None
    observaciones: Optional[str] = None

class TrasladoSucursalResponse(BaseModel):
    id: int
    fecha: Optional[datetime] = None
    id_producto: int
    cantidad: Optional[float] = None
    id_ubicacion_origen: Optional[int] = None
    id_ubicacion_destino: Optional[int] = None
    id_sububicacion_origen: Optional[int] = None
    id_sububicacion_destino: Optional[int] = None
    costo_unitario: Optional[float] = None
    metodo_traslado: Optional[str] = None
    id_usuario_autoriza: Optional[int] = None
    id_usuario_recibe: Optional[int] = None
    fecha_recepcion: Optional[datetime] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ===================== Alerta =====================
# Solo lectura + marcar como leída: las crea el sistema automáticamente.

class AlertaResponse(BaseModel):
    id: int
    fecha: Optional[datetime] = None
    tipo: Optional[str] = None
    mensaje: Optional[str] = None
    id_producto: Optional[int] = None
    id_usuario_destino: Optional[int] = None
    leida: Optional[int] = None
    fecha_lectura: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
