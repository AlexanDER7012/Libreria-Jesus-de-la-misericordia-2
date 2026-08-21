from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.sql import func

from app.database import Base


class Cliente(Base):
    __tablename__ = "cliente"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))  
    telefono = Column(String(20))
    email = Column(String(100))
    direccion = Column(Text)
    nit = Column(String(20))  
    tipo_cliente = Column(String(50))  
    fecha_registro = Column(DateTime, server_default=func.now())
    activo = Column(TINYINT, default=1)  
