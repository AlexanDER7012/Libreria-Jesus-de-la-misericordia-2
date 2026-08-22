from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Cotizacion(Base):
    __tablename__ = "cotizacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("cliente.id"))
    numero_expediente = Column(String(20))  # correlativo Anioo-No., ej. "2026-014"
    fecha = Column(DateTime, server_default=func.now())
    total = Column(DECIMAL(12, 2))
    estado = Column(String(20), default="Pendiente")  # Pendiente, Aceptada, Rechazada
    archivo_pdf = Column(String(255))  
    observaciones = Column(Text)

    cliente = relationship("Cliente")
    detalles = relationship("DetalleCotizacion", back_populates="cotizacion", cascade="all, delete-orphan")

class DetalleCotizacion(Base):
    __tablename__ = "detalle_cotizacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizacion.id"), nullable=False)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    cantidad = Column(DECIMAL(12, 2))
    precio_unitario = Column(DECIMAL(12, 2))

    cotizacion = relationship("Cotizacion", back_populates="detalles")
    producto = relationship("Producto")
