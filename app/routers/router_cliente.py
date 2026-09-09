"""
app/routers/router_cliente.py
------------------------
Endpoints CRUD del recurso Cliente.
"""

from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.pagination import PaginationParams
from app.security import get_current_user
from app.bitacora import registrar_actividad
from app.models.model_cliente import Cliente
from app.models.model_usuario import Usuario
from app.schemas.schema_cliente import ClienteCreate, ClienteUpdate, ClienteResponse

router = APIRouter()


@router.get("", response_model=List[ClienteResponse])
def listar_clientes(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    buscar: Optional[str] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    """
    Lista clientes según su estado:
      - activos   (default): solo clientes con activo=1
      - inactivos: solo clientes con activo=0 (dados de baja)
      - todos:     sin filtrar por estado
    buscar: coincidencia parcial en nombre, telefono, email o nit.
    Paginado: ?skip=0&limit=50 (default), máximo 200 por página.
    """
    query = db.query(Cliente)
    if estado == "activos":
        query = query.filter(Cliente.activo == 1)
    elif estado == "inactivos":
        query = query.filter(Cliente.activo == 0)
    # estado == "todos" -> no se aplica ningún filtro
    if buscar:
        like = f"%{buscar}%"
        query = query.filter(
            (Cliente.nombre.ilike(like))
            | (Cliente.telefono.ilike(like))
            | (Cliente.email.ilike(like))
            | (Cliente.nit.ilike(like))
        )
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene un cliente por su id (activo o no)."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("", response_model=ClienteResponse, status_code=201)
def crear_cliente(datos: ClienteCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Crea un nuevo cliente (siempre queda activo=1)."""
    nuevo_cliente = Cliente(**datos.model_dump(), activo=1)
    db.add(nuevo_cliente)
    registrar_actividad(db, usuario_actual.id, "CREAR", "Cliente")
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(cliente_id: int, datos: ClienteUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Actualiza uno o varios campos de un cliente existente."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(cliente, campo, valor)

    registrar_actividad(db, usuario_actual.id, "EDITAR", "Cliente")
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", response_model=ClienteResponse)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente.activo = 0
    registrar_actividad(db, usuario_actual.id, "ELIMINAR", "Cliente")
    db.commit()
    db.refresh(cliente)
    return cliente


@router.patch("/{cliente_id}/reactivar", response_model=ClienteResponse)
def reactivar_cliente(cliente_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """Reactiva un cliente dado de baja (activo de 0 a 1)."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente.activo = 1
    registrar_actividad(db, usuario_actual.id, "REACTIVAR", "Cliente")
    db.commit()
    db.refresh(cliente)
    return cliente