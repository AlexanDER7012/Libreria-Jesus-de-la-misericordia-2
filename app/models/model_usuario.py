from sqlalchemy import Column, Integer, String, Text, Date, DateTime, DECIMAL, Time, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Modulo(Base):
    __tablename__ = "modulo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50))
    descripcion = Column(Text)
    icono = Column(String(50))
    orden = Column(Integer)

    permisos = relationship("Permiso", back_populates="modulo")


class Permiso(Base):
    __tablename__ = "permiso"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100)) 
    descripcion = Column(Text)
    id_modulo = Column(Integer, ForeignKey("modulo.id"))

    modulo = relationship("Modulo", back_populates="permisos")
    rol_permisos = relationship("RolPermiso", back_populates="permiso")


class Rol(Base):
    __tablename__ = "rol"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50)) 
    descripcion = Column(Text)
    nivel = Column(Integer)  

    rol_permisos = relationship("RolPermiso", back_populates="rol")
    usuarios = relationship("Usuario", back_populates="rol")


class RolPermiso(Base):
    __tablename__ = "rol_permiso"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_rol = Column(Integer, ForeignKey("rol.id"))
    id_permiso = Column(Integer, ForeignKey("permiso.id"))

    rol = relationship("Rol", back_populates="rol_permisos")
    permiso = relationship("Permiso", back_populates="rol_permisos")


class Puesto(Base):
    __tablename__ = "puesto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))  
    descripcion = Column(Text)

    empleados = relationship("Empleado", back_populates="puesto")


class Turno(Base):
    __tablename__ = "turno"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50))  # Matutino, Vespertino
    hora_inicio = Column(Time)
    hora_fin = Column(Time)

    empleados = relationship("Empleado", back_populates="turno")


class Empleado(Base):
    __tablename__ = "empleado"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    dpi = Column(String(20), unique=True)
    telefono = Column(String(20))
    email = Column(String(100))
    direccion = Column(Text)
    fecha_nacimiento = Column(Date)
    fecha_contratacion = Column(Date)
    salario_base = Column(DECIMAL(12, 2))
    id_puesto = Column(Integer, ForeignKey("puesto.id"))
    id_turno = Column(Integer, ForeignKey("turno.id"))
    activo = Column(TINYINT, default=1)

    puesto = relationship("Puesto", back_populates="empleados")
    turno = relationship("Turno", back_populates="empleados")
    usuario = relationship("Usuario", back_populates="empleado", uselist=False)
    pagos = relationship("HistoricoPagoEmpleado", back_populates="empleado")


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_empleado = Column(Integer, ForeignKey("empleado.id"))
    nombre_usuario = Column(String(50), unique=True)
    password = Column(String(255))  # hash bcrypt (nunca texto plano)
    id_rol = Column(Integer, ForeignKey("rol.id"))
    fecha_ultimo_acceso = Column(DateTime)
    intentos_fallidos = Column(Integer, default=0)
    activo = Column(TINYINT, default=1)

    empleado = relationship("Empleado", back_populates="usuario")
    rol = relationship("Rol", back_populates="usuarios")


class HistoricoPagoEmpleado(Base):
    __tablename__ = "historico_pago_empleado"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_empleado = Column(Integer, ForeignKey("empleado.id"))
    fecha_pago = Column(DateTime)
    concepto = Column(String(50))  
    monto = Column(DECIMAL(12, 2))
    periodo = Column(String(50))  
    referencia = Column(String(100))
    observaciones = Column(Text)

    empleado = relationship("Empleado", back_populates="pagos")


class LogActividad(Base):
    __tablename__ = "log_actividad"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    fecha = Column(DateTime, server_default=func.now())
    accion = Column(String(20))  
    modulo = Column(String(50))
    ip = Column(String(45))
    detalles = Column(Text)  
