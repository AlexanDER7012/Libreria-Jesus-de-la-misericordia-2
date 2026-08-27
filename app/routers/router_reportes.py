"""
app/routers/router_reportes.py
----------------------------------
Endpoints de solo lectura (GET) que calculan reportes a partir de datos
que ya existen. No hay modelos propios ni tablas nuevas -- todo se arma
consultando venta, detalle_venta, caja_turno y metodo_pago_venta.

Cubre los requerimientos:
  #8  Cuadre de Caja Diario
  #20 Reporte de Utilidad y Márgenes de Ganancia
  #22 Reporte Diario de Conciliación (por método de pago)
  #25 Reporte Diario de Ventas Automático
  + Productos más vendidos (de la lista de módulos de frontend)

En main.py se registra así:
    app.include_router(router_reportes.router, prefix="/reportes", tags=["Reportes"])
"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.model_producto import Producto
from app.models.model_venta import Venta, DetalleVenta, MetodoPagoVenta
from app.models.model_caja import CajaTurno, TipoPago
from app.models.model_compra import Compra
from app.models.model_proveedor import Proveedor
from app.models.model_inventario import MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario
from app.models.model_usuario import LogActividad, Usuario
from app.schemas.schema_reportes import (
    VentasDiariasResponse,
    ConciliacionPagosResponse, ConciliacionPagoItem,
    CuadreCajaResponse,
    UtilidadResponse, UtilidadItem,
    ProductoMasVendidoItem,
    CompraResumenResponse,
    CompraPorProveedorResponse, CompraPorProveedorItem,
    CuentasPorPagarResponse, CuentaPorPagarItem,
    StockBajoResponse, StockBajoItem,
    MovimientoResumenResponse, MovimientoResumenItem,
    InventarioValorizadoResponse, InventarioValorizadoItem,
    LoginResumenResponse, LoginResumenItem,
    UsuariosMasActivosResponse, UsuarioMasActivoItem,
    BitacoraResponse, BitacoraItem,
)

router = APIRouter()              # /reportes (ventas y caja, ya existian)
router_compras = APIRouter()      # /reportes/compras
router_inventario = APIRouter()   # /reportes/inventario
router_usuarios = APIRouter()     # /reportes/usuarios


@router.get("/ventas-diarias", response_model=VentasDiariasResponse)
def reporte_ventas_diarias(
    desde: date = Query(None, description="Si se omite, usa la fecha de hoy"),
    hasta: date = Query(None, description="Si se omite, usa la fecha de hoy"),
    db: Session = Depends(get_db),
):
    """Requerimiento #25: reporte de ventas por rango de fechas (un solo día si desde=hasta, o el reporte diario si se omiten ambos)."""
    hoy = date.today()
    desde = desde or hoy
    hasta = hasta or hoy
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    ventas = (
        db.query(Venta)
        .filter(func.date(Venta.fecha) >= desde, func.date(Venta.fecha) <= hasta, Venta.estado == "Completada")
        .all()
    )
    return VentasDiariasResponse(
        desde=desde,
        hasta=hasta,
        cantidad_ventas=len(ventas),
        subtotal=round(sum(float(v.subtotal or 0) for v in ventas), 2),
        descuento=round(sum(float(v.descuento or 0) for v in ventas), 2),
        total=round(sum(float(v.total or 0) for v in ventas), 2),
    )


@router.get("/conciliacion-pagos", response_model=ConciliacionPagosResponse)
def reporte_conciliacion_pagos(
    desde: date = Query(None, description="Si se omite, usa la fecha de hoy"),
    hasta: date = Query(None, description="Si se omite, usa la fecha de hoy"),
    db: Session = Depends(get_db),
):
    """Requerimiento #22: desglosa lo cobrado por cada método de pago (efectivo, tarjeta, transferencia) en un rango de fechas."""
    hoy = date.today()
    desde = desde or hoy
    hasta = hasta or hoy
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    resultados = (
        db.query(TipoPago.nombre, func.sum(MetodoPagoVenta.monto))
        .join(MetodoPagoVenta, MetodoPagoVenta.id_tipo_pago == TipoPago.id)
        .join(Venta, Venta.id == MetodoPagoVenta.id_venta)
        .filter(func.date(Venta.fecha) >= desde, func.date(Venta.fecha) <= hasta, Venta.estado == "Completada")
        .group_by(TipoPago.nombre)
        .all()
    )
    desglose = [
        ConciliacionPagoItem(tipo_pago=nombre or "Sin especificar", monto=round(float(monto or 0), 2))
        for nombre, monto in resultados
    ]
    return ConciliacionPagosResponse(
        desde=desde,
        hasta=hasta,
        total_general=round(sum(item.monto for item in desglose), 2),
        desglose=desglose,
    )


@router.get("/cuadre-caja/{turno_id}", response_model=CuadreCajaResponse)
def reporte_cuadre_caja(turno_id: int, db: Session = Depends(get_db)):
    """Requerimiento #8: mismo cálculo que se hace al cerrar el turno, en formato de reporte."""
    turno = db.query(CajaTurno).filter(CajaTurno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    return CuadreCajaResponse(
        id_turno=turno.id,
        id_ubicacion=turno.id_ubicacion,
        fecha_apertura=turno.fecha_apertura,
        fecha_cierre=turno.fecha_cierre,
        fondo_inicial=float(turno.fondo_inicial or 0),
        total_ventas=float(turno.total_ventas or 0),
        total_contado=float(turno.total_contado) if turno.total_contado is not None else None,
        diferencia=float(turno.diferencia) if turno.diferencia is not None else None,
        estado=turno.estado,
    )


@router.get("/utilidad", response_model=UtilidadResponse)
def reporte_utilidad(
    desde: date = Query(...),
    hasta: date = Query(...),
    db: Session = Depends(get_db),
):
    """Requerimiento #20: margen de ganancia por producto en un rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    resultados = (
        db.query(
            Producto.id,
            Producto.nombre,
            func.sum(DetalleVenta.cantidad).label("cantidad"),
            func.sum(DetalleVenta.subtotal).label("ingresos"),
            func.sum(DetalleVenta.cantidad * DetalleVenta.costo_unitario).label("costo"),
        )
        .join(DetalleVenta, DetalleVenta.id_producto == Producto.id)
        .join(Venta, Venta.id == DetalleVenta.id_venta)
        .filter(func.date(Venta.fecha) >= desde, func.date(Venta.fecha) <= hasta, Venta.estado == "Completada")
        .group_by(Producto.id, Producto.nombre)
        .all()
    )

    detalle: List[UtilidadItem] = []
    total_ingresos = total_costo = 0.0
    for id_producto, nombre, cantidad, ingresos, costo in resultados:
        ingresos = round(float(ingresos or 0), 2)
        costo = round(float(costo or 0), 2)
        utilidad = round(ingresos - costo, 2)
        margen = round((utilidad / ingresos * 100), 2) if ingresos else 0.0
        detalle.append(UtilidadItem(
            id_producto=id_producto, producto=nombre or "",
            cantidad_vendida=float(cantidad or 0),
            ingresos=ingresos, costo=costo, utilidad=utilidad, margen_porcentaje=margen,
        ))
        total_ingresos += ingresos
        total_costo += costo

    detalle.sort(key=lambda d: d.utilidad, reverse=True)

    return UtilidadResponse(
        desde=desde, hasta=hasta,
        total_ingresos=round(total_ingresos, 2),
        total_costo=round(total_costo, 2),
        total_utilidad=round(total_ingresos - total_costo, 2),
        detalle=detalle,
    )


@router.get("/productos-mas-vendidos", response_model=List[ProductoMasVendidoItem])
def reporte_productos_mas_vendidos(
    desde: date = Query(...),
    hasta: date = Query(...),
    limite: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    resultados = (
        db.query(
            Producto.id,
            Producto.nombre,
            func.sum(DetalleVenta.cantidad).label("cantidad"),
            func.sum(DetalleVenta.subtotal).label("total"),
        )
        .join(DetalleVenta, DetalleVenta.id_producto == Producto.id)
        .join(Venta, Venta.id == DetalleVenta.id_venta)
        .filter(func.date(Venta.fecha) >= desde, func.date(Venta.fecha) <= hasta, Venta.estado == "Completada")
        .group_by(Producto.id, Producto.nombre)
        .order_by(func.sum(DetalleVenta.cantidad).desc())
        .limit(limite)
        .all()
    )

    return [
        ProductoMasVendidoItem(
            id_producto=id_producto, producto=nombre or "",
            cantidad_vendida=float(cantidad or 0),
            total_vendido=round(float(total or 0), 2),
        )
        for id_producto, nombre, cantidad, total in resultados
    ]


# ============================================================================
# REPORTES DE COMPRAS
# ============================================================================

@router_compras.get("/resumen", response_model=CompraResumenResponse)
def reporte_compras_resumen(
    desde: date = Query(...),
    hasta: date = Query(...),
    db: Session = Depends(get_db),
):
    """Total comprado, cantidad de compras y cuánto sigue pendiente de pago, en un rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    compras = db.query(Compra).filter(func.date(Compra.fecha) >= desde, func.date(Compra.fecha) <= hasta).all()
    return CompraResumenResponse(
        desde=desde,
        hasta=hasta,
        cantidad_compras=len(compras),
        total_comprado=round(sum(float(c.total or 0) for c in compras), 2),
        total_pendiente=round(sum(float(c.saldo_pendiente or 0) for c in compras), 2),
    )


@router_compras.get("/por-proveedor", response_model=CompraPorProveedorResponse)
def reporte_compras_por_proveedor(
    desde: date = Query(...),
    hasta: date = Query(...),
    db: Session = Depends(get_db),
):
    """Ranking de cuánto se le ha comprado a cada proveedor en un rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    resultados = (
        db.query(Proveedor.id, Proveedor.nombre, func.count(Compra.id), func.sum(Compra.total))
        .join(Compra, Compra.id_proveedor == Proveedor.id)
        .filter(func.date(Compra.fecha) >= desde, func.date(Compra.fecha) <= hasta)
        .group_by(Proveedor.id, Proveedor.nombre)
        .order_by(func.sum(Compra.total).desc())
        .all()
    )
    detalle = [
        CompraPorProveedorItem(
            id_proveedor=id_proveedor, proveedor=nombre or "",
            cantidad_compras=cantidad, total_comprado=round(float(total or 0), 2),
        )
        for id_proveedor, nombre, cantidad, total in resultados
    ]
    return CompraPorProveedorResponse(desde=desde, hasta=hasta, detalle=detalle)


@router_compras.get("/cuentas-por-pagar", response_model=CuentasPorPagarResponse)
def reporte_cuentas_por_pagar(db: Session = Depends(get_db)):
    """Compras que todavia tienen saldo pendiente de pago a proveedores (a la fecha de hoy)."""
    compras = (
        db.query(Compra)
        .filter(Compra.saldo_pendiente > 0)
        .order_by(Compra.fecha_vencimiento_pago.asc())
        .all()
    )
    detalle = []
    for c in compras:
        proveedor = db.query(Proveedor).filter(Proveedor.id == c.id_proveedor).first()
        detalle.append(CuentaPorPagarItem(
            id_compra=c.id,
            proveedor=proveedor.nombre if proveedor else "Sin proveedor",
            numero_factura=c.numero_factura,
            total=float(c.total or 0),
            saldo_pendiente=float(c.saldo_pendiente or 0),
            fecha_vencimiento_pago=c.fecha_vencimiento_pago,
        ))
    return CuentasPorPagarResponse(
        total_pendiente=round(sum(d.saldo_pendiente for d in detalle), 2),
        cantidad_compras=len(detalle),
        detalle=detalle,
    )


# ============================================================================
# REPORTES DE INVENTARIO
# ============================================================================

@router_inventario.get("/stock-bajo", response_model=StockBajoResponse)
def reporte_stock_bajo(db: Session = Depends(get_db)):
    """Productos activos cuyo stock_actual ya llego a su stock_minimo (necesitan reabastecimiento)."""
    productos = (
        db.query(Producto)
        .filter(Producto.activo == 1, Producto.stock_minimo.isnot(None))
        .filter(Producto.stock_actual <= Producto.stock_minimo)
        .all()
    )
    detalle = [
        StockBajoItem(
            id_producto=p.id, producto=p.nombre,
            stock_actual=float(p.stock_actual or 0), stock_minimo=float(p.stock_minimo or 0),
        )
        for p in productos
    ]
    return StockBajoResponse(cantidad=len(detalle), detalle=detalle)


@router_inventario.get("/movimientos-resumen", response_model=MovimientoResumenResponse)
def reporte_movimientos_resumen(
    desde: date = Query(...),
    hasta: date = Query(...),
    db: Session = Depends(get_db),
):
    """Cuantos movimientos hubo de cada tipo (Compra, Venta, Ajuste...) y cuantas unidades en total, en un rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    resultados = (
        db.query(
            TipoMovimientoInventario.nombre,
            func.count(func.distinct(MovimientoInventario.id)),
            func.sum(MovimientoInventarioDetalle.cantidad),
        )
        .join(MovimientoInventario, MovimientoInventario.id_tipo_movimiento == TipoMovimientoInventario.id)
        .join(MovimientoInventarioDetalle, MovimientoInventarioDetalle.id_movimiento_cabecera == MovimientoInventario.id)
        .filter(func.date(MovimientoInventario.fecha) >= desde, func.date(MovimientoInventario.fecha) <= hasta)
        .group_by(TipoMovimientoInventario.nombre)
        .all()
    )
    detalle = [
        MovimientoResumenItem(
            tipo_movimiento=nombre or "Sin tipo",
            cantidad_movimientos=cantidad,
            total_unidades=float(unidades or 0),
        )
        for nombre, cantidad, unidades in resultados
    ]
    return MovimientoResumenResponse(desde=desde, hasta=hasta, detalle=detalle)


@router_inventario.get("/valorizado", response_model=InventarioValorizadoResponse)
def reporte_inventario_valorizado(db: Session = Depends(get_db)):
    """Valor total del inventario actual (stock_actual * costo de compra de cada producto), a hoy."""
    productos = db.query(Producto).filter(Producto.activo == 1, Producto.stock_actual > 0).all()
    detalle = []
    for p in productos:
        costo = float(p.precio_compra or 0)
        stock = float(p.stock_actual or 0)
        detalle.append(InventarioValorizadoItem(
            id_producto=p.id, producto=p.nombre,
            stock_actual=stock, costo_unitario=costo,
            valor_total=round(stock * costo, 2),
        ))
    detalle.sort(key=lambda d: d.valor_total, reverse=True)
    return InventarioValorizadoResponse(
        fecha_corte=date.today(),
        valor_total_inventario=round(sum(d.valor_total for d in detalle), 2),
        detalle=detalle,
    )


@router_usuarios.get("/login-resumen", response_model=LoginResumenResponse)
def reporte_login_resumen(
    desde: date = Query(...),
    hasta: date = Query(...),
    db: Session = Depends(get_db),
):
    """Por usuario: cuantos logins exitosos y cuantos fallidos hubo en el rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    logs = (
        db.query(LogActividad)
        .filter(
            func.date(LogActividad.fecha) >= desde,
            func.date(LogActividad.fecha) <= hasta,
            LogActividad.accion.in_(["LOGIN", "LOGIN_FALLIDO"]),
        )
        .all()
    )
    resumen = {}
    for log in logs:
        uid = log.id_usuario
        if uid not in resumen:
            resumen[uid] = {"exitosos": 0, "fallidos": 0}
        if log.accion == "LOGIN":
            resumen[uid]["exitosos"] += 1
        else:
            resumen[uid]["fallidos"] += 1

    detalle = []
    for uid, conteo in resumen.items():
        usuario = db.query(Usuario).filter(Usuario.id == uid).first()
        detalle.append(LoginResumenItem(
            id_usuario=uid,
            nombre_usuario=usuario.nombre_usuario if usuario else "Desconocido",
            logins_exitosos=conteo["exitosos"],
            logins_fallidos=conteo["fallidos"],
        ))
    return LoginResumenResponse(desde=desde, hasta=hasta, detalle=detalle)


@router_usuarios.get("/mas-activos", response_model=UsuariosMasActivosResponse)
def reporte_usuarios_mas_activos(
    desde: date = Query(...),
    hasta: date = Query(...),
    limite: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Ranking de usuarios con mas acciones registradas en la bitacora, en un rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    resultados = (
        db.query(Usuario.id, Usuario.nombre_usuario, func.count(LogActividad.id))
        .join(LogActividad, LogActividad.id_usuario == Usuario.id)
        .filter(func.date(LogActividad.fecha) >= desde, func.date(LogActividad.fecha) <= hasta)
        .group_by(Usuario.id, Usuario.nombre_usuario)
        .order_by(func.count(LogActividad.id).desc())
        .limit(limite)
        .all()
    )
    detalle = [
        UsuarioMasActivoItem(id_usuario=uid, nombre_usuario=nombre or "", cantidad_acciones=cantidad)
        for uid, nombre, cantidad in resultados
    ]
    return UsuariosMasActivosResponse(desde=desde, hasta=hasta, detalle=detalle)


@router_usuarios.get("/bitacora", response_model=BitacoraResponse)
def reporte_bitacora(
    desde: date = Query(...),
    hasta: date = Query(...),
    id_usuario: Optional[int] = None,
    accion: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Listado detallado de la bitacora (log_actividad), filtrable por usuario y tipo de accion."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    query = db.query(LogActividad).filter(
        func.date(LogActividad.fecha) >= desde, func.date(LogActividad.fecha) <= hasta
    )
    if id_usuario is not None:
        query = query.filter(LogActividad.id_usuario == id_usuario)
    if accion is not None:
        query = query.filter(LogActividad.accion == accion)

    logs = query.order_by(LogActividad.fecha.desc()).limit(500).all()
    detalle = []
    for log in logs:
        usuario = db.query(Usuario).filter(Usuario.id == log.id_usuario).first()
        detalle.append(BitacoraItem(
            id=log.id, id_usuario=log.id_usuario,
            nombre_usuario=usuario.nombre_usuario if usuario else None,
            fecha=log.fecha, accion=log.accion, modulo=log.modulo,
        ))
    return BitacoraResponse(desde=desde, hasta=hasta, cantidad=len(detalle), detalle=detalle)
