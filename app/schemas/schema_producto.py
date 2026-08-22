from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ===================== Categoria =====================

class CategoriaBase(BaseModel):
    descripcion: Optional[str] = None


class CategoriaCreate(CategoriaBase):
    nombre: str


class CategoriaResponse(CategoriaBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Marca =====================

class MarcaBase(BaseModel):
    descripcion: Optional[str] = None


class MarcaCreate(MarcaBase):
    nombre: str


class MarcaResponse(MarcaBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== UnidadMedida =====================

class UnidadMedidaBase(BaseModel):
    abreviatura: Optional[str] = None
    descripcion: Optional[str] = None


class UnidadMedidaCreate(UnidadMedidaBase):
    nombre: str


class UnidadMedidaResponse(UnidadMedidaBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Producto =====================

class ProductoBase(BaseModel):
    descripcion: Optional[str] = None
    id_marca: Optional[int] = None
    id_categoria: Optional[int] = None
    id_sububicacion: Optional[int] = None
    id_unidad_compra: Optional[int] = None
    id_unidad_venta: Optional[int] = None
    factor_conversion: Optional[float] = None
    precio_compra: Optional[float] = None
    precio_venta: Optional[float] = None
    precio_automatico: Optional[int] = 0
    margen_ganancia: Optional[float] = None
    stock_minimo: Optional[float] = None
    stock_maximo: Optional[float] = None


class ProductoCreate(ProductoBase):
    codigo: str
    nombre: str


class ProductoUpdate(ProductoBase):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    activo: Optional[int] = None


class ProductoResponse(ProductoBase):
    id: int
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    stock_actual: Optional[float] = None
    activo: Optional[int] = None
    fecha_creacion: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== HistoricoPrecio =====================
# Solo lectura vía API: lo genera el sistema automáticamente cuando cambia un precio.

class HistoricoPrecioResponse(BaseModel):
    id: int
    id_producto: int
    fecha_cambio: Optional[datetime] = None
    precio_anterior: Optional[float] = None
    precio_nuevo: Optional[float] = None
    id_usuario: Optional[int] = None
    motivo: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
