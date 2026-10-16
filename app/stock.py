"""
app/stock.py
------------
Stock por ubicación (sucursal, bodega, área de ventas...).

Regla de oro: NINGÚN router cambia producto.stock_actual a mano. Todo pasa
por mover_stock(), que:
  1. suma/resta en la fila de inventario_ubicacion de esa ubicación,
  2. no deja que esa ubicación quede en negativo,
  3. recalcula producto.stock_actual como la suma de todas las ubicaciones.

Así el total de la librería (producto.stock_actual) y el detalle por
ubicación siempre cuadran, y un traslado (resta en una, suma en otra) deja
el total igual.
"""

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.model_configuracion import ConfiguracionGeneral
from app.models.model_inventario import InventarioUbicacion, TipoMovimientoInventario
from app.models.model_producto import Producto
from app.models.model_ubicacion import Ubicacion


def _num(valor) -> float:
    return float(valor or 0)


def ubicacion_principal_id(db: Session):
    """
    Ubicación que se usa cuando no se indica ninguna: la "Ubicación por
    defecto" de Configuración general o, si no hay, la primera ubicación
    activa.
    """
    config = db.query(ConfiguracionGeneral).first()
    if config and config.id_ubicacion:
        return config.id_ubicacion
    ubicacion = (
        db.query(Ubicacion).filter(Ubicacion.activo != 0).order_by(Ubicacion.id).first()
        or db.query(Ubicacion).order_by(Ubicacion.id).first()
    )
    return ubicacion.id if ubicacion else None


def resolver_ubicacion(db: Session, id_ubicacion=None) -> int:
    """Devuelve la ubicación indicada, o la principal. Error claro si no hay ninguna."""
    if id_ubicacion:
        if not db.query(Ubicacion).filter(Ubicacion.id == id_ubicacion).first():
            raise HTTPException(status_code=404, detail="La ubicación indicada no existe")
        return id_ubicacion
    principal = ubicacion_principal_id(db)
    if not principal:
        raise HTTPException(
            status_code=400,
            detail="No hay ninguna ubicación creada. Crea una en Configuración > Ubicaciones.",
        )
    return principal


def nombre_ubicacion(db: Session, id_ubicacion) -> str:
    u = db.query(Ubicacion).filter(Ubicacion.id == id_ubicacion).first()
    return u.nombre if u and u.nombre else "la ubicación"


def asegurar_filas(db: Session, producto: Producto):
    """
    Productos con stock de antes de que existiera el stock por ubicación
    (o cargados directo en la base de datos) no tienen filas: todo su stock
    se asigna a la ubicación principal la primera vez que se mueve.
    """
    hay_filas = (
        db.query(InventarioUbicacion.id)
        .filter(InventarioUbicacion.id_producto == producto.id)
        .first()
    )
    if hay_filas or _num(producto.stock_actual) == 0:
        return
    principal = ubicacion_principal_id(db)
    if not principal:
        return
    db.add(InventarioUbicacion(
        id_producto=producto.id, id_ubicacion=principal, cantidad=_num(producto.stock_actual),
    ))
    db.flush()


def _fila(db: Session, id_producto: int, id_ubicacion: int, bloquear: bool = False):
    query = db.query(InventarioUbicacion).filter(
        InventarioUbicacion.id_producto == id_producto,
        InventarioUbicacion.id_ubicacion == id_ubicacion,
    )
    if bloquear:
        # En PostgreSQL bloquea la fila hasta el commit: dos ventas al mismo
        # tiempo del mismo producto ya no pueden descontar mal el stock.
        query = query.with_for_update()
    return query.first()


def stock_en(db: Session, producto: Producto, id_ubicacion: int) -> float:
    asegurar_filas(db, producto)
    fila = _fila(db, producto.id, id_ubicacion)
    return _num(fila.cantidad) if fila else 0.0


def mover_stock(db: Session, producto: Producto, id_ubicacion: int, delta: float) -> float:
    """
    Suma (delta > 0) o resta (delta < 0) stock del producto en la ubicación.
    Devuelve el stock que queda en esa ubicación. Lanza 400 si no alcanza.
    """
    delta = float(delta or 0)
    asegurar_filas(db, producto)
    fila = _fila(db, producto.id, id_ubicacion, bloquear=True)
    if fila is None:
        fila = InventarioUbicacion(id_producto=producto.id, id_ubicacion=id_ubicacion, cantidad=0)
        db.add(fila)
        db.flush()

    disponible = _num(fila.cantidad)
    if disponible + delta < -0.0001:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Stock insuficiente de '{producto.nombre}' en {nombre_ubicacion(db, id_ubicacion)} "
                f"(disponible: {disponible:g}, se necesitan: {abs(delta):g})"
            ),
        )
    fila.cantidad = round(disponible + delta, 2)
    db.flush()

    total = (
        db.query(func.coalesce(func.sum(InventarioUbicacion.cantidad), 0))
        .filter(InventarioUbicacion.id_producto == producto.id)
        .scalar()
    )
    producto.stock_actual = round(_num(total), 2)
    return _num(fila.cantidad)


def tipo_movimiento(db: Session, nombre: str, signo: int) -> TipoMovimientoInventario:
    """Busca un tipo de movimiento por nombre (sin importar mayúsculas) o lo crea."""
    tipo = (
        db.query(TipoMovimientoInventario)
        .filter(func.lower(TipoMovimientoInventario.nombre) == nombre.lower())
        .first()
    )
    if tipo:
        return tipo
    tipo = TipoMovimientoInventario(nombre=nombre, signo=signo, descripcion="Creado automáticamente por el sistema")
    db.add(tipo)
    db.flush()
    return tipo
