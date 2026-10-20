from datetime import date
import logging
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.pagination import PaginationParams
from app.security import hash_password, get_current_user, requiere_permiso
from app.bitacora import registrar_actividad
from app.models.model_usuario import (
    Usuario, Empleado, Rol, RolPermiso, Puesto, Turno,
    Modulo, Permiso, HistoricoPagoEmpleado, LogActividad,
)
from app.schemas.validators import solo_digitos, validar_dpi
from app.schemas.schema_usuario import (
    UsuarioCreate, UsuarioUpdate, UsuarioResponse,
    EmpleadoCreate, EmpleadoUpdate, EmpleadoResponse,
    RolCreate, RolUpdate, RolResponse, RolPermisoCreate, RolPermisoResponse,
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

logger = logging.getLogger(__name__)

PERMISOS_PESTANAS = (
    ("Ventas", "Tab:Ventas:Ventas", "Acceso a la pestaña Ventas"),
    ("Ventas", "Tab:Ventas:Clientes", "Acceso a la pestaña Clientes"),
    ("Ventas", "Tab:Ventas:Servicios", "Acceso a la pestaña Servicios Adicionales"),
    ("Ventas", "Tab:Ventas:Cotizaciones", "Acceso a la pestaña Cotizaciones"),
    ("Ventas", "Tab:Ventas:Caja", "Acceso a la pestaña Caja"),
    ("Ventas", "Tab:Ventas:Vendedores", "Acceso a la pestaña Vendedores"),
    ("Ventas", "Tab:Ventas:FichaClienteVentas", "Acceso a ventas en la ficha del cliente"),
    ("Ventas", "Tab:Ventas:FichaClienteServicios", "Acceso a servicios en la ficha del cliente"),
    ("Compras", "Tab:Compras:Compras", "Acceso a la pestaña Compras"),
    ("Compras", "Tab:Compras:Proveedores", "Acceso al grupo de pestañas Proveedores"),
    ("Compras", "Tab:Compras:CajaChica", "Acceso a la pestaña Caja Chica"),
    ("Compras", "Tab:Compras:Gastos", "Acceso al grupo de pestañas Gastos"),
    ("Compras", "Tab:Compras:TiposPago", "Acceso a la pestaña Tipos de Pago"),
    ("Compras", "Tab:Compras:TiposProveedor", "Acceso a Tipos de Proveedor"),
    ("Compras", "Tab:Compras:ListaProveedores", "Acceso a la lista de Proveedores"),
    ("Compras", "Tab:Compras:Pedidos", "Acceso a Pedidos de Proveedor"),
    ("Compras", "Tab:Compras:ListaGastos", "Acceso a la lista de Gastos"),
    ("Compras", "Tab:Compras:TiposGasto", "Acceso a Tipos de Gasto"),
    ("Caja", "Tab:Caja:Turnos", "Acceso a la pestaña Turnos de Caja"),
    ("Caja", "Tab:Caja:CajaChica", "Acceso a la pestaña Caja Chica"),
    ("Caja", "Tab:Caja:Gastos", "Acceso a la pestaña Gastos de Caja"),
    ("Caja", "Tab:Caja:Catalogos", "Acceso a los catálogos de Caja"),
    ("Inventario", "Tab:Inventario:Catalogo", "Acceso al grupo Catálogo de Inventario"),
    ("Inventario", "Tab:Inventario:Operaciones", "Acceso al grupo Operaciones de Inventario"),
    ("Inventario", "Tab:Inventario:Productos", "Acceso a Productos de Inventario"),
    ("Inventario", "Tab:Inventario:Categorias", "Acceso a Categorías de Inventario"),
    ("Inventario", "Tab:Inventario:Marcas", "Acceso a Marcas de Inventario"),
    ("Inventario", "Tab:Inventario:Unidades", "Acceso a Unidades de Medida"),
    ("Inventario", "Tab:Inventario:TiposMovimiento", "Acceso a Tipos de Movimiento"),
    ("Inventario", "Tab:Inventario:Resumen", "Acceso al resumen de Inventario"),
    ("Inventario", "Tab:Inventario:ConteoFisico", "Acceso al Conteo Físico"),
    ("Inventario", "Tab:Inventario:Traslados", "Acceso a Traslados de Inventario"),
    ("Inventario", "Tab:Inventario:Alertas", "Acceso a Alertas de Inventario"),
    ("Inventario", "Tab:Inventario:Dashboard", "Acceso al Dashboard de Inventario"),
    ("Inventario", "Tab:Inventario:Reportes", "Acceso a Reportes de Inventario"),
    ("Reportes", "Tab:Reportes:Ventas", "Acceso a reportes de Ventas"),
    ("Reportes", "Tab:Reportes:Compras", "Acceso a reportes de Compras"),
    ("Reportes", "Tab:Reportes:Inventario", "Acceso a reportes de Inventario"),
    ("Reportes", "Tab:Reportes:Usuarios", "Acceso a reportes de Usuarios"),
    ("Reportes", "Tab:Reportes:VentasDiarias", "Acceso al reporte Ventas Diarias"),
    ("Reportes", "Tab:Reportes:Conciliacion", "Acceso al reporte Conciliación de Pagos"),
    ("Reportes", "Tab:Reportes:CuadreCaja", "Acceso al reporte Cuadre de Caja"),
    ("Reportes", "Tab:Reportes:Utilidad", "Acceso al reporte Utilidad por Producto"),
    ("Reportes", "Tab:Reportes:TopProductos", "Acceso al reporte Top Productos"),
    ("Reportes", "Tab:Reportes:ComprasResumen", "Acceso al Resumen de Compras"),
    ("Reportes", "Tab:Reportes:ComprasProveedor", "Acceso a Compras por Proveedor"),
    ("Reportes", "Tab:Reportes:CuentasPagar", "Acceso al reporte Cuentas por Pagar"),
    ("Reportes", "Tab:Reportes:StockBajo", "Acceso al reporte Productos Bajo Mínimo"),
    ("Reportes", "Tab:Reportes:Movimientos", "Acceso al Resumen de Movimientos"),
    ("Reportes", "Tab:Reportes:InventarioValorizado", "Acceso al Inventario Valorizado"),
    ("Reportes", "Tab:Reportes:LoginResumen", "Acceso al Resumen de Logins"),
    ("Reportes", "Tab:Reportes:UsuariosActivos", "Acceso al reporte Usuarios Más Activos"),
    ("Reportes", "Tab:Reportes:Bitacora", "Acceso a la Bitácora de Actividades"),
    ("Reportes", "Tab:Reportes:CuentasActivas", "Acceso al reporte Cuentas Activas"),
    ("Reportes", "Tab:Reportes:CuentasInactivas", "Acceso al reporte Cuentas Inactivas"),
    ("Reportes", "Tab:Reportes:UsuariosPorFecha", "Acceso al reporte Usuarios por Fecha"),
    ("Reportes", "Tab:Reportes:UsuariosBuscar", "Acceso a Búsqueda Inteligente de Usuarios"),
    ("Usuarios", "Tab:Usuarios:Usuarios", "Acceso a la pestaña Usuarios"),
    ("Usuarios", "Tab:Usuarios:Empleados", "Acceso a la pestaña Empleados"),
    ("Usuarios", "Tab:Usuarios:Roles", "Acceso a la pestaña Roles y Permisos"),
    ("Usuarios", "Tab:Usuarios:Pagos", "Acceso a la pestaña Pagos"),
    ("Usuarios", "Tab:Usuarios:Catalogos", "Acceso a la pestaña Catálogos"),
    ("Usuarios", "Tab:Usuarios:Bitacora", "Acceso a la pestaña Bitácora de Usuarios"),
    ("Configuracion", "Tab:Configuracion:General", "Acceso a Configuración General"),
    ("Configuracion", "Tab:Configuracion:Ubicaciones", "Acceso a Ubicaciones"),
    ("Configuracion", "Tab:Configuracion:Metas", "Acceso a Metas Financieras"),
)


def _filtrar_por_estado(query, modelo, estado: str):
    """Helper para no repetir el mismo if/elif de activos/inactivos/todos en cada router."""
    if estado == "activos":
        return query.filter(modelo.activo == 1)
    if estado == "inactivos":
        return query.filter(modelo.activo == 0)
    return query


def _aplicar_orden(query, modelo, orden_por: str, orden_direccion: str, campos_permitidos: set):
    if not orden_por or orden_por not in campos_permitidos:
        return query
    columna = getattr(modelo, orden_por)
    return query.order_by(columna.desc() if orden_direccion == "desc" else columna.asc())


def _asegurar_permisos_operativos(db: Session) -> None:
    """Registra permisos CRUD por cada sección del catálogo de inventario."""
    modulos = {
        "Productos": "Gestión de productos",
        "Categorias": "Gestión de categorías",
        "Marcas": "Gestión de marcas",
        "Unidades": "Gestión de unidades de medida",
    }
    acciones = {
        "Ver": "Ver registros",
        "Crear": "Agregar registros",
        "Editar": "Modificar registros",
        "Eliminar": "Inactivar o reactivar registros",
    }
    modulos_existentes = {
        (modulo.nombre or "").strip().lower(): modulo
        for modulo in db.query(Modulo).all()
    }
    permisos_existentes = {
        (permiso.id_modulo, (permiso.nombre or "").strip().lower())
        for permiso in db.query(Permiso).all()
    }
    cambios = False

    for nombre_modulo, descripcion_modulo in modulos.items():
        modulo = modulos_existentes.get(nombre_modulo.lower())
        if modulo is None:
            modulo = Modulo(nombre=nombre_modulo, descripcion=descripcion_modulo)
            db.add(modulo)
            db.flush()
            modulos_existentes[nombre_modulo.lower()] = modulo
            cambios = True

        for nombre_accion, descripcion_accion in acciones.items():
            clave = (modulo.id, nombre_accion.lower())
            if clave in permisos_existentes:
                continue
            db.add(
                Permiso(
                    nombre=nombre_accion,
                    descripcion=f"{descripcion_accion} ({descripcion_modulo.lower()})",
                    id_modulo=modulo.id,
                )
            )
            permisos_existentes.add(clave)
            cambios = True

    if cambios:
        db.commit()


def _asegurar_permisos_pestanas(db: Session) -> None:
    """Registra permisos de pestañas sin concederlos automáticamente a los roles."""
    modulos = {
        (modulo.nombre or "").strip().lower(): modulo
        for modulo in db.query(Modulo).all()
    }
    permisos_existentes = {
        (permiso.id_modulo, (permiso.nombre or "").strip().lower()): permiso
        for permiso in db.query(Permiso).all()
    }
    cambios = False

    for nombre_modulo, nombre_permiso, descripcion in PERMISOS_PESTANAS:
        modulo = modulos.get(nombre_modulo.lower())
        if modulo is None and nombre_modulo.lower() == "caja":
            modulo = modulos.get("ventas")
        if modulo is None:
            logger.warning(
                "No se puede registrar el permiso de pestaña %s: falta el módulo %s",
                nombre_permiso,
                nombre_modulo,
            )
            continue

        clave_permiso = (modulo.id, nombre_permiso.lower())
        permiso = permisos_existentes.get(clave_permiso)
        if permiso is None:
            permiso = Permiso(
                nombre=nombre_permiso,
                descripcion=descripcion,
                id_modulo=modulo.id,
            )
            db.add(permiso)
            db.flush()
            permisos_existentes[clave_permiso] = permiso
            cambios = True

    if cambios:
        db.commit()


ORDEN_USUARIO_PERMITIDO = {"id", "nombre_usuario", "fecha_creacion", "fecha_ultimo_acceso", "activo"}


# ===================================================================
# USUARIO
# ===================================================================

@router.get("", response_model=List[UsuarioResponse])
def listar_usuarios(
    estado: Literal["activos", "inactivos", "todos"] = "activos",
    buscar: Optional[str] = None,
    orden_por: Optional[str] = None,
    orden_direccion: Literal["asc", "desc"] = "asc",
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """
    buscar: coincidencia en nombre_usuario.
    orden_por: uno de id, nombre_usuario, fecha_creacion, fecha_ultimo_acceso, activo.
    Paginado: ?skip=0&limit=50 (default), máximo 200 por página.
    """
    query = _filtrar_por_estado(db.query(Usuario), Usuario, estado)
    if buscar:
        query = query.filter(Usuario.nombre_usuario.ilike(f"%{buscar}%"))
    query = _aplicar_orden(query, Usuario, orden_por, orden_direccion, ORDEN_USUARIO_PERMITIDO)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router.get("/mis-permisos", response_model=List[PermisoResponse])
def obtener_mis_permisos(usuario_actual: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Devuelve los permisos del usuario que inició sesión (según su token).
    IMPORTANTE: esta ruta debe declararse ANTES de '/{usuario_id}' -- si no,
    FastAPI intentaría interpretar 'mis-permisos' como si fuera un usuario_id.
    """
    _asegurar_permisos_operativos(db)
    _asegurar_permisos_pestanas(db)
    if not usuario_actual.id_rol:
        return []
    permisos = (
        db.query(Permiso)
        .join(RolPermiso, RolPermiso.id_permiso == Permiso.id)
        .filter(RolPermiso.id_rol == usuario_actual.id_rol)
        .all()
    )
    # Se agrega el nombre del modulo a cada permiso (no viene de la tabla
    # permiso) para que el frontend pueda revisar "modulo + accion" sin
    # tener que cargar por separado el catalogo de modulos.
    modulos_por_id = {m.id: m.nombre for m in db.query(Modulo).all()}
    for p in permisos:
        p.modulo_nombre = modulos_por_id.get(p.id_modulo)
    return permisos


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("", response_model=UsuarioResponse, status_code=201)
def crear_usuario(datos: UsuarioCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
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
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Usuario",
        detalle=f"Creó el usuario '{datos.nombre_usuario}'",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Editar"))):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True)
    if "password" in datos_dict:
        datos_dict["password"] = hash_password(datos_dict["password"])

    for campo, valor in datos_dict.items():
        setattr(usuario, campo, valor)

    campos_log = {k: v for k, v in datos_dict.items() if k != "password"}
    cambios_texto = ", ".join(f"{campo}: {valor}" for campo, valor in campos_log.items())
    if "password" in datos_dict:
        cambios_texto = (cambios_texto + ", " if cambios_texto else "") + "contraseña actualizada"
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Usuario",
        detalle=f"Actualizó el usuario '{usuario.nombre_usuario}' ({cambios_texto or 'sin cambios'})",
    )
    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", response_model=UsuarioResponse)
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Eliminar"))):
    """Baja lógica: activo pasa de 1 a 0 (el usuario ya no puede iniciar sesión)."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = 0
    registrar_actividad(
        db, usuario_actual.id, "ELIMINAR", "Usuario",
        detalle=f"Desactivó el usuario '{usuario.nombre_usuario}'",
    )
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{usuario_id}/reactivar", response_model=UsuarioResponse)
def reactivar_usuario(usuario_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Eliminar"))):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = 1
    usuario.intentos_fallidos = 0
    registrar_actividad(
        db, usuario_actual.id, "REACTIVAR", "Usuario",
        detalle=f"Reactivó el usuario '{usuario.nombre_usuario}'",
    )
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
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """buscar: coincidencia en nombre o DPI. Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = _filtrar_por_estado(db.query(Empleado), Empleado, estado)
    if buscar:
        like = f"%{buscar}%"
        query = query.filter((Empleado.nombre.ilike(like)) | (Empleado.dpi.ilike(like)))
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_empleado.get("/{empleado_id}", response_model=EmpleadoResponse)
def obtener_empleado(empleado_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado


def _dpi_repetido(db: Session, dpi, excluir_id=None):
    """Busca otro empleado con el mismo DPI, sin importar espacios o guiones."""
    digitos = solo_digitos(dpi)
    if not digitos:
        return None
    columna = func.replace(func.replace(Empleado.dpi, " ", ""), "-", "")
    query = db.query(Empleado).filter(columna == digitos)
    if excluir_id is not None:
        query = query.filter(Empleado.id != excluir_id)
    return query.first()


@router_empleado.post("", response_model=EmpleadoResponse, status_code=201)
def crear_empleado(datos: EmpleadoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
    existente = _dpi_repetido(db, datos.dpi)
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe un empleado con ese DPI ({existente.nombre})")

    nuevo = Empleado(**datos.model_dump(), activo=1)
    db.add(nuevo)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Empleado",
        detalle=f"Creó el empleado '{datos.nombre}' (DPI {datos.dpi})",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_empleado.put("/{empleado_id}", response_model=EmpleadoResponse)
def actualizar_empleado(empleado_id: int, datos: EmpleadoUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Editar"))):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    cambios = datos.model_dump(exclude_unset=True)
    # El DPI solo se valida si cambió: así un empleado viejo con DPI mal
    # guardado se puede seguir editando sin tocarle el DPI.
    if "dpi" in cambios:
        if solo_digitos(cambios["dpi"]) == solo_digitos(empleado.dpi):
            cambios.pop("dpi")
        else:
            try:
                cambios["dpi"] = validar_dpi(cambios["dpi"])
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e))
            if not cambios["dpi"]:
                raise HTTPException(status_code=422, detail="El DPI es obligatorio")
            existente = _dpi_repetido(db, cambios["dpi"], excluir_id=empleado_id)
            if existente:
                raise HTTPException(status_code=400, detail=f"Ya existe otro empleado con ese DPI ({existente.nombre})")
    for campo, valor in cambios.items():
        setattr(empleado, campo, valor)

    cambios_texto = ", ".join(f"{campo}: {valor}" for campo, valor in cambios.items()) or "sin cambios"
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Empleado",
        detalle=f"Actualizó el empleado '{empleado.nombre}' ({cambios_texto})",
    )
    db.commit()
    db.refresh(empleado)
    return empleado


@router_empleado.delete("/{empleado_id}", response_model=EmpleadoResponse)
def eliminar_empleado(empleado_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Eliminar"))):
    """Baja lógica: activo pasa de 1 a 0."""
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    empleado.activo = 0
    registrar_actividad(
        db, usuario_actual.id, "ELIMINAR", "Empleado",
        detalle=f"Desactivó el empleado '{empleado.nombre}'",
    )
    db.commit()
    db.refresh(empleado)
    return empleado


@router_empleado.patch("/{empleado_id}/reactivar", response_model=EmpleadoResponse)
def reactivar_empleado(empleado_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Eliminar"))):
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    empleado.activo = 1
    registrar_actividad(
        db, usuario_actual.id, "REACTIVAR", "Empleado",
        detalle=f"Reactivó el empleado '{empleado.nombre}'",
    )
    db.commit()
    db.refresh(empleado)
    return empleado


# ===================================================================
# ROL (catálogo, sin 'activo' -> CRUD simple, sin baja lógica)
# ===================================================================

@router_rol.get("", response_model=List[RolResponse])
def listar_roles(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    return db.query(Rol).all()


@router_rol.post("", response_model=RolResponse, status_code=201)
def crear_rol(datos: RolCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
    existente = db.query(Rol).filter(Rol.nombre == datos.nombre).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un rol con este nombre")

    nuevo = Rol(**datos.model_dump())
    db.add(nuevo)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Rol",
        detalle=f"Creó el rol '{datos.nombre}'",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router_rol.put("/{rol_id}", response_model=RolResponse)
def actualizar_rol(rol_id: int, datos: RolUpdate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Editar"))):
    """Edita nombre/descripcion/nivel de un rol existente."""
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True)
    if datos_dict.get("nombre"):
        existente = db.query(Rol).filter(
            Rol.nombre == datos_dict["nombre"], Rol.id != rol_id
        ).first()
        if existente:
            raise HTTPException(status_code=400, detail="Ya existe otro rol con este nombre")

    for campo, valor in datos_dict.items():
        setattr(rol, campo, valor)

    cambios_texto = ", ".join(f"{campo}: {valor}" for campo, valor in datos_dict.items()) or "sin cambios"
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Rol",
        detalle=f"Actualizó el rol '{rol.nombre}' ({cambios_texto})",
    )
    db.commit()
    db.refresh(rol)
    return rol


@router_rol.delete("/{rol_id}", status_code=204)
def eliminar_rol(rol_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Eliminar"))):
    """
    Elimina un rol de forma DEFINITIVA (Rol es un catálogo simple, sin baja
    lógica). No se permite si todavía hay usuarios con este rol asignado --
    hay que reasignarlos o quitarles el rol primero. Borra en cascada los
    permisos asignados a este rol (RolPermiso), ya que sin el rol esas
    filas no tienen sentido.
    """
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    usuarios_con_este_rol = db.query(Usuario).filter(Usuario.id_rol == rol_id).count()
    if usuarios_con_este_rol > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar: hay {usuarios_con_este_rol} usuario(s) con este rol asignado. Reasígnalos o quítales el rol primero.",
        )

    nombre_rol_eliminado = rol.nombre
    db.query(RolPermiso).filter(RolPermiso.id_rol == rol_id).delete()
    db.delete(rol)
    registrar_actividad(
        db, usuario_actual.id, "ELIMINAR", "Rol",
        detalle=f"Eliminó el rol '{nombre_rol_eliminado}'",
    )
    db.commit()


@router_rol.get("/{rol_id}/permisos", response_model=List[RolPermisoResponse])
def listar_permisos_de_rol(rol_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return db.query(RolPermiso).filter(RolPermiso.id_rol == rol_id).all()


@router_rol.get("/{rol_id}/permisos-detalle", response_model=List[PermisoResponse])
def listar_permisos_detalle_de_rol(rol_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    """
    Igual que /permisos, pero devuelve el permiso COMPLETO (nombre,
    descripcion, id_modulo) en vez de solo los ids crudos de la tabla de
    asignacion. Pensado para pantallas que necesitan mostrar el nombre del
    permiso directamente, sin tener que cruzarlo a mano con /permisos.
    """
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return (
        db.query(Permiso)
        .join(RolPermiso, RolPermiso.id_permiso == Permiso.id)
        .filter(RolPermiso.id_rol == rol_id)
        .all()
    )


@router_rol.post("/permisos", response_model=RolPermisoResponse, status_code=201)
def asignar_permiso_a_rol(datos: RolPermisoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Editar"))):
    """Asigna un permiso existente a un rol existente."""
    rol = db.query(Rol).filter(Rol.id == datos.id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    permiso = db.query(Permiso).filter(Permiso.id == datos.id_permiso).first()
    if not permiso:
        raise HTTPException(status_code=404, detail="Permiso no encontrado")

    modulo = db.query(Modulo).filter(Modulo.id == permiso.id_modulo).first()
    nombre_permiso = f"{modulo.nombre} - {permiso.nombre}" if modulo else permiso.nombre

    nueva_asignacion = RolPermiso(**datos.model_dump())
    db.add(nueva_asignacion)
    registrar_actividad(
        db, usuario_actual.id, "EDITAR", "Rol",
        detalle=f"Asignó el permiso '{nombre_permiso}' al rol '{rol.nombre}'",
    )
    db.commit()
    db.refresh(nueva_asignacion)
    return nueva_asignacion


@router_rol.delete("/permisos/{rol_permiso_id}", status_code=204)
def quitar_permiso_de_rol(rol_permiso_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Editar"))):
    """Aquí sí se borra el registro real (es solo una relación, no un catálogo)."""
    asignacion = db.query(RolPermiso).filter(RolPermiso.id == rol_permiso_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    rol = db.query(Rol).filter(Rol.id == asignacion.id_rol).first()
    permiso = db.query(Permiso).filter(Permiso.id == asignacion.id_permiso).first()
    modulo = db.query(Modulo).filter(Modulo.id == permiso.id_modulo).first() if permiso else None
    nombre_rol = rol.nombre if rol else f"id={asignacion.id_rol}"
    nombre_permiso = (
        f"{modulo.nombre} - {permiso.nombre}"
        if modulo and permiso
        else (permiso.nombre if permiso else f"id={asignacion.id_permiso}")
    )

    detalle_quitar = f"Quitó el permiso '{nombre_permiso}' del rol '{nombre_rol}'"
    db.delete(asignacion)
    registrar_actividad(db, usuario_actual.id, "EDITAR", "Rol", detalle=detalle_quitar)
    db.commit()


# ===================================================================
# PUESTO (catálogo simple)
# ===================================================================

@router_puesto.get("", response_model=List[PuestoResponse])
def listar_puestos(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    return db.query(Puesto).all()


@router_puesto.post("", response_model=PuestoResponse, status_code=201)
def crear_puesto(datos: PuestoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
    from app.catalogos import validar_nombre_unico
    datos.nombre = validar_nombre_unico(db, Puesto, datos.nombre, "un puesto")
    nuevo = Puesto(**datos.model_dump())
    db.add(nuevo)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Puesto",
        detalle=f"Creó el puesto '{datos.nombre}'",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# TURNO (catálogo simple)
# ===================================================================

@router_turno.get("", response_model=List[TurnoResponse])
def listar_turnos(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    return db.query(Turno).all()


@router_turno.post("", response_model=TurnoResponse, status_code=201)
def crear_turno(datos: TurnoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
    from app.catalogos import validar_nombre_unico
    datos.nombre = validar_nombre_unico(db, Turno, datos.nombre, "un turno")
    nuevo = Turno(**datos.model_dump())
    db.add(nuevo)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Turno",
        detalle=f"Creó el turno '{datos.nombre}'",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# MODULO (catálogo simple)
# ===================================================================

@router_modulo.get("", response_model=List[ModuloResponse])
def listar_modulos(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    return db.query(Modulo).order_by(Modulo.orden).all()


@router_modulo.post("", response_model=ModuloResponse, status_code=201)
def crear_modulo(datos: ModuloCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
    from app.catalogos import validar_nombre_unico
    datos.nombre = validar_nombre_unico(db, Modulo, datos.nombre, "un módulo")
    nuevo = Modulo(**datos.model_dump())
    db.add(nuevo)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Modulo",
        detalle=f"Creó el módulo '{datos.nombre}'",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# PERMISO (catálogo simple)
# ===================================================================

@router_permiso.get("", response_model=List[PermisoResponse])
def listar_permisos(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    _asegurar_permisos_operativos(db)
    _asegurar_permisos_pestanas(db)
    return db.query(Permiso).all()


@router_permiso.post("", response_model=PermisoResponse, status_code=201)
def crear_permiso(datos: PermisoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
    nuevo = Permiso(**datos.model_dump())
    db.add(nuevo)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "Permiso",
        detalle=f"Creó el permiso '{datos.nombre}'",
    )
    db.commit()
    db.refresh(nuevo)

    return nuevo


# ===================================================================
# HISTORICO_PAGO_EMPLEADO (solo se crea y se lista; no tiene sentido editar/borrar un pago ya hecho)
# ===================================================================

@router_pago.get("", response_model=List[HistoricoPagoEmpleadoResponse])
def listar_pagos(
    id_empleado: Optional[int] = None,
    buscar: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    paginacion: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Filtra por fecha_desde/fecha_hasta (sobre fecha_pago). Paginado: ?skip=0&limit=50 (default), máximo 200 por página."""
    query = db.query(HistoricoPagoEmpleado).order_by(HistoricoPagoEmpleado.fecha_pago.desc())
    if id_empleado is not None:
        query = query.filter(HistoricoPagoEmpleado.id_empleado == id_empleado)
    if buscar:
        patron = f"%{buscar.strip()}%"
        ids_empleado = db.query(Empleado.id).filter(Empleado.nombre.ilike(patron))
        query = query.filter(or_(
            HistoricoPagoEmpleado.concepto.ilike(patron),
            HistoricoPagoEmpleado.periodo.ilike(patron),
            HistoricoPagoEmpleado.referencia.ilike(patron),
            HistoricoPagoEmpleado.id_empleado.in_(ids_empleado),
        ))
    if fecha_desde is not None:
        query = query.filter(func.date(HistoricoPagoEmpleado.fecha_pago) >= fecha_desde)
    if fecha_hasta is not None:
        query = query.filter(func.date(HistoricoPagoEmpleado.fecha_pago) <= fecha_hasta)
    return query.offset(paginacion.skip).limit(paginacion.limit).all()


@router_pago.post("", response_model=HistoricoPagoEmpleadoResponse, status_code=201)
def registrar_pago(datos: HistoricoPagoEmpleadoCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(requiere_permiso("Usuarios", "Crear"))):
    empleado = db.query(Empleado).filter(Empleado.id == datos.id_empleado).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    if float(datos.monto or 0) <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a Q0.00")

    nuevo = HistoricoPagoEmpleado(**datos.model_dump())
    db.add(nuevo)
    registrar_actividad(
        db, usuario_actual.id, "CREAR", "HistoricoPagoEmpleado",
        detalle=f"Registró un pago de Q{datos.monto} ({datos.concepto}) al empleado '{empleado.nombre}'",
    )
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ===================================================================
# LOG_ACTIVIDAD (solo lectura vía API; el sistema lo escribe internamente)
# ===================================================================

@router_log.get("", response_model=List[LogActividadResponse])
def listar_logs(id_usuario: int | None = None, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_user)):
    query = db.query(LogActividad).order_by(LogActividad.fecha.desc())
    if id_usuario is not None:
        query = query.filter(LogActividad.id_usuario == id_usuario)
    return query.limit(200).all()