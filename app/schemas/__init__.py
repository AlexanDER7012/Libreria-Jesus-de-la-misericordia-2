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
