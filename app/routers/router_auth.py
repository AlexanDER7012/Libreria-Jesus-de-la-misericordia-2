import hmac
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from app.bitacora import limpiar_bitacora_antigua
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.security import (
    verify_password, create_access_token, get_current_user, hash_password,
)  # noqa: F401 - re-exportado, por si algo lo sigue importando desde aqui
from app.models.model_usuario import (
    Usuario, LogActividad, Rol, RolPermiso, Modulo, Permiso,
)
from app.schemas.schema_auth import (
    AdminRecoveryRequest, AdminRecoveryStatus, LoginRequest, TokenResponse,
)

from app.schemas.schema_auth import VerificarAdminResponse

router = APIRouter()

MAX_INTENTOS_FALLIDOS = 5
USUARIO_RECUPERACION_ADMIN = "soporte_admin"
ROL_ADMINISTRADOR = "Administrador"


def _clave_recuperacion_configurada() -> bool:
    clave = settings.ADMIN_RECOVERY_KEY
    return bool(clave and len(clave) >= 32)


def _recuperacion_disponible(db: Session) -> bool:
    return _clave_recuperacion_configurada() and (
        db.query(Usuario)
        .filter(func.lower(Usuario.nombre_usuario) == USUARIO_RECUPERACION_ADMIN)
        .first()
        is None
    )


@router.get("/recuperacion-admin/disponible", response_model=AdminRecoveryStatus)
def estado_recuperacion_admin(db: Session = Depends(get_db)):
    return AdminRecoveryStatus(disponible=_recuperacion_disponible(db))


@router.post("/recuperacion-admin", status_code=status.HTTP_201_CREATED)
def recuperar_admin(datos: AdminRecoveryRequest, db: Session = Depends(get_db)):
    clave_configurada = settings.ADMIN_RECOVERY_KEY
    if not _clave_recuperacion_configurada():
        raise HTTPException(status_code=404, detail="La recuperación de administrador no está habilitada")
    if not hmac.compare_digest(
        datos.clave_recuperacion.encode("utf-8"),
        clave_configurada.encode("utf-8"),
    ):
        raise HTTPException(status_code=403, detail="Clave de recuperación incorrecta")
    if not _recuperacion_disponible(db):
        raise HTTPException(status_code=409, detail="La recuperación ya fue utilizada")

    from app.routers.router_usuario import (
        _asegurar_permisos_operativos,
        _asegurar_permisos_pestanas,
    )

    _asegurar_permisos_operativos(db)
    _asegurar_permisos_pestanas(db)

    rol = (
        db.query(Rol)
        .filter(func.lower(Rol.nombre) == ROL_ADMINISTRADOR.lower())
        .first()
    )
    if rol is None:
        rol = Rol(nombre=ROL_ADMINISTRADOR, descripcion="Acceso administrativo total")
        db.add(rol)
        db.flush()

    modulos = db.query(Modulo).all()
    permisos_por_modulo = {
        (permiso.id_modulo, (permiso.nombre or "").lower()): permiso
        for permiso in db.query(Permiso).all()
    }
    for modulo in modulos:
        for accion in ("Ver", "Crear", "Editar", "Eliminar"):
            clave_permiso = (modulo.id, accion.lower())
            if clave_permiso not in permisos_por_modulo:
                permiso = Permiso(
                    nombre=accion,
                    descripcion=f"Permiso {accion.lower()} en {modulo.nombre or 'el módulo'}",
                    id_modulo=modulo.id,
                )
                db.add(permiso)
                db.flush()
                permisos_por_modulo[clave_permiso] = permiso

    usuario_admin = Usuario(
        nombre_usuario=USUARIO_RECUPERACION_ADMIN,
        password=hash_password(datos.password),
        id_rol=rol.id,
        activo=1,
        intentos_fallidos=0,
    )
    db.add(usuario_admin)
    db.flush()

    asignaciones = {
        asignacion.id_permiso
        for asignacion in db.query(RolPermiso).filter(RolPermiso.id_rol == rol.id).all()
    }
    for permiso in db.query(Permiso).all():
        if permiso.id not in asignaciones:
            db.add(RolPermiso(id_rol=rol.id, id_permiso=permiso.id))

    db.add(LogActividad(
        id_usuario=usuario_admin.id,
        accion="RECUPERACION_ADMIN",
        modulo="auth",
        detalles="Se creó la cuenta de recuperación con permisos administrativos totales",
    ))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="La recuperación ya fue utilizada o el usuario ya existe",
        )

    return {
        "mensaje": "Cuenta de administrador creada. Inicia sesión con el usuario soporte_admin.",
        "nombre_usuario": USUARIO_RECUPERACION_ADMIN,
    }


def _buscar_usuario(db: Session, nombre_usuario: str):
    """Busca el usuario sin importar mayúsculas ni espacios al inicio/final."""
    nombre = (nombre_usuario or "").strip()
    return db.query(Usuario).filter(func.lower(Usuario.nombre_usuario) == nombre.lower()).first()


def _registrar_intento_fallido(db: Session, usuario: Usuario, donde: str) -> HTTPException:
    """Suma un intento fallido y devuelve el error a mostrar (con los intentos que quedan)."""
    usuario.intentos_fallidos = (usuario.intentos_fallidos or 0) + 1
    db.add(LogActividad(
        id_usuario=usuario.id, accion="LOGIN_FALLIDO", modulo="auth",
        detalles=f"Contraseña incorrecta para '{usuario.nombre_usuario}' en {donde} (intento #{usuario.intentos_fallidos})",
    ))
    db.commit()
    restantes = MAX_INTENTOS_FALLIDOS - usuario.intentos_fallidos
    if restantes <= 0:
        return HTTPException(
            status_code=403,
            detail="Usuario bloqueado por demasiados intentos fallidos. Contacta al administrador para desbloquearlo.",
        )
    if restantes <= 3:
        return HTTPException(
            status_code=401,
            detail=f"Usuario o contraseña incorrectos. Te queda{'n' if restantes > 1 else ''} {restantes} intento{'s' if restantes > 1 else ''} antes de que se bloquee el usuario.",
        )
    return HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")


@router.post("", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = _buscar_usuario(db, datos.nombre_usuario)


    credenciales_invalidas = HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not usuario:
        raise credenciales_invalidas

    if usuario.activo == 0:
        raise HTTPException(status_code=403, detail="Este usuario está inactivo. Contacta al administrador.")

    if (usuario.intentos_fallidos or 0) >= MAX_INTENTOS_FALLIDOS:
        raise HTTPException(
            status_code=403,
            detail="Usuario bloqueado por demasiados intentos fallidos. Contacta al administrador para desbloquearlo.",
        )

    if not verify_password(datos.password, usuario.password):
        raise _registrar_intento_fallido(db, usuario, "el inicio de sesión")

    # Login correcto
    usuario.intentos_fallidos = 0
    usuario.fecha_ultimo_acceso = datetime.now()
    db.add(LogActividad(
        id_usuario=usuario.id, accion="LOGIN", modulo="auth",
        detalles=f"Inicio de sesión de '{usuario.nombre_usuario}'",
    ))
    db.commit()

    # Borra la bitácora vieja según Configuración (máximo una vez al día)
    limpiar_bitacora_antigua(db, id_usuario=usuario.id)

    token = create_access_token(data={"sub": str(usuario.id), "nombre_usuario": usuario.nombre_usuario})

    return TokenResponse(
        access_token=token,
        usuario_id=usuario.id,
        nombre_usuario=usuario.nombre_usuario,
        rol=usuario.rol.nombre if usuario.rol else None,
    )


@router.post("/renovar", response_model=TokenResponse)
def renovar_token(usuario_actual: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Emite un token nuevo para el usuario actual, siempre que el token que
    manda en el header Authorization todavía sea válido (get_current_user
    ya lo valida y lanza 401 si expiró o es inválido).

    Se usa desde el frontend cuando detecta que el usuario sigue activo
    (moviendo el mouse, escribiendo, haciendo clic) y quiere extender la
    sesión sin pedirle la contraseña de nuevo. No genera ningún registro
    en bitácora porque no es una acción del usuario, es mantenimiento
    de sesión.
    """
    token = create_access_token(
        data={"sub": str(usuario_actual.id), "nombre_usuario": usuario_actual.nombre_usuario}
    )
    return TokenResponse(
        access_token=token,
        usuario_id=usuario_actual.id,
        nombre_usuario=usuario_actual.nombre_usuario,
        rol=usuario_actual.rol.nombre if usuario_actual.rol else None,
    )


ROLES_ADMIN = ("Administrador", "Dueña")


def _es_admin(usuario: Usuario) -> bool:
    if not usuario or not usuario.rol:
        return False
    return usuario.rol.nombre in ROLES_ADMIN


@router.post("/verificar-admin", response_model=VerificarAdminResponse)
def verificar_admin(datos: LoginRequest, db: Session = Depends(get_db)):
    """Verifica credenciales de un usuario y confirma que sea Administrador o Dueña.
    NO genera token; solo valida. Se usa para autorizar acciones sensibles (ej. eliminar)."""
    # Antes aquí se podía probar contraseñas sin límite; ahora cuenta los
    # intentos fallidos igual que el inicio de sesión.
    usuario = _buscar_usuario(db, datos.nombre_usuario)
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if usuario.activo == 0:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    if (usuario.intentos_fallidos or 0) >= MAX_INTENTOS_FALLIDOS:
        raise HTTPException(status_code=403, detail="Ese usuario está bloqueado por demasiados intentos fallidos")
    if not verify_password(datos.password, usuario.password):
        raise _registrar_intento_fallido(db, usuario, "una autorización de administrador")
    if usuario.intentos_fallidos:
        usuario.intentos_fallidos = 0
        db.commit()
    if not _es_admin(usuario):
        raise HTTPException(status_code=403, detail="El usuario no tiene rol de Administrador")
    return VerificarAdminResponse(autorizado=True, mensaje=f"Autorizado por {usuario.nombre_usuario}")