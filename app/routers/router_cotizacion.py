from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from app.database import get_db
from app.models.model_cotizacion import Cotizacion, DetalleCotizacion
from app.models.model_producto import Producto
from app.models.model_cliente import Cliente
from app.schemas.schema_cotizacion import (
    CotizacionCreate, CotizacionResponse,
)

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones"])


@router.get("/", response_model=List[CotizacionResponse])
def listar_cotizaciones(
    search: Optional[str] = Query(None, description="Buscar por ID, cliente, NIT o producto"),
    estado: Optional[str] = None,
    id_cliente: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Cotizacion).order_by(Cotizacion.fecha.desc())
    
    if estado:
        query = query.filter(Cotizacion.estado == estado)
    if id_cliente:
        query = query.filter(Cotizacion.id_cliente == id_cliente)
    
    if search:
        if search.isdigit():
            query = query.filter(Cotizacion.id == int(search))
        else:
            query = query.join(Cliente, Cotizacion.id_cliente == Cliente.id, isouter=True)
            query = query.join(DetalleCotizacion, Cotizacion.id == DetalleCotizacion.id_cotizacion, isouter=True)
            query = query.join(Producto, DetalleCotizacion.id_producto == Producto.id, isouter=True)
            query = query.filter(
                or_(
                    Cliente.nombre.ilike(f"%{search}%"),
                    Cliente.nit.ilike(f"%{search}%"),
                    Producto.nombre.ilike(f"%{search}%"),
                    Producto.codigo.ilike(f"%{search}%"),
                    Cotizacion.numero_expediente.ilike(f"%{search}%")
                )
            )
            query = query.distinct()
    
    return query.all()


@router.get("/{cotizacion_id}", response_model=CotizacionResponse)
def obtener_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return cotizacion


@router.post("/", response_model=CotizacionResponse, status_code=201)
def crear_cotizacion(datos: CotizacionCreate, db: Session = Depends(get_db)):
    if not datos.detalles:
        raise HTTPException(status_code=400, detail="La cotización debe incluir al menos un producto")
    
    productos = {}
    total = 0
    for d in datos.detalles:
        producto = db.query(Producto).filter(Producto.id == d.id_producto).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto id={d.id_producto} no encontrado")
        precio = float(producto.precio_venta or 0)
        subtotal = precio * d.cantidad
        total += subtotal
        productos[d.id_producto] = producto
    
    año_actual = datetime.now().year
    ultima = db.query(Cotizacion).filter(
        Cotizacion.numero_expediente.like(f"{año_actual}-%")
    ).order_by(Cotizacion.id.desc()).first()
    
    if ultima and ultima.numero_expediente:
        try:
            num = int(ultima.numero_expediente.split("-")[1])
            nuevo_num = num + 1
        except:
            nuevo_num = 1
    else:
        nuevo_num = 1
    
    numero_expediente = f"{año_actual}-{str(nuevo_num).zfill(3)}"
    
    nueva_cotizacion = Cotizacion(
        id_cliente=datos.id_cliente,
        numero_expediente=numero_expediente,
        total=round(total, 2),
        estado="Pendiente",
        observaciones=datos.observaciones,
    )
    db.add(nueva_cotizacion)
    db.flush()
    
    for d in datos.detalles:
        producto = productos[d.id_producto]
        db.add(DetalleCotizacion(
            id_cotizacion=nueva_cotizacion.id,
            id_producto=d.id_producto,
            cantidad=d.cantidad,
            precio_unitario=producto.precio_venta,
        ))
    
    db.commit()
    db.refresh(nueva_cotizacion)
    return nueva_cotizacion


@router.patch("/{cotizacion_id}/estado", response_model=CotizacionResponse)
def cambiar_estado_cotizacion(
    cotizacion_id: int, 
    estado: str,
    db: Session = Depends(get_db)
):
    cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    estados_validos = ["Pendiente", "Aprobada", "Rechazada"]
    if estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {estados_validos}")
    
    cotizacion.estado = estado
    db.commit()
    db.refresh(cotizacion)
    return cotizacion


@router.get("/{cotizacion_id}/para-venta", response_model=dict)
def obtener_cotizacion_para_venta(cotizacion_id: int, db: Session = Depends(get_db)):
    cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    if cotizacion.estado != "Aprobada":
        raise HTTPException(
            status_code=400, 
            detail=f"La cotización debe estar aprobada para convertir en venta. Estado actual: {cotizacion.estado}"
        )
    
    detalles = []
    for d in cotizacion.detalles:
        producto = db.query(Producto).filter(Producto.id == d.id_producto).first()
        if producto:
            stock_disponible = float(producto.stock_actual or 0)
            cantidad_solicitada = float(d.cantidad or 0)
            
            detalles.append({
                "id_producto": d.id_producto,
                "nombre_producto": producto.nombre,
                "cantidad": float(d.cantidad or 0),
                "precio_unitario": float(d.precio_unitario or 0),
                "stock_disponible": stock_disponible,
                "stock_suficiente": stock_disponible >= cantidad_solicitada
            })
    
    return {
        "id": cotizacion.id,
        "id_cliente": cotizacion.id_cliente,
        "numero_expediente": cotizacion.numero_expediente,
        "fecha": cotizacion.fecha,
        "total": float(cotizacion.total or 0),
        "descuento_porcentaje": 0,
        "observaciones": cotizacion.observaciones,
        "detalles": detalles,
        "tiene_stock_suficiente": all(d["stock_suficiente"] for d in detalles)
    }