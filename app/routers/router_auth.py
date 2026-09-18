from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import verify_password, create_access_token, get_current_user  # noqa: F401 - re-exportado, por si algo lo sigue importando desde aqui
from app.models.model_usuario import Usuario, LogActividad
from app.schemas.schema_auth import LoginRequest, TokenResponse

from app.schemas.schema_auth import VerificarAdminResponse

router = APIRouter()

MAX_INTENTOS_FALLIDOS = 5


@router.post("", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.nombre_usuario == datos.nombre_usuario).first()


    credenciales_invalidas = HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not usuario:
        raise credenciales_invalidas

    if usuario.activo == 0:
        raise HTTPException(status_code=403, detail="Este usuario está inactivo. Contacta al administrador.")

    if (usuario.intentos_fallidos or 0) >= MAX_INTENTOS_FALLIDOS:
        raise HTTPException(
            status_code=403,
            detail="Usuario bloqueado por demasiados intentos fallidos. Contacta al administrador para reactivarlo.",
        )

    if not verify_password(datos.password, usuario.password):
        usuario.intentos_fallidos = (usuario.intentos_fallidos or 0) + 1
        db.add(LogActividad(id_usuario=usuario.id, accion="LOGIN_FALLIDO", modulo="auth"))
        db.commit()
        raise credenciales_invalidas

    # Login correcto
    usuario.intentos_fallidos = 0
    usuario.fecha_ultimo_acceso = datetime.now()
    db.add(LogActividad(id_usuario=usuario.id, accion="LOGIN", modulo="auth"))
    db.commit()

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
    usuario = db.query(Usuario).filter(Usuario.nombre_usuario == datos.nombre_usuario).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if usuario.activo == 0:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    if not verify_password(datos.password, usuario.password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if not _es_admin(usuario):
        raise HTTPException(status_code=403, detail="El usuario no tiene rol de Administrador")
    return VerificarAdminResponse(autorizado=True, mensaje=f"Autorizado por {usuario.nombre_usuario}")