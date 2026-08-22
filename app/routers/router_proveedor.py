from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.models.model_producto import Producto
from app.models.model_proveedor import Proveedor, TipoProveedor, Pedido, DetallePedido
from app.schemas.schema_proveedor import (
    ProveedorCreate, ProveedorUpdate, ProveedorResponse,
    TipoProveedorCreate, TipoProveedorResponse,
    PedidoCreate, PedidoResponse,
    DetallePedidoCreate, DetallePedidoResponse,
    PedidoTotalResponse,
)

MONTO_MINIMO_PEDIDO = 500.00  

router = APIRouter()           # /proveedores
router_tipo = APIRouter()      # /tipos-proveedor
router_pedido = APIRouter()    # /pedidos

ESTADOS_PEDIDO = ["Pendiente", "Cotizado", "Aprobado", "Comprado", "Cancelado"]


def _calcular_total_pedido(db: Session, pedido: Pedido) -> float:
    total = 0.0
    for detalle in pedido.detalles:
        producto = db.query(Producto).filter(Producto.id == detalle.id_producto).first()
        precio = float(producto.precio_compra) if producto and producto.precio_compra else 0.0
        total += float(detalle.cantidad_pedida) * precio
    return round(total, 2)


# ===================================================================
# PROVEEDOR
# ===================================================================

@router.get("/", response_model=List[ProveedorResponse])
def listar_proveedores(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    query = db.query(Proveedor)
    if estado == "activos":
        query = query.filter(Proveedor.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Proveedor.activo == 0)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/{proveedor_id}", response_model=ProveedorResponse)
def obtener_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor


@router.post("/", response_model=ProveedorResponse, status_code=201)
def crear_proveedor(datos: ProveedorCreate, db: Session = Depends(get_db)):
    nuevo = Proveedor(**datos.model_dump(), activo=1)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{proveedor_id}", response_model=ProveedorResponse)
def actualizar_proveedor(proveedor_id: int, datos: ProveedorUpdate, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(proveedor, campo, valor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.delete("/{proveedor_id}", response_model=ProveedorResponse)
def eliminar_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    """Baja lógica: activo pasa de 1 a 0."""
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    proveedor.activo = 0
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.patch("/{proveedor_id}/reactivar", response_model=ProveedorResponse)
def reactivar_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    proveedor.activo = 1
    db.commit()
    db.refresh(proveedor)
    return proveedor


# ===================================================================
# TIPO_PROVEEDOR (catalogo simple)
# ===================================================================

@router_tipo.get("/", response_model=List[TipoProveedorResponse])
def listar_tipos_proveedor(db: Session = Depends(get_db)):
    return db.query(TipoProveedor).all()


@router_tipo.post("/", response_model=TipoProveedorResponse, status_code=201)
def crear_tipo_proveedor(datos: TipoProveedorCreate, db: Session = Depends(get_db)):
    nuevo = TipoProveedor(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# PEDIDO (+ detalle_pedido)
# ===================================================================

@router_pedido.get("/", response_model=List[PedidoResponse])
def listar_pedidos(
    estado: Optional[str] = None,
    id_proveedor: Optional[int] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    query = db.query(Pedido).order_by(Pedido.fecha.desc())
    if estado is not None:
        query = query.filter(Pedido.estado == estado)
    if id_proveedor is not None:
        query = query.filter(Pedido.id_proveedor == id_proveedor)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_pedido.get("/{pedido_id}", response_model=PedidoResponse)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido


@router_pedido.get("/{pedido_id}/total", response_model=PedidoTotalResponse)
def calcular_total_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Suma cantidad_pedida * precio_compra de todos los detalles, y dice si ya alcanza el minimo de Q500."""
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    total = _calcular_total_pedido(db, pedido)
    return PedidoTotalResponse(id_pedido=pedido.id, total=total, alcanza_minimo=total >= MONTO_MINIMO_PEDIDO)


@router_pedido.post("/", response_model=PedidoResponse, status_code=201)
def crear_pedido(datos: PedidoCreate, db: Session = Depends(get_db)):
    nuevo = Pedido(**datos.model_dump(), estado="Pendiente")
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_pedido.post("/{pedido_id}/detalles", response_model=DetallePedidoResponse, status_code=201)
def agregar_producto_a_pedido(pedido_id: int, datos: DetallePedidoCreate, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if pedido.estado not in ("Pendiente", "Cotizado"):
        raise HTTPException(status_code=400, detail=f"No se pueden agregar productos a un pedido en estado '{pedido.estado}'")
    if not db.query(Producto).filter(Producto.id == datos.id_producto).first():
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    nuevo_detalle = DetallePedido(id_pedido=pedido_id, **datos.model_dump())
    db.add(nuevo_detalle)
    db.commit()
    db.refresh(nuevo_detalle)
    return nuevo_detalle


@router_pedido.delete("/{pedido_id}/detalles/{detalle_id}", status_code=204)
def quitar_producto_de_pedido(pedido_id: int, detalle_id: int, db: Session = Depends(get_db)):
    detalle = db.query(DetallePedido).filter(
        DetallePedido.id == detalle_id, DetallePedido.id_pedido == pedido_id
    ).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado en este pedido")
    db.delete(detalle)
    db.commit()


@router_pedido.patch("/{pedido_id}/estado", response_model=PedidoResponse)
def cambiar_estado_pedido(
    pedido_id: int,
    nuevo_estado: str = Query(..., description=f"Uno de: {', '.join(ESTADOS_PEDIDO)}"),
    forzar: bool = Query(False, description="Forzar aprobación aunque no alcance el mínimo de Q500"),
    db: Session = Depends(get_db),
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if nuevo_estado not in ESTADOS_PEDIDO:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {ESTADOS_PEDIDO}")

    if nuevo_estado == "Aprobado" and not forzar:
        total = _calcular_total_pedido(db, pedido)
        if total < MONTO_MINIMO_PEDIDO:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"El pedido suma Q{total} y el mínimo para aprobar es Q{MONTO_MINIMO_PEDIDO}. "
                    f"Agrega más productos, o usa forzar=true si de verdad quieres aprobarlo así."
                ),
            )

    pedido.estado = nuevo_estado
    db.commit()
    db.refresh(pedido)
    return pedido
