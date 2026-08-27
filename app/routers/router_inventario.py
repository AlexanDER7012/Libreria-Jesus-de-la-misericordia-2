from datetime import date, datetime
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.models.model_producto import Producto
from app.models.model_inventario import (
    MovimientoInventario, MovimientoInventarioDetalle, TipoMovimientoInventario,
    InventarioFisico, TrasladoSucursal, Alerta,
)
from app.schemas.schema_inventario import (
    MovimientoInventarioCreate, MovimientoInventarioResponse,
    TipoMovimientoInventarioCreate, TipoMovimientoInventarioResponse,
    InventarioFisicoCreate, InventarioFisicoResponse,
    TrasladoSucursalCreate, TrasladoSucursalResponse,
    AlertaResponse,
)

router = APIRouter()            # /movimientos-inventario
router_tipo = APIRouter()       # /tipos-movimiento
router_fisico = APIRouter()     # /inventario-fisico
router_traslado = APIRouter()   # /traslados
router_alerta = APIRouter()     # /alertas


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
):
    """Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(MovimientoInventario).order_by(MovimientoInventario.fecha.desc())
    if id_producto is not None:
        query = query.join(MovimientoInventarioDetalle).filter(
            MovimientoInventarioDetalle.id_producto == id_producto
        )
    if fecha_desde is not None:
        query = query.filter(func.date(MovimientoInventario.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(MovimientoInventario.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/{movimiento_id}", response_model=MovimientoInventarioResponse)
def obtener_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    movimiento = db.query(MovimientoInventario).filter(MovimientoInventario.id == movimiento_id).first()
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movimiento


@router.post("", response_model=MovimientoInventarioResponse, status_code=201)
def crear_movimiento(datos: MovimientoInventarioCreate, db: Session = Depends(get_db)):
    """
    Crea un movimiento con sus detalles, y ACTUALIZA el stock_actual de
    cada producto involucrado según el signo del tipo de movimiento.
    """
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
            raise HTTPException(status_code=404, detail=f"Producto id={d.id_producto} no encontrado")
        productos[d.id_producto] = producto

    nuevo_movimiento = MovimientoInventario(
        id_usuario=datos.id_usuario,
        id_tipo_movimiento=datos.id_tipo_movimiento,
        id_ubicacion_origen=datos.id_ubicacion_origen,
        id_sububicacion_origen=datos.id_sububicacion_origen,
        id_ubicacion_destino=datos.id_ubicacion_destino,
        id_sububicacion_destino=datos.id_sububicacion_destino,
        tabla_referencia=datos.tabla_referencia,
        id_referencia=datos.id_referencia,
        referencia=datos.referencia,
        observaciones=datos.observaciones,
    )
    db.add(nuevo_movimiento)
    db.flush()  # para que nuevo_movimiento.id ya exista, sin cerrar la transacción

    for d in datos.detalles:
        detalle = MovimientoInventarioDetalle(
            id_movimiento_cabecera=nuevo_movimiento.id,
            id_producto=d.id_producto,
            cantidad=d.cantidad,
            costo_unitario=d.costo_unitario,
            precio_unitario=d.precio_unitario,
        )
        db.add(detalle)

        # Aquí es donde de verdad se mueve el stock
        producto = productos[d.id_producto]
        producto.stock_actual = float(producto.stock_actual or 0) + float(d.cantidad) * tipo.signo
        _generar_alerta_si_stock_bajo(db, producto)

    db.commit()
    db.refresh(nuevo_movimiento)
    return nuevo_movimiento


# ===================================================================
# TIPO_MOVIMIENTO_INVENTARIO (catálogo simple)
# ===================================================================

@router_tipo.get("", response_model=List[TipoMovimientoInventarioResponse])
def listar_tipos_movimiento(db: Session = Depends(get_db)):
    return db.query(TipoMovimientoInventario).all()


@router_tipo.post("", response_model=TipoMovimientoInventarioResponse, status_code=201)
def crear_tipo_movimiento(datos: TipoMovimientoInventarioCreate, db: Session = Depends(get_db)):
    nuevo = TipoMovimientoInventario(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# INVENTARIO_FISICO (conteos)
# ===================================================================

@router_fisico.get("", response_model=List[InventarioFisicoResponse])
def listar_conteos(id_producto: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(InventarioFisico).order_by(InventarioFisico.fecha.desc())
    if id_producto is not None:
        query = query.filter(InventarioFisico.id_producto == id_producto)
    return query.all()


@router_fisico.post("", response_model=InventarioFisicoResponse, status_code=201)
def registrar_conteo(datos: InventarioFisicoCreate, db: Session = Depends(get_db)):
    """
    Registra un conteo físico, comparando contra el stock_sistema actual.
    NO ajusta el stock todavía -- eso se hace aparte con /aplicar-ajuste,
    para que alguien pueda revisar la diferencia antes de aplicarla.
    """
    producto = db.query(Producto).filter(Producto.id == datos.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    stock_sistema = float(producto.stock_actual or 0)
    diferencia = float(datos.stock_real) - stock_sistema

    nuevo = InventarioFisico(
        **datos.model_dump(),
        stock_sistema=stock_sistema,
        diferencia=diferencia,
        ajustado=0,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_fisico.patch("/{conteo_id}/aplicar-ajuste", response_model=InventarioFisicoResponse)
def aplicar_ajuste(conteo_id: int, db: Session = Depends(get_db)):
    """Corrige producto.stock_actual para que coincida con lo contado físicamente."""
    conteo = db.query(InventarioFisico).filter(InventarioFisico.id == conteo_id).first()
    if not conteo:
        raise HTTPException(status_code=404, detail="Conteo no encontrado")
    if conteo.ajustado == 1:
        raise HTTPException(status_code=400, detail="Este conteo ya fue aplicado antes")

    producto = db.query(Producto).filter(Producto.id == conteo.id_producto).first()
    producto.stock_actual = conteo.stock_real
    conteo.ajustado = 1

    _generar_alerta_si_stock_bajo(db, producto)

    db.commit()
    db.refresh(conteo)
    return conteo


# ===================================================================
# TRASLADO_SUCURSAL
# ===================================================================

@router_traslado.get("", response_model=List[TrasladoSucursalResponse])
def listar_traslados(
    estado: Optional[Literal["EnProceso", "Recibido", "Completado"]] = None,
    id_producto: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """Filtra por fecha_desde/fecha_hasta."""
    query = db.query(TrasladoSucursal).order_by(TrasladoSucursal.fecha.desc())
    if estado is not None:
        query = query.filter(TrasladoSucursal.estado == estado)
    if id_producto is not None:
        query = query.filter(TrasladoSucursal.id_producto == id_producto)
    if fecha_desde is not None:
        query = query.filter(func.date(TrasladoSucursal.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(TrasladoSucursal.fecha) <= fecha_hasta)
    return query.all()


@router_traslado.post("", response_model=TrasladoSucursalResponse, status_code=201)
def crear_traslado(datos: TrasladoSucursalCreate, db: Session = Depends(get_db)):
    """
    Registra la salida de producto de una sucursal hacia otra, a precio de
    costo. No cambia producto.stock_actual (es un total global: el traslado
    no agrega ni quita mercancía de la librería, solo cambia su ubicación).
    """
    if not db.query(Producto).filter(Producto.id == datos.id_producto).first():
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    nuevo = TrasladoSucursal(**datos.model_dump(), estado="EnProceso")
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_traslado.patch("/{traslado_id}/confirmar-recepcion", response_model=TrasladoSucursalResponse)
def confirmar_recepcion(traslado_id: int, id_usuario_recibe: int, db: Session = Depends(get_db)):
    """La sucursal destino confirma que ya le llegó el producto."""
    traslado = db.query(TrasladoSucursal).filter(TrasladoSucursal.id == traslado_id).first()
    if not traslado:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")
    if traslado.estado == "Completado":
        raise HTTPException(status_code=400, detail="Este traslado ya fue completado")

    traslado.estado = "Completado"
    traslado.id_usuario_recibe = id_usuario_recibe
    traslado.fecha_recepcion = datetime.now()

    db.commit()
    db.refresh(traslado)
    return traslado


# ===================================================================
# ALERTA (solo lectura + marcar como leída; el sistema las crea sola)
# ===================================================================

@router_alerta.get("", response_model=List[AlertaResponse])
def listar_alertas(
    solo_no_leidas: bool = True,
    id_usuario_destino: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Alerta).order_by(Alerta.fecha.desc())
    if solo_no_leidas:
        query = query.filter(Alerta.leida == 0)
    if id_usuario_destino is not None:
        query = query.filter(Alerta.id_usuario_destino == id_usuario_destino)
    return query.all()


@router_alerta.patch("/{alerta_id}/marcar-leida", response_model=AlertaResponse)
def marcar_leida(alerta_id: int, db: Session = Depends(get_db)):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alerta.leida = 1
    alerta.fecha_lectura = datetime.now()
    db.commit()
    db.refresh(alerta)
    return alerta
