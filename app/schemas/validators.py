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
