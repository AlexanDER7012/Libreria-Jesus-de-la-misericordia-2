from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.security import get_current_user, requiere_permiso
from app.bitacora import registrar_actividad
from app.models.model_cliente import Cliente
from app.models.model_producto import Producto
from app.models.model_caja import CajaTurno
from app.models.model_usuario import Usuario
from app.models.model_inventario import MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario, Alerta
from app.stock import mover_stock, stock_en, resolver_ubicacion, nombre_ubicacion, tipo_movimiento
from app.models.model_venta import Venta, DetalleVenta, MetodoPagoVenta, ServicioAdicional, DetalleServicio
from app.schemas.schema_venta import (
    VentaCreate, VentaUpdate, VentaResponse,
    ServicioAdicionalCreate, ServicioAdicionalResponse, MetodoPagoVentaCreate,
)

router = APIRouter()
router_servicio = APIRouter()


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
# VENTA
# ===================================================================

@router.get("", response_model=List[VentaResponse])
def listar_ventas(
    estado: Optional[str] = None,
    estado_pago: Optional[str] = None,
    id_cliente: Optional[int] = None,
    id_caja_turno: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    buscar: Optional[str] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    """estado_pago: "Pagada" (sin saldo) o "Pendiente" (con saldo)."""
    query = db.query(Venta).order_by(Venta.fecha.desc(), Venta.id.desc())
    if estado:
        query = query.filter(Venta.estado == estado)
    if estado_pago in ("Pagada", "Pendiente"):
        pagado = (
            select(func.coalesce(func.sum(MetodoPagoVenta.monto), 0))
            .where(MetodoPagoVenta.id_venta == Venta.id)
            .correlate(Venta)
            .scalar_subquery()
        )
        saldo = func.coalesce(Venta.total, 0) - pagado
        query = query.filter(saldo > 0.009 if estado_pago == "Pendiente" else saldo <= 0.009)
    if id_cliente is not None:
        query = query.filter(Venta.id_cliente == id_cliente)
    if id_caja_turno is not None:
        query = query.filter(Venta.id_caja_turno == id_caja_turno)
    if fecha_desde is not None:
        query = query.filter(func.date(Venta.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Venta.fecha) <= fecha_hasta)
    if buscar:
        termino = buscar.strip()
        patron = f"%{termino}%"
        ids_cliente_coincidentes = db.query(Cliente.id).filter(
            or_(Cliente.nombre.ilike(patron), Cliente.nit.ilike(patron))
        )
        ids_venta_por_producto = (
            db.query(DetalleVenta.id_venta)
            .join(Producto, Producto.id == DetalleVenta.id_producto)
            .filter(Producto.nombre.ilike(patron))
        )
        condiciones = [
            Venta.nit.ilike(patron),
            Venta.id_cliente.in_(ids_cliente_coincidentes),
            Venta.id.in_(ids_venta_por_producto),
        ]
        if termino.isdigit():
            condiciones.append(Venta.id == int(termino))
        query = query.filter(or_(*condiciones))
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/conteo")
def contar_ventas_agrupado(
    agrupar_por: str = "cliente",
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    """
    Devuelve el conteo de ventas agrupado por cliente o por vendedor
    (id_usuario), para mostrar badges de "cantidad de ventas" sin tener
    que traer el historial completo de ventas al frontend.
    Ej: GET /ventas/conteo?agrupar_por=cliente -> [{"id": 3, "total": 12}, ...]
    """
    if agrupar_por not in ("cliente", "vendedor"):
        raise HTTPException(
            status_code=400, detail="agrupar_por debe ser 'cliente' o 'vendedor'"
        )
    columna = Venta.id_cliente if agrupar_por == "cliente" else Venta.id_usuario
    query = db.query(
        columna.label("id"),
        func.count(Venta.id).label("total"),
        func.coalesce(func.sum(Venta.total), 0).label("monto"),
    )
    if fecha_desde is not None:
        query = query.filter(func.date(Venta.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Venta.fecha) <= fecha_hasta)
    resultados = query.group_by(columna).all()
    return [
        {"id": r.id, "total": r.total, "monto": round(float(r.monto or 0), 2)}
        for r in resultados if r.id is not None
    ]


@router.get("/estadisticas-producto/{producto_id}")
def estadisticas_venta_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    """
    Veces vendido y cantidad total vendida de un producto, calculado en el
    backend (evita traer todas las ventas al frontend solo para esta ficha).
    """
    resultado = (
        db.query(
            func.count(DetalleVenta.id).label("veces_vendido"),
            func.coalesce(func.sum(DetalleVenta.cantidad), 0).label("cantidad_total"),
        )
        .filter(DetalleVenta.id_producto == producto_id)
        .first()
    )
    return {
        "veces_vendido": int(resultado.veces_vendido or 0),
        "cantidad_total": float(resultado.cantidad_total or 0),
    }


@router.get("/{venta_id}", response_model=VentaResponse)
def obtener_venta(venta_id: int, db: Session = Depends(get_db), usuario_actual=Depends(get_current_user)):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.post("", response_model=VentaResponse, status_code=201)
def crear_venta(datos: VentaCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Ventas", "Crear"))):
    turno = db.query(CajaTurno).filter(CajaTurno.id == datos.id_caja_turno).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno de caja no encontrado")
    if turno.estado != "Abierto":
        raise HTTPException(status_code=400, detail="No se puede vender: el turno de caja está cerrado")

    if not datos.detalles:
        raise HTTPException(status_code=400, detail="La venta debe incluir al menos un producto")

    tipo_venta = tipo_movimiento(db, "Venta", 2)

    # La venta descuenta de la ubicación donde se vende (la de la venta o,
    # si no viene, la ubicación principal de Configuración).
    id_ubicacion = resolver_ubicacion(db, datos.id_ubicacion)

    productos = {}
    pedido_por_producto = {}
    for d in datos.detalles:
        if float(d.cantidad or 0) <= 0:
            raise HTTPException(status_code=400, detail="La cantidad de cada producto debe ser mayor a 0")
        producto = db.query(Producto).filter(Producto.id == d.id_producto).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Uno de los productos ya no existe en el sistema. Quítalo de la lista e intenta de nuevo.")
        productos[d.id_producto] = producto
        pedido_por_producto[d.id_producto] = pedido_por_producto.get(d.id_producto, 0) + float(d.cantidad)

    for id_prod, pedido in pedido_por_producto.items():
        producto = productos[id_prod]
        disponible = stock_en(db, producto, id_ubicacion)
        if disponible < pedido:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Stock insuficiente de '{producto.nombre}' en {nombre_ubicacion(db, id_ubicacion)} "
                    f"(disponible: {disponible:g}, pedido: {pedido:g})"
                ),
            )

    subtotal = sum(float(productos[d.id_producto].precio_venta or 0) * d.cantidad for d in datos.detalles)
    descuento = round(subtotal * (datos.descuento_porcentaje or 0) / 100, 2)
    total = round(subtotal - descuento, 2)

    if any(float(p.monto or 0) <= 0 for p in datos.pagos or []):
        raise HTTPException(status_code=400, detail="Cada pago debe ser mayor a Q0.00")
    total_pagado = round(sum(p.monto for p in datos.pagos), 2) if datos.pagos else 0
    if datos.pagos and abs(total_pagado - total) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"La suma de los pagos (Q{total_pagado}) no coincide con el total de la venta (Q{total})",
        )

    nit_cliente = datos.nit
    if datos.id_cliente and not nit_cliente:
        cliente = db.query(Cliente).filter(Cliente.id == datos.id_cliente).first()
        if cliente and cliente.nit:
            nit_cliente = cliente.nit

    nueva_venta = Venta(
        id_cliente=datos.id_cliente,
        id_usuario=datos.id_usuario,
        id_ubicacion=id_ubicacion,
        id_cotizacion=datos.id_cotizacion,
        id_caja_turno=datos.id_caja_turno,
        subtotal=round(subtotal, 2),
        descuento=descuento,
        descuento_porcentaje=datos.descuento_porcentaje or 0,
        total=total,
        estado="Completada",
        observaciones=datos.observaciones,
        nit=nit_cliente,
    )
    db.add(nueva_venta)
    db.flush()

    movimiento = MovimientoInventario(
        id_usuario=datos.id_usuario,
        id_tipo_movimiento=tipo_venta.id,
        id_ubicacion_origen=id_ubicacion,
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

        mover_stock(db, producto, id_ubicacion, -float(d.cantidad))
        _generar_alerta_si_stock_bajo(db, producto)

    for p in datos.pagos:
        db.add(MetodoPagoVenta(id_venta=nueva_venta.id, **p.model_dump()))

    turno.total_ventas = round(float(turno.total_ventas or 0) + total, 2)

    registrar_actividad(db, usuario_actual.id, "CREAR", "Venta")
    db.commit()
    db.refresh(nueva_venta)
    return nueva_venta


@router.patch("/{venta_id}/cancelar", response_model=VentaResponse)
def cancelar_venta(venta_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Ventas", "Editar"))):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if venta.estado == "Cancelada":
        raise HTTPException(status_code=400, detail="Esta venta ya está cancelada")

    # El stock regresa a la ubicación donde se vendió, y queda el movimiento
    # en el historial (antes se devolvía sin dejar rastro).
    id_ubicacion = resolver_ubicacion(db, venta.id_ubicacion)
    tipo_cancelacion = tipo_movimiento(db, "Cancelación de venta", 1)
    movimiento = MovimientoInventario(
        id_usuario=usuario_actual.id,
        id_tipo_movimiento=tipo_cancelacion.id,
        id_ubicacion_destino=id_ubicacion,
        tabla_referencia="venta",
        id_referencia=venta.id,
        observaciones=f"Cancelación de venta #{venta.id}",
    )
    db.add(movimiento)
    db.flush()
    for detalle in venta.detalles:
        producto = db.query(Producto).filter(Producto.id == detalle.id_producto).first()
        if producto:
            mover_stock(db, producto, id_ubicacion, float(detalle.cantidad))
            db.add(MovimientoInventarioDetalle(
                id_movimiento_cabecera=movimiento.id,
                id_producto=producto.id,
                cantidad=detalle.cantidad,
                costo_unitario=detalle.costo_unitario,
                precio_unitario=detalle.precio_unitario,
            ))

    if venta.id_caja_turno:
        turno = db.query(CajaTurno).filter(CajaTurno.id == venta.id_caja_turno).first()
        if turno:
            turno.total_ventas = round(float(turno.total_ventas or 0) - float(venta.total or 0), 2)

    venta.estado = "Cancelada"
    registrar_actividad(db, usuario_actual.id, "CANCELAR", "Venta")
    db.commit()
    db.refresh(venta)
    return venta


@router.put("/{venta_id}", response_model=VentaResponse)
def actualizar_venta(venta_id: int, datos: VentaUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Ventas", "Editar"))):
    """
    Actualiza una venta existente. A propósito, solo permite cambiar
    'observaciones' (ver VentaUpdate para el porqué). Para cancelar una
    venta, usa PATCH /{venta_id}/cancelar, que sí revierte el stock y el
    total de caja correctamente.
    """
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(venta, campo, valor)

    registrar_actividad(db, usuario_actual.id, "EDITAR", "Venta")
    db.commit()
    db.refresh(venta)
    return venta


@router.post("/{venta_id}/pagos", status_code=201)
def registrar_pago_venta(venta_id: int, pago_data: MetodoPagoVentaCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Ventas", "Editar"))):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if venta.estado in ("Cancelada", "Anulada"):
        raise HTTPException(status_code=400, detail=f"No se pueden registrar pagos a una venta {venta.estado.lower()}")

    # No se puede pagar más de lo que se debe (antes lo aceptaba y el saldo
    # quedaba en negativo)
    monto = round(float(pago_data.monto or 0), 2)
    if monto <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a Q0.00")
    pagado = round(sum(float(p.monto or 0) for p in venta.pagos), 2)
    saldo = round(float(venta.total or 0) - pagado, 2)
    if saldo <= 0:
        raise HTTPException(status_code=400, detail="Esta venta ya está pagada por completo")
    if monto > saldo + 0.009:
        raise HTTPException(
            status_code=400,
            detail=f"El pago (Q{monto:.2f}) es mayor que el saldo pendiente (Q{saldo:.2f})",
        )

    nuevo_pago = MetodoPagoVenta(
        id_venta=venta_id,
        id_tipo_pago=pago_data.id_tipo_pago,
        monto=pago_data.monto,
        referencia=pago_data.referencia,
    )
    db.add(nuevo_pago)
    registrar_actividad(db, usuario_actual.id, "EDITAR", "Venta")
    db.commit()
    db.refresh(nuevo_pago)
    return nuevo_pago


@router.delete("/{venta_id}/pagos/{pago_id}", status_code=204)
def eliminar_pago_venta(venta_id: int, pago_id: int, forzar: bool = False, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Ventas", "Eliminar"))):
    """
    Elimina un pago de la venta. Por defecto, NO deja eliminar un pago si
    eso hace que los pagos restantes ya no cuadren con el total de la
    venta (para evitar que quede una venta "completa" sin estar
    realmente pagada del todo). Usa ?forzar=true si de verdad quieres
    eliminarlo de todas formas (por ejemplo, para corregir un pago
    duplicado antes de registrar el correcto).
    """
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    pago = db.query(MetodoPagoVenta).filter(
        MetodoPagoVenta.id == pago_id, MetodoPagoVenta.id_venta == venta_id
    ).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    db.delete(pago)
    db.flush()

    total_pagado_restante = db.query(func.sum(MetodoPagoVenta.monto)).filter(
        MetodoPagoVenta.id_venta == venta_id
    ).scalar() or 0

    if not forzar and abs(float(total_pagado_restante) - float(venta.total or 0)) > 0.01:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=(
                f"Al eliminar este pago, los pagos restantes (Q{total_pagado_restante}) ya no "
                f"cuadran con el total de la venta (Q{venta.total}). Usa ?forzar=true si de verdad "
                f"quieres continuar (por ejemplo, para luego registrar el pago correcto)."
            ),
        )

    registrar_actividad(db, usuario_actual.id, "EDITAR", "Venta")
    db.commit()


# ===================================================================
# SERVICIO_ADICIONAL
# ===================================================================

@router_servicio.get("", response_model=List[ServicioAdicionalResponse])
def listar_servicios(
    id_cliente: Optional[int] = None,
    id_venta: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    """Filtra por cliente, venta y fechas. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(ServicioAdicional).order_by(ServicioAdicional.id.desc())
    if id_cliente is not None:
        query = query.filter(ServicioAdicional.id_cliente == id_cliente)
    if id_venta is not None:
        query = query.filter(ServicioAdicional.id_venta == id_venta)
    if fecha_desde is not None:
        query = query.filter(func.date(ServicioAdicional.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(ServicioAdicional.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_servicio.post("", response_model=ServicioAdicionalResponse, status_code=201)
def registrar_servicio(datos: ServicioAdicionalCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Ventas", "Crear"))):
    """
    Si vienen 'detalles' (materiales usados), monto_material SIEMPRE se
    calcula desde ahí -- no se confía en lo que mande el cliente (mismo
    criterio que usamos en producto.py para el precio). Si no vienen
    detalles (ej. un servicio como "Pago de circulación" que no usa
    materiales), sí se toma el monto_material que mande el cliente.
    """
    if datos.detalles:
        monto_material = round(sum(d.cantidad * d.costo_unitario for d in datos.detalles), 2)
    else:
        monto_material = round(datos.monto_material or 0, 2)

    total = round(monto_material + (datos.monto_mano_obra or 0), 2)

    nuevo = ServicioAdicional(
        id_venta=datos.id_venta,
        id_cliente=datos.id_cliente,
        tipo_servicio=datos.tipo_servicio,
        descripcion=datos.descripcion,
        monto_mano_obra=datos.monto_mano_obra or 0,
        monto_material=monto_material,
        total=total,
    )
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

    registrar_actividad(db, usuario_actual.id, "CREAR", "ServicioAdicional")
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_servicio.delete("/{servicio_id}", status_code=204)
def eliminar_servicio(servicio_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Ventas", "Eliminar"))):
    servicio = db.query(ServicioAdicional).filter(ServicioAdicional.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db.delete(servicio)
    registrar_actividad(db, usuario_actual.id, "ELIMINAR", "ServicioAdicional")
    db.commit()