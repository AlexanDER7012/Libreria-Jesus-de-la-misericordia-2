from sqlalchemy.orm import Session

from app.models.model_usuario import LogActividad

ACCIONES_VALIDAS = {"CREAR", "EDITAR", "ELIMINAR", "CANCELAR", "REACTIVAR", "LOGIN", "LOGIN_FALLIDO"}


def registrar_actividad(db: Session, id_usuario: int, accion: str, modulo: str, detalle: str | None = None) -> None:
    """
    Agrega un registro de bitácora a la sesión actual (sin hacer commit).
    id_usuario puede ser None en casos raros (ej. login fallido con un
    nombre_usuario que ni siquiera existe) -- log_actividad.id_usuario
    debe permitir NULL para esos casos.

    detalle: texto legible que describe QUÉ hizo el usuario exactamente
    (ej. "Actualizó el producto 'Lápiz HB' (precio_venta: 3.0)"), además
    de la acción/módulo genéricos. Se guarda en la columna 'detalles'
    (ya existía en la tabla, antes sin usar). Es opcional a propósito:
    si algún router todavía no manda detalle, el registro se sigue
    guardando igual, solo que sin la descripción extra.
    """
    if accion not in ACCIONES_VALIDAS:
        # No frenamos la operación principal por un typo en 'accion' --
        # solo avisamos en consola para que se note en desarrollo.
        print(f" registrar_actividad: acción '{accion}' no está en la lista estándar")

    db.add(LogActividad(id_usuario=id_usuario, accion=accion, modulo=modulo, detalles=detalle))