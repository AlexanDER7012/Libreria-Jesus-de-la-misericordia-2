from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ===================== Modulo =====================

class ModuloBase(BaseModel):
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    orden: Optional[int] = None


class ModuloCreate(ModuloBase):
    nombre: str


class ModuloResponse(ModuloBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Permiso =====================

class PermisoBase(BaseModel):
    descripcion: Optional[str] = None
    id_modulo: Optional[int] = None


class PermisoCreate(PermisoBase):
    nombre: str


class PermisoResponse(PermisoBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Rol =====================

class RolBase(BaseModel):
    descripcion: Optional[str] = None
    nivel: Optional[int] = None


class RolCreate(RolBase):
    nombre: str


class RolResponse(RolBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== RolPermiso (asignación) =====================

class RolPermisoCreate(BaseModel):
    id_rol: int
    id_permiso: int


class RolPermisoResponse(BaseModel):
    id: int
    id_rol: int
    id_permiso: int
    model_config = ConfigDict(from_attributes=True)


# ===================== Puesto =====================

class PuestoBase(BaseModel):
    descripcion: Optional[str] = None


class PuestoCreate(PuestoBase):
    nombre: str


class PuestoResponse(PuestoBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Turno =====================

class TurnoBase(BaseModel):
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None


class TurnoCreate(TurnoBase):
    nombre: str


class TurnoResponse(TurnoBase):
    id: int
    nombre: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Empleado =====================

class EmpleadoBase(BaseModel):
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_contratacion: Optional[date] = None
    salario_base: Optional[float] = None
    id_puesto: Optional[int] = None
    id_turno: Optional[int] = None


class EmpleadoCreate(EmpleadoBase):
    nombre: str
    dpi: str


class EmpleadoUpdate(EmpleadoBase):
    nombre: Optional[str] = None
    dpi: Optional[str] = None
    activo: Optional[int] = None


class EmpleadoResponse(EmpleadoBase):
    id: int
    nombre: Optional[str] = None
    dpi: Optional[str] = None
    activo: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== Usuario =====================

class UsuarioBase(BaseModel):
    id_empleado: Optional[int] = None
    id_rol: Optional[int] = None


class UsuarioCreate(UsuarioBase):
    nombre_usuario: str
    password: str  # texto plano, se cifra ANTES de guardar (nunca se guarda así)


class UsuarioUpdate(BaseModel):
    id_rol: Optional[int] = None
    activo: Optional[int] = None
    password: Optional[str] = None 


class UsuarioResponse(UsuarioBase):
    
    id: int
    nombre_usuario: Optional[str] = None
    fecha_ultimo_acceso: Optional[datetime] = None
    intentos_fallidos: Optional[int] = None
    activo: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== HistoricoPagoEmpleado =====================

class HistoricoPagoEmpleadoCreate(BaseModel):
    id_empleado: int
    concepto: str  
    monto: float
    periodo: Optional[str] = None
    referencia: Optional[str] = None
    observaciones: Optional[str] = None


class HistoricoPagoEmpleadoResponse(HistoricoPagoEmpleadoCreate):
    id: int
    fecha_pago: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ===================== LogActividad =====================
# Solo lectura: el sistema lo escribe internamente, no se crea vía API pública.

class LogActividadResponse(BaseModel):
    id: int
    id_usuario: Optional[int] = None
    fecha: Optional[datetime] = None
    accion: Optional[str] = None
    modulo: Optional[str] = None
    ip: Optional[str] = None
    detalles: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
