from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

# ===================== TipoPago =====================
class TipoPagoBase(BaseModel):
    descripcion: Optional[str] = None
    para_ventas: Optional[int] = 1
    para_compras: Optional[int] = 1


class TipoPagoCreate(TipoPagoBase):
    nombre: str


class TipoPagoResponse(TipoPagoBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== TipoGasto =====================
class TipoGastoBase(BaseModel):
    descripcion: Optional[str] = None
    es_fijo: Optional[int] = 0


class TipoGastoCreate(TipoGastoBase):
    nombre: str


class TipoGastoResponse(TipoGastoBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Gasto =====================
class GastoCreate(BaseModel):
    id_tipo_gasto: int
    id_ubicacion: Optional[int] = None
    concepto: str
    monto: float
    id_usuario_registra: Optional[int] = None
    observaciones: Optional[str] = None


class GastoResponse(GastoCreate):
    id: int
    fecha: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== CajaDenominacion =====================
class CajaDenominacionCreate(BaseModel):
    denominacion: float
    cantidad: int


class CajaDenominacionResponse(CajaDenominacionCreate):
    id: int
    id_caja_turno: int
    total: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== CajaTurno =====================

class CajaTurnoAbrir(BaseModel):
    id_usuario: int
    id_ubicacion: int
    fondo_inicial: Optional[float] = 500.00


class CajaTurnoResponse(BaseModel):
    id: int
    id_usuario: Optional[int] = None
    id_ubicacion: Optional[int] = None
    fecha_apertura: Optional[datetime] = None
    fondo_inicial: Optional[float] = None
    fecha_cierre: Optional[datetime] = None
    total_contado: Optional[float] = None
    total_ventas: Optional[float] = None
    diferencia: Optional[float] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None
    denominaciones: List[CajaDenominacionResponse] = []
    model_config = ConfigDict(from_attributes=True)

class CajaTurnoCerrar(BaseModel):
    denominaciones: List[CajaDenominacionCreate]
    observaciones: Optional[str] = None

# ===================== CajaChicaMovimiento =====================

class CajaChicaMovimientoCreate(BaseModel):
    id_ubicacion: int
    tipo: str 
    monto: float  
    concepto: Optional[str] = None
    id_usuario: Optional[int] = None
    referencia: Optional[str] = None
    observaciones: Optional[str] = None


class CajaChicaMovimientoResponse(CajaChicaMovimientoCreate):
    id: int
    fecha: Optional[datetime] = None
    saldo: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)
