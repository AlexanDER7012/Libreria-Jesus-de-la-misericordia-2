from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.models.model_producto import Producto
from app.models.model_cotizacion import Cotizacion, DetalleCotizacion
from app.schemas.schema_cotizacion import CotizacionCreate, CotizacionResponse

router = APIRouter()  # /cotizaciones


def _generar_numero_expediente(db: Session) -> str:
    """Genera el correlativo 'AAAA-NNN' para el año actual (ej. '2026-014')."""
    anio_actual = datetime.now().year
    cantidad_este_anio = (
        db.query(func.count(Cotizacion.id))
        .filter(Cotizacion.numero_expediente.like(f"{anio_actual}-%"))
        .scalar()
    )
    siguiente = cantidad_este_anio + 1
    return f"{anio_actual}-{siguiente:03d}"


@router.get("/", response_model=List[CotizacionResponse])
def listar_cotizaciones(
    estado: Optional[str] = None,
    id_cliente: Optional[int] = None,
    buscar: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    """buscar: coincidencia en número de expediente (ej. '2026-014'). Filtra por fecha_desde/fecha_hasta. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(Cotizacion).order_by(Cotizacion.fecha.desc())
    if estado is not None:
        query = query.filter(Cotizacion.estado == estado)
    if id_cliente is not None:
        query = query.filter(Cotizacion.id_cliente == id_cliente)
    if buscar:
        query = query.filter(Cotizacion.numero_expediente.ilike(f"%{buscar}%"))
    if fecha_desde is not None:
        query = query.filter(func.date(Cotizacion.fecha) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(Cotizacion.fecha) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/{cotizacion_id}", response_model=CotizacionResponse)
def obtener_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return cotizacion


@router.get("/expediente/{numero_expediente}", response_model=CotizacionResponse)
def buscar_por_expediente(numero_expediente: str, db: Session = Depends(get_db)):
    """Búsqueda por el correlativo (ej. '2026-014'), igual a como se archiva físicamente en el folder."""
    cotizacion = db.query(Cotizacion).filter(Cotizacion.numero_expediente == numero_expediente).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="No existe ninguna cotización con ese expediente")
    return cotizacion


@router.post("/", response_model=CotizacionResponse, status_code=201)
def crear_cotizacion(datos: CotizacionCreate, db: Session = Depends(get_db)):
    if not datos.detalles:
        raise HTTPException(status_code=400, detail="La cotización debe incluir al menos un producto")

    productos = {}
    for d in datos.detalles:
        producto = db.query(Producto).filter(Producto.id == d.id_producto).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto id={d.id_producto} no encontrado")
        productos[d.id_producto] = producto

    total = sum(float(productos[d.id_producto].precio_venta or 0) * d.cantidad for d in datos.detalles)

    nueva_cotizacion = Cotizacion(
        id_cliente=datos.id_cliente,
        numero_expediente=_generar_numero_expediente(db),
        total=round(total, 2),
        estado="Pendiente",
        observaciones=datos.observaciones,
    )
    db.add(nueva_cotizacion)
    db.flush()

    for d in datos.detalles:
        precio = float(productos[d.id_producto].precio_venta or 0)
        db.add(DetalleCotizacion(
            id_cotizacion=nueva_cotizacion.id,
            id_producto=d.id_producto,
            cantidad=d.cantidad,
            precio_unitario=precio,
        ))

    db.commit()
    db.refresh(nueva_cotizacion)
    return nueva_cotizacion


@router.patch("/{cotizacion_id}/estado", response_model=CotizacionResponse)
def cambiar_estado_cotizacion(cotizacion_id: int, nuevo_estado: str, db: Session = Depends(get_db)):
    if nuevo_estado not in ("Pendiente", "Aceptada", "Rechazada"):
        raise HTTPException(status_code=400, detail="Estado inválido. Debe ser Pendiente, Aceptada o Rechazada")

    cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    cotizacion.estado = nuevo_estado
    db.commit()
    db.refresh(cotizacion)
    return cotizacion
