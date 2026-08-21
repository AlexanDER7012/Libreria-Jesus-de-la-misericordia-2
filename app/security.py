"""
------------------
Funciones de seguridad reutilizables en todo el proyecto:
  - hash_password / verify_password: cifrado de contraseñas con bcrypt.
  - (más adelante, cuando se hara el login: creación y validación de JWT((no olvidarse)))
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password_plano: str, password_hash: str) -> bool:
    return pwd_context.verify(password_plano, password_hash)
