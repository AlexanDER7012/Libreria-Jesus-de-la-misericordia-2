from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TipoPago(Base):
    __tablename__ = "tipo_pago"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50))  
    descripcion = Column(Text)
    para_ventas = Column(TINYINT, default=1)  
    para_compras = Column(TINYINT, default=1) 


class TipoGasto(Base):
    __tablename__ = "tipo_gasto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))  
    descripcion = Column(Text)
    es_fijo = Column(TINYINT) 

    gastos = relationship("Gasto", back_populates="tipo_gasto")


class Gasto(Base):
    __tablename__ = "gasto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_tipo_gasto = Column(Integer, ForeignKey("tipo_gasto.id"))
    id_ubicacion = Column(Integer, ForeignKey("ubicacion.id"))
    fecha = Column(DateTime, server_default=func.now())
    concepto = Column(Text)
    monto = Column(DECIMAL(12, 2))
    id_usuario_registra = Column(Integer, ForeignKey("usuario.id"))
    observaciones = Column(Text)

    tipo_gasto = relationship("TipoGasto", back_populates="gastos")


class CajaTurno(Base):
    __tablename__ = "caja_turno"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    id_ubicacion = Column(Integer, ForeignKey("ubicacion.id"))
    fecha_apertura = Column(DateTime, server_default=func.now())
    fondo_inicial = Column(DECIMAL(12, 2), default=500.00)  
    fecha_cierre = Column(DateTime)
    total_contado = Column(DECIMAL(12, 2))  
    total_ventas = Column(DECIMAL(12, 2)) 
    diferencia = Column(DECIMAL(12, 2)) 
    estado = Column(String(20), default="Abierto") 
    observaciones = Column(Text)

    denominaciones = relationship("CajaDenominacion", back_populates="caja_turno", cascade="all, delete-orphan")

class CajaDenominacion(Base):
    __tablename__ = "caja_denominacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_caja_turno = Column(Integer, ForeignKey("caja_turno.id"), nullable=False)
    denominacion = Column(DECIMAL(12, 2)) 
    cantidad = Column(Integer)
    total = Column(DECIMAL(12, 2)) 

    caja_turno = relationship("CajaTurno", back_populates="denominaciones")

class CajaChicaMovimiento(Base):
    __tablename__ = "caja_chica_movimiento"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_ubicacion = Column(Integer, ForeignKey("ubicacion.id"))
    fecha = Column(DateTime, server_default=func.now())
    tipo = Column(String(20)) 
    monto = Column(DECIMAL(12, 2)) 
    saldo = Column(DECIMAL(12, 2))  
    concepto = Column(Text)
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    referencia = Column(String(100))
    observaciones = Column(Text)
