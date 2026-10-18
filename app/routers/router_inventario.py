from datetime import date, datetime
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.security import get_current_user, requiere_permiso
from app.bitacora import registrar_actividad
from app.models.model_producto import Producto
from app.models.model_usuario import Usuario
from app.models.model_inventario import (
    MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario,
    InventarioFisico, TrasladoSucursal, Alerta, InventarioUbicacion, TrasladoPago,
)
from app.models.model_ubicacion import Ubicacion
from app.stock import (
    mover_stock, stock_en, resolver_ubicacion, nombre_ubicacion, tipo_movimiento,
    ubicacion_principal_id,
)
from app.schemas.schema_inventario import (
    MovimientoInventarioCreate, MovimientoInventarioResponse,
    TipoMovimientoInventarioCreate, TipoMovimientoInventarioResponse,
    InventarioFisicoCreate, InventarioFisicoResponse,
    TrasladoSucursalCreate, TrasladoSucursalResponse,
    AlertaResponse, StockUbicacionResponse,
    TrasladoPagoCreate, TrasladoPagoResponse,
)

router = APIRouter()            # /movimientos-inventario
router_tipo = APIRouter()       # /tipo-movimiento
router_fisico = APIRouter()     # /inventario-fisico
router_traslado = APIRouter()   # /traslados
router_alerta = APIRouter()     # /alertas
router_stock = APIRouter()      # /stock-ubicaciones


def _generar_alerta_si_stock_bajo(db: Session, producto: Producto):
    """Si el stock quedó en o por debajo del mínimo, crea una alerta (evita duplicar si ya hay una sin leer)."""
    if producto.stock_minimo is None:
        return
    if float(producto.stock_actual) > float(producto.stock_minimo):
        return

    ya_existe = (
        db.query(Alerta)
        .filter(Alerta.id_producto == producto.id, Alerta.tipo == "stock_bajo", Alerta.leida == 0)
        .first()
    )
    if ya_existe:
        return

    alerta = Alerta(
        tipo="stock_bajo",
        mensaje=f"El producto '{producto.nombre}' llegó a su stock mínimo ({producto.stock_actual} unidades).",
        id_producto=producto.id,
        leida=0,
    )
    db.add(alerta)


def _calcular_nuevo_stock(stock_actual: float, cantidad: float, signo: int) -> float:
    """
    Calcula el nuevo stock según el signo del tipo de movimiento.

    Reglas:
    - signo = 1  → SUMA (entrada) - Ej: Compra, Devolución, Otros Ingresos
    - signo = 0  → NO cambia stock (neutral)
    - signo = 2  → RESTA (salida) - Ej: Venta, Otros Egresos
    """
    stock = float(stock_actual or 0)
    cant = float(cantidad or 0)

    if signo == 1:
        # Entrada: suma
        return stock + cant
    elif signo == 2:
        # Salida: resta
        if stock < cant:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente. Disponible: {stock}, Requerido: {cant}"
            )
        return stock - cant
    else:
        # signo == 0 o cualquier otro: no cambia
        return stock


# ===================================================================
# MOVIMIENTO_INVENTARIO (+ detalle)
# ===================================================================

@router.get("", response_model=List[MovimientoInventarioResponse])
def listar_movimientos(
    id_producto: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(MovimientoInventario).order_by(MovimientoInventario.fecha.desc(), MovimientoInventario.id.desc())
    if id_producto is not None:
        query = query.join(MovimientoInventarioDetalle).filter(
            MovimientoInventarioDetalle.id_producto == id_producto
        )
    if fecha_desde is not None:
        query = query.filter(func.date(MovimientoInventario.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(MovimientoInventario.fecha) <= fecha_hasta)

    # ✅ IMPORTANTE: Obtener los movimientos con sus detalles
    movimientos = query.offset(paginacion.skip).limit(paginacion.limit).all()

    # ✅ Forzar la carga de detalles para cada movimiento
    for m in movimientos:
        # Esto asegura que los detalles se carguen antes de serializar
        _ = m.detalles

    return movimientos


@router.get("/{movimiento_id}", response_model=MovimientoInventarioResponse)
def obtener_movimiento(movimiento_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    movimiento = db.query(MovimientoInventario).filter(MovimientoInventario.id == movimiento_id).first()
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movimiento


@router.post("", response_model=MovimientoInventarioResponse, status_code=201)
def crear_movimiento(datos: MovimientoInventarioCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Crear"))):
    """
    Crea un movimiento con sus detalles, y ACTUALIZA el stock_actual de
    cada producto involucrado según el signo del tipo de movimiento.

    Reglas de signo (campo 'signo' en tabla 'tipo'):
    - signo = 1  → SUMA (entrada) - Ej: Compra, Devolución, Otros Ingresos
    - signo = 0  → NO cambia stock (neutral)
    - signo = 2  → RESTA (salida) - Ej: Venta, Otros Egresos
    """
    # ✅ Usar el modelo correcto: TipoMovimientoInventario
    tipo = db.query(TipoMovimientoInventario).filter(
        TipoMovimientoInventario.id == datos.id_tipo_movimiento
    ).first()
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de movimiento no encontrado")

    if not datos.detalles:
        raise HTTPException(status_code=400, detail="El movimiento debe incluir al menos un producto")

    # Verificar que todos los productos existan ANTES de mover nada
    productos = {}
    for d in datos.detalles:
        producto = db.query(Producto).filter(Producto.id == d.id_producto).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Uno de los productos ya no existe en el sistema. Quítalo de la lista e intenta de nuevo.")
        productos[d.id_producto] = producto

    # Ubicación donde entra o de donde sale el stock (la principal si no
    # se indica). La verificación de stock suficiente la hace mover_stock
    # contra el stock de ESA ubicación.
    id_ubicacion = resolver_ubicacion(
        db, datos.id_ubicacion or datos.id_ubicacion_origen or datos.id_ubicacion_destino
    )

    nuevo_movimiento = MovimientoInventario(
        id_usuario=usuario_actual.id,
        id_tipo_movimiento=datos.id_tipo_movimiento,
        id_ubicacion_origen=id_ubicacion if tipo.signo == 2 else datos.id_ubicacion_origen,
        id_sububicacion_origen=datos.id_sububicacion_origen,
        id_ubicacion_destino=id_ubicacion if tipo.signo == 1 else datos.id_ubicacion_destino,
        id_sububicacion_destino=datos.id_sububicacion_destino,
        tabla_referencia=datos.tabla_referencia,
        id_referencia=datos.id_referencia,
        referencia=datos.referencia,
        observaciones=datos.observaciones,
    )
    db.add(nuevo_movimiento)
    db.flush()

    for d in datos.detalles:
        if float(d.cantidad or 0) <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
        detalle = MovimientoInventarioDetalle(
            id_movimiento_cabecera=nuevo_movimiento.id,
            id_producto=d.id_producto,
            cantidad=d.cantidad,
            costo_unitario=d.costo_unitario,
            precio_unitario=d.precio_unitario,
        )
        db.add(detalle)

        producto = productos[d.id_producto]
        if tipo.signo == 1:
            mover_stock(db, producto, id_ubicacion, float(d.cantidad))
        elif tipo.signo == 2:
            mover_stock(db, producto, id_ubicacion, -float(d.cantidad))
        # signo 0 (neutral): no cambia stock

        _generar_alerta_si_stock_bajo(db, producto)

    registrar_actividad(
        db, usuario_actual.id, "CREAR", "MovimientoInventario",
        detalle=f"Registró movimiento #{nuevo_movimiento.id} de tipo '{tipo.nombre}'",
    )
    db.commit()
    db.refresh(nuevo_movimiento)
    return nuevo_movimiento


# ===================================================================
# TIPO_MOVIMIENTO_INVENTARIO (catálogo simple)
# ===================================================================

@router_tipo.get("", response_model=List[TipoMovimientoInventarioResponse])
def listar_tipos_movimiento(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    return db.query(TipoMovimientoInventario).all()


@router_tipo.post("", response_model=TipoMovimientoInventarioResponse, status_code=201)
def crear_tipo_movimiento(datos: TipoMovimientoInventarioCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Crear"))):
    nuevo = TipoMovimientoInventario(**datos.model_dump())
    db.add(nuevo)
    db.flush()
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "TipoMovimientoInventario",
        detalle=f"Creó el tipo de movimiento '{nuevo.nombre}'",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# INVENTARIO_FISICO (conteos)
# ===================================================================

@router_fisico.get("", response_model=List[InventarioFisicoResponse])
def listar_conteos(
    id_producto: Optional[int] = None,
    id_ubicacion: Optional[int] = None,
    ajustado: Optional[int] = None,
    buscar: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """
    Filtra por producto (buscar: nombre o código), ubicación, ajuste
    (ajustado=1 aplicado, 0 pendiente) y fechas. Paginado: ?skip=0&limit=50.
    """
    query = db.query(InventarioFisico).order_by(InventarioFisico.fecha.desc(), InventarioFisico.id.desc())
    if id_producto is not None:
        query = query.filter(InventarioFisico.id_producto == id_producto)
    if id_ubicacion is not None:
        query = query.filter(InventarioFisico.id_ubicacion == id_ubicacion)
    if ajustado is not None:
        query = query.filter(func.coalesce(InventarioFisico.ajustado, 0) == ajustado)
    if buscar:
        patron = f"%{buscar.strip()}%"
        ids = db.query(Producto.id).filter(or_(Producto.nombre.ilike(patron), Producto.codigo.ilike(patron)))
        query = query.filter(InventarioFisico.id_producto.in_(ids))
    if fecha_desde is not None:
        query = query.filter(func.date(InventarioFisico.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(InventarioFisico.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_fisico.post("", response_model=InventarioFisicoResponse, status_code=201)
def registrar_conteo(datos: InventarioFisicoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Crear"))):
    """
    Registra un conteo físico, comparando contra el stock_sistema actual.
    NO ajusta el stock todavía -- eso se hace aparte con /aplicar-ajuste,
    para que alguien pueda revisar la diferencia antes de aplicarla.
    """
    producto = db.query(Producto).filter(Producto.id == datos.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if float(datos.stock_real) < 0:
        raise HTTPException(status_code=400, detail="La cantidad contada no puede ser negativa")

    # Se compara contra el stock de la UBICACIÓN contada (antes se comparaba
    # contra el total de todas las ubicaciones).
    id_ubicacion = resolver_ubicacion(db, datos.id_ubicacion)
    stock_sistema = stock_en(db, producto, id_ubicacion)
    diferencia = round(float(datos.stock_real) - stock_sistema, 2)

    valores = datos.model_dump()
    valores["id_ubicacion"] = id_ubicacion
    valores["id_usuario"] = usuario_actual.id
    nuevo = InventarioFisico(
        **valores,
        stock_sistema=stock_sistema,
        diferencia=diferencia,
        ajustado=0,
    )
    db.add(nuevo)
    db.flush()
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "InventarioFisico",
        detalle=f"Registró conteo físico de '{producto.nombre}': sistema={stock_sistema}, real={datos.stock_real}, diferencia={diferencia}",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_fisico.patch("/{conteo_id}/aplicar-ajuste", response_model=InventarioFisicoResponse)
def aplicar_ajuste(conteo_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Editar"))):
    """
    Aplica la DIFERENCIA encontrada en el conteo al stock de esa ubicación,
    y deja un movimiento "Ajuste por conteo" en el historial.

    Antes se copiaba el número contado tal cual: si entre el conteo y el
    ajuste se vendía algo, el ajuste "devolvía" esas unidades vendidas.
    Ejemplo: se contaron 8 con 10 en sistema (diferencia -2); luego se
    vendieron 3 (quedan 7); al aplicar quedan 5, no 8.
    """
    conteo = db.query(InventarioFisico).filter(InventarioFisico.id == conteo_id).first()
    if not conteo:
        raise HTTPException(status_code=404, detail="Conteo no encontrado")
    if conteo.ajustado == 1:
        raise HTTPException(status_code=400, detail="Este conteo ya fue aplicado antes")

    producto = db.query(Producto).filter(Producto.id == conteo.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    id_ubicacion = resolver_ubicacion(db, conteo.id_ubicacion)
    diferencia = float(conteo.diferencia or 0)

    if abs(diferencia) > 0.0001:
        try:
            mover_stock(db, producto, id_ubicacion, diferencia)
        except HTTPException:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No se puede aplicar: desde el conteo el stock de '{producto.nombre}' en "
                    f"{nombre_ubicacion(db, id_ubicacion)} bajó y quedaría en negativo. "
                    "Haz un conteo nuevo."
                ),
            )
        tipo = (
            tipo_movimiento(db, "Ajuste por conteo (entrada)", 1)
            if diferencia > 0
            else tipo_movimiento(db, "Ajuste por conteo (salida)", 2)
        )
        movimiento = MovimientoInventario(
            id_usuario=usuario_actual.id,
            id_tipo_movimiento=tipo.id,
            id_ubicacion_destino=id_ubicacion if diferencia > 0 else None,
            id_ubicacion_origen=id_ubicacion if diferencia < 0 else None,
            tabla_referencia="conteo",
            id_referencia=conteo.id,
            observaciones=f"Ajuste por conteo físico #{conteo.id}",
        )
        db.add(movimiento)
        db.flush()
        db.add(MovimientoInventarioDetalle(
            id_movimiento_cabecera=movimiento.id,
            id_producto=producto.id,
            cantidad=abs(diferencia),
            costo_unitario=producto.precio_compra,
        ))

    conteo.ajustado = 1
    _generar_alerta_si_stock_bajo(db, producto)

    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "InventarioFisico",
        detalle=(
            f"Aplicó el ajuste del conteo #{conteo.id} de '{producto.nombre}' en "
            f"{nombre_ubicacion(db, id_ubicacion)} (diferencia {diferencia:+g})"
        ),
    )
    db.commit()
    db.refresh(conteo)
    return conteo


# ===================================================================
# TRASLADO_SUCURSAL
# ===================================================================

@router_traslado.get("", response_model=List[TrasladoSucursalResponse])
def listar_traslados(
    estado: Optional[Literal["EnProceso", "Recibido", "Completado", "Cancelado"]] = None,
    estado_pago: Optional[Literal["Pendiente", "Parcial", "Pagado", "No aplica", "Con saldo"]] = None,
    numero_nota: Optional[str] = None,
    buscar: Optional[str] = None,
    id_producto: Optional[int] = None,
    id_ubicacion: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """
    Filtra por estado, estado de pago ("Con saldo" = Pendiente o Parcial),
    número de nota de envío, texto (nota, producto o código), ubicación
    (origen o destino) y fechas. Paginado: ?skip=0&limit=50.
    """
    query = db.query(TrasladoSucursal).order_by(TrasladoSucursal.fecha.desc(), TrasladoSucursal.id.desc())
    if estado is not None:
        query = query.filter(TrasladoSucursal.estado == estado)
    if estado_pago == "Con saldo":
        query = query.filter(TrasladoSucursal.estado_pago.in_(["Pendiente", "Parcial"]))
    elif estado_pago is not None:
        query = query.filter(TrasladoSucursal.estado_pago == estado_pago)
    if numero_nota:
        query = query.filter(TrasladoSucursal.numero_nota_envio.ilike(f"%{numero_nota.strip()}%"))
    if id_producto is not None:
        query = query.filter(TrasladoSucursal.id_producto == id_producto)
    if id_ubicacion is not None:
        query = query.filter(or_(
            TrasladoSucursal.id_ubicacion_origen == id_ubicacion,
            TrasladoSucursal.id_ubicacion_destino == id_ubicacion,
        ))
    if buscar:
        patron = f"%{buscar.strip()}%"
        ids = db.query(Producto.id).filter(or_(Producto.nombre.ilike(patron), Producto.codigo.ilike(patron)))
        query = query.filter(or_(
            TrasladoSucursal.numero_nota_envio.ilike(patron),
            TrasladoSucursal.id_producto.in_(ids),
        ))
    if fecha_desde is not None:
        query = query.filter(func.date(TrasladoSucursal.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(TrasladoSucursal.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_traslado.post("", response_model=TrasladoSucursalResponse, status_code=201)
def crear_traslado(datos: TrasladoSucursalCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Crear"))):
    """
    Registra el envío de producto de una ubicación a otra (ej. Bodega ->
    Área de ventas). Queda "EnProceso" hasta que se confirma la recepción;
    en ese momento se resta del origen y se suma al destino, así que el
    total de la librería nunca cambia.
    """
    producto = db.query(Producto).filter(Producto.id == datos.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if float(datos.cantidad or 0) <= 0:
        raise HTTPException(status_code=400, detail="La cantidad a trasladar debe ser mayor a 0")
    if datos.id_ubicacion_origen == datos.id_ubicacion_destino:
        raise HTTPException(status_code=400, detail="El origen y el destino deben ser ubicaciones distintas")
    for id_u in (datos.id_ubicacion_origen, datos.id_ubicacion_destino):
        if not db.query(Ubicacion).filter(Ubicacion.id == id_u).first():
            raise HTTPException(status_code=404, detail="Una de las ubicaciones no existe")

    disponible = stock_en(db, producto, datos.id_ubicacion_origen)
    if disponible < float(datos.cantidad):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Stock insuficiente de '{producto.nombre}' en "
                f"{nombre_ubicacion(db, datos.id_ubicacion_origen)} "
                f"(disponible: {disponible:g}, a trasladar: {float(datos.cantidad):g})"
            ),
        )

    valores = datos.model_dump()
    cobrar = valores.pop("cobrar", True)
    valores["id_usuario_autoriza"] = usuario_actual.id
    # Siempre a precio de costo (el de compra del producto si no se indica)
    if valores.get("costo_unitario") is None:
        valores["costo_unitario"] = float(producto.precio_compra or 0)
    monto_total = round(float(datos.cantidad) * float(valores["costo_unitario"] or 0), 2)
    nuevo = TrasladoSucursal(
        **valores,
        estado="EnProceso",
        monto_total=monto_total,
        monto_pagado=0,
        estado_pago="Pendiente" if cobrar and monto_total > 0 else "No aplica",
    )
    db.add(nuevo)
    db.flush()
    # Número de nota de envío correlativo (NE-000001, NE-000002...)
    nuevo.numero_nota_envio = f"NE-{nuevo.id:06d}"
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "TrasladoSucursal",
        detalle=(
            f"Registró el traslado #{nuevo.id} de {float(datos.cantidad):g} '{producto.nombre}' de "
            f"{nombre_ubicacion(db, datos.id_ubicacion_origen)} a {nombre_ubicacion(db, datos.id_ubicacion_destino)}"
        ),
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_traslado.patch("/{traslado_id}/confirmar-recepcion", response_model=TrasladoSucursalResponse)
def confirmar_recepcion(traslado_id: int, id_usuario_recibe: Optional[int] = None, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Editar"))):
    """
    El destino confirma que le llegó el producto: se resta del origen, se
    suma al destino (el total no cambia) y queda un movimiento "Traslado"
    en el historial.
    """
    traslado = db.query(TrasladoSucursal).filter(TrasladoSucursal.id == traslado_id).first()
    if not traslado:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")
    if traslado.estado == "Completado":
        raise HTTPException(status_code=400, detail="Este traslado ya fue recibido")
    if traslado.estado == "Cancelado":
        raise HTTPException(status_code=400, detail="Este traslado fue cancelado")

    producto = db.query(Producto).filter(Producto.id == traslado.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    cantidad = float(traslado.cantidad or 0)

    mover_stock(db, producto, traslado.id_ubicacion_origen, -cantidad)
    mover_stock(db, producto, traslado.id_ubicacion_destino, cantidad)

    tipo = tipo_movimiento(db, "Traslado", 0)
    movimiento = MovimientoInventario(
        id_usuario=usuario_actual.id,
        id_tipo_movimiento=tipo.id,
        id_ubicacion_origen=traslado.id_ubicacion_origen,
        id_ubicacion_destino=traslado.id_ubicacion_destino,
        tabla_referencia="traslado",
        id_referencia=traslado.id,
        observaciones=(
            f"Traslado #{traslado.id}: {nombre_ubicacion(db, traslado.id_ubicacion_origen)} -> "
            f"{nombre_ubicacion(db, traslado.id_ubicacion_destino)}"
        ),
    )
    db.add(movimiento)
    db.flush()
    db.add(MovimientoInventarioDetalle(
        id_movimiento_cabecera=movimiento.id,
        id_producto=producto.id,
        cantidad=cantidad,
        costo_unitario=traslado.costo_unitario,
    ))

    traslado.estado = "Completado"
    traslado.id_usuario_recibe = usuario_actual.id
    traslado.fecha_recepcion = func.now()

    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "TrasladoSucursal",
        detalle=f"Confirmó la recepción del traslado #{traslado.id} ({cantidad:g} '{producto.nombre}')",
    )
    db.commit()
    db.refresh(traslado)
    return traslado


@router_traslado.patch("/{traslado_id}/cancelar", response_model=TrasladoSucursalResponse)
def cancelar_traslado(traslado_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Editar"))):
    """Cancela un traslado que todavía no se recibió (no mueve stock)."""
    traslado = db.query(TrasladoSucursal).filter(TrasladoSucursal.id == traslado_id).first()
    if not traslado:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")
    if traslado.estado != "EnProceso":
        raise HTTPException(status_code=400, detail="Solo se puede cancelar un traslado que no se ha recibido")
    if any(not p.anulado for p in traslado.pagos):
        raise HTTPException(
            status_code=400,
            detail="Este traslado tiene pagos registrados. Anula los pagos antes de cancelarlo.",
        )
    traslado.estado = "Cancelado"
    traslado.estado_pago = "No aplica"
    registrar_actividad(db, usuario_actual.id, "CANCELAR", "TrasladoSucursal", detalle=f"Canceló el traslado #{traslado.id}")
    db.commit()
    db.refresh(traslado)
    return traslado


def _buscar_por_nota(db: Session, numero_nota: str) -> TrasladoSucursal:
    limpio = (numero_nota or "").strip().upper()
    if limpio.isdigit():  # permite escribir solo el número: 15 -> NE-000015
        limpio = f"NE-{int(limpio):06d}"
    traslado = (
        db.query(TrasladoSucursal)
        .filter(func.upper(TrasladoSucursal.numero_nota_envio) == limpio)
        .first()
    )
    if not traslado:
        raise HTTPException(status_code=404, detail=f"No existe ningún traslado con la nota de envío {numero_nota}")
    return traslado


@router_traslado.get("/nota/{numero_nota}", response_model=TrasladoSucursalResponse)
def obtener_por_nota(numero_nota: str, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Busca un traslado por su número de nota de envío (ej. NE-000015 o solo 15)."""
    return _buscar_por_nota(db, numero_nota)


@router_traslado.patch("/nota/{numero_nota}/recibir", response_model=TrasladoSucursalResponse)
def recibir_por_nota(numero_nota: str, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Editar"))):
    """La sucursal destino recibe el traslado escribiendo/escaneando el número de la nota de envío."""
    traslado = _buscar_por_nota(db, numero_nota)
    return confirmar_recepcion(traslado.id, None, db, usuario_actual)


def _recalcular_pago_traslado(traslado: TrasladoSucursal):
    pagado = round(sum(float(p.monto or 0) for p in traslado.pagos if not p.anulado), 2)
    total = round(float(traslado.monto_total or 0), 2)
    traslado.monto_pagado = pagado
    if traslado.estado_pago == "No aplica" and pagado == 0:
        return
    if pagado <= 0:
        traslado.estado_pago = "Pendiente"
    elif pagado + 0.009 < total:
        traslado.estado_pago = "Parcial"
    else:
        traslado.estado_pago = "Pagado"


@router_traslado.get("/{traslado_id}/pagos", response_model=List[TrasladoPagoResponse])
def listar_pagos_traslado(traslado_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    traslado = db.query(TrasladoSucursal).filter(TrasladoSucursal.id == traslado_id).first()
    if not traslado:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")
    return traslado.pagos


@router_traslado.post("/{traslado_id}/pagos", response_model=TrasladoPagoResponse, status_code=201)
def registrar_pago_traslado(traslado_id: int, datos: TrasladoPagoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Editar"))):
    """La sucursal destino paga (total o parcial) el traslado, a precio de costo."""
    traslado = db.query(TrasladoSucursal).filter(TrasladoSucursal.id == traslado_id).first()
    if not traslado:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")
    if traslado.estado == "Cancelado":
        raise HTTPException(status_code=400, detail="No se pueden registrar pagos a un traslado cancelado")
    if traslado.estado_pago == "No aplica":
        raise HTTPException(status_code=400, detail="Este traslado no se cobra (se registró sin cobro a la sucursal)")
    monto = round(float(datos.monto or 0), 2)
    if monto <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a 0")
    saldo = round(float(traslado.monto_total or 0) - float(traslado.monto_pagado or 0), 2)
    if saldo <= 0:
        raise HTTPException(status_code=400, detail="Este traslado ya está pagado")
    if monto > saldo + 0.009:
        raise HTTPException(status_code=400, detail=f"El pago (Q{monto:.2f}) es mayor que el saldo pendiente (Q{saldo:.2f})")

    pago = TrasladoPago(
        id_traslado=traslado.id,
        id_tipo_pago=datos.id_tipo_pago,
        monto=monto,
        referencia=datos.referencia,
        observaciones=datos.observaciones,
        id_usuario=usuario_actual.id,
        anulado=0,
    )
    db.add(pago)
    db.flush()
    db.refresh(traslado)
    _recalcular_pago_traslado(traslado)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "TrasladoPago",
        detalle=f"Registró pago de Q{monto:.2f} del traslado {traslado.numero_nota_envio} (saldo antes: Q{saldo:.2f})",
    )
    db.commit()
    db.refresh(pago)
    return pago


@router_traslado.delete("/{traslado_id}/pagos/{pago_id}", response_model=TrasladoPagoResponse)
def anular_pago_traslado(traslado_id: int, pago_id: int, motivo: Optional[str] = None, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Editar"))):
    """Anula un pago (no se borra: queda como constancia y deja de contar para el saldo)."""
    pago = db.query(TrasladoPago).filter(TrasladoPago.id == pago_id, TrasladoPago.id_traslado == traslado_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    if pago.anulado:
        raise HTTPException(status_code=400, detail="Este pago ya está anulado")
    pago.anulado = 1
    pago.motivo_anulacion = (motivo or "").strip() or None
    traslado = pago.traslado
    db.flush()
    db.refresh(traslado)
    _recalcular_pago_traslado(traslado)
    registrar_actividad(
        db, usuario_actual.id, "ANULAR", "TrasladoPago",
        detalle=f"Anuló pago de Q{float(pago.monto):.2f} del traslado {traslado.numero_nota_envio}" + (f" (motivo: {pago.motivo_anulacion})" if pago.motivo_anulacion else ""),
    )
    db.commit()
    db.refresh(pago)
    return pago


# ===================================================================
# STOCK POR UBICACIÓN (solo lectura)
# ===================================================================

@router_stock.get("", response_model=List[StockUbicacionResponse])
def listar_stock_ubicaciones(
    id_producto: Optional[int] = None,
    id_ubicacion: Optional[int] = None,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """
    Stock de cada producto en cada ubicación. Los productos con stock de
    antes del stock por ubicación (sin filas) se muestran en la ubicación
    principal.
    """
    query = db.query(InventarioUbicacion)
    if id_producto is not None:
        query = query.filter(InventarioUbicacion.id_producto == id_producto)
    if id_ubicacion is not None:
        query = query.filter(InventarioUbicacion.id_ubicacion == id_ubicacion)
    filas = [
        StockUbicacionResponse(id_producto=f.id_producto, id_ubicacion=f.id_ubicacion, cantidad=float(f.cantidad or 0))
        for f in query.all()
    ]

    principal = ubicacion_principal_id(db)
    if principal and (id_ubicacion is None or id_ubicacion == principal):
        con_filas = db.query(InventarioUbicacion.id_producto).distinct()
        sin_filas = db.query(Producto).filter(
            Producto.stock_actual != 0, Producto.id.notin_(con_filas)
        )
        if id_producto is not None:
            sin_filas = sin_filas.filter(Producto.id == id_producto)
        for p in sin_filas.all():
            filas.append(StockUbicacionResponse(id_producto=p.id, id_ubicacion=principal, cantidad=float(p.stock_actual or 0)))
    return filas


# ===================================================================
# ALERTA (solo lectura + marcar como leída; el sistema las crea sola)
# ===================================================================

@router_alerta.get("", response_model=List[AlertaResponse])
def listar_alertas(
    solo_no_leidas: bool = True,
    estado: Optional[Literal["pendientes", "cerradas", "todas"]] = None,
    buscar: Optional[str] = None,
    id_usuario_destino: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """
    estado: pendientes (sin cerrar), cerradas o todas; si no se manda se usa
    solo_no_leidas. buscar: mensaje, producto o código. Paginado: ?skip=0&limit=50.
    """
    query = db.query(Alerta).order_by(Alerta.fecha.desc(), Alerta.id.desc())
    if estado == "pendientes" or (estado is None and solo_no_leidas):
        query = query.filter(func.coalesce(Alerta.leida, 0) == 0)
    elif estado == "cerradas":
        query = query.filter(Alerta.leida == 1)
    if buscar:
        patron = f"%{buscar.strip()}%"
        ids = db.query(Producto.id).filter(or_(Producto.nombre.ilike(patron), Producto.codigo.ilike(patron)))
        query = query.filter(or_(Alerta.mensaje.ilike(patron), Alerta.id_producto.in_(ids)))
    if id_usuario_destino is not None:
        query = query.filter(Alerta.id_usuario_destino == id_usuario_destino)
    if fecha_desde is not None:
        query = query.filter(func.date(Alerta.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Alerta.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_alerta.patch("/{alerta_id}/marcar-leida", response_model=AlertaResponse)
def marcar_leida(alerta_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Inventario", "Editar"))):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alerta.leida = 1
    alerta.fecha_lectura = datetime.now()
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Alerta",
        detalle=f"Marcó como leída la alerta #{alerta.id}: {alerta.mensaje}",
    )
    db.commit()
    db.refresh(alerta)
    return alerta