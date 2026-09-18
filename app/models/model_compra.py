from sqlalchemy import Column, Integer, String, Text, DateTime, Date, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Compra(Base):
    __tablename__ = "compra"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_proveedor = Column(Integer, ForeignKey("proveedor.id"))
    id_ubicacion_destino = Column(Integer, ForeignKey("ubicacion.id"))  # sucursal que recibe
    id_pedido = Column(Integer, ForeignKey("pedido.id"), nullable=True)
    numero_factura = Column(String(50))
    fecha = Column(DateTime, server_default=func.now())
    subtotal = Column(DECIMAL(12, 2))
    iva = Column(DECIMAL(12, 2))
    total = Column(DECIMAL(12, 2))
    estado = Column(String(20), default="Pendiente")  # Pendiente, Recibida, Pagada, Parcial, Cancelada
    fecha_recepcion = Column(DateTime)
    id_usuario_registra = Column(Integer, ForeignKey("usuario.id"))
    observaciones = Column(Text)
    fecha_vencimiento_pago = Column(Date)
    saldo_pendiente = Column(DECIMAL(12, 2))
    motivo_cancelacion = Column(Text, nullable=True)  # NUEVO: por qué se canceló (si aplica)

    proveedor = relationship("Proveedor")
    pedido = relationship("Pedido")
    detalles = relationship("DetalleCompra", back_populates="compra", cascade="all, delete-orphan")
    pagos = relationship("CompraPago", back_populates="compra")
    notas_entrega = relationship("NotaEntrega", back_populates="compra")


class DetalleCompra(Base):
    __tablename__ = "detalle_compra"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_compra = Column(Integer, ForeignKey("compra.id"), nullable=False)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    cantidad_comprada = Column(DECIMAL(12, 2)) 
    cantidad_unidades = Column(DECIMAL(12, 2))  
    costo_unitario = Column(DECIMAL(12, 2))  
    subtotal = Column(DECIMAL(12, 2))

    compra = relationship("Compra", back_populates="detalles")
    producto = relationship("Producto")


class CompraPago(Base):
    __tablename__ = "compra_pago"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_compra = Column(Integer, ForeignKey("compra.id"), nullable=False)
    id_tipo_pago = Column(Integer, ForeignKey("tipo_pago.id"))
    fecha_pago = Column(DateTime, server_default=func.now())
    monto = Column(DECIMAL(12, 2))
    referencia = Column(String(100))
    observaciones = Column(Text)
    anulado = Column(Integer, default=0)  # NUEVO: 0=vigente, 1=anulado (por cancelación de la compra). Nunca se borra la fila.

    compra = relationship("Compra", back_populates="pagos")


class NotaEntrega(Base):
    __tablename__ = "nota_entrega"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_compra = Column(Integer, ForeignKey("compra.id"), nullable=False)
    numero_nota = Column(String(50))
    fecha_recepcion = Column(DateTime, server_default=func.now())
    id_usuario_receptor = Column(Integer, ForeignKey("usuario.id"))
    conforme = Column(Integer)
    observaciones = Column(Text)  

    compra = relationship("Compra", back_populates="notas_entrega")


class DevolucionCompra(Base):
    __tablename__ = "devolucion_compra"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_compra = Column(Integer, ForeignKey("compra.id"))
    id_proveedor = Column(Integer, ForeignKey("proveedor.id"))
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    fecha = Column(DateTime, server_default=func.now())
    motivo = Column(Text)
    observaciones = Column(Text)

    compra = relationship("Compra")
    proveedor = relationship("Proveedor")