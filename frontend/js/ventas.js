// ventas.js

let ventasData = [];
let tiposPagoData = [];
let cajaTurnosData = [];
let serviciosAdicionalesData = [];
let cotizacionesData = [];
let ventaDetallesTemp = [];
let vendedoresData = [];
let cotizacionItemsTemp = [];

// ============================================================
// CARGA DEL MODULO PRINCIPAL
// ============================================================
async function loadVentasModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-shopping-cart me-2 text-warning"></i>Ventas</h4>
            <div>
                <button class="btn btn-warning btn-sm" onclick="showCreateVentaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Venta
                </button>
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
      ventas,
      clientes,
      productos,
      tiposPago,
      cajaTurnos,
      servicios,
      cotizaciones,
      ubicaciones,
    ] = await Promise.all([
      api.getVentas().catch(() => []),
      api.getClientes().catch(() => []),
      api.getProductos().catch(() => []),
      api.getTiposPago().catch(() => []),
      api.getCajaTurnos().catch(() => []),
      api.request("/servicios-adicionales").catch(() => []),
      api.request("/cotizaciones").catch(() => []),
      api.request("/ubicaciones").catch(() => []),
    ]);

    ventasData = ventas || [];
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

    renderVentasTable(ventasData);
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
  } catch (error) {
    document.getElementById("ventasTableContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// ============================================================
// PESTAÑA: VENTAS CON BÚSQUEDA Y BOTÓN DE PAGO
// ============================================================
function renderVentasTable(ventas) {
  const container = document.getElementById("ventasTableContainer");
  if (!container) return;

  let searchHtml = `
    <div class="row mb-3">
      <div class="col-md-6">
        <div class="input-group">
          <input type="text" class="form-control" id="ventaSearchInput" 
                 placeholder="Buscar por ID, cliente, NIT o producto..." 
                 oninput="filtrarVentas()">
          <button class="btn btn-outline-secondary" onclick="filtrarVentas()">
            <i class="fas fa-search"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="limpiarFiltroVentas()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="col-md-6 text-end">
        <button class="btn btn-success btn-sm" onclick="exportarVentasExcel()">
          <i class="fas fa-file-excel me-1"></i>Exportar
        </button>
        <button class="btn btn-danger btn-sm" onclick="exportarVentasPDF()">
          <i class="fas fa-file-pdf me-1"></i>PDF
        </button>
        <button class="btn btn-warning btn-sm" onclick="showCreateVentaModal()">
          <i class="fas fa-plus me-2"></i>Nueva Venta
        </button>
      </div>
    </div>
  `;

  if (!ventas || ventas.length === 0) {
    container.innerHTML =
      searchHtml +
      `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay ventas registradas</p>
            </div>
        `;
    return;
  }

  // Calcular totales
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
            <h6 class="text-success mb-0">Total Ventas</h6>
            <h5 class="mb-0">Q${totalVentas.toFixed(2)}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning bg-opacity-10">
          <div class="card-body text-center py-2">
            <h6 class="text-warning mb-0">Pendiente por Cobrar</h6>
            <h5 class="mb-0">Q${totalPendiente.toFixed(2)}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info bg-opacity-10">
          <div class="card-body text-center py-2">
            <h6 class="text-info mb-0">Cantidad de Ventas</h6>
            <h5 class="mb-0">${ventas.length}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-primary bg-opacity-10">
          <div class="card-body text-center py-2">
            <h6 class="text-primary mb-0">Promedio por Venta</h6>
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
                    ${!pagada ? `<button class="btn btn-sm btn-outline-success" onclick="mostrarModalPago(${v.id})" title="Registrar pago"><i class="fas fa-money-bill-wave"></i></button>` : ""}
                    <button class="btn btn-sm btn-outline-danger" onclick="anularVenta(${v.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${ventas.length} ventas</small>
        </div>
    `;

  container.innerHTML = html;
  window.ventasDataOriginal = ventas;
}

function filtrarVentas() {
  const search = document
    .getElementById("ventaSearchInput")
    .value.toLowerCase()
    .trim();
  const tbody = document.getElementById("ventasTableBody");
  if (!tbody) return;
  const rows = tbody.getElementsByTagName("tr");
  let visibleCount = 0;
  for (const row of rows) {
    const text = row.textContent.toLowerCase();
    if (!search || text.includes(search)) {
      row.style.display = "";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  }
  const footer = document.querySelector(
    "#ventasTableContainer .text-end small",
  );
  if (footer) {
    footer.textContent = `Mostrando: ${visibleCount} de ${rows.length} ventas`;
  }
}

function limpiarFiltroVentas() {
  const input = document.getElementById("ventaSearchInput");
  if (input) {
    input.value = "";
    filtrarVentas();
  }
}

// ============================================================
// EXPORTAR VENTAS A EXCEL Y PDF
// ============================================================
function exportarVentasExcel() {
  const ventas = window.ventasDataOriginal || ventasData;
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

function exportarVentasPDF() {
  const ventas = window.ventasDataOriginal || ventasData;
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
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="ventaModalTitle">Nueva Venta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="ventaForm" onsubmit="saveVenta(event)">
            <input type="hidden" id="ventaId" value="">
            
            <div class="row">
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Buscar Cliente por NIT</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="ventaBuscarNit" 
                           placeholder="Ingresa NIT del cliente" 
                           onkeyup="if(event.key === 'Enter') buscarClientePorNit()">
                    <button class="btn btn-outline-primary" type="button" onclick="buscarClientePorNit()">
                      <i class="fas fa-search"></i>
                    </button>
                    <button class="btn btn-outline-secondary" type="button" onclick="limpiarBusquedaCliente()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div id="ventaClienteInfo" class="mt-1"></div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Cliente</label>
                  <select class="form-select" id="ventaCliente">
                    <option value="">Sin cliente</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Número de Cotización</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="ventaCotizacion" 
                           placeholder="ID de cotización aprobada" 
                           onchange="buscarCotizacionParaVenta()" 
                           onkeyup="if(event.key === 'Enter') buscarCotizacionParaVenta()">
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
              <div class="col-md-5">
                <select class="form-select form-select-sm" id="ventaProductoSelect">
                  <option value="">Seleccionar producto</option>
                </select>
              </div>
              <div class="col-md-3">
                <input type="number" class="form-control form-control-sm" id="ventaDetalleCantidad" value="1" step="1" min="1">
              </div>
              <div class="col-md-3">
                <input type="text" class="form-control form-control-sm" id="ventaDetallePrecio" readonly>
              </div>
              <div class="col-md-1">
                <button type="button" class="btn btn-sm btn-success" onclick="agregarDetalleVenta(event)">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div id="ventaDetallesList" class="mb-3"></div>

            <div class="text-end">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-warning">
                <i class="fas fa-save me-2"></i>Guardar Venta
              </button>
            </div>
          </form>
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
  const ventaBuscarNit = document.getElementById("ventaBuscarNit");
  const ventaClienteInfo = document.getElementById("ventaClienteInfo");

  if (ventaId) ventaId.value = "";
  if (ventaDescuento) ventaDescuento.value = 0;
  if (ventaObservaciones) ventaObservaciones.value = "";
  if (ventaCotizacion) ventaCotizacion.value = "";
  if (ventaCotizacionInfo) ventaCotizacionInfo.innerHTML = "";
  if (ventaBuscarNit) ventaBuscarNit.value = "";
  if (ventaClienteInfo) ventaClienteInfo.innerHTML = "";

  limpiarErroresFormulario("ventaForm");

  llenarSelectCliente();
  llenarSelectCajaTurno();
  await llenarSelectVendedores();
  llenarSelectProductoDetalle();

  if (ventaDetallesList) ventaDetallesList.innerHTML = "";

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

    if (!data.tiene_stock_suficiente) {
      const sinStock = data.detalles.filter((d) => !d.stock_suficiente);
      document.getElementById("ventaCotizacionInfo").innerHTML = `
        <div class="alert alert-warning small mb-2">
          <i class="fas fa-exclamation-triangle me-1"></i>
          <strong>Alerta:</strong> Los siguientes productos no tienen stock suficiente:
          <ul class="mb-0">
            ${sinStock
              .map(
                (d) => `
              <li>${d.nombre_producto}: solicitado ${d.cantidad}, disponible ${d.stock_disponible}</li>
            `,
              )
              .join("")}
          </ul>
        </div>
      `;
    } else {
      document.getElementById("ventaCotizacionInfo").innerHTML = `
        <div class="text-success small">
          <i class="fas fa-check-circle me-1"></i>
          Cotización #${data.id} - ${data.numero_expediente} - Total: Q${data.total.toFixed(2)}
          ${data.observaciones ? `<br><span class="text-muted">${data.observaciones}</span>` : ""}
        </div>
      `;
    }

    if (data.id_cliente) {
      const selectCliente = document.getElementById("ventaCliente");
      selectCliente.value = data.id_cliente;
    }

    ventaDetallesTemp = [];

    data.detalles.forEach((d) => {
      const producto = (window.productosData || []).find(
        (p) => p.id === d.id_producto,
      );
      if (producto) {
        ventaDetallesTemp.push({
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          producto: producto,
          precio_unitario: d.precio_unitario,
        });
      }
    });

    renderDetallesVenta();

    if (data.descuento_porcentaje) {
      document.getElementById("ventaDescuento").value =
        data.descuento_porcentaje;
    }

    if (data.observaciones) {
      document.getElementById("ventaObservaciones").value = data.observaciones;
    }

    showToast(`Cotización #${data.id} cargada correctamente`, "success");
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

    const ventasCliente = ventasData.filter((v) => v.id_cliente === idCliente);
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
  const select = document.getElementById("ventaCliente");
  if (!select) return;
  select.innerHTML = '<option value="">Sin cliente</option>';
  (window.clientesData || []).forEach((c) => {
    const estado = c.activo !== 0 ? "" : " (Inactivo)";
    select.innerHTML += `<option value="${c.id}">${c.nombre}${estado}</option>`;
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
  const select = document.getElementById("ventaProductoSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar producto</option>';
  (window.productosData || []).forEach((p) => {
    select.innerHTML += `<option value="${p.id}" data-precio="${p.precio_venta || 0}">
      ${p.codigo} - ${p.nombre} (Stock: ${p.stock_actual || 0})
    </option>`;
  });

  select.onchange = function () {
    const selected = this.options[this.selectedIndex];
    const precio = selected.dataset.precio || 0;
    const precioField = document.getElementById("ventaDetallePrecio");
    if (precioField) {
      precioField.value = `Q${parseFloat(precio).toFixed(2)}`;
    }
  };
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

  if ((producto.stock_actual || 0) < cantidad) {
    showToast(
      `Stock insuficiente. Disponible: ${producto.stock_actual || 0}`,
      "error",
    );
    return;
  }

  ventaDetallesTemp.push({
    id_producto: id_producto,
    cantidad: cantidad,
    producto: producto,
    precio_unitario: producto.precio_venta || 0,
  });

  renderDetallesVenta();
  cantidadInput.value = 1;
  productSelect.value = "";
  document.getElementById("ventaDetallePrecio").value = "";
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
    await api.request(`/ventas/${id}`, "PATCH", { estado: "Anulada" });
    showToast("Venta anulada correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al anular venta", "error");
  }
}

// ============================================================
// MODAL DE PAGO PARA VENTA
// ============================================================
function mostrarModalPago(idVenta) {
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
            <div class="mb-3">
              <label class="form-label">Tipo de Pago *</label>
              <select class="form-select" id="pagoVentaTipo" required>
                <option value="">Seleccionar tipo</option>
                ${tiposPagoData
                  .filter((t) => t.para_ventas === 1)
                  .map((t) => `<option value="${t.id}">${t.nombre}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Monto *</label>
              <input type="number" class="form-control" id="pagoVentaMonto" 
                     step="0.01" min="0.01" required>
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

// ============================================================
// BUSCAR CLIENTE POR NIT
// ============================================================
function buscarClientePorNit(event) {
  if (event && event.key !== "Enter") return;

  const input = document.getElementById("ventaBuscarNit");
  const nit = input.value.trim();
  const infoDiv = document.getElementById("ventaClienteInfo");
  const selectCliente = document.getElementById("ventaCliente");

  if (!nit) {
    infoDiv.innerHTML = "";
    return;
  }

  const cliente = (window.clientesData || []).find((c) => c.nit === nit);

  if (cliente) {
    infoDiv.innerHTML = `
      <div class="alert alert-success small py-1 px-2 mb-0">
        <i class="fas fa-check-circle me-1"></i>
        <strong>${cliente.nombre}</strong>
        ${cliente.telefono ? ` - ${cliente.telefono}` : ""}
        ${cliente.email ? ` - ${cliente.email}` : ""}
      </div>
    `;
    selectCliente.value = cliente.id;
    showToast(`Cliente encontrado: ${cliente.nombre}`, "success");
  } else {
    infoDiv.innerHTML = `
      <div class="alert alert-warning small py-1 px-2 mb-0">
        <i class="fas fa-exclamation-triangle me-1"></i>
        No se encontró cliente con NIT: ${nit}
      </div>
    `;
    selectCliente.value = "";
  }
}

function limpiarBusquedaCliente() {
  document.getElementById("ventaBuscarNit").value = "";
  document.getElementById("ventaClienteInfo").innerHTML = "";
  document.getElementById("ventaCliente").value = "";
}

// ============================================================
// PESTAÑA: CLIENTES CON REACTIVAR
// ============================================================
async function cargarSubClientes() {
  const container = document.getElementById("clientesSubContainer");
  if (!container) return;

  try {
    const clientes = await api.getClientes().catch(() => []);
    window.clientesData = clientes || [];

    let searchHtml = `
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <input type="text" class="form-control" id="clienteSearchInput" 
                   placeholder="Buscar cliente por nombre o NIT..." 
                   oninput="filtrarClientes()">
            <button class="btn btn-outline-secondary" onclick="filtrarClientes()">
              <i class="fas fa-search"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="limpiarFiltroClientes()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="col-md-6 text-end">
          <button class="btn btn-primary btn-sm" onclick="showCreateClienteSubModal()">
            <i class="fas fa-plus me-2"></i>Nuevo Cliente
          </button>
        </div>
      </div>
    `;

    if (!clientes || clientes.length === 0) {
      container.innerHTML =
        searchHtml +
        `
        <div class="text-center py-5">
          <i class="fas fa-users fa-3x text-muted mb-3"></i>
          <p class="text-muted">No hay clientes registrados</p>
        </div>
      `;
      return;
    }

    let html =
      searchHtml +
      `
      <div class="table-responsive">
        <table class="table table-hover table-striped" id="clientesTable">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>NIT</th>
              <th>Ventas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="clientesTableBody">
    `;

    clientes.forEach((c) => {
      const ventasCliente = ventasData.filter((v) => v.id_cliente === c.id);
      const activo = c.activo !== 0;
      html += `
        <tr>
          <td>${c.id}</td>
          <td>
            <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${c.id})">
              ${c.nombre || "--"}
            </button>
          </td>
          <td>${c.telefono || "--"}</td>
          <td>${c.email || "--"}</td>
          <td>${c.nit || "--"}</td>
          <td><span class="badge bg-info">${ventasCliente.length}</span></td>
          <td>
            <span class="badge ${activo ? "bg-success" : "bg-danger"}">
              ${activo ? "Activo" : "Inactivo"}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showEditClienteSubModal(${c.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteClienteSub(${c.id})">
              <i class="fas fa-trash"></i>
            </button>
            ${
              !activo
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
      <div class="text-end">
        <small class="text-muted">Total: ${clientes.length} clientes</small>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar clientes: ${error.message}</div>`;
  }
}

function filtrarClientes() {
  const search = document
    .getElementById("clienteSearchInput")
    .value.toLowerCase()
    .trim();
  const tbody = document.getElementById("clientesTableBody");
  if (!tbody) return;
  const rows = tbody.getElementsByTagName("tr");
  for (const row of rows) {
    const text = row.textContent.toLowerCase();
    row.style.display = !search || text.includes(search) ? "" : "none";
  }
}

function limpiarFiltroClientes() {
  const input = document.getElementById("clienteSearchInput");
  if (input) {
    input.value = "";
    filtrarClientes();
  }
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
  if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
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
    const cotizaciones = await api.request("/cotizaciones").catch(() => []);
    cotizacionesData = cotizaciones || [];

    let searchHtml = `
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <input type="text" class="form-control" id="cotizacionSearchInput" 
                   placeholder="Buscar por ID, cliente, NIT o producto..." 
                   oninput="filtrarCotizaciones()">
            <button class="btn btn-outline-secondary" onclick="filtrarCotizaciones()">
              <i class="fas fa-search"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="limpiarFiltroCotizaciones()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="col-md-6 text-end">
          <button class="btn btn-success btn-sm" onclick="showCreateCotizacionModal()">
            <i class="fas fa-plus me-2"></i>Nueva Cotización
          </button>
        </div>
      </div>
    `;

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
              <h6 class="fw-bold">Total Aprobadas</h6>
              <h3 class="text-success">${cotizacionesData.filter((c) => c.estado === "Aprobada").length}</h3>
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
                        c.estado === "Aprobada"
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
                      c.estado === "Pendiente"
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
        <small class="text-muted">Total: ${cotizacionesData.length} cotizaciones</small>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar cotizaciones: ${error.message}</div>`;
  }
}

function filtrarCotizaciones() {
  const search = document
    .getElementById("cotizacionSearchInput")
    .value.toLowerCase()
    .trim();
  const tbody = document.getElementById("cotizacionesTableBody");
  if (!tbody) return;
  const rows = tbody.getElementsByTagName("tr");
  for (const row of rows) {
    const text = row.textContent.toLowerCase();
    row.style.display = !search || text.includes(search) ? "" : "none";
  }
}

function limpiarFiltroCotizaciones() {
  const input = document.getElementById("cotizacionSearchInput");
  if (input) {
    input.value = "";
    filtrarCotizaciones();
  }
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
                  <label class="form-label">Cliente *</label>
                  <select class="form-select" id="cotizacionCliente" required>
                    <option value="">Seleccionar cliente</option>
                  </select>
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
                <select class="form-select form-select-sm" id="cotizacionProductoSelect">
                  <option value="">Seleccionar producto</option>
                </select>
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
  return modal;
}

function showCreateCotizacionModal() {
  cotizacionItemsTemp = [];

  const modal = crearModalCotizacion();
  if (!modal) return;

  const clienteSelect = document.getElementById("cotizacionCliente");
  clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
  (window.clientesData || []).forEach((c) => {
    clienteSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });

  const productoSelect = document.getElementById("cotizacionProductoSelect");
  productoSelect.innerHTML = '<option value="">Seleccionar producto</option>';
  (window.productosData || []).forEach((p) => {
    productoSelect.innerHTML += `
      <option value="${p.id}" data-precio="${p.precio_venta || 0}" data-nombre="${p.nombre}">
        ${p.codigo} - ${p.nombre} (Q${p.precio_venta || 0})
      </option>
    `;
  });

  productoSelect.onchange = function () {
    const selected = this.options[this.selectedIndex];
    const precio = selected.dataset.precio || 0;
    document.getElementById("cotizacionProductoPrecio").value =
      `Q${parseFloat(precio).toFixed(2)}`;
  };

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

  cotizacionItemsTemp.push({
    id_producto: id_producto,
    cantidad: cantidad,
    nombre: producto.nombre,
    precio_unitario: parseFloat(producto.precio_venta || 0),
  });

  select.value = "";
  document.getElementById("cotizacionProductoCantidad").value = 1;
  document.getElementById("cotizacionProductoPrecio").value = "";

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
          <strong>${item.nombre}</strong>
          <span class="text-muted small"> x ${item.cantidad}</span>
          <span class="text-muted small"> Q${item.precio_unitario.toFixed(2)} c/u</span>
        </div>
        <div>
          <span class="fw-bold">Q${subtotal.toFixed(2)}</span>
          <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarItemCotizacion(${index})">
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
            <span class="badge ${cotizacion.estado === "Aprobada" ? "bg-success" : cotizacion.estado === "Rechazada" ? "bg-danger" : "bg-warning"}">
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
          cotizacion.estado === "Pendiente"
            ? `
          <button class="btn btn-success" onclick="aprobarCotizacion(${cotizacion.id})">Aprobar</button>
          <button class="btn btn-danger" onclick="rechazarCotizacion(${cotizacion.id})">Rechazar</button>
        `
            : ""
        }
        ${
          cotizacion.estado === "Aprobada"
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
      .request("/servicios-adicionales")
      .catch(() => []);
    serviciosAdicionalesData = servicios || [];

    if (!servicios || servicios.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-tools fa-3x text-muted mb-3"></i>
          <p class="text-muted">No hay servicios adicionales registrados</p>
          <button class="btn btn-info btn-sm" onclick="showCreateServicioModal()">
            <i class="fas fa-plus me-2"></i>Registrar Servicio
          </button>
        </div>
      `;
      return;
    }

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">Listado de Servicios Adicionales</h6>
        <button class="btn btn-info btn-sm" onclick="showCreateServicioModal()">
          <i class="fas fa-plus me-2"></i>Nuevo Servicio
        </button>
      </div>
      <div class="row mb-3">
        <div class="col-md-4">
          <label class="form-label small">Filtrar por Cliente</label>
          <select class="form-select form-select-sm" id="filtroClienteServicios" onchange="filtrarServicios()">
            <option value="">Todos los clientes</option>
            ${(window.clientesData || [])
              .map(
                (c) => `
              <option value="${c.id}">${c.nombre}</option>
            `,
              )
              .join("")}
          </select>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover table-striped" id="serviciosTable">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Venta</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Material</th>
              <th>Mano Obra</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="serviciosTableBody">
            ${renderServiciosRows(servicios)}
          </tbody>
        </table>
      </div>
      <div class="text-end">
        <small class="text-muted">Total: ${servicios.length} servicios</small>
      </div>
    `;

    container.innerHTML = html;
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

      // ✅ Verificar estado de pago correcto
      let estadoPago = "Pendiente";
      let badgeColor = "bg-danger";
      let estaPagado = false;
      let saldoRestante = s.total || 0;

      if (s.id_venta) {
        const venta = ventasData.find((v) => v.id === s.id_venta);
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
              !estaPagado
                ? `
              <button class="btn btn-outline-success" onclick="pagarServicio(${s.id})" title="Pagar servicio">
                <i class="fas fa-money-bill-wave"></i>
              </button>
            `
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
            <button class="btn btn-outline-danger" onclick="eliminarServicio(${s.id})" title="Eliminar">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

function filtrarServicios() {
  const filtro = document.getElementById("filtroClienteServicios").value;
  let servicios = serviciosAdicionalesData;
  if (filtro) {
    servicios = servicios.filter((s) => s.id_cliente === parseInt(filtro));
  }
  const tbody = document.getElementById("serviciosTableBody");
  if (tbody) {
    tbody.innerHTML = renderServiciosRows(servicios);
  }
}

function showCreateServicioModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "servicioModal";
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
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
                    ${ventasData
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

            <div class="text-end">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-info">
                <i class="fas fa-save me-2"></i>Guardar Servicio
              </button>
            </div>
          </form>
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

    // ✅ ACTUALIZAR EL TOTAL DE LA VENTA
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

        // 6. ✅ FORZAR RECARGA DE ventasData
        const ventasActualizadas = await api.getVentas();
        ventasData = ventasActualizadas || [];

        // 7. Actualizar la venta en ventasData
        const idx = ventasData.findIndex((v) => v.id === id_venta);
        if (idx !== -1) {
          ventasData[idx].total = nuevoTotal;
        }

        // 8. ✅ FORZAR RECARGA DE LA TABLA DE VENTAS
        renderVentasTable(ventasData);

        showToast(
          `Venta #${id_venta} actualizada. Nuevo total: Q${nuevoTotal.toFixed(2)}`,
          "success",
        );
      } catch (error) {
        console.error("❌ Error actualizando total de venta:", error);
        showToast("Error al actualizar el total de la venta", "error");
      }
    }

    // ✅ Si NO tiene venta asociada, mostrar opción de pago
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

    // ✅ Recargar servicios y ventas
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
      const venta = ventasData.find((v) => v.id === servicio.id_venta);
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

    // ✅ Servicio independiente - crear venta express
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
// PESTAÑA: VENDEDORES
// ============================================================
async function cargarSubVendedores() {
  const container = document.getElementById("vendedoresSubContainer");
  if (!container) return;

  try {
    const usuarios = await api.getUsuarios().catch(() => []);
    const empleados = await api.getEmpleados().catch(() => []);

    const empleadosMap = {};
    empleados.forEach((e) => {
      empleadosMap[e.id] = e;
    });

    const vendedoresUsuarios = usuarios.filter((u) => u.id_rol === 3);

    const resultado = vendedoresUsuarios
      .filter((u) => u.id_empleado !== null)
      .map((u) => {
        const empleado = empleadosMap[u.id_empleado];
        return {
          ...u,
          ...empleado,
          id_usuario: u.id,
        };
      });

    console.log("📋 Vendedores encontrados:", resultado);

    if (!resultado || resultado.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-user-tie fa-3x text-muted mb-3"></i>
          <p class="text-muted">No hay vendedores registrados</p>
          <button class="btn btn-info btn-sm" onclick="cargarModulo('usuarios')">
            <i class="fas fa-plus me-2"></i>Ir a Usuarios
          </button>
        </div>
      `;
      return;
    }

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">Listado de Vendedores</h6>
        <span class="badge bg-info">${resultado.length} vendedores</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover table-striped">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Ventas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

    resultado.forEach((v) => {
      const ventasVendedor = ventasData.filter(
        (venta) => venta.id_usuario === v.id_usuario,
      );
      const activo = v.activo !== 0;

      html += `
        <tr>
          <td>${v.id}</td>
          <td><strong>${v.nombre || "--"}</strong></td>
          <td>${v.nombre_usuario || "--"}</td>
          <td>${v.email || "--"}</td>
          <td>${v.telefono || "--"}</td>
          <td><span class="badge bg-warning">${ventasVendedor.length}</span></td>
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
        <small class="text-muted">Total: ${resultado.length} vendedores</small>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    console.error("❌ Error cargando vendedores:", error);
    container.innerHTML = `<div class="alert alert-danger">Error al cargar vendedores: ${error.message}</div>`;
  }
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
    ventasData.forEach((v) => {
      (v.detalles || []).forEach((d) => {
        if (d.id_producto === idProducto) {
          vecesVendido++;
          cantidadTotal += d.cantidad || 0;
        }
      });
    });

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
// EXPONER FUNCIONES GLOBALES
// ============================================================
window.loadVentasModule = loadVentasModule;
window.showCreateVentaModal = showCreateVentaModal;
window.buscarCotizacionParaVenta = buscarCotizacionParaVenta;
window.crearVentaDesdeCotizacion = crearVentaDesdeCotizacion;
window.agregarDetalleVenta = agregarDetalleVenta;
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
window.refrescarSelectUbicacion = refrescarSelectUbicacion;
window.mostrarModalPago = mostrarModalPago;
window.registrarPagoVenta = registrarPagoVenta;
window.buscarClientePorNit = buscarClientePorNit;
window.limpiarBusquedaCliente = limpiarBusquedaCliente;
window.imprimirVenta = imprimirVenta;
window.exportarVentasExcel = exportarVentasExcel;
window.exportarVentasPDF = exportarVentasPDF;
window.pagarServicio = pagarServicio;
window.pagarServicioIndependiente = pagarServicioIndependiente;
window.eliminarPagoVenta = eliminarPagoVenta;
