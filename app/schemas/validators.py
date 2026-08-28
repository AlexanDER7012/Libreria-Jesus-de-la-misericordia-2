"""
app/schemas/validators.py
----------------------------
Validadores reutilizables entre varios schemas.

IMPORTANTE: TelefonoValidatorMixin se hereda SOLO en los schemas de
Create/Update (entrada de datos nuevos). NUNCA en los de Response
(salida), porque si un registro viejo en la base de datos ya tiene un
teléfono con formato inválido (de antes de que existiera esta validación),
Pydantic tronaría con un 500 al intentar LEERLO -- la validación de
entrada no debe aplicarse también a la salida.
"""

from pydantic import field_validator


def validar_telefono(valor):
    """
    Acepta None/vacío (el campo sigue siendo opcional). Si viene algo,
    exige que sea solo números (permite espacios y guiones como
    separadores, ej. '1234-5678'), entre 8 y 15 dígitos.
    """
    if valor is None or valor == "":
        return valor

    limpio = valor.replace(" ", "").replace("-", "")
    if not limpio.isdigit():
        raise ValueError("El teléfono solo puede contener números (se permiten espacios o guiones)")
    if not (8 <= len(limpio) <= 15):
        raise ValueError("El teléfono debe tener entre 8 y 15 dígitos")

    return valor

class TelefonoValidatorMixin:
    @field_validator("telefono")
    @classmethod
    def _validar_telefono(cls, v):
        return validar_telefono(v)
