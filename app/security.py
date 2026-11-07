"""
app/security.py
------------------
Funciones de seguridad reutilizables en todo el proyecto:
  - hash_password / verify_password: cifrado de contraseñas con bcrypt.
  - create_access_token / decode_access_token: generación y validación de JWT.
  - get_current_user: dependencia para proteger cualquier endpoint (exige
    un token válido en el header 'Authorization: Bearer <token>').
"""

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
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


def huella_password(password_hash: str) -> str:
    """Huella corta del hash de la contraseña (no permite saber la contraseña).
    Va dentro del token: si la contraseña cambia, los tokens viejos dejan de servir."""
    return hashlib.sha256((password_hash or "").encode("utf-8")).hexdigest()[:16]


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):

    from app.models.model_usuario import Usuario

    payload = decode_access_token(token)
    usuario_id = payload.get("sub")
    # Un token de autorización de administrador no sirve como sesión
    if usuario_id is None or payload.get("tipo") is not None:
        raise HTTPException(status_code=401, detail="Token inválido")

    try:
        usuario = db.query(Usuario).filter(Usuario.id == int(usuario_id)).first()
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido")
    if not usuario or usuario.activo == 0:
        raise HTTPException(status_code=401, detail="Usuario no válido o inactivo")
    # Antes, al cambiarle la contraseña a alguien, quien ya tenía la sesión
    # abierta (o un token robado) seguía entrando hasta que el token vencía.
    if "pv" in payload and payload["pv"] != huella_password(usuario.password):
        raise HTTPException(status_code=401, detail="La contraseña cambió. Vuelve a iniciar sesión.")
    return usuario


MINUTOS_AUTORIZACION_ADMIN = 2


def crear_token_autorizacion_admin(admin) -> str:
    """Autorización corta que da un Administrador/Dueña para una acción delicada."""
    return create_access_token(
        data={"sub_admin": str(admin.id), "tipo": "autorizacion_admin"},
        expires_minutes=MINUTOS_AUTORIZACION_ADMIN,
    )


def requiere_autorizacion_admin(
    x_autorizacion_admin: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Dependencia para acciones que en pantalla piden usuario y contraseña de
    un administrador (cancelar compra, eliminar gasto, caja chica, traslado).
    Antes eso solo se revisaba en la pantalla: con llamar al servidor directo
    se saltaba. Ahora el servidor exige la autorización (header
    X-Autorizacion-Admin) que entrega /login/verificar-admin.
    """
    from app.models.model_usuario import Usuario
    from app.routers.router_auth import _es_admin

    error = HTTPException(
        status_code=403,
        detail="Esta acción necesita la autorización de un administrador. Vuelve a intentarlo.",
    )
    if not x_autorizacion_admin:
        raise error
    try:
        payload = jwt.decode(x_autorizacion_admin, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=403, detail="La autorización del administrador venció. Vuelve a intentarlo.")
    if payload.get("tipo") != "autorizacion_admin":
        raise error
    try:
        admin = db.query(Usuario).filter(Usuario.id == int(payload.get("sub_admin"))).first()
    except (TypeError, ValueError):
        raise error
    if not admin or admin.activo == 0 or not _es_admin(admin):
        raise error
    return admin


# Caja no tiene permisos propios: usa los de Ventas. Quien tiene permisos
# de Ventas puede abrir y cerrar turnos, registrar gastos, etc.
# (debe coincidir con ALIAS_PERMISOS en frontend/js/components.js).
ALIAS_PERMISOS = {
    "caja": "Ventas",
}


def _modulo_real(modulo: str) -> str:
    return ALIAS_PERMISOS.get((modulo or "").strip().lower(), modulo)


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

    modulo = _modulo_real(modulo)

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

    pares = [(_modulo_real(modulo), accion) for modulo, accion in pares]

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



def requiere_permisos_todos(pares: list):
    """Exige que el usuario tenga asignados todos los permisos indicados."""
    pares = [(_modulo_real(modulo), accion) for modulo, accion in pares]

    def _dependencia(
        usuario_actual=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        from app.models.model_usuario import RolPermiso, Permiso, Modulo

        if not usuario_actual.id_rol:
            raise HTTPException(
                status_code=403,
                detail="No tienes todos los permisos necesarios para esta acción",
            )

        faltantes = []
        for modulo, accion in pares:
            asignado = (
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
            if not asignado:
                faltantes.append(f"'{accion}' en '{modulo}'")

        if faltantes:
            raise HTTPException(
                status_code=403,
                detail=f"No tienes permiso para {', '.join(faltantes)}",
            )
        return usuario_actual

    return _dependencia


def requiere_algun_grupo_de_permisos(grupos: list, mensaje: str = "No tienes permiso para esta acción"):
    """
    Da acceso si el usuario tiene COMPLETO al menos uno de los grupos de
    permisos. Ej.: la bitácora se puede ver desde Usuarios (un permiso) o
    desde Reportes (tres permisos):
        requiere_algun_grupo_de_permisos([
            [("Usuarios", "Tab:Usuarios:Bitacora")],
            [("Reportes", "Tab:Reportes:Reportes"), ("Reportes", "Tab:Reportes:Bitacora")],
        ])
    """
    grupos = [[(_modulo_real(m), a) for m, a in grupo] for grupo in grupos]

    def _dependencia(
        usuario_actual=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        from app.models.model_usuario import RolPermiso, Permiso, Modulo

        if usuario_actual.id_rol:
            asignados = {
                ((m or "").lower(), (p or "").lower())
                for m, p in db.query(Modulo.nombre, Permiso.nombre)
                .join(Permiso, Permiso.id_modulo == Modulo.id)
                .join(RolPermiso, RolPermiso.id_permiso == Permiso.id)
                .filter(RolPermiso.id_rol == usuario_actual.id_rol)
                .all()
            }
            for grupo in grupos:
                if all((m.lower(), a.lower()) in asignados for m, a in grupo):
                    return usuario_actual
        raise HTTPException(status_code=403, detail=mensaje)

    return _dependencia


# Bitácora: se ve desde Usuarios > Bitácora o desde Reportes > Usuarios > Bitácora
PERMISO_BITACORA = requiere_algun_grupo_de_permisos(
        [
            [("Usuarios", "Tab:Usuarios:Bitacora")],
            [
                ("Reportes", "Tab:Reportes:Reportes"),
                ("Reportes", "Tab:Reportes:Usuarios"),
                ("Reportes", "Tab:Reportes:Bitacora"),
            ],
        ],
        "No tienes permiso para ver la bitácora",
    )



NOMBRES_ROL_ADMIN = {"administrador", "administradora", "admin", "duena", "dueno"}


def es_rol_admin(nombre_rol) -> bool:
    import unicodedata
    texto = " ".join(str(nombre_rol or "").split()).casefold()
    texto = "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")
    return texto in NOMBRES_ROL_ADMIN


def es_usuario_admin(usuario) -> bool:
    return bool(usuario and usuario.rol and es_rol_admin(usuario.rol.nombre))
