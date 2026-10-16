from datetime import date, datetime
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.security import get_current_user, requiere_permiso
from app.bitacora import registrar_actividad
from app.models.model_producto import Producto
from app.models.model_usuario import Usuario
from app.models.model_inventario import (
    MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario,
    InventarioFisico, TrasladoSucursal, Alerta, InventarioUbicacion,
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
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(InventarioFisico).order_by(InventarioFisico.fecha.desc())
    if id_producto is not None:
        query = query.filter(InventarioFisico.id_producto == id_producto)
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
    id_producto: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(TrasladoSucursal).order_by(TrasladoSucursal.fecha.desc())
    if estado is not None:
        query = query.filter(TrasladoSucursal.estado == estado)
    if id_producto is not None:
        query = query.filter(TrasladoSucursal.id_producto == id_producto)
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
    valores["id_usuario_autoriza"] = usuario_actual.id
    if valores.get("costo_unitario") is None:
        valores["costo_unitario"] = producto.precio_compra
    nuevo = TrasladoSucursal(**valores, estado="EnProceso")
    db.add(nuevo)
    db.flush()
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
    traslado.estado = "Cancelado"
    registrar_actividad(db, usuario_actual.id, "CANCELAR", "TrasladoSucursal", detalle=f"Canceló el traslado #{traslado.id}")
    db.commit()
    db.refresh(traslado)
    return traslado


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
    id_usuario_destino: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(Alerta).order_by(Alerta.fecha.desc())
    if solo_no_leidas:
        query = query.filter(Alerta.leida == 0)
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