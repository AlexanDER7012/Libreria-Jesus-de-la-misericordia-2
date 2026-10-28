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
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app.pagination import PaginationParams
from app.models.model_producto import Producto
from app.models.model_venta import Venta, DetalleVenta, MetodoPagoVenta
from app.models.model_caja import CajaTurno, TipoPago
from app.models.model_compra import Compra
from app.models.model_proveedor import Proveedor
from app.models.model_inventario import MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario
from app.models.model_usuario import LogActividad, Usuario
from app.schemas.schema_usuario import UsuarioResponse
from app.schemas.schema_reportes import (
    VentasDiariasResponse,
    ConciliacionPagosResponse, ConciliacionPagoItem,
    CuadreCajaResponse,
    UtilidadResponse, UtilidadItem,
    ProductoMasVendidoItem,
    CompraResumenResponse,
    CompraPorProveedorResponse, CompraPorProveedorItem,
    CuentasPorPagarResponse, CuentaPorPagarItem,
    StockBajoResponse, StockBajoItem, ExcesoInventarioItem,
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
    usuario_actual: Usuario = Depends(get_current_user),
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
    usuario_actual: Usuario = Depends(get_current_user),
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
def reporte_cuadre_caja(turno_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Requerimiento #8: mismo cálculo que se hace al cerrar el turno, en formato de reporte."""
    turno = db.query(CajaTurno).filter(CajaTurno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    return CuadreCajaResponse(
        id_turno=turno.id,
        id_usuario=turno.id_usuario,
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
    usuario_actual: Usuario = Depends(get_current_user),
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
    usuario_actual: Usuario = Depends(get_current_user),
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
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Total comprado, cantidad de compras y cuánto sigue pendiente de pago, en un rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    # Las compras canceladas no cuentan (antes se sumaban al total comprado)
    compras = (
        db.query(Compra)
        .filter(
            func.date(Compra.fecha) >= desde,
            func.date(Compra.fecha) <= hasta,
            Compra.estado != "Cancelada",
        )
        .all()
    )
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
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Ranking de cuánto se le ha comprado a cada proveedor en un rango de fechas."""
    if hasta < desde:
        raise HTTPException(status_code=400, detail="'hasta' no puede ser antes que 'desde'")

    resultados = (
        db.query(Proveedor.id, Proveedor.nombre, func.count(Compra.id), func.sum(Compra.total))
        .join(Compra, Compra.id_proveedor == Proveedor.id)
        .filter(
            func.date(Compra.fecha) >= desde,
            func.date(Compra.fecha) <= hasta,
            Compra.estado != "Cancelada",
        )
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
def reporte_cuentas_por_pagar(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Compras que todavia tienen saldo pendiente de pago a proveedores (a la fecha de hoy)."""
    compras = (
        db.query(Compra)
        .filter(Compra.saldo_pendiente > 0, Compra.estado != "Cancelada")
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
def reporte_stock_bajo(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
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


@router_inventario.get("/excesos", response_model=List[ExcesoInventarioItem])
def reporte_excesos_inventario(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Productos activos por encima de su stock máximo y días desde la última venta."""
    ultima_venta_por_producto = (
        db.query(
            MovimientoInventarioDetalle.id_producto.label("id_producto"),
            func.max(MovimientoInventario.fecha).label("fecha_ultima_venta"),
        )
        .join(
            MovimientoInventario,
            MovimientoInventario.id == MovimientoInventarioDetalle.id_movimiento_cabecera,
        )
        .join(
            TipoMovimientoInventario,
            TipoMovimientoInventario.id == MovimientoInventario.id_tipo_movimiento,
        )
        .filter(
            MovimientoInventario.tabla_referencia == "venta",
            TipoMovimientoInventario.signo == 2,
        )
        .group_by(MovimientoInventarioDetalle.id_producto)
        .subquery()
    )
    productos = (
        db.query(Producto, ultima_venta_por_producto.c.fecha_ultima_venta)
        .outerjoin(
            ultima_venta_por_producto,
            ultima_venta_por_producto.c.id_producto == Producto.id,
        )
        .filter(
            Producto.activo == 1,
            Producto.stock_maximo.isnot(None),
            Producto.stock_maximo > 0,
            Producto.stock_actual > Producto.stock_maximo,
        )
        .all()
    )

    hoy = date.today()
    return [
        ExcesoInventarioItem(
            id=producto.id,
            codigo=producto.codigo,
            nombre=producto.nombre,
            stock_actual=float(producto.stock_actual or 0),
            stock_maximo=float(producto.stock_maximo),
            exceso=float(producto.stock_actual or 0) - float(producto.stock_maximo),
            dias_sin_movimiento=(
                max(0, (hoy - fecha_ultima_venta.date()).days)
                if fecha_ultima_venta is not None
                else None
            ),
        )
        for producto, fecha_ultima_venta in productos
    ]


@router_inventario.get("/movimientos-resumen", response_model=MovimientoResumenResponse)
def reporte_movimientos_resumen(
    desde: date = Query(...),
    hasta: date = Query(...),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
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
def reporte_inventario_valorizado(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
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
    usuario_actual: Usuario = Depends(get_current_user),
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
    usuario_actual: Usuario = Depends(get_current_user),
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
    usuario_actual: Usuario = Depends(get_current_user),
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
            detalles=log.detalles,
        ))
    return BitacoraResponse(desde=desde, hasta=hasta, cantidad=len(detalle), detalle=detalle)


# ============================================================================
# REPORTES DE USUARIOS -- activos, inactivos, por fecha, e "inteligente"
# ============================================================================

ORDEN_USUARIO_PERMITIDO = {"id", "nombre_usuario", "fecha_creacion", "fecha_ultimo_acceso", "activo"}


def _aplicar_orden_usuario(query, orden_por: Optional[str], orden_direccion: str):
    if not orden_por or orden_por not in ORDEN_USUARIO_PERMITIDO:
        return query
    columna = getattr(Usuario, orden_por)
    return query.order_by(columna.desc() if orden_direccion == "desc" else columna.asc())


@router_usuarios.get("/activos", response_model=List[UsuarioResponse])
def reporte_usuarios_activos(
    orden_por: Optional[str] = None,
    orden_direccion: Literal["asc", "desc"] = "asc",
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Reporte de usuarios activos, con ordenamiento por columna y paginación."""
    query = db.query(Usuario).filter(Usuario.activo == 1)
    query = _aplicar_orden_usuario(query, orden_por, orden_direccion)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_usuarios.get("/inactivos", response_model=List[UsuarioResponse])
def reporte_usuarios_inactivos(
    orden_por: Optional[str] = None,
    orden_direccion: Literal["asc", "desc"] = "asc",
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Reporte de usuarios inactivos (dados de baja), con ordenamiento y paginación."""
    query = db.query(Usuario).filter(Usuario.activo == 0)
    query = _aplicar_orden_usuario(query, orden_por, orden_direccion)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_usuarios.get("/por-fecha", response_model=List[UsuarioResponse])
def reporte_usuarios_por_fecha(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    orden_por: Optional[str] = None,
    orden_direccion: Literal["asc", "desc"] = "asc",
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Reporte de usuarios filtrado por fecha de creación (registro) de la cuenta."""
    query = db.query(Usuario)
    if fecha_desde is not None:
        query = query.filter(func.date(Usuario.fecha_creacion) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Usuario.fecha_creacion) <= fecha_hasta)
    query = _aplicar_orden_usuario(query, orden_por, orden_direccion)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_usuarios.get("/buscar", response_model=List[UsuarioResponse])
def reporte_usuarios_inteligente(
    estado: Literal["activos", "inactivos", "todos"] = "todos",
    buscar: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    orden_por: Optional[str] = None,
    orden_direccion: Literal["asc", "desc"] = "asc",
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    query = db.query(Usuario)
    if estado == "activos":
        query = query.filter(Usuario.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Usuario.activo == 0)
    if buscar:
        query = query.filter(Usuario.nombre_usuario.ilike(f"%{buscar}%"))
    if fecha_desde is not None:
        query = query.filter(func.date(Usuario.fecha_creacion) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Usuario.fecha_creacion) <= fecha_hasta)
    query = _aplicar_orden_usuario(query, orden_por, orden_direccion)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()

# ============================================================================
# DASHBOARD (pantalla de inicio de Reportes)
# ============================================================================
# Antes el dashboard calculaba todo en el navegador con las últimas 50 ventas
# y 200 compras que traía la API: los "Ingresos totales" no eran totales,
# contaba ventas anuladas y compras canceladas, y como el estado de una venta
# es "Completada" (nunca "Pagada"), todas salían como "pendientes". Ahora el
# servidor calcula las cifras con todas las ventas y compras válidas.

@router.get("/dashboard")
def reporte_dashboard(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    from datetime import timedelta
    from app.models.model_cliente import Cliente
    from app.models.model_producto import Categoria

    hoy = date.today()
    ventas_validas = db.query(Venta).filter(Venta.estado == "Completada")

    def _suma(q):
        return round(float(q.scalar() or 0), 2)

    ventas_hoy = ventas_validas.filter(func.date(Venta.fecha) == hoy)
    cantidad_hoy = ventas_hoy.count()
    total_hoy = _suma(ventas_hoy.with_entities(func.sum(Venta.total)))

    cantidad_ventas = ventas_validas.count()
    ingresos_total = _suma(ventas_validas.with_entities(func.sum(Venta.total)))
    compras_total = _suma(
        db.query(func.sum(Compra.total)).filter(Compra.estado != "Cancelada")
    )

    pagado_por_venta = dict(
        db.query(MetodoPagoVenta.id_venta, func.sum(MetodoPagoVenta.monto))
        .group_by(MetodoPagoVenta.id_venta)
        .all()
    )
    con_saldo = 0
    for id_venta, total in ventas_validas.with_entities(Venta.id, Venta.total).all():
        if float(total or 0) - float(pagado_por_venta.get(id_venta) or 0) > 0.009:
            con_saldo += 1

    # Últimos 7 días
    inicio_7 = hoy - timedelta(days=6)
    por_dia = {
        str(fila[0]): (int(fila[1]), float(fila[2] or 0))
        for fila in ventas_validas.filter(func.date(Venta.fecha) >= inicio_7)
        .with_entities(func.date(Venta.fecha), func.count(Venta.id), func.sum(Venta.total))
        .group_by(func.date(Venta.fecha))
        .all()
    }
    ventas_7dias = []
    for i in range(7):
        dia = inicio_7 + timedelta(days=i)
        cantidad, total = por_dia.get(str(dia), (0, 0.0))
        ventas_7dias.append({"fecha": str(dia), "cantidad": cantidad, "total": round(total, 2)})

    # Últimos 6 meses
    meses = []
    anio, mes = hoy.year, hoy.month
    for _ in range(6):
        meses.append((anio, mes))
        mes -= 1
        if mes == 0:
            anio, mes = anio - 1, 12
    meses.reverse()
    primer_mes = date(meses[0][0], meses[0][1], 1)
    totales_mes = {}
    for fecha, total in ventas_validas.filter(func.date(Venta.fecha) >= primer_mes).with_entities(Venta.fecha, Venta.total).all():
        if fecha:
            clave = (fecha.year, fecha.month)
            totales_mes[clave] = totales_mes.get(clave, 0) + float(total or 0)
    ingresos_6meses = [
        {"anio": a, "mes": m, "total": round(totales_mes.get((a, m), 0), 2)} for a, m in meses
    ]

    # Top 5 productos (todas las ventas válidas)
    top = (
        db.query(Producto.nombre, func.sum(DetalleVenta.cantidad))
        .join(DetalleVenta, DetalleVenta.id_producto == Producto.id)
        .join(Venta, Venta.id == DetalleVenta.id_venta)
        .filter(Venta.estado == "Completada")
        .group_by(Producto.id, Producto.nombre)
        .order_by(func.sum(DetalleVenta.cantidad).desc())
        .limit(5)
        .all()
    )
    top_productos = [{"producto": n or "--", "cantidad": float(c or 0)} for n, c in top]

    # Productos activos por categoría
    categorias = dict(db.query(Categoria.id, Categoria.nombre).all())
    por_categoria = {}
    for id_cat, cantidad in (
        db.query(Producto.id_categoria, func.count(Producto.id))
        .filter(Producto.activo == 1)
        .group_by(Producto.id_categoria)
        .all()
    ):
        nombre = categorias.get(id_cat) or "Sin categoría"
        por_categoria[nombre] = por_categoria.get(nombre, 0) + int(cantidad)
    productos_activos = sum(por_categoria.values())

    # Productos bajo stock (activos, con mínimo, y que ya llegaron al mínimo)
    bajo = (
        db.query(Producto)
        .filter(Producto.activo == 1, Producto.stock_minimo.isnot(None), Producto.stock_actual <= Producto.stock_minimo)
        .order_by((Producto.stock_actual - Producto.stock_minimo).asc())
        .all()
    )
    bajo_stock = [
        {"producto": p.nombre, "stock_actual": float(p.stock_actual or 0), "stock_minimo": float(p.stock_minimo or 0)}
        for p in bajo[:5]
    ]

    # Últimas 5 ventas (incluye anuladas, marcadas como tal)
    clientes = {}
    recientes = []
    for v in db.query(Venta).order_by(Venta.fecha.desc(), Venta.id.desc()).limit(5).all():
        if v.id_cliente and v.id_cliente not in clientes:
            c = db.query(Cliente).filter(Cliente.id == v.id_cliente).first()
            clientes[v.id_cliente] = c.nombre if c else None
        saldo = round(float(v.total or 0) - float(pagado_por_venta.get(v.id) or 0), 2)
        recientes.append({
            "id": v.id,
            "cliente": clientes.get(v.id_cliente) if v.id_cliente else None,
            "fecha": v.fecha,
            "total": float(v.total or 0),
            "estado": "Anulada" if v.estado == "Cancelada" else ("Pagada" if saldo <= 0.009 else "Pendiente"),
        })

    return {
        "ventas_hoy": {"cantidad": cantidad_hoy, "total": total_hoy},
        "cantidad_ventas": cantidad_ventas,
        "ingresos_total": ingresos_total,
        "compras_total": compras_total,
        "saldo_neto": round(ingresos_total - compras_total, 2),
        "ventas_con_saldo": con_saldo,
        "productos_activos": productos_activos,
        "cantidad_bajo_stock": len(bajo),
        "bajo_stock": bajo_stock,
        "ventas_7dias": ventas_7dias,
        "ingresos_6meses": ingresos_6meses,
        "top_productos": top_productos,
        "productos_por_categoria": [{"categoria": k, "cantidad": v} for k, v in por_categoria.items()],
        "ventas_recientes": recientes,
    }
