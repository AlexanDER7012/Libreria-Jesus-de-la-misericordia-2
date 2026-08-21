from fastapi import FastAPI

from app.routers import router_cliente, router_ubicacion

app = FastAPI(
    title="Sistema Librería Jesús de la Misericordia",
    description="API del sistema de gestión de inventario, compras, ventas y cotizaciones.",
    version="1.0.0",
)

app.include_router(router_cliente.router, prefix="/clientes", tags=["Clientes"])
app.include_router(router_ubicacion.router, prefix="/ubicaciones", tags=["Ubicaciones"])
app.include_router(router_ubicacion.sub_router, prefix="/sububicaciones", tags=["Sububicaciones"])

# Los demás routers se agregan aquí conforme se van creando, por ejemplo:
# from app.routers import router_producto, router_venta, router_cotizacion
# app.include_router(router_producto.router, prefix="/productos", tags=["Productos"])


@app.get("/")
def read_root():
    return {"status": "Online", "docs": "/docs"}
