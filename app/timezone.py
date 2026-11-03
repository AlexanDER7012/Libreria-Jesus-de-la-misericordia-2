from datetime import date, datetime
from zoneinfo import ZoneInfo

APP_TIMEZONE_NAME = "America/Guatemala"
APP_TIMEZONE = ZoneInfo(APP_TIMEZONE_NAME)


def now_gt() -> datetime:
    """Devuelve la hora actual con la zona horaria configurada para el sistema."""
    return datetime.now(APP_TIMEZONE)


def now_gt_naive() -> datetime:
    """Devuelve hora de Guatemala sin tzinfo para columnas SQL DateTime existentes."""
    return now_gt().replace(tzinfo=None)


def today_gt() -> date:
    """Devuelve la fecha de hoy en la zona horaria configurada para el sistema."""
    return now_gt().date()


def database_timezone_offset() -> str:
    """Formatea el desplazamiento vigente para motores que esperan un offset."""
    offset = now_gt().utcoffset()
    if offset is None:
        raise ValueError(f"No se pudo determinar el desplazamiento de {APP_TIMEZONE_NAME}")
    total_minutes = int(offset.total_seconds() // 60)
    signo = "+" if total_minutes >= 0 else "-"
    horas, minutos = divmod(abs(total_minutes), 60)
    return f"{signo}{horas:02d}:{minutos:02d}"
