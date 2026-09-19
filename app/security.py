"""
app/security.py
------------------
Funciones de seguridad reutilizables en todo el proyecto:
  - hash_password / verify_password: cifrado de contraseñas con bcrypt.
  - create_access_token / decode_access_token: generación y validación de JWT.
  - get_current_user: dependencia para proteger cualquier endpoint (exige
    un token válido en el header 'Authorization: Bearer <token>').
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# tokenUrl es solo referencial (para la doc de /docs); el login real es POST /login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def hash_password(password: str) -> str:
    """Convierte una contraseña en texto plano a su hash bcrypt."""
    return pwd_context.hash(password)


def verify_password(password_plano: str, password_hash: str) -> bool:
    """Compara una contraseña en texto plano contra su hash guardado."""
    return pwd_context.verify(password_plano, password_hash)


def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    """Genera un JWT firmado con SECRET_KEY, válido por ACCESS_TOKEN_EXPIRE_MINUTES (o el valor que se le pase)."""
    to_encode = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Valida el token y devuelve su contenido. Lanza 401 si es inválido o ya expiró."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):

    from app.models.model_usuario import Usuario

    payload = decode_access_token(token)
    usuario_id = payload.get("sub")
    if usuario_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario = db.query(Usuario).filter(Usuario.id == int(usuario_id)).first()
    if not usuario or usuario.activo == 0:
        raise HTTPException(status_code=401, detail="Usuario no válido o inactivo")
    return usuario


def requiere_permiso(modulo: str, accion: str):
    """
    Fábrica de dependencias de FastAPI: exige que el usuario logueado tenga
    asignado, a través de su rol, el permiso "<accion>" del módulo
    "<modulo>" (tal como aparecen en Modulo.nombre y Permiso.nombre).

    Uso (reemplaza a get_current_user en cualquier endpoint que deba
    respetar los permisos configurados en Usuarios > Roles y Permisos):

        @router.post("", response_model=ProductoResponse)
        def crear_producto(
            datos: ProductoCreate,
            db: Session = Depends(get_db),
            usuario_actual: Usuario = Depends(requiere_permiso("Productos", "Crear")),
        ):
            ...

    Si el usuario no tiene rol, o su rol no tiene ese permiso exacto
    asignado, se corta la petición con 403 ANTES de que el endpoint corra
    ninguna lógica -- así que aunque alguien llame al endpoint directo
    (Postman, curl, etc.) sin pasar por el frontend, igual queda bloqueado.
    """

    def _dependencia(
        usuario_actual=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        from app.models.model_usuario import RolPermiso, Permiso, Modulo

        if not usuario_actual.id_rol:
            raise HTTPException(
                status_code=403,
                detail=f"No tienes permiso para '{accion}' en '{modulo}'",
            )

        tiene_permiso = (
            db.query(RolPermiso)
            .join(Permiso, RolPermiso.id_permiso == Permiso.id)
            .join(Modulo, Permiso.id_modulo == Modulo.id)
            .filter(
                RolPermiso.id_rol == usuario_actual.id_rol,
                # Comparacion sin distinguir mayusculas/minusculas: en la
                # base de datos los nombres de modulo/permiso estan en
                # minuscula, pero los routers llaman a esta funcion con
                # nombres capitalizados como "Productos"/"Crear".
                func.lower(Modulo.nombre) == modulo.lower(),
                func.lower(Permiso.nombre) == accion.lower(),
            )
            .first()
        )
        if not tiene_permiso:
            raise HTTPException(
                status_code=403,
                detail=f"No tienes permiso para '{accion}' en '{modulo}'",
            )
        return usuario_actual

    return _dependencia

def requiere_permiso_alguno(pares: list):
    """
    Variante de requiere_permiso() para permisos compartidos entre dos
    o mas modulos (ej. "Tipos de Pago", que se gestiona tanto desde
    Compras como desde Ventas sobre el mismo catalogo). Da acceso si
    el usuario tiene AL MENOS UNO de los pares (modulo, accion).

    Uso:
        usuario_actual: Usuario = Depends(requiere_permiso_alguno([
            ("Compras", "Crear"),
            ("Ventas", "Crear"),
        ])),
    """

    def _dependencia(
        usuario_actual=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        from app.models.model_usuario import RolPermiso, Permiso, Modulo

        detalle = " o ".join(f"'{accion}' en '{modulo}'" for modulo, accion in pares)

        if not usuario_actual.id_rol:
            raise HTTPException(status_code=403, detail=f"No tienes permiso para {detalle}")

        for modulo, accion in pares:
            tiene_permiso = (
                db.query(RolPermiso)
                .join(Permiso, RolPermiso.id_permiso == Permiso.id)
                .join(Modulo, Permiso.id_modulo == Modulo.id)
                .filter(
                    RolPermiso.id_rol == usuario_actual.id_rol,
                    func.lower(Modulo.nombre) == modulo.lower(),
                    func.lower(Permiso.nombre) == accion.lower(),
                )
                .first()
            )
            if tiene_permiso:
                return usuario_actual

        raise HTTPException(status_code=403, detail=f"No tienes permiso para {detalle}")

    return _dependencia