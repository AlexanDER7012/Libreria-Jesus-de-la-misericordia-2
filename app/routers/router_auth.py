from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import verify_password, create_access_token, decode_access_token
from app.models.model_usuario import Usuario, LogActividad
from app.schemas.schema_auth import LoginRequest, TokenResponse

router = APIRouter()

MAX_INTENTOS_FALLIDOS = 5

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


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


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    payload = decode_access_token(token)
    usuario_id = payload.get("sub")
    if usuario_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario = db.query(Usuario).filter(Usuario.id == int(usuario_id)).first()
    if not usuario or usuario.activo == 0:
        raise HTTPException(status_code=401, detail="Usuario no válido o inactivo")
    return usuario
