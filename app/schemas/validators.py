"""
app/schemas/validators.py
----------------------------
Validadores reutilizables entre varios schemas.

IMPORTANTE: los mixins de este archivo se heredan SOLO en los schemas de
Create/Update (entrada de datos nuevos). NUNCA en los de Response
(salida), porque si un registro viejo en la base de datos ya tiene un
dato con formato inválido (de antes de que existiera esta validación),
Pydantic tronaría con un 500 al intentar LEERLO -- la validación de
entrada no debe aplicarse también a la salida. Por eso los datos que ya
están guardados se quedan como están; solo se validan al crear o editar.

Reglas (Guatemala):
  - Teléfono: exactamente 8 dígitos. Se guarda como 1234-5678.
  - Correo:   algo@dominio.terminacion (.com, .live, .edu.gt, ...).
  - DPI:      13 dígitos, con departamento (01-22) y municipio que existan.
              Se guarda como 1234 56789 0101.
  - Textos:   se quitan los espacios al inicio y al final.
"""

import re

from pydantic import field_validator, model_validator


# Municipios por departamento (códigos 01 a 22 del DPI / CUI)
MUNICIPIOS_POR_DEPARTAMENTO = [
    17, 8, 16, 16, 14, 14, 19, 8, 24, 21, 9, 30, 33, 21, 8, 17, 14, 5, 11, 11, 7, 17,
]

_REGEX_EMAIL = re.compile(r"^[^\s@]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$")


def solo_digitos(valor) -> str:
    return re.sub(r"\D", "", str(valor or ""))


def validar_telefono(valor):
    """
    Acepta None/vacío (el campo sigue siendo opcional). Si viene algo,
    exige 8 dígitos (se permiten espacios o guiones como separadores) y lo
    devuelve como '1234-5678'.
    """
    if valor is None or str(valor).strip() == "":
        return valor
    texto = str(valor).strip()
    if not re.fullmatch(r"[\d\s-]+", texto):
        raise ValueError("El teléfono solo puede contener números")
    digitos = solo_digitos(texto)
    if len(digitos) != 8:
        raise ValueError("El teléfono debe tener 8 dígitos (ej. 1234-5678)")
    return f"{digitos[:4]}-{digitos[4:]}"


def validar_email(valor):
    if valor is None or str(valor).strip() == "":
        return valor
    texto = str(valor).strip()
    if not _REGEX_EMAIL.fullmatch(texto):
        raise ValueError(
            "Correo no válido: debe llevar @ y terminar en .com, .live, .net, etc. (ej. nombre@gmail.com)"
        )
    return texto


def validar_dpi(valor):
    if valor is None or str(valor).strip() == "":
        return valor
    texto = str(valor).strip()
    digitos = solo_digitos(texto)
    if len(digitos) != 13 or not re.fullmatch(r"[\d\s-]+", texto):
        raise ValueError("El DPI debe tener 13 dígitos (ej. 1234 56789 0101)")
    depto = int(digitos[9:11])
    muni = int(digitos[11:13])
    if not 1 <= depto <= 22:
        raise ValueError("DPI no válido: los dígitos del departamento no existen")
    if not 1 <= muni <= MUNICIPIOS_POR_DEPARTAMENTO[depto - 1]:
        raise ValueError("DPI no válido: los dígitos del municipio no existen")
    return f"{digitos[:4]} {digitos[4:9]} {digitos[9:]}"


def normalizar_nit(valor) -> str:
    """Para comparar NIT sin importar guiones, espacios o mayúsculas."""
    return re.sub(r"[\s-]", "", str(valor or "")).upper()


class LimpiarTextoMixin:
    """Quita los espacios al inicio y al final de todos los textos."""

    @model_validator(mode="before")
    @classmethod
    def _limpiar_textos(cls, datos):
        if isinstance(datos, dict):
            return {
                k: (v.strip() if isinstance(v, str) else v) for k, v in datos.items()
            }
        return datos


class TelefonoValidatorMixin(LimpiarTextoMixin):
    @field_validator("telefono", check_fields=False)
    @classmethod
    def _validar_telefono(cls, v):
        return validar_telefono(v)


class EmailValidatorMixin:
    @field_validator("email", check_fields=False)
    @classmethod
    def _validar_email(cls, v):
        return validar_email(v)


class DpiValidatorMixin:
    @field_validator("dpi", check_fields=False)
    @classmethod
    def _validar_dpi(cls, v):
        return validar_dpi(v)
