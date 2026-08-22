from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TipoMovimientoInventario(Base):
    __tablename__ = "tipo_movimiento_inventario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50))  
    descripcion = Column(Text)
    signo = Column(Integer)  


class MovimientoInventario(Base):
    __tablename__ = "movimiento_inventario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, server_default=func.now())
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    id_tipo_movimiento = Column(Integer, ForeignKey("tipo_movimiento_inventario.id"), nullable=False)
    id_ubicacion_origen = Column(Integer, ForeignKey("ubicacion.id"))
    id_sububicacion_origen = Column(Integer, ForeignKey("sububicacion.id"))
    id_ubicacion_destino = Column(Integer, ForeignKey("ubicacion.id"))
    id_sububicacion_destino = Column(Integer, ForeignKey("sububicacion.id"))
    id_referencia = Column(Integer)  # id de la compra/venta/traslado que originó esto
    tabla_referencia = Column(String(20))  # 'compra', 'venta', 'traslado'
    referencia = Column(String(100))
    observaciones = Column(Text)

    tipo_movimiento = relationship("TipoMovimientoInventario")
    detalles = relationship(
        "MovimientoInventarioDetalle", back_populates="movimiento", cascade="all, delete-orphan"
    )


class MovimientoInventarioDetalle(Base):
    __tablename__ = "movimiento_inventario_detalle"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_movimiento_cabecera = Column(Integer, ForeignKey("movimiento_inventario.id"), nullable=False)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    cantidad = Column(DECIMAL(12, 2), nullable=False)
    costo_unitario = Column(DECIMAL(12, 2))
    precio_unitario = Column(DECIMAL(12, 2))

    movimiento = relationship("MovimientoInventario", back_populates="detalles")
    producto = relationship("Producto")


class InventarioFisico(Base):
    __tablename__ = "inventario_fisico"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    id_ubicacion = Column(Integer, ForeignKey("ubicacion.id"))
    id_sububicacion = Column(Integer, ForeignKey("sububicacion.id"))
    fecha = Column(DateTime, server_default=func.now())
    stock_sistema = Column(DECIMAL(12, 2)) 
    stock_real = Column(DECIMAL(12, 2)) 
    diferencia = Column(DECIMAL(12, 2))  
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    observaciones = Column(Text)
    ajustado = Column(TINYINT, default=0) 

    producto = relationship("Producto")


class TrasladoSucursal(Base):
    __tablename__ = "traslado_sucursal"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, server_default=func.now())
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    cantidad = Column(DECIMAL(12, 2), nullable=False)
    id_ubicacion_origen = Column(Integer, ForeignKey("ubicacion.id"))
    id_ubicacion_destino = Column(Integer, ForeignKey("ubicacion.id"))
    id_sububicacion_origen = Column(Integer, ForeignKey("sububicacion.id"))
    id_sububicacion_destino = Column(Integer, ForeignKey("sububicacion.id"))
    costo_unitario = Column(DECIMAL(12, 2))  # sale a precio de costo, gana la sucursal destino
    metodo_traslado = Column(String(50))  # "Uber Moto" (urgente) o "Empleado Interno" (no urgente)
    id_usuario_autoriza = Column(Integer, ForeignKey("usuario.id"))
    id_usuario_recibe = Column(Integer, ForeignKey("usuario.id"))
    fecha_recepcion = Column(DateTime)
    estado = Column(String(20), default="EnProceso")  # EnProceso, Recibido, Completado
    observaciones = Column(Text)

    producto = relationship("Producto")


class Alerta(Base):
    __tablename__ = "alerta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, server_default=func.now())
    tipo = Column(String(30))  # stock_bajo, stock_excedido, sin_movimiento, vencimiento
    mensaje = Column(Text)
    id_producto = Column(Integer, ForeignKey("producto.id"))
    id_usuario_destino = Column(Integer, ForeignKey("usuario.id"))
    leida = Column(TINYINT, default=0)
    fecha_lectura = Column(DateTime)

    producto = relationship("Producto")
