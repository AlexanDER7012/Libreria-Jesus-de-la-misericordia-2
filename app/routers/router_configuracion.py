from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.model_configuracion import ConfiguracionGeneral, MetaFinanciera
from app.schemas.schema_configuracion import (
    ConfiguracionGeneralUpdate, ConfiguracionGeneralResponse,
    MetaFinancieraCreate, MetaFinancieraResponse,
)

router = APIRouter()        # /configuracion
router_meta = APIRouter()   # /metas-financieras


def _obtener_o_crear_configuracion(db: Session) -> ConfiguracionGeneral:
    config = db.query(ConfiguracionGeneral).first()
    if not config:
        config = ConfiguracionGeneral(
            nombre_negocio="Librería y Papelería Jesús de la Misericordia",
            moneda="GTQ",
            monto_caja_chica_default=500.00,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


# ===================================================================
# CONFIGURACION_GENERAL
# ===================================================================

@router.get("/", response_model=ConfiguracionGeneralResponse)
def obtener_configuracion(db: Session = Depends(get_db)):
    """Trae la configuración general. Si nunca se ha creado, la crea con valores por defecto."""
    return _obtener_o_crear_configuracion(db)


@router.put("/", response_model=ConfiguracionGeneralResponse)
def actualizar_configuracion(datos: ConfiguracionGeneralUpdate, db: Session = Depends(get_db)):
    config = _obtener_o_crear_configuracion(db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(config, campo, valor)
    db.commit()
    db.refresh(config)
    return config


# ===================================================================
# META_FINANCIERA
# ===================================================================

@router_meta.get("/", response_model=List[MetaFinancieraResponse])
def listar_metas(anio: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(MetaFinanciera).order_by(MetaFinanciera.anio.desc(), MetaFinanciera.mes.desc())
    if anio is not None:
        query = query.filter(MetaFinanciera.anio == anio)
    return query.all()


@router_meta.post("/", response_model=MetaFinancieraResponse, status_code=201)
def crear_meta(datos: MetaFinancieraCreate, db: Session = Depends(get_db)):
    existente = db.query(MetaFinanciera).filter(
        MetaFinanciera.mes == datos.mes, MetaFinanciera.anio == datos.anio
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe una meta para {datos.mes}/{datos.anio}")

    nueva = MetaFinanciera(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router_meta.put("/{meta_id}", response_model=MetaFinancieraResponse)
def actualizar_meta(meta_id: int, datos: MetaFinancieraCreate, db: Session = Depends(get_db)):
    meta = db.query(MetaFinanciera).filter(MetaFinanciera.id == meta_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta financiera no encontrada")
    for campo, valor in datos.model_dump().items():
        setattr(meta, campo, valor)
    db.commit()
    db.refresh(meta)
    return meta
