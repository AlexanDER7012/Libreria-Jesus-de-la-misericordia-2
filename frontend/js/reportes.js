// reportes.js - VERSIÓN COMPLETA CON TODOS LOS REPORTES ORGANIZADOS POR MÓDULOS

// ============================================================
// CARGA DEL MODULO DE REPORTES
// ============================================================
async function loadReportesModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-chart-bar me-2 text-primary"></i>Reportes</h4>
        </div>

        <!-- PESTAÑAS PRINCIPALES POR MÓDULO -->
        <ul class="nav nav-tabs mb-3" id="reportesTabs">
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
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subMovimientosResumen"><i class="fas fa-exchange-alt me-1"></i>Resumen de Movimientos</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#subInventarioValorizado"><i class="fas fa-dollar-sign me-1"></i>Inventario Valorizado</a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="subStockBajo"><div id="reporteStockBajoContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
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
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="subLoginResumen"><div id="reporteLoginResumenContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subUsuariosActivos"><div id="reporteUsuariosActivosContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
                    <div class="tab-pane fade" id="subBitacora"><div id="reporteBitacoraContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando...</p></div></div></div>
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
    cargarReporteMovimientosResumen(),
    cargarReporteInventarioValorizado(),
    // Usuarios
    cargarReporteLoginResumen(),
    cargarReporteUsuariosActivos(),
    cargarReporteBitacora(),
  ]);
}

// ============================================================
// REPORTES DE VENTAS (YA EXISTENTES - SE MANTIENEN)
// ============================================================

async function cargarReporteVentasDiarias() {
  const container = document.getElementById("reporteVentasDiariasContainer");
  if (!container) return;
  try {
    const hoy = new Date();
    const fecha = hoy.toISOString().split("T")[0];
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
    const fecha = hoy.toISOString().split("T")[0];
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
    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4"><label class="form-label small">Seleccionar Turno</label>
                    <select class="form-select form-select-sm" id="cuadreTurnoSelect" onchange="actualizarCuadreCaja()">
                        <option value="">Seleccionar turno</option>
                        ${turnos.map((t) => `<option value="${t.id}">Turno #${t.id} - ${t.fecha_apertura ? new Date(t.fecha_apertura).toLocaleDateString() : ""} (${t.estado})</option>`).join("")}
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
  if (!turnoId || !resultado) return;
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
            <div class="card"><div class="card-header"><div class="d-flex justify-content-between align-items-center"><h6 class="mb-0 fw-bold">Cuadre de Caja - Turno #${data.id_turno}</h6><span class="badge bg-${estadoColor}">${data.estado}</span></div></div>
            <div class="card-body"><div class="row">
                <div class="col-md-3"><div class="card bg-info bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Fondo Inicial</h6><h4 class="text-info">Q${(data.fondo_inicial || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-success bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Ventas</h6><h4 class="text-success">Q${(data.total_ventas || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-primary bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Total Contado</h6><h4 class="text-primary">Q${(data.total_contado || 0).toFixed(2)}</h4></div></div></div>
                <div class="col-md-3"><div class="card bg-${diferenciaColor} bg-opacity-10"><div class="card-body text-center"><h6 class="text-muted">Diferencia</h6><h4 class="text-${diferenciaColor}">Q${(diferencia || 0).toFixed(2)}</h4></div></div></div>
            </div>
            <div class="row mt-3"><div class="col-md-6"><p><strong>Fecha Apertura:</strong> ${data.fecha_apertura ? new Date(data.fecha_apertura).toLocaleString() : "--"}</p></div>
            <div class="col-md-6"><p><strong>Fecha Cierre:</strong> ${data.fecha_cierre ? new Date(data.fecha_cierre).toLocaleString() : "--"}</p></div></div></div></div>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="utilidadFechaInicio" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="utilidadFechaFin" value="${hoy.toISOString().split("T")[0]}"></div>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="topFechaInicio" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="topFechaFin" value="${hoy.toISOString().split("T")[0]}"></div>
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
  try {
    const data = await api.request(
      `/reportes/productos-mas-vendidos?desde=${desde}&hasta=${hasta}&limite=${limite}`,
    );
    if (!data || data.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay productos vendidos en el período</div>`;
      return;
    }
    const maxCantidad = Math.max(
      ...data.map((item) => item.cantidad_vendida || 0),
    );
    let html = `<div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Top ${data.length} Productos Más Vendidos</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>#</th><th>Producto</th><th class="text-end">Cantidad Vendida</th><th class="text-end">Total Vendido</th><th>% Participación</th></tr></thead>
            <tbody>${data
              .map((item, index) => {
                const pct =
                  maxCantidad > 0
                    ? (item.cantidad_vendida / maxCantidad) * 100
                    : 0;
                const medal =
                  index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : `#${index + 1}`;
                return `<tr><td>${medal}</td><td><strong>${item.producto}</strong></td>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="comprasResumenDesde" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="comprasResumenHasta" value="${hoy.toISOString().split("T")[0]}"></div>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="comprasProvDesde" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="comprasProvHasta" value="${hoy.toISOString().split("T")[0]}"></div>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="movResumenDesde" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="movResumenHasta" value="${hoy.toISOString().split("T")[0]}"></div>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="loginDesde" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="loginHasta" value="${hoy.toISOString().split("T")[0]}"></div>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="activosDesde" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="activosHasta" value="${hoy.toISOString().split("T")[0]}"></div>
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
  try {
    const data = await api.request(
      `/reportes/usuarios/mas-activos?desde=${desde}&hasta=${hasta}&limite=${limite}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay actividad registrada</div>`;
      return;
    }
    const maxAcciones = Math.max(
      ...data.detalle.map((item) => item.cantidad_acciones || 0),
    );
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Top ${data.detalle.length} Usuarios Más Activos</h6></div>
            <div class="card-body"><div class="table-responsive"><table class="table table-hover table-striped">
            <thead><tr><th>#</th><th>Usuario</th><th class="text-end">Acciones</th><th>Participación</th></tr></thead>
            <tbody>${data.detalle
              .map((item, index) => {
                const pct =
                  maxAcciones > 0
                    ? (item.cantidad_acciones / maxAcciones) * 100
                    : 0;
                const medal =
                  index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : `#${index + 1}`;
                return `<tr><td>${medal}</td><td><strong>${item.nombre_usuario}</strong></td><td class="text-end fw-bold">${item.cantidad_acciones}</td>
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
                <div class="col-md-3"><label class="form-label small">Fecha Desde</label><input type="date" class="form-control form-control-sm" id="bitacoraDesde" value="${hace30Dias.toISOString().split("T")[0]}"></div>
                <div class="col-md-3"><label class="form-label small">Fecha Hasta</label><input type="date" class="form-control form-control-sm" id="bitacoraHasta" value="${hoy.toISOString().split("T")[0]}"></div>
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
  try {
    const data = await api.request(
      `/reportes/usuarios/bitacora?desde=${desde}&hasta=${hasta}`,
    );
    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay actividades registradas</div>`;
      return;
    }
    resultado.innerHTML = `
            <div class="card"><div class="card-header"><h6 class="mb-0 fw-bold">Bitácora de Actividades (${data.cantidad} registros)</h6></div>
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
    const fecha = hoy.toISOString().split("T")[0];

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
    const fecha = hoy.toISOString().split("T")[0];

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

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Seleccionar Turno</label>
                    <select class="form-select form-select-sm" id="cuadreTurnoSelect" onchange="actualizarCuadreCaja()">
                        <option value="">Seleccionar turno</option>
                        ${turnos
                          .map(
                            (t) => `
                            <option value="${t.id}">Turno #${t.id} - ${t.fecha_apertura ? new Date(t.fecha_apertura).toLocaleDateString() : ""} (${t.estado})</option>
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
                    <input type="date" class="form-control form-control-sm" id="utilidadFechaInicio" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="utilidadFechaFin" value="${hoy.toISOString().split("T")[0]}">
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
                    <input type="date" class="form-control form-control-sm" id="topFechaInicio" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="topFechaFin" value="${hoy.toISOString().split("T")[0]}">
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
                    <input type="date" class="form-control form-control-sm" id="comprasResumenDesde" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="comprasResumenHasta" value="${hoy.toISOString().split("T")[0]}">
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
                    <input type="date" class="form-control form-control-sm" id="comprasProvDesde" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="comprasProvHasta" value="${hoy.toISOString().split("T")[0]}">
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
                    <input type="date" class="form-control form-control-sm" id="movResumenDesde" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="movResumenHasta" value="${hoy.toISOString().split("T")[0]}">
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
                    <input type="date" class="form-control form-control-sm" id="loginDesde" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="loginHasta" value="${hoy.toISOString().split("T")[0]}">
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
                    <input type="date" class="form-control form-control-sm" id="activosDesde" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="activosHasta" value="${hoy.toISOString().split("T")[0]}">
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
                    <input type="date" class="form-control form-control-sm" id="bitacoraDesde" value="${hace30Dias.toISOString().split("T")[0]}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="bitacoraHasta" value="${hoy.toISOString().split("T")[0]}">
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
async function exportarPDF(containerId, titulo = "Reporte") {
  const container = document.getElementById(containerId);
  if (!container) {
    showToast("No hay datos para exportar", "warning");
    return;
  }

  // Buscar la tabla dentro del contenedor
  const tabla = container.querySelector("table");
  if (!tabla) {
    showToast("No se encontró una tabla para exportar", "warning");
    return;
  }

  try {
    // Crear un contenedor temporal con el contenido formateado
    const contenido = document.createElement("div");
    contenido.style.padding = "20px";
    contenido.style.fontFamily = "Arial, sans-serif";
    contenido.style.background = "white";

    // Obtener el nombre del módulo actual
    const moduloActual =
      document.querySelector(".nav-link.active")?.textContent?.trim() ||
      "Reporte";

    contenido.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #1a237e; font-size: 18px; margin: 0;">Librería y Papelería Jesús de la Misericordia</h1>
                <h2 style="color: #333; font-size: 14px; margin: 5px 0;">${titulo} - ${moduloActual}</h2>
                <p style="color: #666; font-size: 11px; margin: 5px 0;">
                    Fecha: ${new Date().toLocaleString()}
                </p>
                <hr style="border: 1px solid #ddd;">
            </div>
            <div style="font-size: 12px;">
                ${tabla.outerHTML}
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                Reporte generado por: ${window.app?.user?.nombre_usuario || "Usuario"} | 
                Fecha: ${new Date().toLocaleString()}
            </div>
        `;

    // Estilizar la tabla para el PDF
    const estilo = contenido.querySelector("style");
    if (!estilo) {
      const styleTag = document.createElement("style");
      styleTag.textContent = `
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th { background-color: #1a237e; color: white; padding: 6px 8px; text-align: left; }
                td { padding: 4px 8px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f5f5f5; }
                .text-end { text-align: right; }
                .text-center { text-align: center; }
            `;
      contenido.prepend(styleTag);
    }

    // Agregar temporalmente al DOM
    document.body.appendChild(contenido);
    contenido.style.display = "block";

    // Generar PDF
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `${titulo}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "landscape",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    await html2pdf().set(opt).from(contenido).save();

    // Limpiar
    contenido.remove();
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
    showToast("No se encontró una tabla para exportar", "warning");
    return;
  }

  try {
    // Convertir tabla a libro de Excel
    const wb = XLSX.utils.table_to_book(tabla, {
      sheet: titulo.substring(0, 31), // Excel limita a 31 caracteres
      raw: true,
    });

    // Generar archivo
    const nombre = `${titulo}_${new Date().toISOString().split("T")[0]}.xlsx`;
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
