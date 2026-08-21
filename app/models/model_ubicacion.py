from sqlalchemy import Column, Integer, String, Text, Time, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import relationship

from app.database import Base


class Ubicacion(Base):
    __tablename__ = "ubicacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))  
    direccion = Column(Text)
    telefono = Column(String(20))
    encargado = Column(String(100))  
    hora_apertura = Column(Time)
    hora_cierre = Column(Time)
    activo = Column(TINYINT, default=1)  
    sububicaciones = relationship(
        "Sububicacion", back_populates="ubicacion", cascade="all, delete-orphan"
    )


class Sububicacion(Base):
    __tablename__ = "sububicacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_ubicacion = Column(Integer, ForeignKey("ubicacion.id"), nullable=False)
    nombre = Column(String(100))  
    tipo = Column(String(20))
    encargado = Column(String(100))
    activo = Column(TINYINT, default=1)

    ubicacion = relationship("Ubicacion", back_populates="sububicaciones")
