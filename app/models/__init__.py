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
