from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Venta(Base):
    __tablename__ = "venta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, server_default=func.now())
    id_cliente = Column(Integer, ForeignKey("cliente.id"))  
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    id_ubicacion = Column(Integer, ForeignKey("ubicacion.id"))
    id_cotizacion = Column(Integer, ForeignKey("cotizacion.id")) 
    id_caja_turno = Column(Integer, ForeignKey("caja_turno.id"))
    subtotal = Column(DECIMAL(12, 2))
    descuento = Column(DECIMAL(12, 2), default=0)
    descuento_porcentaje = Column(DECIMAL(5, 2), default=0) 
    total = Column(DECIMAL(12, 2))
    referencia_pago = Column(String(100)) 
    estado = Column(String(20), default="Completada")
    observaciones = Column(Text)

    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    pagos = relationship("MetodoPagoVenta", back_populates="venta", cascade="all, delete-orphan")


class DetalleVenta(Base):
    __tablename__ = "detalle_venta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_venta = Column(Integer, ForeignKey("venta.id"), nullable=False)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    cantidad = Column(DECIMAL(12, 2), nullable=False)
    precio_unitario = Column(DECIMAL(12, 2))  
    costo_unitario = Column(DECIMAL(12, 2)) 
    subtotal = Column(DECIMAL(12, 2))

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")


class MetodoPagoVenta(Base):
    __tablename__ = "metodo_pago_venta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_venta = Column(Integer, ForeignKey("venta.id"), nullable=False)
    id_tipo_pago = Column(Integer, ForeignKey("tipo_pago.id"))
    monto = Column(DECIMAL(12, 2))
    referencia = Column(String(100))

    venta = relationship("Venta", back_populates="pagos")


class ServicioAdicional(Base):
    __tablename__ = "servicio_adicional"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_venta = Column(Integer, ForeignKey("venta.id"))
    id_cliente = Column(Integer, ForeignKey("cliente.id"))
    tipo_servicio = Column(String(50))  
    descripcion = Column(Text)
    monto_material = Column(DECIMAL(12, 2))
    monto_mano_obra = Column(DECIMAL(12, 2), default=0) 
    total = Column(DECIMAL(12, 2))

    detalles = relationship("DetalleServicio", back_populates="servicio", cascade="all, delete-orphan")


class DetalleServicio(Base):
    __tablename__ = "detalle_servicio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_servicio_adicional = Column(Integer, ForeignKey("servicio_adicional.id"), nullable=False)
    material = Column(String(100))  
    cantidad = Column(DECIMAL(12, 2))
    costo_unitario = Column(DECIMAL(12, 2))
    subtotal = Column(DECIMAL(12, 2))

    servicio = relationship("ServicioAdicional", back_populates="detalles")
