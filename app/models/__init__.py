from app.models.model_cliente import Cliente
from app.models.model_ubicacion import Ubicacion, Sububicacion
from app.models.model_usuario import (
    Usuario, Rol, Permiso, RolPermiso, Modulo, Empleado, Puesto, Turno,
    HistoricoPagoEmpleado, LogActividad,
)
from app.models.model_producto import Producto, Categoria, Marca, UnidadMedida, HistoricoPrecio
from app.models.model_inventario import (
    TipoMovimientoInventario, MovimientoInventario, MovimientoInventarioDetalle,
    InventarioFisico, TrasladoSucursal, Alerta,
)
from app.models.model_proveedor import Proveedor, TipoProveedor, Pedido, DetallePedido
from app.models.model_compra import Compra, DetalleCompra, CompraPago, NotaEntrega, DevolucionCompra
from app.models.model_caja import TipoPago, TipoGasto, Gasto, CajaTurno, CajaDenominacion, CajaChicaMovimiento
from app.models.model_venta import Venta, DetalleVenta, MetodoPagoVenta, ServicioAdicional, DetalleServicio
from app.models.model_cotizacion import Cotizacion, DetalleCotizacion
from app.models.model_configuracion import ConfiguracionGeneral, MetaFinanciera
