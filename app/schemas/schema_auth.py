from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    nombre_usuario: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: int
    nombre_usuario: str
    rol: Optional[str] = None
