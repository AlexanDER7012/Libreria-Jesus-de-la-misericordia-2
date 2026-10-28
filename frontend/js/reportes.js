// reportes.js

// ============================================================
// CARGA DEL MODULO DE REPORTES
// ============================================================
async function loadReportesModule() {
  const container =
    document.getElementById("reportesContainer") ||
    document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-chart-bar me-2 text-primary"></i>Reportes</h4>
        </div>

        <!-- PESTAÑAS PRINCIPALES POR MÓDULO -->
        <ul class="nav nav-tabs mb-3" id="reportesSubTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#reportesVentas">
                    <i class="fas fa-shopping-cart me-1"></i>Ventas
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#reportesCompras">
                    <i class="fas fa-truck me-1"></i>Compras
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#reportesInventario">
                    <i class="fas fa-warehouse me-1"></i>Inventario
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#reportesUsuarios">
                    <i class="fas fa-users me-1"></i>Usuarios
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <!-- ========================================================== -->
            <!-- MÓDULO: VENTAS -->
            <!-- ========================================================== -->
            <div class="tab-pane fade show active" id="reportesVentas">
                <ul class="nav nav-tabs mb-3" id="ventasSubTabs">
                    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#subVentasDiarias"><i class="fas fa-calendar-day me-1"></i>Ventas Diarias</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subConciliacion"><i class="fas fa-hand-holding-usd me-1"></i>Conciliación Pagos</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subCuadreCaja"><i class="fas fa-cash-register me-1"></i>Cuadre de Caja</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subUtilidad"><i class="fas fa-chart-line me-1"></i>Utilidad por Producto</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subTopProductos"><i class="fas fa-trophy me-1"></i>Top Productos</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="subVentasDiarias"><div id="reporteVentasDiariasContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subConciliacion"><div id="reporteConciliacionContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subCuadreCaja"><div id="reporteCuadreCajaContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subUtilidad"><div id="reporteUtilidadContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subTopProductos"><div id="reporteTopProductosContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                </div>
            </div>

            <!-- ========================================================== -->
            <!-- MÓDULO: COMPRAS -->
            <!-- ========================================================== -->
            <div class="tab-pane fade" id="reportesCompras">
                <ul class="nav nav-tabs mb-3" id="comprasSubTabs">
                    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#subComprasResumen"><i class="fas fa-chart-bar me-1"></i>Resumen de Compras</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subComprasProveedor"><i class="fas fa-building me-1"></i>Compras por Proveedor</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subCuentasPagar"><i class="fas fa-money-bill-wave me-1"></i>Cuentas por Pagar</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="subComprasResumen"><div id="reporteComprasResumenContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subComprasProveedor"><div id="reporteComprasProveedorContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subCuentasPagar"><div id="reporteCuentasPagarContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                </div>
            </div>

            <!-- ========================================================== -->
            <!-- MÓDULO: INVENTARIO -->
            <!-- ========================================================== -->
            <div class="tab-pane fade" id="reportesInventario">
                <ul class="nav nav-tabs mb-3" id="inventarioSubTabs">
                    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#subStockBajo"><i class="fas fa-exclamation-triangle me-1"></i>Productos Bajo Mínimo</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subExcesosInventario"><i class="fas fa-boxes-stacked me-1"></i>Excesos de Inventario</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subMovimientosResumen"><i class="fas fa-exchange-alt me-1"></i>Resumen de Movimientos</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subInventarioValorizado"><i class="fas fa-dollar-sign me-1"></i>Inventario Valorizado</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="subStockBajo"><div id="reporteStockBajoContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subExcesosInventario"><div id="reporteExcesosInventarioContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subMovimientosResumen"><div id="reporteMovimientosResumenContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subInventarioValorizado"><div id="reporteInventarioValorizadoContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                </div>
            </div>

            <!-- ========================================================== -->
            <!-- MÓDULO: USUARIOS -->
            <!-- ========================================================== -->
            <div class="tab-pane fade" id="reportesUsuarios">
                <ul class="nav nav-tabs mb-3" id="usuariosSubTabs">
                    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#subLoginResumen"><i class="fas fa-sign-in-alt me-1"></i>Resumen de Logins</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subUsuariosActivos"><i class="fas fa-user-check me-1"></i>Usuarios Más Activos</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subBitacora"><i class="fas fa-clipboard-list me-1"></i>Bitácora de Actividades</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subCuentasActivas"><i class="fas fa-user-shield me-1"></i>Cuentas Activas</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subCuentasInactivas"><i class="fas fa-user-slash me-1"></i>Cuentas Inactivas</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subUsuariosPorFecha"><i class="fas fa-calendar-alt me-1"></i>Usuarios por Fecha</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subUsuariosBuscar"><i class="fas fa-search me-1"></i>Búsqueda Inteligente</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="subLoginResumen"><div id="reporteLoginResumenContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subUsuariosActivos"><div id="reporteUsuariosActivosContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subBitacora"><div id="reporteBitacoraContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subCuentasActivas"><div id="reporteCuentasActivasContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subCuentasInactivas"><div id="reporteCuentasInactivasContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subUsuariosPorFecha"><div id="reporteUsuariosPorFechaContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subUsuariosBuscar"><div id="reporteUsuariosBuscarContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                </div>
            </div>
        </div>
    `;

  // Cargar todos los reportes
  await Promise.all([
    // Ventas
    cargarReporteVentasDiarias(),
    cargarReporteConciliacion(),
    cargarReporteCuadreCaja(),
    cargarReporteUtilidad(),
    cargarReporteTopProductos(),
    // Compras
    cargarReporteComprasResumen(),
    cargarReporteComprasProveedor(),
    cargarReporteCuentasPagar(),
    // Inventario
    cargarReporteStockBajo(),
    cargarReporteExcesosInventario(),
    cargarReporteMovimientosResumen(),
    cargarReporteInventarioValorizado(),
    // Usuarios
    cargarReporteLoginResumen(),
    cargarReporteUsuariosActivos(),
    cargarReporteBitacora(),
    cargarReporteCuentasActivas(),
    cargarReporteCuentasInactivas(),
    cargarReporteUsuariosPorFecha(),
    cargarReporteUsuariosBuscar(),
  ]);
}

// ============================================================
// REPORTES DE VENTAS (YA EXISTENTES - SE MANTIENEN)
// ============================================================

// ============================================================
// USUARIOS - NUEVOS: CUENTAS ACTIVAS / INACTIVAS / POR FECHA / BUSQUEDA
// ============================================================

const LIMITE_REPORTE_USUARIOS = 10;
let skipCuentasActivas = 0;
let skipCuentasInactivas = 0;
let skipUsuariosPorFecha = 0;
let skipUsuariosBuscar = 0;

function _opcionesOrdenUsuario(idSelect, idDireccion) {
  return `
    <div class="col-md-3">
      <label class="form-label small">Ordenar por</label>
      <select class="form-select form-select-sm" id="${idSelect}">
        <option value="">Sin ordenar</option>
        <option value="id">ID</option>
        <option value="nombre_usuario">Usuario</option>
        <option value="fecha_creacion">Fecha Creación</option>
        <option value="fecha_ultimo_acceso">Último Acceso</option>
      </select>
    </div>
    <div class="col-md-2">
      <label class="form-label small">Dirección</label>
      <select class="form-select form-select-sm" id="${idDireccion}">
        <option value="asc">Ascendente</option>
        <option value="desc">Descendente</option>
      </select>
    </div>
  `;
}

function _renderTablaUsuarios(detalle, tituloTabla) {
  if (!detalle || detalle.length === 0) {
    return `<div class="alert alert-warning">No hay usuarios que coincidan con el filtro</div>`;
  }
  return `
    <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">${tituloTabla}</h6></div>
    <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
    <thead><tr><th>ID</th><th>Usuario</th><th>Fecha Creación</th><th>Último Acceso</th><th>Estado</th></tr></thead>
    <tbody>${detalle
      .map(
        (u) => `<tr>
          <td>${u.id}</td>
          <td><strong>${u.nombre_usuario || "--"}</strong></td>
          <td>${u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString() : "--"}</td>
          <td>${u.fecha_ultimo_acceso ? new Date(u.fecha_ultimo_acceso).toLocaleString() : "--"}</td>
          <td><span class="badge ${u.activo !== 0 ? "bg-success" : "bg-danger"}">${u.activo !== 0 ? "Activo" : "Inactivo"}</span></td>
        </tr>`,
      )
      .join("")}</tbody></table></div></div></div>
  `;
}

function _controlesPaginacion(onAnterior, onSiguiente, skipActual, hayMas = true) {
  return `
    <div class="d-flex justify-content-between align-items-center mt-2">
      <button class="btn btn-sm btn-outline-secondary" onclick="${onAnterior}" ${skipActual === 0 ? "disabled" : ""}>
        <i class="fas fa-chevron-left me-1"></i>Anterior
      </button>
      <button class="btn btn-sm btn-outline-secondary" onclick="${onSiguiente}" ${hayMas ? "" : "disabled"}>
        Siguiente<i class="fas fa-chevron-right ms-1"></i>
      </button>
    </div>
  `;
}

// -------------------- CUENTAS ACTIVAS --------------------

async function cargarReporteCuentasActivas() {
  const container = document.getElementById("reporteCuentasActivasContainer");
  if (!container) return;
  try {
    container.innerHTML = `
      <div class="row mb-3">
        ${_opcionesOrdenUsuario("cuentaActivaOrden", "cuentaActivaDireccion")}
        <div class="col-md-2 d-flex align-items-end">
          <button class="btn btn-primary btn-sm" onclick="skipCuentasActivas=0;actualizarCuentasActivas()">
            <i class="fas fa-search me-1"></i>Consultar
          </button>
        </div>
        <div class="col-md-2 d-flex align-items-end gap-1">
          <button class="btn btn-success btn-sm" onclick="exportarCuentasActivasPDF()" title="Exportar a PDF"><i class="fas fa-file-pdf me-1"></i>PDF</button>
          <button class="btn btn-info btn-sm" onclick="exportarCuentasActivasExcel()" title="Exportar a Excel"><i class="fas fa-file-excel me-1"></i>Excel</button>
        </div>
      </div>
      <div id="cuentaActivaResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
    `;
    await actualizarCuentasActivas();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarCuentasActivas() {
  const ordenPor = document.getElementById("cuentaActivaOrden")?.value || "";
  const ordenDir =
    document.getElementById("cuentaActivaDireccion")?.value || "asc";
  const resultado = document.getElementById("cuentaActivaResultado");
  if (!resultado) return;
  try {
    let url = `/reportes/usuarios/activos?skip=${skipCuentasActivas}&limit=${LIMITE_REPORTE_USUARIOS}`;
    if (ordenPor) url += `&orden_por=${ordenPor}&orden_direccion=${ordenDir}`;
    const data = await api.request(url);
    resultado.innerHTML =
      _renderTablaUsuarios(data, "Cuentas Activas") +
      _controlesPaginacion(
        `skipCuentasActivas=Math.max(0,skipCuentasActivas-${LIMITE_REPORTE_USUARIOS});actualizarCuentasActivas()`,
        `skipCuentasActivas+=${LIMITE_REPORTE_USUARIOS};actualizarCuentasActivas()`,
        skipCuentasActivas,
        Array.isArray(data) && data.length === LIMITE_REPORTE_USUARIOS,
      );
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// -------------------- CUENTAS INACTIVAS --------------------

async function cargarReporteCuentasInactivas() {
  const container = document.getElementById("reporteCuentasInactivasContainer");
  if (!container) return;
  try {
    container.innerHTML = `
      <div class="row mb-3">
        ${_opcionesOrdenUsuario("cuentaInactivaOrden", "cuentaInactivaDireccion")}
        <div class="col-md-2 d-flex align-items-end">
          <button class="btn btn-primary btn-sm" onclick="skipCuentasInactivas=0;actualizarCuentasInactivas()">
            <i class="fas fa-search me-1"></i>Consultar
          </button>
        </div>
        <div class="col-md-2 d-flex align-items-end gap-1">
          <button class="btn btn-success btn-sm" onclick="exportarCuentasInactivasPDF()" title="Exportar a PDF"><i class="fas fa-file-pdf me-1"></i>PDF</button>
          <button class="btn btn-info btn-sm" onclick="exportarCuentasInactivasExcel()" title="Exportar a Excel"><i class="fas fa-file-excel me-1"></i>Excel</button>
        </div>
      </div>
      <div id="cuentaInactivaResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
    `;
    await actualizarCuentasInactivas();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarCuentasInactivas() {
  const ordenPor = document.getElementById("cuentaInactivaOrden")?.value || "";
  const ordenDir =
    document.getElementById("cuentaInactivaDireccion")?.value || "asc";
  const resultado = document.getElementById("cuentaInactivaResultado");
  if (!resultado) return;
  try {
    let url = `/reportes/usuarios/inactivos?skip=${skipCuentasInactivas}&limit=${LIMITE_REPORTE_USUARIOS}`;
    if (ordenPor) url += `&orden_por=${ordenPor}&orden_direccion=${ordenDir}`;
    const data = await api.request(url);
    resultado.innerHTML =
      _renderTablaUsuarios(data, "Cuentas Inactivas (dadas de baja)") +
      _controlesPaginacion(
        `skipCuentasInactivas=Math.max(0,skipCuentasInactivas-${LIMITE_REPORTE_USUARIOS});actualizarCuentasInactivas()`,
        `skipCuentasInactivas+=${LIMITE_REPORTE_USUARIOS};actualizarCuentasInactivas()`,
        skipCuentasInactivas,
        Array.isArray(data) && data.length === LIMITE_REPORTE_USUARIOS,
      );
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteUsuariosPorFecha() {
  const container = document.getElementById("reporteUsuariosPorFechaContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
      <div class="row mb-3">
        <div class="col-md-2">
          <label class="form-label small">Fecha Desde</label>
          <input type="date" class="form-control form-control-sm" id="usuariosFechaDesde" value="${_fechaLocalISO(hace30Dias)}">
        </div>
        <div class="col-md-2">
          <label class="form-label small">Fecha Hasta</label>
          <input type="date" class="form-control form-control-sm" id="usuariosFechaHasta" value="${_fechaLocalISO(hoy)}">
        </div>
        ${_opcionesOrdenUsuario("usuariosFechaOrden", "usuariosFechaDireccion")}
        <div class="col-md-2 d-flex align-items-end">
          <button class="btn btn-primary btn-sm" onclick="skipUsuariosPorFecha=0;actualizarUsuariosPorFecha()">
            <i class="fas fa-search me-1"></i>Consultar
          </button>
        </div>
        <div class="col-md-1 d-flex align-items-end gap-1">
          <button class="btn btn-success btn-sm" onclick="exportarUsuariosPorFechaPDF()" title="Exportar a PDF"><i class="fas fa-file-pdf"></i></button>
          <button class="btn btn-info btn-sm" onclick="exportarUsuariosPorFechaExcel()" title="Exportar a Excel"><i class="fas fa-file-excel"></i></button>
        </div>
      </div>
      <div id="usuariosFechaResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
    `;
    await actualizarUsuariosPorFecha();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarUsuariosPorFecha() {
  const desde = document.getElementById("usuariosFechaDesde")?.value;
  const hasta = document.getElementById("usuariosFechaHasta")?.value;
  const ordenPor = document.getElementById("usuariosFechaOrden")?.value || "";
  const ordenDir =
    document.getElementById("usuariosFechaDireccion")?.value || "asc";
  const resultado = document.getElementById("usuariosFechaResultado");
  if (!resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    let url = `/reportes/usuarios/por-fecha?skip=${skipUsuariosPorFecha}&limit=${LIMITE_REPORTE_USUARIOS}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    if (ordenPor) url += `&orden_por=${ordenPor}&orden_direccion=${ordenDir}`;
    const data = await api.request(url);
    resultado.innerHTML =
      _renderTablaUsuarios(
        data,
        `Usuarios registrados del ${desde || "--"} al ${hasta || "--"}`,
      ) +
      _controlesPaginacion(
        `skipUsuariosPorFecha=Math.max(0,skipUsuariosPorFecha-${LIMITE_REPORTE_USUARIOS});actualizarUsuariosPorFecha()`,
        `skipUsuariosPorFecha+=${LIMITE_REPORTE_USUARIOS};actualizarUsuariosPorFecha()`,
        skipUsuariosPorFecha,
        Array.isArray(data) && data.length === LIMITE_REPORTE_USUARIOS,
      );
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteUsuariosBuscar() {
  const container = document.getElementById("reporteUsuariosBuscarContainer");
  if (!container) return;
  try {
    container.innerHTML = `
      <div class="row mb-3 g-2">
        <div class="col-md-2">
          <label class="form-label small">Estado</label>
          <select class="form-select form-select-sm" id="buscarUsuarioEstado">
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label small">Nombre de usuario</label>
          <input type="text" class="form-control form-control-sm" id="buscarUsuarioNombre" placeholder="Buscar...">
        </div>
        <div class="col-md-2">
          <label class="form-label small">Fecha Desde</label>
          <input type="date" class="form-control form-control-sm" id="buscarUsuarioDesde">
        </div>
        <div class="col-md-2">
          <label class="form-label small">Fecha Hasta</label>
          <input type="date" class="form-control form-control-sm" id="buscarUsuarioHasta">
        </div>
        ${_opcionesOrdenUsuario("buscarUsuarioOrden", "buscarUsuarioDireccion")}
      </div>
      <div class="row mb-3">
        <div class="col-md-2">
          <button class="btn btn-primary btn-sm w-100" onclick="skipUsuariosBuscar=0;actualizarUsuariosBuscar()">
            <i class="fas fa-search me-1"></i>Buscar
          </button>
        </div>
        <div class="col-md-2 d-flex gap-1">
          <button class="btn btn-success btn-sm" onclick="exportarUsuariosBuscarPDF()" title="Exportar a PDF"><i class="fas fa-file-pdf"></i></button>
          <button class="btn btn-info btn-sm" onclick="exportarUsuariosBuscarExcel()" title="Exportar a Excel"><i class="fas fa-file-excel"></i></button>
        </div>
      </div>
      <div id="buscarUsuarioResultado"><div class="text-center py-5"><p class="text-muted">Ajusta los filtros y presiona Buscar</p></div></div>
    `;
    await actualizarUsuariosBuscar();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarUsuariosBuscar() {
  const estado =
    document.getElementById("buscarUsuarioEstado")?.value || "todos";
  const buscar = document.getElementById("buscarUsuarioNombre")?.value?.trim();
  const desde = document.getElementById("buscarUsuarioDesde")?.value;
  const hasta = document.getElementById("buscarUsuarioHasta")?.value;
  const ordenPor = document.getElementById("buscarUsuarioOrden")?.value || "";
  const ordenDir =
    document.getElementById("buscarUsuarioDireccion")?.value || "asc";
  const resultado = document.getElementById("buscarUsuarioResultado");
  if (!resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    let url = `/reportes/usuarios/buscar?estado=${estado}&skip=${skipUsuariosBuscar}&limit=${LIMITE_REPORTE_USUARIOS}`;
    if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    if (ordenPor) url += `&orden_por=${ordenPor}&orden_direccion=${ordenDir}`;
    const data = await api.request(url);
    resultado.innerHTML =
      _renderTablaUsuarios(data, "Resultado de la búsqueda") +
      _controlesPaginacion(
        `skipUsuariosBuscar=Math.max(0,skipUsuariosBuscar-${LIMITE_REPORTE_USUARIOS});actualizarUsuariosBuscar()`,
        `skipUsuariosBuscar+=${LIMITE_REPORTE_USUARIOS};actualizarUsuariosBuscar()`,
        skipUsuariosBuscar,
        Array.isArray(data) && data.length === LIMITE_REPORTE_USUARIOS,
      );
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function _exportarUsuariosCompleto(urlBase, titulo, tituloTabla, tipo) {
  const id = "exportUsuariosTemporal";
  document.getElementById(id)?.remove();
  try {
    const sep = urlBase.includes("?") ? "&" : "?";
    const data = await api.request(`${urlBase}${sep}skip=0&limit=200`);
    if (!Array.isArray(data) || data.length === 0) {
      showToast("No hay datos para exportar en este reporte", "warning");
      return;
    }
    const div = document.createElement("div");
    div.id = id;
    div.style.display = "none";
    div.innerHTML = _renderTablaUsuarios(data, tituloTabla);
    document.body.appendChild(div);
    if (tipo === "pdf") await exportarPDF(id, titulo);
    else exportarExcel(id, titulo);
  } catch (error) {
    showToast("No se pudo exportar: " + error.message, "error");
  } finally {
    document.getElementById(id)?.remove();
  }
}

function _filtroOrden(idOrden, idDireccion) {
  const ordenPor = document.getElementById(idOrden)?.value || "";
  const ordenDir = document.getElementById(idDireccion)?.value || "asc";
  return ordenPor ? `&orden_por=${ordenPor}&orden_direccion=${ordenDir}` : "";
}

function _urlCuentasActivas() {
  return `/reportes/usuarios/activos?x=1${_filtroOrden("cuentaActivaOrden", "cuentaActivaDireccion")}`;
}
function _urlCuentasInactivas() {
  return `/reportes/usuarios/inactivos?x=1${_filtroOrden("cuentaInactivaOrden", "cuentaInactivaDireccion")}`;
}
function _urlUsuariosPorFecha() {
  const desde = document.getElementById("usuariosFechaDesde")?.value;
  const hasta = document.getElementById("usuariosFechaHasta")?.value;
  let url = `/reportes/usuarios/por-fecha?x=1`;
  if (desde) url += `&fecha_desde=${desde}`;
  if (hasta) url += `&fecha_hasta=${hasta}`;
  return url + _filtroOrden("usuariosFechaOrden", "usuariosFechaDireccion");
}
function _urlUsuariosBuscar() {
  const estado = document.getElementById("buscarUsuarioEstado")?.value || "todos";
  const buscar = document.getElementById("buscarUsuarioNombre")?.value?.trim();
  const desde = document.getElementById("buscarUsuarioDesde")?.value;
  const hasta = document.getElementById("buscarUsuarioHasta")?.value;
  let url = `/reportes/usuarios/buscar?estado=${estado}`;
  if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;
  if (desde) url += `&fecha_desde=${desde}`;
  if (hasta) url += `&fecha_hasta=${hasta}`;
  return url + _filtroOrden("buscarUsuarioOrden", "buscarUsuarioDireccion");
}
function _rangoUsuariosValido(idDesde, idHasta) {
  const d = document.getElementById(idDesde)?.value;
  const h = document.getElementById(idHasta)?.value;
  if (d && h && d > h) {
    showToast('La fecha "Desde" no puede ser mayor que la fecha "Hasta".', "warning");
    return false;
  }
  return true;
}

function exportarCuentasActivasPDF() {
  _exportarUsuariosCompleto(_urlCuentasActivas(), "Cuentas_Activas", "Cuentas Activas", "pdf");
}
function exportarCuentasActivasExcel() {
  _exportarUsuariosCompleto(_urlCuentasActivas(), "Cuentas_Activas", "Cuentas Activas", "excel");
}
function exportarCuentasInactivasPDF() {
  _exportarUsuariosCompleto(_urlCuentasInactivas(), "Cuentas_Inactivas", "Cuentas Inactivas", "pdf");
}
function exportarCuentasInactivasExcel() {
  _exportarUsuariosCompleto(_urlCuentasInactivas(), "Cuentas_Inactivas", "Cuentas Inactivas", "excel");
}
function exportarUsuariosPorFechaPDF() {
  if (!_rangoUsuariosValido("usuariosFechaDesde", "usuariosFechaHasta")) return;
  _exportarUsuariosCompleto(_urlUsuariosPorFecha(), "Usuarios_Por_Fecha", "Usuarios por Fecha", "pdf");
}
function exportarUsuariosPorFechaExcel() {
  if (!_rangoUsuariosValido("usuariosFechaDesde", "usuariosFechaHasta")) return;
  _exportarUsuariosCompleto(_urlUsuariosPorFecha(), "Usuarios_Por_Fecha", "Usuarios por Fecha", "excel");
}
function exportarUsuariosBuscarPDF() {
  if (!_rangoUsuariosValido("buscarUsuarioDesde", "buscarUsuarioHasta")) return;
  _exportarUsuariosCompleto(_urlUsuariosBuscar(), "Busqueda_Usuarios", "Búsqueda de Usuarios", "pdf");
}
function exportarUsuariosBuscarExcel() {
  if (!_rangoUsuariosValido("buscarUsuarioDesde", "buscarUsuarioHasta")) return;
  _exportarUsuariosCompleto(_urlUsuariosBuscar(), "Busqueda_Usuarios", "Búsqueda de Usuarios", "excel");
}

window.cargarReporteCuentasActivas = cargarReporteCuentasActivas;
window.actualizarCuentasActivas = actualizarCuentasActivas;
window.cargarReporteCuentasInactivas = cargarReporteCuentasInactivas;
window.actualizarCuentasInactivas = actualizarCuentasInactivas;
window.cargarReporteUsuariosPorFecha = cargarReporteUsuariosPorFecha;
window.actualizarUsuariosPorFecha = actualizarUsuariosPorFecha;
window.cargarReporteUsuariosBuscar = cargarReporteUsuariosBuscar;
window.actualizarUsuariosBuscar = actualizarUsuariosBuscar;
window.exportarCuentasActivasPDF = exportarCuentasActivasPDF;
window.exportarCuentasActivasExcel = exportarCuentasActivasExcel;
window.exportarCuentasInactivasPDF = exportarCuentasInactivasPDF;
window.exportarCuentasInactivasExcel = exportarCuentasInactivasExcel;
window.exportarUsuariosPorFechaPDF = exportarUsuariosPorFechaPDF;
window.exportarUsuariosPorFechaExcel = exportarUsuariosPorFechaExcel;
window.exportarUsuariosBuscarPDF = exportarUsuariosBuscarPDF;
window.exportarUsuariosBuscarExcel = exportarUsuariosBuscarExcel;

async function cargarReporteVentasDiarias() {
  const container = document.getElementById("reporteVentasDiariasContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const fecha = _fechaLocalISO(hoy);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label small">Fecha</label>
                    <input type="date" class="form-control form-control-sm" id="ventasDiariasFecha" value="${fecha}">
                </div>
                <div class="col-md-4 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarVentasDiarias()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
            </div>
            <div id="ventasDiariasResultado">
                <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div>
            </div>
        `;
    await actualizarVentasDiarias();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

function escaparHtmlReporteTurno(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Fecha local (YYYY-MM-DD). toISOString usa UTC y después de las 6 p. m. daba el día siguiente.
function _fechaLocalISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Devuelve true (y avisa) si el rango de fechas no es válido
function _rangoFechasInvalido(desde, hasta, resultado) {
  if (desde && hasta && desde > hasta) {
    resultado.innerHTML = `<div class="alert alert-warning">La fecha "Desde" no puede ser mayor que la fecha "Hasta".</div>`;
    return true;
  }
  return false;
}

async function actualizarVentasDiarias() {
  const fecha = document.getElementById("ventasDiariasFecha")?.value;
  const resultado = document.getElementById("ventasDiariasResultado");
  if (!fecha || !resultado) return;
  try {
    const data = await api.request(
      `/reportes/ventas-diarias?desde=${fecha}&hasta=${fecha}`,
    );
    if (!data) {
      resultado.innerHTML = `<div class="alert alert-warning">No se encontraron datos</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="row">
                <div class="col-md-3"><div class="card bg-primary bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Cantidad Ventas</h6><h3 class="text-primary">${data.cantidad_ventas || 0}</h3></div></div></div>
                <div class="col-md-3"><div class="card bg-info bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Subtotal</h6><h3 class="text-info">Q${(data.subtotal || 0).toFixed(2)}</h3></div></div></div>
                <div class="col-md-3"><div class="card bg-warning bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Descuentos</h6><h3 class="text-warning">Q${(data.descuento || 0).toFixed(2)}</h3></div></div></div>
                <div class="col-md-3"><div class="card bg-success bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total</h6><h3 class="text-success">Q${(data.total || 0).toFixed(2)}</h3></div></div></div>
            </div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Reporte del día: ${fecha}</div>
            <table class="table table-sm table-bordered mt-3">
                <thead class="table-light"><tr><th>Concepto</th><th>Valor</th></tr></thead>
                <tbody>
                    <tr><td>Fecha</td><td>${fecha}</td></tr>
                    <tr><td>Cantidad de Ventas</td><td>${data.cantidad_ventas || 0}</td></tr>
                    <tr><td>Subtotal</td><td>Q${(data.subtotal || 0).toFixed(2)}</td></tr>
                    <tr><td>Descuentos</td><td>Q${(data.descuento || 0).toFixed(2)}</td></tr>
                    <tr><td>Total</td><td>Q${(data.total || 0).toFixed(2)}</td></tr>
                </tbody>
            </table>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// CONCILIACIÓN DE PAGOS
// ============================================================
async function cargarReporteConciliacion() {
  const container = document.getElementById("reporteConciliacionContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const fecha = _fechaLocalISO(hoy);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4"><label class="form-label small">Fecha</label><input type="date" class="form-control form-control-sm" id="conciliacionFecha" value="${fecha}"></div>
                <div class="col-md-4 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarConciliacion()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="conciliacionResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarConciliacion();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarConciliacion() {
  const fecha = document.getElementById("conciliacionFecha")?.value;
  const resultado = document.getElementById("conciliacionResultado");
  if (!fecha || !resultado) return;
  try {
    const data = await api.request(
      `/reportes/conciliacion-pagos?desde=${fecha}&hasta=${fecha}`,
    );
    if (!data || !data.desglose || data.desglose.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay pagos registrados</div>`;
      return;
    }
    let html = `<div class="row mb-3"><div class="col-md-4"><div class="card bg-success bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total General</h6><h3 class="text-success">Q${(data.total_general || 0).toFixed(2)}</h3></div></div></div></div>
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Desglose por Método de Pago</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>Método de Pago</th><th class="text-end">Monto</th><th class="text-end">Porcentaje</th></tr></thead>
            <tbody>${data.desglose
              .map((item) => {
                const pct =
                  data.total_general > 0
                    ? (item.monto / data.total_general) * 100
                    : 0;
                return `<tr><td><strong>${item.tipo_pago}</strong></td><td class="text-end">Q${(item.monto || 0).toFixed(2)}</td><td class="text-end">${pct.toFixed(1)}%</td></tr>`;
              })
              .join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Conciliación del día: ${fecha}</div>`;
    resultado.innerHTML = html;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// CUADRE DE CAJA
// ============================================================
async function cargarReporteCuadreCaja() {
  const container = document.getElementById("reporteCuadreCajaContainer");
  if (!container) return;
  try {
    const turnos = await api.getCajaTurnos().catch(() => []);
    await cargarNombresPersonas();
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4"><label class="form-label small">Seleccionar Turno</label>
                    <select class="form-select form-select-sm" id="cuadreTurnoSelect" onchange="actualizarCuadreCaja()">
                        <option value="">Seleccionar turno</option>
                        ${turnos.map((t) => `<option value="${t.id}">${escaparHtmlReporteTurno(etiquetaTurno(t, { conEstado: true }))}</option>`).join("")}
                    </select>
                </div>
            </div>
            <div id="cuadreCajaResultado"><div class="text-center py-5"><p class="text-muted">Selecciona un turno para ver el cuadre</p></div></div>
        `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarCuadreCaja() {
  const turnoId = document.getElementById("cuadreTurnoSelect")?.value;
  const resultado = document.getElementById("cuadreCajaResultado");
  if (!resultado) return;
  if (!turnoId) {
    resultado.innerHTML = `<div class="alert alert-warning">Selecciona un turno para ver el cuadre</div>`;
    return;
  }
  try {
    const data = await api.request(`/reportes/cuadre-caja/${turnoId}`);
    if (!data) {
      resultado.innerHTML = `<div class="alert alert-warning">No se encontraron datos</div>`;
      return;
    }
    const diferencia =
      data.diferencia !== null
        ? data.diferencia
        : (data.total_contado || 0) - (data.total_ventas || 0);
    const estadoColor = data.estado === "Abierto" ? "success" : "secondary";
    const diferenciaColor = diferencia >= 0 ? "success" : "danger";
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><div class="d-flex justify-content-between align-items-center"><h6 class="mb-0 fw-bold">Cuadre de Caja - ${escaparHtmlReporteTurno(nombrePersona(data.id_usuario))}</h6><span class="badge bg-${estadoColor}">${data.estado}</span></div></div>
            <div class="card-body"><div class="row">
                <div class="col-md-3"><div class="card bg-info bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Fondo Inicial</h6><h4 class="text-info">Q${(data.fondo_inicial || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-success bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Ventas</h6><h4 class="text-success">Q${(data.total_ventas || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-primary bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Contado</h6><h4 class="text-primary">Q${(data.total_contado || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-${diferenciaColor} bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Diferencia</h6><h4 class="text-${diferenciaColor}">Q${(diferencia || 0).toFixed(2)}</h4></div></div></div>
            </div>
            <div class="row mt-3"><div class="col-md-6"><p><strong>Fecha Apertura:</strong> ${data.fecha_apertura ? new Date(data.fecha_apertura).toLocaleString() : "--"}</p></div>
            <div class="col-md-6"><p><strong>Fecha Cierre:</strong> ${data.fecha_cierre ? new Date(data.fecha_cierre).toLocaleString() : "--"}</p></div></div>
            <table class="table table-sm table-bordered mt-2">
                <thead class="table-light"><tr><th>Concepto</th><th>Valor</th></tr></thead>
                <tbody>
                    <tr><td>Caja de</td><td>${escaparHtmlReporteTurno(nombrePersona(data.id_usuario))} (${data.estado})</td></tr>
                    <tr><td>Fecha Apertura</td><td>${data.fecha_apertura ? new Date(data.fecha_apertura).toLocaleString() : "--"}</td></tr>
                    <tr><td>Fecha Cierre</td><td>${data.fecha_cierre ? new Date(data.fecha_cierre).toLocaleString() : "--"}</td></tr>
                    <tr><td>Fondo Inicial</td><td>Q${(data.fondo_inicial || 0).toFixed(2)}</td></tr>
                    <tr><td>Total Ventas</td><td>Q${(data.total_ventas || 0).toFixed(2)}</td></tr>
                    <tr><td>Total Contado</td><td>Q${(data.total_contado || 0).toFixed(2)}</td></tr>
                    <tr><td>Diferencia</td><td>Q${(diferencia || 0).toFixed(2)}</td></tr>
                </tbody>
            </table></div></div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// UTILIDAD POR PRODUCTO
// ============================================================
async function cargarReporteUtilidad() {
  const container = document.getElementById("reporteUtilidadContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="utilidadFechaInicio" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="utilidadFechaFin" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarUtilidad()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="utilidadResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarUtilidad();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarUtilidad() {
  const desde = document.getElementById("utilidadFechaInicio")?.value;
  const hasta = document.getElementById("utilidadFechaFin")?.value;
  const resultado = document.getElementById("utilidadResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    const data = await api.request(
      `/reportes/utilidad?desde=${desde}&hasta=${hasta}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay datos en el período</div>`;
      return;
    }
    const utilidadColor = data.total_utilidad >= 0 ? "success" : "danger";
    let html = `
            <div class="row mb-3">
                <div class="col-md-3"><div class="card bg-info bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Ingresos</h6><h4 class="text-info">Q${(data.total_ingresos || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-warning bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Costo</h6><h4 class="text-warning">Q${(data.total_costo || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-${utilidadColor} bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Utilidad</h6><h4 class="text-${utilidadColor}">Q${(data.total_utilidad || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-primary bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Margen</h6><h4 class="text-primary">${data.total_ingresos > 0 ? ((data.total_utilidad / data.total_ingresos) * 100).toFixed(1) : 0}%</h4></div></div></div>
            </div>
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Detalle por Producto</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>Producto</th><th class="text-end">Cantidad</th><th class="text-end">Ingresos</th><th class="text-end">Costo</th><th class="text-end">Utilidad</th><th class="text-end">Margen</th></tr></thead>
            <tbody>${data.detalle
              .map((item) => {
                const color = item.utilidad >= 0 ? "success" : "danger";
                return `<tr><td><strong>${item.producto}</strong></td><td class="text-end">${item.cantidad_vendida}</td>
                        <td class="text-end">Q${(item.ingresos || 0).toFixed(2)}</td><td class="text-end">Q${(item.costo || 0).toFixed(2)}</td>
                        <td class="text-end text-${color}">Q${(item.utilidad || 0).toFixed(2)}</td>
                        <td class="text-end">${(item.margen_porcentaje || 0).toFixed(1)}%</td></tr>`;
              })
              .join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${data.desde} al ${data.hasta}</div>
        `;
    resultado.innerHTML = html;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// TOP PRODUCTOS MÁS VENDIDOS
// ============================================================
async function cargarReporteTopProductos() {
  const container = document.getElementById("reporteTopProductosContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="topFechaInicio" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="topFechaFin" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-2"><label class="form-label small">Límite</label><input type="number" class="form-control form-control-sm" id="topLimite" value="10" min="1" max="50"></div>
                <div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarTopProductos()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="topProductosResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarTopProductos();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarTopProductos() {
  const desde = document.getElementById("topFechaInicio")?.value;
  const hasta = document.getElementById("topFechaFin")?.value;
  const limite = document.getElementById("topLimite")?.value || 10;
  const resultado = document.getElementById("topProductosResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  const lim = Number(limite);
  if (!Number.isInteger(lim) || lim < 1 || lim > 50) {
    resultado.innerHTML = `<div class="alert alert-warning">El límite debe ser un número entero entre 1 y 50.</div>`;
    return;
  }
  try {
    const data = await api.request(
      `/reportes/productos-mas-vendidos?desde=${desde}&hasta=${hasta}&limite=${limite}`,
    );
    if (!data || data.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay productos vendidos en el período</div>`;
      return;
    }
    // % de participación = cantidad del producto / total de unidades del top
    const totalCantidad = data.reduce(
      (suma, item) => suma + (Number(item.cantidad_vendida) || 0),
      0,
    );
    let html = `<div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Top ${data.length} Productos Más Vendidos</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>#</th><th>Producto</th><th class="text-end">Cantidad Vendida</th><th class="text-end">Total Vendido</th><th>% Participación</th></tr></thead>
            <tbody>${data
              .map((item, index) => {
                const pct =
                  totalCantidad > 0
                    ? (item.cantidad_vendida / totalCantidad) * 100
                    : 0;
                const medal =
                  index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : "";
                return `<tr><td>${medal} ${index + 1}</td><td><strong>${item.producto}</strong></td>
                        <td class="text-end"><span class="fw-bold">${item.cantidad_vendida}</span></td>
                        <td class="text-end">Q${(item.total_vendido || 0).toFixed(2)}</td>
                        <td><div class="progress" style="height:20px;"><div class="progress-bar ${index === 0 ? "bg-success" : "bg-primary"}" role="progressbar" style="width:${pct}%;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">${pct.toFixed(1)}%</div></div></td></tr>`;
              })
              .join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${desde} al ${hasta} | Total productos: ${data.length}</div>`;
    resultado.innerHTML = html;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// REPORTES DE COMPRAS
// ============================================================

async function cargarReporteComprasResumen() {
  const container = document.getElementById("reporteComprasResumenContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="comprasResumenDesde" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="comprasResumenHasta" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarComprasResumen()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="comprasResumenResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarComprasResumen();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarComprasResumen() {
  const desde = document.getElementById("comprasResumenDesde")?.value;
  const hasta = document.getElementById("comprasResumenHasta")?.value;
  const resultado = document.getElementById("comprasResumenResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    const data = await api.request(
      `/reportes/compras/resumen?desde=${desde}&hasta=${hasta}`,
    );
    if (!data) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay datos</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="row">
                <div class="col-md-4"><div class="card bg-primary bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Cantidad Compras</h6><h3 class="text-primary">${data.cantidad_compras || 0}</h3></div></div></div>
                <div class="col-md-4"><div class="card bg-success bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Comprado</h6><h3 class="text-success">Q${(data.total_comprado || 0).toFixed(2)}</h3></div></div></div>
                <div class="col-md-4"><div class="card bg-warning bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Pendiente de Pago</h6><h3 class="text-warning">Q${(data.total_pendiente || 0).toFixed(2)}</h3></div></div></div>
            </div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${data.desde} al ${data.hasta}</div>

            <table class="table table-sm table-bordered mt-3">
                <thead class="table-light"><tr><th>Concepto</th><th>Valor</th></tr></thead>
                <tbody>
                    <tr><td>Período</td><td>${data.desde} al ${data.hasta}</td></tr>
                    <tr><td>Cantidad de Compras</td><td>${data.cantidad_compras || 0}</td></tr>
                    <tr><td>Total Comprado</td><td>Q${(data.total_comprado || 0).toFixed(2)}</td></tr>
                    <tr><td>Total Pendiente de Pago</td><td>Q${(data.total_pendiente || 0).toFixed(2)}</td></tr>
                </tbody>
            </table>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteComprasProveedor() {
  const container = document.getElementById("reporteComprasProveedorContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="comprasProvDesde" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="comprasProvHasta" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarComprasProveedor()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="comprasProvResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarComprasProveedor();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarComprasProveedor() {
  const desde = document.getElementById("comprasProvDesde")?.value;
  const hasta = document.getElementById("comprasProvHasta")?.value;
  const resultado = document.getElementById("comprasProvResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    const data = await api.request(
      `/reportes/compras/por-proveedor?desde=${desde}&hasta=${hasta}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay datos</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Compras por Proveedor</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>Proveedor</th><th class="text-end"># Compras</th><th class="text-end">Total Comprado</th></tr></thead>
            <tbody>${data.detalle.map((item) => `<tr><td><strong>${item.proveedor}</strong></td><td class="text-end">${item.cantidad_compras}</td><td class="text-end">Q${(item.total_comprado || 0).toFixed(2)}</td></tr>`).join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${data.desde} al ${data.hasta}</div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteCuentasPagar() {
  const container = document.getElementById("reporteCuentasPagarContainer");
  if (!container) return;
  try {
    container.innerHTML = `
            <div id="cuentasPagarResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarCuentasPagar();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarCuentasPagar() {
  const resultado = document.getElementById("cuentasPagarResultado");
  if (!resultado) return;
  try {
    const data = await api.request(`/reportes/compras/cuentas-por-pagar`);
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-success">✅ No hay cuentas pendientes de pago</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="card"><div class="card-header bg-danger bg-opacity-10"><h6 class="mb-0 fw-bold text-danger">⚠️ Cuentas por Pagar</h6></div>
            <div class="card-body">
                <div class="row mb-2"><div class="col-md-4"><span class="fw-bold">Total Pendiente:</span> Q${(data.total_pendiente || 0).toFixed(2)}</div>
                <div class="col-md-4"><span class="fw-bold">Cantidad Facturas:</span> ${data.cantidad_compras || 0}</div></div>
                <div class="table-responsive"><table class="table table-hover table-striped">
                <thead><tr><th>Proveedor</th><th>Factura</th><th class="text-end">Total</th><th class="text-end">Saldo</th><th>Vencimiento</th></tr></thead>
                <tbody>${data.detalle
                  .map((item) => {
                    const vencido =
                      item.fecha_vencimiento_pago &&
                      new Date(item.fecha_vencimiento_pago) < new Date();
                    return `<tr class="${vencido ? "table-danger" : ""}">
                        <td><strong>${item.proveedor}</strong></td><td>${item.numero_factura || "--"}</td>
                        <td class="text-end">Q${(item.total || 0).toFixed(2)}</td>
                        <td class="text-end fw-bold text-warning">Q${(item.saldo_pendiente || 0).toFixed(2)}</td>
                        <td>${item.fecha_vencimiento_pago ? new Date(item.fecha_vencimiento_pago).toLocaleDateString() : "--"}${vencido ? " ⚠️ VENCIDO" : ""}</td>
                    </tr>`;
                  })
                  .join("")}</tbody></table></div></div></div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// REPORTES DE INVENTARIO
// ============================================================

async function cargarReporteStockBajo() {
  const container = document.getElementById("reporteStockBajoContainer");
  if (!container) return;
  try {
    container.innerHTML = `<div id="stockBajoResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>`;
    await actualizarStockBajo();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarStockBajo() {
  const resultado = document.getElementById("stockBajoResultado");
  if (!resultado) return;
  try {
    const data = await api.request(`/reportes/inventario/stock-bajo`);
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-success">✅ Todos los productos tienen stock suficiente</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="card"><div class="card-header bg-danger bg-opacity-10"><h6 class="mb-0 fw-bold text-danger">⚠️ Productos con Stock Bajo (${data.cantidad})</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>Producto</th><th class="text-end">Stock Actual</th><th class="text-end">Stock Mínimo</th><th class="text-end">Faltante</th></tr></thead>
            <tbody>${data.detalle.map((item) => `<tr><td><strong>${item.producto}</strong></td><td class="text-end text-danger fw-bold">${item.stock_actual}</td><td class="text-end">${item.stock_minimo}</td><td class="text-end">${item.stock_minimo - item.stock_actual}</td></tr>`).join("")}</tbody></table></div></div></div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteExcesosInventario() {
  const container = document.getElementById("reporteExcesosInventarioContainer");
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="row mb-3">
        <div class="col-md-6 d-flex align-items-end gap-1">
          <button class="btn btn-success btn-sm" onclick="exportarExcesosInventarioPDF()" title="Exportar a PDF">
            <i class="fas fa-file-pdf me-1"></i>Exportar a PDF
          </button>
          <button class="btn btn-info btn-sm" onclick="exportarExcesosInventarioExcel()" title="Exportar a Excel">
            <i class="fas fa-file-excel me-1"></i>Exportar a Excel
          </button>
        </div>
      </div>
      <p class="text-muted small mb-3">
        Productos activos cuyo stock actual supera el máximo configurado.
        Exporta el reporte a Excel para revisar qué productos pedir en menor cantidad
        durante la temporada.
      </p>
      <div id="excesosInventarioResultado">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted">Cargando datos...</p>
        </div>
      </div>
    `;

    const resultado = document.getElementById("excesosInventarioResultado");
    if (!resultado) {
      throw new Error("No se pudo preparar el resultado del reporte");
    }
    const escaparHTML = (valor) =>
      String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[caracter]);
    const productos = await api.request("/reportes/inventario/excesos");
    if (!Array.isArray(productos)) {
      throw new Error("La respuesta del reporte de excesos no es válida");
    }
    if (productos.length === 0) {
      resultado.innerHTML = `<div class="alert alert-success">No hay productos con exceso de inventario</div>`;
      return;
    }

    resultado.innerHTML = `
      <div class="card">
        <div class="card-header bg-warning bg-opacity-10">
          <h6 class="mb-0 fw-bold">Excesos de Inventario (${productos.length})</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover table-striped">
              <thead>
                <tr>
                  <th>ID</th><th>Código</th><th>Nombre</th>
                  <th class="text-end">Stock Actual</th><th class="text-end">Stock Máximo</th>
                  <th class="text-end">Exceso</th><th class="text-end">Días desde última venta</th>
                </tr>
              </thead>
              <tbody>
                ${productos.map((item) => {
                  const exceso = Number(item.exceso) || 0;
                  const stockMaximo = Number(item.stock_maximo) || 0;
                  const severidad = exceso >= stockMaximo * 0.5
                    ? "bg-danger"
                    : "bg-warning text-dark";
                  return `
                    <tr>
                      <td>${escaparHTML(item.id)}</td>
                      <td>${escaparHTML(item.codigo || "--")}</td>
                      <td><strong>${escaparHTML(item.nombre || "--")}</strong></td>
                      <td class="text-end">${escaparHTML(item.stock_actual)}</td>
                      <td class="text-end">${escaparHTML(item.stock_maximo)}</td>
                      <td class="text-end"><span class="badge ${severidad}">${escaparHTML(item.exceso)}</span></td>
                      <td class="text-end">${escaparHTML(item.dias_sin_movimiento ?? "--")}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteMovimientosResumen() {
  const container = document.getElementById(
    "reporteMovimientosResumenContainer",
  );
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="movResumenDesde" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="movResumenHasta" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarMovimientosResumen()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="movResumenResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarMovimientosResumen();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarMovimientosResumen() {
  const desde = document.getElementById("movResumenDesde")?.value;
  const hasta = document.getElementById("movResumenHasta")?.value;
  const resultado = document.getElementById("movResumenResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    const data = await api.request(
      `/reportes/inventario/movimientos-resumen?desde=${desde}&hasta=${hasta}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay movimientos en el período</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Resumen de Movimientos de Inventario</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>Tipo de Movimiento</th><th class="text-end">Cantidad Movimientos</th><th class="text-end">Total Unidades</th></tr></thead>
            <tbody>${data.detalle.map((item) => `<tr><td><strong>${item.tipo_movimiento}</strong></td><td class="text-end">${item.cantidad_movimientos}</td><td class="text-end">${item.total_unidades}</td></tr>`).join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${data.desde} al ${data.hasta}</div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteInventarioValorizado() {
  const container = document.getElementById(
    "reporteInventarioValorizadoContainer",
  );
  if (!container) return;
  try {
    container.innerHTML = `<div id="invValorizadoResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>`;
    await actualizarInventarioValorizado();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarInventarioValorizado() {
  const resultado = document.getElementById("invValorizadoResultado");
  if (!resultado) return;
  try {
    const data = await api.request(`/reportes/inventario/valorizado`);
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay productos en inventario</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4"><div class="card bg-success bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Valor Total Inventario</h6><h3 class="text-success">Q${(data.valor_total_inventario || 0).toFixed(2)}</h3></div></div></div>
                <div class="col-md-4"><div class="card bg-primary bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Cantidad Productos</h6><h3 class="text-primary">${data.detalle.length}</h3></div></div></div>
                <div class="col-md-4"><div class="card bg-info bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Fecha de Corte</h6><h3 class="text-info">${data.fecha_corte}</h3></div></div></div>
            </div>
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Detalle por Producto</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>Producto</th><th class="text-end">Stock</th><th class="text-end">Costo Unitario</th><th class="text-end">Valor Total</th></tr></thead>
            <tbody>${data.detalle.map((item) => `<tr><td><strong>${item.producto}</strong></td><td class="text-end">${item.stock_actual}</td><td class="text-end">Q${(item.costo_unitario || 0).toFixed(2)}</td><td class="text-end fw-bold">Q${(item.valor_total || 0).toFixed(2)}</td></tr>`).join("")}</tbody></table></div></div></div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// REPORTES DE USUARIOS
// ============================================================

async function cargarReporteLoginResumen() {
  const container = document.getElementById("reporteLoginResumenContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="loginDesde" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="loginHasta" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarLoginResumen()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="loginResumenResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarLoginResumen();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarLoginResumen() {
  const desde = document.getElementById("loginDesde")?.value;
  const hasta = document.getElementById("loginHasta")?.value;
  const resultado = document.getElementById("loginResumenResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    const data = await api.request(
      `/reportes/usuarios/login-resumen?desde=${desde}&hasta=${hasta}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay registros de login</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Resumen de Logins</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>Usuario</th><th class="text-end">Logins Exitosos</th><th class="text-end">Logins Fallidos</th><th class="text-end">Total</th></tr></thead>
            <tbody>${data.detalle.map((item) => `<tr><td><strong>${item.nombre_usuario}</strong></td><td class="text-end text-success">${item.logins_exitosos}</td><td class="text-end text-danger">${item.logins_fallidos}</td><td class="text-end fw-bold">${item.logins_exitosos + item.logins_fallidos}</td></tr>`).join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${data.desde} al ${data.hasta}</div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteUsuariosActivos() {
  const container = document.getElementById("reporteUsuariosActivosContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="activosDesde" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="activosHasta" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-2"><label class="form-label small">Límite</label><input type="number" class="form-control form-control-sm" id="activosLimite" value="10" min="1" max="50"></div>
                <div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarUsuariosActivos()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="activosResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarUsuariosActivos();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarUsuariosActivos() {
  const desde = document.getElementById("activosDesde")?.value;
  const hasta = document.getElementById("activosHasta")?.value;
  const limite = document.getElementById("activosLimite")?.value || 10;
  const resultado = document.getElementById("activosResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  const lim = Number(limite);
  if (!Number.isInteger(lim) || lim < 1 || lim > 50) {
    resultado.innerHTML = `<div class="alert alert-warning">El límite debe ser un número entero entre 1 y 50.</div>`;
    return;
  }
  try {
    const data = await api.request(
      `/reportes/usuarios/mas-activos?desde=${desde}&hasta=${hasta}&limite=${limite}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay actividad registrada</div>`;
      return;
    }
    // % de participación = acciones del usuario / total de acciones del ranking
    const totalAcciones = data.detalle.reduce(
      (suma, item) => suma + (Number(item.cantidad_acciones) || 0),
      0,
    );
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Top ${data.detalle.length} Usuarios Más Activos</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>#</th><th>Usuario</th><th class="text-end">Cantidad de Acciones</th><th>Participación</th></tr></thead>
            <tbody>${data.detalle
              .map((item, index) => {
                const pct =
                  totalAcciones > 0
                    ? (item.cantidad_acciones / totalAcciones) * 100
                    : 0;
                const medal =
                  index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : "";
                return `<tr><td>${medal} ${index + 1}</td><td><strong>${item.nombre_usuario}</strong></td><td class="text-end fw-bold">${item.cantidad_acciones}</td>
                        <td><div class="progress" style="height:20px;"><div class="progress-bar ${index === 0 ? "bg-success" : "bg-primary"}" role="progressbar" style="width:${pct}%;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">${pct.toFixed(1)}%</div></div></td></tr>`;
              })
              .join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${data.desde} al ${data.hasta}</div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteBitacora() {
  const container = document.getElementById("reporteBitacoraContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="bitacoraDesde" value="${_fechaLocalISO(hace30Dias)}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="bitacoraHasta" value="${_fechaLocalISO(hoy)}"></div>
                <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="actualizarBitacora()"><i class="fas fa-search me-1"></i>Consultar</button></div>
            </div>
            <div id="bitacoraResultado"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando datos...</p></div></div>
        `;
    await actualizarBitacora();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function actualizarBitacora() {
  const desde = document.getElementById("bitacoraDesde")?.value;
  const hasta = document.getElementById("bitacoraHasta")?.value;
  const resultado = document.getElementById("bitacoraResultado");
  if (!desde || !hasta || !resultado) return;
  if (_rangoFechasInvalido(desde, hasta, resultado)) return;
  try {
    const data = await api.request(
      `/reportes/usuarios/bitacora?desde=${desde}&hasta=${hasta}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay actividades registradas</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Bitácora de Actividades (${data.cantidad} registros${data.cantidad >= 500 ? ", se muestran los 500 más recientes; reduce el rango de fechas para ver el resto" : ""})</h6></div>
            <div class="card-body"><div class="table-responsive" style="max-height:400px;overflow-y:auto;">
            <table class="table table-hover table-striped table-sm">
            <thead class="sticky-top bg-light"><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th></tr></thead>
            <tbody>${data.detalle
              .map(
                (
                  item,
                ) => `<tr><td><small>${item.fecha ? new Date(item.fecha).toLocaleString() : "--"}</small></td>
                    <td><strong>${item.nombre_usuario || "--"}</strong></td>
                    <td><span class="badge ${item.accion === "LOGIN" ? "bg-success" : item.accion === "LOGIN_FALLIDO" ? "bg-danger" : "bg-info"}">${item.accion || "--"}</span></td>
                    <td>${item.modulo || "--"}</td></tr>`,
              )
              .join("")}</tbody></table></div></div></div>
            <div class="mt-3 text-muted small"><i class="fas fa-info-circle me-1"></i>Período: ${data.desde} al ${data.hasta}</div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteVentasDiarias() {
  const container = document.getElementById("reporteVentasDiariasContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const fecha = _fechaLocalISO(hoy);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha</label>
                    <input type="date" class="form-control form-control-sm" id="ventasDiariasFecha" value="${fecha}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarVentasDiarias()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarVentasDiariasPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarVentasDiariasExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="ventasDiariasResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarVentasDiarias();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteConciliacion() {
  const container = document.getElementById("reporteConciliacionContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const fecha = _fechaLocalISO(hoy);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha</label>
                    <input type="date" class="form-control form-control-sm" id="conciliacionFecha" value="${fecha}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarConciliacion()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarConciliacionPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarConciliacionExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="conciliacionResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarConciliacion();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteCuadreCaja() {
  const container = document.getElementById("reporteCuadreCajaContainer");
  if (!container) return;

  try {
    const turnos = await api.getCajaTurnos().catch(() => []);
    await cargarNombresPersonas();

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Seleccionar Turno</label>
                    <select class="form-select form-select-sm" id="cuadreTurnoSelect" onchange="actualizarCuadreCaja()">
                        <option value="">Seleccionar turno</option>
                        ${turnos
                          .map(
                            (t) => `
                            <option value="${t.id}">${escaparHtmlReporteTurno(etiquetaTurno(t, { conEstado: true }))}</option>
                        `,
                          )
                          .join("")}
                    </select>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarCuadreCaja()">
                        <i class="fas fa-sync me-1"></i>Actualizar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarCuadreCajaPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarCuadreCajaExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="cuadreCajaResultado">
                <div class="text-center py-5">
                    <p class="text-muted">Selecciona un turno para ver el cuadre</p>
                </div>
            </div>
        `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteUtilidad() {
  const container = document.getElementById("reporteUtilidadContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="utilidadFechaInicio" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="utilidadFechaFin" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarUtilidad()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarUtilidadPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarUtilidadExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="utilidadResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarUtilidad();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteTopProductos() {
  const container = document.getElementById("reporteTopProductosContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="topFechaInicio" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="topFechaFin" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2">
                    <label class="form-label small">Límite</label>
                    <input type="number" class="form-control form-control-sm" id="topLimite" value="10" min="1" max="50">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarTopProductos()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-2 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarTopProductosPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarTopProductosExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="topProductosResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarTopProductos();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteComprasResumen() {
  const container = document.getElementById("reporteComprasResumenContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="comprasResumenDesde" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="comprasResumenHasta" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarComprasResumen()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarComprasResumenPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarComprasResumenExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="comprasResumenResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarComprasResumen();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteComprasProveedor() {
  const container = document.getElementById("reporteComprasProveedorContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="comprasProvDesde" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="comprasProvHasta" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarComprasProveedor()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarComprasProveedorPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarComprasProveedorExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="comprasProvResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarComprasProveedor();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteCuentasPagar() {
  const container = document.getElementById("reporteCuentasPagarContainer");
  if (!container) return;

  try {
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarCuentasPagarPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarCuentasPagarExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="cuentasPagarResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarCuentasPagar();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteStockBajo() {
  const container = document.getElementById("reporteStockBajoContainer");
  if (!container) return;

  try {
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarStockBajoPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarStockBajoExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="stockBajoResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarStockBajo();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteMovimientosResumen() {
  const container = document.getElementById(
    "reporteMovimientosResumenContainer",
  );
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="movResumenDesde" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="movResumenHasta" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarMovimientosResumen()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarMovimientosResumenPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarMovimientosResumenExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="movResumenResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarMovimientosResumen();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteInventarioValorizado() {
  const container = document.getElementById(
    "reporteInventarioValorizadoContainer",
  );
  if (!container) return;

  try {
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarInventarioValorizadoPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarInventarioValorizadoExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="invValorizadoResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarInventarioValorizado();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteLoginResumen() {
  const container = document.getElementById("reporteLoginResumenContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="loginDesde" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="loginHasta" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarLoginResumen()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarLoginResumenPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarLoginResumenExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="loginResumenResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarLoginResumen();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteUsuariosActivos() {
  const container = document.getElementById("reporteUsuariosActivosContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="activosDesde" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="activosHasta" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2">
                    <label class="form-label small">Límite</label>
                    <input type="number" class="form-control form-control-sm" id="activosLimite" value="10" min="1" max="50">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarUsuariosActivos()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-2 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarUsuariosActivosPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarUsuariosActivosExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="activosResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarUsuariosActivos();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function cargarReporteBitacora() {
  const container = document.getElementById("reporteBitacoraContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="bitacoraDesde" value="${_fechaLocalISO(hace30Dias)}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="bitacoraHasta" value="${_fechaLocalISO(hoy)}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarBitacora()">
                        <i class="fas fa-search me-1"></i>Consultar
                    </button>
                </div>
                <div class="col-md-4 d-flex align-items-end gap-1">
                    <button class="btn btn-success btn-sm" onclick="exportarBitacoraPDF()" title="Exportar a PDF">
                        <i class="fas fa-file-pdf me-1"></i>PDF
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarBitacoraExcel()" title="Exportar a Excel">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="bitacoraResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarBitacora();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// EXPORTAR REPORTES A PDF Y EXCEL
// ============================================================

/**
 * Exporta el contenido de un contenedor a PDF
 * @param {string} containerId - ID del contenedor con los datos
 * @param {string} titulo - Título del reporte
 */
// Antes el PDF se armaba "tomando una foto" de la tabla (html2pdf). Con
// tablas largas, como la bitácora, la imagen pasaba del tamaño máximo que
// permite el navegador y todas las páginas salían en blanco. Ahora el PDF
// se arma con el texto de la tabla (jsPDF + autoTable): pesa menos, se
// puede seleccionar el texto y reparte las filas en las páginas que hagan falta.
const URL_JSPDF = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
const URL_JSPDF_AUTOTABLE =
  "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js";
const _scriptsCargados = {};

function cargarScriptUnaVez(url) {
  if (!_scriptsCargados[url]) {
    _scriptsCargados[url] = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = () => {
        delete _scriptsCargados[url];
        reject(new Error("No se pudo cargar el generador de PDF (revisa la conexión a internet)"));
      };
      document.head.appendChild(script);
    });
  }
  return _scriptsCargados[url];
}

async function exportarPDF(containerId, titulo = "Reporte") {
  const container = document.getElementById(containerId);
  if (!container) {
    showToast("No hay datos para exportar", "warning");
    return;
  }

  // Buscar la tabla dentro del contenedor
  const tabla = container.querySelector("table");
  if (!tabla) {
    showToast("No hay datos para exportar en este reporte", "warning");
    return;
  }

  try {
    await cargarScriptUnaVez(URL_JSPDF);
    await cargarScriptUnaVez(URL_JSPDF_AUTOTABLE);
    const { jsPDF } = window.jspdf;

    // jsPDF no puede dibujar emojis (salían como "Ø>ÝG"), así que se quitan
    const texto = (el) => (el?.innerText || el?.textContent || "")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/\s+/g, " ").trim();

    // Encabezados (se omite la columna de botones "Acciones")
    const filaEncabezado = tabla.querySelector("thead tr") || tabla.querySelector("tr");
    const encabezados = [...(filaEncabezado?.children || [])].map(texto);
    const columnasOmitidas = new Set(
      encabezados
        .map((t, i) => (/^acciones$/i.test(t) ? i : -1))
        .filter((i) => i >= 0),
    );
    const head = [encabezados.filter((_, i) => !columnasOmitidas.has(i))];

    // Filas visibles (si hay un filtro aplicado, solo lo que se ve)
    const filas = [...tabla.querySelectorAll("tbody tr")].filter(
      (tr) => tr.style.display !== "none" && tr !== filaEncabezado,
    );
    const body = filas
      .map((tr) => [...tr.children].map(texto).filter((_, i) => !columnasOmitidas.has(i)))
      .filter((celdas) => celdas.some((c) => c));

    if (body.length === 0) {
      showToast("La tabla no tiene filas para exportar", "warning");
      return;
    }

    const moduloActual =
      document.querySelector("#mainContent .nav-link.active")?.textContent?.trim() || "";
    const usuario = window.app?.user?.nombre_usuario || "Usuario";
    const fechaTexto = new Date().toLocaleString("es-GT");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();

    doc.setFontSize(14);
    doc.setTextColor(26, 35, 126);
    doc.text("Librería y Papelería Jesús de la Misericordia", anchoPagina / 2, 12, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(51, 51, 51);
    const subtitulo = `${titulo.replace(/_/g, " ")}${moduloActual ? " - " + moduloActual : ""}`;
    doc.text(subtitulo, anchoPagina / 2, 18, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(`Fecha: ${fechaTexto}  ·  ${body.length} registro(s)`, anchoPagina / 2, 23, { align: "center" });

    doc.autoTable({
      head,
      body,
      startY: 27,
      margin: { left: 8, right: 8, bottom: 12 },
      styles: { fontSize: 8, cellPadding: 1.5, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: () => {
        const pagina = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generado por: ${usuario}  ·  ${fechaTexto}`, 8, altoPagina - 5);
        doc.text(`Página ${pagina}`, anchoPagina - 8, altoPagina - 5, { align: "right" });
      },
    });

    doc.save(`${titulo}_${_fechaLocalISO()}.pdf`);
    showToast("✅ PDF exportado correctamente", "success");
  } catch (error) {
    console.error("Error exportando PDF:", error);
    showToast("❌ Error al exportar PDF: " + error.message, "error");
  }
}

/**
 * Exporta el contenido de un contenedor a Excel
 * @param {string} containerId - ID del contenedor con los datos
 * @param {string} titulo - Título del reporte
 */
function exportarExcel(containerId, titulo = "Reporte") {
  const container = document.getElementById(containerId);
  if (!container) {
    showToast("No hay datos para exportar", "warning");
    return;
  }

  // Buscar la tabla dentro del contenedor
  const tabla = container.querySelector("table");
  if (!tabla) {
    showToast("No hay datos para exportar en este reporte", "warning");
    return;
  }

  try {
    // Convertir tabla a libro de Excel
    const wb = XLSX.utils.table_to_book(tabla, {
      sheet: titulo.substring(0, 31), // Excel limita a 31 caracteres
      raw: true,
    });

    // Generar archivo
    const nombre = `${titulo}_${_fechaLocalISO()}.xlsx`;
    XLSX.writeFile(wb, nombre);

    showToast("✅ Excel exportado correctamente", "success");
  } catch (error) {
    console.error("Error exportando Excel:", error);
    showToast("❌ Error al exportar Excel: " + error.message, "error");
  }
}

// Funciones específicas para cada reporte (para usar desde los botones)
function exportarVentasDiariasPDF() {
  exportarPDF("ventasDiariasResultado", "Ventas_Diarias");
}

function exportarVentasDiariasExcel() {
  exportarExcel("ventasDiariasResultado", "Ventas_Diarias");
}

function exportarConciliacionPDF() {
  exportarPDF("conciliacionResultado", "Conciliacion_Pagos");
}

function exportarConciliacionExcel() {
  exportarExcel("conciliacionResultado", "Conciliacion_Pagos");
}

function exportarCuadreCajaPDF() {
  exportarPDF("cuadreCajaResultado", "Cuadre_Caja");
}

function exportarCuadreCajaExcel() {
  exportarExcel("cuadreCajaResultado", "Cuadre_Caja");
}

function exportarUtilidadPDF() {
  exportarPDF("utilidadResultado", "Utilidad_Productos");
}

function exportarUtilidadExcel() {
  exportarExcel("utilidadResultado", "Utilidad_Productos");
}

function exportarTopProductosPDF() {
  exportarPDF("topProductosResultado", "Top_Productos");
}

function exportarTopProductosExcel() {
  exportarExcel("topProductosResultado", "Top_Productos");
}

// Exportar funciones globales
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;
window.exportarVentasDiariasPDF = exportarVentasDiariasPDF;
window.exportarVentasDiariasExcel = exportarVentasDiariasExcel;
window.exportarConciliacionPDF = exportarConciliacionPDF;
window.exportarConciliacionExcel = exportarConciliacionExcel;
window.exportarCuadreCajaPDF = exportarCuadreCajaPDF;
window.exportarCuadreCajaExcel = exportarCuadreCajaExcel;
window.exportarUtilidadPDF = exportarUtilidadPDF;
window.exportarUtilidadExcel = exportarUtilidadExcel;
window.exportarTopProductosPDF = exportarTopProductosPDF;
window.exportarTopProductosExcel = exportarTopProductosExcel;

// ============================================================
// FUNCIONES GLOBALES PARA ACTUALIZAR
// ============================================================
window.loadReportesModule = loadReportesModule;

// Ventas
window.actualizarVentasDiarias = actualizarVentasDiarias;
window.actualizarConciliacion = actualizarConciliacion;
window.actualizarCuadreCaja = actualizarCuadreCaja;
window.actualizarUtilidad = actualizarUtilidad;
window.actualizarTopProductos = actualizarTopProductos;

// Compras
window.actualizarComprasResumen = actualizarComprasResumen;
window.actualizarComprasProveedor = actualizarComprasProveedor;
window.actualizarCuentasPagar = actualizarCuentasPagar;

// Inventario
window.actualizarStockBajo = actualizarStockBajo;
window.actualizarMovimientosResumen = actualizarMovimientosResumen;
window.actualizarInventarioValorizado = actualizarInventarioValorizado;

// Usuarios
window.actualizarLoginResumen = actualizarLoginResumen;
window.actualizarUsuariosActivos = actualizarUsuariosActivos;
window.actualizarBitacora = actualizarBitacora;

// ============================================================
// FUNCIONES DE EXPORTACIÓN PARA CADA REPORTE
// ============================================================

// Ventas
function exportarVentasDiariasPDF() {
  exportarPDF("ventasDiariasResultado", "Ventas_Diarias");
}
function exportarVentasDiariasExcel() {
  exportarExcel("ventasDiariasResultado", "Ventas_Diarias");
}
function exportarConciliacionPDF() {
  exportarPDF("conciliacionResultado", "Conciliacion_Pagos");
}
function exportarConciliacionExcel() {
  exportarExcel("conciliacionResultado", "Conciliacion_Pagos");
}
function exportarCuadreCajaPDF() {
  exportarPDF("cuadreCajaResultado", "Cuadre_Caja");
}
function exportarCuadreCajaExcel() {
  exportarExcel("cuadreCajaResultado", "Cuadre_Caja");
}
function exportarUtilidadPDF() {
  exportarPDF("utilidadResultado", "Utilidad_Productos");
}
function exportarUtilidadExcel() {
  exportarExcel("utilidadResultado", "Utilidad_Productos");
}
function exportarTopProductosPDF() {
  exportarPDF("topProductosResultado", "Top_Productos");
}
function exportarTopProductosExcel() {
  exportarExcel("topProductosResultado", "Top_Productos");
}

// Compras
function exportarComprasResumenPDF() {
  exportarPDF("comprasResumenResultado", "Compras_Resumen");
}
function exportarComprasResumenExcel() {
  exportarExcel("comprasResumenResultado", "Compras_Resumen");
}
function exportarComprasProveedorPDF() {
  exportarPDF("comprasProvResultado", "Compras_Proveedor");
}
function exportarComprasProveedorExcel() {
  exportarExcel("comprasProvResultado", "Compras_Proveedor");
}
function exportarCuentasPagarPDF() {
  exportarPDF("cuentasPagarResultado", "Cuentas_Pagar");
}
function exportarCuentasPagarExcel() {
  exportarExcel("cuentasPagarResultado", "Cuentas_Pagar");
}

// Inventario
function exportarStockBajoPDF() {
  exportarPDF("stockBajoResultado", "Stock_Bajo");
}
function exportarStockBajoExcel() {
  exportarExcel("stockBajoResultado", "Stock_Bajo");
}
function exportarExcesosInventarioPDF() {
  exportarPDF("excesosInventarioResultado", "Excesos_Inventario");
}
function exportarExcesosInventarioExcel() {
  exportarExcel("excesosInventarioResultado", "Excesos_Inventario");
}
function exportarMovimientosResumenPDF() {
  exportarPDF("movResumenResultado", "Movimientos_Resumen");
}
function exportarMovimientosResumenExcel() {
  exportarExcel("movResumenResultado", "Movimientos_Resumen");
}
function exportarInventarioValorizadoPDF() {
  exportarPDF("invValorizadoResultado", "Inventario_Valorizado");
}
function exportarInventarioValorizadoExcel() {
  exportarExcel("invValorizadoResultado", "Inventario_Valorizado");
}

// Usuarios
function exportarLoginResumenPDF() {
  exportarPDF("loginResumenResultado", "Login_Resumen");
}
function exportarLoginResumenExcel() {
  exportarExcel("loginResumenResultado", "Login_Resumen");
}
function exportarUsuariosActivosPDF() {
  exportarPDF("activosResultado", "Usuarios_Activos");
}
function exportarUsuariosActivosExcel() {
  exportarExcel("activosResultado", "Usuarios_Activos");
}
function exportarBitacoraPDF() {
  exportarPDF("bitacoraResultado", "Bitacora_Actividades");
}
function exportarBitacoraExcel() {
  exportarExcel("bitacoraResultado", "Bitacora_Actividades");
}
