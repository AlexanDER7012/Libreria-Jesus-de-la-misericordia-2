from typing import Optional
from pydantic import BaseModel, Field, field_validator

class LoginRequest(BaseModel):
    nombre_usuario: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: int
    nombre_usuario: str
    rol: Optional[str] = None

class VerificarAdminResponse(BaseModel):
    autorizado: bool
    mensaje: str


class AdminRecoveryRequest(BaseModel):
    clave_recuperacion: str = Field(min_length=32, max_length=256)
    password: str = Field(min_length=12, max_length=72)

    @field_validator("password")
    @classmethod
    def validar_password_bcrypt(cls, valor: str) -> str:
        if len(valor.encode("utf-8")) > 72:
            raise ValueError("La contraseña supera el máximo admitido")
        if valor != valor.strip():
            raise ValueError("La contraseña no puede iniciar ni terminar con espacios")
        return valor


class AdminRecoveryStatus(BaseModel):
    disponible: bool