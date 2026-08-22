import sys
import os
sys.path.append(os.getcwd())

from app.database import engine, Base
from app import models  # noqa: F401 - importa todos los modelos para que Base los conozca


def main():
    print(f"Vas a crear tablas en: {engine.url}")
    confirmacion = input("¿Confirmas que esta es tu base de datos de NEON, no la local de MySQL? (si/no): ")

    if confirmacion.strip().lower() != "si":
        print("Cancelado. No se creó ninguna tabla.")
        return

    Base.metadata.create_all(bind=engine)
    print("Listo -- todas las tablas fueron creadas en Neon.")


if __name__ == "__main__":
    main()