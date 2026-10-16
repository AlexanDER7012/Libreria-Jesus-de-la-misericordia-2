// inventario.js

let movimientosData = [];
let tiposMovimientoData = [];
let inventarioFisicoData = [];
let trasladosData = [];
let alertasData = [];
let filtroBusqueda = "";

// Paginación del Resumen de inventario (en el navegador)
let paginaResumen = 1;
let porPaginaResumen = 50;

function cambiarPaginaResumen(delta) {
  paginaResumen += delta;
  renderResumenInventario();
  document
    .getElementById("movimientosContainer")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cambiarPorPaginaResumen(valor) {
  porPaginaResumen = parseInt(valor) || 0; // 0 = todos
  paginaResumen = 1;
  renderResumenInventario();
}

// Stock por ubicación (Bodega, Área de ventas, sucursales...)
let stockUbicacionesData = [];
let filtroUbicacionResumen = "";

function _mapaStockUbicaciones() {
  const mapa = {};
  (stockUbicacionesData || []).forEach((f) => {
    const p = String(f.id_producto);
    mapa[p] = mapa[p] || {};
    mapa[p][String(f.id_ubicacion)] = parseFloat(f.cantidad) || 0;
  });
  return mapa;
}

function stockEnUbicacionInv(idProducto, idUbicacion) {
  if (!idProducto || !idUbicacion) return 0;
  const fila = (stockUbicacionesData || []).find(
    (f) =>
      String(f.id_producto) === String(idProducto) &&
      String(f.id_ubicacion) === String(idUbicacion),
  );
  return fila ? parseFloat(fila.cantidad) || 0 : 0;
}

function nombreUbicacionInv(id) {
  const u = (window.ubicacionesData || []).find(
    (x) => String(x.id) === String(id),
  );
  return u ? u.nombre || `Ubicación ${u.id}` : "--";
}

async function cargarStockUbicaciones() {
  try {
    stockUbicacionesData = (await api.request("/stock-ubicaciones")) || [];
  } catch (e) {
    stockUbicacionesData = [];
  }
  return stockUbicacionesData;
}

// Paginación (server-side) de Conteo Físico, Traslados y Alertas
let skipConteo = 0;
const LIMITE_CONTEO = 10;
let skipTraslados = 0;
const LIMITE_TRASLADOS = 10;
let skipAlertas = 0;
const LIMITE_ALERTAS = 10;

function _reiniciarPaginacionInventario() {
  skipConteo = 0;
  skipTraslados = 0;
  skipAlertas = 0;
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function mostrarErrorCampo(id, mensaje) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("is-invalid");
    const errorEl = document.getElementById(id + "Error");
    if (errorEl) {
      errorEl.textContent = mensaje;
      // Se muestra aunque el mensaje no quede justo después del campo
      // (por ejemplo, cuando el campo está dentro de un input-group)
      errorEl.style.display = "block";
    }
  }
}

function limpiarErrorCampo(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("is-invalid");
    const errorEl = document.getElementById(id + "Error");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "";
    }
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

// Trae TODOS los productos activos, de 200 en 200 (el máximo por petición).
// Antes solo se pedían los primeros 200: con más productos, los demás no
// salían en el Resumen ni en las tablas de traslados/conteos ("--").
async function obtenerTodosLosProductos() {
  const todos = [];
  const porPagina = 200;
  for (let skip = 0; skip < 20000; skip += porPagina) {
    const pagina =
      (await api.request(`/productos?limit=${porPagina}&skip=${skip}`)) || [];
    todos.push(...pagina);
    if (pagina.length < porPagina) break;
  }
  return todos;
}

// Productos que aparecen en traslados/conteos/alertas pero ya no están en la
// lista (por ejemplo, inactivos): se traen uno por uno para mostrar su nombre.
async function asegurarProductosCargados(ids) {
  window.productosData = window.productosData || [];
  const conocidos = new Set(window.productosData.map((p) => String(p.id)));
  const faltan = [...new Set((ids || []).map(String))].filter(
    (id) => id && id !== "null" && id !== "undefined" && !conocidos.has(id),
  );
  if (faltan.length === 0) return;
  const encontrados = await Promise.all(
    faltan.map((id) => api.request(`/productos/${id}`).catch(() => null)),
  );
  encontrados.filter(Boolean).forEach((p) => window.productosData.push(p));
}

async function obtenerProductosParaInventario() {
  try {
    // Siempre se piden al servidor: antes se reutilizaba la lista que ya
    // estaba en memoria y el stock mostrado podía estar desactualizado
    // (por ejemplo, decía "Agotado" aunque ya se hubiera recibido mercadería).
    const [productos, categorias] = await Promise.all([
      obtenerTodosLosProductos(),
      api.request("/categorias").catch(() => null),
      cargarStockUbicaciones(),
    ]);
    if (Array.isArray(categorias)) window.categoriasInventario = categorias;
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

// Nombre de la categoría de un producto. El servidor solo manda
// id_categoria, por eso antes la columna "Categoría" salía siempre "--".
function nombreCategoriaProducto(p) {
  if (!p) return "";
  if (p.categoria_nombre) return p.categoria_nombre;
  const lista =
    window.categoriasInventario ||
    window.categoriasData ||
    (typeof categoriasData !== "undefined" ? categoriasData : []);
  const cat = (lista || []).find(
    (c) => String(c.id) === String(p.id_categoria),
  );
  return cat ? cat.nombre || "" : "";
}

function escInv(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
      nombreCategoriaProducto(p).toLowerCase().includes(busqueda)
    );
  });
}

// =============================================
// CARGA DEL MÓDULO PRINCIPAL
// =============================================

async function loadInventarioModule() {
  // Al volver a entrar a Inventario se empieza desde la primera página
  _reiniciarPaginacionInventario();
  const container =
    document.getElementById("inventarioTableContainer") ||
    document.getElementById("mainContent");
  if (!container) return;

  await obtenerProductosParaInventario();
  await obtenerUbicacionesParaInventario();

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

// Ubicaciones (sucursales/bodegas) para Conteo físico y Traslados.
// Antes solo se leían de una copia guardada por el módulo de Ventas: si no
// se había entrado antes a Ventas, los selects de ubicación salían vacíos y
// no se podía guardar ni un conteo ni un traslado.
async function obtenerUbicacionesParaInventario() {
  try {
    const [ubicaciones, config] = await Promise.all([
      api.request("/ubicaciones"),
      api.request("/configuracion").catch(() => null),
    ]);
    window.ubicacionesData = (ubicaciones || []).filter((u) => u.activo !== 0);
    // Ubicación que se propone por defecto (la de Configuración general)
    window.ubicacionPrincipalId =
      (config && config.id_ubicacion) ||
      (window.ubicacionesData[0] && window.ubicacionesData[0].id) ||
      null;
    try {
      localStorage.setItem("ubicaciones_backup", JSON.stringify(window.ubicacionesData));
    } catch (e) {}
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
    try {
      const backup = JSON.parse(localStorage.getItem("ubicaciones_backup") || "[]");
      if (Array.isArray(backup)) window.ubicacionesData = backup;
    } catch (e) {}
  }
  return window.ubicacionesData || [];
}

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
    const teniaFoco = document.activeElement === input;
    filtroBusqueda = input.value;
    paginaResumen = 1; // cada búsqueda empieza en la primera página
    renderResumenInventario();
    // La tabla se vuelve a dibujar completa (incluido este campo). Antes se
    // perdía lo escrito y el cursor después de la primera letra.
    if (teniaFoco) {
      const nuevo = document.getElementById("buscarInventario");
      if (nuevo) {
        nuevo.focus();
        const fin = nuevo.value.length;
        nuevo.setSelectionRange(fin, fin);
      }
    }
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
  const stockMapa = _mapaStockUbicaciones();

  // Paginación: solo se dibujan los productos de la página actual
  const totalFiltrados = productosFiltrados.length;
  const tamPagina = porPaginaResumen > 0 ? porPaginaResumen : totalFiltrados || 1;
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrados / tamPagina));
  if (paginaResumen > totalPaginas) paginaResumen = totalPaginas;
  if (paginaResumen < 1) paginaResumen = 1;
  const desde = (paginaResumen - 1) * tamPagina;
  const productosPagina = productosFiltrados.slice(desde, desde + tamPagina);
  const opcionesPorPagina = [10, 25, 50, 100, 0]
    .map(
      (n) =>
        `<option value="${n}" ${n === porPaginaResumen ? "selected" : ""}>${n === 0 ? "Todos" : n}</option>`,
    )
    .join("");
  const controlesPaginacion = `
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
            <div class="d-flex align-items-center gap-2">
                <small class="text-muted">Mostrar</small>
                <select class="form-select form-select-sm" style="width:auto"
                        onchange="cambiarPorPaginaResumen(this.value)">
                    ${opcionesPorPagina}
                </select>
                <small class="text-muted">por página</small>
            </div>
            <small class="text-muted">
                Mostrando ${totalFiltrados ? desde + 1 : 0}–${desde + productosPagina.length} de ${totalFiltrados} productos
            </small>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" onclick="cambiarPaginaResumen(-1)" ${paginaResumen <= 1 ? "disabled" : ""}>
                    <i class="fas fa-chevron-left me-1"></i>Anterior
                </button>
                <span class="btn btn-outline-secondary disabled">Página ${paginaResumen} de ${totalPaginas}</span>
                <button class="btn btn-outline-secondary" onclick="cambiarPaginaResumen(1)" ${paginaResumen >= totalPaginas ? "disabled" : ""}>
                    Siguiente<i class="fas fa-chevron-right ms-1"></i>
                </button>
            </div>
        </div>`;
  const ubicacionesResumen = window.ubicacionesData || [];
  const opcionesUbicacion = ubicacionesResumen
    .map(
      (u) =>
        `<option value="${u.id}" ${String(u.id) === String(filtroUbicacionResumen) ? "selected" : ""}>${escInv(u.nombre || u.id)}</option>`,
    )
    .join("");

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
                           value="${String(filtroBusqueda || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"
                           oninput="buscarEnInventario()">
                    <button class="btn btn-outline-secondary" onclick="document.getElementById('buscarInventario').value='';buscarEnInventario();">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-4 col-lg-3 mt-2 mt-md-0">
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-warehouse"></i></span>
                    <select class="form-select" id="filtroUbicacionResumen"
                            onchange="filtroUbicacionResumen=this.value;paginaResumen=1;renderResumenInventario()">
                        <option value="">Todas las ubicaciones (total)</option>
                        ${opcionesUbicacion}
                    </select>
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
        ${controlesPaginacion}
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th style="width:80px;">ID</th>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th style="width:160px;">${filtroUbicacionResumen ? "Stock en " + escInv(nombreUbicacionInv(filtroUbicacionResumen)) : "Stock Actual"}</th>
                        <th style="width:100px;">Stock Mínimo</th>
                        <th style="width:100px;">Estado</th>
                        <th style="width:200px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  productosPagina.forEach((p) => {
    const porUbicacion = stockMapa[String(p.id)] || {};
    const stock = filtroUbicacionResumen
      ? porUbicacion[String(filtroUbicacionResumen)] || 0
      : p.stock_actual || 0;
    const minStock = p.stock_minimo || 0;
    // Detalle por ubicación debajo del total (ej. "Bodega 10 · Área de ventas 63")
    const detalleUbicaciones = filtroUbicacionResumen
      ? ""
      : Object.entries(porUbicacion)
          .filter(([, cant]) => cant)
          .map(([idU, cant]) => `${escInv(nombreUbicacionInv(idU))} ${cant}`)
          .join(" · ");
    const estadoStock =
      stock === 0 ? "danger" : stock <= minStock ? "warning" : "success";
    const estadoTexto =
      stock === 0 ? "Agotado" : stock <= minStock ? "Bajo" : "Normal";

    html += `
            <tr>
                <td><code>${p.id}</code></td>
                <td><code>${p.codigo || "--"}</code></td>
                <td><strong>${escInv(p.nombre || "--")}</strong></td>
                <td>${escInv(nombreCategoriaProducto(p) || "--")}</td>
                <td class="fw-bold text-${estadoStock}">${stock}
                    ${detalleUbicaciones ? `<div class="small fw-normal text-muted">${detalleUbicaciones}</div>` : ""}
                </td>
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
        ${controlesPaginacion}
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

    const movimientos =
      (await api.request(
        `/movimientos-inventario?id_producto=${idProducto}&limit=200`,
      )) || [];
    const tipos = await api.getTiposMovimiento();

    // Los movimientos vienen del más nuevo al más viejo. El saldo se calcula
    // hacia atrás desde el stock actual: así siempre cuadra con el stock real,
    // aunque solo se muestren los últimos 200 movimientos.
    let saldo = parseFloat(producto.stock_actual) || 0;
    const movimientosConSaldo = movimientos.map((m) => {
      // Solo las líneas de ESTE producto (antes se tomaba la primera línea
      // del movimiento, aunque fuera de otro producto)
      const cantidad = (m.detalles || [])
        .filter((d) => String(d.id_producto) === String(idProducto))
        .reduce((acc, d) => acc + (parseFloat(d.cantidad) || 0), 0);
      const tipo = tipos.find((t) => t.id === m.id_tipo_movimiento);
      const signo = tipo ? tipo.signo : 0;
      // 1 = entrada, 2 (o -1) = salida, 0 = no cambia el total (ej. Traslado)
      const esEntrada = signo === 1 ? true : signo === 2 || signo === -1 ? false : null;
      const fila = {
        ...m,
        cantidad,
        esEntrada,
        tipoNombre: tipo ? tipo.nombre : "Sin tipo",
        saldo,
      };
      if (esEntrada === true) saldo -= cantidad;
      if (esEntrada === false) saldo += cantidad;
      return fila;
    });

    // Se muestran del más nuevo al más viejo (el renderizado los invierte)
    mostrarHistorialModal(producto, [...movimientosConSaldo].reverse());
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
      const entrada = m.esEntrada === true ? m.cantidad : "-";
      const salida = m.esEntrada === false ? m.cantidad : "-";
      const neutral = m.esEntrada === null;
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
                        <span class="badge ${neutral ? "bg-secondary" : m.esEntrada ? "bg-success" : "bg-danger"}">
                            ${escInv(m.tipoNombre)}
                        </span>
                        ${neutral && m.cantidad ? `<small class="text-muted d-block">${m.cantidad} (${escInv(nombreUbicacionInv(m.id_ubicacion_origen))} → ${escInv(nombreUbicacionInv(m.id_ubicacion_destino))})</small>` : ""}
                    </td>
                    <td class="text-success fw-bold">${entrada !== "-" ? "+" + entrada : "-"}</td>
                    <td class="text-danger fw-bold">${salida !== "-" ? "-" + salida : "-"}</td>
                    <td class="fw-bold ${claseSaldo}">${saldo}</td>
                    <td><small>${escInv(observacion)}</small></td>
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
    window.__movimientoProductoSelector?.setValue(idProducto);
  }, 300);
}

// =============================================
// POBLAR SELECTS
// =============================================

function populateSelectsInventario() {
  const tipoSelects = document.querySelectorAll(".inv-tipo-movimiento");
  tipoSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar tipo</option>';
    tiposMovimientoData.forEach((t) => {
      select.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });
  });

  const ubicacionSelects = document.querySelectorAll(".inv-ubicacion-select");
  const ubicaciones = window.ubicacionesData || [];
  ubicacionSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar ubicación</option>';
    ubicaciones.forEach((u) => {
      select.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
    });
    // Fuera de Traslados se propone la ubicación principal (la de
    // Configuración general); en Traslados origen y destino se eligen.
    if (!select.id.startsWith("traslado")) {
      if (ubicaciones.length === 1) {
        select.value = String(ubicaciones[0].id);
      } else if (window.ubicacionPrincipalId) {
        select.value = String(window.ubicacionPrincipalId);
      }
    }
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
                                    <div id="movimientoProductoSelectorWrapper"></div>
                                    <div class="invalid-feedback" id="movimientoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Tipo de Movimiento *</label>
                                    <select class="form-select inv-tipo-movimiento" id="movimientoTipo" required></select>
                                    <div class="invalid-feedback" id="movimientoTipoError">Seleccione un tipo</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación *</label>
                                    <select class="form-select inv-ubicacion-select" id="movimientoUbicacion" required></select>
                                    <div class="form-text">Donde entra (entrada) o de donde sale (salida) el producto.</div>
                                    <div class="invalid-feedback" id="movimientoUbicacionError">Seleccione una ubicación</div>
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
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-workspace modal-landscape">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Conteo Físico de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                              <form id="conteoForm" class="inventory-modal-grid" onsubmit="saveConteoFisico(event)" novalidate>
                                <input type="hidden" id="conteoId" />
                                <div class="mb-3 inventory-grid-wide">
                                    <label class="form-label">Producto *</label>
                                    <div id="conteoProductoSelectorWrapper"></div>
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
                                    <label class="form-label">Stock en Sistema (en esa ubicación)</label>
                                    <input type="number" step="0.01" class="form-control" id="conteoStockSistema" readonly />
                                </div>
                                <div class="mb-3 inventory-grid-wide">
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
  }

  // Modal Traslado
  if (!document.getElementById("trasladoModal")) {
    const html = `
            <div class="modal fade" id="trasladoModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-workspace modal-landscape">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Traslado de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                              <form id="trasladoForm" class="inventory-modal-grid" onsubmit="saveTraslado(event)" novalidate>
                                <input type="hidden" id="trasladoId" />
                                <div class="mb-3 inventory-grid-wide">
                                    <label class="form-label">Producto *</label>
                                    <div id="trasladoProductoSelectorWrapper"></div>
                                    <div class="invalid-feedback" id="trasladoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación Origen *</label>
                                    <select class="form-select inv-ubicacion-select" id="trasladoOrigen" required></select>
                                    <div class="form-text" id="trasladoDisponible"></div>
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
                                    <label class="form-label">Costo unitario (precio de costo)</label>
                                    <input type="text" class="form-control" id="trasladoCosto" readonly />
                                    <div class="form-text" id="trasladoTotal"></div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Método de traslado *</label>
                                    <select class="form-select" id="trasladoMetodo">
                                        <option value="Empleado Interno">Empleado Interno</option>
                                        <option value="Uber Moto">Uber Moto</option>
                                    </select>
                                </div>
                                <div class="mb-3 inventory-grid-wide">
                                    <label class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="trasladoObservacion" rows="2"></textarea>
                                </div>
                                <div class="mb-3 inventory-grid-wide">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="trasladoRecibidoYa" checked>
                                        <label class="form-check-label" for="trasladoRecibidoYa">
                                            Ya se entregó (actualizar el stock ahora)
                                        </label>
                                    </div>
                                    <div class="form-text">Desmárcalo si el producto va en camino (ej. a otra sucursal): el stock se moverá cuando se confirme la recepción.</div>
                                </div>
                                <div class="mb-3 inventory-grid-wide">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="trasladoCobrar" checked>
                                        <label class="form-check-label" for="trasladoCobrar">
                                            Cobrar a la sucursal destino (a precio de costo)
                                        </label>
                                    </div>
                                    <div class="form-text">Desmárcalo si es un movimiento interno que no se cobra (ej. Bodega → Área de ventas de la misma tienda).</div>
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
                                        <option value="+">Entrada (+) — suma stock</option>
                                        <option value="-">Salida (-) — resta stock</option>
                                        <option value="0">Neutral — no cambia el stock</option>
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
  const productoError = document.getElementById("movimientoProductoError");
  if (productoError) productoError.style.display = "";
  populateSelectsInventario();
  llenarSelectorProductoMovimiento();
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
  limpiarErrorSelectorProductoInventario("conteoProducto");
  window.__conteoProductoSelector?.reset();
  populateSelectsInventario();
  window.__conteoProductoSelector = llenarSelectorProductoInventario(
    "conteo",
    () => actualizarStockSistemaConteo(),
  );
  const ubicacionConteo = document.getElementById("conteoUbicacion");
  if (ubicacionConteo) ubicacionConteo.onchange = actualizarStockSistemaConteo;
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
  limpiarErrorSelectorProductoInventario("trasladoProducto");
  window.__trasladoProductoSelector?.reset();
  populateSelectsInventario();
  window.__trasladoProductoSelector = llenarSelectorProductoInventario(
    "traslado",
    () => actualizarDisponibleTraslado(),
  );
  const origenTraslado = document.getElementById("trasladoOrigen");
  const destinoTraslado = document.getElementById("trasladoDestino");
  if (origenTraslado) {
    origenTraslado.onchange = () => {
      bloquearMismaUbicacionTraslado();
      actualizarDisponibleTraslado();
    };
  }
  if (destinoTraslado) destinoTraslado.onchange = bloquearMismaUbicacionTraslado;
  const cantidadTraslado = document.getElementById("trasladoCantidad");
  if (cantidadTraslado) cantidadTraslado.oninput = actualizarCostoTraslado;
  bloquearMismaUbicacionTraslado();
  actualizarDisponibleTraslado();
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

function llenarSelectorProductoMovimiento() {
  window.__movimientoProductoSelector =
    llenarSelectorProductoInventario("movimiento");
}

function llenarSelectorProductoInventario(prefijo, onSelect) {
  if (typeof crearSelectorBusqueda !== "function") return;
  return crearSelectorBusqueda({
    wrapperId: `${prefijo}ProductoSelectorWrapper`,
    hiddenInputId: `${prefijo}Producto`,
    searchInputId: `${prefijo}ProductoSearchTxt`,
    dropdownId: `${prefijo}ProductoDropdown`,
    getData: () => window.productosData || [],
    getId: (producto) => producto.id,
    getLabel: (producto) =>
      `${producto.codigo || ""} - ${producto.nombre} (Stock: ${producto.stock_actual || 0})`,
    getSearchText: (producto) =>
      `${producto.codigo || ""} ${producto.nombre || ""} ${producto.descripcion || ""}`,
    // Se busca en el servidor: antes solo encontraba entre los productos ya
    // cargados (máximo 200).
    searchData: async (termino) =>
      ((await api.request(
        `/productos?buscar=${encodeURIComponent(termino)}&limit=30`,
      )) || []).filter((p) => p.activo !== 0),
    placeholder: "Buscar producto por código o nombre...",
    emptyText: "Escribe código o nombre para buscar...",
    maxResultados: 30,
    small: true,
    onSelect: (producto) => {
      if (producto) {
        window.productosData = window.productosData || [];
        if (!window.productosData.some((p) => String(p.id) === String(producto.id))) {
          window.productosData.push(producto);
        }
      }
      if (typeof onSelect === "function") onSelect(producto);
    },
  });
}

function limpiarErrorSelectorProductoInventario(selectId) {
  limpiarErrorCampo(selectId);
  document
    .getElementById(`${selectId}SearchTxt`)
    ?.classList.remove("is-invalid");
  const errorEl = document.getElementById(`${selectId}Error`);
  if (errorEl) errorEl.style.display = "";
}

function validarSelectorProductoInventario(selectId) {
  const input = document.getElementById(selectId);
  const searchInput = document.getElementById(`${selectId}SearchTxt`);
  const errorEl = document.getElementById(`${selectId}Error`);
  if (!input?.value) {
    mostrarErrorCampo(selectId, "Seleccione un producto");
    searchInput?.classList.add("is-invalid");
    if (errorEl) errorEl.style.display = "block";
    return false;
  }

  limpiarErrorSelectorProductoInventario(selectId);
  return true;
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
  const selector = {
    movimientoProducto: window.__movimientoProductoSelector,
    conteoProducto: window.__conteoProductoSelector,
    trasladoProducto: window.__trasladoProductoSelector,
  }[selectId];
  if (selector) {
    selector.setValue(producto.id);
    if (selectId === "conteoProducto") actualizarStockSistemaConteo();
    if (selectId === "trasladoProducto") actualizarDisponibleTraslado();
    return Boolean(document.getElementById(selectId)?.value);
  }

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

// Conteo: el "stock en sistema" es el de la ubicación que se está contando
function actualizarStockSistemaConteo() {
  const idProducto = document.getElementById("conteoProducto")?.value;
  const idUbicacion = document.getElementById("conteoUbicacion")?.value;
  const stockInput = document.getElementById("conteoStockSistema");
  if (stockInput) {
    stockInput.value =
      idProducto && idUbicacion ? stockEnUbicacionInv(idProducto, idUbicacion) : 0;
  }
}

// Traslado: la ubicación elegida como origen no se puede elegir como
// destino (y al revés): se deshabilita en la otra lista.
function bloquearMismaUbicacionTraslado() {
  const origen = document.getElementById("trasladoOrigen");
  const destino = document.getElementById("trasladoDestino");
  if (!origen || !destino) return;
  [...destino.options].forEach((o) => {
    o.disabled = Boolean(o.value) && o.value === origen.value;
  });
  [...origen.options].forEach((o) => {
    o.disabled = Boolean(o.value) && o.value === destino.value;
  });
  if (destino.value && destino.value === origen.value) destino.value = "";
}

// Traslado: costo unitario (precio de compra) y total a cobrar
function actualizarCostoTraslado() {
  const idProducto = document.getElementById("trasladoProducto")?.value;
  const cantidad = parseFloat(document.getElementById("trasladoCantidad")?.value) || 0;
  const producto = (window.productosData || []).find(
    (p) => String(p.id) === String(idProducto),
  );
  const costo = producto ? parseFloat(producto.precio_compra) || 0 : 0;
  const costoInput = document.getElementById("trasladoCosto");
  const totalInfo = document.getElementById("trasladoTotal");
  if (costoInput) costoInput.value = producto ? `Q${costo.toFixed(2)}` : "";
  if (totalInfo) {
    totalInfo.innerHTML =
      producto && cantidad > 0
        ? `Total a costo: <strong>Q${(costo * cantidad).toFixed(2)}</strong>`
        : "";
  }
}

// Traslado: muestra cuánto hay en la ubicación de origen
function actualizarDisponibleTraslado() {
  actualizarCostoTraslado();
  const idProducto = document.getElementById("trasladoProducto")?.value;
  const idOrigen = document.getElementById("trasladoOrigen")?.value;
  const info = document.getElementById("trasladoDisponible");
  if (!info) return;
  if (!idProducto || !idOrigen) {
    info.textContent = "";
    return;
  }
  const disponible = stockEnUbicacionInv(idProducto, idOrigen);
  info.innerHTML = `Disponible en ${escInv(nombreUbicacionInv(idOrigen))}: <strong>${disponible}</strong>`;
  info.className = `form-text ${disponible > 0 ? "text-success" : "text-danger"}`;
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
  if (!validarSelectorProductoInventario("movimientoProducto")) valid = false;

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

  const idUbicacionMov = parseInt(
    document.getElementById("movimientoUbicacion")?.value,
  );
  if (!idUbicacionMov) {
    mostrarErrorCampo("movimientoUbicacion", "Seleccione una ubicación");
    valid = false;
  } else {
    limpiarErrorCampo("movimientoUbicacion");
  }

  if (!valid) return;

  // El servidor espera la cabecera del movimiento + la lista "detalles"
  // (antes se mandaban los campos sueltos y respondía "Field required").
  const data = {
    id_usuario: getCurrentUser()?.id || getCurrentUser()?.usuario_id || null,
    id_tipo_movimiento: idTipo,
    id_ubicacion: idUbicacionMov,
    observaciones:
      document.getElementById("movimientoObservacion").value.trim() || null,
    detalles: [{ id_producto: idProducto, cantidad: cantidad }],
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
  if (!validarSelectorProductoInventario("conteoProducto")) valid = false;

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
    stock_real: cantidad,
    id_usuario: getCurrentUser()?.id || getCurrentUser()?.usuario_id || null,
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

// Aplica un conteo: el stock del sistema pasa a ser lo que se contó.
async function aplicarAjusteConteo(idConteo) {
  const ok = await confirmarAccion(
    "Se aplicará al stock de esa ubicación la diferencia encontrada en el conteo, y quedará registrada en el historial.\n¿Aplicar el ajuste?",
    { titulo: "Aplicar ajuste de inventario", textoAceptar: "Aplicar ajuste", peligro: false },
  );
  if (!ok) return;
  try {
    await api.request(`/inventario-fisico/${idConteo}/aplicar-ajuste`, "PATCH");
    showToast("Ajuste aplicado y registrado en el historial", "success");
    await recargarConteo();
    await recargarResumenInventario();
  } catch (error) {
    showToast(error.message || "Error al aplicar el ajuste", "error");
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
  if (!validarSelectorProductoInventario("trasladoProducto")) valid = false;

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
  } else if (
    idProducto &&
    idOrigen &&
    cantidad > stockEnUbicacionInv(idProducto, idOrigen)
  ) {
    mostrarErrorCampo(
      "trasladoCantidad",
      `Solo hay ${stockEnUbicacionInv(idProducto, idOrigen)} en ${nombreUbicacionInv(idOrigen)}`,
    );
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
    metodo_traslado:
      document.getElementById("trasladoMetodo")?.value || "Empleado Interno",
    observaciones:
      document.getElementById("trasladoObservacion").value.trim() || null,
    id_usuario_autoriza: getCurrentUser()?.id || getCurrentUser()?.usuario_id || null,
    cobrar: document.getElementById("trasladoCobrar")?.checked !== false,
  };

  console.log("📦 Enviando traslado:", data);

  try {
    const result = await api.request("/traslados", "POST", data);
    const nota = result.numero_nota_envio || `#${result.id}`;
    if (document.getElementById("trasladoRecibidoYa")?.checked) {
      // Entrega inmediata (ej. Bodega -> Área de ventas en la misma tienda)
      await api.request(`/traslados/${result.id}/confirmar-recepcion`, "PATCH");
      showToast(
        `Traslado ${nota} realizado: el stock ya se movió de ${nombreUbicacionInv(idOrigen)} a ${nombreUbicacionInv(idDestino)}`,
        "success",
      );
    } else {
      showToast(
        `Traslado ${nota} registrado: queda en camino hasta que se reciba con la nota de envío`,
        "success",
      );
    }
    // Se ofrece imprimir la nota de envío que acompaña la mercadería
    setTimeout(async () => {
      const imprimir = await confirmarAccion(
        `Se generó la nota de envío ${nota}.\n¿Quieres imprimirla para que acompañe la mercadería?`,
        { titulo: "Nota de envío", textoAceptar: "Imprimir nota", peligro: false },
      );
      if (imprimir) imprimirNotaEnvio(result.id);
    }, 400);

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
                        <th>Ajuste</th>
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
    const contado = parseFloat(c.stock_real ?? c.cantidad_contada ?? 0) || 0;
    const diferencia =
      c.diferencia != null
        ? parseFloat(c.diferencia) || 0
        : contado - (parseFloat(c.stock_sistema) || 0);
    const esDiferencia = diferencia !== 0;

    html += `
            <tr>
                <td>${c.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>${ubicacion ? ubicacion.nombre || ubicacion.id : "--"}</td>
                <td>${contado}</td>
                <td>${c.stock_sistema || 0}</td>
                <td class="${esDiferencia ? (diferencia > 0 ? "text-success" : "text-danger") : ""}">
                    ${diferencia !== 0 ? (diferencia > 0 ? "+" : "") + diferencia : "0"}
                </td>
                <td>${c.fecha ? new Date(c.fecha).toLocaleString() : "--"}</td>
                <td>${
                  c.ajustado === 1
                    ? '<span class="badge bg-success">Aplicado</span>'
                    : diferencia === 0
                      ? '<span class="text-muted small">Sin diferencia</span>'
                      : tienePermiso("Inventario", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="aplicarAjusteConteo(${c.id})" title="Dejar el stock del sistema igual a lo contado">
                             <i class="fas fa-check me-1"></i>Aplicar ajuste
                           </button>`
                        : '<span class="badge bg-warning text-dark">Pendiente</span>'
                }</td>
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

function _infoPagoTraslado(t) {
  const total = parseFloat(t.monto_total) || 0;
  const pagado = parseFloat(t.monto_pagado) || 0;
  const saldo = Math.max(0, total - pagado);
  const clases = {
    Pendiente: "bg-danger",
    Parcial: "bg-warning text-dark",
    Pagado: "bg-success",
    "No aplica": "bg-light text-muted border",
  };
  return { total, pagado, saldo, estado: t.estado_pago || "No aplica", clase: clases[t.estado_pago] || "bg-secondary" };
}

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

  const puedeEditar = tienePermiso("Inventario", "Editar");
  let html = `
        <div class="table-responsive">
            <table class="table table-hover table-striped align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Nota de envío</th>
                        <th>Producto</th>
                        <th>Origen → Destino</th>
                        <th class="text-end">Cant.</th>
                        <th class="text-end">Total (costo)</th>
                        <th>Pago</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  traslados.forEach((t) => {
    const producto = (window.productosData || []).find(
      (p) => String(p.id) === String(t.id_producto),
    );
    const estado = t.estado || "EnProceso";
    const estadoInfo =
      {
        EnProceso: { texto: "En camino", clase: "bg-warning text-dark" },
        Completado: { texto: "Recibido", clase: "bg-success" },
        Recibido: { texto: "Recibido", clase: "bg-success" },
        Cancelado: { texto: "Cancelado", clase: "bg-secondary" },
      }[estado] || { texto: estado, clase: "bg-secondary" };
    const pago = _infoPagoTraslado(t);

    html += `
            <tr>
                <td><strong>${escInv(t.numero_nota_envio || "#" + t.id)}</strong></td>
                <td>${escInv(producto ? producto.nombre : "--")}</td>
                <td><small>${escInv(nombreUbicacionInv(t.id_ubicacion_origen))} → ${escInv(nombreUbicacionInv(t.id_ubicacion_destino))}</small></td>
                <td class="text-end">${t.cantidad || 0}</td>
                <td class="text-end">Q${pago.total.toFixed(2)}</td>
                <td>
                    <span class="badge ${pago.clase}">${pago.estado}</span>
                    ${pago.estado === "Pendiente" || pago.estado === "Parcial" ? `<div class="small text-muted">Saldo Q${pago.saldo.toFixed(2)}</div>` : ""}
                </td>
                <td><span class="badge ${estadoInfo.clase}">${estadoInfo.texto}</span></td>
                <td><small>${t.fecha ? new Date(t.fecha).toLocaleString() : "--"}</small></td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-outline-secondary" onclick="imprimirNotaEnvio(${t.id})" title="Imprimir nota de envío">
                        <i class="fas fa-print"></i>
                    </button>
                    ${
                      pago.estado !== "No aplica" && estado !== "Cancelado"
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="mostrarPagosTraslado(${t.id})" title="Pagos del traslado">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>`
                        : ""
                    }
                    ${
                      estado === "EnProceso" && puedeEditar
                        ? `<button class="btn btn-sm btn-outline-success" onclick="recibirTraslado(${t.id})" title="Confirmar que llegó">
                        <i class="fas fa-check me-1"></i>Recibir
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="cancelarTraslado(${t.id})" title="Cancelar traslado">
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
        <div class="text-end">
            <small class="text-muted">Total: ${traslados.length} traslados</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// RECIBIR POR NÚMERO DE NOTA DE ENVÍO
// =============================================
async function recibirPorNotaEnvio() {
  const input = document.getElementById("trasladoNotaRecibir");
  const numero = (input?.value || "").trim();
  if (!numero) {
    showToast("Escribe o escanea el número de la nota de envío", "warning");
    input?.focus();
    return;
  }
  let traslado;
  try {
    traslado = await api.request(`/traslados/nota/${encodeURIComponent(numero)}`);
  } catch (error) {
    showToast(error.message || "No se encontró la nota de envío", "error");
    return;
  }
  if (traslado.estado !== "EnProceso") {
    showToast(
      `La nota ${traslado.numero_nota_envio} ya está ${traslado.estado === "Cancelado" ? "cancelada" : "recibida"}`,
      "warning",
    );
    return;
  }
  await asegurarProductosCargados([traslado.id_producto]);
  const producto = (window.productosData || []).find(
    (p) => String(p.id) === String(traslado.id_producto),
  );
  const ok = await confirmarAccion(
    `Nota ${traslado.numero_nota_envio}\n` +
      `${traslado.cantidad} × ${producto ? producto.nombre : "producto"}\n` +
      `De ${nombreUbicacionInv(traslado.id_ubicacion_origen)} a ${nombreUbicacionInv(traslado.id_ubicacion_destino)}\n\n` +
      "¿Confirmar que llegó la mercadería?",
    { titulo: "Recibir traslado", textoAceptar: "Recibir", peligro: false },
  );
  if (!ok) return;
  try {
    await api.request(
      `/traslados/nota/${encodeURIComponent(traslado.numero_nota_envio)}/recibir`,
      "PATCH",
    );
    showToast(`Nota ${traslado.numero_nota_envio} recibida: el stock ya está en el destino`, "success");
    if (input) input.value = "";
    await recargarTraslados();
    await recargarResumenInventario();
  } catch (error) {
    showToast(error.message || "No se pudo recibir el traslado", "error");
  }
}

// =============================================
// NOTA DE ENVÍO (impresión)
// =============================================
async function imprimirNotaEnvio(id) {
  try {
    const [traslados, config] = await Promise.all([
      api.request(`/traslados?limit=200`),
      api.request("/configuracion").catch(() => ({})),
    ]);
    let t = (traslados || []).find((x) => x.id === id);
    if (!t) {
      const desde = (trasladosData || []).find((x) => x.id === id);
      if (desde && desde.numero_nota_envio) {
        t = await api.request(`/traslados/nota/${encodeURIComponent(desde.numero_nota_envio)}`);
      }
    }
    if (!t) throw new Error("No se encontró el traslado");
    await asegurarProductosCargados([t.id_producto]);
    const producto =
      (window.productosData || []).find((p) => String(p.id) === String(t.id_producto)) || {};
    const pago = _infoPagoTraslado(t);
    const negocio = escInv((config && config.nombre_negocio) || "Librería y Papelería");
    const fecha = t.fecha ? new Date(t.fecha).toLocaleString() : "";

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>Nota de envío ${escInv(t.numero_nota_envio || "")}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:30px;color:#222}
        h1{font-size:20px;margin:0}h2{font-size:16px;margin:4px 0 16px}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th,td{border:1px solid #999;padding:6px 8px;font-size:13px;text-align:left}
        th{background:#eee}.der{text-align:right}
        .datos td{border:none;padding:2px 8px 2px 0}
        .firmas{display:flex;justify-content:space-between;margin-top:60px}
        .firma{width:40%;border-top:1px solid #333;text-align:center;padding-top:4px;font-size:12px}
      </style></head><body>
      <h1>${negocio}</h1>
      <h2>NOTA DE ENVÍO — ${escInv(t.numero_nota_envio || "#" + t.id)}</h2>
      <table class="datos">
        <tr><td><strong>Fecha:</strong></td><td>${fecha}</td></tr>
        <tr><td><strong>Origen:</strong></td><td>${escInv(nombreUbicacionInv(t.id_ubicacion_origen))}</td></tr>
        <tr><td><strong>Destino:</strong></td><td>${escInv(nombreUbicacionInv(t.id_ubicacion_destino))}</td></tr>
        <tr><td><strong>Método de envío:</strong></td><td>${escInv(t.metodo_traslado || "")}</td></tr>
        <tr><td><strong>Estado de pago:</strong></td><td>${escInv(pago.estado)}</td></tr>
      </table>
      <table>
        <thead><tr><th>Código</th><th>Producto</th><th class="der">Cantidad</th><th class="der">Costo unitario</th><th class="der">Total</th></tr></thead>
        <tbody><tr>
          <td>${escInv(producto.codigo || "")}</td>
          <td>${escInv(producto.nombre || "")}</td>
          <td class="der">${t.cantidad}</td>
          <td class="der">Q${(parseFloat(t.costo_unitario) || 0).toFixed(2)}</td>
          <td class="der">Q${pago.total.toFixed(2)}</td>
        </tr></tbody>
        <tfoot><tr><th colspan="4" class="der">Total a precio de costo</th><th class="der">Q${pago.total.toFixed(2)}</th></tr></tfoot>
      </table>
      ${t.observaciones ? `<p><strong>Observaciones:</strong> ${escInv(t.observaciones)}</p>` : ""}
      <p style="font-size:12px">Para recibir, la sucursal destino ingresa el número <strong>${escInv(t.numero_nota_envio || "")}</strong> en Inventario → Traslados → "Recibir por nota de envío".</p>
      <div class="firmas"><div class="firma">Entrega</div><div class="firma">Recibe</div></div>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      showToast("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes.", "warning");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  } catch (error) {
    showToast(error.message || "No se pudo generar la nota de envío", "error");
  }
}

// =============================================
// PAGOS DEL TRASLADO (a precio de costo)
// =============================================
let _trasladoPagosActual = null;

async function mostrarPagosTraslado(id) {
  try {
    const [pagos, tiposPago] = await Promise.all([
      api.request(`/traslados/${id}/pagos`),
      api.request("/tipos-pago").catch(() => []),
    ]);
    const lista = await api.request(`/traslados?limit=200`);
    let t = (lista || []).find((x) => x.id === id);
    if (!t) t = (trasladosData || []).find((x) => x.id === id);
    if (!t) throw new Error("No se encontró el traslado");
    _trasladoPagosActual = t;
    const pago = _infoPagoTraslado(t);
    const tipos = (tiposPago || []).filter((tp) => tp.activo !== 0);
    const nombreTipo = (idTipo) =>
      (tiposPago || []).find((tp) => tp.id === idTipo)?.nombre || "--";
    const puedeEditar = tienePermiso("Inventario", "Editar");

    let modal = document.getElementById("trasladoPagosModal");
    if (!modal) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div class="modal fade" id="trasladoPagosModal" tabindex="-1">
           <div class="modal-dialog modal-lg"><div class="modal-content">
             <div class="modal-header">
               <h5 class="modal-title" id="trasladoPagosTitulo">Pagos del traslado</h5>
               <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
             </div>
             <div class="modal-body" id="trasladoPagosBody"></div>
           </div></div>
         </div>`,
      );
      modal = document.getElementById("trasladoPagosModal");
    }

    document.getElementById("trasladoPagosTitulo").textContent =
      `Pagos del traslado ${t.numero_nota_envio || "#" + t.id}`;
    const filas = (pagos || [])
      .map(
        (p) => `<tr class="${p.anulado ? "text-muted text-decoration-line-through" : ""}">
            <td><small>${p.fecha_pago ? new Date(p.fecha_pago).toLocaleString() : "--"}</small></td>
            <td class="text-end">Q${(parseFloat(p.monto) || 0).toFixed(2)}</td>
            <td>${escInv(nombreTipo(p.id_tipo_pago))}</td>
            <td>${escInv(p.referencia || "--")}</td>
            <td>${p.anulado ? `<span class="badge bg-secondary">Anulado</span>${p.motivo_anulacion ? `<div class="small">${escInv(p.motivo_anulacion)}</div>` : ""}` : `<span class="badge bg-success">Vigente</span>`}</td>
            <td>${!p.anulado && puedeEditar ? `<button class="btn btn-sm btn-outline-danger" onclick="anularPagoTraslado(${t.id}, ${p.id})" title="Anular pago"><i class="fas fa-ban"></i></button>` : ""}</td>
          </tr>`,
      )
      .join("");

    document.getElementById("trasladoPagosBody").innerHTML = `
      <div class="row g-2 mb-3 text-center">
        <div class="col"><div class="border rounded p-2"><small class="text-muted d-block">Total a costo</small><strong>Q${pago.total.toFixed(2)}</strong></div></div>
        <div class="col"><div class="border rounded p-2"><small class="text-muted d-block">Pagado</small><strong class="text-success">Q${pago.pagado.toFixed(2)}</strong></div></div>
        <div class="col"><div class="border rounded p-2"><small class="text-muted d-block">Saldo</small><strong class="text-danger">Q${pago.saldo.toFixed(2)}</strong></div></div>
        <div class="col"><div class="border rounded p-2"><small class="text-muted d-block">Estado</small><span class="badge ${pago.clase}">${pago.estado}</span></div></div>
      </div>
      <h6>Pagos registrados</h6>
      ${
        filas
          ? `<div class="table-responsive"><table class="table table-sm"><thead class="table-light"><tr><th>Fecha</th><th class="text-end">Monto</th><th>Forma de pago</th><th>Referencia</th><th>Estado</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`
          : `<p class="text-muted small">Todavía no hay pagos.</p>`
      }
      ${
        pago.saldo > 0 && puedeEditar
          ? `<hr><h6>Registrar pago</h6>
        <form id="trasladoPagoForm" onsubmit="registrarPagoTraslado(event)" class="row g-2" novalidate>
          <div class="col-md-3">
            <label class="form-label small">Monto *</label>
            <input type="number" step="0.01" min="0.01" max="${pago.saldo.toFixed(2)}" class="form-control form-control-sm" id="trasladoPagoMonto" value="${pago.saldo.toFixed(2)}" required>
          </div>
          <div class="col-md-3">
            <label class="form-label small">Forma de pago</label>
            <select class="form-select form-select-sm" id="trasladoPagoTipo">
              ${tipos.map((tp) => `<option value="${tp.id}">${escInv(tp.nombre)}</option>`).join("")}
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small">Referencia</label>
            <input type="text" class="form-control form-control-sm" id="trasladoPagoReferencia" placeholder="No. de boleta, transferencia...">
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button type="submit" class="btn btn-success btn-sm w-100"><i class="fas fa-save me-1"></i>Registrar pago</button>
          </div>
        </form>`
          : ""
      }`;

    bootstrap.Modal.getOrCreateInstance(modal).show();
  } catch (error) {
    showToast(error.message || "No se pudieron cargar los pagos", "error");
  }
}

async function registrarPagoTraslado(event) {
  event.preventDefault();
  const t = _trasladoPagosActual;
  if (!t) return;
  const monto = parseFloat(document.getElementById("trasladoPagoMonto").value);
  const saldo = _infoPagoTraslado(t).saldo;
  if (!monto || monto <= 0) {
    showToast("El monto debe ser mayor a 0", "warning");
    return;
  }
  if (monto > saldo + 0.009) {
    showToast(`El monto no puede ser mayor al saldo (Q${saldo.toFixed(2)})`, "warning");
    return;
  }
  try {
    await api.request(`/traslados/${t.id}/pagos`, "POST", {
      monto,
      id_tipo_pago: parseInt(document.getElementById("trasladoPagoTipo")?.value) || null,
      referencia: document.getElementById("trasladoPagoReferencia")?.value.trim() || null,
    });
    showToast(`Pago de Q${monto.toFixed(2)} registrado`, "success");
    await recargarTraslados();
    await mostrarPagosTraslado(t.id);
  } catch (error) {
    showToast(error.message || "No se pudo registrar el pago", "error");
  }
}

async function anularPagoTraslado(idTraslado, idPago) {
  const motivo = await pedirTextoModal(
    "El pago no se borra: queda como anulado y deja de contar para el saldo.\n¿Por qué se anula?",
    { titulo: "Anular pago", textoAceptar: "Anular pago", placeholder: "Motivo (opcional)" },
  );
  if (motivo === null || motivo === undefined) return;
  try {
    await api.request(
      `/traslados/${idTraslado}/pagos/${idPago}?motivo=${encodeURIComponent(motivo || "")}`,
      "DELETE",
    );
    showToast("Pago anulado", "success");
    await recargarTraslados();
    await mostrarPagosTraslado(idTraslado);
  } catch (error) {
    showToast(error.message || "No se pudo anular el pago", "error");
  }
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
    await api.request(`/traslados/${id}/confirmar-recepcion`, "PATCH");
    showToast("Traslado recibido: el stock ya se movió al destino", "success");
    await recargarTraslados();
    await recargarResumenInventario();
  } catch (error) {
    console.error("❌ Error al recibir traslado:", error);
    showToast(error.message || "Error al recibir traslado", "error");
  }
}

async function cancelarTraslado(id) {
  const ok = await confirmarAccion(
    "El traslado se cancelará y el producto se queda en la ubicación de origen.\n¿Cancelar el traslado?",
    { titulo: "Cancelar traslado", textoAceptar: "Cancelar traslado", peligro: true },
  );
  if (!ok) return;
  try {
    await api.request(`/traslados/${id}/cancelar`, "PATCH");
    showToast("Traslado cancelado", "success");
    await recargarTraslados();
  } catch (error) {
    showToast(error.message || "Error al cancelar el traslado", "error");
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
                    <span class="badge ${leida ? "bg-secondary" : yaResuelta ? "bg-success" : "bg-danger"}">
                        ${leida ? "Leída" : yaResuelta ? "Stock repuesto" : "Pendiente"}
                    </span>
                </td>
                <td>
                    ${
                      leida
                        ? `<span class="text-muted small">Cerrada</span>`
                        : tienePermiso("Inventario", "Editar")
                          ? `
                        <button class="btn btn-sm btn-outline-success" onclick="marcarAlertaLeida(${a.id})">
                            <i class="fas fa-check"></i> ${yaResuelta ? "Cerrar alerta" : "Marcar Leída"}
                        </button>
                    `
                          : `<span class="text-muted small">--</span>`
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
  cantidadPagina,
  limite,
) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // Si la página vino incompleta, ya no hay más: "Siguiente" se desactiva
  // (antes dejaba avanzar a páginas vacías)
  const hayMas = cantidadPagina >= limite;
  if (skipActual === 0 && !hayMas) return; // todo cabe en una página
  const pagina = Math.floor(skipActual / limite) + 1;
  container.insertAdjacentHTML(
    "beforeend",
    `
        <div class="d-flex justify-content-between align-items-center mt-2">
            <button class="btn btn-sm btn-outline-secondary" onclick="${onAnterior}" ${skipActual === 0 ? "disabled" : ""}>
                <i class="fas fa-chevron-left me-1"></i>Anterior
            </button>
            <small class="text-muted">Página ${pagina}</small>
            <button class="btn btn-sm btn-outline-secondary" onclick="${onSiguiente}" ${hayMas ? "" : "disabled"}>
                Siguiente<i class="fas fa-chevron-right ms-1"></i>
            </button>
        </div>
    `,
  );
}

// Si se avanzó a una página que quedó vacía (por ejemplo, porque se
// cerraron alertas), se regresa a la anterior.
function _paginaVaciaInventario(datos, skip) {
  return Array.isArray(datos) && datos.length === 0 && skip > 0;
}

async function cargarConteoTabla() {
  try {
    const desde = document.getElementById("conteoFechaDesde")?.value;
    const hasta = document.getElementById("conteoFechaHasta")?.value;
    let url = `/inventario-fisico?skip=${skipConteo}&limit=${LIMITE_CONTEO}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    inventarioFisicoData = (await api.request(url)) || [];
    await asegurarProductosCargados(inventarioFisicoData.map((c) => c.id_producto));
    if (_paginaVaciaInventario(inventarioFisicoData, skipConteo)) {
      skipConteo = Math.max(0, skipConteo - LIMITE_CONTEO);
      return cargarConteoTabla();
    }
    renderConteoFisico(inventarioFisicoData);
    _agregarControlesPaginacionInventario(
      "conteoContainer",
      `skipConteo=Math.max(0,skipConteo-${LIMITE_CONTEO});cargarConteoTabla()`,
      `skipConteo+=${LIMITE_CONTEO};cargarConteoTabla()`,
      skipConteo,
      inventarioFisicoData.length,
      LIMITE_CONTEO,
    );
  } catch (error) {
    document.getElementById("conteoContainer").innerHTML =
      `<div class="alert alert-danger">${error.message}</div>`;
  }
}

async function cargarTrasladosTabla() {
  try {
    const estado = document.getElementById("trasladosFiltroEstado")?.value;
    const estadoPago = document.getElementById("trasladosFiltroPago")?.value;
    const desde = document.getElementById("trasladosFechaDesde")?.value;
    const hasta = document.getElementById("trasladosFechaHasta")?.value;
    let url = `/traslados?skip=${skipTraslados}&limit=${LIMITE_TRASLADOS}`;
    if (estado) url += `&estado=${estado}`;
    if (estadoPago) url += `&estado_pago=${encodeURIComponent(estadoPago)}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    trasladosData = (await api.request(url)) || [];
    await asegurarProductosCargados(trasladosData.map((t) => t.id_producto));
    if (_paginaVaciaInventario(trasladosData, skipTraslados)) {
      skipTraslados = Math.max(0, skipTraslados - LIMITE_TRASLADOS);
      return cargarTrasladosTabla();
    }
    renderTraslados(trasladosData);
    _agregarControlesPaginacionInventario(
      "trasladosContainer",
      `skipTraslados=Math.max(0,skipTraslados-${LIMITE_TRASLADOS});cargarTrasladosTabla()`,
      `skipTraslados+=${LIMITE_TRASLADOS};cargarTrasladosTabla()`,
      skipTraslados,
      trasladosData.length,
      LIMITE_TRASLADOS,
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
    await asegurarProductosCargados(alertasData.map((a) => a.id_producto));
    if (_paginaVaciaInventario(alertasData, skipAlertas)) {
      skipAlertas = Math.max(0, skipAlertas - LIMITE_ALERTAS);
      return cargarAlertasTabla();
    }
    renderAlertas(alertasData);
    _agregarControlesPaginacionInventario(
      "alertasContainer",
      `skipAlertas=Math.max(0,skipAlertas-${LIMITE_ALERTAS});cargarAlertasTabla()`,
      `skipAlertas+=${LIMITE_ALERTAS};cargarAlertasTabla()`,
      skipAlertas,
      alertasData.length,
      LIMITE_ALERTAS,
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
    await api.request(`/alertas/${id}/marcar-leida`, "PATCH");
    showToast("Alerta cerrada", "success");
    await recargarAlertas();
  } catch (error) {
    showToast(error.message || "No se pudo cerrar la alerta", "error");
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
  const signo = signoVal === "+" ? 1 : signoVal === "0" ? 0 : 2;

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
              Codigo_Producto | Tipo_Movimiento | Cantidad | Ubicacion | Costo_Unitario | Observacion
            </div>
            <ul class="mb-0 mt-2 small">
              <li><strong>Codigo_Producto:</strong> debe existir en el catálogo.</li>
              <li><strong>Tipo_Movimiento:</strong> por nombre, tal como está en "Tipos de movimiento" (la plantilla trae la lista en la hoja "Tipos").</li>
              <li><strong>Cantidad:</strong> número positivo (el tipo define si es entrada o salida). Las salidas no pueden dejar el stock en negativo.</li>
              <li><strong>Ubicacion:</strong> opcional, por nombre (ej. "Bodega"). Si va vacía se usa la ubicación principal.</li>
              <li><strong>Costo_Unitario:</strong> opcional (útil para el inventario inicial).</li>
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
async function descargarPlantillaMovimientos() {
  // Los tipos se leen de la base de datos: antes la plantilla traía nombres
  // de ejemplo ("Entrada por compra"...) que no existían y todas las filas
  // salían con "tipo de movimiento no encontrado".
  let tipos = tiposMovimientoData;
  if (!tipos || tipos.length === 0) {
    tipos = (await api.getTiposMovimiento().catch(() => [])) || [];
    tiposMovimientoData = tipos;
  }
  // Para el ejemplo se prefieren tipos manuales (no "Compra"/"Venta", que
  // usa el sistema solo) y, si existe, el de inventario inicial.
  const manual = (t) => !/^(compra|venta)$/i.test((t.nombre || "").trim());
  const entrada =
    tipos.find((t) => t.signo === 1 && /inicial/i.test(t.nombre || "")) ||
    tipos.find((t) => t.signo === 1 && manual(t)) ||
    tipos.find((t) => t.signo === 1);
  const salida =
    tipos.find((t) => t.signo === 2 && manual(t)) ||
    tipos.find((t) => t.signo === 2);
  const productos = (window.productosData || []).filter((p) => p.activo !== 0);
  const codigo = (i, ejemplo) => (productos[i] && productos[i].codigo) || ejemplo;

  const ubicacionEjemplo = window.ubicacionPrincipalId
    ? nombreUbicacionInv(window.ubicacionPrincipalId)
    : "";
  const data = [
    {
      Codigo_Producto: codigo(0, "PROD-001"),
      Tipo_Movimiento: entrada ? entrada.nombre : "(nombre de un tipo de entrada)",
      Cantidad: 50,
      Ubicacion: ubicacionEjemplo,
      Costo_Unitario: 8.5,
      Observacion: "Inventario inicial",
    },
  ];
  if (salida) {
    data.push({
      Codigo_Producto: codigo(1, "PROD-002"),
      Tipo_Movimiento: salida.nombre,
      Cantidad: 2,
      Ubicacion: ubicacionEjemplo,
      Costo_Unitario: "",
      Observacion: "Producto dañado",
    });
  }

  const signoTexto = (t) =>
    t.signo === 1
      ? "Entrada (suma stock)"
      : t.signo === 2
        ? "Salida (resta stock)"
        : "Neutral (no cambia stock)";
  const hojaTipos = tipos.map((t) => ({
    Tipo_Movimiento: t.nombre,
    Efecto: signoTexto(t),
    Descripcion: t.descripcion || "",
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Movimientos");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      hojaTipos.length
        ? hojaTipos
        : [{ Tipo_Movimiento: "(no hay tipos creados)", Efecto: "", Descripcion: "" }],
    ),
    "Tipos",
  );
  descargarExcelConColores(wb, "Plantilla_Carga_Masiva_Movimientos.xlsx", {
    Movimientos: {
      obligatorias: ["Codigo_Producto", "Tipo_Movimiento", "Cantidad"],
    },
    Tipos: { informativas: ["Tipo_Movimiento", "Efecto", "Descripcion"] },
  });
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
  // Stock que va quedando por producto, aplicando las filas en orden, para
  // avisar en la vista previa si una salida deja el stock en negativo.
  const stockSimulado = {};

  const info = document.getElementById("cmMovResumen");
  if (info) {
    info.innerHTML =
      '<div class="text-muted small"><span class="spinner-border spinner-border-sm me-1"></span>Revisando el archivo...</div>';
  }

  for (let idx = 0; idx < cargaMasivaMovimientosFilas.length; idx++) {
    const row = cargaMasivaMovimientosFilas[idx];
    const numFila = idx + 2;
    const codigoProducto = String(row.Codigo_Producto || "").trim();
    const nombreTipo = String(row.Tipo_Movimiento || "").trim();
    const cantidad = parseFloat(row.Cantidad);
    const observacion = String(row.Observacion || "").trim() || null;
    const costoTexto = String(row.Costo_Unitario ?? "").trim();
    const nombreUbicacion = String(row.Ubicacion || "").trim();
    const costo = costoTexto === "" ? null : parseFloat(costoTexto);

    if (!codigoProducto) {
      errores.push(`Fila ${numFila}: falta Codigo_Producto`);
      continue;
    }
    if (!nombreTipo) {
      errores.push(`Fila ${numFila}: falta Tipo_Movimiento`);
      continue;
    }
    if (!cantidad || cantidad <= 0 || isNaN(cantidad)) {
      errores.push(`Fila ${numFila}: cantidad inválida (${row.Cantidad})`);
      continue;
    }
    if (costo !== null && (isNaN(costo) || costo < 0)) {
      errores.push(`Fila ${numFila}: costo inválido (${row.Costo_Unitario})`);
      continue;
    }

    // Buscar producto por código: primero en lo cargado y, si no está
    // (solo se cargan los primeros productos), en el servidor.
    let producto = productos.find(
      (p) => (p.codigo || "").toLowerCase() === codigoProducto.toLowerCase(),
    );
    if (!producto) {
      try {
        producto = await api.request(
          `/productos/buscar-codigo/${encodeURIComponent(codigoProducto)}`,
        );
        if (producto) productos.push(producto);
      } catch (e) {
        producto = null;
      }
    }
    if (!producto) {
      errores.push(
        `Fila ${numFila}: producto "${codigoProducto}" no encontrado`,
      );
      continue;
    }
    if (producto.activo === 0) {
      errores.push(
        `Fila ${numFila}: el producto "${codigoProducto}" está inactivo`,
      );
      continue;
    }

    // Buscar tipo por nombre (case-insensitive)
    const tipo = tipos.find(
      (t) => (t.nombre || "").toLowerCase() === nombreTipo.toLowerCase(),
    );
    if (!tipo) {
      errores.push(
        `Fila ${numFila}: tipo de movimiento "${nombreTipo}" no encontrado (mira la hoja "Tipos" de la plantilla)`,
      );
      continue;
    }

    // Ubicación por nombre (vacía = la principal)
    let idUbicacion = window.ubicacionPrincipalId || null;
    if (nombreUbicacion) {
      const u = (window.ubicacionesData || []).find(
        (x) => (x.nombre || "").trim().toLowerCase() === nombreUbicacion.toLowerCase(),
      );
      if (!u) {
        errores.push(`Fila ${numFila}: la ubicación "${nombreUbicacion}" no existe`);
        continue;
      }
      idUbicacion = u.id;
    }

    // Interpretar signo
    let esEntrada = false;
    if (tipo.signo === 1) esEntrada = true;
    else if (tipo.signo === 2) esEntrada = false;
    else esEntrada = null; // neutral

    // Stock de ese producto EN ESA ubicación, aplicando las filas en orden
    const clave = `${producto.id}|${idUbicacion}`;
    if (!(clave in stockSimulado)) {
      stockSimulado[clave] = stockEnUbicacionInv(producto.id, idUbicacion);
    }
    if (esEntrada === true) stockSimulado[clave] += cantidad;
    if (esEntrada === false) {
      if (stockSimulado[clave] < cantidad) {
        errores.push(
          `Fila ${numFila}: stock insuficiente de "${producto.nombre}" en ${nombreUbicacionInv(idUbicacion)} (disponible ${stockSimulado[clave]}, salida ${cantidad})`,
        );
        continue;
      }
      stockSimulado[clave] -= cantidad;
    }

    filasValidas.push({
      numFila,
      codigoProducto,
      producto,
      tipo,
      esEntrada,
      cantidad,
      costo,
      observacion,
      idUbicacion,
      stockFinal: stockSimulado[clave],
    });
  }

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
        <ul class="mb-0">${errores.map((e) => `<li>${escInv(e)}</li>`).join("")}</ul>
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
          <th>Ubicación</th>
          <th class="text-end">Costo</th>
          <th class="text-end">Stock final</th>
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
        <td><code>${escInv(f.codigoProducto)}</code></td>
        <td>${escInv(f.producto.nombre)}</td>
        <td>${escInv(f.tipo.nombre)}</td>
        <td>${badge}</td>
        <td class="text-end">${f.cantidad}</td>
        <td>${escInv(nombreUbicacionInv(f.idUbicacion))}</td>
        <td class="text-end">${f.costo !== null && f.costo !== undefined ? "Q" + f.costo.toFixed(2) : "--"}</td>
        <td class="text-end">${f.stockFinal}</td>
        <td>${escInv(f.observacion || "--")}</td>
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

      // Formato que espera el servidor: una cabecera con la lista de
      // productos en "detalles" (antes se mandaba el formato viejo y el
      // servidor rechazaba todas las filas).
      const data = {
        id_usuario:
          getCurrentUser()?.id || getCurrentUser()?.usuario_id || null,
        id_tipo_movimiento: f.tipo.id,
        id_ubicacion: f.idUbicacion || null,
        observaciones: f.observacion || "Carga masiva",
        detalles: [
          {
            id_producto: f.producto.id,
            cantidad: f.cantidad,
            costo_unitario: f.costo,
          },
        ],
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

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("cargaMasivaMovimientosModal"),
  );
  if (modal) modal.hide();

  if (fail === 0) {
    showToast(`✅ ${ok} movimientos creados correctamente`, "success");
  } else {
    // Se muestra la lista de filas con error (antes solo iba a la consola)
    mostrarResumenCargaMasiva("creados", ok, fail, errores);
    console.warn("Errores carga masiva movimientos:", errores);
  }

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

window.cancelarTraslado = cancelarTraslado;
window.actualizarStockSistemaConteo = actualizarStockSistemaConteo;
window.actualizarDisponibleTraslado = actualizarDisponibleTraslado;
window.cambiarPaginaResumen = cambiarPaginaResumen;
window.cambiarPorPaginaResumen = cambiarPorPaginaResumen;
window.recibirPorNotaEnvio = recibirPorNotaEnvio;
window.imprimirNotaEnvio = imprimirNotaEnvio;
window.mostrarPagosTraslado = mostrarPagosTraslado;
window.registrarPagoTraslado = registrarPagoTraslado;
window.anularPagoTraslado = anularPagoTraslado;
