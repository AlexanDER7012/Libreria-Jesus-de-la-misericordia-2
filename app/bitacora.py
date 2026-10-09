from datetime import date, timedelta

from sqlalchemy import func
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


# ===================================================================
# LIMPIEZA AUTOMÁTICA DE LA BITÁCORA
# ===================================================================
# Se borran los registros más viejos que los días configurados en
# Configuración → "Conservar bitácora (días)". Con 0 no se borra nada.
# Se ejecuta como máximo una vez al día (al iniciar sesión) y también
# cada vez que se guarda la configuración.

_ultima_limpieza: date | None = None


def _fecha_limite_bitacora(db: Session, dias: int):
    """Fecha antes de la cual se borra. Usa la hora de la BASE DE DATOS (la
    misma con la que se guarda cada registro), sin depender de la zona
    horaria del servidor."""
    ahora = db.query(func.now()).scalar()
    if getattr(ahora, "tzinfo", None) is not None:
        ahora = ahora.replace(tzinfo=None)
    return ahora - timedelta(days=dias)


def contar_bitacora_a_borrar(db: Session, dias: int) -> int:
    """Cuántos registros se borrarían si se conservaran solo 'dias' días."""
    if not dias or dias <= 0:
        return 0
    return db.query(LogActividad).filter(LogActividad.fecha < _fecha_limite_bitacora(db, dias)).count()


def limpiar_bitacora_antigua(db: Session, forzar: bool = False, id_usuario: int | None = None) -> int:
    """Borra la bitácora vieja según la configuración. Devuelve cuántos registros borró."""
    global _ultima_limpieza
    if not forzar and _ultima_limpieza == date.today():
        return 0

    from app.models.model_configuracion import ConfiguracionGeneral

    try:
        config = db.query(ConfiguracionGeneral).first()
        dias = int(getattr(config, "dias_retencion_bitacora", 0) or 0) if config else 0
        _ultima_limpieza = date.today()
        if dias <= 0:
            return 0

        limite = _fecha_limite_bitacora(db, dias)

        borrados = (
            db.query(LogActividad)
            .filter(LogActividad.fecha < limite)
            .delete(synchronize_session=False)
        )
        if borrados:
            db.add(LogActividad(
                id_usuario=id_usuario, accion="ELIMINAR", modulo="Bitacora",
                detalles=f"Limpieza automática: se borraron {borrados} registros de bitácora con más de {dias} días",
            ))
        db.commit()
        return borrados
    except Exception as e:  # la limpieza nunca debe impedir iniciar sesión
        db.rollback()
        print(f" No se pudo limpiar la bitácora: {e}")
        return 0
