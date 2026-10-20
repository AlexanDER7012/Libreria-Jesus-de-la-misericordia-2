"""
app/catalogos.py
----------------
Validación común para los catálogos (tipos de pago, tipos de gasto,
tipos de proveedor, ubicaciones, puestos, turnos...): el nombre es
obligatorio y no se puede repetir.

Se compara en Python sin distinguir mayúsculas, tildes ni espacios de
más ("Efectivo", "efectivo " y "EFECTIVO" cuentan como el mismo), porque
los catálogos son pequeños y así funciona igual en cualquier base de datos.
"""
import unicodedata

from fastapi import HTTPException
from sqlalchemy.orm import Session


def _clave(nombre: str) -> str:
    texto = " ".join(str(nombre or "").split()).casefold()
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def validar_nombre_unico(db: Session, Modelo, nombre, etiqueta: str, excluir_id=None) -> str:
    """Devuelve el nombre limpio o lanza 400 si viene vacío o ya existe."""
    limpio = " ".join(str(nombre or "").split())
    if not limpio:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    clave = _clave(limpio)
    for registro in db.query(Modelo).all():
        if excluir_id is not None and registro.id == excluir_id:
            continue
        if _clave(registro.nombre) == clave:
            baja = " (está inactivo; puedes reactivarlo)" if getattr(registro, "activo", 1) == 0 else ""
            raise HTTPException(status_code=400, detail=f"Ya existe {etiqueta} con el nombre '{registro.nombre}'{baja}")
    return limpio
