from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.database import get_db
from app import models

router = APIRouter(prefix="/ia", tags=["Inteligencia Artificial"])

# Cliente de OpenRouter (compatible con SDK de OpenAI).
# El "or 'missing'" evita que el cliente explote al importar el módulo si
# la API key no está configurada; el endpoint valida la key al ejecutarse.
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY or "missing",
)


class ChatRequest(BaseModel):
    mensaje: str


class ChatResponse(BaseModel):
    respuesta: str
    modelo: str


def _obtener_contexto_negocio(db: Session) -> str:
    """Arma un resumen del negocio para darle contexto a la IA."""
    try:
        # Ventas de hoy
        ventas_hoy = (
            db.query(models.Venta)
            .filter(models.Venta.fecha >= func.current_date())
            .all()
        )
        total_hoy = sum(v.total or 0 for v in ventas_hoy)

        # Productos bajo stock
        productos_bajo = (
            db.query(models.Producto)
            .filter(models.Producto.stock_actual <= models.Producto.stock_minimo)
            .limit(10)
            .all()
        )

        # Clientes
        total_clientes = db.query(models.Cliente).count()

        # Ventas totales (últimos 30 días)
        ventas_30d = (
            db.query(models.Venta)
            .filter(models.Venta.fecha >= func.current_date() - 30)
            .all()
        )
        total_30d = sum(v.total or 0 for v in ventas_30d)

        contexto = (
            "Datos del negocio (Libreria y Papeleria Jesus de la Misericordia):\n"
            f"- Ventas de hoy: {len(ventas_hoy)} transacciones, total Q{total_hoy:.2f}\n"
            f"- Ventas ultimos 30 dias: Q{total_30d:.2f}\n"
            f"- Clientes registrados: {total_clientes}\n"
            f"- Productos bajo stock minimo: {len(productos_bajo)}\n"
        )
        if productos_bajo:
            contexto += "  Productos criticos:\n"
            for p in productos_bajo:
                contexto += (
                    f"    - {p.nombre}: stock {p.stock_actual}, "
                    f"minimo {p.stock_minimo}\n"
                )

        return contexto
    except Exception as e:
        print(f"Error armando contexto: {e}")
        return "No hay datos disponibles."


@router.post("/chat", response_model=ChatResponse)
async def chat_con_ia(request: ChatRequest, db: Session = Depends(get_db)):
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500, detail="OPENROUTER_API_KEY no configurada"
        )

    # 1. Obtener contexto del negocio
    contexto = _obtener_contexto_negocio(db)

    # 2. Armar los mensajes
    # Nota: el system prompt puede llevar acentos (va en el body JSON, UTF-8).
    # Los headers HTTP DEBEN ser ASCII puro, por eso X-Title sin acentos.
    system_prompt = (
        "Eres un asistente inteligente para una libreria y papeleria. "
        "Responde en espanol, de forma concisa y profesional. "
        "Usa SOLO los datos del contexto que se te proporciona. "
        "Si no tienes el dato, dilo claramente sin inventar.\n\n"
        f"CONTEXTO DEL NEGOCIO:\n{contexto}"
    )

    try:
        completion = client.chat.completions.create(
            model="openrouter/free",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.mensaje},
            ],
            extra_headers={
                "HTTP-Referer": "https://lail-web.github.io/Libreria-y-Papeleria-Jesus-de-la-Misericordia-II-/",
                "X-Title": "Libreria Jesus de la Misericordia",
            },
            temperature=0.7,
        )

        respuesta = completion.choices[0].message.content
        modelo_usado = completion.model or "openrouter/free"

        return ChatResponse(respuesta=respuesta, modelo=modelo_usado)

    except Exception as e:
        print(f"Error llamando a OpenRouter: {e}")
        raise HTTPException(status_code=500, detail=f"Error de IA: {str(e)}")