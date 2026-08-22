from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Categoria(Base):
    __tablename__ = "categoria"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))  
    descripcion = Column(Text)

    productos = relationship("Producto", back_populates="categoria")


class Marca(Base):
    __tablename__ = "marca"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))  
    descripcion = Column(Text)

    productos = relationship("Producto", back_populates="marca")


class UnidadMedida(Base):
    __tablename__ = "unidad_medida"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50))  
    abreviatura = Column(String(10)) 
    descripcion = Column(Text)


class Producto(Base):
    __tablename__ = "producto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(50), unique=True) 
    nombre = Column(String(100))
    descripcion = Column(Text)

    id_marca = Column(Integer, ForeignKey("marca.id"))
    id_categoria = Column(Integer, ForeignKey("categoria.id"))
    id_sububicacion = Column(Integer, ForeignKey("sububicacion.id"))  # estante donde vive

    id_unidad_compra = Column(Integer, ForeignKey("unidad_medida.id"))
    id_unidad_venta = Column(Integer, ForeignKey("unidad_medida.id"))
    factor_conversion = Column(DECIMAL(10, 4)) 

    precio_compra = Column(DECIMAL(12, 2))
    precio_venta = Column(DECIMAL(12, 2))
    precio_automatico = Column(TINYINT, default=0)  # 1=calculado con margen, 0=manual
    margen_ganancia = Column(DECIMAL(5, 2))  

    stock_actual = Column(DECIMAL(12, 2), default=0)
    stock_minimo = Column(DECIMAL(12, 2))  
    stock_maximo = Column(DECIMAL(12, 2))

    activo = Column(TINYINT, default=1)
    fecha_creacion = Column(DateTime, server_default=func.now())

    marca = relationship("Marca", back_populates="productos")
    categoria = relationship("Categoria", back_populates="productos")
    sububicacion = relationship("Sububicacion")
    unidad_compra = relationship("UnidadMedida", foreign_keys=[id_unidad_compra])
    unidad_venta = relationship("UnidadMedida", foreign_keys=[id_unidad_venta])
    historico_precios = relationship(
        "HistoricoPrecio", back_populates="producto", order_by="HistoricoPrecio.fecha_cambio.desc()"
    )


class HistoricoPrecio(Base):
    __tablename__ = "historico_precio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_producto = Column(Integer, ForeignKey("producto.id"), nullable=False)
    fecha_cambio = Column(DateTime, server_default=func.now())
    precio_anterior = Column(DECIMAL(12, 2))
    precio_nuevo = Column(DECIMAL(12, 2))
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    motivo = Column(Text)

    producto = relationship("Producto", back_populates="historico_precios")
