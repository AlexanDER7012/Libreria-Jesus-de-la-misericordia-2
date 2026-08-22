from app.schemas.schema_cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.schemas.schema_ubicacion import (
    UbicacionCreate, UbicacionUpdate, UbicacionResponse, UbicacionConSububicaciones,
    SububicacionCreate, SububicacionUpdate, SububicacionResponse,
)
from app.schemas.schema_usuario import (
    UsuarioCreate, UsuarioUpdate, UsuarioResponse,
    EmpleadoCreate, EmpleadoUpdate, EmpleadoResponse,
    RolCreate, RolResponse, RolPermisoCreate, RolPermisoResponse,
    PuestoCreate, PuestoResponse,
    TurnoCreate, TurnoResponse,
    ModuloCreate, ModuloResponse,
    PermisoCreate, PermisoResponse,
    HistoricoPagoEmpleadoCreate, HistoricoPagoEmpleadoResponse,
    LogActividadResponse,
)
from app.schemas.schema_producto import (
    ProductoCreate, ProductoUpdate, ProductoResponse,
    CategoriaCreate, CategoriaResponse,
    MarcaCreate, MarcaResponse,
    UnidadMedidaCreate, UnidadMedidaResponse,
    HistoricoPrecioResponse,
)
from app.schemas.schema_inventario import (
    TipoMovimientoInventarioCreate, TipoMovimientoInventarioResponse,
    MovimientoInventarioCreate, MovimientoInventarioResponse,
    MovimientoInventarioDetalleCreate, MovimientoInventarioDetalleResponse,
    InventarioFisicoCreate, InventarioFisicoResponse,
    TrasladoSucursalCreate, TrasladoSucursalResponse,
    AlertaResponse,
)
from app.schemas.schema_proveedor import (
    ProveedorCreate, ProveedorUpdate, ProveedorResponse,
    TipoProveedorCreate, TipoProveedorResponse,
    PedidoCreate, PedidoResponse,
    DetallePedidoCreate, DetallePedidoResponse,
    PedidoTotalResponse,
)
from app.schemas.schema_compra import (
    CompraCreate, CompraResponse,
    DetalleCompraCreate, DetalleCompraResponse,
    NotaEntregaCreate, NotaEntregaResponse,
    CompraPagoCreate, CompraPagoResponse,
    DevolucionCompraCreate, DevolucionCompraResponse,
)
from app.schemas.schema_caja import (
    TipoPagoCreate, TipoPagoResponse,
    TipoGastoCreate, TipoGastoResponse,
    GastoCreate, GastoResponse,
    CajaTurnoAbrir, CajaTurnoResponse, CajaTurnoCerrar,
    CajaDenominacionCreate, CajaDenominacionResponse,
    CajaChicaMovimientoCreate, CajaChicaMovimientoResponse,
)
from app.schemas.schema_venta import (
    VentaCreate, VentaResponse,
    DetalleVentaCreate, DetalleVentaResponse,
    MetodoPagoVentaCreate, MetodoPagoVentaResponse,
    ServicioAdicionalCreate, ServicioAdicionalResponse,
    DetalleServicioCreate, DetalleServicioResponse,
)
from app.schemas.schema_cotizacion import (
    CotizacionCreate, CotizacionResponse,
    DetalleCotizacionCreate, DetalleCotizacionResponse,
)
from app.schemas.schema_configuracion import (
    ConfiguracionGeneralUpdate, ConfiguracionGeneralResponse,
    MetaFinancieraCreate, MetaFinancieraResponse,
)
