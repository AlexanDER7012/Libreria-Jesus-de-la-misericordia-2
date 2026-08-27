from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    router_auth,
    router_cliente, router_ubicacion, router_usuario, router_producto,
    router_inventario, router_proveedor, router_compra, router_caja,
    router_venta, router_cotizacion, router_configuracion,
    router_reportes,  # <--- COMENTADO si no existe el archivo
)

app = FastAPI(
    title="Sistema Librería Jesús de la Misericordia",
    description="API del sistema de gestión de inventario, compras, ventas y cotizaciones.",
    version="1.0.0",
)

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# RUTAS REGISTRADAS
# ============================================================

# Autenticación
app.include_router(router_auth.router, prefix="/login", tags=["Autenticación"])

# Clientes
app.include_router(router_cliente.router, prefix="/clientes", tags=["Clientes"])

# Ubicaciones
app.include_router(router_ubicacion.router, prefix="/ubicaciones", tags=["Ubicaciones"])
app.include_router(router_ubicacion.sub_router, prefix="/sububicaciones", tags=["Sububicaciones"])

# Usuarios y Empleados
app.include_router(router_usuario.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(router_usuario.router_empleado, prefix="/empleados", tags=["Empleados"])
app.include_router(router_usuario.router_rol, prefix="/roles", tags=["Roles"])
app.include_router(router_usuario.router_puesto, prefix="/puestos", tags=["Puestos"])
app.include_router(router_usuario.router_turno, prefix="/turnos", tags=["Turnos"])
app.include_router(router_usuario.router_modulo, prefix="/modulos", tags=["Modulos"])
app.include_router(router_usuario.router_permiso, prefix="/permisos", tags=["Permisos"])
app.include_router(router_usuario.router_pago, prefix="/pagos-empleado", tags=["Pagos Empleado"])
app.include_router(router_usuario.router_log, prefix="/logs", tags=["Logs"])

# Productos
app.include_router(router_producto.router, prefix="/productos", tags=["Productos"])
app.include_router(router_producto.router_categoria, prefix="/categorias", tags=["Categorias"])
app.include_router(router_producto.router_marca, prefix="/marcas", tags=["Marcas"])
app.include_router(router_producto.router_unidad, prefix="/unidades-medida", tags=["Unidades de Medida"])

# Inventario
app.include_router(router_inventario.router, prefix="/movimientos-inventario", tags=["Movimientos de Inventario"])
app.include_router(router_inventario.router_tipo, prefix="/tipos-movimiento", tags=["Tipos de Movimiento"])
app.include_router(router_inventario.router_fisico, prefix="/inventario-fisico", tags=["Inventario Físico"])
app.include_router(router_inventario.router_traslado, prefix="/traslados", tags=["Traslados entre Sucursales"])
app.include_router(router_inventario.router_alerta, prefix="/alertas", tags=["Alertas"])

# Proveedores
app.include_router(router_proveedor.router, prefix="/proveedores", tags=["Proveedores"])
app.include_router(router_proveedor.router_tipo, prefix="/tipos-proveedor", tags=["Tipos de Proveedor"])
app.include_router(router_proveedor.router_pedido, prefix="/pedidos", tags=["Pedidos"])

# Compras
app.include_router(router_compra.router, prefix="/compras", tags=["Compras"])
app.include_router(router_compra.router_devolucion, prefix="/devoluciones-compra", tags=["Devoluciones de Compra"])

# Caja
app.include_router(router_caja.router, prefix="/caja-turno", tags=["Caja - Turnos"])
app.include_router(router_caja.router_caja_chica, prefix="/caja-chica", tags=["Caja Chica"])
app.include_router(router_caja.router_gasto, prefix="/gastos", tags=["Gastos"])
app.include_router(router_caja.router_tipo_gasto, prefix="/tipos-gasto", tags=["Tipos de Gasto"])
app.include_router(router_caja.router_tipo_pago, prefix="/tipos-pago", tags=["Tipos de Pago"])

# VENTAS - CRÍTICO: Asegurar que ambos routers estén registrados
app.include_router(router_venta.router, prefix="/ventas", tags=["Ventas"])
app.include_router(router_venta.router_servicio, prefix="/servicios-adicionales", tags=["Servicios Adicionales"])

# COTIZACIONES - CRÍTICO: Asegurar que esté registrado
app.include_router(router_cotizacion.router, tags=["Cotizaciones"])

# Configuración
app.include_router(router_configuracion.router, prefix="/configuracion", tags=["Configuración"])
app.include_router(router_configuracion.router_meta, prefix="/metas-financieras", tags=["Metas Financieras"])

# Reportes
app.include_router(router_reportes.router, tags=["Reportes"])


@app.get("/")
def read_root():
    return {"status": "Online", "docs": "/docs"}