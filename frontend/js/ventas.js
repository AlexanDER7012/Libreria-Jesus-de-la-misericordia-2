// ventas.js

let ventasData = [];
let tiposPagoData = [];
let cajaTurnosData = [];
let serviciosAdicionalesData = [];
let cotizacionesData = [];
let ventaDetallesTemp = [];
let ventaPagosTemp = [];
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
    ] = await Promise.all([
      api.getVentas().catch(() => []),
      api.getClientes().catch(() => []),
      api.getProductos().catch(() => []),
      api.getTiposPago().catch(() => []),
      api.getCajaTurnos().catch(() => []),
      api.request("/servicios-adicionales/").catch(() => []),
      api.request("/cotizaciones/").catch(() => []),
    ]);

    ventasData = ventas || [];
    window.clientesData = clientes || [];
    window.productosData = productos || [];
    tiposPagoData = tiposPago || [];
    cajaTurnosData = cajaTurnos || [];
    serviciosAdicionalesData = servicios || [];
    cotizacionesData = cotizaciones || [];

    if (!window.ubicacionesData || window.ubicacionesData.length === 0) {
      try {
        const backup = localStorage.getItem("ubicaciones_backup");
        if (backup) {
          const parsed = JSON.parse(backup);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.ubicacionesData = parsed;
          }
        }
      } catch (e) {}
    }

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
// PESTAÑA: VENTAS CON BÚSQUEDA
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

  let html =
    searchHtml +
    `
        <div class="table-responsive">
            <table class="table table-hover table-striped" id="ventasTable">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Subtotal</th>
                        <th>Descuento</th>
                        <th>Total</th>
                        <th>Saldo</th>
                        <th>Estado Pago</th>
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
    const totalPagos = (v.pagos || []).reduce(
      (sum, p) => sum + (p.monto || 0),
      0,
    );
    const saldo = (v.total || 0) - totalPagos;
    const pagada = saldo <= 0;

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
// CREAR MODAL DE VENTA DINÁMICAMENTE
// ============================================================
function crearModalVenta() {
  let modal = document.getElementById("ventaModal");
  if (modal) return modal;

  modal = document.createElement("div");
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
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Cliente</label>
                  <select class="form-select" id="ventaCliente">
                    <option value="">Sin cliente</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Número de Cotización</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="ventaCotizacion" 
                           placeholder="Ingresa el ID de cotización aprobada" 
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
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Turno Caja *</label>
                  <select class="form-select" id="ventaCajaTurno" required>
                    <option value="">Seleccionar turno</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Ubicación *</label>
                  <select class="form-select" id="ventaUbicacion" required>
                    <option value="">Seleccionar ubicación</option>
                  </select>
                </div>
              </div>
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

            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold">Pagos</h6>
            </div>

            <div class="row mb-2" id="ventaPagoRow">
              <div class="col-md-4">
                <select class="form-select form-select-sm" id="ventaPagoTipo">
                  <option value="">Seleccionar tipo</option>
                </select>
              </div>
              <div class="col-md-3">
                <input type="number" class="form-control form-control-sm" id="ventaPagoMonto" placeholder="Monto" step="0.01" min="0.01">
              </div>
              <div class="col-md-4">
                <input type="text" class="form-control form-control-sm" id="ventaPagoReferencia" placeholder="Referencia (opcional)">
              </div>
              <div class="col-md-1">
                <button type="button" class="btn btn-sm btn-success" onclick="agregarPagoVenta(event)">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div id="ventaPagosList" class="mb-3"></div>

            <div class="text-end">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-warning">Guardar Venta</button>
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
// MODAL VENTA - MOSTRAR
// ============================================================
function showCreateVentaModal() {
  ventaDetallesTemp = [];
  ventaPagosTemp = [];

  // PRIMERO: Crear el modal si no existe
  const modal = crearModalVenta();
  if (!modal) return;

  // SEGUNDO: Ahora que el modal existe, obtener los elementos
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
  const ventaPagosList = document.getElementById("ventaPagosList");

  if (ventaId) ventaId.value = "";
  if (ventaDescuento) ventaDescuento.value = 0;
  if (ventaObservaciones) ventaObservaciones.value = "";
  if (ventaCotizacion) ventaCotizacion.value = "";
  if (ventaCotizacionInfo) ventaCotizacionInfo.innerHTML = "";

  limpiarErroresFormulario("ventaForm");

  llenarSelectCliente();
  llenarSelectCajaTurno();
  poblarSelectUbicacionVenta(); // <-- antes: llenarSelectUbicacion()
  llenarSelectProductoDetalle();
  llenarSelectTipoPago();

  if (ventaDetallesList) ventaDetallesList.innerHTML = "";
  if (ventaPagosList) ventaPagosList.innerHTML = "";

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

    let ventasHtml =
      ventasCliente.length === 0
        ? '<p class="text-muted">No hay ventas registradas para este cliente</p>'
        : `
        <div class="table-responsive">
            <table class="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado Pago</th>
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
                            <td><button class="btn btn-link btn-sm p-0" onclick="verVenta(${v.id})">#${v.id}</button></td>
                            <td>${v.fecha ? new Date(v.fecha).toLocaleDateString() : "--"}</td>
                            <td>Q${(v.total || 0).toFixed(2)}</td>
                            <td><span class="badge ${pagada ? "bg-success" : "bg-danger"}">${pagada ? "Pagada" : "Pendiente"}</span></td>
                        </tr>
                      `;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>
      `;

    let serviciosHtml =
      serviciosCliente.length === 0
        ? '<p class="text-muted">No hay servicios adicionales para este cliente</p>'
        : `
        <div class="table-responsive">
            <table class="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${serviciosCliente
                      .map(
                        (s) => `
                        <tr>
                            <td>${s.id}</td>
                            <td>${s.tipo_servicio || "--"}</td>
                            <td>${s.descripcion || "--"}</td>
                            <td>Q${(s.total || 0).toFixed(2)}</td>
                        </tr>
                      `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
      `;

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Ficha del Cliente</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Nombre:</strong> ${cliente.nombre || "--"}</p>
                        <p><strong>Teléfono:</strong> ${cliente.telefono || "--"}</p>
                        <p><strong>Email:</strong> ${cliente.email || "--"}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Dirección:</strong> ${cliente.direccion || "--"}</p>
                        <p><strong>NIT:</strong> ${cliente.nit || "--"}</p>
                        <p><strong>Tipo:</strong> ${cliente.tipo_cliente || "General"}</p>
                        <p><strong>Estado:</strong> 
                            <span class="badge ${cliente.activo !== 0 ? "bg-success" : "bg-danger"}">
                                ${cliente.activo !== 0 ? "Activo" : "Inactivo"}
                            </span>
                        </p>
                    </div>
                </div>
                <hr>
                <h6 class="fw-bold">Historial de Ventas</h6>
                ${ventasHtml}
                <hr>
                <h6 class="fw-bold">Servicios Adicionales</h6>
                ${serviciosHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "clienteFichaModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
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

function llenarSelectCajaTurno() {
  const select = document.getElementById("ventaCajaTurno");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar turno</option>';
  const abiertos = cajaTurnosData.filter((t) => t.estado === "Abierto");
  abiertos.forEach((t) => {
    select.innerHTML += `<option value="${t.id}">Turno #${t.id}</option>`;
  });
}

// ============================================================
// LLENAR SELECT DE UBICACIÓN (USANDO FUNCIÓN GLOBAL DE configuracion.js)
// ============================================================
// IMPORTANTE: este nombre YA NO puede llamarse "llenarSelectUbicacion",
// porque ese nombre pertenece a la función global real definida en
// configuracion.js (window.llenarSelectUbicacion(selectElement, ubicaciones)).
// Si se repite el nombre aquí, según el orden de carga de los <script>
// esta función puede terminar llamándose a sí misma en bucle infinito.
function poblarSelectUbicacionVenta() {
  const select = document.getElementById("ventaUbicacion");
  if (!select) {
    console.warn("⚠️ ventaUbicacion no encontrado");
    return;
  }

  if (typeof window.llenarSelectUbicacion === "function") {
    window.llenarSelectUbicacion(select, window.ubicacionesData || []);
    console.log("✅ Select de ubicación actualizado con función global");
  } else {
    // Fallback local, solo por si configuracion.js aún no cargó
    select.innerHTML = '<option value="">Seleccionar ubicación</option>';
    (window.ubicacionesData || []).forEach((u) => {
      const nombre = u.nombre || u.id || "Sin nombre";
      select.innerHTML += `<option value="${u.id}">${nombre}</option>`;
    });
    console.log("✅ Select de ubicación actualizado con fallback local");
  }
}

// ============================================================
// REFRESCAR SELECT DE UBICACIÓN (cuando se actualizan datos)
// ============================================================
function refrescarSelectUbicacion() {
  if (typeof window.actualizarSelectsUbicacion === "function") {
    window.actualizarSelectsUbicacion();
  } else {
    poblarSelectUbicacionVenta();
  }
}

function llenarSelectTipoPago() {
  const select = document.getElementById("ventaPagoTipo");
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar tipo</option>';
  tiposPagoData
    .filter((t) => t.para_ventas === 1)
    .forEach((t) => {
      select.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
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

  // Usar onchange en vez de addEventListener para evitar duplicados
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

function agregarPagoVenta(event) {
  if (event) event.preventDefault();

  const tipoSelect = document.getElementById("ventaPagoTipo");
  const montoInput = document.getElementById("ventaPagoMonto");
  const referenciaInput = document.getElementById("ventaPagoReferencia");

  const id_tipo_pago = parseInt(tipoSelect.value);
  const monto = parseFloat(montoInput.value);

  if (!id_tipo_pago) {
    showToast("Selecciona un tipo de pago", "error");
    return;
  }
  if (!monto || monto <= 0) {
    showToast("Ingresa un monto válido", "error");
    return;
  }

  const tipoPago = tiposPagoData.find((t) => t.id === id_tipo_pago);

  ventaPagosTemp.push({
    id_tipo_pago: id_tipo_pago,
    monto: monto,
    referencia: referenciaInput.value || null,
    tipoPago: tipoPago,
  });

  renderPagosVenta();
  montoInput.value = "";
  referenciaInput.value = "";
  tipoSelect.value = "";
}

function eliminarPagoVenta(index) {
  ventaPagosTemp.splice(index, 1);
  renderPagosVenta();
}

function renderPagosVenta() {
  const container = document.getElementById("ventaPagosList");
  if (!container) return;

  if (ventaPagosTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay pagos registrados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  let total = 0;
  ventaPagosTemp.forEach((p, index) => {
    total += p.monto;
    html += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>${p.tipoPago ? p.tipoPago.nombre : "--"}</strong>
          <span class="text-muted small"> ${p.referencia ? "Ref: " + p.referencia : ""}</span>
        </div>
        <div>
          <span class="fw-bold">Q${p.monto.toFixed(2)}</span>
          <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarPagoVenta(${index})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </li>
    `;
  });
  html += `
    <li class="list-group-item fw-bold bg-light">
      Total Pagos: Q${total.toFixed(2)}
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

  const id_ubicacion = parseInt(
    document.getElementById("ventaUbicacion").value,
  );
  if (!id_ubicacion) {
    showToast("Selecciona una ubicación", "error");
    return;
  }

  if (ventaDetallesTemp.length === 0) {
    showToast("Agrega al menos un producto", "error");
    return;
  }

  if (ventaPagosTemp.length === 0) {
    showToast("Agrega al menos un pago", "error");
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

  let totalPagos = 0;
  ventaPagosTemp.forEach((p) => {
    totalPagos += p.monto;
  });

  const totalFinal = subtotal - (subtotal * descuento_porcentaje) / 100;

  if (totalPagos < totalFinal) {
    showToast(
      `El total de pagos (Q${totalPagos.toFixed(2)}) no cubre el total de la venta (Q${totalFinal.toFixed(2)})`,
      "error",
    );
    return;
  }

  const data = {
    id_usuario: id_usuario,
    id_cliente: id_cliente,
    id_caja_turno: id_caja_turno,
    id_ubicacion: id_ubicacion,
    id_cotizacion: id_cotizacion,
    descuento_porcentaje: descuento_porcentaje,
    observaciones: observaciones,
    detalles: ventaDetallesTemp.map((d) => ({
      id_producto: d.id_producto,
      cantidad: d.cantidad,
    })),
    pagos: ventaPagosTemp.map((p) => ({
      id_tipo_pago: p.id_tipo_pago,
      monto: p.monto,
      referencia: p.referencia,
    })),
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

    let pagosHtml = (venta.pagos || [])
      .map((p) => {
        const tipoPago = tiposPagoData.find((t) => t.id === p.id_tipo_pago);
        return `
        <tr>
          <td>${tipoPago ? tipoPago.nombre : "--"}</td>
          <td>Q${(p.monto || 0).toFixed(2)}</td>
          <td>${p.referencia || "--"}</td>
        </tr>
      `;
      })
      .join("");

    const serviciosVenta = serviciosAdicionalesData.filter(
      (s) => s.id_venta === id,
    );
    let serviciosHtml =
      serviciosVenta.length === 0
        ? '<p class="text-muted small">No hay servicios adicionales para esta venta</p>'
        : `
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Material</th>
                <th>Mano Obra</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${serviciosVenta
                .map(
                  (s) => `
                <tr>
                  <td>${s.id}</td>
                  <td>${s.tipo_servicio || "--"}</td>
                  <td>${s.descripcion || "--"}</td>
                  <td>Q${(s.monto_material || 0).toFixed(2)}</td>
                  <td>Q${(s.monto_mano_obra || 0).toFixed(2)}</td>
                  <td><strong>Q${(s.total || 0).toFixed(2)}</strong></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

    const modalContent = `
      <div class="modal-header">
        <h5 class="modal-title">Venta #${venta.id}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="row mb-3">
          <div class="col-md-6">
            <strong>Cliente:</strong>
            <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${venta.id_cliente})">
              ${nombreCliente}
            </button>
          </div>
          <div class="col-md-6"><strong>Fecha:</strong> ${venta.fecha ? new Date(venta.fecha).toLocaleString() : "--"}</div>
        </div>
        <div class="row mb-3">
          <div class="col-md-4"><strong>Subtotal:</strong> Q${(venta.subtotal || 0).toFixed(2)}</div>
          <div class="col-md-4"><strong>Total:</strong> Q${(venta.total || 0).toFixed(2)}</div>
          <div class="col-md-4"><strong>Saldo:</strong> Q${saldo.toFixed(2)}</div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6"><strong>Descuento:</strong> ${venta.descuento_porcentaje || 0}%</div>
          <div class="col-md-6">
            <strong>Estado Pago:</strong>
            <span class="badge ${pagada ? "bg-success" : "bg-danger"}">
              ${pagada ? "Pagada" : "Pendiente"}
            </span>
          </div>
        </div>
        ${venta.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${venta.observaciones}</div>` : ""}

        <h6 class="fw-bold mt-3">Detalles</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}</tbody>
          </table>
        </div>

        <h6 class="fw-bold mt-3">Pagos</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead><tr><th>Tipo</th><th>Monto</th><th>Referencia</th></tr></thead>
            <tbody>${pagosHtml || '<tr><td colspan="3" class="text-center">Sin pagos</td></tr>'}</tbody>
          </table>
        </div>

        <h6 class="fw-bold mt-3">Servicios Adicionales</h6>
        ${serviciosHtml}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>
    `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "ventaDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver venta", "error");
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

// ============================================================
// PESTAÑA: COTIZACIONES
// ============================================================
async function cargarSubCotizaciones() {
  const container = document.getElementById("cotizacionesSubContainer");
  if (!container) return;

  try {
    const cotizaciones = await api.request("/cotizaciones/").catch(() => []);
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

  // Llenar selects
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

  // Evento para precio: onchange en vez de addEventListener, para no
  // acumular listeners duplicados cada vez que se abre el modal.
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
    const result = await api.request("/cotizaciones/", "POST", data);
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
    await api.request(`/cotizaciones/${id}/estado`, "PATCH", {
      estado: "Aprobada",
    });
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
    await api.request(`/cotizaciones/${id}/estado`, "PATCH", {
      estado: "Rechazada",
    });
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
      .request("/servicios-adicionales/")
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

function renderServiciosRows(servicios) {
  if (!servicios || servicios.length === 0) {
    return `<tr><td colspan="9" class="text-center">No hay servicios</td></tr>`;
  }

  return servicios
    .map((s) => {
      const cliente = (window.clientesData || []).find(
        (c) => c.id === s.id_cliente,
      );
      const nombreCliente = cliente ? cliente.nombre : "--";
      return `
      <tr>
        <td>${s.id}</td>
        <td>${s.id_venta ? `<button class="btn btn-link btn-sm p-0" onclick="verVenta(${s.id_venta})">#${s.id_venta}</button>` : "--"}</td>
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
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarServicio(${s.id})">
            <i class="fas fa-times"></i>
          </button>
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
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Cliente *</label>
                  <select class="form-select" id="servicioCliente" required>
                    <option value="">Seleccionar cliente</option>
                    ${(window.clientesData || [])
                      .map(
                        (c) => `
                      <option value="${c.id}" ${c.activo !== 0 ? "" : "disabled"}>
                        ${c.nombre} ${c.activo === 0 ? "(Inactivo)" : ""}
                      </option>
                    `,
                      )
                      .join("")}
                  </select>
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
                      <option value="${v.id}">#${v.id} - ${(window.clientesData || []).find((c) => c.id === v.id_cliente)?.nombre || "Sin cliente"}</option>
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
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Reparación">Reparación</option>
                    <option value="Instalación">Instalación</option>
                    <option value="Consultoría">Consultoría</option>
                    <option value="Capacitación">Capacitación</option>
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
                  <input type="text" class="form-control" id="servicioTotal" value="Q0.00" readonly>
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
              <button type="submit" class="btn btn-info">Guardar Servicio</button>
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

  const data = {
    id_cliente,
    id_venta,
    tipo_servicio,
    descripcion,
    monto_material,
    monto_mano_obra,
    detalles: detalles
      ? [{ material: detalles, cantidad: 1, costo_unitario: 0 }]
      : [],
  };

  try {
    await api.request("/servicios-adicionales/", "POST", data);
    showToast("Servicio creado correctamente", "success");
    bootstrap.Modal.getInstance(
      document.getElementById("servicioModal"),
    ).hide();
    await loadVentasModule();
  } catch (error) {
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
// PESTAÑA: VENDEDORES
// ============================================================
async function cargarSubVendedores() {
  const container = document.getElementById("vendedoresSubContainer");
  if (!container) return;

  try {
    const empleados = await api.getEmpleados().catch(() => []);
    vendedoresData = empleados.filter(
      (e) => e.id_rol === 3 || e.rol === "vendedor",
    );

    if (!vendedoresData || vendedoresData.length === 0) {
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
      </div>
      <div class="table-responsive">
        <table class="table table-hover table-striped">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>DPI</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Fecha Contratación</th>
              <th>Ventas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

    vendedoresData.forEach((v) => {
      const ventasVendedor = ventasData.filter(
        (venta) => venta.id_usuario === v.id_usuario,
      );
      const activo = v.activo !== 0;
      html += `
        <tr>
          <td>${v.id}</td>
          <td><strong>${v.nombre || "--"}</strong></td>
          <td>${v.dpi || "--"}</td>
          <td>${v.telefono || "--"}</td>
          <td>${v.email || "--"}</td>
          <td>${v.fecha_contratacion ? new Date(v.fecha_contratacion).toLocaleDateString() : "--"}</td>
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
        <small class="text-muted">Total: ${vendedoresData.length} vendedores</small>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
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

async function cargarSubCajaBasico() {
  try {
    const turnos = await api.getCajaTurnos().catch(() => []);
    const tiposPago = await api.getTiposPago().catch(() => []);
    const ubicaciones = await api.request("/ubicaciones").catch(() => []);
    window.turnosActivos = turnos.filter((t) => t.estado === "abierto");
    window.tiposPagoData = tiposPago;
    window.ubicacionesData = ubicaciones;
    return {
      turnos: window.turnosActivos,
      tiposPago: window.tiposPagoData,
      ubicaciones: window.ubicacionesData,
    };
  } catch (error) {
    console.error("Error cargando datos de caja:", error);
    return { turnos: [], tiposPago: [], ubicaciones: [] };
  }
}

// ============================================================
// VER FICHA PRODUCTO
// ============================================================
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
// FUNCIONES CLIENTES SUBMODAL (placeholder)
// ============================================================
function showCreateClienteSubModal() {
  showToast("Función en desarrollo", "info");
}

function showEditClienteSubModal(id) {
  showToast("Función en desarrollo", "info");
}

function deleteClienteSub(id) {
  showToast("Función en desarrollo", "info");
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
window.agregarPagoVenta = agregarPagoVenta;
window.eliminarPagoVenta = eliminarPagoVenta;
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
