"""
app/schemas/schema_configuracion.py
--------------------------------------
Formas del JSON que entra y sale de la API para el módulo configuracion.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.validators import TelefonoValidatorMixin


# ===================== ConfiguracionGeneral =====================

class ConfiguracionGeneralBase(BaseModel):
    nombre_negocio: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    nit: Optional[str] = None
    iva_porcentaje: Optional[float] = None
    monto_caja_chica_default: Optional[float] = None
    dias_alerta_stock: Optional[int] = None
    formato_impresion: Optional[str] = None
    logo_ruta: Optional[str] = None
    moneda: Optional[str] = None


class ConfiguracionGeneralUpdate(ConfiguracionGeneralBase, TelefonoValidatorMixin):
    pass


class ConfiguracionGeneralResponse(ConfiguracionGeneralBase):
    # NO hereda TelefonoValidatorMixin (ver nota en schema_cliente.py) --
    # antes heredaba de ConfiguracionGeneralUpdate por error, lo cual
    # arrastraba la validación también a la lectura.
    id: int
    fecha_actualizacion: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== MetaFinanciera =====================

class MetaFinancieraCreate(BaseModel):
    mes: int  # 1-12
    anio: int
    meta_ingresos: Optional[float] = None
    meta_utilidad: Optional[float] = None
    meta_gastos: Optional[float] = None


class MetaFinancieraResponse(MetaFinancieraCreate):
    id: int
    fecha_registro: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
