from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.models.model_producto import Producto, Categoria, Marca, UnidadMedida, HistoricoPrecio
from app.schemas.schema_producto import (
    ProductoCreate, ProductoUpdate, ProductoResponse,
    CategoriaCreate, CategoriaResponse,
    MarcaCreate, MarcaResponse,
    UnidadMedidaCreate, UnidadMedidaResponse,
    HistoricoPrecioResponse,
)

router = APIRouter()             # /productos
router_categoria = APIRouter()   # /categorias
router_marca = APIRouter()       # /marcas
router_unidad = APIRouter()      # /unidades-medida


def _calcular_precio_venta(precio_compra, margen_ganancia) -> float:
    """precio_venta = precio_compra + (precio_compra * margen% / 100)"""
    if precio_compra is None or margen_ganancia is None:
        return None
    return round(float(precio_compra) * (1 + float(margen_ganancia) / 100), 2)


def _registrar_cambio_precio(db: Session, producto: Producto, precio_anterior, precio_nuevo, id_usuario=None, motivo=None):
    """Guarda en historico_precio solo si el precio realmente cambió."""
    if precio_anterior == precio_nuevo:
        return
    registro = HistoricoPrecio(
        id_producto=producto.id,
        precio_anterior=precio_anterior,
        precio_nuevo=precio_nuevo,
        id_usuario=id_usuario,
        motivo=motivo,
    )
    db.add(registro)


# ===================================================================
# PRODUCTO
# ===================================================================

@router.get("", response_model=List[ProductoResponse])
def listar_productos(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    id_categoria: Optional[int] = None,
    id_marca: Optional[int] = None,
    buscar: Optional[str] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    query = db.query(Producto)
    if estado == "activos":
        query = query.filter(Producto.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Producto.activo == 0)
    if id_categoria is not None:
        query = query.filter(Producto.id_categoria == id_categoria)
    if id_marca is not None:
        query = query.filter(Producto.id_marca == id_marca)
    if buscar:
        like = f"%{buscar}%"
        query = query.filter((Producto.nombre.ilike(like)) | (Producto.codigo.ilike(like)))
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/buscar-codigo/{codigo}", response_model=ProductoResponse)
def buscar_por_codigo(codigo: str, db: Session = Depends(get_db)):
    """
    Búsqueda exacta por código de barras — pensado para cuando el lector
    USB/Bluetooth 'escribe' el código completo y se dispara la búsqueda.
    """
    producto = db.query(Producto).filter(Producto.codigo == codigo).first()
    if not producto:
        raise HTTPException(status_code=404, detail="No existe ningún producto con ese código")
    return producto


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.get("/{producto_id}/historico-precios", response_model=List[HistoricoPrecioResponse])
def historico_precios_de_producto(producto_id: int, db: Session = Depends(get_db)):
    if not db.query(Producto).filter(Producto.id == producto_id).first():
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return (
        db.query(HistoricoPrecio)
        .filter(HistoricoPrecio.id_producto == producto_id)
        .order_by(HistoricoPrecio.fecha_cambio.desc())
        .all()
    )


@router.post("", response_model=ProductoResponse, status_code=201)
def crear_producto(datos: ProductoCreate, db: Session = Depends(get_db)):
    if db.query(Producto).filter(Producto.codigo == datos.codigo).first():
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese código")

    datos_dict = datos.model_dump()

    if datos_dict.get("precio_automatico") == 1:
        datos_dict["precio_venta"] = _calcular_precio_venta(
            datos_dict.get("precio_compra"), datos_dict.get("margen_ganancia")
        )

    nuevo = Producto(**datos_dict, stock_actual=0, activo=1)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    if nuevo.precio_venta is not None:
        _registrar_cambio_precio(db, nuevo, None, nuevo.precio_venta, motivo="Precio inicial al crear el producto")
        db.commit()

    return nuevo


@router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(producto_id: int, datos: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    precio_anterior = producto.precio_venta
    datos_dict = datos.model_dump(exclude_unset=True)

    precio_automatico_final = datos_dict.get("precio_automatico", producto.precio_automatico)
    if precio_automatico_final == 1:
        precio_compra_final = datos_dict.get("precio_compra", producto.precio_compra)
        margen_final = datos_dict.get("margen_ganancia", producto.margen_ganancia)
        datos_dict["precio_venta"] = _calcular_precio_venta(precio_compra_final, margen_final)

    for campo, valor in datos_dict.items():
        setattr(producto, campo, valor)

    # TODO: cuando exista el login, pasar aquí el id_usuario real (usuario autenticado)
    if producto.precio_venta != precio_anterior:
        _registrar_cambio_precio(db, producto, precio_anterior, producto.precio_venta, motivo="Actualización de producto")

    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", response_model=ProductoResponse)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    """Baja lógica: activo pasa de 1 a 0 (el producto deja de ofrecerse, pero conserva su historial)."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = 0
    db.commit()
    db.refresh(producto)
    return producto


@router.patch("/{producto_id}/reactivar", response_model=ProductoResponse)
def reactivar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = 1
    db.commit()
    db.refresh(producto)
    return producto


# ===================================================================
# CATEGORIA (catálogo simple)
# ===================================================================

@router_categoria.get("", response_model=List[CategoriaResponse])
def listar_categorias(buscar: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Categoria)
    if buscar:
        query = query.filter(Categoria.nombre.ilike(f"%{buscar}%"))
    return query.all()


@router_categoria.post("", response_model=CategoriaResponse, status_code=201)
def crear_categoria(datos: CategoriaCreate, db: Session = Depends(get_db)):
    nueva = Categoria(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


# ===================================================================
# MARCA (catálogo simple)
# ===================================================================

@router_marca.get("", response_model=List[MarcaResponse])
def listar_marcas(buscar: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Marca)
    if buscar:
        query = query.filter(Marca.nombre.ilike(f"%{buscar}%"))
    return query.all()


@router_marca.post("", response_model=MarcaResponse, status_code=201)
def crear_marca(datos: MarcaCreate, db: Session = Depends(get_db)):
    nueva = Marca(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


# ===================================================================
# UNIDAD_MEDIDA (catálogo simple)
# ===================================================================

@router_unidad.get("", response_model=List[UnidadMedidaResponse])
def listar_unidades_medida(buscar: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(UnidadMedida)
    if buscar:
        query = query.filter(UnidadMedida.nombre.ilike(f"%{buscar}%"))
    return query.all()


@router_unidad.post("", response_model=UnidadMedidaResponse, status_code=201)
def crear_unidad_medida(datos: UnidadMedidaCreate, db: Session = Depends(get_db)):
    nueva = UnidadMedida(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva
