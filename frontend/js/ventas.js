// ventas.js

let ventasData = [];
let tiposPagoData = [];
let cajaTurnosData = [];
let serviciosAdicionalesData = [];

// Paginación (client-side, porque serviciosAdicionalesData se usa completo
// en varios otros lugares del archivo -- cruces por cliente/venta, búsquedas
// por id para editar/cambiar estado)
let paginaServicios = 0;
const SERVICIOS_POR_PAGINA = 10;
let cotizacionesData = [];
let ventaDetallesTemp = [];
let vendedoresData = [];
let cotizacionItemsTemp = [];

// Paginación (server-side) de la tabla principal de Ventas
let skipVentasTabla = 0;
const LIMITE_VENTAS_TABLA = 50;
let _ventasSearchTimeout = null;

// ============================================================
// CARGA DEL MODULO PRINCIPAL
// ============================================================

function _capturarPestanasVentas(container) {
  if (!container || !container.querySelector("#ventasSubTabs")) return [];
  return Array.from(
    container.querySelectorAll(
      '[data-bs-toggle="tab"].active, [data-bs-toggle="pill"].active',
    ),
  )
    .map((el) =>
      el.id
        ? { id: el.id }
        : { href: el.getAttribute("href") || el.getAttribute("data-bs-target") },
    )
    .filter((p) => p.id || p.href);
}

function _restaurarPestanasVentas(pestanas) {
  if (typeof bootstrap === "undefined") return;
  (pestanas || []).forEach((p) => {
    let el = null;
    if (p.id) {
      el = document.getElementById(p.id);
    } else {
      el = Array.from(
        document.querySelectorAll(
          '#mainContent [data-bs-toggle="tab"], #mainContent [data-bs-toggle="pill"]',
        ),
      ).find(
        (t) =>
          t.getAttribute("href") === p.href ||
          t.getAttribute("data-bs-target") === p.href,
      );
    }
    if (el) bootstrap.Tab.getOrCreateInstance(el).show();
  });
}

async function loadVentasModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;
  const pestanasPrevias = _capturarPestanasVentas(container);

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-shopping-cart me-2 text-warning"></i>Ventas</h4>
            <div>
                ${
                  tienePermiso("Ventas", "Crear")
                    ? `<button class="btn btn-warning btn-sm" onclick="showCreateVentaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Venta
                </button>`
                    : ""
                }
            </div>
        </div>

        <ul class="nav nav-tabs mb-3" id="ventasSubTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#subVentas">
                    <i class="fas fa-list me-1"></i>Ventas
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subClientes">
                    <i class="fas fa-users me-1"></i>Clientes
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subServicios">
                    <i class="fas fa-tools me-1"></i>Servicios Adicionales
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subCotizaciones">
                    <i class="fas fa-file-invoice me-1"></i>Cotizaciones
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subCaja">
                    <i class="fas fa-cash-register me-1"></i>Caja
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subVendedores">
                    <i class="fas fa-user-tie me-1"></i>Vendedores
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <div class="tab-pane fade show active" id="subVentas">
                <div id="ventasTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted">Cargando ventas...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="subClientes">
                <div id="clientesSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando clientes...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="subServicios">
                <div id="serviciosSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status"></div>
                        <p class="mt-2 text-muted">Cargando servicios adicionales...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="subCotizaciones">
                <div id="cotizacionesSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-success" role="status"></div>
                        <p class="mt-2 text-muted">Cargando cotizaciones...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="subCaja">
                <div id="cajaSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted">Cargando caja...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="subVendedores">
                <div id="vendedoresSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status"></div>
                        <p class="mt-2 text-muted">Cargando vendedores...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  try {
    const [
      clientes,
      productos,
      tiposPago,
      cajaTurnos,
      servicios,
      cotizaciones,
      ubicaciones,
    ] = await Promise.all([
      api.getClientes().catch(() => []),
      api.getProductos().catch(() => []),
      api.getTiposPago().catch(() => []),
      api.getCajaTurnos().catch(() => []),
      api.request("/servicios-adicionales").catch(() => []),
      api.request("/cotizaciones").catch(() => []),
      api.request("/ubicaciones").catch(() => []),
    ]);

    window.clientesData = clientes || [];
    window.productosData = productos || [];
    tiposPagoData = tiposPago || [];
    cajaTurnosData = cajaTurnos || [];
    serviciosAdicionalesData = servicios || [];
    cotizacionesData = cotizaciones || [];
    window.ubicacionesData = ubicaciones || [];

    try {
      localStorage.setItem(
        "ubicaciones_backup",
        JSON.stringify(window.ubicacionesData),
      );
    } catch (e) {}

    console.log(
      "📍 Ubicaciones cargadas en loadVentasModule:",
      window.ubicacionesData.length,
    );

    skipVentasTabla = 0;
    await cargarVentasTabla();
    cargarSubClientes();
    cargarSubServicios();
    cargarSubCotizaciones();
    cargarSubVendedores();

    const cajaContainer = document.getElementById("cajaSubContainer");
    if (cajaContainer) {
      if (typeof cargarCajaEnContainer === "function") {
        await cargarCajaEnContainer(cajaContainer);
      } else {
        cargarSubCajaBasico(cajaContainer);
      }
    }
    _restaurarPestanasVentas(pestanasPrevias);
  } catch (error) {
    document.getElementById("ventasTableContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// ============================================================
// PESTAÑA: VENTAS CON BÚSQUEDA, RANGO DE FECHAS Y PAGINACIÓN
// (server-side: el backend ya filtra/pagina, aquí solo se pide la página)
// ============================================================
async function cargarVentasTabla() {
  const container = document.getElementById("ventasTableContainer");
  if (!container) return;

  const buscarInput = document.getElementById("ventaSearchInput");
  const desdeInput = document.getElementById("ventaFechaDesde");
  const hastaInput = document.getElementById("ventaFechaHasta");
  const buscar = buscarInput ? buscarInput.value.trim() : "";
  const desde = desdeInput ? desdeInput.value : "";
  const hasta = hastaInput ? hastaInput.value : "";
  if (!rangoFechasValidoFiltro(desde, hasta)) return;

  try {
    let url = `/ventas?skip=${skipVentasTabla}&limit=${LIMITE_VENTAS_TABLA}`;
    if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    url += filtrosExtraVentasUrl();

    ventasData = (await api.request(url)) || [];
    renderVentasTable(ventasData);
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar ventas: ${error.message}</div>`;
  }
}

// Filtros de Estado y Pago de la tabla de ventas
function filtrosExtraVentasUrl() {
  const estado = document.getElementById("ventaFiltroEstado")?.value || "";
  const pago = document.getElementById("ventaFiltroPago")?.value || "";
  let extra = "";
  if (estado) extra += `&estado=${encodeURIComponent(estado)}`;
  if (pago) extra += `&estado_pago=${encodeURIComponent(pago)}`;
  return extra;
}

function onVentaSearchInput() {
  clearTimeout(_ventasSearchTimeout);
  _ventasSearchTimeout = setTimeout(() => {
    skipVentasTabla = 0;
    cargarVentasTabla();
  }, 400);
}

function filtrarVentas() {
  skipVentasTabla = 0;
  cargarVentasTabla();
}

function limpiarFiltroVentas() {
  const input = document.getElementById("ventaSearchInput");
  const desde = document.getElementById("ventaFechaDesde");
  const hasta = document.getElementById("ventaFechaHasta");
  if (input) input.value = "";
  if (desde) desde.value = "";
  if (hasta) hasta.value = "";
  ["ventaFiltroEstado", "ventaFiltroPago"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  skipVentasTabla = 0;
  cargarVentasTabla();
}

function ventasTablaAnterior() {
  skipVentasTabla = Math.max(0, skipVentasTabla - LIMITE_VENTAS_TABLA);
  cargarVentasTabla();
}

function ventasTablaSiguiente() {
  skipVentasTabla += LIMITE_VENTAS_TABLA;
  cargarVentasTabla();
}

function renderVentasTable(ventas) {
  const container = document.getElementById("ventasTableContainer");
  if (!container) return;

  const valorBusquedaPrevio = (
    document.getElementById("ventaSearchInput")?.value || ""
  ).replace(/"/g, "&quot;");
  const fechaDesdePrevia = document.getElementById("ventaFechaDesde")?.value || "";
  const fechaHastaPrevia = document.getElementById("ventaFechaHasta")?.value || "";
  const estadoPrevio = document.getElementById("ventaFiltroEstado")?.value || "";
  const pagoPrevio = document.getElementById("ventaFiltroPago")?.value || "";
  const opcion = (valor, texto, previo) =>
    `<option value="${valor}" ${valor === previo ? "selected" : ""}>${texto}</option>`;

  let searchHtml = `
    <div class="row mb-3 g-2">
      <div class="col-md-3">
        <div class="input-group">
          <input type="text" class="form-control" id="ventaSearchInput"
                placeholder="Buscar por ID, cliente, NIT o producto..."
                oninput="onVentaSearchInput()" value="${valorBusquedaPrevio}">
          <button class="btn btn-outline-secondary" onclick="filtrarVentas()">
            <i class="fas fa-search"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="limpiarFiltroVentas()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="col-md-2">
        <select class="form-select" id="ventaFiltroEstado" onchange="filtrarVentas()" title="Estado">
          ${opcion("", "Todos los estados", estadoPrevio)}
          ${opcion("Completada", "Completadas", estadoPrevio)}
          ${opcion("Cancelada", "Canceladas", estadoPrevio)}
        </select>
      </div>
      <div class="col-md-2">
        <select class="form-select" id="ventaFiltroPago" onchange="filtrarVentas()" title="Pago">
          ${opcion("", "Pagadas y pendientes", pagoPrevio)}
          ${opcion("Pagada", "Solo pagadas", pagoPrevio)}
          ${opcion("Pendiente", "Con saldo pendiente", pagoPrevio)}
        </select>
      </div>
      <div class="col-md-2">
        <div class="input-group">
          <span class="input-group-text">Desde</span>
          <input type="date" class="form-control" id="ventaFechaDesde" title="Desde"
                 value="${fechaDesdePrevia}" onchange="filtrarVentas()">
        </div>
      </div>
      <div class="col-md-2">
        <div class="input-group">
          <span class="input-group-text">Hasta</span>
          <input type="date" class="form-control" id="ventaFechaHasta" title="Hasta"
                 value="${fechaHastaPrevia}" onchange="filtrarVentas()">
        </div>
      </div>
      <div class="col-md-1"></div>
      <div class="col-12 text-end">
        <button class="btn btn-success btn-sm" onclick="exportarVentasExcel()">
          <i class="fas fa-file-excel me-1"></i>Exportar
        </button>
        <button class="btn btn-danger btn-sm" onclick="exportarVentasPDF()">
          <i class="fas fa-file-pdf me-1"></i>PDF
        </button>
        ${
          tienePermiso("Ventas", "Crear")
            ? `<button class="btn btn-outline-primary btn-sm" onclick="showCargaMasivaVentasModal()">
                <i class="fas fa-file-upload me-1"></i>Carga Masiva
              </button>`
            : ""
        }
        ${
          tienePermiso("Ventas", "Crear")
            ? `<button class="btn btn-warning btn-sm" onclick="showCreateVentaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Venta
              </button>`
            : ""
        }
      </div>
    </div>
  `;

  const paginacionHtml = `
    <div class="d-flex justify-content-between align-items-center mt-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="ventasTablaAnterior()" ${skipVentasTabla === 0 ? "disabled" : ""}>
            <i class="fas fa-chevron-left me-1"></i>Anterior
        </button>
        <small class="text-muted">Página ${Math.floor(skipVentasTabla / LIMITE_VENTAS_TABLA) + 1}${ventas && ventas.length ? ` — Mostrando ${ventas.length} venta(s)` : ""}</small>
        <button class="btn btn-sm btn-outline-secondary" onclick="ventasTablaSiguiente()" ${!ventas || ventas.length < LIMITE_VENTAS_TABLA ? "disabled" : ""}>
            Siguiente<i class="fas fa-chevron-right ms-1"></i>
        </button>
    </div>
  `;

  if (!ventas || ventas.length === 0) {
    container.innerHTML =
      searchHtml +
      `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay ventas que coincidan con el filtro</p>
            </div>
        ` +
      paginacionHtml;
    return;
  }

  // Totales de la página actual (NO son el total histórico de todas las ventas,
  // ya que la tabla ahora pagina del lado del servidor)
  let totalVentas = 0;
  let totalPendiente = 0;
  ventas.forEach((v) => {
    const totalPagos = (v.pagos || []).reduce(
      (sum, p) => sum + (p.monto || 0),
      0,
    );
    const saldo = (v.total || 0) - totalPagos;
    totalVentas += v.total || 0;
    if (saldo > 0) totalPendiente += saldo;
  });

  let html =
    searchHtml +
    `
    <div class="row mb-3">
      <div class="col-md-3">
        <div class="card bg-success bg-opacity-10">
          <div class="card-body text-center py-2">
            <h6 class="text-success mb-0">Total (esta página)</h6>
            <h5 class="mb-0">Q${totalVentas.toFixed(2)}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning bg-opacity-10">
          <div class="card-body text-center py-2">
            <h6 class="text-warning mb-0">Pendiente (esta página)</h6>
            <h5 class="mb-0">Q${totalPendiente.toFixed(2)}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info bg-opacity-10">
          <div class="card-body text-center py-2">
            <h6 class="text-info mb-0">Ventas en esta página</h6>
            <h5 class="mb-0">${ventas.length}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary bg-opacity-10">
          <div class="card-body text-center py-2">
            <h6 class="text-primary mb-0">Promedio (esta página)</h6>
            <h5 class="mb-0">Q${(totalVentas / ventas.length).toFixed(2)}</h5>
          </div>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-hover table-striped" id="ventasTable">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>NIT</th>
            <th>Vendedor</th>
            <th>Fecha</th>
            <th>Subtotal</th>
            <th>Descuento</th>
            <th>Total</th>
            <th>Saldo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="ventasTableBody">
    `;

  ventas.forEach((v) => {
    const cliente = (window.clientesData || []).find(
      (c) => c.id === v.id_cliente,
    );
    const nombreCliente = cliente ? cliente.nombre : "--";
    const nitCliente = cliente ? cliente.nit || "--" : "--";
    const totalPagos = (v.pagos || []).reduce(
      (sum, p) => sum + (p.monto || 0),
      0,
    );
    const saldo = (v.total || 0) - totalPagos;
    const pagada = saldo <= 0;

    let nombreVendedor = "--";
    if (v.id_vendedor) {
      const vendedor = vendedoresData.find(
        (e) => e.id_usuario === v.id_vendedor,
      );
      if (vendedor) nombreVendedor = vendedor.nombre || "--";
    }

    html += `
            <tr>
                <td>
                    <button class="btn btn-link btn-sm p-0 text-primary" onclick="verVenta(${v.id})">
                        #${v.id}
                    </button>
                </td>
                <td>
                    <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${v.id_cliente})">
                        ${nombreCliente}
                    </button>
                </td>
                <td>${nitCliente}</td>
                <td>${nombreVendedor}</td>
                <td>${v.fecha ? new Date(v.fecha).toLocaleString() : "--"}</td>
                <td>Q${(v.subtotal || 0).toFixed(2)}</td>
                <td>Q${(v.descuento || 0).toFixed(2)}</td>
                <td><strong>Q${(v.total || 0).toFixed(2)}</strong></td>
                <td>Q${saldo.toFixed(2)}</td>
                <td>
                    <span class="badge ${pagada ? "bg-success" : "bg-danger"}">
                        ${pagada ? "Pagada" : "Pendiente"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verVenta(${v.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="imprimirVenta(${v.id})" title="Imprimir venta">
                        <i class="fas fa-print"></i>
                    </button>
                    ${!pagada && tienePermiso("Ventas", "Editar") ? `<button class="btn btn-sm btn-outline-success" onclick="mostrarModalPago(${v.id})" title="Registrar pago"><i class="fas fa-money-bill-wave"></i></button>` : ""}
                    ${
                      tienePermiso("Ventas", "Editar")
                        ? `<button class="btn btn-sm btn-outline-danger" onclick="anularVenta(${v.id})">
                        <i class="fas fa-times"></i>
                    </button>`
                        : ""
                    }
                </td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
    ` + paginacionHtml;

  container.innerHTML = html;
}


// ============================================================
// EXPORTAR VENTAS A EXCEL Y PDF (trae TODAS las ventas que coincidan
// con los filtros actuales, no solo la página visible en pantalla)
// ============================================================
async function obtenerTodasLasVentasFiltradasParaExportar() {
  const buscarInput = document.getElementById("ventaSearchInput");
  const desdeInput = document.getElementById("ventaFechaDesde");
  const hastaInput = document.getElementById("ventaFechaHasta");
  const buscar = buscarInput ? buscarInput.value.trim() : "";
  const desde = desdeInput ? desdeInput.value : "";
  const hasta = hastaInput ? hastaInput.value : "";

  const LIMITE = 200;
  let skip = 0;
  let todas = [];
  while (true) {
    let url = `/ventas?skip=${skip}&limit=${LIMITE}`;
    if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    url += filtrosExtraVentasUrl();
    const pagina = (await api.request(url).catch(() => [])) || [];
    todas = todas.concat(pagina);
    if (pagina.length < LIMITE) break;
    skip += LIMITE;
  }
  return todas;
}

async function exportarVentasExcel() {
  const ventas = await obtenerTodasLasVentasFiltradasParaExportar();
  if (!ventas || ventas.length === 0) {
    showToast("No hay ventas para exportar", "warning");
    return;
  }

  const data = ventas.map((v) => {
    const cliente = (window.clientesData || []).find(
      (c) => c.id === v.id_cliente,
    );
    return {
      ID: v.id,
      Cliente: cliente ? cliente.nombre : "--",
      NIT: cliente ? cliente.nit || "--" : "--",
      Fecha: v.fecha ? new Date(v.fecha).toLocaleString() : "--",
      Subtotal: v.subtotal || 0,
      Descuento: v.descuento || 0,
      Total: v.total || 0,
      Estado: v.estado || "Completada",
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");
  XLSX.writeFile(wb, `Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast("Ventas exportadas a Excel", "success");
}

async function exportarVentasPDF() {
  const ventas = await obtenerTodasLasVentasFiltradasParaExportar();
  if (!ventas || ventas.length === 0) {
    showToast("No hay ventas para exportar", "warning");
    return;
  }

  const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

  let htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #0d6efd; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #0d6efd; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Reporte de Ventas</h1>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total de Ventas:</strong> ${ventas.length}</p>
      <p><strong>Monto Total:</strong> Q${totalVentas.toFixed(2)}</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>NIT</th>
            <th>Fecha</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  ventas.forEach((v) => {
    const cliente = (window.clientesData || []).find(
      (c) => c.id === v.id_cliente,
    );
    htmlContent += `
      <tr>
        <td>#${v.id}</td>
        <td>${cliente ? cliente.nombre : "--"}</td>
        <td>${cliente ? cliente.nit || "--" : "--"}</td>
        <td>${v.fecha ? new Date(v.fecha).toLocaleString() : "--"}</td>
        <td>Q${(v.total || 0).toFixed(2)}</td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>
      <div class="total">Total General: Q${totalVentas.toFixed(2)}</div>
      <div class="footer">Reporte generado desde Librería Jesús de la Misericordia</div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(htmlContent);
  win.document.close();
  win.print();
}

// ============================================================
// IMPRIMIR VENTA INDIVIDUAL
// ============================================================
async function imprimirVenta(id) {
  try {
    const venta = await api.getVenta(id);
    if (!venta) {
      showToast("Venta no encontrada", "error");
      return;
    }

    const cliente = (window.clientesData || []).find(
      (c) => c.id === venta.id_cliente,
    );
    const nombreCliente = cliente ? cliente.nombre : "Sin cliente";
    const nitCliente = cliente ? cliente.nit || "N/A" : "N/A";

    let detallesHtml = (venta.detalles || [])
      .map((d) => {
        const producto = (window.productosData || []).find(
          (p) => p.id === d.id_producto,
        );
        return `
        <tr>
          <td>${producto ? producto.nombre : "--"}</td>
          <td>${d.cantidad || 0}</td>
          <td>Q${(d.precio_unitario || 0).toFixed(2)}</td>
          <td>Q${(d.subtotal || 0).toFixed(2)}</td>
        </tr>
      `;
      })
      .join("");

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          h1 { text-align: center; color: #0d6efd; }
          .info { margin: 20px 0; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0d6efd; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .total-row { font-weight: bold; background: #f8f9fa; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Comprobante de Venta</h1>
        <div class="info">
          <p><strong>Venta #:</strong> ${venta.id}</p>
          <p><strong>Cliente:</strong> ${nombreCliente}</p>
          <p><strong>NIT:</strong> ${nitCliente}</p>
          <p><strong>Fecha:</strong> ${venta.fecha ? new Date(venta.fecha).toLocaleString() : "--"}</p>
          <p><strong>Estado:</strong> ${venta.estado || "Completada"}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}
            <tr class="total-row">
              <td colspan="3" style="text-align:right;">Subtotal:</td>
              <td>Q${(venta.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align:right;">Descuento:</td>
              <td>Q${(venta.descuento || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align:right;"><strong>TOTAL:</strong></td>
              <td><strong>Q${(venta.total || 0).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>Librería y Papelería Jesús de la Misericordia</p>
        </div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(htmlContent);
    win.document.close();
    win.print();
  } catch (error) {
    showToast(error.message || "Error al imprimir", "error");
  }
}

// ============================================================
// CREAR MODAL DE VENTA
// ============================================================
function crearModalVenta() {
  let modalExistente = document.getElementById("ventaModal");
  if (modalExistente) {
    modalExistente.remove();
  }

  let modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "ventaModal";
  modal.setAttribute("tabindex", "-1");
  modal.setAttribute("aria-labelledby", "ventaModalTitle");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="modal-dialog modal-xl modal-dialog-scrollable modal-workspace modal-venta">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="ventaModalTitle">Nueva Venta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="ventaForm" onsubmit="saveVenta(event)">
            <input type="hidden" id="ventaId" value="">
            
            <div class="row">
              <div class="col-md-8">
                <div class="mb-3">
                  <label class="form-label">Cliente</label>
                  <div class="d-flex align-items-start gap-2">
                    <div class="flex-grow-1 min-width-0" id="ventaClienteSelectorWrapper"></div>
                    <button class="btn btn-outline-primary text-nowrap" type="button" onclick="crearClienteDesdeVenta()">
                      <i class="fas fa-user-plus me-1"></i>Nuevo cliente
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Número de Cotización</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="ventaCotizacion" 
                           placeholder="ID de cotización aprobada" 
                           onchange="buscarCotizacionParaVenta()" 
                           onkeydown="if(event.key === 'Enter'){ event.preventDefault(); buscarCotizacionParaVenta(); }">
                    <button class="btn btn-outline-info" type="button" onclick="buscarCotizacionParaVenta()">
                      <i class="fas fa-search"></i>
                    </button>
                  </div>
                  <div id="ventaCotizacionInfo" class="mt-1"></div>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Vendedor *</label>
                  <select class="form-select" id="ventaVendedor" required>
                    <option value="">Cargando vendedores...</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Turno Caja *</label>
                  <select class="form-select" id="ventaCajaTurno" required>
                    <option value="">Seleccionar turno</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Descuento (%)</label>
                  <input type="number" class="form-control" id="ventaDescuento" value="0" step="0.5" min="0" max="100" oninput="renderDetallesVenta()">
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Observaciones</label>
              <textarea class="form-control" id="ventaObservaciones" rows="2"></textarea>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold">Productos</h6>
            </div>

            <div class="row mb-2" id="ventaDetalleRow">
              <div class="col-md-5 mb-2 mb-md-0">
                <div id="ventaProductoSelectorWrapper"></div>
                <div id="ventaProductoSearchInfo" class="small mt-1"></div>
              </div>
              <div class="col-md-2">
                <label class="form-label small mb-1" for="ventaDetalleCantidad">Cantidad</label>
                <input type="number" class="form-control form-control-sm" id="ventaDetalleCantidad" value="1" step="1" min="1">
              </div>
              <div class="col-md-3">
                <label class="form-label small mb-1" for="ventaDetallePrecio">Precio</label>
                <input type="text" class="form-control form-control-sm" id="ventaDetallePrecio" readonly>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button type="button" class="btn btn-sm btn-success w-100" onclick="agregarDetalleVenta(event)">
                  <i class="fas fa-plus"></i>
                  <span class="ms-1">Agregar</span>
                </button>
              </div>
            </div>

            <div id="ventaDetallesList" class="mb-3"></div>

          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-warning" form="ventaForm">
            <i class="fas fa-save me-2"></i>Guardar Venta
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

// ============================================================
// LLENAR SELECT DE VENDEDORES (HÍBRIDO)
// ============================================================
async function llenarSelectVendedores() {
  const select = document.getElementById("ventaVendedor");
  if (!select) return;

  const vendedores = await cargarVendedoresConTurno();

  select.innerHTML = '<option value="">Seleccionar vendedor</option>';

  if (vendedores.length === 0) {
    select.innerHTML =
      '<option value="">No hay vendedores con turno abierto</option>';
    select.disabled = true;
    return;
  }

  select.disabled = false;
  vendedores.forEach((v) => {
    select.innerHTML += `<option value="${v.id_usuario}" data-turno="${v.turno_id}">${v.nombre}</option>`;
  });

  // ✅ AUTO-SELECCIÓN: Si solo hay 1 vendedor, seleccionarlo automáticamente
  if (vendedores.length === 1) {
    select.value = vendedores[0].id_usuario;
    select.dispatchEvent(new Event("change"));
  }
}

// ============================================================
// MODAL VENTA
// ============================================================
async function showCreateVentaModal() {
  ventaDetallesTemp = [];

  if (!window.ubicacionesData || window.ubicacionesData.length === 0) {
    try {
      const ubicaciones = await api.request("/ubicaciones").catch(() => []);
      window.ubicacionesData = ubicaciones || [];
      localStorage.setItem(
        "ubicaciones_backup",
        JSON.stringify(window.ubicacionesData),
      );
      console.log(
        "📍 Ubicaciones cargadas en modal:",
        window.ubicacionesData.length,
      );
    } catch (e) {
      // Intentar desde localStorage
      try {
        const backup = localStorage.getItem("ubicaciones_backup");
        if (backup) {
          const parsed = JSON.parse(backup);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.ubicacionesData = parsed;
            console.log(
              "📍 Ubicaciones recuperadas desde backup:",
              window.ubicacionesData.length,
            );
          }
        }
      } catch (e2) {}
    }
  }

  const modal = crearModalVenta();
  if (!modal) return;

  const form = document.getElementById("ventaForm");
  const title = document.getElementById("ventaModalTitle");

  title.textContent = "Nueva Venta";
  if (form) form.reset();

  const ventaId = document.getElementById("ventaId");
  const ventaDescuento = document.getElementById("ventaDescuento");
  const ventaObservaciones = document.getElementById("ventaObservaciones");
  const ventaCotizacion = document.getElementById("ventaCotizacion");
  const ventaCotizacionInfo = document.getElementById("ventaCotizacionInfo");
  const ventaDetallesList = document.getElementById("ventaDetallesList");

  if (ventaId) ventaId.value = "";
  if (ventaDescuento) ventaDescuento.value = 0;
  if (ventaObservaciones) ventaObservaciones.value = "";
  if (ventaCotizacion) ventaCotizacion.value = "";
  if (ventaCotizacionInfo) ventaCotizacionInfo.innerHTML = "";

  limpiarErroresFormulario("ventaForm");

  llenarSelectCliente();
  llenarSelectCajaTurno();
  await llenarSelectVendedores();
  llenarSelectProductoDetalle();

  if (ventaDetallesList) ventaDetallesList.innerHTML = "";

  modal.addEventListener(
    "shown.bs.modal",
    () => document.getElementById("ventaProductoSearchTxt")?.focus(),
    { once: true },
  );

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// ============================================================
// AUTOCOMPLETAR DESDE COTIZACIÓN
// ============================================================
async function buscarCotizacionParaVenta() {
  const input = document.getElementById("ventaCotizacion");
  const id = input.value.trim();

  if (!id) {
    document.getElementById("ventaCotizacionInfo").innerHTML = "";
    return;
  }

  if (!/^\d+$/.test(id)) {
    document.getElementById("ventaCotizacionInfo").innerHTML = `
      <div class="text-warning small">Ingresa solo el número de cotización</div>
    `;
    return;
  }

  try {
    const data = await api.request(`/cotizaciones/${id}/para-venta`);
    const numero = data.id ?? data.id_cotizacion ?? id;
    const esc = escaparHtmlEscaner;
    const nombreDetalle = (d) => d.nombre_producto || d.producto || "Producto";

    const resumen = `
        <div class="text-success small mb-1">
          <i class="fas fa-check-circle me-1"></i>
          Cotización #${esc(numero)}${data.numero_expediente ? ` - Exp. ${esc(data.numero_expediente)}` : ""}
          - Total: Q${Number(data.total || 0).toFixed(2)}
        </div>`;

    if (data.tiene_stock_suficiente === false) {
      const sinStock = (data.detalles || []).filter((d) => !d.stock_suficiente);
      document.getElementById("ventaCotizacionInfo").innerHTML = `
        ${resumen}
        <div class="alert alert-warning small mb-2">
          <i class="fas fa-exclamation-triangle me-1"></i>
          <strong>Alerta:</strong> Los siguientes productos no tienen stock suficiente:
          <ul class="mb-0">
            ${sinStock
              .map(
                (d) =>
                  `<li>${esc(nombreDetalle(d))}: solicitado ${Number(d.cantidad || 0)}, disponible ${Number(d.stock_disponible || 0)}</li>`,
              )
              .join("")}
          </ul>
        </div>
      `;
    } else {
      document.getElementById("ventaCotizacionInfo").innerHTML = resumen;
    }

    // El cliente puede no estar entre los clientes ya cargados (límite de 50)
    if (data.id_cliente && window.__ventaClienteSelector) {
      window.clientesData = window.clientesData || [];
      if (!window.clientesData.some((c) => c.id === data.id_cliente)) {
        try {
          const cli = await api.request(`/clientes/${data.id_cliente}`);
          if (cli) window.clientesData.push(cli);
        } catch (e) {}
      }
      window.__ventaClienteSelector.setValue(data.id_cliente);
    }

    ventaDetallesTemp = [];
    const noAgregados = [];

    for (const d of data.detalles || []) {
      let producto = (window.productosData || []).find(
        (p) => p.id === d.id_producto,
      );
      // Puede no estar entre los productos ya cargados (límite de 50)
      if (!producto) {
        try {
          producto = await api.request(`/productos/${d.id_producto}`);
          if (producto) {
            window.productosData = window.productosData || [];
            window.productosData.push(producto);
          }
        } catch (e) {
          producto = null;
        }
      }
      if (producto && producto.activo !== 0) {
        ventaDetallesTemp.push({
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          producto: producto,
          precio_unitario: d.precio_unitario,
        });
      } else {
        noAgregados.push(nombreDetalle(d));
      }
    }

    if (noAgregados.length) {
      document.getElementById("ventaCotizacionInfo").innerHTML += `
        <div class="alert alert-danger small mb-2">
          <i class="fas fa-times-circle me-1"></i>
          No se agregaron (ya no existen o están inactivos): ${noAgregados.map(esc).join(", ")}
        </div>`;
    }

    renderDetallesVenta();

    if (data.descuento_porcentaje) {
      document.getElementById("ventaDescuento").value =
        data.descuento_porcentaje;
    }

    if (data.observaciones) {
      document.getElementById("ventaObservaciones").value = data.observaciones;
    }

    showToast(`Cotización #${numero} cargada correctamente`, "success");
  } catch (error) {
    document.getElementById("ventaCotizacionInfo").innerHTML = `
      <div class="text-danger small">
        <i class="fas fa-times-circle me-1"></i>
        ${error.message || "Error al cargar cotización"}
      </div>
    `;
  }
}

// ============================================================
// VER FICHA CLIENTE
// ============================================================
async function verFichaCliente(idCliente) {
  if (!idCliente) {
    showToast("Cliente no especificado", "warning");
    return;
  }

  try {
    const cliente = (window.clientesData || []).find((c) => c.id === idCliente);
    if (!cliente) {
      showToast("Cliente no encontrado", "error");
      return;
    }

    const ventasCliente =
      (await api
        .request(`/ventas?id_cliente=${idCliente}&limit=200`)
        .catch(() => [])) || [];
    const serviciosCliente = serviciosAdicionalesData.filter(
      (s) => s.id_cliente === idCliente,
    );

    // Calcular totales
    const totalVentas = ventasCliente.reduce(
      (sum, v) => sum + (v.total || 0),
      0,
    );

    // Generar HTML para ventas
    let ventasHtml = "";
    if (ventasCliente.length === 0) {
      ventasHtml = `
        <div class="text-center py-3">
          <i class="fas fa-shopping-cart fa-2x text-muted mb-2"></i>
          <p class="text-muted">No hay ventas registradas para este cliente</p>
        </div>
      `;
    } else {
      ventasHtml = `
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Subtotal</th>
                <th>Total</th>
                <th>Estado Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${ventasCliente
                .map((v) => {
                  const totalPagos = (v.pagos || []).reduce(
                    (sum, p) => sum + (p.monto || 0),
                    0,
                  );
                  const saldo = (v.total || 0) - totalPagos;
                  const pagada = saldo <= 0;
                  return `
                  <tr>
                    <td><span class="badge bg-secondary">#${v.id}</span></td>
                    <td>${v.fecha ? new Date(v.fecha).toLocaleDateString() : "--"}</td>
                    <td>Q${(v.subtotal || 0).toFixed(2)}</td>
                    <td><strong>Q${(v.total || 0).toFixed(2)}</strong></td>
                    <td>
                      <span class="badge ${pagada ? "bg-success" : "bg-danger"}">
                        ${pagada ? "Pagada" : "Pendiente"}
                      </span>
                      ${!pagada ? `<span class="badge bg-warning ms-1">Saldo: Q${saldo.toFixed(2)}</span>` : ""}
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-info" onclick="verVenta(${v.id})">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    // Generar HTML para servicios
    let serviciosHtml = "";
    if (serviciosCliente.length === 0) {
      serviciosHtml = `
        <div class="text-center py-3">
          <i class="fas fa-tools fa-2x text-muted mb-2"></i>
          <p class="text-muted">No hay servicios adicionales para este cliente</p>
        </div>
      `;
    } else {
      serviciosHtml = `
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Venta</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Material</th>
                <th>Mano Obra</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${serviciosCliente
                .map((s) => {
                  const pagado = s.pagado === 1 || s.estado_pago === "Pagado";
                  return `
                  <tr>
                    <td>${s.id}</td>
                    <td>${s.id_venta ? `<button class="btn btn-link btn-sm p-0" onclick="verVenta(${s.id_venta})">#${s.id_venta}</button>` : "Independiente"}</td>
                    <td>${s.tipo_servicio || "--"}</td>
                    <td>${s.descripcion || "--"}</td>
                    <td>Q${(s.monto_material || 0).toFixed(2)}</td>
                    <td>Q${(s.monto_mano_obra || 0).toFixed(2)}</td>
                    <td><strong>Q${(s.total || 0).toFixed(2)}</strong></td>
                    <td>
                      <span class="badge ${pagado ? "bg-success" : "bg-danger"}">
                        ${pagado ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    const body = document.getElementById("clienteFichaBody");
    body.innerHTML = `
      <!-- INFORMACIÓN DEL CLIENTE - 2 COLUMNAS -->
      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="card bg-light">
            <div class="card-body py-2">
              <div class="row">
                <div class="col-4 text-muted fw-bold">Nombre:</div>
                <div class="col-8">${cliente.nombre || "--"}</div>
              </div>
              <div class="row">
                <div class="col-4 text-muted fw-bold">Teléfono:</div>
                <div class="col-8">${cliente.telefono || "--"}</div>
              </div>
              <div class="row">
                <div class="col-4 text-muted fw-bold">Email:</div>
                <div class="col-8">${cliente.email || "--"}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card bg-light">
            <div class="card-body py-2">
              <div class="row">
                <div class="col-4 text-muted fw-bold">Dirección:</div>
                <div class="col-8">${cliente.direccion || "--"}</div>
              </div>
              <div class="row">
                <div class="col-4 text-muted fw-bold">NIT:</div>
                <div class="col-8">${cliente.nit || "--"}</div>
              </div>
              <div class="row">
                <div class="col-4 text-muted fw-bold">Tipo:</div>
                <div class="col-8">${cliente.tipo_cliente || "General"}</div>
              </div>
              <div class="row">
                <div class="col-4 text-muted fw-bold">Estado:</div>
                <div class="col-8">
                  <span class="badge ${cliente.activo !== 0 ? "bg-success" : "bg-danger"}">
                    ${cliente.activo !== 0 ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RESUMEN DE ACTIVIDAD -->
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="card bg-info bg-opacity-10">
            <div class="card-body text-center py-2">
              <h6 class="text-info mb-0">Total Ventas</h6>
              <h4 class="mb-0">${ventasCliente.length}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-success bg-opacity-10">
            <div class="card-body text-center py-2">
              <h6 class="text-success mb-0">Monto Total</h6>
              <h4 class="mb-0">Q${totalVentas.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-warning bg-opacity-10">
            <div class="card-body text-center py-2">
              <h6 class="text-warning mb-0">Servicios</h6>
              <h4 class="mb-0">${serviciosCliente.length}</h4>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑAS INTERNAS -->
      <ul class="nav nav-tabs nav-fill mb-3" id="clienteFichaTabs" role="tablist">
        <li class="nav-item">
          <button class="nav-link active" id="tab-ficha-ventas" data-bs-toggle="tab" 
                  data-bs-target="#panel-ficha-ventas" type="button" role="tab">
            <i class="fas fa-shopping-cart me-1"></i>Ventas (${ventasCliente.length})
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" id="tab-ficha-servicios" data-bs-toggle="tab" 
                  data-bs-target="#panel-ficha-servicios" type="button" role="tab">
            <i class="fas fa-tools me-1"></i>Servicios (${serviciosCliente.length})
          </button>
        </li>
      </ul>

      <div class="tab-content">
        <div class="tab-pane fade show active" id="panel-ficha-ventas" role="tabpanel">
          ${ventasHtml}
        </div>
        <div class="tab-pane fade" id="panel-ficha-servicios" role="tabpanel">
          ${serviciosHtml}
        </div>
      </div>
    `;

    if (typeof window.aplicarPermisosPestanasModulo === "function") {
      window.aplicarPermisosPestanasModulo(
        "ventas",
        document.getElementById("clienteFichaModal"),
      );
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(
      document.getElementById("clienteFichaModal"),
    );
    modal.show();
  } catch (error) {
    showToast(error.message || "Error al cargar ficha del cliente", "error");
  }
}

// ============================================================
// LLENAR SELECTS
// ============================================================
function llenarSelectCliente() {
  if (typeof crearSelectorBusqueda !== "function") return;
  window.__ventaClienteSelector = crearSelectorBusqueda({
    wrapperId: "ventaClienteSelectorWrapper",
    hiddenInputId: "ventaCliente",
    searchInputId: "ventaClienteSearchTxt",
    dropdownId: "ventaClienteDropdown",
    getData: () => window.clientesData || [],
    getId: (c) => c.id,
    getLabel: (c) =>
      `${c.nombre}${c.nit ? " - NIT: " + c.nit : ""}${c.activo !== 0 ? "" : " (Inactivo)"}`,
    getSearchText: (c) => `${c.nombre} ${c.nit || ""} ${c.id}`,
    searchData: async (termino) => {
      const encontrados =
        (await api.request(
          `/clientes?buscar=${encodeURIComponent(termino)}&limit=30`,
        )) || [];
      if (
        /^\d+$/.test(termino) &&
        Number.isSafeInteger(Number(termino)) &&
        !encontrados.some((c) => String(c.id) === termino)
      ) {
        const cliente = await api.getCliente(termino).catch((error) => {
          if (error.message === "Cliente no encontrado") return null;
          throw error;
        });
        if (cliente) encontrados.unshift(cliente);
      }
      return encontrados;
    },
    emptyText: "Escribe nombre, NIT o ID para buscar",
    placeholder: "Buscar cliente por nombre, NIT o ID...",
    onSelect: (cliente) => {
      if (!cliente) return;
      window.clientesData = window.clientesData || [];
      if (!window.clientesData.some((c) => String(c.id) === String(cliente.id))) {
        window.clientesData.push(cliente);
      }
    },
  });

  // NIT + Enter: elige directo el cliente con ese NIT exacto (o el único
  // resultado), sin tener que darle clic en la lista.
  const clienteInput = document.getElementById("ventaClienteSearchTxt");
  clienteInput?.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    const texto = clienteInput.value.trim();
    if (!texto || document.getElementById("ventaCliente").value) return;
    let encontrados = [];
    try {
      encontrados =
        (await api.request(
          `/clientes?buscar=${encodeURIComponent(texto)}&limit=30`,
        )) || [];
    } catch (e) {
      return;
    }
    const limpio = (v) => String(v || "").replace(/[\s-]/g, "").toUpperCase();
    const elegido =
      encontrados.find((c) => limpio(c.nit) === limpio(texto)) ||
      (encontrados.length === 1 ? encontrados[0] : null);
    if (!elegido || clienteInput.value.trim() !== texto) return;
    window.clientesData = window.clientesData || [];
    if (!window.clientesData.some((c) => String(c.id) === String(elegido.id))) {
      window.clientesData.push(elegido);
    }
    window.__ventaClienteSelector.setValue(elegido.id);
    document.getElementById("ventaClienteDropdown").style.display = "none";
  });
}

async function llenarSelectCajaTurno() {
  const select = document.getElementById("ventaCajaTurno");
  if (!select) return;

  try {
    const turnos = await api.getCajaTurnos().catch(() => []);
    cajaTurnosData = turnos || [];
  } catch (error) {
    console.warn("Error cargando turnos:", error);
  }

  select.innerHTML = '<option value="">Seleccionar turno</option>';

  const abiertos = cajaTurnosData.filter((t) => t.estado === "Abierto");

  if (abiertos.length === 0) {
    select.innerHTML = '<option value="">No hay turnos abiertos</option>';
    return;
  }

  abiertos.forEach((t) => {
    const usuario = t.id_usuario || "--";
    select.innerHTML += `<option value="${t.id}">Turno #${t.id} - Usuario: ${usuario}</option>`;
  });
}

function llenarSelectProductoDetalle() {
  if (typeof crearSelectorBusqueda !== "function") return;
  window.__ventaProductoSelector = crearSelectorBusqueda({
    wrapperId: "ventaProductoSelectorWrapper",
    hiddenInputId: "ventaProductoSelect",
    searchInputId: "ventaProductoSearchTxt",
    dropdownId: "ventaProductoDropdown",
    getData: () => window.productosData || [],
    getId: (p) => p.id,
    getLabel: (p) =>
      `${p.codigo} - ${p.nombre} (Stock: ${p.stock_actual || 0})`,
    getSearchText: (p) =>
      `${p.codigo || ""} ${p.nombre || ""} ${p.descripcion || ""} ${p.id}`,
    searchData: async (termino) =>
      (await api.request(
        `/productos?buscar=${encodeURIComponent(termino)}&limit=30`,
      )) || [],
    emptyText: "Escribe nombre o código, o escanea el código de barras",
    placeholder: "Nombre, código o escanea el código de barras...",
    maxResultados: 30,
    small: true,
    onSelect: (producto) => {
      const infoField = document.getElementById("ventaProductoSearchInfo");
      if (infoField) infoField.innerHTML = "";
      if (producto) {
        window.productosData = window.productosData || [];
        const indice = window.productosData.findIndex(
          (p) => String(p.id) === String(producto.id),
        );
        if (indice === -1) window.productosData.push(producto);
        else window.productosData[indice] = producto;
      }
      const precio = producto ? producto.precio_venta || 0 : 0;
      const precioField = document.getElementById("ventaDetallePrecio");
      if (precioField) {
        precioField.value = `Q${parseFloat(precio).toFixed(2)}`;
      }
    },
  });

  const searchInput = document.getElementById("ventaProductoSearchTxt");
  const icon = document.querySelector(
    "#ventaProductoSelectorWrapper .input-group-text",
  );
  if (icon) icon.innerHTML = '<i class="fas fa-barcode"></i>';
  // Lector de barras: al dar Enter el campo se vacía de inmediato y el
  // código se procesa en cola. Así, si se escanean dos productos seguidos,
  // los dígitos del segundo no se pegan al primero mientras el servidor
  // responde, y ninguno se pierde.
  let colaEscaneo = Promise.resolve();

  async function procesarCodigoVenta(codigo) {
    try {
      const producto = await buscarProductoPorCodigo(codigo);
      if (producto.activo === 0) {
        mostrarAvisoEscaner(
          "ventaProductoSearchInfo",
          "aviso",
          `${producto.nombre} está inactivo`,
        );
        return;
      }

      const resultado = agregarProductoEscaneadoVenta(producto);
      if (resultado.tipo === "error") {
        mostrarAvisoEscaner(
          "ventaProductoSearchInfo",
          "error",
          resultado.texto,
        );
        return;
      }

      document.getElementById("ventaDetallePrecio").value = "";
      mostrarAvisoEscaner(
        "ventaProductoSearchInfo",
        "ok",
        resultado.texto,
      );
    } catch (error) {
      if (/no existe|no encontrado|código vacío|404/i.test(error.message || "")) {
        // No es un código: puede que estuvieran buscando por nombre. Se
        // devuelve el texto al campo (si no se escribió otra cosa) y se avisa.
        if (searchInput && !searchInput.value) {
          searchInput.value = codigo;
          searchInput.dispatchEvent(new Event("input"));
        }
        mostrarAvisoEscaner(
          "ventaProductoSearchInfo",
          "aviso",
          `No existe ningún producto con el código "${codigo}". Si buscas por nombre, elígelo de la lista.`,
        );
        return;
      }
      console.error("Error buscando producto escaneado en Nueva Venta:", error);
      mostrarAvisoEscaner(
        "ventaProductoSearchInfo",
        "error",
        error.message || "No se pudo buscar el código de barras",
      );
    }
  }

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const codigo = searchInput.value.trim();
    if (!codigo) return;
    window.__ventaProductoSelector?.reset();
    colaEscaneo = colaEscaneo.then(() => procesarCodigoVenta(codigo));
  });
}

// ============================================================
// FUNCIONES DE VENTA
// ============================================================
function agregarDetalleVenta(event) {
  if (event) event.preventDefault();

  const productSelect = document.getElementById("ventaProductoSelect");
  const cantidadInput = document.getElementById("ventaDetalleCantidad");

  const id_producto = parseInt(productSelect.value);
  const cantidad = parseFloat(cantidadInput.value) || 1;

  if (!id_producto) {
    showToast("Selecciona un producto", "error");
    return;
  }

  const producto = (window.productosData || []).find(
    (p) => p.id === id_producto,
  );
  if (!producto) {
    showToast("Producto no encontrado", "error");
    return;
  }

  const yaEnVenta = _cantidadEnVenta(id_producto);
  if ((parseFloat(producto.stock_actual) || 0) < yaEnVenta + cantidad) {
    showToast(
      `Stock insuficiente. Disponible: ${producto.stock_actual || 0}` +
        (yaEnVenta ? ` (ya agregaste ${yaEnVenta})` : ""),
      "error",
    );
    return;
  }

  const existente = ventaDetallesTemp.find((d) => d.id_producto === id_producto);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    ventaDetallesTemp.push({
      id_producto: id_producto,
      cantidad: cantidad,
      producto: producto,
      precio_unitario: producto.precio_venta || 0,
    });
  }

  renderDetallesVenta();
  cantidadInput.value = 1;
  window.__ventaProductoSelector?.reset();
  document.getElementById("ventaDetallePrecio").value = "";
  document.getElementById("ventaProductoSearchTxt")?.focus();
}

// ============================================================
// LECTOR DE CÓDIGO DE BARRAS (Nueva Venta)
// El lector USB "escribe" el código y manda Enter. Cada escaneo agrega
// el producto (o suma 1 si ya está en la venta).
// ============================================================
function _cantidadEnVenta(idProducto) {
  return ventaDetallesTemp
    .filter((d) => d.id_producto === idProducto)
    .reduce((suma, d) => suma + (parseFloat(d.cantidad) || 0), 0);
}

// Qué pasa en Nueva Venta al escanear un producto. La búsqueda por código,
// el Enter y los avisos los maneja escaner-codigo.js.
function agregarProductoEscaneadoVenta(producto) {
  const nuevaCantidad = _cantidadEnVenta(producto.id) + 1;
  const stock = parseFloat(producto.stock_actual) || 0;
  if (stock < nuevaCantidad) {
    return {
      tipo: "error",
      texto: `Stock insuficiente de ${producto.nombre}. Disponible: ${stock}`,
    };
  }

  const existente = ventaDetallesTemp.find((d) => d.id_producto === producto.id);
  if (existente) {
    existente.cantidad = (parseFloat(existente.cantidad) || 0) + 1;
  } else {
    ventaDetallesTemp.push({
      id_producto: producto.id,
      cantidad: 1,
      producto: producto,
      precio_unitario: producto.precio_venta || 0,
    });
  }

  renderDetallesVenta();
  return {
    tipo: "ok",
    texto: `${producto.nombre} agregado (cantidad: ${nuevaCantidad})`,
  };
}

function eliminarDetalleVenta(index) {
  ventaDetallesTemp.splice(index, 1);
  renderDetallesVenta();
}

function renderDetallesVenta() {
  const container = document.getElementById("ventaDetallesList");
  if (!container) return;

  if (ventaDetallesTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay productos agregados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  let total = 0;
  ventaDetallesTemp.forEach((d, index) => {
    const subtotal = d.cantidad * (d.producto.precio_venta || 0);
    total += subtotal;
    html += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>${d.producto.nombre}</strong>
          <span class="text-muted small"> x ${d.cantidad}</span>
          <span class="text-muted small"> Q${d.producto.precio_venta || 0} c/u</span>
        </div>
        <div>
          <span class="fw-bold">Q${subtotal.toFixed(2)}</span>
          <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarDetalleVenta(${index})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </li>
    `;
  });

  const descuento =
    parseFloat(document.getElementById("ventaDescuento").value) || 0;
  const totalFinal = total - (total * descuento) / 100;

  html += `
    <li class="list-group-item fw-bold bg-light">
      Subtotal: Q${total.toFixed(2)} | Descuento: ${descuento}% | Total: Q${totalFinal.toFixed(2)}
    </li>
  </ul>`;
  container.innerHTML = html;
}

// ============================================================
// GUARDAR VENTA
// ============================================================
async function saveVenta(event) {
  if (event) event.preventDefault();

  const id_caja_turno = parseInt(
    document.getElementById("ventaCajaTurno").value,
  );
  if (!id_caja_turno) {
    showToast("Selecciona un turno de caja", "error");
    return;
  }

  let id_ubicacion = null;
  try {
    const config = await api.request("/configuracion").catch(() => ({}));
    id_ubicacion = config.id_ubicacion || null;
    if (!id_ubicacion) {
      showToast(
        "No hay ubicación configurada. Contacta al administrador.",
        "error",
      );
      return;
    }
  } catch (error) {
    showToast("Error al obtener configuración", "error");
    return;
  }

  const id_vendedor =
    parseInt(document.getElementById("ventaVendedor").value) || null;
  if (!id_vendedor) {
    showToast("Selecciona un vendedor", "error");
    return;
  }

  if (ventaDetallesTemp.length === 0) {
    showToast("Agrega al menos un producto", "error");
    return;
  }

  const id_usuario = getCurrentUser()?.id || 1;
  const id_cliente =
    parseInt(document.getElementById("ventaCliente").value) || null;
  // Se escribió algo en Cliente pero no se eligió de la lista: antes la
  // venta se guardaba sin cliente y sin avisar.
  const textoCliente = (
    document.getElementById("ventaClienteSearchTxt")?.value || ""
  ).trim();
  if (!id_cliente && textoCliente) {
    showToast(
      "Elige el cliente de la lista (o presiona Enter con su NIT). Si es consumidor final, borra el campo Cliente.",
      "warning",
    );
    document.getElementById("ventaClienteSearchTxt")?.focus();
    return;
  }
  const descuento_porcentaje =
    parseFloat(document.getElementById("ventaDescuento").value) || 0;
  const observaciones =
    document.getElementById("ventaObservaciones").value || null;
  const id_cotizacion =
    parseInt(document.getElementById("ventaCotizacion").value) || null;

  let subtotal = 0;
  ventaDetallesTemp.forEach((d) => {
    subtotal += d.cantidad * (d.producto.precio_venta || 0);
  });

  const totalFinal = subtotal - (subtotal * descuento_porcentaje) / 100;

  let nit_cliente = null;
  if (id_cliente) {
    const cliente = (window.clientesData || []).find(
      (c) => c.id === id_cliente,
    );
    if (cliente && cliente.nit) {
      nit_cliente = cliente.nit;
    }
  }

  const data = {
    id_usuario: id_usuario,
    id_vendedor: id_vendedor,
    id_cliente: id_cliente,
    id_caja_turno: id_caja_turno,
    id_ubicacion: id_ubicacion,
    id_cotizacion: id_cotizacion,
    descuento_porcentaje: descuento_porcentaje,
    observaciones: observaciones,
    nit: nit_cliente,
    detalles: ventaDetallesTemp.map((d) => ({
      id_producto: d.id_producto,
      cantidad: d.cantidad,
    })),
    pagos: [],
  };

  try {
    const result = await api.createVenta(data);
    showToast(`Venta #${result.id} creada correctamente`, "success");
    bootstrap.Modal.getInstance(document.getElementById("ventaModal")).hide();
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al crear venta", "error");
  }
}

// ============================================================
// VER VENTA
// ============================================================
async function verVenta(id) {
  try {
    const venta = await api.getVenta(id);
    if (!venta) {
      showToast("Venta no encontrada", "error");
      return;
    }

    const cliente = (window.clientesData || []).find(
      (c) => c.id === venta.id_cliente,
    );
    const nombreCliente = cliente ? cliente.nombre : "Sin cliente";

    const totalPagos = (venta.pagos || []).reduce(
      (sum, p) => sum + (p.monto || 0),
      0,
    );
    const saldo = (venta.total || 0) - totalPagos;
    const pagada = saldo <= 0;

    // Llenar datos básicos
    document.getElementById("verVentaId").value = venta.id || "";
    document.getElementById("verVentaNumero").textContent = venta.id || "";
    document.getElementById("verVentaCliente").textContent = nombreCliente;
    document.getElementById("verVentaFecha").textContent = venta.fecha
      ? new Date(venta.fecha).toLocaleString()
      : "--";

    // Estado
    const estadoBadge = document.getElementById("verVentaEstado");
    const estado = venta.estado_pago || (pagada ? "PAGADA" : "PENDIENTE");
    estadoBadge.textContent = estado;
    estadoBadge.className = `badge ${estado === "PAGADA" || estado === "Pagada" ? "bg-success" : estado === "PENDIENTE" || estado === "Pendiente" ? "bg-warning text-dark" : "bg-danger"}`;

    // Totales
    document.getElementById("verVentaSubtotal").textContent =
      `Q${(venta.subtotal || 0).toFixed(2)}`;
    document.getElementById("verVentaDescuento").textContent =
      `${venta.descuento || 0}%`;
    document.getElementById("verVentaTotal").textContent =
      `Q${(venta.total || 0).toFixed(2)}`;
    document.getElementById("verVentaSaldo").textContent =
      `Q${saldo.toFixed(2)}`;

    // Detalles (productos)
    const detallesBody = document.getElementById("verVentaDetallesBody");
    if (venta.detalles && venta.detalles.length > 0) {
      let html = "";
      let totalDetalles = 0;
      venta.detalles.forEach((d) => {
        const producto = (window.productosData || []).find(
          (p) => p.id === d.id_producto,
        );
        const subtotal = (d.cantidad || 0) * (d.precio_unitario || 0);
        totalDetalles += subtotal;
        html += `
          <tr>
            <td>${producto ? producto.nombre : "Producto"}</td>
            <td class="text-center">${d.cantidad || 0}</td>
            <td class="text-end">Q${(d.precio_unitario || 0).toFixed(2)}</td>
            <td class="text-end">Q${subtotal.toFixed(2)}</td>
          </tr>
        `;
      });
      detallesBody.innerHTML = html;
      document.getElementById("verVentaTotalDetalles").textContent =
        `Q${totalDetalles.toFixed(2)}`;
    } else {
      detallesBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay productos</td></tr>`;
      document.getElementById("verVentaTotalDetalles").textContent = "Q0.00";
    }

    // Pagos
    const pagosBody = document.getElementById("verVentaPagosBody");
    if (venta.pagos && venta.pagos.length > 0) {
      let html = "";
      let totalPagosMostrar = 0;
      venta.pagos.forEach((p) => {
        totalPagosMostrar += p.monto || 0;
        const tipoPago = tiposPagoData.find((t) => t.id === p.id_tipo_pago);
        html += `
          <tr>
            <td>${tipoPago ? tipoPago.nombre : "Efectivo"}</td>
            <td class="text-end">Q${(p.monto || 0).toFixed(2)}</td>
            <td>${p.referencia || "--"}</td>
            <td>${p.fecha_creacion ? new Date(p.fecha_creacion).toLocaleDateString() : "-"}</td>
          </tr>
        `;
      });
      pagosBody.innerHTML = html;
      document.getElementById("verVentaTotalPagos").textContent =
        `Q${totalPagosMostrar.toFixed(2)}`;
    } else {
      pagosBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay pagos registrados</td></tr>`;
      document.getElementById("verVentaTotalPagos").textContent = "Q0.00";
    }

    // Servicios adicionales
    const serviciosBody = document.getElementById("verVentaServiciosBody");
    const serviciosVenta = serviciosAdicionalesData.filter(
      (s) => s.id_venta === id,
    );
    if (serviciosVenta.length > 0) {
      let html = "";
      serviciosVenta.forEach((s) => {
        const totalServicio =
          (s.monto_material || 0) + (s.monto_mano_obra || 0);
        html += `
          <tr>
            <td>${s.tipo_servicio || "--"}</td>
            <td>${s.descripcion || "--"}</td>
            <td class="text-end">Q${(s.monto_material || 0).toFixed(2)}</td>
            <td class="text-end">Q${(s.monto_mano_obra || 0).toFixed(2)}</td>
            <td class="text-end">Q${totalServicio.toFixed(2)}</td>
          </tr>
        `;
      });
      serviciosBody.innerHTML = html;
    } else {
      serviciosBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay servicios adicionales</td></tr>`;
    }

    // Observaciones
    const obsContainer = document.getElementById(
      "verVentaObservacionesContainer",
    );
    if (venta.observaciones) {
      document.getElementById("verVentaObservaciones").textContent =
        venta.observaciones;
      obsContainer.style.display = "block";
    } else {
      obsContainer.style.display = "none";
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("verVentaModal"));
    modal.show();
  } catch (error) {
    console.error("Error al cargar venta:", error);
    showToast("Error al cargar los datos de la venta", "error");
  }
}

// ============================================================
// ELIMINAR PAGO DE VENTA
// ============================================================
async function eliminarPagoVenta(idVenta, idPago) {
  const confirmado = await mostrarConfirmacion(
    "Eliminar Pago",
    "¿Estás seguro de eliminar este pago? Esto aumentará el saldo pendiente de la venta.",
    "Eliminar",
  );

  if (!confirmado) return;

  try {
    await api.request(`/ventas/${idVenta}/pagos/${idPago}`, "DELETE");
    showToast("Pago eliminado correctamente", "success");

    // Recargar la venta para actualizar la vista
    await loadVentasModule();
    // Volver a abrir la venta para mostrar los cambios
    setTimeout(() => verVenta(idVenta), 500);
  } catch (error) {
    showToast(error.message || "Error al eliminar pago", "error");
  }
}

// ============================================================
// ANULAR VENTA
// ============================================================
async function anularVenta(id) {
  const confirmado = await mostrarConfirmacion(
    "Anular Venta",
    "¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.",
    "Anular",
  );

  if (!confirmado) return;

  try {
    await api.request(`/ventas/${id}/cancelar`, "PATCH");
    showToast("Venta anulada correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al anular venta", "error");
  }
}

// ============================================================
// MODAL DE PAGO PARA VENTA
// ============================================================
// Saldo pendiente de una venta (total - pagos registrados)
async function saldoPendienteVenta(idVenta) {
  const venta = await api.getVenta(idVenta);
  const pagado = (venta?.pagos || []).reduce(
    (suma, p) => suma + (parseFloat(p.monto) || 0),
    0,
  );
  return Math.round(((parseFloat(venta?.total) || 0) - pagado) * 100) / 100;
}

async function mostrarModalPago(idVenta) {
  let saldo = null;
  try {
    saldo = await saldoPendienteVenta(idVenta);
  } catch (e) {
    saldo = null;
  }
  if (saldo !== null && saldo <= 0) {
    showToast("Esta venta ya está pagada por completo", "info");
    return;
  }
  const modalId = "pagoVentaModal";
  let modal = document.getElementById(modalId);

  if (modal) {
    modal.remove();
  }

  modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = modalId;
  modal.setAttribute("tabindex", "-1");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Registrar Pago - Venta #${idVenta}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="pagoVentaForm" onsubmit="registrarPagoVenta(event, ${idVenta})">
            ${saldo !== null ? `<div class="alert alert-warning py-2">Saldo pendiente: <strong>Q${saldo.toFixed(2)}</strong></div>` : ""}
            <div class="mb-3">
              <label class="form-label">Tipo de Pago *</label>
              <select class="form-select" id="pagoVentaTipo" required>
                <option value="">Seleccionar tipo</option>
                ${tiposPagoData
                  .filter((t) => t.para_ventas === 1 && t.activo !== 0)
                  .map((t) => `<option value="${t.id}">${t.nombre}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Monto *</label>
              <input type="number" class="form-control" id="pagoVentaMonto"
                     step="0.01" min="0.01" ${saldo !== null ? `max="${saldo.toFixed(2)}" value="${saldo.toFixed(2)}"` : ""} required>
              <div class="form-text">No puede ser mayor que el saldo pendiente.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Referencia (opcional)</label>
              <input type="text" class="form-control" id="pagoVentaReferencia" 
                     placeholder="Número de referencia, cheque, etc.">
            </div>
            <div class="text-end">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-success">
                <i class="fas fa-save me-2"></i>Registrar Pago
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();

  modal.addEventListener("hidden.bs.modal", function () {
    this.remove();
  });
}

// ============================================================
// REGISTRAR PAGO DE VENTA
// ============================================================
async function registrarPagoVenta(event, idVenta) {
  event.preventDefault();

  const id_tipo_pago = parseInt(document.getElementById("pagoVentaTipo").value);
  const monto = parseFloat(document.getElementById("pagoVentaMonto").value);
  const referencia =
    document.getElementById("pagoVentaReferencia").value || null;

  if (!id_tipo_pago) {
    showToast("Selecciona un tipo de pago", "error");
    return;
  }

  if (!monto || monto <= 0) {
    showToast("Ingresa un monto válido", "error");
    return;
  }

  try {
    const saldo = await saldoPendienteVenta(idVenta);
    if (monto > saldo + 0.009) {
      showToast(
        `El pago (Q${monto.toFixed(2)}) es mayor que el saldo pendiente (Q${saldo.toFixed(2)})`,
        "error",
      );
      return;
    }
  } catch (e) {
    // si no se pudo consultar, el servidor igual lo valida
  }

  try {
    const result = await api.request(`/ventas/${idVenta}/pagos`, "POST", {
      id_tipo_pago,
      monto,
      referencia,
    });

    showToast("Pago registrado correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("pagoVentaModal"),
    );
    if (modal) modal.hide();

    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al registrar pago", "error");
  }
}

function crearClienteDesdeVenta() {
  const ventaModal = document.getElementById("ventaModal");
  const clienteModal = document.getElementById("clienteModal");
  if (!ventaModal || !clienteModal || typeof bootstrap === "undefined") return;

  const idClienteSeleccionado =
    document.getElementById("ventaCliente")?.value || "";
  const instanciaVenta = bootstrap.Modal.getInstance(ventaModal);
  if (!instanciaVenta) return;

  window.__crearClienteDesdeVenta = true;
  window.__clienteVentaCreado = null;

  clienteModal.addEventListener(
    "hidden.bs.modal",
    () => {
      const clienteCreado = window.__clienteVentaCreado;
      window.__crearClienteDesdeVenta = false;
      window.__clienteVentaCreado = null;
      window.clientesData = window.clientesData || [];
      if (
        clienteCreado &&
        !window.clientesData.some(
          (cliente) => String(cliente.id) === String(clienteCreado.id),
        )
      ) {
        window.clientesData.push(clienteCreado);
      }
      llenarSelectCliente();
      window.__ventaClienteSelector?.setValue(
        clienteCreado?.id || idClienteSeleccionado,
      );
      bootstrap.Modal.getOrCreateInstance(ventaModal).show();
    },
    { once: true },
  );

  ventaModal.addEventListener(
    "hidden.bs.modal",
    () => showCreateClienteModal(),
    { once: true },
  );
  instanciaVenta.hide();
}

// ============================================================
// PESTAÑA: CLIENTES CON REACTIVAR
// ============================================================
// Clientes: búsqueda, tipo, estado y fecha de registro se filtran en el
// servidor (antes solo se buscaba entre los primeros 50 clientes activos)
let skipClientesSub = 0;
const LIMITE_CLIENTES_SUB = 50;

async function cargarSubClientes() {
  const container = document.getElementById("clientesSubContainer");
  if (!container) return;

  // La barra se dibuja una sola vez (así no se pierde lo que se escribe)
  if (!document.getElementById("clientesSubBarraFiltros")) {
    container.innerHTML = `
      ${htmlBarraFiltros({
        id: "clientesSub",
        placeholder: "Buscar por nombre, NIT, teléfono o email...",
        selects: [
          {
            id: "Tipo",
            label: "Todos los tipos",
            opciones: [
              ["General", "General"],
              ["Frecuente", "Frecuente"],
              ["Mayorista", "Mayorista"],
            ],
          },
          {
            id: "Estado",
            label: "Solo activos",
            opciones: [
              ["inactivos", "Solo inactivos"],
              ["todos", "Activos e inactivos"],
            ],
          },
        ],
        fechas: true,
        onChange: "filtrarClientes()",
        extraHtml: tienePermiso("Ventas", "Crear")
          ? `<button class="btn btn-primary btn-sm" onclick="showCreateClienteSubModal()">
              <i class="fas fa-plus me-2"></i>Nuevo Cliente
            </button>`
          : "",
      })}
      <div class="form-text mb-2">El rango de fechas es por la fecha de registro del cliente.</div>
      <div id="clientesSubResultados"></div>
    `;
  }
  const destino = document.getElementById("clientesSubResultados");

  try {
    const f = leerBarraFiltros("clientesSub");
    if (!rangoFechasValidoFiltro(f.desde, f.hasta)) return;
    let url = `/clientes?skip=${skipClientesSub}&limit=${LIMITE_CLIENTES_SUB}&estado=${f.Estado || "activos"}`;
    if (f.texto) url += `&buscar=${encodeURIComponent(f.texto)}`;
    if (f.Tipo) url += `&tipo_cliente=${encodeURIComponent(f.Tipo)}`;
    if (f.desde) url += `&fecha_desde=${f.desde}`;
    if (f.hasta) url += `&fecha_hasta=${f.hasta}`;
    const clientes = (await api.request(url).catch(() => [])) || [];

    // Se agregan a la lista general (la usan otras pantallas para mostrar
    // nombres) sin reemplazarla por el resultado filtrado
    window.clientesData = window.clientesData || [];
    clientes.forEach((c) => {
      const i = window.clientesData.findIndex((x) => x.id === c.id);
      if (i >= 0) window.clientesData[i] = c;
      else window.clientesData.push(c);
    });

    const conteoVentasPorCliente = {};
    try {
      const conteos =
        (await api
          .request("/ventas/conteo?agrupar_por=cliente")
          .catch(() => [])) || [];
      conteos.forEach((c) => {
        conteoVentasPorCliente[c.id] = c.total;
      });
    } catch (e) {}

    const paginacionHtml = `
      <div class="d-flex justify-content-between align-items-center mt-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="clientesSubPagina(-1)" ${skipClientesSub === 0 ? "disabled" : ""}>
          <i class="fas fa-chevron-left me-1"></i>Anterior
        </button>
        <small class="text-muted">Página ${Math.floor(skipClientesSub / LIMITE_CLIENTES_SUB) + 1} — Mostrando ${clientes.length} cliente(s)</small>
        <button class="btn btn-sm btn-outline-secondary" onclick="clientesSubPagina(1)" ${clientes.length < LIMITE_CLIENTES_SUB ? "disabled" : ""}>
          Siguiente<i class="fas fa-chevron-right ms-1"></i>
        </button>
      </div>`;

    if (clientes.length === 0) {
      destino.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-users fa-3x text-muted mb-3"></i>
          <p class="text-muted">No hay clientes que coincidan con el filtro</p>
        </div>
      ` + (skipClientesSub > 0 ? paginacionHtml : "");
      return;
    }

    let html = `
      <div class="table-responsive">
        <table class="table table-hover table-striped" id="clientesTable">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>NIT</th>
              <th>Tipo</th>
              <th>Registro</th>
              <th>Ventas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="clientesTableBody">
    `;

    clientes.forEach((c) => {
      const totalVentasCliente = conteoVentasPorCliente[c.id] || 0;
      const activo = c.activo !== 0;
      html += `
        <tr>
          <td>${c.id}</td>
          <td>
            <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${c.id})">
              ${escaparHtmlEscaner(c.nombre || "--")}
            </button>
          </td>
          <td>${escaparHtmlEscaner(c.telefono || "--")}</td>
          <td>${escaparHtmlEscaner(c.email || "--")}</td>
          <td>${escaparHtmlEscaner(c.nit || "--")}</td>
          <td>${escaparHtmlEscaner(c.tipo_cliente || "General")}</td>
          <td><small>${c.fecha_registro ? new Date(c.fecha_registro).toLocaleDateString("es-GT") : "--"}</small></td>
          <td><span class="badge bg-info">${totalVentasCliente}</span></td>
          <td>
            <span class="badge ${activo ? "bg-success" : "bg-danger"}">
              ${activo ? "Activo" : "Inactivo"}
            </span>
          </td>
          <td>
            ${
              tienePermiso("Ventas", "Editar")
                ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditClienteSubModal(${c.id})">
              <i class="fas fa-edit"></i>
            </button>`
                : ""
            }
            ${
              activo && tienePermiso("Ventas", "Eliminar")
                ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteClienteSub(${c.id})">
              <i class="fas fa-trash"></i>
            </button>`
                : ""
            }
            ${
              !activo && tienePermiso("Ventas", "Eliminar")
                ? `
              <button class="btn btn-sm btn-outline-success" onclick="reactivarCliente(${c.id})">
                <i class="fas fa-undo"></i>
              </button>
            `
                : ""
            }
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    ` + paginacionHtml;

    destino.innerHTML = html;
  } catch (error) {
    destino.innerHTML = `<div class="alert alert-danger">Error al cargar clientes: ${error.message}</div>`;
  }
}

function filtrarClientes() {
  skipClientesSub = 0;
  cargarSubClientes();
}

function clientesSubPagina(direccion) {
  skipClientesSub = Math.max(0, skipClientesSub + direccion * LIMITE_CLIENTES_SUB);
  cargarSubClientes();
}

function limpiarFiltroClientes() {
  limpiarBarraFiltros("clientesSub");
  filtrarClientes();
}

async function reactivarCliente(id) {
  const confirmado = await mostrarConfirmacion(
    "Reactivar Cliente",
    "¿Estás seguro de reactivar este cliente?",
    "Reactivar",
  );

  if (!confirmado) return;

  try {
    await api.request(`/clientes/${id}/reactivar`, "PATCH");
    showToast("Cliente reactivado correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al reactivar cliente", "error");
  }
}

function showCreateClienteSubModal() {
  showCreateClienteModal();
}

async function showEditClienteSubModal(id) {
  await showEditClienteModal(id);
}

async function deleteClienteSub(id) {
  if (!await confirmarAccion("¿Estás seguro de eliminar este cliente?")) return;
  try {
    await api.deleteCliente(id);
    showToast("Cliente eliminado correctamente", "success");
    await cargarSubClientes();
  } catch (error) {
    showToast(error.message || "Error al eliminar cliente", "error");
  }
}

// ============================================================
// PESTAÑA: COTIZACIONES
// ============================================================
async function cargarSubCotizaciones() {
  const container = document.getElementById("cotizacionesSubContainer");
  if (!container) return;

  try {
    // Estado y fechas se filtran en el servidor; el texto, en la tabla
    const f = leerBarraFiltros("cotizaciones");
    if (!rangoFechasValidoFiltro(f.desde, f.hasta)) return;
    let url = "/cotizaciones?limit=200";
    if (f.Estado) url += `&estado=${encodeURIComponent(f.Estado)}`;
    if (f.desde) url += `&fecha_desde=${f.desde}`;
    if (f.hasta) url += `&fecha_hasta=${f.hasta}`;
    const cotizaciones = await api.request(url).catch(() => []);
    cotizacionesData = cotizaciones || [];

    let searchHtml = htmlBarraFiltros({
      id: "cotizaciones",
      placeholder: "Buscar por ID, expediente o cliente...",
      selects: [
        {
          id: "Estado",
          label: "Todos los estados",
          opciones: [
            ["Pendiente", "Pendientes"],
            ["Aceptada", "Aceptadas"],
            ["Rechazada", "Rechazadas"],
          ],
        },
      ],
      fechas: true,
      onChange: "filtrarCotizaciones()",
      extraHtml: tienePermiso("Ventas", "Crear")
        ? `<button class="btn btn-success btn-sm" onclick="showCreateCotizacionModal()">
            <i class="fas fa-plus me-2"></i>Nueva Cotización
          </button>`
        : "",
    });

    container.innerHTML =
      searchHtml +
      `
      <div class="row">
        <div class="col-md-4">
          <div class="card bg-info bg-opacity-10 mb-3">
            <div class="card-body">
              <h6 class="fw-bold">Total Cotizaciones</h6>
              <h3 class="text-info">${cotizacionesData.length}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-success bg-opacity-10 mb-3">
            <div class="card-body">
              <h6 class="fw-bold">Total Aceptadas</h6>
              <h3 class="text-success">${cotizacionesData.filter((c) => esCotizacionAceptada(c)).length}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-warning bg-opacity-10 mb-3">
            <div class="card-body">
              <h6 class="fw-bold">Total Pendientes</h6>
              <h3 class="text-warning">${cotizacionesData.filter((c) => c.estado === "Pendiente").length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover table-striped" id="cotizacionesTable">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Expediente</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cotizacionesTableBody">
            ${
              cotizacionesData.length === 0
                ? `
              <tr><td colspan="7" class="text-center text-muted">No hay cotizaciones registradas</td></tr>
            `
                : cotizacionesData
                    .map((c) => {
                      const cliente = (window.clientesData || []).find(
                        (cl) => cl.id === c.id_cliente,
                      );
                      const nombreCliente = cliente ? cliente.nombre : "--";
                      const estadoColor =
                        esCotizacionAceptada(c)
                          ? "success"
                          : c.estado === "Rechazada"
                            ? "danger"
                            : "warning";
                      return `
                <tr>
                  <td>#${c.id}</td>
                  <td><span class="badge bg-secondary">${c.numero_expediente || "--"}</span></td>
                  <td>
                    <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${c.id_cliente})">
                      ${nombreCliente}
                    </button>
                  </td>
                  <td>${c.fecha ? new Date(c.fecha).toLocaleString() : "--"}</td>
                  <td><strong>Q${(c.total || 0).toFixed(2)}</strong></td>
                  <td><span class="badge bg-${estadoColor}">${c.estado || "Pendiente"}</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verCotizacion(${c.id})">
                      <i class="fas fa-eye"></i>
                    </button>
                    ${
                      c.estado === "Pendiente" &&
                      tienePermiso("Ventas", "Editar")
                        ? `
                      <button class="btn btn-sm btn-outline-success" onclick="aprobarCotizacion(${c.id})">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" onclick="rechazarCotizacion(${c.id})">
                        <i class="fas fa-times"></i>
                      </button>
                    `
                        : ""
                    }
                  </td>
                </tr>
              `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
      <div class="text-end">
        <small class="text-muted" id="cotizacionesConteo">Total: ${cotizacionesData.length} cotizaciones</small>
      </div>
    `;
    aplicarTextoCotizaciones();
    const buscar = document.getElementById("cotizacionesBuscar");
    if (buscar && window.__focoCotizaciones) {
      buscar.focus();
      buscar.setSelectionRange(buscar.value.length, buscar.value.length);
    }
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar cotizaciones: ${error.message}</div>`;
  }
}

// El servidor guarda "Aceptada"; antes la pantalla buscaba "Aprobada" y
// nunca mostraba las aceptadas (ni el botón para convertirlas en venta)
function esCotizacionAceptada(c) {
  return c && (c.estado === "Aceptada" || c.estado === "Aprobada");
}

// Búsqueda por texto sobre las filas ya cargadas
function aplicarTextoCotizaciones() {
  const { texto } = leerBarraFiltros("cotizaciones");
  const tbody = document.getElementById("cotizacionesTableBody");
  if (!tbody) return;
  let visibles = 0;
  const filas = [...tbody.getElementsByTagName("tr")];
  filas.forEach((row) => {
    const ok = coincideTextoFiltro(texto, row.textContent);
    row.style.display = ok ? "" : "none";
    if (ok) visibles++;
  });
  const conteo = document.getElementById("cotizacionesConteo");
  if (conteo) {
    conteo.textContent = texto
      ? `Mostrando ${visibles} de ${cotizacionesData.length} cotizaciones`
      : `Total: ${cotizacionesData.length} cotizaciones`;
  }
}

// Estado y fechas recargan desde el servidor; el texto solo filtra la tabla
function filtrarCotizaciones() {
  const f = leerBarraFiltros("cotizaciones");
  const clave = `${f.Estado}|${f.desde}|${f.hasta}`;
  if (clave === window.__claveCotizaciones) {
    aplicarTextoCotizaciones();
    return;
  }
  window.__claveCotizaciones = clave;
  window.__focoCotizaciones =
    document.activeElement?.id === "cotizacionesBuscar";
  cargarSubCotizaciones();
}

function limpiarFiltroCotizaciones() {
  limpiarBarraFiltros("cotizaciones");
  filtrarCotizaciones();
}

// ============================================================
// CREAR COTIZACIÓN
// ============================================================
function crearModalCotizacion() {
  let modal = document.getElementById("cotizacionModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "cotizacionModal";
  modal.setAttribute("tabindex", "-1");
  modal.setAttribute("aria-labelledby", "cotizacionModalTitle");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="cotizacionModalTitle">Nueva Cotización</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="cotizacionForm" onsubmit="saveCotizacion(event)">
            <input type="hidden" id="cotizacionId" value="">
            
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Cliente * <small class="text-muted">(busca por NIT o nombre)</small></label>
                  <input type="hidden" id="cotizacionCliente" value="">
                  <div class="position-relative">
                    <div class="input-group">
                      <span class="input-group-text"><i class="fas fa-search"></i></span>
                      <input type="text" class="form-control" id="cotizacionClienteBuscar"
                             placeholder="Escribe el NIT o el nombre y presiona Enter" autocomplete="off">
                      <button class="btn btn-outline-secondary" type="button" id="cotizacionClienteLimpiar" title="Limpiar">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    <ul class="list-group position-absolute w-100 shadow-sm" id="cotizacionClienteLista"
                        style="z-index: 1060; max-height: 220px; overflow-y: auto; display: none; top: 100%;"></ul>
                  </div>
                  <div id="cotizacionClienteInfo" class="mt-2"></div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Observaciones</label>
                  <textarea class="form-control" id="cotizacionObservaciones" rows="2"></textarea>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold">Productos</h6>
              <button type="button" class="btn btn-sm btn-success" onclick="agregarProductoCotizacion()">
                <i class="fas fa-plus me-1"></i>Agregar Producto
              </button>
            </div>

            <div class="row mb-2" id="cotizacionProductoRow">
              <div class="col-md-5">
                <input type="hidden" id="cotizacionProductoSelect" value="">
                <div class="position-relative">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text"><i class="fas fa-barcode"></i></span>
                    <input type="text" class="form-control" id="cotizacionProductoBuscar"
                           placeholder="Nombre, código o escanea el código de barras" autocomplete="off">
                  </div>
                  <ul class="list-group position-absolute w-100 shadow-sm" id="cotizacionProductoLista"
                      style="z-index: 1060; max-height: 220px; overflow-y: auto; display: none; top: 100%;"></ul>
                </div>
                <div id="cotizacionProductoInfo" class="small mt-1"></div>
              </div>
              <div class="col-md-3">
                <input type="number" class="form-control form-control-sm" id="cotizacionProductoCantidad" value="1" step="1" min="1">
              </div>
              <div class="col-md-3">
                <div class="d-flex gap-2">
                  <input type="text" class="form-control form-control-sm" id="cotizacionProductoPrecio" readonly>
                  <button type="button" class="btn btn-sm btn-success" onclick="agregarProductoCotizacionLista()">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div id="cotizacionItemsList" class="mb-3"></div>

            <div class="row">
              <div class="col-md-6 offset-md-6">
                <div class="card">
                  <div class="card-body">
                    <p class="mb-1"><strong>Total:</strong> <span id="cotizacionTotalDisplay">Q0.00</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div class="text-end mt-3">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-success">Guardar Cotización</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  _configurarBuscadoresCotizacion();
  return modal;
}

// ------------------------------------------------------------
// Buscador con resultados del servidor (no depende de la lista de 50
// clientes/productos ya cargada). Se usa en Nueva Cotización.
// ------------------------------------------------------------
function crearBuscadorRemoto(config) {
  const input = document.getElementById(config.inputId);
  const lista = document.getElementById(config.listaId);
  if (!input || !lista) return null;

  let resultados = [];
  let temporizador = null;
  let ultimaBusqueda = 0;

  async function buscar(texto) {
    const termino = (texto || "").trim();
    if (!termino) {
      resultados = [];
      lista.style.display = "none";
      return [];
    }
    const numero = ++ultimaBusqueda;
    let datos = [];
    try {
      datos = (await api.request(config.url(termino))) || [];
    } catch (e) {
      datos = [];
    }
    if (numero !== ultimaBusqueda) return resultados; // llegó una búsqueda más nueva
    resultados = datos;
    if (datos.length === 0) {
      lista.innerHTML = `<li class="list-group-item text-muted small">Sin resultados</li>`;
    } else {
      lista.innerHTML = datos
        .map(
          (item, i) =>
            `<li class="list-group-item list-group-item-action py-1 px-2 small" style="cursor:pointer;" data-i="${i}">${config.etiqueta(item)}</li>`,
        )
        .join("");
    }
    lista.style.display = "block";
    return datos;
  }

  function elegir(item) {
    lista.style.display = "none";
    config.onSelect(item);
  }

  input.addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => buscar(input.value), 250);
  });

  input.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    // Sin esto, el Enter (también el del lector de barras) enviaría el formulario
    event.preventDefault();
    clearTimeout(temporizador);
    const texto = input.value.trim();
    if (!texto) return;
    if (config.onEnter && (await config.onEnter(texto))) {
      lista.style.display = "none";
      return;
    }
    const datos = await buscar(texto);
    const exacto = config.coincideExacto
      ? datos.find((d) => config.coincideExacto(d, texto))
      : null;
    if (exacto) elegir(exacto);
    else if (datos.length === 1) elegir(datos[0]);
  });

  lista.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li) return;
    e.preventDefault();
    const item = resultados[parseInt(li.dataset.i)];
    if (item) elegir(item);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      lista.style.display = "none";
    }, 150);
  });

  return {
    ocultar: () => {
      lista.style.display = "none";
    },
  };
}

function _mostrarClienteCotizacion(cliente) {
  const info = document.getElementById("cotizacionClienteInfo");
  const hidden = document.getElementById("cotizacionCliente");
  const input = document.getElementById("cotizacionClienteBuscar");
  if (!cliente) {
    hidden.value = "";
    info.innerHTML = "";
    return;
  }
  const esc = escaparHtmlEscaner;
  hidden.value = cliente.id;
  input.value = cliente.nit
    ? `${cliente.nit} - ${cliente.nombre || ""}`
    : cliente.nombre || "";
  info.innerHTML = `
    <div class="alert alert-success small py-2 px-2 mb-0">
      <div><i class="fas fa-check-circle me-1"></i><strong>${esc(cliente.nombre || "Sin nombre")}</strong></div>
      <div><strong>NIT:</strong> ${esc(cliente.nit || "Sin NIT")}</div>
      <div><strong>Teléfono:</strong> ${esc(cliente.telefono || "Sin teléfono")}</div>
      <div><strong>Email:</strong> ${esc(cliente.email || "Sin email")}</div>
      <div><strong>Dirección:</strong> ${esc(cliente.direccion || "Sin dirección")}</div>
    </div>`;
}

function _seleccionarProductoCotizacion(producto) {
  const hidden = document.getElementById("cotizacionProductoSelect");
  const input = document.getElementById("cotizacionProductoBuscar");
  const precio = document.getElementById("cotizacionProductoPrecio");
  const info = document.getElementById("cotizacionProductoInfo");
  if (!producto) {
    hidden.value = "";
    precio.value = "";
    info.innerHTML = "";
    return;
  }
  window.productosData = window.productosData || [];
  if (!window.productosData.some((p) => p.id === producto.id)) {
    window.productosData.push(producto);
  }
  hidden.value = producto.id;
  input.value = `${producto.codigo || ""} - ${producto.nombre}`;
  precio.value = `Q${parseFloat(producto.precio_venta || 0).toFixed(2)}`;
  info.innerHTML = `<span class="text-muted">Stock: ${Number(producto.stock_actual || 0)}</span>`;
}

function _configurarBuscadoresCotizacion() {
  const esc = escaparHtmlEscaner;

  crearBuscadorRemoto({
    inputId: "cotizacionClienteBuscar",
    listaId: "cotizacionClienteLista",
    url: (t) => `/clientes?buscar=${encodeURIComponent(t)}&limit=20`,
    etiqueta: (c) =>
      `<strong>${esc(c.nit || "Sin NIT")}</strong> - ${esc(c.nombre || "")}`,
    coincideExacto: (c, t) =>
      String(c.nit || "").trim().toLowerCase() === t.toLowerCase(),
    onSelect: _mostrarClienteCotizacion,
  });

  document
    .getElementById("cotizacionClienteBuscar")
    .addEventListener("input", () => {
      // Si se cambia el texto, el cliente elegido antes ya no aplica
      document.getElementById("cotizacionCliente").value = "";
      document.getElementById("cotizacionClienteInfo").innerHTML = "";
    });

  document
    .getElementById("cotizacionClienteLimpiar")
    .addEventListener("click", () => {
      document.getElementById("cotizacionClienteBuscar").value = "";
      _mostrarClienteCotizacion(null);
      document.getElementById("cotizacionClienteBuscar").focus();
    });

  crearBuscadorRemoto({
    inputId: "cotizacionProductoBuscar",
    listaId: "cotizacionProductoLista",
    url: (t) => `/productos?buscar=${encodeURIComponent(t)}&limit=20`,
    etiqueta: (p) =>
      `${esc(p.codigo || "")} - ${esc(p.nombre || "")} <span class="text-muted">(Q${parseFloat(p.precio_venta || 0).toFixed(2)} · stock ${Number(p.stock_actual || 0)})</span>`,
    // Lector de barras: código exacto -> se agrega directo a la lista
    onEnter: async (texto) => {
      try {
        const producto = await buscarProductoPorCodigo(texto);
        if (producto.activo === 0) return false;
        _seleccionarProductoCotizacion(producto);
        agregarProductoCotizacionLista();
        return true;
      } catch (e) {
        return false; // no es un código: se busca por nombre
      }
    },
    onSelect: _seleccionarProductoCotizacion,
  });

  document
    .getElementById("cotizacionProductoBuscar")
    .addEventListener("input", () => {
      document.getElementById("cotizacionProductoSelect").value = "";
      document.getElementById("cotizacionProductoPrecio").value = "";
      document.getElementById("cotizacionProductoInfo").innerHTML = "";
    });
}

function showCreateCotizacionModal() {
  cotizacionItemsTemp = [];

  const modal = crearModalCotizacion();
  if (!modal) return;

  document.getElementById("cotizacionClienteBuscar").value = "";
  _mostrarClienteCotizacion(null);
  document.getElementById("cotizacionProductoBuscar").value = "";
  _seleccionarProductoCotizacion(null);

  document.getElementById("cotizacionObservaciones").value = "";
  document.getElementById("cotizacionProductoCantidad").value = 1;
  document.getElementById("cotizacionProductoPrecio").value = "";
  document.getElementById("cotizacionItemsList").innerHTML = "";
  document.getElementById("cotizacionTotalDisplay").textContent = "Q0.00";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function agregarProductoCotizacion() {
  agregarProductoCotizacionLista();
}

function agregarProductoCotizacionLista() {
  const select = document.getElementById("cotizacionProductoSelect");
  const cantidad =
    parseInt(document.getElementById("cotizacionProductoCantidad").value) || 0;
  const id_producto = parseInt(select.value);

  if (!id_producto) {
    showToast("Selecciona un producto", "warning");
    return;
  }

  if (cantidad <= 0) {
    showToast("La cantidad debe ser mayor a 0", "warning");
    return;
  }

  const producto = (window.productosData || []).find(
    (p) => p.id === id_producto,
  );
  if (!producto) {
    showToast("Producto no encontrado", "error");
    return;
  }

  // Si el producto ya está en la lista, se suma la cantidad
  const existente = cotizacionItemsTemp.find(
    (item) => item.id_producto === id_producto,
  );
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    cotizacionItemsTemp.push({
      id_producto: id_producto,
      cantidad: cantidad,
      nombre: producto.nombre,
      precio_unitario: parseFloat(producto.precio_venta || 0),
    });
  }

  _seleccionarProductoCotizacion(null);
  document.getElementById("cotizacionProductoBuscar").value = "";
  document.getElementById("cotizacionProductoCantidad").value = 1;
  document.getElementById("cotizacionProductoBuscar").focus();

  renderCotizacionItems();
  calcularTotalCotizacion();
}

function renderCotizacionItems() {
  const container = document.getElementById("cotizacionItemsList");
  if (cotizacionItemsTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay productos agregados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  let total = 0;
  cotizacionItemsTemp.forEach((item, index) => {
    const subtotal = item.cantidad * item.precio_unitario;
    total += subtotal;
    html += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>${escaparHtmlEscaner(item.nombre)}</strong>
          <span class="text-muted small"> x ${item.cantidad}</span>
          <span class="text-muted small"> Q${item.precio_unitario.toFixed(2)} c/u</span>
        </div>
        <div>
          <span class="fw-bold">Q${subtotal.toFixed(2)}</span>
          <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarItemCotizacion(${index})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </li>
    `;
  });
  html += `
    <li class="list-group-item fw-bold bg-light">
      Total: Q${total.toFixed(2)}
    </li>
  </ul>`;
  container.innerHTML = html;
}

function eliminarItemCotizacion(index) {
  cotizacionItemsTemp.splice(index, 1);
  renderCotizacionItems();
  calcularTotalCotizacion();
}

function calcularTotalCotizacion() {
  let total = 0;
  cotizacionItemsTemp.forEach((item) => {
    total += item.cantidad * item.precio_unitario;
  });
  document.getElementById("cotizacionTotalDisplay").textContent =
    `Q${total.toFixed(2)}`;
}

async function saveCotizacion(event) {
  event.preventDefault();

  const id_cliente = parseInt(
    document.getElementById("cotizacionCliente").value,
  );
  const observaciones =
    document.getElementById("cotizacionObservaciones").value || null;

  if (!id_cliente) {
    showToast("Selecciona un cliente", "error");
    return;
  }

  if (cotizacionItemsTemp.length === 0) {
    showToast("Agrega al menos un producto", "error");
    return;
  }

  const data = {
    id_cliente,
    observaciones,
    detalles: cotizacionItemsTemp.map((item) => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
    })),
  };

  try {
    const result = await api.request("/cotizaciones", "POST", data);
    showToast(`Cotización #${result.id} creada correctamente`, "success");
    bootstrap.Modal.getInstance(
      document.getElementById("cotizacionModal"),
    ).hide();
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al guardar cotización", "error");
  }
}

async function verCotizacion(id) {
  try {
    const cotizacion = cotizacionesData.find((c) => c.id === id);
    if (!cotizacion) {
      showToast("Cotización no encontrada", "error");
      return;
    }

    const cliente = (window.clientesData || []).find(
      (c) => c.id === cotizacion.id_cliente,
    );
    const nombreCliente = cliente ? cliente.nombre : "--";

    const detalleConProductos = await api.request(`/cotizaciones/${id}`);

    const modalContent = `
      <div class="modal-header">
        <h5 class="modal-title">Cotización #${cotizacion.id}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="row mb-3">
          <div class="col-md-4">
            <strong>Cliente:</strong> ${nombreCliente}
          </div>
          <div class="col-md-4">
            <strong>Expediente:</strong> <span class="badge bg-secondary">${cotizacion.numero_expediente || "--"}</span>
          </div>
          <div class="col-md-4">
            <strong>Fecha:</strong> ${cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleString() : "--"}
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <strong>Total:</strong> Q${(cotizacion.total || 0).toFixed(2)}
          </div>
          <div class="col-md-6">
            <strong>Estado:</strong> 
            <span class="badge ${esCotizacionAceptada(cotizacion) ? "bg-success" : cotizacion.estado === "Rechazada" ? "bg-danger" : "bg-warning"}">
              ${cotizacion.estado || "Pendiente"}
            </span>
          </div>
        </div>
        ${cotizacion.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${cotizacion.observaciones}</div>` : ""}
        
        <h6 class="fw-bold mt-3">Productos</h6>
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${
                (detalleConProductos.detalles || []).length === 0
                  ? `
                <tr><td colspan="4" class="text-center">Sin productos</td></tr>
              `
                  : (detalleConProductos.detalles || [])
                      .map((item) => {
                        const producto = (window.productosData || []).find(
                          (p) => p.id === item.id_producto,
                        );
                        return `
                  <tr>
                    <td>${producto ? producto.nombre : "Producto #" + item.id_producto}</td>
                    <td>${item.cantidad || 0}</td>
                    <td>Q${(item.precio_unitario || 0).toFixed(2)}</td>
                    <td>Q${((item.cantidad || 0) * (item.precio_unitario || 0)).toFixed(2)}</td>
                  </tr>
                `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        ${
          cotizacion.estado === "Pendiente" && tienePermiso("Ventas", "Editar")
            ? `
          <button class="btn btn-success" onclick="aprobarCotizacion(${cotizacion.id})">Aprobar</button>
          <button class="btn btn-danger" onclick="rechazarCotizacion(${cotizacion.id})">Rechazar</button>
        `
            : ""
        }
        ${
          esCotizacionAceptada(cotizacion) && tienePermiso("Ventas", "Crear")
            ? `
          <button class="btn btn-warning" onclick="crearVentaDesdeCotizacion(${cotizacion.id})">
            <i class="fas fa-shopping-cart me-1"></i>Convertir en Venta
          </button>
        `
            : ""
        }
      </div>
    `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "cotizacionDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver cotización", "error");
  }
}

async function aprobarCotizacion(id) {
  const confirmado = await mostrarConfirmacion(
    "Aprobar Cotización",
    "¿Estás seguro de aprobar esta cotización?",
    "Aprobar",
  );
  if (!confirmado) return;
  try {
    await api.request(
      `/cotizaciones/${id}/estado?nuevo_estado=Aceptada`,
      "PATCH",
    );
    showToast("Cotización aprobada correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al aprobar cotización", "error");
  }
}

async function rechazarCotizacion(id) {
  const confirmado = await mostrarConfirmacion(
    "Rechazar Cotización",
    "¿Estás seguro de rechazar esta cotización?",
    "Rechazar",
  );
  if (!confirmado) return;
  try {
    await api.request(
      `/cotizaciones/${id}/estado?nuevo_estado=Rechazada`,
      "PATCH",
    );
    showToast("Cotización rechazada correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al rechazar cotización", "error");
  }
}

function crearVentaDesdeCotizacion(id) {
  const modalCotizacion = bootstrap.Modal.getInstance(
    document.getElementById("cotizacionDetalleModal"),
  );
  if (modalCotizacion) modalCotizacion.hide();
  showCreateVentaModal();
  setTimeout(() => {
    document.getElementById("ventaCotizacion").value = id;
    buscarCotizacionParaVenta();
  }, 500);
}

// ============================================================
// PESTAÑA: SERVICIOS ADICIONALES
// ============================================================
async function cargarSubServicios() {
  const container = document.getElementById("serviciosSubContainer");
  if (!container) return;

  try {
    const servicios = await api
      .request("/servicios-adicionales?limit=200")
      .catch(() => []);
    serviciosAdicionalesData = servicios || [];

    window.__ventasPorServicioMap = {};
    const idsVentaUnicos = [
      ...new Set(
        (serviciosAdicionalesData || [])
          .map((s) => s.id_venta)
          .filter((id) => !!id),
      ),
    ];
    if (idsVentaUnicos.length > 0) {
      const ventasEncontradas = await Promise.all(
        idsVentaUnicos.map((id) => api.getVenta(id).catch(() => null)),
      );
      ventasEncontradas.forEach((v) => {
        if (v) window.__ventasPorServicioMap[v.id] = v;
      });
    }

    if (!servicios || servicios.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-tools fa-3x text-muted mb-3"></i>
          <p class="text-muted">No hay servicios adicionales registrados</p>
          ${
            tienePermiso("Ventas", "Crear")
              ? `<button class="btn btn-info btn-sm" onclick="showCreateServicioModal()">
            <i class="fas fa-plus me-2"></i>Registrar Servicio
          </button>`
              : ""
          }
        </div>
      `;
      return;
    }

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">Listado de Servicios Adicionales</h6>
        ${
          tienePermiso("Ventas", "Crear")
            ? `<button class="btn btn-info btn-sm" onclick="showCreateServicioModal()">
          <i class="fas fa-plus me-2"></i>Nuevo Servicio
        </button>`
            : ""
        }
      </div>
      ${htmlBarraFiltros({
        id: "servicios",
        placeholder: "Buscar por ID, venta, tipo o descripción...",
        selects: [
          {
            id: "Cliente",
            label: "Todos los clientes",
            opciones: (window.clientesData || []).map((c) => [c.id, c.nombre]),
          },
          {
            id: "Pago",
            label: "Pagados y pendientes",
            opciones: [
              ["Pagado", "Solo pagados"],
              ["Pendiente", "Con saldo pendiente"],
            ],
          },
        ],
        fechas: true,
        onChange: "filtrarServicios()",
      })}
      <div class="table-responsive">
        <table class="table table-hover table-striped" id="serviciosTable">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Venta</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Fecha</th>
              <th>Material</th>
              <th>Mano Obra</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="serviciosTableBody"></tbody>
        </table>
      </div>
      <div id="serviciosPaginacionContainer" class="d-flex justify-content-between align-items-center mt-2"></div>
      <div class="text-end">
        <small class="text-muted" id="serviciosConteo">Total: ${servicios.length} servicios</small>
      </div>
    `;

    container.innerHTML = html;
    filtrarServicios();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar servicios: ${error.message}</div>`;
  }
}

// ============================================================
// OBTENER UBICACIÓN DE CONFIGURACIÓN
// ============================================================
async function obtenerUbicacionConfiguracion() {
  try {
    const config = await api.request("/configuracion").catch(() => ({}));
    return config.id_ubicacion || null;
  } catch (error) {
    return null;
  }
}

function renderServiciosRows(servicios) {
  if (!servicios || servicios.length === 0) {
    return `<tr><td colspan="11" class="text-center">No hay servicios</td></tr>`;
  }

  return servicios
    .map((s) => {
      const cliente = (window.clientesData || []).find(
        (c) => c.id === s.id_cliente,
      );
      const nombreCliente = cliente ? cliente.nombre : "--";
      const { estadoPago, badgeColor, estaPagado, saldoRestante } =
        estadoPagoServicio(s);

      return `
      <tr>
        <td>${s.id}</td>
        <td>${s.id_venta ? `<button class="btn btn-link btn-sm p-0" onclick="verVenta(${s.id_venta})">#${s.id_venta}</button>` : "Independiente"}</td>
        <td>
          <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${s.id_cliente})">
            ${nombreCliente}
          </button>
        </td>
        <td>${s.tipo_servicio || "--"}</td>
        <td>${s.descripcion || "--"}</td>
        <td><small>${s.fecha ? new Date(s.fecha).toLocaleString("es-GT") : "--"}</small></td>
        <td>Q${(s.monto_material || 0).toFixed(2)}</td>
        <td>Q${(s.monto_mano_obra || 0).toFixed(2)}</td>
        <td><strong>Q${(s.total || 0).toFixed(2)}</strong></td>
        <td>
          <span class="badge ${badgeColor}">${estadoPago}</span>
          ${!estaPagado && s.id_venta ? `<span class="badge bg-warning ms-1">Saldo: Q${saldoRestante.toFixed(2)}</span>` : ""}
          ${!s.id_venta && !estaPagado ? `<span class="badge bg-warning ms-1">Pendiente</span>` : ""}
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            ${
              !estaPagado && tienePermiso("Ventas", "Editar")
                ? `
              <button class="btn btn-outline-success" onclick="pagarServicio(${s.id})" title="Pagar servicio">
                <i class="fas fa-money-bill-wave"></i>
              </button>
            `
                : !estaPagado
                  ? ""
                  : `
              <button class="btn btn-outline-secondary" disabled title="Ya pagado">
                <i class="fas fa-check"></i>
              </button>
            `
            }
            ${
              s.id_venta
                ? `
              <button class="btn btn-outline-info" onclick="verVenta(${s.id_venta})" title="Ver venta">
                <i class="fas fa-eye"></i>
              </button>
            `
                : ""
            }
            ${
              tienePermiso("Ventas", "Eliminar")
                ? `<button class="btn btn-outline-danger" onclick="eliminarServicio(${s.id})" title="Eliminar">
              <i class="fas fa-times"></i>
            </button>`
                : ""
            }
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Estado de pago de un servicio (según los pagos de su venta)
function estadoPagoServicio(s) {
      let estadoPago = "Pendiente";
      let badgeColor = "bg-danger";
      let estaPagado = false;
      let saldoRestante = s.total || 0;

      if (s.id_venta) {
        const venta = (window.__ventasPorServicioMap || {})[s.id_venta];
        if (venta) {
          // Total de pagos de la venta
          const totalPagos = (venta.pagos || []).reduce(
            (sum, p) => sum + (p.monto || 0),
            0,
          );
          const saldoVenta = venta.total - totalPagos;

          // ✅ Si el saldo de la venta es 0, todo está pagado
          if (saldoVenta <= 0) {
            estadoPago = "Pagado";
            badgeColor = "bg-success";
            estaPagado = true;
            saldoRestante = 0;
          } else {
            // ✅ Si hay saldo, calcular cuánto del servicio está pendiente
            // Primero se pagan los productos (subtotal), luego los servicios
            const saldoProductos = (venta.subtotal || 0) - totalPagos;

            if (saldoProductos < 0) {
              // Parte de los pagos se aplicaron a servicios
              const pagoServicios = Math.abs(saldoProductos);
              if (pagoServicios >= s.total) {
                estadoPago = "Pagado";
                badgeColor = "bg-success";
                estaPagado = true;
                saldoRestante = 0;
              } else {
                saldoRestante = s.total - pagoServicios;
              }
            } else {
              // No se ha pagado ningún servicio
              saldoRestante = s.total;
            }
          }
        }
      }
  return { estadoPago, badgeColor, estaPagado, saldoRestante };
}

function _listaServiciosFiltrada() {
  const f = leerBarraFiltros("servicios");
  if (!rangoFechasValidoFiltro(f.desde, f.hasta)) return serviciosAdicionalesData;
  return (serviciosAdicionalesData || []).filter((s) => {
    if (f.Cliente && String(s.id_cliente) !== String(f.Cliente)) return false;
    if (f.Pago) {
      const pagado = estadoPagoServicio(s).estaPagado;
      if (f.Pago === "Pagado" ? !pagado : pagado) return false;
    }
    if (!coincideFechaFiltro(s.fecha, f.desde, f.hasta)) return false;
    return coincideTextoFiltro(
      f.texto,
      s.id,
      s.id_venta ? `#${s.id_venta}` : "independiente",
      s.tipo_servicio,
      s.descripcion,
    );
  });
}

function _renderServiciosPaginado(lista) {
  const inicio = paginaServicios * SERVICIOS_POR_PAGINA;
  const paginaActual = lista.slice(inicio, inicio + SERVICIOS_POR_PAGINA);
  const tbody = document.getElementById("serviciosTableBody");
  if (tbody) tbody.innerHTML = renderServiciosRows(paginaActual);

  const totalPaginas = Math.max(
    1,
    Math.ceil(lista.length / SERVICIOS_POR_PAGINA),
  );
  const contenedorPaginacion = document.getElementById(
    "serviciosPaginacionContainer",
  );
  if (contenedorPaginacion) {
    contenedorPaginacion.innerHTML = `
      <button class="btn btn-sm btn-outline-secondary" onclick="serviciosAnterior()" ${paginaServicios === 0 ? "disabled" : ""}>
        <i class="fas fa-chevron-left me-1"></i>Anterior
      </button>
      <small class="text-muted">Página ${paginaServicios + 1} de ${totalPaginas}</small>
      <button class="btn btn-sm btn-outline-secondary" onclick="serviciosSiguiente()" ${paginaServicios + 1 >= totalPaginas ? "disabled" : ""}>
        Siguiente<i class="fas fa-chevron-right ms-1"></i>
      </button>
    `;
  }
}

function filtrarServicios() {
  paginaServicios = 0; // el filtro cambió, regresamos a la primera página
  const lista = _listaServiciosFiltrada();
  _renderServiciosPaginado(lista);
  const conteo = document.getElementById("serviciosConteo");
  if (conteo) {
    const total = (serviciosAdicionalesData || []).length;
    conteo.textContent =
      lista.length === total
        ? `Total: ${total} servicios`
        : `Mostrando ${lista.length} de ${total} servicios`;
  }
}

function serviciosAnterior() {
  if (paginaServicios > 0) paginaServicios--;
  _renderServiciosPaginado(_listaServiciosFiltrada());
}

function serviciosSiguiente() {
  paginaServicios++;
  _renderServiciosPaginado(_listaServiciosFiltrada());
}

async function showCreateServicioModal() {
  const ventasParaSelect =
    (await api.request("/ventas?limit=100").catch(() => [])) || [];
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "servicioModal";
  modal.innerHTML = `
    <div class="modal-dialog modal-xl modal-dialog-scrollable modal-workspace modal-servicio">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Registrar Servicio Adicional</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="servicioForm" onsubmit="saveServicio(event)">
            <input type="hidden" id="servicioId" value="">
            
            <!-- ✅ BÚSQUEDA DE CLIENTE POR NIT O NOMBRE -->
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Buscar Cliente</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="servicioBuscarCliente" 
                          placeholder="Buscar por NIT o nombre del cliente" 
                          onkeyup="if(event.key === 'Enter') buscarClienteServicio()">
                    <button class="btn btn-outline-primary" type="button" onclick="buscarClienteServicio()">
                      <i class="fas fa-search"></i>
                    </button>
                    <button class="btn btn-outline-secondary" type="button" onclick="limpiarBusquedaClienteServicio()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div id="servicioClienteInfo" class="mt-1"></div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Cliente *</label>
                  <select class="form-select" id="servicioCliente" required>
                    <option value="">Seleccionar cliente</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- ✅ BÚSQUEDA DE VENTA -->
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Buscar Venta por ID</label>
                  <div class="input-group">
                    <input type="number" class="form-control" id="servicioBuscarVenta" 
                           placeholder="Ingresa ID de la venta" 
                           onkeyup="if(event.key === 'Enter') buscarVentaServicio()">
                    <button class="btn btn-outline-info" type="button" onclick="buscarVentaServicio()">
                      <i class="fas fa-search"></i>
                    </button>
                    <button class="btn btn-outline-secondary" type="button" onclick="limpiarBusquedaVentaServicio()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div id="servicioVentaInfo" class="mt-1"></div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Venta (opcional)</label>
                  <select class="form-select" id="servicioVenta">
                    <option value="">Sin venta</option>
                    ${ventasParaSelect
                      .map(
                        (v) => `
                      <option value="${v.id}">#${v.id} - ${(window.clientesData || []).find((c) => c.id === v.id_cliente)?.nombre || "Sin cliente"} - Q${(v.total || 0).toFixed(2)}</option>
                    `,
                      )
                      .join("")}
                  </select>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Tipo de Servicio *</label>
                  <select class="form-select" id="servicioTipo" required>
                    <option value="">Seleccionar tipo</option>
                    <option value="ForradoLibros">Forrado de Libros</option>
                    <option value="Impresion">Impresión</option>
                    <option value="Emplasticado">Emplasticado</option>
                    <option value="PagoImpuestos">Pago de Impuestos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <input type="text" class="form-control" id="servicioDescripcion" placeholder="Breve descripción">
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Monto Material</label>
                  <input type="number" class="form-control" id="servicioMaterial" value="0" step="0.01" min="0" oninput="calcularTotalServicio()">
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Monto Mano de Obra</label>
                  <input type="number" class="form-control" id="servicioManoObra" value="0" step="0.01" min="0" oninput="calcularTotalServicio()">
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Total</label>
                  <input type="text" class="form-control" id="servicioTotal" value="Q0.00" readonly style="font-weight:bold; font-size:1.1rem;">
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Detalles Adicionales</label>
                  <textarea class="form-control" id="servicioDetalles" rows="2" placeholder="Detalles del servicio"></textarea>
                </div>
              </div>
            </div>

          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-info" form="servicioForm">
            <i class="fas fa-save me-2"></i>Guardar Servicio
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  llenarSelectClientesServicio();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();

  modal.addEventListener("hidden.bs.modal", function () {
    this.remove();
  });
}

// ============================================================
// BUSCAR CLIENTE PARA SERVICIO (por NIT o nombre)
// ============================================================
function buscarClienteServicio() {
  const input = document.getElementById("servicioBuscarCliente");
  const busqueda = input.value.trim().toLowerCase();
  const infoDiv = document.getElementById("servicioClienteInfo");
  const selectCliente = document.getElementById("servicioCliente");

  if (!busqueda) {
    infoDiv.innerHTML = "";
    // Restaurar lista completa de clientes en el select
    llenarSelectClientesServicio();
    return;
  }

  // Buscar por NIT exacto o por coincidencia en nombre
  const clientes = window.clientesData || [];
  const clienteEncontrado = clientes.find(
    (c) =>
      (c.nit && c.nit === busqueda) ||
      (c.nombre && c.nombre.toLowerCase().includes(busqueda)),
  );

  if (clienteEncontrado) {
    infoDiv.innerHTML = `
      <div class="alert alert-success small py-1 px-2 mb-0">
        <i class="fas fa-check-circle me-1"></i>
        <strong>${clienteEncontrado.nombre}</strong>
        ${clienteEncontrado.telefono ? ` - ${clienteEncontrado.telefono}` : ""}
        ${clienteEncontrado.email ? ` - ${clienteEncontrado.email}` : ""}
        ${clienteEncontrado.nit ? ` - NIT: ${clienteEncontrado.nit}` : ""}
      </div>
    `;
    selectCliente.value = clienteEncontrado.id;
    showToast(`Cliente encontrado: ${clienteEncontrado.nombre}`, "success");
  } else {
    // Mostrar clientes que coinciden parcialmente
    const coincidencias = clientes.filter(
      (c) => c.nombre && c.nombre.toLowerCase().includes(busqueda),
    );

    if (coincidencias.length > 0) {
      let html = `
        <div class="alert alert-info small py-1 px-2 mb-0">
          <i class="fas fa-search me-1"></i>
          Clientes encontrados (${coincidencias.length}):
          <ul class="mb-0 mt-1">
      `;
      coincidencias.slice(0, 5).forEach((c) => {
        html += `<li><strong>${c.nombre}</strong> ${c.nit ? `- NIT: ${c.nit}` : ""}</li>`;
      });
      if (coincidencias.length > 5) {
        html += `<li class="text-muted">... y ${coincidencias.length - 5} más</li>`;
      }
      html += `</ul>
        </div>
      `;
      infoDiv.innerHTML = html;
      // No seleccionar automáticamente si hay múltiples coincidencias
      selectCliente.value = "";
    } else {
      infoDiv.innerHTML = `
        <div class="alert alert-warning small py-1 px-2 mb-0">
          <i class="fas fa-exclamation-triangle me-1"></i>
          No se encontró cliente con: "${busqueda}"
        </div>
      `;
      selectCliente.value = "";
    }
  }
}

function limpiarBusquedaClienteServicio() {
  document.getElementById("servicioBuscarCliente").value = "";
  document.getElementById("servicioClienteInfo").innerHTML = "";
  // Restaurar lista completa
  llenarSelectClientesServicio();
}

// ============================================================
// LLENAR SELECT DE CLIENTES PARA SERVICIO
// ============================================================
function llenarSelectClientesServicio() {
  const select = document.getElementById("servicioCliente");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar cliente</option>';
  (window.clientesData || []).forEach((c) => {
    const estado = c.activo !== 0 ? "" : " (Inactivo)";
    select.innerHTML += `<option value="${c.id}" ${c.activo !== 0 ? "" : "disabled"}>${c.nombre}${estado}</option>`;
  });
}

// ============================================================
// BUSCAR VENTA PARA SERVICIO
// ============================================================
async function buscarVentaServicio() {
  const input = document.getElementById("servicioBuscarVenta");
  const id = parseInt(input.value.trim());
  const infoDiv = document.getElementById("servicioVentaInfo");
  const selectVenta = document.getElementById("servicioVenta");

  if (!id) {
    infoDiv.innerHTML = "";
    return;
  }

  try {
    const venta = await api.getVenta(id);
    if (venta) {
      const cliente = (window.clientesData || []).find(
        (c) => c.id === venta.id_cliente,
      );
      const nombreCliente = cliente ? cliente.nombre : "Sin cliente";
      infoDiv.innerHTML = `
        <div class="alert alert-success small py-1 px-2 mb-0">
          <i class="fas fa-check-circle me-1"></i>
          Venta #${venta.id} - ${nombreCliente} - Total: Q${(venta.total || 0).toFixed(2)}
          ${venta.estado ? ` - ${venta.estado}` : ""}
        </div>
      `;
      selectVenta.value = venta.id;
      showToast(`Venta #${venta.id} encontrada`, "success");
    }
  } catch (error) {
    infoDiv.innerHTML = `
      <div class="alert alert-warning small py-1 px-2 mb-0">
        <i class="fas fa-exclamation-triangle me-1"></i>
        No se encontró venta con ID: ${id}
      </div>
    `;
    selectVenta.value = "";
  }
}

function limpiarBusquedaVentaServicio() {
  document.getElementById("servicioBuscarVenta").value = "";
  document.getElementById("servicioVentaInfo").innerHTML = "";
  document.getElementById("servicioVenta").value = "";
}

function calcularTotalServicio() {
  const material =
    parseFloat(document.getElementById("servicioMaterial").value) || 0;
  const manoObra =
    parseFloat(document.getElementById("servicioManoObra").value) || 0;
  const total = material + manoObra;
  document.getElementById("servicioTotal").value = `Q${total.toFixed(2)}`;
}

async function saveServicio(event) {
  event.preventDefault();

  const id_cliente = parseInt(document.getElementById("servicioCliente").value);
  const id_venta =
    parseInt(document.getElementById("servicioVenta").value) || null;
  const tipo_servicio = document.getElementById("servicioTipo").value;
  const descripcion =
    document.getElementById("servicioDescripcion").value || null;
  const monto_material =
    parseFloat(document.getElementById("servicioMaterial").value) || 0;
  const monto_mano_obra =
    parseFloat(document.getElementById("servicioManoObra").value) || 0;
  const detalles = document.getElementById("servicioDetalles").value || null;

  if (!id_cliente) {
    showToast("Selecciona un cliente", "error");
    return;
  }

  if (!tipo_servicio) {
    showToast("Selecciona un tipo de servicio", "error");
    return;
  }

  const total = monto_material + monto_mano_obra;

  const data = {
    id_cliente,
    id_venta,
    tipo_servicio,
    descripcion,
    monto_material: monto_material,
    monto_mano_obra: monto_mano_obra,
    detalles: detalles
      ? [{ material: detalles, cantidad: 1, costo_unitario: 0 }]
      : [],
  };

  try {
    const result = await api.request("/servicios-adicionales", "POST", data);
    showToast(`Servicio #${result.id} creado correctamente`, "success");

    // ACTUALIZAR EL TOTAL DE LA VENTA
    if (id_venta) {
      try {
        // 1. Obtener la venta actual
        const venta = await api.getVenta(id_venta);
        console.log("📦 Venta actual:", venta);

        // 2. Obtener TODOS los servicios de la venta
        const serviciosVenta = await api.request(
          `/servicios-adicionales?id_venta=${id_venta}`,
        );
        console.log("📦 Servicios de la venta:", serviciosVenta);

        // 3. Calcular total de servicios
        const totalServicios = serviciosVenta.reduce(
          (sum, s) => sum + (s.total || 0),
          0,
        );

        // 4. NUEVO TOTAL = subtotal (productos) + total de servicios
        const nuevoTotal = (venta.subtotal || 0) + totalServicios;
        console.log(`📦 Nuevo total: ${nuevoTotal}`);

        // 5. Actualizar la venta
        await api.request(`/ventas/${id_venta}`, "PUT", {
          total: nuevoTotal,
        });

        // 6. Refrescar la tabla de ventas visible (respeta filtros y página actuales)
        await cargarVentasTabla();

        // 7. Refrescar también el caché de ventas que usan los servicios
        const ventaActualizada = await api.getVenta(id_venta).catch(() => null);
        if (ventaActualizada && window.__ventasPorServicioMap) {
          window.__ventasPorServicioMap[id_venta] = ventaActualizada;
        }

        showToast(
          `Venta #${id_venta} actualizada. Nuevo total: Q${nuevoTotal.toFixed(2)}`,
          "success",
        );
      } catch (error) {
        console.error("❌ Error actualizando total de venta:", error);
        showToast("Error al actualizar el total de la venta", "error");
      }
    }

    // Si NO tiene venta asociada, mostrar opción de pago
    if (!id_venta) {
      const confirmarPago = await mostrarConfirmacion(
        "Pago del Servicio",
        `El servicio #${result.id} tiene un total de Q${total.toFixed(2)}.\n¿Deseas registrar el pago ahora?`,
      );
      if (confirmarPago) {
        await pagarServicioIndependiente(result.id);
      }
    }

    bootstrap.Modal.getInstance(
      document.getElementById("servicioModal"),
    ).hide();

    // Recargar servicios y ventas
    await loadVentasModule();
  } catch (error) {
    console.error("❌ Error al guardar servicio:", error);
    showToast(error.message || "Error al guardar servicio", "error");
  }
}

async function eliminarServicio(id) {
  const confirmado = await mostrarConfirmacion(
    "Eliminar Servicio",
    "¿Estás seguro de eliminar este servicio?",
    "Eliminar",
  );
  if (!confirmado) return;
  try {
    await api.request(`/servicios-adicionales/${id}`, "DELETE");
    showToast("Servicio eliminado correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al eliminar servicio", "error");
  }
}

// ============================================================
// PAGAR SERVICIO (desde la pestaña de servicios)
// ============================================================
async function pagarServicio(idServicio) {
  try {
    const servicio = serviciosAdicionalesData.find((s) => s.id === idServicio);
    if (!servicio) {
      showToast("Servicio no encontrado", "error");
      return;
    }

    // Si el servicio tiene venta asociada, abrir pago de la venta
    if (servicio.id_venta) {
      const venta =
        (window.__ventasPorServicioMap || {})[servicio.id_venta] ||
        (await api.getVenta(servicio.id_venta).catch(() => null));
      if (venta) {
        // Verificar si la venta ya está pagada
        const totalPagos = (venta.pagos || []).reduce(
          (sum, p) => sum + (p.monto || 0),
          0,
        );
        if (totalPagos >= venta.total) {
          showToast(
            "Este servicio ya está pagado a través de la venta",
            "warning",
          );
          return;
        }
        mostrarModalPago(servicio.id_venta);
        showToast(
          "El pago del servicio se registrará en la venta asociada",
          "info",
        );
        return;
      }
    }

    // Servicio independiente - crear venta express
    const id_usuario = getCurrentUser()?.id || 1;

    // Obtener ubicación de configuración
    let id_ubicacion = null;
    try {
      const config = await api.request("/configuracion").catch(() => ({}));
      id_ubicacion = config.id_ubicacion || null;
      if (!id_ubicacion) {
        showToast("No hay ubicación configurada", "error");
        return;
      }
    } catch (error) {
      showToast("Error al obtener configuración", "error");
      return;
    }

    // Crear venta para el servicio
    const ventaData = {
      id_usuario: id_usuario,
      id_cliente: servicio.id_cliente,
      id_caja_turno: null,
      id_ubicacion: id_ubicacion,
      id_cotizacion: null,
      descuento_porcentaje: 0,
      observaciones: `Servicio: ${servicio.tipo_servicio}`,
      nit: null,
      detalles: [],
      pagos: [],
    };

    const result = await api.createVenta(ventaData);
    showToast(`Venta #${result.id} creada para el servicio`, "success");

    // Actualizar el servicio con el id_venta
    await api.request(`/servicios-adicionales/${idServicio}`, "PATCH", {
      id_venta: result.id,
    });

    // Actualizar el total de la venta con el monto del servicio
    await api.request(`/ventas/${result.id}`, "PATCH", {
      total: servicio.total,
      subtotal: 0,
    });

    // Mostrar modal de pago para la venta
    mostrarModalPago(result.id);

    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al procesar pago", "error");
  }
}

// ============================================================
// PAGAR SERVICIO INDEPENDIENTE
// ============================================================
async function pagarServicioIndependiente(idServicio) {
  try {
    const servicio = serviciosAdicionalesData.find((s) => s.id === idServicio);
    if (!servicio) {
      showToast("Servicio no encontrado", "error");
      return;
    }

    // Crear una venta express para el servicio
    const id_usuario = getCurrentUser()?.id || 1;

    // Obtener ubicación de configuración
    let id_ubicacion = null;
    try {
      const config = await api.request("/configuracion").catch(() => ({}));
      id_ubicacion = config.id_ubicacion || null;
      if (!id_ubicacion) {
        showToast("No hay ubicación configurada", "error");
        return;
      }
    } catch (error) {
      showToast("Error al obtener configuración", "error");
      return;
    }

    // Crear venta para el servicio
    const ventaData = {
      id_usuario: id_usuario,
      id_cliente: servicio.id_cliente,
      id_caja_turno: null,
      id_ubicacion: id_ubicacion,
      id_cotizacion: null,
      descuento_porcentaje: 0,
      observaciones: `Servicio: ${servicio.tipo_servicio}`,
      nit: null,
      detalles: [],
      pagos: [],
    };

    const result = await api.createVenta(ventaData);
    showToast(`Venta #${result.id} creada para el servicio`, "success");

    // Actualizar el servicio con el id_venta
    await api.request(`/servicios-adicionales/${idServicio}`, "PATCH", {
      id_venta: result.id,
    });

    // Actualizar el total de la venta con el monto del servicio
    await api.request(`/ventas/${result.id}`, "PATCH", {
      total: servicio.total,
      subtotal: 0,
    });

    // Mostrar modal de pago para la venta
    mostrarModalPago(result.id);

    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al procesar pago", "error");
  }
}

// ============================================================
// CREAR TIPO DE PAGO - COMPRAS
// ============================================================
function showCreateTipoPagoModal() {
  // Redirigir al módulo de compras
  showToast(
    "Ve al módulo de Compras > Tipos de Pago para crear uno nuevo",
    "info",
  );
  // O abrir el modal de tipos de pago
  if (typeof loadComprasModule === "function") {
    loadComprasModule();
    // Cambiar a la pestaña de tipos de pago
    setTimeout(() => {
      const tab = document.querySelector(
        '#comprasTabs button[data-bs-target="#panel-tipos-pago"]',
      );
      if (tab) {
        const tabInstance = new bootstrap.Tab(tab);
        tabInstance.show();
      }
    }, 500);
  }
}

// Exponer globalmente

// ============================================================
// PESTAÑA: VENDEDORES
// ============================================================
async function cargarSubVendedores() {
  const container = document.getElementById("vendedoresSubContainer");
  if (!container) return;

  try {
    const f = leerBarraFiltros("vendedores");
    if (!rangoFechasValidoFiltro(f.desde, f.hasta)) return;
    const usuarios = await api.getUsuarios().catch(() => []);
    const empleados = await api.getEmpleados().catch(() => []);

    // Cantidad y monto de ventas por vendedor (en el rango de fechas elegido)
    const conteoVentasPorVendedor = {};
    const montoVentasPorVendedor = {};
    try {
      let url = "/ventas/conteo?agrupar_por=vendedor";
      if (f.desde) url += `&fecha_desde=${f.desde}`;
      if (f.hasta) url += `&fecha_hasta=${f.hasta}`;
      const conteos = (await api.request(url).catch(() => [])) || [];
      conteos.forEach((c) => {
        conteoVentasPorVendedor[c.id] = c.total;
        montoVentasPorVendedor[c.id] = c.monto || 0;
      });
    } catch (e) {}

    const empleadosMap = {};
    empleados.forEach((e) => {
      empleadosMap[e.id] = e;
    });

    // Antes solo se mostraban los usuarios con id_rol === 3 (fijo en el
    // código) y que tuvieran empleado; si el rol "Vendedor" tenía otro id,
    // la pestaña salía vacía. Ahora se muestran todos los usuarios con su
    // rol, y primero los que más ventas tienen.
    const roles = await api.getRoles().catch(() => []);
    const rolesMap = {};
    (roles || []).forEach((r) => {
      rolesMap[r.id] = r.nombre;
    });

    const resultado = (usuarios || [])
      .map((u) => {
        const empleado = empleadosMap[u.id_empleado] || {};
        return {
          id_usuario: u.id,
          nombre: empleado.nombre || u.nombre_usuario,
          nombre_usuario: u.nombre_usuario,
          email: empleado.email,
          telefono: empleado.telefono,
          rol: rolesMap[u.id_rol] || "--",
          activo: u.activo,
          ventas: conteoVentasPorVendedor[u.id] || 0,
          monto: montoVentasPorVendedor[u.id] || 0,
        };
      })
      .sort((a, b) => b.ventas - a.ventas);

    if (!resultado || resultado.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-user-tie fa-3x text-muted mb-3"></i>
          <p class="text-muted">No hay vendedores registrados</p>
          <button class="btn btn-info btn-sm" onclick="window.app.loadModule('usuarios')">
            <i class="fas fa-plus me-2"></i>Ir a Usuarios
          </button>
        </div>
      `;
      return;
    }

    window.__vendedoresLista = resultado;
    window.__claveVendedores = `${f.desde}|${f.hasta}`;

    // La barra se dibuja una sola vez (así no se pierde lo que se escribe)
    if (!document.getElementById("vendedoresBarraFiltros")) {
      const rolesUnicos = [...new Set(resultado.map((v) => v.rol))].filter(
        (r) => r && r !== "--",
      );
      container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">Listado de Vendedores</h6>
          <span class="badge bg-info" id="vendedoresBadge"></span>
        </div>
        ${htmlBarraFiltros({
          id: "vendedores",
          placeholder: "Buscar por nombre, usuario, email o teléfono...",
          selects: [
            { id: "Rol", label: "Todos los roles", opciones: rolesUnicos.map((r) => [r, r]) },
            { id: "Estado", label: "Activos e inactivos", opciones: [["1", "Activos"], ["0", "Inactivos"]] },
          ],
          fechas: true,
          onChange: "filtrarVendedores()",
        })}
        <div class="form-text mb-2">El rango de fechas aplica a la cantidad y el monto de ventas.</div>
        <div id="vendedoresResultados"></div>
      `;
    }
    renderVendedoresTabla();
  } catch (error) {
    console.error("❌ Error cargando vendedores:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al cargar vendedores: ${error.message}</div>`;
  }
}

function filtrarVendedores() {
  const f = leerBarraFiltros("vendedores");
  // Si cambiaron las fechas hay que volver a contar las ventas
  if (`${f.desde}|${f.hasta}` !== window.__claveVendedores) {
    cargarSubVendedores();
    return;
  }
  renderVendedoresTabla();
}

function renderVendedoresTabla() {
  const destino = document.getElementById("vendedoresResultados");
  if (!destino) return;
  const f = leerBarraFiltros("vendedores");
  const todos = window.__vendedoresLista || [];
  const lista = todos.filter((v) => {
    if (f.Rol && v.rol !== f.Rol) return false;
    const activo = v.activo !== 0;
    if (f.Estado === "1" && !activo) return false;
    if (f.Estado === "0" && activo) return false;
    return coincideTextoFiltro(f.texto, v.nombre, v.nombre_usuario, v.email, v.telefono, v.rol);
  });
  const badge = document.getElementById("vendedoresBadge");
  if (badge) badge.textContent = `${todos.length} vendedores`;

  let html = `
      <div class="table-responsive">
        <table class="table table-hover table-striped">
          <thead class="table-light">
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Ventas</th>
              <th>Monto vendido</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

  if (lista.length === 0) {
    html += `<tr><td colspan="8" class="text-center text-muted">No hay vendedores que coincidan con el filtro</td></tr>`;
  }
  lista.forEach((v) => {
    const activo = v.activo !== 0;
    html += `
        <tr>
          <td><strong>${escaparHtmlEscaner(v.nombre || "--")}</strong></td>
          <td>${escaparHtmlEscaner(v.nombre_usuario || "--")}</td>
          <td>${escaparHtmlEscaner(v.rol)}</td>
          <td>${escaparHtmlEscaner(v.email || "Sin email")}</td>
          <td>${escaparHtmlEscaner(v.telefono || "Sin teléfono")}</td>
          <td><span class="badge bg-warning">${v.ventas}</span></td>
          <td>Q${Number(v.monto || 0).toFixed(2)}</td>
          <td>
            <span class="badge ${activo ? "bg-success" : "bg-danger"}">
              ${activo ? "Activo" : "Inactivo"}
            </span>
          </td>
        </tr>
      `;
  });

  html += `
          </tbody>
        </table>
      </div>
      <div class="text-end">
        <small class="text-muted">${lista.length === todos.length ? `Total: ${todos.length} vendedores` : `Mostrando ${lista.length} de ${todos.length} vendedores`}</small>
      </div>
    `;
  destino.innerHTML = html;
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// ============================================================
// CARGAR VENDEDORES CON TURNO ABIERTO
// ============================================================
async function cargarVendedoresConTurno() {
  try {
    const turnos = await api.getCajaTurnos().catch(() => []);
    const abiertos = turnos.filter((t) => t.estado === "Abierto");

    if (abiertos.length === 0) {
      return [];
    }

    // Obtener usuarios de los turnos abiertos
    const usuarios = await api.getUsuarios().catch(() => []);
    const usuariosMap = {};
    usuarios.forEach((u) => {
      usuariosMap[u.id] = u;
    });

    const vendedores = abiertos.map((t) => {
      const user = usuariosMap[t.id_usuario];
      return {
        id_usuario: t.id_usuario,
        nombre: user ? user.nombre_usuario : `Usuario ${t.id_usuario}`,
        turno_id: t.id,
        id_empleado: user ? user.id_empleado : null,
      };
    });

    return vendedores;
  } catch (error) {
    console.error("Error cargando vendedores con turno:", error);
    return [];
  }
}

// ============================================================
// PESTAÑA: CAJA
// ============================================================
async function cargarSubCajaBasico(container) {
  // Si no se pasa container, usar el del DOM
  if (!container) {
    container = document.getElementById("cajaSubContainer");
  }
  if (!container) return;

  try {
    const [turnos, tiposPago] = await Promise.all([
      api.getCajaTurnos().catch(() => []),
      api.getTiposPago().catch(() => []),
    ]);

    window.turnosActivos = turnos.filter((t) => t.estado === "Abierto");
    window.tiposPagoData = tiposPago;

    let html = `
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <i class="fas fa-cash-register me-2"></i>Tipos de Pago (Ventas)
            </div>
            <div class="card-body">
              ${
                tiposPago.filter((t) => t.para_ventas === 1).length === 0
                  ? '<p class="text-muted">No hay tipos de pago configurados para ventas</p>'
                  : tiposPago
                      .filter((t) => t.para_ventas === 1)
                      .map(
                        (t) =>
                          `<span class="badge bg-primary me-1 mb-1">${t.nombre}</span>`,
                      )
                      .join("")
              }
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header bg-success text-white">
              <i class="fas fa-users me-2"></i>Turnos Activos
            </div>
            <div class="card-body">
              ${
                window.turnosActivos.length === 0
                  ? '<p class="text-muted">No hay turnos activos</p>'
                  : window.turnosActivos
                      .map(
                        (t) =>
                          `<div class="d-flex justify-content-between align-items-center border-bottom py-1">
                    <span>Turno #${t.id}</span>
                    <span class="badge bg-success">Abierto</span>
                  </div>`,
                      )
                      .join("")
              }
            </div>
          </div>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-warning">
              <i class="fas fa-info-circle me-2"></i>Gestión de Caja
            </div>
            <div class="card-body text-center">
              <p class="text-muted">Para gestionar gastos y caja chica, usa el módulo Caja desde el menú principal.</p>
              <button class="btn btn-primary" onclick="window.app?.loadModule('caja')">
                <i class="fas fa-arrow-right me-2"></i>Ir a Caja
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    return {
      turnos: window.turnosActivos,
      tiposPago: window.tiposPagoData,
      ubicaciones: window.ubicacionesData,
    };
  } catch (error) {
    console.error("Error cargando datos de caja:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al cargar caja: ${error.message}</div>`;
    return { turnos: [], tiposPago: [], ubicaciones: [] };
  }
}

async function verFichaProducto(idProducto) {
  if (!idProducto) {
    showToast("Producto no especificado", "warning");
    return;
  }

  try {
    const producto = (window.productosData || []).find(
      (p) => p.id === idProducto,
    );
    if (!producto) {
      showToast("Producto no encontrado", "error");
      return;
    }

    let vecesVendido = 0;
    let cantidadTotal = 0;
    try {
      const stats = await api
        .request(`/ventas/estadisticas-producto/${idProducto}`)
        .catch(() => null);
      if (stats) {
        vecesVendido = stats.veces_vendido || 0;
        cantidadTotal = stats.cantidad_total || 0;
      }
    } catch (e) {}

    const modalContent = `
      <div class="modal-header">
        <h5 class="modal-title">Ficha del Producto</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="row">
          <div class="col-md-6">
            <p><strong>Código:</strong> ${producto.codigo || "--"}</p>
            <p><strong>Nombre:</strong> ${producto.nombre || "--"}</p>
            <p><strong>Descripción:</strong> ${producto.descripcion || "--"}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Precio Venta:</strong> Q${(producto.precio_venta || 0).toFixed(2)}</p>
            <p><strong>Stock Actual:</strong> ${producto.stock_actual || 0}</p>
            <p><strong>Stock Mínimo:</strong> ${producto.stock_minimo || 0}</p>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col-md-6">
            <div class="card bg-info bg-opacity-10">
              <div class="card-body text-center">
                <h5 class="text-info">${vecesVendido}</h5>
                <small class="text-muted">Veces vendido</small>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-success bg-opacity-10">
              <div class="card-body text-center">
                <h5 class="text-success">${cantidadTotal}</h5>
                <small class="text-muted">Unidades vendidas</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>
    `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "productoFichaModal";
    modalDiv.innerHTML = `<div class="modal-dialog"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al cargar ficha del producto", "error");
  }
}

// ============================================================
// CREAR TIPO DE PAGO DESDE VENTAS
// ============================================================
function showCrearTipoPagoModal() {
  // Se usa el formulario único de tipos de pago (valida nombres repetidos)
  if (typeof showCreateTipoPagoCompraModal === "function") {
    return showCreateTipoPagoCompraModal({ ventas: 1, compras: 0 });
  }
  // Verificar si ya existe el modal en el DOM
  let modal = document.getElementById("tipoPagoModal");

  // Si no existe, crearlo dinámicamente
  if (!modal) {
    const html = `
      <div class="modal fade" id="tipoPagoModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fas fa-credit-card me-2"></i>Nuevo Tipo de Pago
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="tipoPagoForm">
                <div class="mb-3">
                  <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="tipoPagoNombre" required placeholder="Ej: Efectivo, Tarjeta, Cheque" />
                </div>
                <div class="row">
                  <div class="col-6 mb-3">
                    <label class="form-label fw-bold">¿Para Ventas?</label>
                    <select class="form-select" id="tipoPagoVentas">
                      <option value="1">Sí</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label fw-bold">¿Para Compras?</label>
                    <select class="form-select" id="tipoPagoCompras">
                      <option value="1">Sí</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-100">Guardar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    // Asignar evento al formulario
    document
      .getElementById("tipoPagoForm")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        saveTipoPagoDesdeVentas();
      });
  }

  // Mostrar el modal
  const modalInstance = new bootstrap.Modal(
    document.getElementById("tipoPagoModal"),
  );
  modalInstance.show();
}

// ============================================================
// GUARDAR TIPO DE PAGO DESDE VENTAS
// ============================================================
async function saveTipoPagoDesdeVentas() {
  const nombre = document.getElementById("tipoPagoNombre").value.trim();
  const para_ventas = parseInt(document.getElementById("tipoPagoVentas").value);
  const para_compras = parseInt(
    document.getElementById("tipoPagoCompras").value,
  );

  if (!nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    const result = await api.request("/tipos-pago", "POST", {
      nombre,
      para_ventas,
      para_compras,
    });

    showToast(`Tipo de pago "${nombre}" creado correctamente`, "success");

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("tipoPagoModal"),
    );
    if (modal) modal.hide();

    // Recargar datos
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al crear tipo de pago", "error");
  }
}

// ============================================================
// CARGA MASIVA DE VENTAS DESDE EXCEL
// ============================================================
let cargaMasivaFilas = []; // filas parseadas del Excel
let cargaMasivaVentasAgrupadas = []; // ventas agrupadas listas para crear

function showCargaMasivaVentasModal() {
  let modal = document.getElementById("cargaMasivaVentasModal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "cargaMasivaVentasModal";
  modal.setAttribute("tabindex", "-1");
  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="fas fa-file-upload me-2"></i>Carga Masiva de Ventas
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">

          <div class="alert alert-info small">
            <strong>Formato esperado del archivo (fila de encabezados obligatoria):</strong>
            <code>NIT_Cliente | Codigo_Producto | Cantidad | Descuento_Porcentaje | Observaciones</code>
            <br>
            Las filas con el <strong>mismo NIT + Observaciones</strong> se agrupan en una sola venta.
            Si el NIT no existe se usará el "Cliente por defecto"; si tampoco hay, la venta queda sin cliente.
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-primary" onclick="descargarPlantillaVentas()">
                <i class="fas fa-download me-1"></i>Descargar plantilla
              </button>
            </div>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-md-4">
              <label class="form-label fw-bold">Turno de Caja *</label>
              <select class="form-select" id="cmCajaTurno">
                <option value="">Seleccionar turno</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-bold">Vendedor *</label>
              <select class="form-select" id="cmVendedor">
                <option value="">Cargando vendedores...</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-bold">Cliente por defecto (opcional)</label>
              <select class="form-select" id="cmClienteDefault">
                <option value="">Sin cliente</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Archivo Excel / CSV *</label>
            <input type="file" class="form-control" id="cmArchivo"
                   accept=".xlsx,.xls,.csv" onchange="procesarArchivoVentasMasivas(event)">
          </div>

          <div id="cmResumen" class="mb-2"></div>
          <div id="cmPreview" class="table-responsive" style="max-height:400px; overflow:auto;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button class="btn btn-primary" id="cmBtnConfirmar" disabled onclick="confirmarCargaMasivaVentas()">
            <i class="fas fa-check me-1"></i>Confirmar y Crear Ventas
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const instance = new bootstrap.Modal(modal);
  instance.show();

  // Llenar selects
  llenarSelectCajaTurnoCM();
  llenarSelectVendedoresCM();
  llenarSelectClienteDefaultCM();

  modal.addEventListener("hidden.bs.modal", function () {
    this.remove();
  });
}

function llenarSelectCajaTurnoCM() {
  const select = document.getElementById("cmCajaTurno");
  if (!select) return;
  const abiertos = (cajaTurnosData || []).filter((t) => t.estado === "Abierto");
  select.innerHTML = '<option value="">Seleccionar turno</option>';
  if (abiertos.length === 0) {
    select.innerHTML = '<option value="">No hay turnos abiertos</option>';
    return;
  }
  abiertos.forEach((t) => {
    select.innerHTML += `<option value="${t.id}">Turno #${t.id} - Usuario: ${t.id_usuario || "--"}</option>`;
  });
  if (abiertos.length === 1) select.value = abiertos[0].id;
}

async function llenarSelectVendedoresCM() {
  const select = document.getElementById("cmVendedor");
  if (!select) return;
  const vendedores = await cargarVendedoresConTurno();
  select.innerHTML = '<option value="">Seleccionar vendedor</option>';
  if (vendedores.length === 0) {
    select.innerHTML =
      '<option value="">No hay vendedores con turno abierto</option>';
    return;
  }
  vendedores.forEach((v) => {
    select.innerHTML += `<option value="${v.id_usuario}">${v.nombre}</option>`;
  });
  if (vendedores.length === 1) select.value = vendedores[0].id_usuario;
}

function llenarSelectClienteDefaultCM() {
  const select = document.getElementById("cmClienteDefault");
  if (!select) return;
  select.innerHTML = '<option value="">Sin cliente</option>';
  (window.clientesData || []).forEach((c) => {
    const est = c.activo !== 0 ? "" : " (Inactivo)";
    select.innerHTML += `<option value="${c.id}">${c.nombre}${est}</option>`;
  });
}

function descargarPlantillaVentas() {
  const data = [
    {
      NIT_Cliente: "CF",
      Codigo_Producto: "PROD-001",
      Cantidad: 2,
      Descuento_Porcentaje: 0,
      Observaciones: "Venta mostrador",
    },
    {
      NIT_Cliente: "CF",
      Codigo_Producto: "PROD-002",
      Cantidad: 1,
      Descuento_Porcentaje: 5,
      Observaciones: "Venta mostrador",
    },
    {
      NIT_Cliente: "12345678",
      Codigo_Producto: "PROD-003",
      Cantidad: 3,
      Descuento_Porcentaje: 0,
      Observaciones: "Cliente frecuente",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PlantillaVentas");
  descargarExcelConColores(wb, "Plantilla_Carga_Masiva_Ventas.xlsx", {
    obligatorias: ["Codigo_Producto", "Cantidad"],
  });
  showToast("Plantilla descargada", "success");
}

// ============================================================
// PROCESAR ARCHIVO
// ============================================================
function procesarArchivoVentasMasivas(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

      if (!rows || rows.length === 0) {
        showToast("El archivo está vacío", "warning");
        return;
      }

      cargaMasivaFilas = rows;
      validarYPrevisualizarVentasMasivas();
    } catch (err) {
      console.error(err);
      showToast("Error al leer el archivo: " + err.message, "error");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ============================================================
// VALIDACIÓN Y PREVISUALIZACIÓN
// ============================================================
function validarYPrevisualizarVentasMasivas() {
  const productos = window.productosData || [];
  const clientes = window.clientesData || [];
  const clienteDefaultId =
    parseInt(document.getElementById("cmClienteDefault").value) || null;

  const errores = [];
  const filasValidas = [];

  cargaMasivaFilas.forEach((row, idx) => {
    const numFila = idx + 2; // +2: fila 1 es encabezado
    const nitRaw = String(row.NIT_Cliente || "").trim();
    const codigo = String(row.Codigo_Producto || "").trim();
    const cantidad = parseFloat(row.Cantidad);
    const descuento = parseFloat(row.Descuento_Porcentaje) || 0;
    const observaciones = String(row.Observaciones || "").trim();

    if (!codigo) {
      errores.push(`Fila ${numFila}: falta Codigo_Producto`);
      return;
    }
    if (!cantidad || cantidad <= 0) {
      errores.push(`Fila ${numFila}: Cantidad inválida (${row.Cantidad})`);
      return;
    }
    if (descuento < 0 || descuento > 100) {
      errores.push(`Fila ${numFila}: Descuento fuera de rango (0-100)`);
      return;
    }

    const producto = productos.find((p) => p.codigo === codigo);
    if (!producto) {
      errores.push(`Fila ${numFila}: producto "${codigo}" no encontrado`);
      return;
    }

    // Resolver cliente
    let idCliente = null;
    let nitCliente = null;
    if (nitRaw && nitRaw.toUpperCase() !== "CF") {
      const cliente = clientes.find((c) => c.nit === nitRaw);
      if (cliente) {
        idCliente = cliente.id;
        nitCliente = cliente.nit;
      } else if (clienteDefaultId) {
        idCliente = clienteDefaultId;
        const cdef = clientes.find((c) => c.id === clienteDefaultId);
        nitCliente = cdef ? cdef.nit : null;
      } else {
        // Sin coincidencia y sin default: se permite sin cliente (CF)
        idCliente = null;
        nitCliente = null;
      }
    } else if (clienteDefaultId) {
      idCliente = clienteDefaultId;
      const cdef = clientes.find((c) => c.id === clienteDefaultId);
      nitCliente = cdef ? cdef.nit : null;
    }

    filasValidas.push({
      numFila,
      nitRaw: nitRaw || "CF",
      nitCliente,
      idCliente,
      codigo,
      producto,
      cantidad,
      descuento,
      observaciones,
    });
  });

  // Agrupar por (nitRaw + observaciones)
  const grupos = {};
  filasValidas.forEach((f) => {
    const key = `${f.nitRaw}||${f.observaciones}`;
    if (!grupos[key]) {
      grupos[key] = {
        nitRaw: f.nitRaw,
        idCliente: f.idCliente,
        nitCliente: f.nitCliente,
        observaciones: f.observaciones,
        descuento: f.descuento,
        items: [],
      };
    }
    grupos[key].items.push(f);
  });

  cargaMasivaVentasAgrupadas = Object.values(grupos);

  // Render previsualización
  renderPreviewVentasMasivas(errores, cargaMasivaVentasAgrupadas);

  const btn = document.getElementById("cmBtnConfirmar");
  if (btn)
    btn.disabled =
      errores.length > 0 || cargaMasivaVentasAgrupadas.length === 0;
}

function renderPreviewVentasMasivas(errores, grupos) {
  const resumen = document.getElementById("cmResumen");
  const preview = document.getElementById("cmPreview");

  let totalGeneral = 0;
  grupos.forEach((g) => {
    let sub = 0;
    g.items.forEach((it) => {
      sub += it.cantidad * (it.producto.precio_venta || 0);
    });
    g.subtotal = sub;
    g.total = sub - (sub * (g.descuento || 0)) / 100;
    totalGeneral += g.total;
  });

  resumen.innerHTML = `
    <div class="row g-2">
      <div class="col-md-3">
        <div class="alert alert-${errores.length ? "warning" : "success"} py-2 mb-0">
          <strong>${grupos.length}</strong> ventas válidas
        </div>
      </div>
      <div class="col-md-3">
        <div class="alert alert-${errores.length ? "danger" : "secondary"} py-2 mb-0">
          <strong>${errores.length}</strong> errores
        </div>
      </div>
      <div class="col-md-3">
        <div class="alert alert-info py-2 mb-0">
          Total: <strong>Q${totalGeneral.toFixed(2)}</strong>
        </div>
      </div>
    </div>
    ${
      errores.length
        ? `
      <div class="alert alert-danger small mt-2 mb-0" style="max-height:150px; overflow:auto;">
        <strong>Errores detectados (corrige el archivo y vuelve a cargarlo):</strong>
        <ul class="mb-0">${errores.map((e) => `<li>${e}</li>`).join("")}</ul>
      </div>`
        : ""
    }
  `;

  if (grupos.length === 0) {
    preview.innerHTML =
      '<p class="text-muted text-center">Sin datos para previsualizar</p>';
    return;
  }

  let html = `
    <table class="table table-sm table-striped">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Productos</th>
          <th>Descuento</th>
          <th>Total</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
  `;
  grupos.forEach((g, i) => {
    const clienteMostrar = g.idCliente
      ? window.clientesData.find((c) => c.id === g.idCliente)?.nombre ||
        `#${g.idCliente}`
      : "Sin cliente (CF)";
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${clienteMostrar}</td>
        <td>
          <ul class="mb-0 ps-3">
            ${g.items.map((it) => `<li>${it.producto.codigo} - ${it.producto.nombre} x ${it.cantidad}</li>`).join("")}
          </ul>
        </td>
        <td>${g.descuento}%</td>
        <td><strong>Q${g.total.toFixed(2)}</strong></td>
        <td>${g.observaciones || "--"}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  preview.innerHTML = html;
}

// ============================================================
// CONFIRMAR CARGA MASIVA
// ============================================================
async function confirmarCargaMasivaVentas() {
  const id_caja_turno = parseInt(document.getElementById("cmCajaTurno").value);
  const id_vendedor = parseInt(document.getElementById("cmVendedor").value);

  if (!id_caja_turno) {
    showToast("Selecciona un turno de caja", "error");
    return;
  }
  if (!id_vendedor) {
    showToast("Selecciona un vendedor", "error");
    return;
  }
  if (cargaMasivaVentasAgrupadas.length === 0) {
    showToast("No hay ventas para procesar", "warning");
    return;
  }

  // Obtener ubicación de configuración
  let id_ubicacion = null;
  try {
    const config = await api.request("/configuracion").catch(() => ({}));
    id_ubicacion = config.id_ubicacion || null;
  } catch (_) {}
  if (!id_ubicacion) {
    showToast(
      "No hay ubicación configurada. Contacta al administrador.",
      "error",
    );
    return;
  }

  const id_usuario = getCurrentUser()?.id || 1;

  const btn = document.getElementById("cmBtnConfirmar");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Procesando...`;

  let ok = 0,
    fail = 0;
  const errores = [];

  for (const g of cargaMasivaVentasAgrupadas) {
    try {
      const data = {
        id_usuario,
        id_vendedor,
        id_cliente: g.idCliente,
        id_caja_turno,
        id_ubicacion,
        id_cotizacion: null,
        descuento_porcentaje: g.descuento || 0,
        observaciones: g.observaciones || null,
        nit: g.nitCliente || null,
        detalles: g.items.map((it) => ({
          id_producto: it.producto.id,
          cantidad: it.cantidad,
        })),
        pagos: [],
      };
      await api.createVenta(data);
      ok++;
    } catch (err) {
      fail++;
      errores.push(
        `Cliente ${g.nitRaw} (${g.observaciones || "s/obs"}): ${err.message}`,
      );
    }
  }

  if (fail === 0) {
    showToast(`✅ ${ok} ventas creadas correctamente`, "success");
  } else {
    showToast(
      `⚠ ${ok} creadas, ${fail} fallidas. Revisa la consola.`,
      "warning",
    );
    console.warn("Errores carga masiva:", errores);
  }

  // Cerrar modal y recargar
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("cargaMasivaVentasModal"),
  );
  if (modal) modal.hide();
  await loadVentasModule();
}

// ============================================================
// EXPONER FUNCIONES GLOBALES
// ============================================================
window.loadVentasModule = loadVentasModule;
window.showCreateVentaModal = showCreateVentaModal;
window.buscarCotizacionParaVenta = buscarCotizacionParaVenta;
window.crearVentaDesdeCotizacion = crearVentaDesdeCotizacion;
window.agregarDetalleVenta = agregarDetalleVenta;
window.agregarProductoEscaneadoVenta = agregarProductoEscaneadoVenta;
window.eliminarDetalleVenta = eliminarDetalleVenta;
window.saveVenta = saveVenta;
window.verVenta = verVenta;
window.anularVenta = anularVenta;
window.verFichaCliente = verFichaCliente;
window.verFichaProducto = verFichaProducto;
window.cargarSubClientes = cargarSubClientes;
window.cargarSubVendedores = cargarSubVendedores;
window.reactivarCliente = reactivarCliente;
window.cargarSubServicios = cargarSubServicios;
window.cargarSubCotizaciones = cargarSubCotizaciones;
window.showCreateCotizacionModal = showCreateCotizacionModal;
window.saveCotizacion = saveCotizacion;
window.verCotizacion = verCotizacion;
window.aprobarCotizacion = aprobarCotizacion;
window.rechazarCotizacion = rechazarCotizacion;
window.filtrarVentas = filtrarVentas;
window.limpiarFiltroVentas = limpiarFiltroVentas;
window.filtrarClientes = filtrarClientes;
window.limpiarFiltroClientes = limpiarFiltroClientes;
window.filtrarCotizaciones = filtrarCotizaciones;
window.limpiarFiltroCotizaciones = limpiarFiltroCotizaciones;
window.filtrarServicios = filtrarServicios;
window.showCreateServicioModal = showCreateServicioModal;
window.saveServicio = saveServicio;
window.eliminarServicio = eliminarServicio;
window.calcularTotalServicio = calcularTotalServicio;
window.calcularTotalCotizacion = calcularTotalCotizacion;
window.agregarProductoCotizacionLista = agregarProductoCotizacionLista;
window.eliminarItemCotizacion = eliminarItemCotizacion;
window.cajaTurnosData = cajaTurnosData;
window.tiposPagoData = tiposPagoData;
window.cargarSubCajaBasico = cargarSubCajaBasico;
window.serviciosAdicionalesData = serviciosAdicionalesData;
window.cotizacionesData = cotizacionesData;
window.mostrarModalPago = mostrarModalPago;
window.registrarPagoVenta = registrarPagoVenta;
window.imprimirVenta = imprimirVenta;
window.exportarVentasExcel = exportarVentasExcel;
window.exportarVentasPDF = exportarVentasPDF;
window.pagarServicio = pagarServicio;
window.pagarServicioIndependiente = pagarServicioIndependiente;
window.eliminarPagoVenta = eliminarPagoVenta;
window.crearClienteDesdeVenta = crearClienteDesdeVenta;
window.showCreateTipoPagoModal = showCreateTipoPagoModal;
window.showCrearTipoPagoModal = showCrearTipoPagoModal;
window.showCargaMasivaVentasModal = showCargaMasivaVentasModal;
window.procesarArchivoVentasMasivas = procesarArchivoVentasMasivas;
window.confirmarCargaMasivaVentas = confirmarCargaMasivaVentas;
window.descargarPlantillaVentas = descargarPlantillaVentas;
