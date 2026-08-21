from fastapi import FastAPI

from app.routers import router_cliente, router_ubicacion, router_usuario

app = FastAPI(
    title="Sistema Librería Jesús de la Misericordia",
    description="API del sistema de gestión de inventario, compras, ventas y cotizaciones.",
    version="1.0.0",
)

app.include_router(router_cliente.router, prefix="/clientes", tags=["Clientes"])
app.include_router(router_ubicacion.router, prefix="/ubicaciones", tags=["Ubicaciones"])

app.include_router(router_ubicacion.sub_router, prefix="/sububicaciones", tags=["Sububicaciones"])

app.include_router(router_usuario.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(router_usuario.router_empleado, prefix="/empleados", tags=["Empleados"])
app.include_router(router_usuario.router_rol, prefix="/roles", tags=["Roles"])
app.include_router(router_usuario.router_puesto, prefix="/puestos", tags=["Puestos"])
app.include_router(router_usuario.router_turno, prefix="/turnos", tags=["Turnos"])
app.include_router(router_usuario.router_modulo, prefix="/modulos", tags=["Modulos"])
app.include_router(router_usuario.router_permiso, prefix="/permisos", tags=["Permisos"])
app.include_router(router_usuario.router_pago, prefix="/pagos-empleado", tags=["Pagos Empleado"])
app.include_router(router_usuario.router_log, prefix="/logs", tags=["Logs"])
# Los demás routers se agregan aquí conforme se van creando, por ejemplo:
# from app.routers import router_producto, router_venta, router_cotizacion
# app.include_router(router_producto.router, prefix="/productos", tags=["Productos"])


@app.get("/")
def read_root():
    return {"status": "Online", "docs": "/docs"}
