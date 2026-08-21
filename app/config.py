from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Base de datos MySQL local ---
    DATABASE_URL: str

    # --- Seguridad (JWT) ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


# Instancia única que se importa en el resto del proyecto
settings = Settings()
