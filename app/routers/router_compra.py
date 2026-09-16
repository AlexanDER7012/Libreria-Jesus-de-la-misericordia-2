from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.pagination import PaginationParams
from app.security import get_current_user
from app.bitacora import registrar_actividad
from app.models.model_producto import Producto
from app.models.model_usuario import Usuario
from app.models.model_proveedor import Pedido
from app.models.model_compra import Compra, DetalleCompra, CompraPago, NotaEntrega, DevolucionCompra
from app.models.model_inventario import MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario
from app.schemas.schema_compra import (
    CompraCreate, CompraResponse,
    NotaEntregaCreate, NotaEntregaResponse,
    CompraPagoCreate, CompraPagoResponse,
    DevolucionCompraCreate, DevolucionCompraResponse,
)

router = APIRouter()             
router_devolucion = APIRouter()  


@router.get("/resumen-totales")
def resumen_totales_compras(
    estado: Optional[str] = None,
    id_proveedor: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """
    Suma el total en compras, lo ya pagado, y el saldo pendiente -- sobre
    TODAS las compras que cumplan el filtro (sin paginar, a diferencia de
    GET /compras que sí pagina). Pensado para la tarjeta de totales en la
    pestaña de Compras.
    IMPORTANTE: esta ruta debe declararse ANTES de '/{compra_id}' -- si no,
    FastAPI intentaría interpretar 'resumen-totales' como si fuera un compra_id.
    """
    query = db.query(Compra)
    if estado is not None:
        query = query.filter(Compra.estado == estado)
    if id_proveedor is not None:
        query = query.filter(Compra.id_proveedor == id_proveedor)
    if fecha_desde is not None:
        query = query.filter(func.date(Compra.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Compra.fecha) <= fecha_hasta)

    compras = query.all()
    total_comprado = round(sum(float(c.total or 0) for c in compras), 2)
    total_pendiente = round(sum(float(c.saldo_pendiente or 0) for c in compras), 2)
    total_pagado = round(total_comprado - total_pendiente, 2)

    return {
        "cantidad_compras": len(compras),
        "total_comprado": total_comprado,
        "total_pagado": total_pagado,
        "total_pendiente": total_pendiente,
    }


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
def crear_compra(datos: CompraCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    if not datos.detalles:
        raise HTTPException(status_code=400, detail="La compra debe incluir al menos un producto")

    for d in datos.detalles:
        if not db.query(Producto).filter(Producto.id == d.id_producto).first():
            raise HTTPException(status_code=404, detail=f"Producto id={d.id_producto} no encontrado")

    pedido = None
    if datos.id_pedido:
        pedido = db.query(Pedido).filter(Pedido.id == datos.id_pedido).first()
        if not pedido:
            raise HTTPException(status_code=404, detail=f"Pedido id={datos.id_pedido} no encontrado")
        if pedido.estado == "Cancelado":
            raise HTTPException(status_code=400, detail="No se puede crear compra desde un pedido cancelado")
        compra_existente = db.query(Compra).filter(Compra.id_pedido == datos.id_pedido).first()
        if compra_existente:
            raise HTTPException(
                status_code=400,
                detail=f"El pedido #{datos.id_pedido} ya tiene una compra asociada (#{compra_existente.id})",
            )

    # ============================================================
    # CÁLCULO DE TOTALES (IVA INCLUIDO EN GUATEMALA)
    # ============================================================
    # El total de la factura = suma de cantidad * costo (ya trae IVA incluido)
    total_factura = round(
        sum(d.cantidad_comprada * d.costo_unitario for d in datos.detalles), 2
    )

    # El usuario ingresa cuánto de ese total es exento
    exento = float(datos.monto_exento or 0)
    if exento < 0:
        exento = 0
    if exento > total_factura:
        exento = total_factura

    # Gravado = total - exento
    gravado = round(total_factura - exento, 2)

    # El IVA se EXTRAE del gravado (no se suma)
    iva_porcentaje = float(datos.iva or 12)
    if iva_porcentaje <= 0:
        monto_iva = 0
    else:
        monto_iva = round(gravado * (iva_porcentaje / (100 + iva_porcentaje)), 2)

    # Subtotal sin IVA
    subtotal_sin_iva = round(total_factura - monto_iva, 2)

    nueva_compra = Compra(
        id_proveedor=datos.id_proveedor,
        id_ubicacion_destino=datos.id_ubicacion_destino,
        id_pedido=datos.id_pedido,
        numero_factura=datos.numero_factura,
        id_usuario_registra=datos.id_usuario_registra,
        iva=monto_iva,
        subtotal=subtotal_sin_iva,
        total=total_factura,
        saldo_pendiente=total_factura,
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

    if pedido and pedido.estado != "Comprado":
        pedido.estado = "Comprado"

    registrar_actividad(db, usuario_actual.id, "CREAR", "Compra")
    db.commit()
    db.refresh(nueva_compra)
    return nueva_compra


@router.patch("/{compra_id}/cancelar", response_model=CompraResponse)
def cancelar_compra(compra_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Cancela una compra: revierte inventario (si aplica), borra pagos, saldo=0, estado='Cancelada'."""
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    if compra.estado == "Cancelada":
        raise HTTPException(status_code=400, detail="Esta compra ya está cancelada")

    tipo_ajuste = db.query(TipoMovimientoInventario).filter(
        TipoMovimientoInventario.nombre == "Ajuste"
    ).first()
    if not tipo_ajuste:
        tipo_ajuste = db.query(TipoMovimientoInventario).filter(
            TipoMovimientoInventario.nombre == "Compra"
        ).first()

    if tipo_ajuste and compra.detalles:
        movimiento = MovimientoInventario(
            id_usuario=usuario_actual.id,
            id_tipo_movimiento=tipo_ajuste.id,
            id_ubicacion_destino=compra.id_ubicacion_destino,
            tabla_referencia="compra",
            id_referencia=compra.id,
            referencia=f"Reversión por cancelación de compra #{compra.id}",
            observaciones=f"Cancelación de compra #{compra.id}",
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
            if producto:
                producto.stock_actual = float(producto.stock_actual or 0) - float(detalle.cantidad_unidades)

    db.query(CompraPago).filter(CompraPago.id_compra == compra.id).delete()

    compra.estado = "Cancelada"
    compra.saldo_pendiente = 0

    registrar_actividad(db, usuario_actual.id, "EDITAR", "Compra")
    db.commit()
    db.refresh(compra)
    return compra


@router.delete("/{compra_id}/pagos/{pago_id}", status_code=204)
def eliminar_pago_compra(compra_id: int, pago_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Elimina un pago y recalcula el saldo y estado de la compra."""
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    pago = db.query(CompraPago).filter(
        CompraPago.id == pago_id, CompraPago.id_compra == compra_id
    ).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado en esta compra")

    db.delete(pago)
    db.flush()

    total_pagado = sum(float(p.monto) for p in compra.pagos)
    compra.saldo_pendiente = round(float(compra.total or 0) - total_pagado, 2)

    if compra.saldo_pendiente <= 0:
        compra.estado = "Pagada"
    elif total_pagado > 0:
        compra.estado = "Parcial"
    else:
        compra.estado = "Pendiente"

    registrar_actividad(db, usuario_actual.id, "ELIMINAR", "CompraPago")
    db.commit()


@router.post("/{compra_id}/nota-entrega", response_model=NotaEntregaResponse, status_code=201)
def registrar_nota_entrega(compra_id: int, datos: NotaEntregaCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
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

    registrar_actividad(db, usuario_actual.id, "EDITAR", "Compra")
    db.commit()
    db.refresh(nueva_nota)
    return nueva_nota


@router.post("/{compra_id}/pagos", response_model=CompraPagoResponse, status_code=201)
def registrar_pago_compra(compra_id: int, datos: CompraPagoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
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

    registrar_actividad(db, usuario_actual.id, "EDITAR", "Compra")
    db.commit()
    db.refresh(nuevo_pago)
    return nuevo_pago


# ===================================================================
# DEVOLUCION_COMPRA
# ===================================================================

@router_devolucion.get("", response_model=List[DevolucionCompraResponse])
def listar_devoluciones(
    id_proveedor: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    """Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(DevolucionCompra).order_by(DevolucionCompra.fecha.desc())
    if id_proveedor is not None:
        query = query.filter(DevolucionCompra.id_proveedor == id_proveedor)
    if fecha_desde is not None:
        query = query.filter(func.date(DevolucionCompra.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(DevolucionCompra.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_devolucion.post("", response_model=DevolucionCompraResponse, status_code=201)
def registrar_devolucion(datos: DevolucionCompraCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    nueva = DevolucionCompra(**datos.model_dump())
    db.add(nueva)
    registrar_actividad(db, usuario_actual.id, "CREAR", "DevolucionCompra")
    db.commit()
    db.refresh(nueva)
    return nueva