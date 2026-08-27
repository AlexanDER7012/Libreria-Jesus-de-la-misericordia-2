from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import hash_password
from app.models.model_usuario import (
    Usuario, Empleado, Rol, RolPermiso, Puesto, Turno,
    Modulo, Permiso, HistoricoPagoEmpleado, LogActividad,
)
from app.schemas.schema_usuario import (
    UsuarioCreate, UsuarioUpdate, UsuarioResponse,
    EmpleadoCreate, EmpleadoUpdate, EmpleadoResponse,
    RolCreate, RolResponse, RolPermisoCreate, RolPermisoResponse,
    PuestoCreate, PuestoResponse,
    TurnoCreate, TurnoResponse,
    ModuloCreate, ModuloResponse,
    PermisoCreate, PermisoResponse,
    HistoricoPagoEmpleadoCreate, HistoricoPagoEmpleadoResponse,
    LogActividadResponse,
)

router = APIRouter()             # /usuarios
router_empleado = APIRouter()    # /empleados
router_rol = APIRouter()         # /roles
router_puesto = APIRouter()      # /puestos
router_turno = APIRouter()       # /turnos
router_modulo = APIRouter()      # /modulos
router_permiso = APIRouter()     # /permisos
router_pago = APIRouter()        # /pagos-empleado
router_log = APIRouter()         # /logs


def _filtrar_por_estado(query, modelo, estado: str):
    """Helper para no repetir el mismo if/elif de activos/inactivos/todos en cada router."""
    if estado == "activos":
        return query.filter(modelo.activo == 1)
    if estado == "inactivos":
        return query.filter(modelo.activo == 0)
    return query


# ===================================================================
# USUARIO
# ===================================================================

@router.get("", response_model=List[UsuarioResponse])
def listar_usuarios(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """buscar: coincidencia en nombre_usuario."""
    query = _filtrar_por_estado(db.query(Usuario), Usuario, estado)
    if buscar:
        query = query.filter(Usuario.nombre_usuario.ilike(f"%{buscar}%"))
    return query.all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("", response_model=UsuarioResponse, status_code=201)
def crear_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.nombre_usuario == datos.nombre_usuario).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ese nombre de usuario ya existe")

    datos_dict = datos.model_dump()
    password_plano = datos_dict.pop("password")

    nuevo = Usuario(
        **datos_dict,
        password=hash_password(password_plano),  # nunca se guarda en texto plano
        intentos_fallidos=0,
        activo=1,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True)
    if "password" in datos_dict:
        datos_dict["password"] = hash_password(datos_dict["password"])

    for campo, valor in datos_dict.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", response_model=UsuarioResponse)
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Baja lógica: activo pasa de 1 a 0 (el usuario ya no puede iniciar sesión)."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = 0
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{usuario_id}/reactivar", response_model=UsuarioResponse)
def reactivar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = 1
    usuario.intentos_fallidos = 0
    db.commit()
    db.refresh(usuario)
    return usuario


# ===================================================================
# EMPLEADO
# ===================================================================

@router_empleado.get("", response_model=List[EmpleadoResponse])
def listar_empleados(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """buscar: coincidencia en nombre o DPI."""
    query = _filtrar_por_estado(db.query(Empleado), Empleado, estado)
    if buscar:
        like = f"%{buscar}%"
        query = query.filter((Empleado.nombre.ilike(like)) | (Empleado.dpi.ilike(like)))
    return query.all()


@router_empleado.get("/{empleado_id}", response_model=EmpleadoResponse)
def obtener_empleado(empleado_id: int, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado


@router_empleado.post("", response_model=EmpleadoResponse, status_code=201)
def crear_empleado(datos: EmpleadoCreate, db: Session = Depends(get_db)):
    existente = db.query(Empleado).filter(Empleado.dpi == datos.dpi).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un empleado con ese DPI")

    nuevo = Empleado(**datos.model_dump(), activo=1)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_empleado.put("/{empleado_id}", response_model=EmpleadoResponse)
def actualizar_empleado(empleado_id: int, datos: EmpleadoUpdate, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(empleado, campo, valor)

    db.commit()
    db.refresh(empleado)
    return empleado


@router_empleado.delete("/{empleado_id}", response_model=EmpleadoResponse)
def eliminar_empleado(empleado_id: int, db: Session = Depends(get_db)):
    """Baja lógica: activo pasa de 1 a 0."""
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    empleado.activo = 0
    db.commit()
    db.refresh(empleado)
    return empleado


@router_empleado.patch("/{empleado_id}/reactivar", response_model=EmpleadoResponse)
def reactivar_empleado(empleado_id: int, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    empleado.activo = 1
    db.commit()
    db.refresh(empleado)
    return empleado


# ===================================================================
# ROL (catálogo, sin 'activo' -> CRUD simple, sin baja lógica)
# ===================================================================

@router_rol.get("", response_model=List[RolResponse])
def listar_roles(db: Session = Depends(get_db)):
    return db.query(Rol).all()


@router_rol.post("", response_model=RolResponse, status_code=201)
def crear_rol(datos: RolCreate, db: Session = Depends(get_db)):
    nuevo = Rol(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_rol.get("/{rol_id}/permisos", response_model=List[RolPermisoResponse])
def listar_permisos_de_rol(rol_id: int, db: Session = Depends(get_db)):
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return db.query(RolPermiso).filter(RolPermiso.id_rol == rol_id).all()


@router_rol.post("/permisos", response_model=RolPermisoResponse, status_code=201)
def asignar_permiso_a_rol(datos: RolPermisoCreate, db: Session = Depends(get_db)):
    """Asigna un permiso existente a un rol existente."""
    if not db.query(Rol).filter(Rol.id == datos.id_rol).first():
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    if not db.query(Permiso).filter(Permiso.id == datos.id_permiso).first():
        raise HTTPException(status_code=404, detail="Permiso no encontrado")

    nueva_asignacion = RolPermiso(**datos.model_dump())
    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)
    return nueva_asignacion


@router_rol.delete("/permisos/{rol_permiso_id}", status_code=204)
def quitar_permiso_de_rol(rol_permiso_id: int, db: Session = Depends(get_db)):
    """Aquí sí se borra el registro real (es solo una relación, no un catálogo)."""
    asignacion = db.query(RolPermiso).filter(RolPermiso.id == rol_permiso_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    db.delete(asignacion)
    db.commit()


# ===================================================================
# PUESTO (catálogo simple)
# ===================================================================

@router_puesto.get("", response_model=List[PuestoResponse])
def listar_puestos(db: Session = Depends(get_db)):
    return db.query(Puesto).all()


@router_puesto.post("", response_model=PuestoResponse, status_code=201)
def crear_puesto(datos: PuestoCreate, db: Session = Depends(get_db)):
    nuevo = Puesto(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# TURNO (catálogo simple)
# ===================================================================

@router_turno.get("", response_model=List[TurnoResponse])
def listar_turnos(db: Session = Depends(get_db)):
    return db.query(Turno).all()


@router_turno.post("", response_model=TurnoResponse, status_code=201)
def crear_turno(datos: TurnoCreate, db: Session = Depends(get_db)):
    nuevo = Turno(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# MODULO (catálogo simple)
# ===================================================================

@router_modulo.get("", response_model=List[ModuloResponse])
def listar_modulos(db: Session = Depends(get_db)):
    return db.query(Modulo).order_by(Modulo.orden).all()


@router_modulo.post("", response_model=ModuloResponse, status_code=201)
def crear_modulo(datos: ModuloCreate, db: Session = Depends(get_db)):
    nuevo = Modulo(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# PERMISO (catálogo simple)
# ===================================================================

@router_permiso.get("", response_model=List[PermisoResponse])
def listar_permisos(db: Session = Depends(get_db)):
    return db.query(Permiso).all()


@router_permiso.post("", response_model=PermisoResponse, status_code=201)
def crear_permiso(datos: PermisoCreate, db: Session = Depends(get_db)):
    nuevo = Permiso(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# HISTORICO_PAGO_EMPLEADO (solo se crea y se lista; no tiene sentido editar/borrar un pago ya hecho)
# ===================================================================

@router_pago.get("", response_model=List[HistoricoPagoEmpleadoResponse])
def listar_pagos(id_empleado: int | None = None, db: Session = Depends(get_db)):
    query = db.query(HistoricoPagoEmpleado)
    if id_empleado is not None:
        query = query.filter(HistoricoPagoEmpleado.id_empleado == id_empleado)
    return query.all()


@router_pago.post("", response_model=HistoricoPagoEmpleadoResponse, status_code=201)
def registrar_pago(datos: HistoricoPagoEmpleadoCreate, db: Session = Depends(get_db)):
    if not db.query(Empleado).filter(Empleado.id == datos.id_empleado).first():
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    nuevo = HistoricoPagoEmpleado(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# LOG_ACTIVIDAD (solo lectura vía API; el sistema lo escribe internamente)
# ===================================================================

@router_log.get("", response_model=List[LogActividadResponse])
def listar_logs(id_usuario: int | None = None, db: Session = Depends(get_db)):
    query = db.query(LogActividad).order_by(LogActividad.fecha.desc())
    if id_usuario is not None:
        query = query.filter(LogActividad.id_usuario == id_usuario)
    return query.limit(200).all()
