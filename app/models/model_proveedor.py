from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TipoProveedor(Base):
    __tablename__ = "tipo_proveedor"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))  
    descripcion = Column(Text)

    proveedores = relationship("Proveedor", back_populates="tipo_proveedor")

class Proveedor(Base):
    __tablename__ = "proveedor"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    telefono = Column(String(20))
    email = Column(String(100))
    direccion = Column(Text)
    contacto = Column(String(100))  
    id_tipo_proveedor = Column(Integer, ForeignKey("tipo_proveedor.id"))
    nit = Column(String(20))
    codigo_proveedor = Column(String(50)) 
    dias_credito = Column(Integer)
    activo = Column(TINYINT, default=1)

    tipo_proveedor = relationship("TipoProveedor", back_populates="proveedores")
    pedidos = relationship("Pedido", back_populates="proveedor")

class Pedido(Base):
    __tablename__ = "pedido"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, server_default=func.now())
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    id_proveedor = Column(Integer, ForeignKey("proveedor.id"))
    estado = Column(String(20), default="Pendiente") 
    observaciones = Column(Text)

    proveedor = relationship("Proveedor", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


class DetallePedido(Base):
    __tablename__ = "detalle_pedido"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_pedido = Column(Integer, ForeignKey("pedido.id"), nullable=False)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    cantidad_sugerida = Column(DECIMAL(12, 2)) 
    cantidad_pedida = Column(DECIMAL(12, 2))
    observaciones = Column(Text)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto")
