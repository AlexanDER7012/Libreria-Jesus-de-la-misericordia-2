from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.pagination import PaginationParams
from app.models.model_producto import Producto
from app.models.model_compra import Compra, DetalleCompra, CompraPago, NotaEntrega, DevolucionCompra
from app.models.model_inventario import MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario
from app.schemas.schema_compra import (
    CompraCreate, CompraResponse,
    NotaEntregaCreate, NotaEntregaResponse,
    CompraPagoCreate, CompraPagoResponse,
    DevolucionCompraCreate, DevolucionCompraResponse,
)

router = APIRouter()             # /compras
router_devolucion = APIRouter()  # /devoluciones-compra


# ===================================================================
# COMPRA (+ detalle_compra)
# ===================================================================

@router.get("", response_model=List[CompraResponse])
def listar_compras(
    estado: Optional[str] = None,
    id_proveedor: Optional[int] = None,
    buscar: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    """buscar: coincidencia en número de factura. Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(Compra).order_by(Compra.fecha.desc())
    if estado is not None:
        query = query.filter(Compra.estado == estado)
    if id_proveedor is not None:
        query = query.filter(Compra.id_proveedor == id_proveedor)
    if buscar:
        query = query.filter(Compra.numero_factura.ilike(f"%{buscar}%"))
    if fecha_desde is not None:
        query = query.filter(func.date(Compra.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Compra.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/{compra_id}", response_model=CompraResponse)
def obtener_compra(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    return compra


@router.post("", response_model=CompraResponse, status_code=201)
def crear_compra(datos: CompraCreate, db: Session = Depends(get_db)):
    if not datos.detalles:
        raise HTTPException(status_code=400, detail="La compra debe incluir al menos un producto")

    for d in datos.detalles:
        if not db.query(Producto).filter(Producto.id == d.id_producto).first():
            raise HTTPException(status_code=404, detail=f"Producto id={d.id_producto} no encontrado")

    subtotal = sum(d.cantidad_comprada * d.costo_unitario for d in datos.detalles)
    total = round(subtotal + (datos.iva or 0), 2)

    nueva_compra = Compra(
        id_proveedor=datos.id_proveedor,
        id_ubicacion_destino=datos.id_ubicacion_destino,
        numero_factura=datos.numero_factura,
        id_usuario_registra=datos.id_usuario_registra,
        iva=datos.iva or 0,
        subtotal=round(subtotal, 2),
        total=total,
        saldo_pendiente=total,
        estado="Pendiente",
        fecha_vencimiento_pago=datos.fecha_vencimiento_pago,
        observaciones=datos.observaciones,
    )
    db.add(nueva_compra)
    db.flush()

    for d in datos.detalles:
        db.add(DetalleCompra(
            id_compra=nueva_compra.id,
            id_producto=d.id_producto,
            cantidad_comprada=d.cantidad_comprada,
            cantidad_unidades=d.cantidad_unidades,
            costo_unitario=d.costo_unitario,
            subtotal=round(d.cantidad_comprada * d.costo_unitario, 2),
        ))

    db.commit()
    db.refresh(nueva_compra)
    return nueva_compra


@router.post("/{compra_id}/nota-entrega", response_model=NotaEntregaResponse, status_code=201)
def registrar_nota_entrega(compra_id: int, datos: NotaEntregaCreate, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    nueva_nota = NotaEntrega(id_compra=compra_id, **datos.model_dump())
    db.add(nueva_nota)

    if datos.conforme == 1:
        tipo_compra = db.query(TipoMovimientoInventario).filter(
            TipoMovimientoInventario.nombre == "Compra"
        ).first()
        if not tipo_compra:
            raise HTTPException(
                status_code=400,
                detail="No existe el tipo de movimiento 'Compra' en tipos-movimiento. Créalo primero (nombre='Compra', signo=1).",
            )

        movimiento = MovimientoInventario(
            id_usuario=datos.id_usuario_receptor,
            id_tipo_movimiento=tipo_compra.id,
            id_ubicacion_destino=compra.id_ubicacion_destino,
            tabla_referencia="compra",
            id_referencia=compra.id,
            referencia=compra.numero_factura,
            observaciones=f"Recepción conforme de compra #{compra.id}",
        )
        db.add(movimiento)
        db.flush()

        for detalle in compra.detalles:
            db.add(MovimientoInventarioDetalle(
                id_movimiento_cabecera=movimiento.id,
                id_producto=detalle.id_producto,
                cantidad=detalle.cantidad_unidades,
                costo_unitario=detalle.costo_unitario,
            ))
            producto = db.query(Producto).filter(Producto.id == detalle.id_producto).first()
            producto.stock_actual = float(producto.stock_actual or 0) + float(detalle.cantidad_unidades)

        compra.estado = "Recibida"

    db.commit()
    db.refresh(nueva_nota)
    return nueva_nota


@router.post("/{compra_id}/pagos", response_model=CompraPagoResponse, status_code=201)
def registrar_pago_compra(compra_id: int, datos: CompraPagoCreate, db: Session = Depends(get_db)):
    """Registra un pago a proveedor y recalcula saldo_pendiente y el estado de la compra."""
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    nuevo_pago = CompraPago(id_compra=compra_id, **datos.model_dump())
    db.add(nuevo_pago)

    total_pagado = sum(float(p.monto) for p in compra.pagos) + float(datos.monto)
    compra.saldo_pendiente = round(float(compra.total or 0) - total_pagado, 2)

    if compra.saldo_pendiente <= 0:
        compra.estado = "Pagada"
    elif total_pagado > 0:
        compra.estado = "Parcial"

    db.commit()
    db.refresh(nuevo_pago)
    return nuevo_pago


# ===================================================================
# DEVOLUCION_COMPRA
# ===================================================================

@router_devolucion.get("", response_model=List[DevolucionCompraResponse])
def listar_devoluciones(id_proveedor: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(DevolucionCompra).order_by(DevolucionCompra.fecha.desc())
    if id_proveedor is not None:
        query = query.filter(DevolucionCompra.id_proveedor == id_proveedor)
    return query.all()


@router_devolucion.post("", response_model=DevolucionCompraResponse, status_code=201)
def registrar_devolucion(datos: DevolucionCompraCreate, db: Session = Depends(get_db)):
    nueva = DevolucionCompra(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva
