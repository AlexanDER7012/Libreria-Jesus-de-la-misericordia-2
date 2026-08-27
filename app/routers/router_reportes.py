from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.model_producto import Producto
from app.models.model_venta import Venta, DetalleVenta, MetodoPagoVenta
from app.models.model_caja import CajaTurno, TipoPago
from app.schemas.schema_reportes import (
    VentasDiariasResponse,
    ConciliacionPagosResponse, ConciliacionPagoItem,
    CuadreCajaResponse,
    UtilidadResponse, UtilidadItem,
    ProductoMasVendidoItem,
)

# AGREGAR EL PREFIX AQUÍ
router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/ventas-diarias", response_model=VentasDiariasResponse)
def reporte_ventas_diarias(fecha: date = Query(..., description="Fecha a consultar, ej. 2026-08-22"), db: Session = Depends(get_db)):
    """Requerimiento #25: reporte diario de ventas, reemplaza el reporte en papel."""
    ventas = (
        db.query(Venta)
        .filter(func.date(Venta.fecha) == fecha, Venta.estado == "Completada")
        .all()
    )
    return VentasDiariasResponse(
        fecha=fecha,
        cantidad_ventas=len(ventas),
        subtotal=round(sum(float(v.subtotal or 0) for v in ventas), 2),
        descuento=round(sum(float(v.descuento or 0) for v in ventas), 2),
        total=round(sum(float(v.total or 0) for v in ventas), 2),
    )


@router.get("/conciliacion-pagos", response_model=ConciliacionPagosResponse)
def reporte_conciliacion_pagos(fecha: date = Query(...), db: Session = Depends(get_db)):
    """Requerimiento #22: desglosa lo cobrado por cada método de pago (efectivo, tarjeta, transferencia)."""
    resultados = (
        db.query(TipoPago.nombre, func.sum(MetodoPagoVenta.monto))
        .join(MetodoPagoVenta, MetodoPagoVenta.id_tipo_pago == TipoPago.id)
        .join(Venta, Venta.id == MetodoPagoVenta.id_venta)
        .filter(func.date(Venta.fecha) == fecha, Venta.estado == "Completada")
        .group_by(TipoPago.nombre)
        .all()
    )
    desglose = [
        ConciliacionPagoItem(tipo_pago=nombre or "Sin especificar", monto=round(float(monto or 0), 2))
        for nombre, monto in resultados
    ]
    return ConciliacionPagosResponse(
        fecha=fecha,
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