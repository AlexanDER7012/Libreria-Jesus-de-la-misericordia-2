from fastapi import FastAPI

from app.routers import (
    router_cliente, router_ubicacion, router_usuario, router_producto, router_inventario,
)

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

app.include_router(router_producto.router, prefix="/productos", tags=["Productos"])
app.include_router(router_producto.router_categoria, prefix="/categorias", tags=["Categorias"])
app.include_router(router_producto.router_marca, prefix="/marcas", tags=["Marcas"])
app.include_router(router_producto.router_unidad, prefix="/unidades-medida", tags=["Unidades de Medida"])

app.include_router(router_inventario.router, prefix="/movimientos-inventario", tags=["Movimientos de Inventario"])
app.include_router(router_inventario.router_tipo, prefix="/tipos-movimiento", tags=["Tipos de Movimiento"])
app.include_router(router_inventario.router_fisico, prefix="/inventario-fisico", tags=["Inventario Físico"])
app.include_router(router_inventario.router_traslado, prefix="/traslados", tags=["Traslados entre Sucursales"])
app.include_router(router_inventario.router_alerta, prefix="/alertas", tags=["Alertas"])

# Los demás routers se agregan aquí conforme se van creando, por ejemplo:
# from app.routers import router_proveedor
# app.include_router(router_proveedor.router, prefix="/proveedores", tags=["Proveedores"])


@app.get("/")
def read_root():
    return {"status": "Online", "docs": "/docs"}
