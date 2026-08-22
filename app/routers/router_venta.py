from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.models.model_producto import Producto
from app.models.model_caja import CajaTurno
from app.models.model_inventario import MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario, Alerta
from app.models.model_venta import Venta, DetalleVenta, MetodoPagoVenta, ServicioAdicional, DetalleServicio
from app.schemas.schema_venta import (
    VentaCreate, VentaResponse,
    ServicioAdicionalCreate, ServicioAdicionalResponse,
)

router = APIRouter()            # /ventas
router_servicio = APIRouter()   # /servicios-adicionales


def _generar_alerta_si_stock_bajo(db: Session, producto: Producto):
    if producto.stock_minimo is None or float(producto.stock_actual) > float(producto.stock_minimo):
        return
    ya_existe = db.query(Alerta).filter(
        Alerta.id_producto == producto.id, Alerta.tipo == "stock_bajo", Alerta.leida == 0
    ).first()
    if ya_existe:
        return
    db.add(Alerta(
        tipo="stock_bajo",
        mensaje=f"El producto '{producto.nombre}' llegó a su stock mínimo ({producto.stock_actual} unidades).",
        id_producto=producto.id,
        leida=0,
    ))


# ===================================================================
# VENTA (+ detalle_venta + metodo_pago_venta)
# ===================================================================

@router.get("/", response_model=List[VentaResponse])
def listar_ventas(
    estado: Optional[str] = None,
    id_cliente: Optional[int] = None,
    id_caja_turno: Optional[int] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    query = db.query(Venta).order_by(Venta.fecha.desc())
    if estado is not None:
        query = query.filter(Venta.estado == estado)
    if id_cliente is not None:
        query = query.filter(Venta.id_cliente == id_cliente)
    if id_caja_turno is not None:
        query = query.filter(Venta.id_caja_turno == id_caja_turno)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/{venta_id}", response_model=VentaResponse)
def obtener_venta(venta_id: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.post("/", response_model=VentaResponse, status_code=201)
def crear_venta(datos: VentaCreate, db: Session = Depends(get_db)):

    turno = db.query(CajaTurno).filter(CajaTurno.id == datos.id_caja_turno).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno de caja no encontrado")
    if turno.estado != "Abierto":
        raise HTTPException(status_code=400, detail="No se puede vender: el turno de caja está cerrado")

    if not datos.detalles:
        raise HTTPException(status_code=400, detail="La venta debe incluir al menos un producto")

    tipo_venta = db.query(TipoMovimientoInventario).filter(TipoMovimientoInventario.nombre == "Venta").first()
    if not tipo_venta:
        raise HTTPException(
            status_code=400,
            detail="No existe el tipo de movimiento 'Venta' en tipos-movimiento. Créalo primero (nombre='Venta', signo=-1).",
        )

    # Verificar productos y stock disponible ANTES de mover nada
    productos = {}
    for d in datos.detalles:
        producto = db.query(Producto).filter(Producto.id == d.id_producto).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto id={d.id_producto} no encontrado")
        if float(producto.stock_actual or 0) < d.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente de '{producto.nombre}' (disponible: {producto.stock_actual}, pedido: {d.cantidad})",
            )
        productos[d.id_producto] = producto

    subtotal = sum(float(productos[d.id_producto].precio_venta or 0) * d.cantidad for d in datos.detalles)
    descuento = round(subtotal * (datos.descuento_porcentaje or 0) / 100, 2)
    total = round(subtotal - descuento, 2)

    total_pagado = round(sum(p.monto for p in datos.pagos), 2) if datos.pagos else 0
    if datos.pagos and abs(total_pagado - total) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"La suma de los pagos (Q{total_pagado}) no coincide con el total de la venta (Q{total})",
        )

    nueva_venta = Venta(
        id_cliente=datos.id_cliente,
        id_usuario=datos.id_usuario,
        id_ubicacion=datos.id_ubicacion,
        id_cotizacion=datos.id_cotizacion,
        id_caja_turno=datos.id_caja_turno,
        subtotal=round(subtotal, 2),
        descuento=descuento,
        descuento_porcentaje=datos.descuento_porcentaje or 0,
        total=total,
        estado="Completada",
        observaciones=datos.observaciones,
    )
    db.add(nueva_venta)
    db.flush()

    # Movimiento de inventario que baja el stock (cabecera + detalle)
    movimiento = MovimientoInventario(
        id_usuario=datos.id_usuario,
        id_tipo_movimiento=tipo_venta.id,
        id_ubicacion_origen=datos.id_ubicacion,
        tabla_referencia="venta",
        id_referencia=nueva_venta.id,
        observaciones=f"Venta #{nueva_venta.id}",
    )
    db.add(movimiento)
    db.flush()

    for d in datos.detalles:
        producto = productos[d.id_producto]
        precio = float(producto.precio_venta or 0)
        subtotal_linea = round(precio * d.cantidad, 2)

        db.add(DetalleVenta(
            id_venta=nueva_venta.id,
            id_producto=d.id_producto,
            cantidad=d.cantidad,
            precio_unitario=precio,
            costo_unitario=producto.precio_compra,
            subtotal=subtotal_linea,
        ))
        db.add(MovimientoInventarioDetalle(
            id_movimiento_cabecera=movimiento.id,
            id_producto=d.id_producto,
            cantidad=d.cantidad,
            costo_unitario=producto.precio_compra,
            precio_unitario=precio,
        ))

        producto.stock_actual = float(producto.stock_actual or 0) - d.cantidad
        _generar_alerta_si_stock_bajo(db, producto)

    for p in datos.pagos:
        db.add(MetodoPagoVenta(id_venta=nueva_venta.id, **p.model_dump()))

    # Cierra el TODO de caja.py: la venta se suma al total del turno
    turno.total_ventas = round(float(turno.total_ventas or 0) + total, 2)

    db.commit()
    db.refresh(nueva_venta)
    return nueva_venta


@router.patch("/{venta_id}/cancelar", response_model=VentaResponse)
def cancelar_venta(venta_id: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if venta.estado == "Cancelada":
        raise HTTPException(status_code=400, detail="Esta venta ya está cancelada")

    for detalle in venta.detalles:
        producto = db.query(Producto).filter(Producto.id == detalle.id_producto).first()
        if producto:
            producto.stock_actual = float(producto.stock_actual or 0) + float(detalle.cantidad)

    if venta.id_caja_turno:
        turno = db.query(CajaTurno).filter(CajaTurno.id == venta.id_caja_turno).first()
        if turno:
            turno.total_ventas = round(float(turno.total_ventas or 0) - float(venta.total or 0), 2)

    venta.estado = "Cancelada"
    db.commit()
    db.refresh(venta)
    return venta


# ===================================================================
# SERVICIO_ADICIONAL (+ detalle_servicio)
# ===================================================================

@router_servicio.get("/", response_model=List[ServicioAdicionalResponse])
def listar_servicios(id_cliente: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ServicioAdicional)
    if id_cliente is not None:
        query = query.filter(ServicioAdicional.id_cliente == id_cliente)
    return query.all()


@router_servicio.post("/", response_model=ServicioAdicionalResponse, status_code=201)
def registrar_servicio(datos: ServicioAdicionalCreate, db: Session = Depends(get_db)):
    monto_material = round(sum(d.cantidad * d.costo_unitario for d in datos.detalles), 2)
    total = round(monto_material + (datos.monto_mano_obra or 0), 2)

    datos_dict = datos.model_dump(exclude={"detalles"})
    nuevo = ServicioAdicional(**datos_dict, monto_material=monto_material, total=total)
    db.add(nuevo)
    db.flush()

    for d in datos.detalles:
        db.add(DetalleServicio(
            id_servicio_adicional=nuevo.id,
            material=d.material,
            cantidad=d.cantidad,
            costo_unitario=d.costo_unitario,
            subtotal=round(d.cantidad * d.costo_unitario, 2),
        ))

    db.commit()
    db.refresh(nuevo)
    return nuevo
