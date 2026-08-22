from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL
from sqlalchemy.sql import func
from app.database import Base

class ConfiguracionGeneral(Base):
    __tablename__ = "configuracion_general"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_negocio = Column(String(100))
    direccion = Column(Text)
    telefono = Column(String(20))
    email = Column(String(100))
    nit = Column(String(20))
    iva_porcentaje = Column(DECIMAL(5, 2))
    monto_caja_chica_default = Column(DECIMAL(12, 2), default=500.00)  
    dias_alerta_stock = Column(Integer) 
    formato_impresion = Column(String(20))
    logo_ruta = Column(String(255))
    moneda = Column(String(10), default="GTQ")
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MetaFinanciera(Base):
    __tablename__ = "meta_financiera"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mes = Column(Integer)  
    anio = Column("año", Integer) 
    meta_ingresos = Column(DECIMAL(12, 2))
    meta_utilidad = Column(DECIMAL(12, 2))
    meta_gastos = Column(DECIMAL(12, 2))
    fecha_registro = Column(DateTime, server_default=func.now())
