from sqlalchemy.orm import Session

from app.models.model_usuario import LogActividad

ACCIONES_VALIDAS = {"CREAR", "EDITAR", "ELIMINAR", "CANCELAR", "REACTIVAR", "LOGIN", "LOGIN_FALLIDO"}


def registrar_actividad(db: Session, id_usuario: int, accion: str, modulo: str) -> None:
    """
    Agrega un registro de bitácora a la sesión actual (sin hacer commit).
    id_usuario puede ser None en casos raros (ej. login fallido con un
    nombre_usuario que ni siquiera existe) -- log_actividad.id_usuario
    debe permitir NULL para esos casos.
    """
    if accion not in ACCIONES_VALIDAS:
        # No frenamos la operación principal por un typo en 'accion' --
        # solo avisamos en consola para que se note en desarrollo.
        print(f" registrar_actividad: acción '{accion}' no está en la lista estándar")

    db.add(LogActividad(id_usuario=id_usuario, accion=accion, modulo=modulo))