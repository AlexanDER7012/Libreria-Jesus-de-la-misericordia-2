from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.pagination import PaginationParams
from app.security import get_current_user, requiere_permiso
from app.bitacora import registrar_actividad
from app.models.model_producto import Producto, Categoria, Marca, UnidadMedida, HistoricoPrecio
from app.models.model_usuario import Usuario
from app.schemas.schema_producto import (
    ProductoCreate, ProductoUpdate, ProductoResponse,
    CategoriaCreate, CategoriaUpdate, CategoriaResponse,
    MarcaCreate, MarcaUpdate, MarcaResponse,
    UnidadMedidaCreate, UnidadMedidaUpdate, UnidadMedidaResponse,
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
    usuario_actual=Depends(get_current_user),
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
def buscar_por_codigo(
    codigo: str,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    """
    Búsqueda exacta por código de barras — pensado para cuando el lector
    USB/Bluetooth 'escribe' el código completo y se dispara la búsqueda.
    """
    codigo = codigo.strip()
    producto = db.query(Producto).filter(Producto.codigo == codigo).first()
    if not producto:
        raise HTTPException(status_code=404, detail="No existe ningún producto con ese código")
    return producto


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.get("/{producto_id}/historico-precios", response_model=List[HistoricoPrecioResponse])
def historico_precios_de_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    if not db.query(Producto).filter(Producto.id == producto_id).first():
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return (
        db.query(HistoricoPrecio)
        .filter(HistoricoPrecio.id_producto == producto_id)
        .order_by(HistoricoPrecio.fecha_cambio.desc())
        .all()
    )


@router.post("", response_model=ProductoResponse, status_code=201)
def crear_producto(datos: ProductoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Crear"))):
    codigo_limpio = (datos.codigo or "").strip()
    existente = db.query(Producto).filter(Producto.codigo == codigo_limpio).first()
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un producto con ese código ('{existente.nombre}')",
        )

    datos_dict = datos.model_dump()
    datos_dict["codigo"] = codigo_limpio

    if datos_dict.get("precio_automatico") == 1:
        datos_dict["precio_venta"] = _calcular_precio_venta(
            datos_dict.get("precio_compra"), datos_dict.get("margen_ganancia")
        )

    nuevo = Producto(**datos_dict, stock_actual=0, activo=1)
    db.add(nuevo)
    db.flush()
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Producto",
        detalle=f"Creó el producto '{nuevo.nombre}' (código {datos.codigo})",
    )
    db.commit()
    db.refresh(nuevo)

    if nuevo.precio_venta is not None:
        _registrar_cambio_precio(
            db, nuevo, None, nuevo.precio_venta,
            id_usuario=usuario_actual.id,
            motivo="Precio inicial al crear el producto",
        )
        db.commit()

    return nuevo


@router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(producto_id: int, datos: ProductoUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Editar"))):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    precio_anterior = producto.precio_venta
    datos_dict = datos.model_dump(exclude_unset=True)

    # Evita que dos productos queden con el mismo código de barras al editar
    if datos_dict.get("codigo") is not None:
        datos_dict["codigo"] = datos_dict["codigo"].strip()
        if datos_dict["codigo"] != producto.codigo:
            duplicado = (
                db.query(Producto)
                .filter(Producto.codigo == datos_dict["codigo"], Producto.id != producto_id)
                .first()
            )
            if duplicado:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya existe otro producto con ese código ('{duplicado.nombre}')",
                )

    precio_automatico_final = datos_dict.get("precio_automatico", producto.precio_automatico)
    if precio_automatico_final == 1:
        precio_compra_final = datos_dict.get("precio_compra", producto.precio_compra)
        margen_final = datos_dict.get("margen_ganancia", producto.margen_ganancia)
        datos_dict["precio_venta"] = _calcular_precio_venta(precio_compra_final, margen_final)

    for campo, valor in datos_dict.items():
        setattr(producto, campo, valor)

    if producto.precio_venta != precio_anterior:
        _registrar_cambio_precio(
            db, producto, precio_anterior, producto.precio_venta,
            id_usuario=usuario_actual.id,
            motivo="Actualización de producto",
        )

    cambios_texto = ", ".join(f"{campo}: {valor}" for campo, valor in datos_dict.items()) or "sin cambios"
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Producto",
        detalle=f"Actualizó el producto '{producto.nombre}' ({cambios_texto})",
    )
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", response_model=ProductoResponse)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Eliminar"))):
    """Baja lógica: activo pasa de 1 a 0 (el producto deja de ofrecerse, pero conserva su historial)."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = 0
    registrar_actividad(
        db, usuario_actual.id, "ELIMINAR", "Producto",
        detalle=f"Desactivó el producto '{producto.nombre}' (código {producto.codigo})",
    )
    db.commit()
    db.refresh(producto)
    return producto


@router.patch("/{producto_id}/reactivar", response_model=ProductoResponse)
def reactivar_producto(producto_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Eliminar"))):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = 1
    registrar_actividad(
        db, usuario_actual.id, "REACTIVAR", "Producto",
        detalle=f"Reactivó el producto '{producto.nombre}' (código {producto.codigo})",
    )
    db.commit()
    db.refresh(producto)
    return producto


# ===================================================================
# CATEGORIA (catálogo simple)
# ===================================================================

@router_categoria.get("", response_model=List[CategoriaResponse])
def listar_categorias(
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    query = db.query(Categoria)
    if buscar:
        query = query.filter(Categoria.nombre.ilike(f"%{buscar}%"))
    return query.all()


@router_categoria.post("", response_model=CategoriaResponse, status_code=201)
def crear_categoria(datos: CategoriaCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Crear"))):
    nueva = Categoria(**datos.model_dump())
    db.add(nueva)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Categoria",
        detalle=f"Creó la categoría '{nueva.nombre}'",
    )
    db.commit()
    db.refresh(nueva)
    return nueva


@router_categoria.put("/{categoria_id}", response_model=CategoriaResponse)
def actualizar_categoria(categoria_id: int, datos: CategoriaUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Editar"))):
    """Edita la categoría o la da de baja / reactiva (activo 0/1). No se borra para no dejar productos huérfanos."""
    return _actualizar_catalogo(db, Categoria, categoria_id, datos, "categoría", "Categoria", usuario_actual)


# ===================================================================
# MARCA (catálogo simple)
# ===================================================================

@router_marca.get("", response_model=List[MarcaResponse])
def listar_marcas(
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    query = db.query(Marca)
    if buscar:
        query = query.filter(Marca.nombre.ilike(f"%{buscar}%"))
    return query.all()


@router_marca.post("", response_model=MarcaResponse, status_code=201)
def crear_marca(datos: MarcaCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Crear"))):
    nueva = Marca(**datos.model_dump())
    db.add(nueva)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Marca",
        detalle=f"Creó la marca '{nueva.nombre}'",
    )
    db.commit()
    db.refresh(nueva)
    return nueva


@router_marca.put("/{marca_id}", response_model=MarcaResponse)
def actualizar_marca(marca_id: int, datos: MarcaUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Editar"))):
    """Edita la marca o la da de baja / reactiva (activo 0/1). No se borra para no dejar productos huérfanos."""
    return _actualizar_catalogo(db, Marca, marca_id, datos, "marca", "Marca", usuario_actual)


# ===================================================================
# UNIDAD_MEDIDA (catálogo simple)
# ===================================================================

@router_unidad.get("", response_model=List[UnidadMedidaResponse])
def listar_unidades_medida(
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user),
):
    query = db.query(UnidadMedida)
    if buscar:
        query = query.filter(UnidadMedida.nombre.ilike(f"%{buscar}%"))
    return query.all()


@router_unidad.post("", response_model=UnidadMedidaResponse, status_code=201)
def crear_unidad_medida(datos: UnidadMedidaCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Crear"))):
    nueva = UnidadMedida(**datos.model_dump())
    db.add(nueva)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "UnidadMedida",
        detalle=f"Creó la unidad de medida '{nueva.nombre}'",
    )
    db.commit()
    db.refresh(nueva)
    return nueva


@router_unidad.put("/{unidad_id}", response_model=UnidadMedidaResponse)
def actualizar_unidad(unidad_id: int, datos: UnidadMedidaUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Editar"))):
    """Edita la unidad de medida o la da de baja / reactiva (activo 0/1). No se borra para no dejar productos huérfanos."""
    return _actualizar_catalogo(db, UnidadMedida, unidad_id, datos, "unidad de medida", "UnidadMedida", usuario_actual)

def _actualizar_catalogo(db: Session, Modelo, item_id: int, datos, etiqueta: str, nombre_modulo: str, usuario_actual):
    """Edición común para Categoría, Marca y Unidad de medida."""
    item = db.query(Modelo).filter(Modelo.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"{etiqueta.capitalize()} no encontrada")

    cambios = datos.model_dump(exclude_unset=True)
    if "nombre" in cambios:
        nombre = (cambios["nombre"] or "").strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="El nombre es obligatorio")
        duplicado = (
            db.query(Modelo)
            .filter(func.lower(Modelo.nombre) == nombre.lower(), Modelo.id != item_id)
            .first()
        )
        if duplicado:
            raise HTTPException(status_code=400, detail=f"Ya existe otra {etiqueta} con ese nombre")
        cambios["nombre"] = nombre
    if "activo" in cambios and cambios["activo"] not in (0, 1):
        raise HTTPException(status_code=400, detail="activo debe ser 0 o 1")

    nombre_anterior = item.nombre
    for campo, valor in cambios.items():
        setattr(item, campo, valor)

    if set(cambios) == {"activo"}:
        accion_txt = "Reactivó" if cambios["activo"] == 1 else "Dio de baja"
        detalle = f"{accion_txt} {etiqueta} '{item.nombre}'"
    else:
        detalle = f"Editó {etiqueta} '{nombre_anterior}'" + (
            f" (ahora '{item.nombre}')" if item.nombre != nombre_anterior else ""
        )
    registrar_actividad(db, usuario_actual.id, "EDITAR", nombre_modulo, detalle=detalle)
    db.commit()
    db.refresh(item)
    return item
