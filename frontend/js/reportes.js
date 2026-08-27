// reportes.js

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

        <ul class="nav nav-tabs mb-3" id="reportesTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#reporteVentasDiarias">
                    <i class="fas fa-calendar-day me-1"></i>Ventas Diarias
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#reporteConciliacion">
                    <i class="fas fa-hand-holding-usd me-1"></i>Conciliación Pagos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#reporteCuadreCaja">
                    <i class="fas fa-cash-register me-1"></i>Cuadre de Caja
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#reporteUtilidad">
                    <i class="fas fa-chart-line me-1"></i>Utilidad por Producto
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#reporteTopProductos">
                    <i class="fas fa-trophy me-1"></i>Top Productos
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <div class="tab-pane fade show active" id="reporteVentasDiarias">
                <div id="reporteVentasDiariasContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando reporte de ventas diarias...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="reporteConciliacion">
                <div id="reporteConciliacionContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando conciliación de pagos...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="reporteCuadreCaja">
                <div id="reporteCuadreCajaContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando cuadre de caja...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="reporteUtilidad">
                <div id="reporteUtilidadContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando utilidad por producto...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="reporteTopProductos">
                <div id="reporteTopProductosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando top productos más vendidos...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Cargar todos los reportes
  await Promise.all([
    cargarReporteVentasDiarias(),
    cargarReporteConciliacion(),
    cargarReporteCuadreCaja(),
    cargarReporteUtilidad(),
    cargarReporteTopProductos(),
  ]);
}

// ============================================================
// 1. REPORTE DE VENTAS DIARIAS
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
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando datos...</p>
                </div>
            </div>
        `;

    await actualizarVentasDiarias();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar reporte: ${error.message}</div>`;
  }
}

async function actualizarVentasDiarias() {
  const fecha = document.getElementById("ventasDiariasFecha").value;
  const resultado = document.getElementById("ventasDiariasResultado");

  if (!fecha) {
    resultado.innerHTML = `<div class="alert alert-warning">Selecciona una fecha</div>`;
    return;
  }

  try {
    const data = await api.request(`/reportes/ventas-diarias?fecha=${fecha}`);

    if (!data) {
      resultado.innerHTML = `<div class="alert alert-warning">No se encontraron datos para esta fecha</div>`;
      return;
    }

    resultado.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="card bg-primary bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Cantidad Ventas</h6>
                            <h3 class="text-primary">${data.cantidad_ventas || 0}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Subtotal</h6>
                            <h3 class="text-info">Q${(data.subtotal || 0).toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Descuentos</h6>
                            <h3 class="text-warning">Q${(data.descuento || 0).toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Total</h6>
                            <h3 class="text-success">Q${(data.total || 0).toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-3 text-muted small">
                <i class="fas fa-info-circle me-1"></i>
                Reporte del día: ${data.fecha}
            </div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// 2. CONCILIACIÓN DE PAGOS
// ============================================================
async function cargarReporteConciliacion() {
  const container = document.getElementById("reporteConciliacionContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const fecha = hoy.toISOString().split("T")[0];

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label small">Fecha</label>
                    <input type="date" class="form-control form-control-sm" id="conciliacionFecha" value="${fecha}">
                </div>
                <div class="col-md-4 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarConciliacion()">
                        <i class="fas fa-search me-1"></i>Consultar
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
    container.innerHTML = `<div class="alert alert-danger">Error al cargar reporte: ${error.message}</div>`;
  }
}

async function actualizarConciliacion() {
  const fecha = document.getElementById("conciliacionFecha").value;
  const resultado = document.getElementById("conciliacionResultado");

  if (!fecha) {
    resultado.innerHTML = `<div class="alert alert-warning">Selecciona una fecha</div>`;
    return;
  }

  try {
    const data = await api.request(
      `/reportes/conciliacion-pagos?fecha=${fecha}`,
    );

    if (!data || !data.desglose || data.desglose.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay pagos registrados para esta fecha</div>`;
      return;
    }

    let html = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-success bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Total General</h6>
                            <h3 class="text-success">Q${(data.total_general || 0).toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0 fw-bold">Desglose por Método de Pago</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>Método de Pago</th>
                                    <th class="text-end">Monto</th>
                                    <th class="text-end">Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.desglose
                                  .map((item) => {
                                    const porcentaje =
                                      data.total_general > 0
                                        ? (item.monto / data.total_general) *
                                          100
                                        : 0;
                                    return `
                                        <tr>
                                            <td><strong>${item.tipo_pago}</strong></td>
                                            <td class="text-end">Q${(item.monto || 0).toFixed(2)}</td>
                                            <td class="text-end">${porcentaje.toFixed(1)}%</td>
                                        </tr>
                                    `;
                                  })
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="mt-3 text-muted small">
                <i class="fas fa-info-circle me-1"></i>
                Conciliación del día: ${data.fecha}
            </div>
        `;

    resultado.innerHTML = html;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// 3. CUADRE DE CAJA
// ============================================================
async function cargarReporteCuadreCaja() {
  const container = document.getElementById("reporteCuadreCajaContainer");
  if (!container) return;

  try {
    // Obtener turnos disponibles
    const turnos = await api.getCajaTurnos().catch(() => []);

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4">
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
            </div>
            <div id="cuadreCajaResultado">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Selecciona un turno para ver el cuadre...</p>
                </div>
            </div>
        `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar reporte: ${error.message}</div>`;
  }
}

async function actualizarCuadreCaja() {
  const turnoId = document.getElementById("cuadreTurnoSelect").value;
  const resultado = document.getElementById("cuadreCajaResultado");

  if (!turnoId) {
    resultado.innerHTML = `
            <div class="text-center py-5">
                <p class="text-muted">Selecciona un turno para ver el cuadre</p>
            </div>
        `;
    return;
  }

  try {
    const data = await api.request(`/reportes/cuadre-caja/${turnoId}`);

    if (!data) {
      resultado.innerHTML = `<div class="alert alert-warning">No se encontraron datos para este turno</div>`;
      return;
    }

    const diferencia =
      data.diferencia !== null
        ? data.diferencia
        : data.total_contado - data.total_ventas;
    const estadoColor = data.estado === "Abierto" ? "success" : "secondary";
    const diferenciaColor = diferencia >= 0 ? "success" : "danger";

    resultado.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0 fw-bold">Cuadre de Caja - Turno #${data.id_turno}</h6>
                        <span class="badge bg-${estadoColor}">${data.estado}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card bg-info bg-opacity-10">
                                <div class="card-body text-center">
                                    <h6 class="text-muted">Fondo Inicial</h6>
                                    <h4 class="text-info">Q${(data.fondo_inicial || 0).toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success bg-opacity-10">
                                <div class="card-body text-center">
                                    <h6 class="text-muted">Total Ventas</h6>
                                    <h4 class="text-success">Q${(data.total_ventas || 0).toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-primary bg-opacity-10">
                                <div class="card-body text-center">
                                    <h6 class="text-muted">Total Contado</h6>
                                    <h4 class="text-primary">Q${(data.total_contado || 0).toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-${diferenciaColor} bg-opacity-10">
                                <div class="card-body text-center">
                                    <h6 class="text-muted">Diferencia</h6>
                                    <h4 class="text-${diferenciaColor}">Q${(diferencia || 0).toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <p><strong>Fecha Apertura:</strong> ${data.fecha_apertura ? new Date(data.fecha_apertura).toLocaleString() : "--"}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Fecha Cierre:</strong> ${data.fecha_cierre ? new Date(data.fecha_cierre).toLocaleString() : "--"}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// 4. UTILIDAD POR PRODUCTO
// ============================================================
async function cargarReporteUtilidad() {
  const container = document.getElementById("reporteUtilidadContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const fechaInicio = hace30Dias.toISOString().split("T")[0];
    const fechaFin = hoy.toISOString().split("T")[0];

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="utilidadFechaInicio" value="${fechaInicio}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="utilidadFechaFin" value="${fechaFin}">
                </div>
                <div class="col-md-3 d-flex align-items-end">
                    <button class="btn btn-primary btn-sm" onclick="actualizarUtilidad()">
                        <i class="fas fa-search me-1"></i>Consultar
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
    container.innerHTML = `<div class="alert alert-danger">Error al cargar reporte: ${error.message}</div>`;
  }
}

async function actualizarUtilidad() {
  const fechaInicio = document.getElementById("utilidadFechaInicio").value;
  const fechaFin = document.getElementById("utilidadFechaFin").value;
  const resultado = document.getElementById("utilidadResultado");

  if (!fechaInicio || !fechaFin) {
    resultado.innerHTML = `<div class="alert alert-warning">Selecciona ambas fechas</div>`;
    return;
  }

  try {
    const data = await api.request(
      `/reportes/utilidad?desde=${fechaInicio}&hasta=${fechaFin}`,
    );

    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay datos en el período seleccionado</div>`;
      return;
    }

    const totalUtilidad = data.total_utilidad || 0;
    const utilidadColor = totalUtilidad >= 0 ? "success" : "danger";

    let html = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="card bg-info bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Total Ingresos</h6>
                            <h4 class="text-info">Q${(data.total_ingresos || 0).toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Total Costo</h6>
                            <h4 class="text-warning">Q${(data.total_costo || 0).toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-${utilidadColor} bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Total Utilidad</h6>
                            <h4 class="text-${utilidadColor}">Q${(data.total_utilidad || 0).toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted">Margen</h6>
                            <h4 class="text-primary">${data.total_ingresos > 0 ? ((data.total_utilidad / data.total_ingresos) * 100).toFixed(1) : 0}%</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0 fw-bold">Detalle por Producto</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-end">Cantidad</th>
                                    <th class="text-end">Ingresos</th>
                                    <th class="text-end">Costo</th>
                                    <th class="text-end">Utilidad</th>
                                    <th class="text-end">Margen</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.detalle
                                  .map((item) => {
                                    const color =
                                      item.utilidad >= 0 ? "success" : "danger";
                                    return `
                                        <tr>
                                            <td><strong>${item.producto}</strong></td>
                                            <td class="text-end">${item.cantidad_vendida}</td>
                                            <td class="text-end">Q${(item.ingresos || 0).toFixed(2)}</td>
                                            <td class="text-end">Q${(item.costo || 0).toFixed(2)}</td>
                                            <td class="text-end text-${color}">Q${(item.utilidad || 0).toFixed(2)}</td>
                                            <td class="text-end">${(item.margen_porcentaje || 0).toFixed(1)}%</td>
                                        </tr>
                                    `;
                                  })
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="mt-3 text-muted small">
                <i class="fas fa-info-circle me-1"></i>
                Período: ${data.desde} al ${data.hasta}
            </div>
        `;

    resultado.innerHTML = html;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// 5. TOP PRODUCTOS MÁS VENDIDOS
// ============================================================
async function cargarReporteTopProductos() {
  const container = document.getElementById("reporteTopProductosContainer");
  if (!container) return;

  try {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const fechaInicio = hace30Dias.toISOString().split("T")[0];
    const fechaFin = hoy.toISOString().split("T")[0];

    container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label small">Fecha Desde</label>
                    <input type="date" class="form-control form-control-sm" id="topFechaInicio" value="${fechaInicio}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Fecha Hasta</label>
                    <input type="date" class="form-control form-control-sm" id="topFechaFin" value="${fechaFin}">
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
    container.innerHTML = `<div class="alert alert-danger">Error al cargar reporte: ${error.message}</div>`;
  }
}

async function actualizarTopProductos() {
  const fechaInicio = document.getElementById("topFechaInicio").value;
  const fechaFin = document.getElementById("topFechaFin").value;
  const limite = document.getElementById("topLimite").value || 10;
  const resultado = document.getElementById("topProductosResultado");

  if (!fechaInicio || !fechaFin) {
    resultado.innerHTML = `<div class="alert alert-warning">Selecciona ambas fechas</div>`;
    return;
  }

  try {
    const data = await api.request(
      `/reportes/productos-mas-vendidos?desde=${fechaInicio}&hasta=${fechaFin}&limite=${limite}`,
    );

    if (!data || data.length === 0) {
      resultado.innerHTML = `<div class="alert alert-warning">No hay productos vendidos en el período</div>`;
      return;
    }

    const maxCantidad = Math.max(
      ...data.map((item) => item.cantidad_vendida || 0),
    );

    let html = `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0 fw-bold">Top ${data.length} Productos Más Vendidos</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Producto</th>
                                    <th class="text-end">Cantidad Vendida</th>
                                    <th class="text-end">Total Vendido</th>
                                    <th>% Participación</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data
                                  .map((item, index) => {
                                    const porcentaje =
                                      maxCantidad > 0
                                        ? (item.cantidad_vendida /
                                            maxCantidad) *
                                          100
                                        : 0;
                                    return `
                                        <tr>
                                            <td>
                                                ${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                            </td>
                                            <td><strong>${item.producto}</strong></td>
                                            <td class="text-end"><span class="fw-bold">${item.cantidad_vendida}</span></td>
                                            <td class="text-end">Q${(item.total_vendido || 0).toFixed(2)}</td>
                                            <td>
                                                <div class="progress" style="height: 20px;">
                                                    <div class="progress-bar ${index === 0 ? "bg-success" : "bg-primary"}" 
                                                         role="progressbar" 
                                                         style="width: ${porcentaje}%;" 
                                                         aria-valuenow="${porcentaje}" 
                                                         aria-valuemin="0" 
                                                         aria-valuemax="100">
                                                        ${porcentaje.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                  })
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="mt-3 text-muted small">
                <i class="fas fa-info-circle me-1"></i>
                Período: ${fechaInicio} al ${fechaFin} | Total productos: ${data.length}
            </div>
        `;

    resultado.innerHTML = html;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// FUNCIONES GLOBALES PARA ACTUALIZAR
// ============================================================
window.loadReportesModule = loadReportesModule;
window.actualizarVentasDiarias = actualizarVentasDiarias;
window.actualizarConciliacion = actualizarConciliacion;
window.actualizarCuadreCaja = actualizarCuadreCaja;
window.actualizarUtilidad = actualizarUtilidad;
window.actualizarTopProductos = actualizarTopProductos;
