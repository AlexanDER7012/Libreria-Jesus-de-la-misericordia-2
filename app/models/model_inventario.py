from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey, UniqueConstraint
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
    ajustado = Column(Integer, default=0)

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

    costo_unitario = Column(DECIMAL(12, 2))  
    metodo_traslado = Column(String(50)) 
    direccion = Column(
        String(20),
        nullable=False,
        default="Entre ubicaciones",
        server_default="Entre ubicaciones",
    )
    id_usuario_autoriza = Column(Integer, ForeignKey("usuario.id"))
    id_usuario_recibe = Column(Integer, ForeignKey("usuario.id"))
    fecha_recepcion = Column(DateTime)
    estado = Column(String(20), default="EnProceso")  
    observaciones = Column(Text)

    # Nota de envío y cobro a precio de costo a la sucursal destino
    numero_nota_envio = Column(String(30), unique=True, index=True)
    monto_total = Column(DECIMAL(12, 2), default=0)    # cantidad x costo_unitario
    monto_pagado = Column(DECIMAL(12, 2), default=0)   # suma de pagos vigentes
    estado_pago = Column(String(20), default="Pendiente")  # Pendiente, Parcial, Pagado, No aplica
    # 1 = la cantidad ya se restó del origen al registrar el traslado (en camino)
    stock_descontado = Column(Integer, default=0, server_default="0")

    producto = relationship("Producto")
    pagos = relationship("TrasladoPago", back_populates="traslado", order_by="TrasladoPago.id")


class TrasladoPago(Base):
    """
    Pago que hace la sucursal destino por un traslado (a precio de costo).
    Igual que en Compras, un pago nunca se borra: se anula (anulado=1) y
    deja de contar para el saldo.
    """
    __tablename__ = "traslado_pago"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_traslado = Column(Integer, ForeignKey("traslado_sucursal.id"), nullable=False, index=True)
    id_tipo_pago = Column(Integer, ForeignKey("tipo_pago.id"))
    fecha_pago = Column(DateTime, server_default=func.now())
    monto = Column(DECIMAL(12, 2), nullable=False)
    referencia = Column(String(100))
    observaciones = Column(Text)
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    anulado = Column(Integer, default=0, server_default="0")
    motivo_anulacion = Column(Text)

    traslado = relationship("TrasladoSucursal", back_populates="pagos")


class Alerta(Base):
    __tablename__ = "alerta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, server_default=func.now())
    tipo = Column(String(30)) 
    mensaje = Column(Text)
    id_producto = Column(Integer, ForeignKey("producto.id"))
    id_usuario_destino = Column(Integer, ForeignKey("usuario.id"))
    leida = Column(Integer, default=0)
    fecha_lectura = Column(DateTime)

    producto = relationship("Producto")


class InventarioUbicacion(Base):
    """
    Stock de cada producto en cada ubicación (sucursal, bodega, área de
    ventas...). producto.stock_actual sigue existiendo y siempre es la SUMA
    de estas filas (el total de la librería), para que todo lo que ya lo usa
    (reportes, alertas, búsquedas) siga funcionando igual.
    Toda entrada/salida de stock pasa por app/stock.py (mover_stock).
    """
    __tablename__ = "inventario_ubicacion"
    __table_args__ = (
        UniqueConstraint("id_producto", "id_ubicacion", name="uq_inventario_producto_ubicacion"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False, index=True)
    id_ubicacion = Column(Integer, ForeignKey("ubicacion.id"), nullable=False, index=True)
    cantidad = Column(DECIMAL(12, 2), nullable=False, default=0, server_default="0")
