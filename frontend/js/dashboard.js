// dashboard.js
// =============================================
// DASHBOARD COMPLETO CON GRÁFICAS
// =============================================

let dashboardCharts = {}; // Guardamos instancias para destruirlas al recargar
let dashboardDataCache = null; // Cache de clientes/productos

// =============================================
// UTILIDADES
// =============================================
function escaparHtmlDashboard(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function _formatMoney(n) {
  return (
    "Q" +
    Number(n || 0).toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function _estaOscuro() {
  return document.documentElement.getAttribute("data-bs-theme") === "dark";
}

// =============================================
// CARGA PRINCIPAL DEL DASHBOARD
// =============================================
async function loadDashboardModule() {
  const container =
    document.getElementById("dashboardContainer") ||
    document.getElementById("mainContent");
  if (!container) return;

  if (
    container.id === "mainContent" &&
    document.getElementById("reportesTabs")
  ) {
    console.warn(
      "⚠️ loadDashboardModule() llamado sin #dashboardContainer. " +
        "Se aborta para no romper las pestañas de Reportes.",
    );
    return;
  }

  // Destruir gráficas previas
  Object.values(dashboardCharts).forEach((chart) => {
    try {
      chart.destroy();
    } catch (e) {}
  });
  dashboardCharts = {};

  // Verificar Chart.js
  if (typeof Chart === "undefined") {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Chart.js no está cargado.</strong>
        <p class="mb-0 mt-2 small">
          Agrega esta línea antes de <code>&lt;/body&gt;</code> en tu <code>index.html</code>:<br>
          <code>&lt;script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"&gt;&lt;/script&gt;</code>
        </p>
      </div>
    `;
    return;
  }

  // Mostrar spinner
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4><i class="fas fa-chart-line me-2 text-primary"></i>Dashboard</h4>
      <button class="btn btn-sm btn-outline-primary" onclick="loadDashboardModule()">
        <i class="fas fa-sync me-1"></i>Refrescar
      </button>
    </div>
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Cargando métricas...</p>
    </div>
  `;

  // Timeout de seguridad
  const timeoutId = setTimeout(() => {
    if (container.querySelector(".spinner-border")) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-clock me-2"></i>
          La carga está tardando más de lo esperado. 
          <button class="btn btn-sm btn-warning ms-2" onclick="loadDashboardModule()">
            Reintentar
          </button>
        </div>
      `;
    }
  }, 15000);

  try {
    // ============================================
    // CARGAR CLIENTES Y PRODUCTOS (con cache)
    // ============================================
    let clientes = dashboardDataCache?.clientes;
    let productos = dashboardDataCache?.productos;

    if (!clientes || !productos) {
      const [c, p] = await Promise.all([
        api.getClientes().catch(() => []),
        api.getProductos().catch(() => []),
      ]);
      clientes = c || [];
      productos = p || [];
      dashboardDataCache = { clientes, productos };
    }

    // ✅ Exponer globalmente para que las funciones de otros módulos las usen
    window.clientesData = clientes;
    window.productosData = productos;

    // ============================================
    // CIFRAS CALCULADAS EN EL SERVIDOR
    // (antes se calculaban aquí con solo las últimas 50 ventas, incluyendo
    // anuladas, y todas las ventas salían como "Pendiente")
    // ============================================
    const [d, cajaChica] = await Promise.all([
      api.request("/reportes/dashboard"),
      api.request("/caja-chica?skip=0&limit=5").catch(() => []),
    ]);

    clearTimeout(timeoutId);

    const ventasHoy = d.ventas_hoy || { cantidad: 0, total: 0 };
    const saldo = Number(d.saldo_neto || 0);
    const recientes = d.ventas_recientes || [];
    const bajoStock = d.bajo_stock || [];
    const badgeEstado = {
      Pagada: "bg-success",
      Pendiente: "bg-warning text-dark",
      Anulada: "bg-secondary",
    };

    // ============================================
    // RENDERIZAR
    // ============================================
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-chart-line me-2 text-primary"></i>Dashboard</h4>
        <button class="btn btn-sm btn-outline-primary" onclick="loadDashboardModule()">
          <i class="fas fa-sync me-1"></i>Refrescar
        </button>
      </div>

      <!-- KPI CARDS -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm kpi-card kpi-primary">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="kpi-label">Ventas Hoy</div>
                  <div class="kpi-value">${ventasHoy.cantidad}</div>
                  <div class="kpi-sub text-success">
                    <i class="fas fa-arrow-up me-1"></i>${_formatMoney(ventasHoy.total)}
                  </div>
                </div>
                <div class="kpi-icon bg-primary">
                  <i class="fas fa-shopping-cart"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm kpi-card kpi-success">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="kpi-label">Ingresos Totales</div>
                  <div class="kpi-value">${_formatMoney(d.ingresos_total)}</div>
                  <div class="kpi-sub text-muted">${d.cantidad_ventas} ventas</div>
                </div>
                <div class="kpi-icon bg-success">
                  <i class="fas fa-dollar-sign"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm kpi-card kpi-warning">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="kpi-label">Saldo Neto</div>
                  <div class="kpi-value ${saldo >= 0 ? "text-success" : "text-danger"}">
                    ${_formatMoney(saldo)}
                  </div>
                  <div class="kpi-sub text-muted" title="Ingresos por ventas menos compras">${d.ventas_con_saldo} ventas con saldo</div>
                </div>
                <div class="kpi-icon bg-warning">
                  <i class="fas fa-balance-scale"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm kpi-card kpi-danger">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="kpi-label">Alertas Stock</div>
                  <div class="kpi-value">${d.cantidad_bajo_stock}</div>
                  <div class="kpi-sub text-muted">${d.productos_activos} productos activos</div>
                </div>
                <div class="kpi-icon bg-danger">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- GRÁFICAS FILA 1 -->
      <div class="row g-3 mb-4">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="mb-0"><i class="fas fa-chart-line me-2 text-primary"></i>Ventas últimos 7 días</h6>
            </div>
            <div class="card-body">
              <canvas id="chartVentas7dias" height="100"></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="mb-0"><i class="fas fa-chart-pie me-2 text-success"></i>Productos por categoría</h6>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center">
              <canvas id="chartCategorias" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- GRÁFICAS FILA 2 -->
      <div class="row g-3 mb-4">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="mb-0"><i class="fas fa-chart-bar me-2 text-info"></i>Top 5 productos más vendidos</h6>
            </div>
            <div class="card-body">
              <canvas id="chartTopProductos" height="140"></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="mb-0"><i class="fas fa-chart-bar me-2 text-warning"></i>Ingresos últimos 6 meses</h6>
            </div>
            <div class="card-body">
              <canvas id="chartIngresosMes" height="140"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- VENTAS RECIENTES -->
      <div class="row g-3 mb-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
              <h6 class="mb-0"><i class="fas fa-clock me-2 text-primary"></i>Ventas Recientes</h6>
              <button class="btn btn-sm btn-outline-primary" onclick="window.app.loadModule('ventas')">
                Ver todas <i class="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
            <div class="card-body p-0">
              ${
                recientes.length > 0
                  ? `
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>#</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th class="text-end">Total</th>
                          <th class="text-center">Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        ${recientes
                          .map((v) => `
                            <tr>
                              <td><strong>#${v.id}</strong></td>
                              <td>${v.cliente ? escaparHtmlDashboard(v.cliente) : "Consumidor final"}</td>
                              <td>${v.fecha ? new Date(v.fecha).toLocaleDateString() : "--"}</td>
                              <td class="text-end"><strong>${_formatMoney(v.total)}</strong></td>
                              <td class="text-center">
                                <span class="badge ${badgeEstado[v.estado] || "bg-secondary"}">${v.estado}</span>
                              </td>
                              <td class="text-end">
                                <button class="btn btn-sm btn-outline-info" onclick="verVenta(${v.id})">
                                  <i class="fas fa-eye"></i>
                                </button>
                              </td>
                            </tr>`)
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                `
                  : `
                  <div class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                    <p>No hay ventas registradas</p>
                  </div>
                `
              }
            </div>
          </div>
        </div>
      </div>

      <!-- ALERTAS STOCK + MOVIMIENTOS -->
      <div class="row g-3">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="mb-0"><i class="fas fa-exclamation-triangle me-2 text-danger"></i>Productos bajo stock</h6>
            </div>
            <div class="card-body p-0">
              ${
                bajoStock.length > 0
                  ? `
                  <div class="table-responsive">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Producto</th>
                          <th class="text-end">Stock</th>
                          <th class="text-end">Mínimo</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${bajoStock
                          .map((a) => `
                            <tr>
                              <td>${escaparHtmlDashboard(a.producto)}</td>
                              <td class="text-end text-danger"><strong>${a.stock_actual}</strong></td>
                              <td class="text-end text-muted">${a.stock_minimo}</td>
                            </tr>`)
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                `
                  : `
                  <div class="text-center py-5 text-muted">
                    <i class="fas fa-check-circle fa-3x mb-3 text-success opacity-50"></i>
                    <p class="mb-0">Todo el stock está bien</p>
                  </div>
                `
              }
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="mb-0"><i class="fas fa-history me-2 text-info"></i>Últimos movimientos de caja</h6>
            </div>
            <div class="card-body p-0">
              ${
                cajaChica.length > 0
                  ? `
                  <div class="table-responsive">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th class="text-end">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${cajaChica
                          .slice(0, 5)
                          .map((m) => {
                            const ingreso = m.tipo === "ingreso";
                            return `
                            <tr>
                              <td>${m.fecha ? new Date(m.fecha).toLocaleDateString() : "--"}</td>
                              <td>
                                <span class="badge ${ingreso ? "bg-success" : "bg-danger"}">
                                  ${ingreso ? "Ingreso" : "Egreso"}
                                </span>
                              </td>
                              <td class="text-end ${ingreso ? "text-success" : "text-danger"}">
                                <strong>${ingreso ? "+" : "-"}${_formatMoney(m.monto)}</strong>
                              </td>
                            </tr>
                          `;
                          })
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                `
                  : `
                  <div class="text-center py-5 text-muted">
                    <i class="fas fa-coins fa-3x mb-3 opacity-50"></i>
                    <p class="mb-0">Sin movimientos registrados</p>
                  </div>
                `
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // ============================================
    // CREAR GRÁFICAS
    // ============================================
    crearGraficaVentas7Dias(d.ventas_7dias || []);
    crearGraficaCategorias(d.productos_por_categoria || []);
    crearGraficaTopProductos(d.top_productos || []);
    crearGraficaIngresosMes(d.ingresos_6meses || []);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error cargando dashboard:", error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error al cargar el dashboard:</strong>
        <p class="mb-0 mt-2">${error.message}</p>
        <button class="btn btn-sm btn-danger mt-2" onclick="loadDashboardModule()">
          <i class="fas fa-sync me-1"></i>Reintentar
        </button>
      </div>
    `;
  }
}

// =============================================
// GRÁFICA 1: VENTAS ÚLTIMOS 7 DÍAS (Línea)
// =============================================
function crearGraficaVentas7Dias(dias) {
  const ctx = document.getElementById("chartVentas7dias");
  if (!ctx) return;

  const labels = [];
  const dataCount = [];
  const dataMonto = [];

  dias.forEach((dia) => {
    const [y, m, dd] = dia.fecha.split("-").map(Number);
    labels.push(new Date(y, m - 1, dd).toLocaleDateString("es", { weekday: "short", day: "numeric" }));
    dataCount.push(dia.cantidad);
    dataMonto.push(dia.total);
  });

  const colorTexto = _estaOscuro() ? "#e8e8f0" : "#495057";
  const colorGrid = _estaOscuro()
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";

  dashboardCharts.ventas7dias = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Ventas",
          data: dataCount,
          borderColor: "#0d6efd",
          backgroundColor: "rgba(13, 110, 253, 0.12)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: "#0d6efd",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              return [
                `Ventas: ${dataCount[idx]}`,
                `Monto: ${_formatMoney(dataMonto[idx])}`,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: colorTexto, stepSize: 1 },
          grid: { color: colorGrid },
        },
        x: {
          ticks: { color: colorTexto },
          grid: { display: false },
        },
      },
    },
  });
}

// =============================================
// GRÁFICA 2: PRODUCTOS POR CATEGORÍA (Dona)
// =============================================
function crearGraficaCategorias(porCategoria) {
  const ctx = document.getElementById("chartCategorias");
  if (!ctx) return;

  const labels = porCategoria.map((c) => c.categoria);
  const data = porCategoria.map((c) => c.cantidad);

  if (labels.length === 0) {
    ctx.parentElement.innerHTML =
      '<p class="text-muted text-center my-5">Sin datos</p>';
    return;
  }

  const paleta = [
    "#0d6efd",
    "#198754",
    "#ffc107",
    "#dc3545",
    "#0dcaf0",
    "#6c757d",
    "#6f42c1",
    "#fd7e14",
  ];

  dashboardCharts.categorias = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: paleta.slice(0, labels.length),
          borderColor: _estaOscuro() ? "#1a1a2e" : "#fff",
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: _estaOscuro() ? "#e8e8f0" : "#495057",
            padding: 12,
            font: { size: 11 },
            usePointStyle: true,
          },
        },
      },
    },
  });
}

// =============================================
// GRÁFICA 3: TOP 5 PRODUCTOS (Barras horizontales)
// =============================================
function crearGraficaTopProductos(top5) {
  const ctx = document.getElementById("chartTopProductos");
  if (!ctx) return;

  top5 = top5.map((t) => ({ nombre: t.producto, cantidad: t.cantidad }));

  if (top5.length === 0) {
    ctx.parentElement.innerHTML =
      '<p class="text-muted text-center my-5">Sin datos</p>';
    return;
  }

  const colorTexto = _estaOscuro() ? "#e8e8f0" : "#495057";
  const colorGrid = _estaOscuro()
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";

  dashboardCharts.topProductos = new Chart(ctx, {
    type: "bar",
    data: {
      labels: top5.map((t) =>
        t.nombre.length > 25 ? t.nombre.substring(0, 25) + "..." : t.nombre,
      ),
      datasets: [
        {
          label: "Unidades vendidas",
          data: top5.map((t) => t.cantidad),
          backgroundColor: [
            "rgba(13, 110, 253, 0.85)",
            "rgba(25, 135, 84, 0.85)",
            "rgba(255, 193, 7, 0.85)",
            "rgba(220, 53, 69, 0.85)",
            "rgba(13, 202, 240, 0.85)",
          ],
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: colorTexto, stepSize: 1 },
          grid: { color: colorGrid },
        },
        y: {
          ticks: { color: colorTexto, font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

// =============================================
// GRÁFICA 4: INGRESOS ÚLTIMOS 6 MESES (Barras)
// =============================================
function crearGraficaIngresosMes(ingresosMeses) {
  const ctx = document.getElementById("chartIngresosMes");
  if (!ctx) return;

  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const labels = [];
  const data = [];

  ingresosMeses.forEach((m) => {
    labels.push(`${meses[m.mes - 1]} ${m.anio}`);
    data.push(m.total);
  });

  const colorTexto = _estaOscuro() ? "#e8e8f0" : "#495057";
  const colorGrid = _estaOscuro()
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";

  dashboardCharts.ingresosMes = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Ingresos (Q)",
          data: data,
          backgroundColor: "rgba(25, 135, 84, 0.8)",
          hoverBackgroundColor: "rgba(25, 135, 84, 1)",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context) => _formatMoney(context.parsed.y),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: colorTexto,
            callback: (value) => "Q" + value,
          },
          grid: { color: colorGrid },
        },
        x: {
          ticks: { color: colorTexto, font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

// Exponer globalmente
window.loadDashboardModule = loadDashboardModule;
