import hmac
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from app.bitacora import limpiar_bitacora_antigua
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.security import (
    verify_password, create_access_token, get_current_user, hash_password,
    huella_password, crear_token_autorizacion_admin,
)  # noqa: F401 - re-exportado, por si algo lo sigue importando desde aqui
from app.models.model_usuario import (
    Usuario, LogActividad, Rol, RolPermiso, Modulo, Permiso,
)
from app.schemas.schema_auth import (
    AdminRecoveryRequest, AdminRecoveryStatus, LoginRequest, TokenResponse,
)

from app.schemas.schema_auth import VerificarAdminResponse
from app.timezone import now_gt_naive

router = APIRouter()

MAX_INTENTOS_FALLIDOS = 5
# Después de este tiempo sin intentos, el usuario bloqueado se desbloquea solo.
# Antes el bloqueo era para siempre: cualquiera podía bloquear al administrador
# escribiendo 5 veces mal su contraseña y nadie más podía desbloquearlo.
MINUTOS_BLOQUEO = 15
# Hash de relleno: cuando el usuario no existe se compara contra este para que
# la respuesta tarde lo mismo (antes, por el tiempo, se sabía si el usuario existía).
_HASH_RELLENO = hash_password("relleno-para-usuario-inexistente")
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


def _password_correcta(password_plano: str, password_hash: str) -> bool:
    """Compara la contraseña sin tronar: antes una contraseña muy larga daba error 500."""
    try:
        return verify_password((password_plano or "").strip(), password_hash)
    except Exception:
        return False


def _mensaje_bloqueado(usuario: Usuario) -> str:
    return (
        f"Usuario bloqueado por demasiados intentos fallidos. Espera {MINUTOS_BLOQUEO} minutos "
        "o pide a un administrador que lo desbloquee."
    )


def _desbloquear_si_ya_paso_el_tiempo(db: Session, usuario: Usuario):
    """Si el último intento fallido fue hace más de MINUTOS_BLOQUEO, reinicia el contador."""
    if (usuario.intentos_fallidos or 0) < MAX_INTENTOS_FALLIDOS:
        return
    ultimo = (
        db.query(func.max(LogActividad.fecha))
        .filter(LogActividad.id_usuario == usuario.id, LogActividad.accion == "LOGIN_FALLIDO")
        .scalar()
    )
    if ultimo is None or now_gt_naive() - ultimo >= timedelta(minutes=MINUTOS_BLOQUEO):
        usuario.intentos_fallidos = 0
        db.commit()


def _reservar_intento(db: Session, usuario: Usuario) -> bool:
    """
    Suma el intento ANTES de revisar la contraseña, en una sola instrucción
    de la base de datos. Antes se leía y luego se sumaba: mandando 20
    intentos al mismo tiempo solo se contaban 2, así que se podían probar
    contraseñas sin que se bloqueara nunca. Devuelve False si ya está bloqueado.
    """
    filas = (
        db.query(Usuario)
        .filter(
            Usuario.id == usuario.id,
            func.coalesce(Usuario.intentos_fallidos, 0) < MAX_INTENTOS_FALLIDOS,
        )
        .update(
            {Usuario.intentos_fallidos: func.coalesce(Usuario.intentos_fallidos, 0) + 1},
            synchronize_session=False,
        )
    )
    db.commit()
    db.refresh(usuario)
    return filas == 1


def _validar_credenciales(db: Session, datos: LoginRequest, donde: str) -> Usuario:
    """Revisa usuario y contraseña (login y autorizaciones de administrador)."""
    usuario = _buscar_usuario(db, datos.nombre_usuario)
    if not usuario:
        _password_correcta(datos.password, _HASH_RELLENO)  # mismo tiempo de respuesta
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if usuario.activo == 0:
        raise HTTPException(status_code=403, detail="Este usuario está inactivo. Contacta al administrador.")

    _desbloquear_si_ya_paso_el_tiempo(db, usuario)
    if not _reservar_intento(db, usuario):
        raise HTTPException(status_code=403, detail=_mensaje_bloqueado(usuario))

    if not _password_correcta(datos.password, usuario.password):
        db.add(LogActividad(
            id_usuario=usuario.id, accion="LOGIN_FALLIDO", modulo="auth", fecha=now_gt_naive(),
            detalles=f"Contraseña incorrecta para '{usuario.nombre_usuario}' en {donde} (intento #{usuario.intentos_fallidos})",
        ))
        db.commit()
        restantes = MAX_INTENTOS_FALLIDOS - (usuario.intentos_fallidos or 0)
        if restantes <= 0:
            raise HTTPException(status_code=403, detail=_mensaje_bloqueado(usuario))
        if restantes <= 3:
            raise HTTPException(
                status_code=401,
                detail=f"Usuario o contraseña incorrectos. Te queda{'n' if restantes > 1 else ''} {restantes} intento{'s' if restantes > 1 else ''} antes de que se bloquee el usuario.",
            )
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    usuario.intentos_fallidos = 0
    return usuario


def _token_de(usuario: Usuario) -> str:
    return create_access_token(data={
        "sub": str(usuario.id),
        "nombre_usuario": usuario.nombre_usuario,
        # Si le cambian la contraseña, este dato ya no coincide y las sesiones
        # abiertas con la contraseña anterior se cierran.
        "pv": huella_password(usuario.password),
    })


@router.post("", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = _validar_credenciales(db, datos, "el inicio de sesión")

    # Login correcto
    usuario.fecha_ultimo_acceso = now_gt_naive()
    db.add(LogActividad(
        id_usuario=usuario.id, accion="LOGIN", modulo="auth",
        detalles=f"Inicio de sesión de '{usuario.nombre_usuario}'",
    ))
    db.commit()

    # Borra la bitácora vieja según Configuración (máximo una vez al día)
    limpiar_bitacora_antigua(db, id_usuario=usuario.id)

    return TokenResponse(
        access_token=_token_de(usuario),
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
    return TokenResponse(
        access_token=_token_de(usuario_actual),
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
    Devuelve una autorización que dura 2 minutos. El servidor la exige en las
    acciones delicadas (antes la autorización solo se revisaba en la pantalla y
    se podía saltar llamando al servidor directamente)."""
    usuario = _validar_credenciales(db, datos, "una autorización de administrador")
    db.commit()
    if not _es_admin(usuario):
        raise HTTPException(status_code=403, detail="El usuario no tiene rol de Administrador")
    return VerificarAdminResponse(
        autorizado=True,
        mensaje=f"Autorizado por {usuario.nombre_usuario}",
        token_autorizacion=crear_token_autorizacion_admin(usuario),
    )
