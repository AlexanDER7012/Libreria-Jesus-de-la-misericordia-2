from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.model_caja import (
    CajaTurno, CajaDenominacion, CajaChicaMovimiento, Gasto, TipoGasto, TipoPago,
)
from app.schemas.schema_caja import (
    CajaTurnoAbrir, CajaTurnoResponse, CajaTurnoCerrar,
    CajaChicaMovimientoCreate, CajaChicaMovimientoResponse,
    GastoCreate, GastoResponse,
    TipoGastoCreate, TipoGastoResponse,
    TipoPagoCreate, TipoPagoResponse,
)

router = APIRouter()               # /caja-turno
router_caja_chica = APIRouter()    # /caja-chica
router_gasto = APIRouter()         # /gastos
router_tipo_gasto = APIRouter()    # /tipos-gasto
router_tipo_pago = APIRouter()     # /tipos-pago


# ===================================================================
# CAJA_TURNO (+ caja_denominacion)
# ===================================================================

@router.get("/", response_model=List[CajaTurnoResponse])
def listar_turnos(
    estado: Optional[str] = None,
    id_ubicacion: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """Filtra por fecha_desde/fecha_hasta (sobre fecha_apertura)."""
    query = db.query(CajaTurno).order_by(CajaTurno.fecha_apertura.desc())
    if estado is not None:
        query = query.filter(CajaTurno.estado == estado)
    if id_ubicacion is not None:
        query = query.filter(CajaTurno.id_ubicacion == id_ubicacion)
    if fecha_desde is not None:
        query = query.filter(func.date(CajaTurno.fecha_apertura) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(CajaTurno.fecha_apertura) <= fecha_hasta)
    return query.all()


@router.get("/{turno_id}", response_model=CajaTurnoResponse)
def obtener_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = db.query(CajaTurno).filter(CajaTurno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.post("/abrir", response_model=CajaTurnoResponse, status_code=201)
def abrir_turno(datos: CajaTurnoAbrir, db: Session = Depends(get_db)):
    """Abre un nuevo turno de caja. No permite dos turnos abiertos a la vez en la misma sucursal."""
    turno_abierto = db.query(CajaTurno).filter(
        CajaTurno.id_ubicacion == datos.id_ubicacion, CajaTurno.estado == "Abierto"
    ).first()
    if turno_abierto:
        raise HTTPException(
            status_code=400,
            detail=f"Ya hay un turno abierto (id={turno_abierto.id}) en esta ubicación. Ciérralo antes de abrir otro.",
        )

    nuevo = CajaTurno(**datos.model_dump(), estado="Abierto")
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.patch("/{turno_id}/cerrar", response_model=CajaTurnoResponse)
def cerrar_turno(turno_id: int, datos: CajaTurnoCerrar, db: Session = Depends(get_db)):
    turno = db.query(CajaTurno).filter(CajaTurno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    if turno.estado == "Cerrado":
        raise HTTPException(status_code=400, detail="Este turno ya está cerrado")
    if not datos.denominaciones:
        raise HTTPException(status_code=400, detail="Debes registrar el conteo de denominaciones para cerrar el turno")

    total_contado = 0.0
    for d in datos.denominaciones:
        total = round(d.denominacion * d.cantidad, 2)
        total_contado += total
        db.add(CajaDenominacion(
            id_caja_turno=turno_id,
            denominacion=d.denominacion,
            cantidad=d.cantidad,
            total=total,
        ))

    from datetime import datetime as dt
    turno.fecha_cierre = dt.now()
    turno.total_contado = round(total_contado, 2)
    turno.total_ventas = turno.total_ventas or 0  # TODO: conectar con suma real de venta.py
    turno.diferencia = round(total_contado - (float(turno.fondo_inicial or 0) + float(turno.total_ventas or 0)), 2)
    turno.estado = "Cerrado"
    turno.observaciones = datos.observaciones

    db.commit()
    db.refresh(turno)
    return turno

# ===================================================================
# CAJA_CHICA_MOVIMIENTO
# ===================================================================
@router_caja_chica.get("/", response_model=List[CajaChicaMovimientoResponse])
def listar_movimientos_caja_chica(id_ubicacion: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(CajaChicaMovimiento).order_by(CajaChicaMovimiento.fecha.desc())
    if id_ubicacion is not None:
        query = query.filter(CajaChicaMovimiento.id_ubicacion == id_ubicacion)
    return query.all()

@router_caja_chica.post("/", response_model=CajaChicaMovimientoResponse, status_code=201)
def registrar_movimiento_caja_chica(datos: CajaChicaMovimientoCreate, db: Session = Depends(get_db)):
    """Registra un movimiento y calcula el saldo corriente de esa sucursal."""
    ultimo = (
        db.query(CajaChicaMovimiento)
        .filter(CajaChicaMovimiento.id_ubicacion == datos.id_ubicacion)
        .order_by(CajaChicaMovimiento.fecha.desc(), CajaChicaMovimiento.id.desc())
        .first()
    )
    saldo_anterior = float(ultimo.saldo) if ultimo else 0.0
    nuevo_saldo = round(saldo_anterior + datos.monto, 2)

    nuevo = CajaChicaMovimiento(**datos.model_dump(), saldo=nuevo_saldo)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# GASTO
# ===================================================================

@router_gasto.get("/", response_model=List[GastoResponse])
def listar_gastos(
    id_ubicacion: Optional[int] = None,
    id_tipo_gasto: Optional[int] = None,
    buscar: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """buscar: coincidencia en el concepto del gasto. Filtra por fecha_desde/fecha_hasta."""
    query = db.query(Gasto).order_by(Gasto.fecha.desc())
    if id_ubicacion is not None:
        query = query.filter(Gasto.id_ubicacion == id_ubicacion)
    if id_tipo_gasto is not None:
        query = query.filter(Gasto.id_tipo_gasto == id_tipo_gasto)
    if buscar:
        query = query.filter(Gasto.concepto.ilike(f"%{buscar}%"))
    if fecha_desde is not None:
        query = query.filter(func.date(Gasto.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Gasto.fecha) <= fecha_hasta)
    return query.all()


@router_gasto.post("/", response_model=GastoResponse, status_code=201)
def registrar_gasto(datos: GastoCreate, db: Session = Depends(get_db)):
    nuevo = Gasto(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# ===================================================================
# TIPO_GASTO (catalogo simple)
# ===================================================================

@router_tipo_gasto.get("/", response_model=List[TipoGastoResponse])
def listar_tipos_gasto(db: Session = Depends(get_db)):
    return db.query(TipoGasto).all()


@router_tipo_gasto.post("/", response_model=TipoGastoResponse, status_code=201)
def crear_tipo_gasto(datos: TipoGastoCreate, db: Session = Depends(get_db)):
    nuevo = TipoGasto(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# ===================================================================
# TIPO_PAGO (catalogo simple)
# ===================================================================

@router_tipo_pago.get("/", response_model=List[TipoPagoResponse])
def listar_tipos_pago(db: Session = Depends(get_db)):
    return db.query(TipoPago).all()


@router_tipo_pago.post("/", response_model=TipoPagoResponse, status_code=201)
def crear_tipo_pago(datos: TipoPagoCreate, db: Session = Depends(get_db)):
    nuevo = TipoPago(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo
