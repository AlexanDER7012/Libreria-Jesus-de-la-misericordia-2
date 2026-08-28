// inventario.js

let movimientosData = [];
let tiposMovimientoData = [];
let inventarioFisicoData = [];
let trasladosData = [];
let alertasData = [];

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function mostrarErrorCampo(id, mensaje) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("is-invalid");
    const errorEl = document.getElementById(id + "Error");
    if (errorEl) errorEl.textContent = mensaje;
  }
}

function limpiarErrorCampo(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("is-invalid");
    const errorEl = document.getElementById(id + "Error");
    if (errorEl) errorEl.textContent = "";
  }
}

function limpiarErroresFormulario(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form
      .querySelectorAll(".is-invalid")
      .forEach((el) => el.classList.remove("is-invalid"));
    form
      .querySelectorAll(".invalid-feedback")
      .forEach((el) => (el.textContent = ""));
  }
}

function showToast(mensaje, tipo = "success") {
  // Crear contenedor de toasts en la parte superior derecha
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "9999";
    document.body.appendChild(toastContainer);
  }

  const colors = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  };

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white ${colors[tipo] || colors.success} border-0`;
  toast.role = "alert";
  toast.setAttribute("data-bs-delay", "3000");
  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensaje}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

function mostrarConfirmacion(titulo, mensaje) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "confirmModal";
    modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${mensaje}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="confirmYes">Confirmar</button>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    document.getElementById("confirmYes").addEventListener("click", () => {
      modalInstance.hide();
      setTimeout(() => modal.remove(), 300);
      resolve(true);
    });
    modal.addEventListener("hidden.bs.modal", () => {
      setTimeout(() => modal.remove(), 300);
      resolve(false);
    });
  });
}

// =============================================
// EXTENDER API
// =============================================

// Función para obtener productos desde el backend
async function obtenerProductosParaInventario() {
  try {
    if (window.productosData && window.productosData.length > 0) {
      return window.productosData;
    }

    const productos = await api.getProductos();
    window.productosData = productos || [];

    // Guardar en localStorage como backup
    try {
      localStorage.setItem(
        "productos_backup",
        JSON.stringify(window.productosData),
      );
    } catch (e) {}

    return window.productosData;
  } catch (error) {
    console.error("Error cargando productos:", error);
    try {
      const backup = localStorage.getItem("productos_backup");
      if (backup) {
        const parsed = JSON.parse(backup);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.productosData = parsed;
          return window.productosData;
        }
      }
    } catch (e) {}
    return [];
  }
}

if (typeof api !== "undefined") {
  api.getMovimientosInventario = function () {
    return this.request("/movimientos-inventario", "GET");
  };

  api.createMovimientoInventario = function (data) {
    return this.request("/movimientos-inventario", "POST", data);
  };

  api.getTiposMovimiento = function () {
    return this.request("/tipos-movimiento", "GET");
  };

  api.getInventarioFisico = function () {
    return this.request("/inventario-fisico", "GET");
  };

  api.getTraslados = function () {
    return this.request("/traslados", "GET");
  };

  api.getAlertasStock = function () {
    return this.request("/alertas", "GET").catch(() => {
      return this.request("/alertas-stock", "GET").catch(() => {
        console.warn("No se pudieron cargar las alertas");
        return [];
      });
    });
  };
}

// =============================================
// CARGA DEL MÓDULO PRINCIPAL
// =============================================

async function loadInventarioModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  // Cargar productos primero
  await obtenerProductosParaInventario();

  // Debug: mostrar productos cargados
  console.log("Productos cargados:", window.productosData);

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-warehouse me-2 text-secondary"></i>Inventario</h4>
            <div>
                <button class="btn btn-primary btn-sm me-2" onclick="showMovimientoModal()">
                    <i class="fas fa-exchange-alt me-1"></i>Movimiento
                </button>
                <button class="btn btn-warning btn-sm me-2" onclick="showConteoFisicoModal()">
                    <i class="fas fa-clipboard-list me-1"></i>Conteo Físico
                </button>
                <button class="btn btn-info btn-sm" onclick="showTrasladoModal()">
                    <i class="fas fa-arrows-alt-h me-1"></i>Traslado
                </button>
            </div>
        </div>

        <ul class="nav nav-tabs mb-3" id="inventarioTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" id="tab-movimientos" data-bs-toggle="tab"
                        data-bs-target="#panel-movimientos" type="button" role="tab">
                    <i class="fas fa-exchange-alt me-1"></i>Movimientos
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-conteo" data-bs-toggle="tab"
                        data-bs-target="#panel-conteo" type="button" role="tab">
                    <i class="fas fa-clipboard-list me-1"></i>Conteo Físico
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-traslados" data-bs-toggle="tab"
                        data-bs-target="#panel-traslados" type="button" role="tab">
                    <i class="fas fa-arrows-alt-h me-1"></i>Traslados
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-alertas" data-bs-toggle="tab"
                        data-bs-target="#panel-alertas" type="button" role="tab">
                    <i class="fas fa-exclamation-triangle me-1"></i>Alertas
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-tipos-movimiento" data-bs-toggle="tab"
                        data-bs-target="#panel-tipos-movimiento" type="button" role="tab">
                    <i class="fas fa-tags me-1"></i>Tipos de Movimiento
                </button>
            </li>
        </ul>

        <div class="tab-content" id="inventarioTabContent">
            <div class="tab-pane fade show active" id="panel-movimientos" role="tabpanel">
                <div id="movimientosContainer"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando movimientos...</p></div></div>
            </div>
            <div class="tab-pane fade" id="panel-conteo" role="tabpanel">
                <div id="conteoContainer"><div class="text-center py-5"><div class="spinner-border text-warning" role="status"></div><p class="mt-2 text-muted">Cargando conteos físicos...</p></div></div>
            </div>
            <div class="tab-pane fade" id="panel-traslados" role="tabpanel">
                <div id="trasladosContainer"><div class="text-center py-5"><div class="spinner-border text-info" role="status"></div><p class="mt-2 text-muted">Cargando traslados...</p></div></div>
            </div>
            <div class="tab-pane fade" id="panel-alertas" role="tabpanel">
                <div id="alertasContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando alertas...</p></div></div>
            </div>
            <div class="tab-pane fade" id="panel-tipos-movimiento" role="tabpanel">
                <div id="tiposMovimientoContainer"><div class="text-center py-5"><div class="spinner-border text-success" role="status"></div><p class="mt-2 text-muted">Cargando tipos de movimiento...</p></div></div>
            </div>
        </div>
    `;

  crearModalesInventario();

  // Asegurar que window.ubicacionesData tenga datos
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

  try {
    // Cargar datos
    const [movimientos, tiposMov, conteo, traslados] = await Promise.all([
      api.getMovimientosInventario().catch(() => []),
      api.getTiposMovimiento().catch(() => []),
      api.getInventarioFisico().catch(() => []),
      api.getTraslados().catch(() => []),
    ]);

    movimientosData = movimientos || [];
    tiposMovimientoData = tiposMov || [];
    inventarioFisicoData = conteo || [];
    trasladosData = traslados || [];

    // Debug: mostrar movimientos y sus IDs
    console.log("Movimientos:", movimientosData);
    console.log(
      "IDs de productos en movimientos:",
      movimientosData.map((m) => ({
        id: m.id,
        id_producto: m.id_producto,
        tipo: typeof m.id_producto,
      })),
    );

    // Cargar alertas por separado
    try {
      alertasData = (await api.getAlertasStock()) || [];
    } catch (error) {
      console.warn("Error cargando alertas:", error);
      alertasData = [];
    }

    renderMovimientos(movimientosData);
    renderConteoFisico(inventarioFisicoData);
    renderTraslados(trasladosData);
    renderAlertas(alertasData);
    renderTiposMovimiento(tiposMovimientoData);

    populateSelectsInventario();
  } catch (error) {
    console.error("Error cargando inventario:", error);
    document.getElementById("movimientosContainer").innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar datos: ${error.message}
            </div>
        `;
  }
}

// =============================================
// POBLAR SELECTS
// =============================================

function populateSelectsInventario() {
  const productos = window.productosData || [];

  // Debug
  console.log("Poblando selects con productos:", productos);

  const productSelects = document.querySelectorAll(".inv-producto-select");
  productSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    productos.forEach((p) => {
      select.innerHTML += `<option value="${p.id}">${p.codigo || ""} - ${p.nombre} (Stock: ${p.stock_actual || 0})</option>`;
    });
  });

  const tipoSelects = document.querySelectorAll(".inv-tipo-movimiento");
  tipoSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar tipo</option>';
    tiposMovimientoData.forEach((t) => {
      select.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });
  });

  const ubicacionSelects = document.querySelectorAll(".inv-ubicacion-select");
  ubicacionSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar ubicación</option>';
    (window.ubicacionesData || []).forEach((u) => {
      select.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
    });
  });
}

// =============================================
// CREAR MODALES
// =============================================

function crearModalesInventario() {
  // Modal Movimiento
  if (!document.getElementById("movimientoModal")) {
    const html = `
            <div class="modal fade" id="movimientoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nuevo Movimiento de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="movimientoForm" novalidate>
                                <input type="hidden" id="movimientoId" />
                                <div class="mb-3">
                                    <label class="form-label">Producto *</label>
                                    <select class="form-select inv-producto-select" id="movimientoProducto" required></select>
                                    <div class="invalid-feedback" id="movimientoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Tipo de Movimiento *</label>
                                    <select class="form-select inv-tipo-movimiento" id="movimientoTipo" required></select>
                                    <div class="invalid-feedback" id="movimientoTipoError">Seleccione un tipo</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Cantidad *</label>
                                    <input type="number" step="0.01" class="form-control" id="movimientoCantidad" required />
                                    <div class="invalid-feedback" id="movimientoCantidadError">Ingrese una cantidad válida</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Motivo / Observación</label>
                                    <textarea class="form-control" id="movimientoObservacion" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Guardar Movimiento</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("movimientoForm").onsubmit = saveMovimiento;
  }

  // Modal Conteo Físico
  if (!document.getElementById("conteoModal")) {
    const html = `
            <div class="modal fade" id="conteoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Conteo Físico de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="conteoForm" novalidate>
                                <input type="hidden" id="conteoId" />
                                <div class="mb-3">
                                    <label class="form-label">Producto *</label>
                                    <select class="form-select inv-producto-select" id="conteoProducto" required></select>
                                    <div class="invalid-feedback" id="conteoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación *</label>
                                    <select class="form-select inv-ubicacion-select" id="conteoUbicacion" required></select>
                                    <div class="invalid-feedback" id="conteoUbicacionError">Seleccione una ubicación</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Cantidad Contada *</label>
                                    <input type="number" step="0.01" class="form-control" id="conteoCantidad" required />
                                    <div class="invalid-feedback" id="conteoCantidadError">Ingrese una cantidad válida</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Stock en Sistema</label>
                                    <input type="number" step="0.01" class="form-control" id="conteoStockSistema" readonly />
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="conteoObservacion" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-warning w-100">Guardar Conteo</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("conteoForm").onsubmit = saveConteoFisico;

    document
      .getElementById("conteoProducto")
      .addEventListener("change", function () {
        const producto = (window.productosData || []).find(
          (p) => String(p.id) === String(this.value),
        );
        document.getElementById("conteoStockSistema").value = producto
          ? producto.stock_actual || 0
          : 0;
      });
  }

  // Modal Traslado
  if (!document.getElementById("trasladoModal")) {
    const html = `
            <div class="modal fade" id="trasladoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Traslado de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="trasladoForm" novalidate>
                                <input type="hidden" id="trasladoId" />
                                <div class="mb-3">
                                    <label class="form-label">Producto *</label>
                                    <select class="form-select inv-producto-select" id="trasladoProducto" required></select>
                                    <div class="invalid-feedback" id="trasladoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación Origen *</label>
                                    <select class="form-select inv-ubicacion-select" id="trasladoOrigen" required></select>
                                    <div class="invalid-feedback" id="trasladoOrigenError">Seleccione una ubicación</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación Destino *</label>
                                    <select class="form-select inv-ubicacion-select" id="trasladoDestino" required></select>
                                    <div class="invalid-feedback" id="trasladoDestinoError">Seleccione una ubicación</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Cantidad *</label>
                                    <input type="number" step="0.01" class="form-control" id="trasladoCantidad" required />
                                    <div class="invalid-feedback" id="trasladoCantidadError">Ingrese una cantidad válida</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="trasladoObservacion" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-info w-100">Guardar Traslado</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("trasladoForm").onsubmit = saveTraslado;
  }

  // Modal Tipo de Movimiento
  if (!document.getElementById("tipoMovimientoModal")) {
    const html = `
            <div class="modal fade" id="tipoMovimientoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="tipoMovimientoModalTitle">Tipo de Movimiento</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="tipoMovimientoForm" novalidate>
                                <input type="hidden" id="tipoMovimientoId" />
                                <div class="mb-3">
                                    <label class="form-label">Nombre *</label>
                                    <input type="text" class="form-control" id="tipoMovimientoNombre" required />
                                    <div class="invalid-feedback" id="tipoMovimientoNombreError">El nombre es obligatorio</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Descripción</label>
                                    <input type="text" class="form-control" id="tipoMovimientoDescripcion" />
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Signo</label>
                                    <select class="form-select" id="tipoMovimientoSigno">
                                        <option value="+">Entrada (+)</option>
                                        <option value="-">Salida (-)</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-success w-100">Guardar</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("tipoMovimientoForm").onsubmit = saveTipoMovimiento;
  }
}

// =============================================
// FUNCIONES PARA ABRIR MODALES
// =============================================

function showMovimientoModal() {
  const modal = document.getElementById("movimientoModal");
  if (!modal) {
    crearModalesInventario();
    setTimeout(() => showMovimientoModal(), 100);
    return;
  }
  document.getElementById("movimientoForm").reset();
  document.getElementById("movimientoId").value = "";
  limpiarErroresFormulario("movimientoForm");
  populateSelectsInventario();
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function showConteoFisicoModal() {
  const modal = document.getElementById("conteoModal");
  if (!modal) {
    crearModalesInventario();
    setTimeout(() => showConteoFisicoModal(), 100);
    return;
  }
  document.getElementById("conteoForm").reset();
  document.getElementById("conteoId").value = "";
  document.getElementById("conteoStockSistema").value = 0;
  limpiarErroresFormulario("conteoForm");
  populateSelectsInventario();
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function showTrasladoModal() {
  const modal = document.getElementById("trasladoModal");
  if (!modal) {
    crearModalesInventario();
    setTimeout(() => showTrasladoModal(), 100);
    return;
  }
  document.getElementById("trasladoForm").reset();
  document.getElementById("trasladoId").value = "";
  limpiarErroresFormulario("trasladoForm");
  populateSelectsInventario();
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// =============================================
// GUARDAR MOVIMIENTO
// =============================================

async function saveMovimiento(event) {
  event.preventDefault();

  let valid = true;

  const idProducto = parseInt(
    document.getElementById("movimientoProducto").value,
  );
  if (!idProducto) {
    mostrarErrorCampo("movimientoProducto", "Seleccione un producto");
    valid = false;
  } else {
    limpiarErrorCampo("movimientoProducto");
  }

  const idTipo = parseInt(document.getElementById("movimientoTipo").value);
  if (!idTipo) {
    mostrarErrorCampo("movimientoTipo", "Seleccione un tipo de movimiento");
    valid = false;
  } else {
    limpiarErrorCampo("movimientoTipo");
  }

  const cantidad = parseFloat(
    document.getElementById("movimientoCantidad").value,
  );
  if (!cantidad || cantidad <= 0) {
    mostrarErrorCampo("movimientoCantidad", "Ingrese una cantidad válida");
    valid = false;
  } else {
    limpiarErrorCampo("movimientoCantidad");
  }

  if (!valid) return;

  const data = {
    id_producto: idProducto,
    id_tipo_movimiento: idTipo,
    cantidad: cantidad,
    observacion:
      document.getElementById("movimientoObservacion").value.trim() || null,
  };

  try {
    const result = await api.request("/movimientos-inventario", "POST", data);
    showToast(`Movimiento #${result.id} registrado correctamente`, "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("movimientoModal"),
    );
    if (modal) modal.hide();

    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar movimiento", "error");
  }
}

// =============================================
// GUARDAR CONTEO FÍSICO
// =============================================

async function saveConteoFisico(event) {
  event.preventDefault();

  let valid = true;

  const idProducto = parseInt(document.getElementById("conteoProducto").value);
  if (!idProducto) {
    mostrarErrorCampo("conteoProducto", "Seleccione un producto");
    valid = false;
  } else {
    limpiarErrorCampo("conteoProducto");
  }

  const idUbicacion = parseInt(
    document.getElementById("conteoUbicacion").value,
  );
  if (!idUbicacion) {
    mostrarErrorCampo("conteoUbicacion", "Seleccione una ubicación");
    valid = false;
  } else {
    limpiarErrorCampo("conteoUbicacion");
  }

  const cantidad = parseFloat(document.getElementById("conteoCantidad").value);
  if (!cantidad || cantidad < 0) {
    mostrarErrorCampo("conteoCantidad", "Ingrese una cantidad válida");
    valid = false;
  } else {
    limpiarErrorCampo("conteoCantidad");
  }

  if (!valid) return;

  const data = {
    id_producto: idProducto,
    id_ubicacion: idUbicacion,
    cantidad_contada: cantidad,
    observaciones:
      document.getElementById("conteoObservacion").value.trim() || null,
  };

  try {
    await api.request("/inventario-fisico", "POST", data);
    showToast("Conteo físico registrado correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("conteoModal"),
    );
    if (modal) modal.hide();

    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar conteo", "error");
  }
}

// =============================================
// GUARDAR TRASLADO
// =============================================

async function saveTraslado(event) {
  event.preventDefault();

  let valid = true;

  const idProducto = parseInt(
    document.getElementById("trasladoProducto").value,
  );
  if (!idProducto) {
    mostrarErrorCampo("trasladoProducto", "Seleccione un producto");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoProducto");
  }

  const idOrigen = parseInt(document.getElementById("trasladoOrigen").value);
  if (!idOrigen) {
    mostrarErrorCampo("trasladoOrigen", "Seleccione una ubicación origen");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoOrigen");
  }

  const idDestino = parseInt(document.getElementById("trasladoDestino").value);
  if (!idDestino) {
    mostrarErrorCampo("trasladoDestino", "Seleccione una ubicación destino");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoDestino");
  }

  if (idOrigen === idDestino) {
    mostrarErrorCampo(
      "trasladoDestino",
      "Origen y destino no pueden ser iguales",
    );
    valid = false;
  }

  const cantidad = parseFloat(
    document.getElementById("trasladoCantidad").value,
  );
  if (!cantidad || cantidad <= 0) {
    mostrarErrorCampo("trasladoCantidad", "Ingrese una cantidad válida");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoCantidad");
  }

  if (!valid) return;

  const data = {
    id_producto: idProducto,
    id_ubicacion_origen: idOrigen,
    id_ubicacion_destino: idDestino,
    cantidad: cantidad,
    observaciones:
      document.getElementById("trasladoObservacion").value.trim() || null,
  };

  try {
    await api.request("/traslados", "POST", data);
    showToast("Traslado registrado correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("trasladoModal"),
    );
    if (modal) modal.hide();

    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar traslado", "error");
  }
}

// =============================================
// RENDER: MOVIMIENTOS
// =============================================
function renderMovimientos(movimientos) {
  const container = document.getElementById("movimientosContainer");
  if (!container) return;

  if (!movimientos || movimientos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exchange-alt fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay movimientos registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showMovimientoModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Movimiento
                </button>
            </div>
        `;
    return;
  }

  // ✅ Crear un mapa de productos para búsqueda rápida
  const productosMap = {};
  (window.productosData || []).forEach((p) => {
    productosMap[String(p.id)] = p;
    productosMap[Number(p.id)] = p;
    // También buscar por nombre (en minúsculas)
    if (p.nombre) {
      productosMap[p.nombre.toLowerCase()] = p;
    }
  });

  let html = `
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Stock Actual</th>
                        <th>Fecha</th>
                        <th>Observación</th>
                    </tr>
                </thead>
                <tbody>
    `;

  movimientos.forEach((m) => {
    // ✅ OBTENER DATOS DESDE LA OBSERVACIÓN
    let observacion = m.observacion || m.observaciones || m.referencia || "--";
    let nombreProducto = "Producto desconocido";
    let idProducto = null;

    // ✅ Extraer nombre del producto de la observación
    // Formato: "Compra #6 - Cuaderno Líneas 100" o "Compra #6 - Cuaderno Líneas 100"
    if (observacion && observacion.includes("-")) {
      const partes = observacion.split("-");
      if (partes.length > 1) {
        nombreProducto = partes[1].trim();
      }
    }

    // ✅ Buscar producto por nombre
    let producto = null;
    if (nombreProducto && nombreProducto !== "Producto desconocido") {
      // Buscar por nombre exacto (ignorando mayúsculas)
      producto = productosMap[nombreProducto.toLowerCase()];

      // Si no se encuentra, buscar que contenga el nombre
      if (!producto) {
        producto = (window.productosData || []).find(
          (p) =>
            p.nombre &&
            nombreProducto &&
            p.nombre.toLowerCase().includes(nombreProducto.toLowerCase()),
        );
      }

      // Si se encuentra, obtener su ID
      if (producto) {
        idProducto = producto.id;
      }
    }

    // ✅ Si no se encontró por nombre, intentar por ID directo
    if (!producto) {
      // Intentar obtener ID desde diferentes campos
      idProducto = m.id_producto || m.idProducto || m.producto_id;

      // Si no hay ID directo, intentar desde detalles
      if (!idProducto && m.detalles && m.detalles.length > 0) {
        idProducto = m.detalles[0].id_producto || m.detalles[0].idProducto;
      }

      if (idProducto) {
        producto =
          productosMap[String(idProducto)] || productosMap[Number(idProducto)];
        if (producto) {
          nombreProducto = producto.nombre;
        }
      }
    }

    // ✅ Buscar el tipo de movimiento
    const tipo = tiposMovimientoData.find((t) => t.id === m.id_tipo_movimiento);
    const esEntrada = tipo
      ? tipo.signo === 1
      : observacion.toLowerCase().includes("compra");

    // ✅ Cantidad
    let cantidad = m.cantidad || 0;
    if (!cantidad && m.detalles && m.detalles.length > 0) {
      cantidad = m.detalles[0].cantidad || 0;
    }

    // ✅ Stock actual
    let stockActual = m.stock_actual || m.stockActual || 0;

    // ✅ Formato de cantidad
    let cantidadMostrada = cantidad || 0;
    let claseCantidad = "";
    if (esEntrada) {
      cantidadMostrada = `+ ${cantidad || 0}`;
      claseCantidad = "text-success";
    } else {
      cantidadMostrada = `- ${cantidad || 0}`;
      claseCantidad = "text-danger";
    }

    // ✅ Fecha
    let fecha = m.fecha || m.fecha_registro || null;
    if (fecha) {
      try {
        fecha = new Date(fecha).toLocaleString();
      } catch (e) {
        fecha = "--";
      }
    } else {
      fecha = "--";
    }

    let tipoNombre = tipo ? tipo.nombre : "Sin tipo";
    let tipoBadge = esEntrada ? "bg-success" : "bg-danger";
    const badgeNoEncontrado = !producto
      ? ' <span class="badge bg-warning ms-1">⚠️ No en catálogo</span>'
      : "";

    html += `
            <tr>
                <td>${m.id}</td>
                <td>
                    <strong>${nombreProducto}</strong>${badgeNoEncontrado}
                    ${idProducto ? `<br><small class="text-muted">ID: ${idProducto}</small>` : ""}
                </td>
                <td>
                    <span class="badge ${tipoBadge}">
                        ${tipoNombre}
                    </span>
                </td>
                <td class="${claseCantidad} fw-bold">
                    ${cantidadMostrada}
                </td>
                <td>${stockActual}</td>
                <td>${fecha}</td>
                <td><small>${observacion}</small></td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${movimientos.length} movimientos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// RENDER: CONTEO FÍSICO
// =============================================

function renderConteoFisico(conteos) {
  const container = document.getElementById("conteoContainer");
  if (!container) return;

  if (!conteos || conteos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay conteos físicos registrados</p>
                <button class="btn btn-warning btn-sm" onclick="showConteoFisicoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Conteo
                </button>
            </div>
        `;
    return;
  }

  const productosMap = {};
  (window.productosData || []).forEach((p) => {
    productosMap[String(p.id)] = p;
    productosMap[Number(p.id)] = p;
  });

  const ubicacionesMap = {};
  (window.ubicacionesData || []).forEach((u) => {
    ubicacionesMap[String(u.id)] = u;
    ubicacionesMap[Number(u.id)] = u;
  });

  let html = `
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Ubicación</th>
                        <th>Cantidad Contada</th>
                        <th>Stock Sistema</th>
                        <th>Diferencia</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
    `;

  conteos.forEach((c) => {
    const producto =
      productosMap[String(c.id_producto)] ||
      productosMap[Number(c.id_producto)];
    const ubicacion =
      ubicacionesMap[String(c.id_ubicacion)] ||
      ubicacionesMap[Number(c.id_ubicacion)];
    const diferencia = (c.cantidad_contada || 0) - (c.stock_sistema || 0);
    const esDiferencia = diferencia !== 0;

    html += `
            <tr>
                <td>${c.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>${ubicacion ? ubicacion.nombre || ubicacion.id : "--"}</td>
                <td>${c.cantidad_contada || 0}</td>
                <td>${c.stock_sistema || 0}</td>
                <td class="${esDiferencia ? (diferencia > 0 ? "text-success" : "text-danger") : ""}">
                    ${diferencia !== 0 ? (diferencia > 0 ? "+" : "") + diferencia : "0"}
                </td>
                <td>${c.fecha ? new Date(c.fecha).toLocaleString() : "--"}</td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${conteos.length} conteos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// RENDER: TRASLADOS
// =============================================

function renderTraslados(traslados) {
  const container = document.getElementById("trasladosContainer");
  if (!container) return;

  if (!traslados || traslados.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-arrows-alt-h fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay traslados registrados</p>
                <button class="btn btn-info btn-sm" onclick="showTrasladoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Traslado
                </button>
            </div>
        `;
    return;
  }

  const productosMap = {};
  (window.productosData || []).forEach((p) => {
    productosMap[String(p.id)] = p;
    productosMap[Number(p.id)] = p;
  });

  const ubicacionesMap = {};
  (window.ubicacionesData || []).forEach((u) => {
    ubicacionesMap[String(u.id)] = u;
    ubicacionesMap[Number(u.id)] = u;
  });

  let html = `
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
    `;

  traslados.forEach((t) => {
    const producto =
      productosMap[String(t.id_producto)] ||
      productosMap[Number(t.id_producto)];
    const origen =
      ubicacionesMap[String(t.id_ubicacion_origen)] ||
      ubicacionesMap[Number(t.id_ubicacion_origen)];
    const destino =
      ubicacionesMap[String(t.id_ubicacion_destino)] ||
      ubicacionesMap[Number(t.id_ubicacion_destino)];
    const estado = t.estado || "Pendiente";

    html += `
            <tr>
                <td>${t.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>${origen ? origen.nombre || origen.id : "--"}</td>
                <td>${destino ? destino.nombre || destino.id : "--"}</td>
                <td>${t.cantidad || 0}</td>
                <td>
                    <span class="badge ${estado === "Recibido" ? "bg-success" : "bg-warning"}">
                        ${estado}
                    </span>
                    ${
                      estado === "Pendiente"
                        ? `
                        <button class="btn btn-sm btn-outline-success ms-1" onclick="recibirTraslado(${t.id})">
                            <i class="fas fa-check"></i>
                        </button>
                    `
                        : ""
                    }
                </td>
                <td>${t.fecha ? new Date(t.fecha).toLocaleString() : "--"}</td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${traslados.length} traslados</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// RECIBIR TRASLADO
// =============================================

async function recibirTraslado(id) {
  const confirmado = await mostrarConfirmacion(
    "Recibir Traslado",
    "¿Confirmar recepción del traslado? Esto actualizará el stock en la ubicación destino.",
  );

  if (!confirmado) return;

  try {
    await api.request(`/traslados/${id}/recibir`, "PATCH");
    showToast("Traslado recibido correctamente", "success");
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al recibir traslado", "error");
  }
}

// =============================================
// RENDER: ALERTAS
// =============================================

function renderAlertas(alertas) {
  const container = document.getElementById("alertasContainer");
  if (!container) return;

  if (!alertas || alertas.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <p class="text-muted">No hay alertas de stock</p>
            </div>
        `;
    return;
  }

  const productosMap = {};
  (window.productosData || []).forEach((p) => {
    productosMap[String(p.id)] = p;
    productosMap[Number(p.id)] = p;
  });

  let html = `
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  alertas.forEach((a) => {
    const producto =
      productosMap[String(a.id_producto)] ||
      productosMap[Number(a.id_producto)];
    const leida = a.leida !== 0;
    const stockActual = producto ? producto.stock_actual || 0 : 0;
    const stockMinimo = producto ? producto.stock_minimo || 0 : 0;
    const yaResuelta = stockActual > stockMinimo;

    html += `
            <tr>
                <td>${a.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td class="${stockActual <= stockMinimo ? "text-danger" : "text-success"} fw-bold">
                    ${stockActual}
                </td>
                <td>${stockMinimo}</td>
                <td>
                    <span class="badge ${leida || yaResuelta ? "bg-secondary" : "bg-danger"}">
                        ${leida || yaResuelta ? "Leída" : "Pendiente"}
                    </span>
                </td>
                <td>
                    ${
                      !leida && !yaResuelta
                        ? `
                        <button class="btn btn-sm btn-outline-success" onclick="marcarAlertaLeida(${a.id})">
                            <i class="fas fa-check"></i> Marcar Leída
                        </button>
                    `
                        : `
                        <span class="text-muted small">Resuelta</span>
                    `
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
            <small class="text-muted">Total: ${alertas.length} alertas</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// MARCAR ALERTA LEÍDA (CORREGIDO)
// =============================================

async function marcarAlertaLeida(id) {
  try {
    // Intentar con PATCH a /alertas/{id}
    await api.request(`/alertas/${id}`, "PATCH", { leida: 1 });
    showToast("Alerta marcada como leída", "success");
    await loadInventarioModule();
  } catch (error1) {
    try {
      // Intentar con PATCH a /alertas/{id}/leer
      await api.request(`/alertas/${id}/leer`, "PATCH");
      showToast("Alerta marcada como leída", "success");
      await loadInventarioModule();
    } catch (error2) {
      try {
        // Intentar con PUT a /alertas/{id}
        await api.request(`/alertas/${id}`, "PUT", { leida: 1 });
        showToast("Alerta marcada como leída", "success");
        await loadInventarioModule();
      } catch (error3) {
        // Mostrar mensaje de error con la opción de marcar localmente
        const confirmado = await mostrarConfirmacion(
          "Error al marcar alerta",
          "No se pudo conectar con el servidor. ¿Deseas marcar la alerta como leída localmente?",
        );
        if (confirmado) {
          // Marcar localmente
          const alerta = alertasData.find((a) => a.id === id);
          if (alerta) {
            alerta.leida = 1;
            renderAlertas(alertasData);
            showToast("Alerta marcada como leída (solo local)", "warning");
          }
        }
      }
    }
  }
}

// =============================================
// TIPOS DE MOVIMIENTO
// =============================================

function renderTiposMovimiento(tipos) {
  const container = document.getElementById("tiposMovimientoContainer");
  if (!container) return;

  if (!tipos || tipos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay tipos de movimiento registrados</p>
                <button class="btn btn-success btn-sm" onclick="showCreateTipoMovimientoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Tipo
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Tipos de Movimiento</h6>
            <button class="btn btn-success btn-sm" onclick="showCreateTipoMovimientoModal()">
                <i class="fas fa-plus me-1"></i>Nuevo Tipo
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Signo</th>
                    </tr>
                </thead>
                <tbody>
    `;

  tipos.forEach((t) => {
    const esEntrada = t.signo === 0 || t.signo === "+";
    html += `
            <tr>
                <td>${t.id}</td>
                <td><strong>${t.nombre || "--"}</strong></td>
                <td>${t.descripcion || "--"}</td>
                <td>
                    <span class="badge ${esEntrada ? "bg-success" : "bg-danger"}">
                        ${esEntrada ? "Entrada" : "Salida"}
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
            <small class="text-muted">Total: ${tipos.length} tipos</small>
            <p class="text-muted small mt-2">
                <i class="fas fa-info-circle me-1"></i>
                Los tipos de movimiento solo se pueden crear. No se pueden modificar ni eliminar.
            </p>
        </div>
    `;

  container.innerHTML = html;
}

function showCreateTipoMovimientoModal() {
  const modal = document.getElementById("tipoMovimientoModal");
  if (!modal) {
    crearModalesInventario();
    setTimeout(() => showCreateTipoMovimientoModal(), 100);
    return;
  }

  document.getElementById("tipoMovimientoModalTitle").textContent =
    "Nuevo Tipo de Movimiento";
  document.getElementById("tipoMovimientoForm").reset();
  document.getElementById("tipoMovimientoId").value = "";
  limpiarErroresFormulario("tipoMovimientoForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveTipoMovimiento(event) {
  event.preventDefault();

  const nombre = document.getElementById("tipoMovimientoNombre").value.trim();

  if (!nombre) {
    mostrarErrorCampo("tipoMovimientoNombre", "El nombre es obligatorio");
    return;
  }
  limpiarErrorCampo("tipoMovimientoNombre");

  const signoVal = document.getElementById("tipoMovimientoSigno").value;
  const signo = signoVal === "+" ? 0 : 1;

  const data = {
    nombre: nombre,
    signo: signo,
  };

  const descripcion = document
    .getElementById("tipoMovimientoDescripcion")
    .value.trim();
  if (descripcion) {
    data.descripcion = descripcion;
  }

  try {
    await api.request("/tipos-movimiento", "POST", data);
    showToast("Tipo creado correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("tipoMovimientoModal"),
    );
    if (modal) modal.hide();

    await loadInventarioModule();
  } catch (error) {
    let msg = "Error al crear tipo";
    if (error.response && error.response.data) {
      const errData = error.response.data;
      if (errData.detail) {
        if (Array.isArray(errData.detail)) {
          msg = errData.detail.map((d) => d.msg).join(", ");
        } else {
          msg = errData.detail;
        }
      } else if (typeof errData === "object") {
        msg = Object.values(errData).flat().join(", ");
      }
    } else if (error.message && error.message !== "[object Object]") {
      msg = error.message;
    }
    showToast(msg, "error");
  }
}

function showEditTipoMovimientoModal(id) {
  showToast(
    "Los tipos de movimiento no se pueden editar. Solo se pueden crear nuevos.",
    "warning",
  );
}

async function deleteTipoMovimiento(id) {
  showToast("Los tipos de movimiento no se pueden eliminar.", "warning");
}

// =============================================
// EXPONER FUNCIONES GLOBALES
// =============================================

window.loadInventarioModule = loadInventarioModule;
window.showMovimientoModal = showMovimientoModal;
window.showConteoFisicoModal = showConteoFisicoModal;
window.showTrasladoModal = showTrasladoModal;
window.saveMovimiento = saveMovimiento;
window.saveConteoFisico = saveConteoFisico;
window.saveTraslado = saveTraslado;
window.recibirTraslado = recibirTraslado;
window.marcarAlertaLeida = marcarAlertaLeida;
window.showCreateTipoMovimientoModal = showCreateTipoMovimientoModal;
window.showEditTipoMovimientoModal = showEditTipoMovimientoModal;
window.saveTipoMovimiento = saveTipoMovimiento;
window.deleteTipoMovimiento = deleteTipoMovimiento;
window.mostrarErrorCampo = mostrarErrorCampo;
window.limpiarErrorCampo = limpiarErrorCampo;
window.limpiarErroresFormulario = limpiarErroresFormulario;
window.showToast = showToast;
window.mostrarConfirmacion = mostrarConfirmacion;
window.obtenerProductosParaInventario = obtenerProductosParaInventario;
