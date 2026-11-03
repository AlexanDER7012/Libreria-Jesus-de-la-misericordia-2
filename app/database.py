from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings
from app.timezone import APP_TIMEZONE_NAME, database_timezone_offset

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  
                        
)


@event.listens_for(engine, "connect")
def _configurar_zona_horaria_db(conexion, _registro):
    cursor = conexion.cursor()
    try:
        if engine.dialect.name == "postgresql":
            cursor.execute(
                "SELECT set_config('TimeZone', %s, false)",
                (APP_TIMEZONE_NAME,),
            )
        elif engine.dialect.name == "mysql":
            cursor.execute(
                "SET time_zone = %s",
                (database_timezone_offset(),),
            )
    finally:
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
