// inventario.js

let movimientosData = [];
let tiposMovimientoData = [];
let inventarioFisicoData = [];
let trasladosData = [];
let alertasData = [];
let filtroBusqueda = "";

// Paginación (server-side) de Conteo Físico, Traslados y Alertas
let skipConteo = 0;
const LIMITE_CONTEO = 10;
let skipTraslados = 0;
const LIMITE_TRASLADOS = 10;
let skipAlertas = 0;
const LIMITE_ALERTAS = 10;

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

async function obtenerProductosParaInventario() {
  try {
    // Siempre se piden al servidor: antes se reutilizaba la lista que ya
    // estaba en memoria y el stock mostrado podía estar desactualizado
    // (por ejemplo, decía "Agotado" aunque ya se hubiera recibido mercadería).
    const productos = await api.request("/productos?limit=200");
    window.productosData = productos || [];
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
// FUNCIÓN PARA FILTRAR PRODUCTOS
// =============================================

function filtrarProductos(productos, termino) {
  if (!termino || termino.trim() === "") {
    return productos;
  }
  const busqueda = termino.toLowerCase().trim();
  return productos.filter((p) => {
    return (
      (p.id && String(p.id).includes(busqueda)) ||
      (p.codigo && p.codigo.toLowerCase().includes(busqueda)) ||
      (p.nombre && p.nombre.toLowerCase().includes(busqueda)) ||
      (p.categoria_nombre &&
        p.categoria_nombre.toLowerCase().includes(busqueda))
    );
  });
}

// =============================================
// CARGA DEL MÓDULO PRINCIPAL
// =============================================

async function loadInventarioModule() {
  const container =
    document.getElementById("inventarioTableContainer") ||
    document.getElementById("mainContent");
  if (!container) return;

  await obtenerProductosParaInventario();
  console.log("Productos cargados:", window.productosData);

  container.innerHTML = `
          <div class="d-flex justify-content-end align-items-center mb-3">
              <div>
                  ${
                    tienePermiso("Inventario", "Crear")
                      ? `<button class="btn btn-primary btn-sm me-2" onclick="showMovimientoModal()">
                      <i class="fas fa-exchange-alt me-1"></i>Movimiento
                  </button>`
                      : ""
                  }
                  ${
                    tienePermiso("Inventario", "Crear")
                      ? `<button class="btn btn-outline-primary btn-sm me-2" onclick="showCargaMasivaMovimientosModal()">
                      <i class="fas fa-file-upload me-1"></i>Carga Masiva
                  </button>`
                      : ""
                  }
                  ${
                    tienePermiso("Inventario", "Crear")
                      ? `<button class="btn btn-warning btn-sm me-2" onclick="showConteoFisicoModal()">
                      <i class="fas fa-clipboard-list me-1"></i>Conteo Físico
                  </button>`
                      : ""
                  }
                  ${
                    tienePermiso("Inventario", "Crear")
                      ? `<button class="btn btn-info btn-sm" onclick="showTrasladoModal()">
                      <i class="fas fa-arrows-alt-h me-1"></i>Traslado
                  </button>`
                      : ""
                  }
              </div>
          </div>

          <div id="movimientosContainer">
              <div class="text-center py-5">
                  <div class="spinner-border text-primary" role="status"></div>
                  <p class="mt-2 text-muted">Cargando inventario...</p>
              </div>
          </div>
      `;

  crearModalesInventario();

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
    const [movimientos, tiposMov] = await Promise.all([
      api.getMovimientosInventario().catch(() => []),
      api.getTiposMovimiento().catch(() => []),
    ]);

    movimientosData = movimientos || [];
    tiposMovimientoData = tiposMov || [];

    // ✅ Mostrar resumen de inventario en lugar de movimientos
    renderResumenInventario();
    cargarConteoTabla();
    cargarTrasladosTabla();
    cargarAlertasTabla();
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

// ============================================================
// RECARGA ESPECÍFICA POR SECCIÓN
// ============================================================

async function recargarResumenInventario() {
  try {
    await obtenerProductosParaInventario();
    renderResumenInventario();
  } catch (error) {
    console.error("Error recargando resumen:", error);
    showToast("Error al recargar el resumen", "error");
  }
}

async function recargarConteo() {
  try {
    await cargarConteoTabla();
  } catch (error) {
    console.error("Error recargando conteo:", error);
  }
}

async function recargarTraslados() {
  try {
    await cargarTrasladosTabla();
  } catch (error) {
    console.error("Error recargando traslados:", error);
  }
}

async function recargarAlertas() {
  try {
    await cargarAlertasTabla();
  } catch (error) {
    console.error("Error recargando alertas:", error);
  }
}

async function recargarTiposMovimiento() {
  try {
    const tipos = await api.getTiposMovimiento().catch(() => []);
    tiposMovimientoData = tipos || [];
    renderTiposMovimiento(tiposMovimientoData);
    populateSelectsInventario();
  } catch (error) {
    console.error("Error recargando tipos de movimiento:", error);
  }
}

// =============================================
// FUNCIÓN PARA BUSCAR EN EL RESUMEN
// =============================================

function buscarEnInventario() {
  const input = document.getElementById("buscarInventario");
  if (input) {
    filtroBusqueda = input.value;
    renderResumenInventario();
  }
}

// =============================================
// RENDER: RESUMEN DE INVENTARIO (CON BÚSQUEDA)
// =============================================

function renderResumenInventario() {
  const container = document.getElementById("movimientosContainer");
  if (!container) return;

  const productos = window.productosData || [];
  const productosFiltrados = filtrarProductos(productos, filtroBusqueda);

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Resumen de Inventario</h6>
            <div class="d-flex gap-2 align-items-center">
                <span class="badge bg-secondary">${productosFiltrados.length} productos</span>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-6 col-lg-4">
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" id="buscarInventario" 
                           placeholder="Buscar por ID, nombre, código..." 
                           oninput="buscarEnInventario()">
                    <button class="btn btn-outline-secondary" onclick="document.getElementById('buscarInventario').value='';buscarEnInventario();">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

  if (!productos || productos.length === 0) {
    html += `
            <div class="text-center py-5">
                <i class="fas fa-box fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay productos registrados</p>
            </div>
        `;
    container.innerHTML = html;
    return;
  }

  if (productosFiltrados.length === 0) {
    html += `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">No se encontraron productos con el término "<strong>${filtroBusqueda}</strong>"</p>
            </div>
        `;
    container.innerHTML = html;
    return;
  }

  html += `
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th style="width:80px;">ID</th>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th style="width:120px;">Stock Actual</th>
                        <th style="width:100px;">Stock Mínimo</th>
                        <th style="width:100px;">Estado</th>
                        <th style="width:200px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  productosFiltrados.forEach((p) => {
    const stock = p.stock_actual || 0;
    const minStock = p.stock_minimo || 0;
    const estadoStock =
      stock === 0 ? "danger" : stock <= minStock ? "warning" : "success";
    const estadoTexto =
      stock === 0 ? "Agotado" : stock <= minStock ? "Bajo" : "Normal";

    html += `
            <tr>
                <td><code>${p.id}</code></td>
                <td><code>${p.codigo || "--"}</code></td>
                <td><strong>${p.nombre || "--"}</strong></td>
                <td>${p.categoria_nombre || p.categoria || "--"}</td>
                <td class="fw-bold text-${estadoStock}">${stock}</td>
                <td>${minStock}</td>
                <td>
                    <span class="badge bg-${estadoStock}">${estadoTexto}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verHistorialProducto(${p.id})" title="Ver historial de movimientos">
                        <i class="fas fa-history"></i> Historial
                    </button>
                    ${
                      tienePermiso("Inventario", "Crear")
                        ? `<button class="btn btn-sm btn-outline-success" onclick="showMovimientoModalConProducto(${p.id})" title="Registrar movimiento">
                        <i class="fas fa-exchange-alt"></i>
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
        <div class="text-end">
            <small class="text-muted">Total: ${productosFiltrados.length} productos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// FUNCIÓN PARA OBTENER EL USUARIO ACTUAL
// =============================================
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return { id: 1 };
  }
}

// =============================================
// FUNCIÓN PARA VER HISTORIAL DE UN PRODUCTO
// =============================================

async function verHistorialProducto(idProducto) {
  try {
    const producto = (window.productosData || []).find(
      (p) => p.id === idProducto,
    );
    if (!producto) {
      showToast("Producto no encontrado", "error");
      return;
    }

    const movimientos = await api.request(
      `/movimientos-inventario?id_producto=${idProducto}`,
    );
    const tipos = await api.getTiposMovimiento();

    let saldoAcumulado = 0;
    const movimientosConSaldo = (movimientos || []).map((m) => {
      let cantidad = 0;
      if (m.detalles && m.detalles.length > 0) {
        cantidad = m.detalles[0].cantidad || 0;
      }
      const tipo = tipos.find((t) => t.id === m.id_tipo_movimiento);
      const esEntrada = tipo ? tipo.signo === 1 : false;

      if (esEntrada) {
        saldoAcumulado += cantidad;
      } else {
        saldoAcumulado -= cantidad;
      }

      return {
        ...m,
        cantidad: cantidad,
        esEntrada: esEntrada,
        tipoNombre: tipo ? tipo.nombre : "Sin tipo",
        saldo: saldoAcumulado,
      };
    });

    mostrarHistorialModal(producto, movimientosConSaldo);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    showToast("Error al cargar el historial", "error");
  }
}

// =============================================
// MOSTRAR MODAL DE HISTORIAL
// =============================================

function mostrarHistorialModal(producto, movimientos) {
  const modalExistente = document.getElementById("historialModal");
  if (modalExistente) {
    modalExistente.remove();
  }

  let html = `
        <div class="modal fade" id="historialModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            Historial de Movimientos - ${producto.nombre}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <strong>Código:</strong> ${producto.codigo || "--"}
                            </div>
                            <div class="col-md-3">
                                <strong>Stock Actual:</strong> 
                                <span class="fw-bold text-${producto.stock_actual === 0 ? "danger" : producto.stock_actual <= 10 ? "warning" : "success"}">
                                    ${producto.stock_actual || 0}
                                </span>
                            </div>
                            <div class="col-md-3">
                                <strong>Stock Mínimo:</strong> ${producto.stock_minimo || 0}
                            </div>
                            <div class="col-md-3">
                                <strong>Total Movimientos:</strong> ${movimientos.length}
                            </div>
                        </div>
                        <hr>
                        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-hover table-striped table-sm">
                                <thead class="table-light sticky-top">
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Entrada</th>
                                        <th>Salida</th>
                                        <th>Saldo</th>
                                        <th>Observación</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;

  if (!movimientos || movimientos.length === 0) {
    html += `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x d-block mb-2"></i>
                    No hay movimientos registrados para este producto
                </td>
            </tr>
        `;
  } else {
    const movimientosOrdenados = [...movimientos].reverse();

    movimientosOrdenados.forEach((m) => {
      const fecha = m.fecha ? new Date(m.fecha).toLocaleString() : "--";
      const entrada = m.esEntrada ? m.cantidad : "-";
      const salida = !m.esEntrada ? m.cantidad : "-";
      const saldo = m.saldo || 0;
      const claseSaldo =
        saldo === 0
          ? "text-danger"
          : saldo <= 10
            ? "text-warning"
            : "text-success";
      const observacion = m.observacion || m.observaciones || "--";

      html += `
                <tr>
                    <td><small>${fecha}</small></td>
                    <td>
                        <span class="badge ${m.esEntrada ? "bg-success" : "bg-danger"}">
                            ${m.tipoNombre}
                        </span>
                    </td>
                    <td class="text-success fw-bold">${entrada !== "-" ? "+" + entrada : "-"}</td>
                    <td class="text-danger fw-bold">${salida !== "-" ? "-" + salida : "-"}</td>
                    <td class="fw-bold ${claseSaldo}">${saldo}</td>
                    <td><small>${observacion}</small></td>
                </tr>
            `;
    });
  }

  html += `
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-3 text-muted small">
                            <i class="fas fa-info-circle me-1"></i>
                            El saldo acumulado muestra el stock después de cada movimiento.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        ${
                          tienePermiso("Inventario", "Crear")
                            ? `<button class="btn btn-primary" onclick="showMovimientoModalConProducto(${producto.id})">
                            <i class="fas fa-plus me-1"></i>Nuevo Movimiento
                        </button>`
                            : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);
  const modal = new bootstrap.Modal(document.getElementById("historialModal"));
  modal.show();

  document
    .getElementById("historialModal")
    .addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
}

// =============================================
// FUNCIÓN PARA ABRIR MOVIMIENTO CON PRODUCTO PRESELECCIONADO
// =============================================

function showMovimientoModalConProducto(idProducto) {
  showMovimientoModal();
  setTimeout(() => {
    const select = document.getElementById("movimientoProducto");
    if (select) {
      select.value = idProducto;
      select.dispatchEvent(new Event("change"));
    }
  }, 300);
}

// =============================================
// POBLAR SELECTS
// =============================================

function populateSelectsInventario() {
  const productos = window.productosData || [];

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
                              <form id="movimientoForm" onsubmit="saveMovimiento(event)" novalidate>
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
                              <form id="conteoForm" onsubmit="saveConteoFisico(event)" novalidate>
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
                              <form id="trasladoForm" onsubmit="saveTraslado(event)" novalidate>
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
                              <form id="tipoMovimientoForm" onsubmit="saveTipoMovimiento(event)" novalidate>
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
  prepararEscanerInventario(
    "movimientoProducto",
    seleccionarProductoEscaneadoMovimiento,
  );
  modal.addEventListener(
    "shown.bs.modal",
    () => document.getElementById("movimientoProductoScan")?.focus(),
    { once: true },
  );
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
  prepararEscanerInventario("conteoProducto", contarProductoEscaneado);
  modal.addEventListener(
    "shown.bs.modal",
    () => document.getElementById("conteoProductoScan")?.focus(),
    { once: true },
  );
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
  prepararEscanerInventario(
    "trasladoProducto",
    seleccionarProductoEscaneadoTraslado,
  );
  modal.addEventListener(
    "shown.bs.modal",
    () => document.getElementById("trasladoProductoScan")?.focus(),
    { once: true },
  );
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// =============================================
// LECTOR DE CÓDIGO DE BARRAS (Movimiento, Conteo físico, Traslado)
// La búsqueda por código, el Enter y los avisos los maneja escaner-codigo.js
// =============================================
function prepararEscanerInventario(selectId, onProducto) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const scanId = `${selectId}Scan`;
  const infoId = `${selectId}ScanInfo`;

  if (!document.getElementById(scanId)) {
    const bloque = select.closest(".mb-3") || select;
    bloque.insertAdjacentHTML(
      "beforebegin",
      `
      <div class="mb-2">
        <div class="input-group input-group-sm">
          <span class="input-group-text"><i class="fas fa-barcode"></i></span>
          <input type="text" class="form-control" id="${scanId}"
                 placeholder="Escanea el código de barras (o escríbelo y presiona Enter)">
        </div>
        <div id="${infoId}" class="small mt-1"></div>
      </div>
    `,
    );
  }

  const info = document.getElementById(infoId);
  if (info) info.innerHTML = "";

  crearEscanerCodigo({ input: scanId, info: infoId, onProducto });
}

function _seleccionarProductoInventario(selectId, producto) {
  const select = document.getElementById(selectId);
  if (!select) return false;
  asegurarOpcionProducto(
    select,
    producto,
    `${producto.codigo || ""} - ${producto.nombre} (Stock: ${producto.stock_actual || 0})`,
  );
  select.value = String(producto.id);
  // Dispara el "change" para que se actualicen los campos que dependen del producto
  select.dispatchEvent(new Event("change"));
  return true;
}

function seleccionarProductoEscaneadoMovimiento(producto) {
  _seleccionarProductoInventario("movimientoProducto", producto);
  document.getElementById("movimientoCantidad")?.focus();
  return {
    tipo: "ok",
    texto: `${producto.nombre} seleccionado (stock actual: ${producto.stock_actual || 0})`,
  };
}

function seleccionarProductoEscaneadoTraslado(producto) {
  _seleccionarProductoInventario("trasladoProducto", producto);
  return {
    tipo: "ok",
    texto: `${producto.nombre} seleccionado (stock actual: ${producto.stock_actual || 0})`,
  };
}

// Conteo físico: el primer escaneo selecciona el producto y cuenta 1;
// cada escaneo siguiente del MISMO producto suma 1 a "Cantidad Contada".
function contarProductoEscaneado(producto) {
  const select = document.getElementById("conteoProducto");
  const cantidadInput = document.getElementById("conteoCantidad");
  if (!select || !cantidadInput) {
    return { tipo: "error", texto: "No se encontró el formulario de conteo" };
  }

  const actual = parseFloat(cantidadInput.value) || 0;
  const mismoProducto = String(select.value) === String(producto.id);

  if (!mismoProducto && select.value && actual > 0) {
    const nombreActual =
      (window.productosData || []).find(
        (p) => String(p.id) === String(select.value),
      )?.nombre || "el producto actual";
    return {
      tipo: "aviso",
      texto: `Guarda primero el conteo de ${nombreActual} antes de escanear ${producto.nombre}`,
    };
  }

  if (!mismoProducto)
    _seleccionarProductoInventario("conteoProducto", producto);
  const nuevaCantidad = (mismoProducto ? actual : 0) + 1;
  cantidadInput.value = nuevaCantidad;

  return {
    tipo: "ok",
    texto: `${producto.nombre}: contadas ${nuevaCantidad} (en sistema: ${producto.stock_actual || 0})`,
  };
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

    await recargarResumenInventario();
    await recargarTiposMovimiento();
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
  if (isNaN(cantidad) || cantidad < 0) {
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

    await recargarConteo();
    await recargarResumenInventario();
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

  // Enviar exactamente los campos que espera el backend
  const data = {
    id_producto: idProducto,
    cantidad: cantidad,
    id_ubicacion_origen: idOrigen,
    id_ubicacion_destino: idDestino,
    observaciones:
      document.getElementById("trasladoObservacion").value.trim() || null,
    id_usuario_envia: getCurrentUser()?.id || 1,
  };

  console.log("📦 Enviando traslado:", data);

  try {
    const result = await api.request("/traslados", "POST", data);
    showToast(`Traslado #${result.id} registrado correctamente`, "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("trasladoModal"),
    );
    if (modal) modal.hide();

    await recargarTraslados();
    await recargarResumenInventario();
  } catch (error) {
    console.error("❌ Error en traslado:", error);
    let msg = "Error al registrar traslado";
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
    } else if (error.message) {
      msg = error.message;
    }
    showToast(msg, "error");
  }
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
                ${
                  tienePermiso("Inventario", "Crear")
                    ? `<button class="btn btn-warning btn-sm" onclick="showConteoFisicoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Conteo
                </button>`
                    : ""
                }
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
                ${
                  tienePermiso("Inventario", "Crear")
                    ? `<button class="btn btn-info btn-sm" onclick="showTrasladoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Traslado
                </button>`
                    : ""
                }
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
                      estado === "Pendiente" &&
                      tienePermiso("Inventario", "Editar")
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
    const idUsuarioRecibe = getCurrentUser()?.id || 1;
    await api.request(
      `/traslados/${id}/confirmar-recepcion?id_usuario_recibe=${idUsuarioRecibe}`,
      "PATCH",
    );
    showToast("Traslado recibido correctamente", "success");
    await recargarTraslados();
  } catch (error) {
    console.error("❌ Error al recibir traslado:", error);
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
                      !leida &&
                      !yaResuelta &&
                      tienePermiso("Inventario", "Editar")
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
// PAGINACIÓN (server-side) DE CONTEO, TRASLADOS Y ALERTAS
// =============================================
function _agregarControlesPaginacionInventario(
  containerId,
  onAnterior,
  onSiguiente,
  skipActual,
) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.insertAdjacentHTML(
    "beforeend",
    `
        <div class="d-flex justify-content-between align-items-center mt-2">
            <button class="btn btn-sm btn-outline-secondary" onclick="${onAnterior}" ${skipActual === 0 ? "disabled" : ""}>
                <i class="fas fa-chevron-left me-1"></i>Anterior
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="${onSiguiente}">
                Siguiente<i class="fas fa-chevron-right ms-1"></i>
            </button>
        </div>
    `,
  );
}

async function cargarConteoTabla() {
  try {
    const desde = document.getElementById("conteoFechaDesde")?.value;
    const hasta = document.getElementById("conteoFechaHasta")?.value;
    let url = `/inventario-fisico?skip=${skipConteo}&limit=${LIMITE_CONTEO}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    inventarioFisicoData = (await api.request(url)) || [];
    renderConteoFisico(inventarioFisicoData);
    _agregarControlesPaginacionInventario(
      "conteoContainer",
      `skipConteo=Math.max(0,skipConteo-${LIMITE_CONTEO});cargarConteoTabla()`,
      `skipConteo+=${LIMITE_CONTEO};cargarConteoTabla()`,
      skipConteo,
    );
  } catch (error) {
    document.getElementById("conteoContainer").innerHTML =
      `<div class="alert alert-danger">${error.message}</div>`;
  }
}

async function cargarTrasladosTabla() {
  try {
    const estado = document.getElementById("trasladosFiltroEstado")?.value;
    const desde = document.getElementById("trasladosFechaDesde")?.value;
    const hasta = document.getElementById("trasladosFechaHasta")?.value;
    let url = `/traslados?skip=${skipTraslados}&limit=${LIMITE_TRASLADOS}`;
    if (estado) url += `&estado=${estado}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    trasladosData = (await api.request(url)) || [];
    renderTraslados(trasladosData);
    _agregarControlesPaginacionInventario(
      "trasladosContainer",
      `skipTraslados=Math.max(0,skipTraslados-${LIMITE_TRASLADOS});cargarTrasladosTabla()`,
      `skipTraslados+=${LIMITE_TRASLADOS};cargarTrasladosTabla()`,
      skipTraslados,
    );
  } catch (error) {
    document.getElementById("trasladosContainer").innerHTML =
      `<div class="alert alert-danger">${error.message}</div>`;
  }
}

async function cargarAlertasTabla() {
  try {
    const desde = document.getElementById("alertasFechaDesde")?.value;
    const hasta = document.getElementById("alertasFechaHasta")?.value;
    let url = `/alertas?skip=${skipAlertas}&limit=${LIMITE_ALERTAS}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    alertasData = (await api.request(url).catch(() => [])) || [];
    renderAlertas(alertasData);
    _agregarControlesPaginacionInventario(
      "alertasContainer",
      `skipAlertas=Math.max(0,skipAlertas-${LIMITE_ALERTAS});cargarAlertasTabla()`,
      `skipAlertas+=${LIMITE_ALERTAS};cargarAlertasTabla()`,
      skipAlertas,
    );
  } catch (error) {
    document.getElementById("alertasContainer").innerHTML =
      `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// =============================================
// MARCAR ALERTA LEÍDA
// =============================================

async function marcarAlertaLeida(id) {
  try {
    await api.request(`/alertas/${id}`, "PATCH", { leida: 1 });
    showToast("Alerta marcada como leída", "success");
    await recargarAlertas();
  } catch (error1) {
    try {
      await api.request(`/alertas/${id}/leer`, "PATCH");
      showToast("Alerta marcada como leída", "success");
      await recargarAlertas();
    } catch (error2) {
      try {
        await api.request(`/alertas/${id}`, "PUT", { leida: 1 });
        showToast("Alerta marcada como leída", "success");
        await recargarAlertas();
      } catch (error3) {
        const confirmado = await mostrarConfirmacion(
          "Error al marcar alerta",
          "No se pudo conectar con el servidor. ¿Deseas marcar la alerta como leída localmente?",
        );
        if (confirmado) {
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
// TIPOS DE MOVIMIENTO (CORREGIDO)
// =============================================

function renderTiposMovimiento(tipos) {
  const container = document.getElementById("tiposMovimientoContainer");
  if (!container) return;

  if (!tipos || tipos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay tipos de movimiento registrados</p>
                ${
                  tienePermiso("Inventario", "Crear")
                    ? `<button class="btn btn-success btn-sm" onclick="showCreateTipoMovimientoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Tipo
                </button>`
                    : ""
                }
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Tipos de Movimiento</h6>
            ${
              tienePermiso("Inventario", "Crear")
                ? `<button class="btn btn-success btn-sm" onclick="showCreateTipoMovimientoModal()">
                <i class="fas fa-plus me-1"></i>Nuevo Tipo
            </button>`
                : ""
            }
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
    // ✅ CORREGIDO: Interpretar correctamente los signos
    // signo = 1 → Entrada (suma stock)
    // signo = 2 → Salida (resta stock)
    // signo = 0 → Neutral (no afecta stock)
    let esEntrada = false;
    let signoTexto = "";
    let badgeClass = "";
    let badgeIcon = "";

    if (t.signo === 1) {
      esEntrada = true;
      signoTexto = "Entrada";
      badgeClass = "bg-success";
      badgeIcon = "➕";
    } else if (t.signo === 2) {
      esEntrada = false;
      signoTexto = "Salida";
      badgeClass = "bg-danger";
      badgeIcon = "➖";
    } else if (t.signo === 0) {
      esEntrada = false;
      signoTexto = "Neutral";
      badgeClass = "bg-secondary";
      badgeIcon = "⏸️";
    } else {
      signoTexto = "Desconocido";
      badgeClass = "bg-secondary";
      badgeIcon = "❓";
    }

    html += `
            <tr>
                <td><code>${t.id}</code></td>
                <td><strong>${t.nombre || "--"}</strong></td>
                <td>${t.descripcion || "--"}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${badgeIcon} ${signoTexto}
                    </span>
                    <small class="text-muted ms-1">(signo: ${t.signo})</small>
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
            <div class="mt-3 p-2 bg-light rounded">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    <strong>Leyenda:</strong>
                    <span class="badge bg-success ms-2">➕ Entrada</span> signo = 1 (suma stock)
                    <span class="badge bg-danger ms-2">➖ Salida</span> signo = 2 (resta stock)
                    <span class="badge bg-secondary ms-2">⏸️ Neutral</span> signo = 0 (no afecta stock)
                </small>
            </div>
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

// =============================================
// GUARDAR TIPO DE MOVIMIENTO (CORREGIDO)
// =============================================

async function saveTipoMovimiento(event) {
  event.preventDefault();

  const nombre = document.getElementById("tipoMovimientoNombre").value.trim();

  if (!nombre) {
    mostrarErrorCampo("tipoMovimientoNombre", "El nombre es obligatorio");
    return;
  }
  limpiarErrorCampo("tipoMovimientoNombre");

  const signoVal = document.getElementById("tipoMovimientoSigno").value;
  // ✅ CORREGIDO: + = 1 (entrada), - = 2 (salida)
  const signo = signoVal === "+" ? 1 : 2;

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

    await recargarTiposMovimiento();
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

// ============================================================
// CARGA MASIVA DE MOVIMIENTOS DE INVENTARIO
// ============================================================

let cargaMasivaMovimientosFilas = [];
let cargaMasivaMovimientosValidadas = [];

// ------------------------------------------------------------
// MODAL
// ------------------------------------------------------------
function showCargaMasivaMovimientosModal() {
  let modal = document.getElementById("cargaMasivaMovimientosModal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "cargaMasivaMovimientosModal";
  modal.setAttribute("tabindex", "-1");
  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="fas fa-file-upload me-2"></i>Carga Masiva de Movimientos
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">

          <div class="alert alert-info small">
            <strong>Formato esperado del archivo (fila de encabezados obligatoria):</strong>
            <div class="mt-1" style="font-family: monospace; font-size: 0.85rem;">
              Codigo_Producto | Tipo_Movimiento | Cantidad | Observacion
            </div>
            <ul class="mb-0 mt-2 small">
              <li><strong>Codigo_Producto:</strong> debe existir en el catálogo.</li>
              <li><strong>Tipo_Movimiento:</strong> por nombre (ej. "Entrada por compra"). Debe existir.</li>
              <li><strong>Cantidad:</strong> número positivo (el tipo define si es entrada o salida).</li>
              <li><strong>Observacion:</strong> opcional.</li>
              <li>El usuario que registra es <strong>${getCurrentUser()?.nombre_usuario || "el usuario actual"}</strong>.</li>
            </ul>
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-primary" onclick="descargarPlantillaMovimientos()">
                <i class="fas fa-download me-1"></i>Descargar plantilla
              </button>
            </div>
          </div>

          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="cmMovModoPrueba">
            <label class="form-check-label fw-bold" for="cmMovModoPrueba">
              Modo prueba (solo previsualizar, no aplicar cambios)
            </label>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Archivo Excel / CSV *</label>
            <input type="file" class="form-control" id="cmMovArchivo"
                   accept=".xlsx,.xls,.csv" onchange="procesarArchivoMovimientos(event)">
          </div>

          <div id="cmMovResumen" class="mb-2"></div>
          <div id="cmMovPreview" class="table-responsive" style="max-height:400px; overflow:auto;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button class="btn btn-primary" id="cmMovBtnConfirmar" disabled
                  onclick="confirmarCargaMasivaMovimientos()">
            <i class="fas fa-check me-1"></i>Confirmar y Crear Movimientos
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const instance = new bootstrap.Modal(modal);
  instance.show();
  modal.addEventListener("hidden.bs.modal", function () {
    this.remove();
  });
}

// ------------------------------------------------------------
// PLANTILLA
// ------------------------------------------------------------
function descargarPlantillaMovimientos() {
  const data = [
    {
      Codigo_Producto: "PROD-001",
      Tipo_Movimiento: "Entrada por compra",
      Cantidad: 50,
      Observacion: "Compra a proveedor ABC",
    },
    {
      Codigo_Producto: "PROD-002",
      Tipo_Movimiento: "Ajuste entrada",
      Cantidad: 10,
      Observacion: "Corrección de inventario físico",
    },
    {
      Codigo_Producto: "PROD-003",
      Tipo_Movimiento: "Salida por venta",
      Cantidad: 3,
      Observacion: "Venta #1234",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
  XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Movimientos.xlsx");
  showToast("Plantilla descargada", "success");
}

// ------------------------------------------------------------
// LEER ARCHIVO
// ------------------------------------------------------------
function procesarArchivoMovimientos(event) {
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

      cargaMasivaMovimientosFilas = rows;
      validarYPrevisualizarMovimientos();
    } catch (err) {
      console.error(err);
      showToast("Error al leer el archivo: " + err.message, "error");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ------------------------------------------------------------
// VALIDACIÓN Y PREVISUALIZACIÓN
// ------------------------------------------------------------
async function validarYPrevisualizarMovimientos() {
  // Refrescar tipos de movimiento por si acaso
  let tipos = tiposMovimientoData;
  if (!tipos || tipos.length === 0) {
    try {
      tipos = await api.getTiposMovimiento();
      tiposMovimientoData = tipos || [];
    } catch (e) {
      tipos = [];
    }
  }

  const productos = window.productosData || [];

  const errores = [];
  const filasValidas = [];

  cargaMasivaMovimientosFilas.forEach((row, idx) => {
    const numFila = idx + 2;
    const codigoProducto = String(row.Codigo_Producto || "").trim();
    const nombreTipo = String(row.Tipo_Movimiento || "").trim();
    const cantidad = parseFloat(row.Cantidad);
    const observacion = String(row.Observacion || "").trim() || null;

    if (!codigoProducto) {
      errores.push(`Fila ${numFila}: falta Codigo_Producto`);
      return;
    }
    if (!nombreTipo) {
      errores.push(`Fila ${numFila}: falta Tipo_Movimiento`);
      return;
    }
    if (!cantidad || cantidad <= 0 || isNaN(cantidad)) {
      errores.push(`Fila ${numFila}: cantidad inválida (${row.Cantidad})`);
      return;
    }

    // Buscar producto por código
    const producto = productos.find(
      (p) => (p.codigo || "").toLowerCase() === codigoProducto.toLowerCase(),
    );
    if (!producto) {
      errores.push(
        `Fila ${numFila}: producto "${codigoProducto}" no encontrado`,
      );
      return;
    }

    // Buscar tipo por nombre (case-insensitive)
    const tipo = tipos.find(
      (t) => (t.nombre || "").toLowerCase() === nombreTipo.toLowerCase(),
    );
    if (!tipo) {
      errores.push(
        `Fila ${numFila}: tipo de movimiento "${nombreTipo}" no encontrado`,
      );
      return;
    }

    // Interpretar signo
    let esEntrada = false;
    if (tipo.signo === 1) esEntrada = true;
    else if (tipo.signo === 2) esEntrada = false;
    else esEntrada = null; // neutral

    filasValidas.push({
      numFila,
      codigoProducto,
      producto,
      tipo,
      esEntrada,
      cantidad,
      observacion,
    });
  });

  cargaMasivaMovimientosValidadas = filasValidas;
  renderPreviewMovimientos(errores, filasValidas);

  const btn = document.getElementById("cmMovBtnConfirmar");
  if (btn) btn.disabled = errores.length > 0 || filasValidas.length === 0;
}

// ------------------------------------------------------------
// PREVISUALIZACIÓN
// ------------------------------------------------------------
function renderPreviewMovimientos(errores, filas) {
  const resumen = document.getElementById("cmMovResumen");
  const preview = document.getElementById("cmMovPreview");

  const entradas = filas.filter((f) => f.esEntrada === true).length;
  const salidas = filas.filter((f) => f.esEntrada === false).length;
  const neutrales = filas.filter((f) => f.esEntrada === null).length;

  resumen.innerHTML = `
    <div class="row g-2">
      <div class="col-md-3">
        <div class="alert alert-${filas.length ? "success" : "secondary"} py-2 mb-0">
          <strong>${filas.length}</strong> movimientos válidos
        </div>
      </div>
      <div class="col-md-3">
        <div class="alert alert-info py-2 mb-0">
          ➕ <strong>${entradas}</strong> entradas · ➖ <strong>${salidas}</strong> salidas
          ${neutrales ? ` · ⏸️ <strong>${neutrales}</strong> neutrales` : ""}
        </div>
      </div>
      <div class="col-md-3">
        <div class="alert alert-${errores.length ? "danger" : "secondary"} py-2 mb-0">
          <strong>${errores.length}</strong> errores
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

  if (filas.length === 0) {
    preview.innerHTML =
      '<p class="text-muted text-center">Sin datos para previsualizar</p>';
    return;
  }

  let html = `
    <table class="table table-sm table-striped">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Código</th>
          <th>Producto</th>
          <th>Tipo</th>
          <th>Signo</th>
          <th class="text-end">Cantidad</th>
          <th>Observación</th>
        </tr>
      </thead>
      <tbody>
  `;
  filas.forEach((f, i) => {
    let badge = "";
    if (f.esEntrada === true)
      badge = `<span class="badge bg-success">➕ Entrada</span>`;
    else if (f.esEntrada === false)
      badge = `<span class="badge bg-danger">➖ Salida</span>`;
    else badge = `<span class="badge bg-secondary">⏸️ Neutral</span>`;

    html += `
      <tr>
        <td>${i + 1}</td>
        <td><code>${f.codigoProducto}</code></td>
        <td>${f.producto.nombre}</td>
        <td>${f.tipo.nombre}</td>
        <td>${badge}</td>
        <td class="text-end">${f.cantidad}</td>
        <td>${f.observacion || "--"}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  preview.innerHTML = html;
}

// ------------------------------------------------------------
// CONFIRMAR Y EJECUTAR
// ------------------------------------------------------------
async function confirmarCargaMasivaMovimientos() {
  if (cargaMasivaMovimientosValidadas.length === 0) {
    showToast("No hay movimientos para procesar", "warning");
    return;
  }

  const modoPrueba = document.getElementById("cmMovModoPrueba")?.checked;

  const btn = document.getElementById("cmMovBtnConfirmar");
  btn.disabled = true;
  const textoOriginal = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Procesando...`;

  let ok = 0;
  let fail = 0;
  const errores = [];

  for (const f of cargaMasivaMovimientosValidadas) {
    try {
      if (modoPrueba) {
        ok++;
        continue;
      }

      const data = {
        id_producto: f.producto.id,
        id_tipo_movimiento: f.tipo.id,
        cantidad: f.cantidad,
        observacion: f.observacion,
      };

      await api.request("/movimientos-inventario", "POST", data);
      ok++;
    } catch (err) {
      fail++;
      errores.push(
        `Fila ${f.numFila} (${f.codigoProducto}): ${err.message || "error"}`,
      );
    }
  }

  if (modoPrueba) {
    showToast(`🧪 Modo prueba: ${ok} movimientos serían creados`, "info");
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    return;
  }

  if (fail === 0) {
    showToast(`✅ ${ok} movimientos creados correctamente`, "success");
  } else {
    showToast(
      `⚠ ${ok} creados, ${fail} fallidos. Revisa la consola.`,
      "warning",
    );
    console.warn("Errores carga masiva movimientos:", errores);
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("cargaMasivaMovimientosModal"),
  );
  if (modal) modal.hide();

  // Recargar solo las secciones afectadas
  await recargarResumenInventario();
  await recargarTiposMovimiento();
  if (typeof recargarProductos === "function") {
    await recargarProductos();
  }
}

// =============================================
// EXPONER FUNCIONES GLOBALES
// =============================================

// Carga masiva de movimientos
window.showCargaMasivaMovimientosModal = showCargaMasivaMovimientosModal;
window.descargarPlantillaMovimientos = descargarPlantillaMovimientos;
window.procesarArchivoMovimientos = procesarArchivoMovimientos;
window.confirmarCargaMasivaMovimientos = confirmarCargaMasivaMovimientos;

window.loadInventarioModule = loadInventarioModule;
window.showMovimientoModal = showMovimientoModal;
window.showConteoFisicoModal = showConteoFisicoModal;
window.showTrasladoModal = showTrasladoModal;
window.contarProductoEscaneado = contarProductoEscaneado;
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
window.renderResumenInventario = renderResumenInventario;
window.verHistorialProducto = verHistorialProducto;
window.mostrarHistorialModal = mostrarHistorialModal;
window.showMovimientoModalConProducto = showMovimientoModalConProducto;
window.buscarEnInventario = buscarEnInventario;
window.filtrarProductos = filtrarProductos;

// Recargas específicas por sección
window.recargarResumenInventario = recargarResumenInventario;
window.recargarConteo = recargarConteo;
window.recargarTraslados = recargarTraslados;
window.recargarAlertas = recargarAlertas;
window.recargarTiposMovimiento = recargarTiposMovimiento;
