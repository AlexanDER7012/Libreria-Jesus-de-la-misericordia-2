// productos.js

let productosData = [];
let categoriasData = [];
let marcasData = [];
let unidadesData = [];
let selectoresCatalogoProducto = {};

// CARGA DEL MÓDULO PRINCIPAL CON PESTAÑAS
// Trae TODOS los productos (el servidor da máximo 200 por petición). Antes
// esta tabla solo mostraba los primeros 50 sin avisar.
async function obtenerTodosLosProductosCatalogo() {
  const todos = [];
  for (let skip = 0; skip < 20000; skip += 200) {
    const pagina = (await api.request(`/productos?estado=todos&limit=200&skip=${skip}`)) || [];
    todos.push(...pagina);
    if (pagina.length < 200) break;
  }
  return todos;
}

// Búsqueda y paginación de la tabla de productos (Catálogo)
let busquedaProductosCatalogo = "";
let paginaProductosCatalogo = 1;
let porPaginaProductosCatalogo = 50;

const estadoListasCatalogo = {
  categorias: { busqueda: "", estado: "", pagina: 1, porPagina: 50 },
  marcas: { busqueda: "", estado: "", pagina: 1, porPagina: 50 },
  unidades: { busqueda: "", estado: "", pagina: 1, porPagina: 50 },
};

function cambiarPaginaProductosCatalogo(delta) {
  paginaProductosCatalogo += delta;
  renderProductosTable(productosData);
}

function cambiarPorPaginaProductosCatalogo(valor) {
  porPaginaProductosCatalogo = parseInt(valor) || 0; // 0 = todos
  paginaProductosCatalogo = 1;
  renderProductosTable(productosData);
}

// Filtros del Catálogo: categoría, marca, estado y stock
let filtrosProductosCatalogo = { categoria: "", marca: "", estado: "", stock: "" };

function filtrarProductosCatalogo(campo, valor) {
  filtrosProductosCatalogo[campo] = valor || "";
  paginaProductosCatalogo = 1;
  renderProductosTable(productosData);
}

function limpiarFiltrosProductosCatalogo() {
  filtrosProductosCatalogo = { categoria: "", marca: "", estado: "", stock: "" };
  busquedaProductosCatalogo = "";
  paginaProductosCatalogo = 1;
  renderProductosTable(productosData);
}

function buscarProductosCatalogo(valor) {
  busquedaProductosCatalogo = valor || "";
  paginaProductosCatalogo = 1;
  renderProductosTable(productosData);
  const input = document.getElementById("buscarProductosCatalogo");
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

// Controles comunes: "Mostrar N por página", "Mostrando X–Y de Z",
// Anterior / Página N de M / Siguiente
function htmlControlesPaginacion(o) {
  const opciones = [10, 25, 50, 100, 0]
    .map(
      (n) =>
        `<option value="${n}" ${n === o.porPagina ? "selected" : ""}>${n === 0 ? "Todos" : n}</option>`,
    )
    .join("");
  return `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 my-2">
      <div class="d-flex align-items-center gap-2">
        <small class="text-muted">Mostrar</small>
        <select class="form-select form-select-sm" style="width:auto" onchange="${o.onPorPagina}(this.value)">${opciones}</select>
        <small class="text-muted">por página</small>
      </div>
      <small class="text-muted">Mostrando ${o.total ? o.desde + 1 : 0}–${o.desde + o.cantidad} de ${o.total} ${o.etiqueta || "productos"}</small>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" onclick="${o.onPagina}(-1)" ${o.pagina <= 1 ? "disabled" : ""}>
          <i class="fas fa-chevron-left me-1"></i>Anterior
        </button>
        <span class="btn btn-outline-secondary disabled">Página ${o.pagina} de ${o.totalPaginas}</span>
        <button class="btn btn-outline-secondary" onclick="${o.onPagina}(1)" ${o.pagina >= o.totalPaginas ? "disabled" : ""}>
          Siguiente<i class="fas fa-chevron-right ms-1"></i>
        </button>
      </div>
    </div>`;
}

function renderListaCatalogo(tipo) {
  const renderers = {
    categorias: () => renderCategoriasTable(categoriasData),
    marcas: () => renderMarcasTable(marcasData),
    unidades: () => renderUnidadesTable(unidadesData),
  };
  renderers[tipo]?.();
}

function buscarListaCatalogo(tipo, valor) {
  const estado = estadoListasCatalogo[tipo];
  if (!estado) return;
  const input = document.getElementById(`buscar${tipo}Catalogo`);
  const posicion = input ? input.selectionStart : null;
  estado.busqueda = valor || "";
  estado.pagina = 1;
  renderListaCatalogo(tipo);
  const nuevoInput = document.getElementById(`buscar${tipo}Catalogo`);
  if (nuevoInput) {
    nuevoInput.focus();
    nuevoInput.setSelectionRange(posicion, posicion);
  }
}

function filtrarEstadoListaCatalogo(tipo, valor) {
  const estado = estadoListasCatalogo[tipo];
  if (!estado) return;
  estado.estado = valor || "";
  estado.pagina = 1;
  renderListaCatalogo(tipo);
}

function limpiarFiltrosListaCatalogo(tipo) {
  const estado = estadoListasCatalogo[tipo];
  if (!estado) return;
  estado.busqueda = "";
  estado.estado = "";
  estado.pagina = 1;
  renderListaCatalogo(tipo);
}

function cambiarPaginaListaCatalogo(tipo, delta) {
  const estado = estadoListasCatalogo[tipo];
  if (!estado) return;
  estado.pagina += delta;
  renderListaCatalogo(tipo);
}

function cambiarPorPaginaListaCatalogo(tipo, valor) {
  const estado = estadoListasCatalogo[tipo];
  if (!estado) return;
  estado.porPagina = parseInt(valor, 10) || 0;
  estado.pagina = 1;
  renderListaCatalogo(tipo);
}

function normalizarTextoCatalogo(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function prepararListaCatalogo(tipo, elementos, campos, etiqueta) {
  const estado = estadoListasCatalogo[tipo];
  const termino = normalizarTextoCatalogo(estado.busqueda.trim());
  const filtrados = elementos.filter((elemento) => {
    if (estado.estado === "1" && elemento.activo === 0) return false;
    if (estado.estado === "0" && elemento.activo !== 0) return false;
    return !termino || campos
      .map((campo) => elemento[campo] || "")
      .some((valor) => normalizarTextoCatalogo(valor).includes(termino));
  });
  const tamPagina =
    estado.porPagina > 0 ? estado.porPagina : filtrados.length || 1;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / tamPagina));
  estado.pagina = Math.min(Math.max(estado.pagina, 1), totalPaginas);
  const desde = (estado.pagina - 1) * tamPagina;
  const pagina = filtrados.slice(desde, desde + tamPagina);
  const controlesPaginacion = htmlControlesPaginacion({
    pagina: estado.pagina,
    totalPaginas,
    desde,
    cantidad: pagina.length,
    total: filtrados.length,
    porPagina: estado.porPagina,
    etiqueta,
    onPagina: `cambiarPaginaListaCatalogo.bind(null, '${tipo}')`,
    onPorPagina: `cambiarPorPaginaListaCatalogo.bind(null, '${tipo}')`,
  });
  return { estado, filtrados, pagina, controlesPaginacion };
}

function htmlFiltrosListaCatalogo(tipo, etiqueta, estado) {
  const busqueda = estado.busqueda
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  return `
    <div class="row mb-2 g-2 align-items-center">
      <div class="col-md-6 col-lg-4">
        <div class="input-group input-group-sm">
          <span class="input-group-text"><i class="fas fa-search"></i></span>
          <input type="text" class="form-control" id="buscar${tipo}Catalogo"
                 placeholder="Buscar ${etiqueta}..." value="${busqueda}"
                 oninput="buscarListaCatalogo('${tipo}', this.value)">
        </div>
      </div>
      <div class="col-md-3 col-lg-2 col-6">
        <select class="form-select form-select-sm" onchange="filtrarEstadoListaCatalogo('${tipo}', this.value)" title="Estado">
          <option value="" ${estado.estado === "" ? "selected" : ""}>Todos los estados</option>
          <option value="1" ${estado.estado === "1" ? "selected" : ""}>Solo activos</option>
          <option value="0" ${estado.estado === "0" ? "selected" : ""}>Solo inactivos</option>
        </select>
      </div>
      <div class="col-auto">
        <button class="btn btn-sm btn-outline-danger" onclick="limpiarFiltrosListaCatalogo('${tipo}')" title="Limpiar filtros">
          <i class="fas fa-times me-1"></i>Limpiar
        </button>
      </div>
    </div>`;
}

function mostrarAvisoSinPermisoVerCatalogo(container, modulo, seccion, accionCrear) {
  if (tienePermiso(modulo, "Ver")) return false;
  container.innerHTML = `
    <div class="alert alert-info d-flex justify-content-between align-items-center flex-wrap gap-2">
      <span>No tienes permiso para ver ${seccion}.</span>
      ${tienePermiso(modulo, "Crear") ? `<button class="btn btn-sm btn-primary" onclick="${accionCrear}">
        <i class="fas fa-plus me-1"></i>Agregar ${seccion}
      </button>` : ""}
    </div>`;
  return true;
}

async function loadProductosModule() {
  const container =
    document.getElementById("productosTableContainer") ||
    document.getElementById("mainContent");
  if (!container) return;

  // Asegurar que los modales existan
  ensureAllModals();

  container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-2 text-muted">Cargando productos...</p>
        </div>
    `;

  // Cargar todos los datos
  try {
    const [productos, categorias, marcas, unidades] = await Promise.all([
      obtenerTodosLosProductosCatalogo().catch(() => []),
      api.getCategorias().catch(() => []),
      api.getMarcas().catch(() => []),
      api.getUnidadesMedida().catch(() => []),
    ]);

    productosData = productos || [];
    categoriasData = categorias || [];
    marcasData = marcas || [];
    unidadesData = unidades || [];

    // Asignar a window para uso global
    window.productosData = productosData;
    window.categoriasData = categoriasData;
    window.marcasData = marcasData;
    window.unidadesData = unidadesData;

    // Renderizar todas las tablas
    renderProductosTable(productosData);
    renderCategoriasTable(categoriasData);
    renderMarcasTable(marcasData);
    renderUnidadesTable(unidadesData);

    // Poblar selects del modal producto
    populateSelects();
  } catch (error) {
    console.error("Error cargando datos:", error);
    document.getElementById("productosTableContainer").innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar datos: ${error.message}
            </div>
        `;
  }
}

// ============================================================
// RECARGA ESPECÍFICA POR SECCIÓN (sin tocar las otras pestañas)
// ============================================================

async function recargarProductos() {
  try {
    const productos =
      (await obtenerTodosLosProductosCatalogo().catch(() => [])) || [];
    productosData = productos;
    window.productosData = productosData;
    renderProductosTable(productosData);
  } catch (error) {
    console.error("Error recargando productos:", error);
    showToast("Error al recargar productos", "error");
  }
}

async function recargarCategorias() {
  try {
    const categorias = (await api.getCategorias().catch(() => [])) || [];
    categoriasData = categorias;
    window.categoriasData = categoriasData;
    renderCategoriasTable(categoriasData);
    populateSelects();
  } catch (error) {
    console.error("Error recargando categorías:", error);
    showToast("Error al recargar categorías", "error");
  }
}

async function recargarMarcas() {
  try {
    const marcas = (await api.getMarcas().catch(() => [])) || [];
    marcasData = marcas;
    window.marcasData = marcasData;
    renderMarcasTable(marcasData);
    populateSelects();
  } catch (error) {
    console.error("Error recargando marcas:", error);
    showToast("Error al recargar marcas", "error");
  }
}

async function recargarUnidades() {
  try {
    const unidades = (await api.getUnidadesMedida().catch(() => [])) || [];
    unidadesData = unidades;
    window.unidadesData = unidadesData;
    renderUnidadesTable(unidadesData);
    populateSelects();
  } catch (error) {
    console.error("Error recargando unidades:", error);
    showToast("Error al recargar unidades", "error");
  }
}

// FUNCIÓN PARA CREAR TODOS LOS MODALES
function ensureAllModals() {
  // Modal de Producto
  if (!document.getElementById("productoModal")) {
    const productoModalHTML = `
      <div class="modal fade" id="productoModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable modal-workspace modal-producto">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="productoModalTitle">
                <i class="fas fa-box me-2"></i>Nuevo Producto
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                  <form id="productoForm" class="producto-compact-form" onsubmit="saveProducto(event)" novalidate>
                <input type="hidden" id="productoId" />
                
                <!-- FILA 1: Código y Nombre -->
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Código / Código de barras <span class="text-danger">*</span></label>
                    <div class="input-group has-validation">
                      <span class="input-group-text"><i class="fas fa-barcode"></i></span>
                      <input type="text" class="form-control" id="productoCodigo" placeholder="Escanea o ingresa el código" autocomplete="off" required />
                      <div class="invalid-feedback" id="productoCodigoError">El código es obligatorio</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="productoNombre" placeholder="Nombre del producto" required />
                    <div class="invalid-feedback" id="productoNombreError">El nombre es obligatorio</div>
                  </div>
                </div>

                <!-- FILA 2: Categoría y Marca -->
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Categoría</label>
                    <div id="productoCategoriaSelector"></div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Marca</label>
                    <div id="productoMarcaSelector"></div>
                  </div>
                </div>

                <!-- FILA 3: Descripción -->
                <div class="row g-3 mb-3">
                  <div class="col-12">
                    <label class="form-label fw-bold">Descripción</label>
                    <textarea class="form-control" id="productoDescripcion" rows="2" placeholder="Descripción del producto"></textarea>
                  </div>
                </div>

                <!-- FILA 4: Unidades y Factor de Conversión -->
                <div class="row g-3 mb-3">
                  <div class="col-md-4">
                    <label class="form-label fw-bold">Unidad de Compra</label>
                    <select class="form-select" id="productoUnidadCompra">
                      <option value="">Seleccionar unidad</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-bold">Unidad de Venta</label>
                    <select class="form-select" id="productoUnidadVenta">
                      <option value="">Seleccionar unidad</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-bold">Factor de Conversión</label>
                    <input type="number" class="form-control" id="productoFactorConversion" value="1" step="0.01" min="0.01" />
                    <small class="text-muted">Unidades de compra por unidad de venta</small>
                  </div>
                </div>

                <!-- FILA 5: Precios y Margen -->
                <div class="row g-3 mb-3">
                  <div class="col-md-3">
                    <label class="form-label fw-bold">Precio de Compra</label>
                    <div class="input-group">
                      <span class="input-group-text">Q</span>
                      <input type="number" class="form-control" id="productoPrecioCompra" value="0" step="0.01" min="0" />
                    </div>
                    <div class="invalid-feedback" id="productoPrecioCompraError">Debe ser un número</div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label fw-bold">Precio de Venta</label>
                    <div class="input-group">
                      <span class="input-group-text">Q</span>
                      <input type="number" class="form-control" id="productoPrecioVenta" value="0" step="0.01" min="0" />
                    </div>
                    <div class="invalid-feedback" id="productoPrecioVentaError">Debe ser un número</div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label fw-bold">Margen de Ganancia (%)</label>
                    <input type="number" class="form-control" id="productoMargenGanancia" value="0" step="0.01" min="0" max="100" />
                    <small class="text-muted">Porcentaje de ganancia sobre el costo</small>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label fw-bold">Precio Automático</label>
                    <select class="form-select" id="productoPrecioAutomatico">
                      <option value="0">Manual</option>
                      <option value="1">Automático (Costo + Margen)</option>
                    </select>
                  </div>
                </div>

                <!-- FILA 6: Stock y Estado -->
                <div class="row g-3 mb-3">
                  <div class="col-md-3">
                    <label class="form-label fw-bold">Stock Mínimo</label>
                    <input type="number" class="form-control" id="productoStockMinimo" value="0" step="0.01" min="0" />
                    <small class="text-muted">Alerta de stock bajo</small>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label fw-bold">Stock Máximo</label>
                    <input type="number" class="form-control" id="productoStockMaximo" value="0" step="0.01" min="0" />
                    <small class="text-muted">Capacidad máxima de almacenamiento</small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Estado</label>
                    <select class="form-select" id="productoActivo">
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="fas fa-times me-2"></i>Cancelar
              </button>
              <button type="submit" class="btn btn-success" form="productoForm">
                <i class="fas fa-save me-2"></i>Guardar Producto
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", productoModalHTML);
    _vincularFormulario("productoForm", saveProducto);
  }

  // Modal de Categoría
  if (!document.getElementById("categoriaModal")) {
    const categoriaModalHTML = `
      <div class="modal fade" id="categoriaModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fas fa-tags me-2"></i>Categoría
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                  <form id="categoriaForm" onsubmit="saveCategoria(event)" novalidate>
                <input type="hidden" id="categoriaId" />
                <div class="mb-3">
                  <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="categoriaNombre" required />
                  <div class="invalid-feedback" id="categoriaNombreError">El nombre es obligatorio</div>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Estado</label>
                  <select class="form-select" id="categoriaActivo">
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100">Guardar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", categoriaModalHTML);
    _vincularFormulario("categoriaForm", saveCategoria);
  }

  // Modal de Marca
  if (!document.getElementById("marcaModal")) {
    const marcaModalHTML = `
      <div class="modal fade" id="marcaModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-info text-white">
              <h5 class="modal-title">
                <i class="fas fa-copyright me-2"></i>Marca
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                  <form id="marcaForm" onsubmit="saveMarca(event)" novalidate>
                <input type="hidden" id="marcaId" />
                <div class="mb-3">
                  <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="marcaNombre" required />
                  <div class="invalid-feedback" id="marcaNombreError">El nombre es obligatorio</div>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Estado</label>
                  <select class="form-select" id="marcaActivo">
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-info w-100 text-white">Guardar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", marcaModalHTML);
    _vincularFormulario("marcaForm", saveMarca);
  }

  // Modal de Unidad
  if (!document.getElementById("unidadModal")) {
    const unidadModalHTML = `
      <div class="modal fade" id="unidadModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
              <h5 class="modal-title">
                <i class="fas fa-ruler me-2"></i>Unidad de Medida
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                  <form id="unidadForm" onsubmit="saveUnidad(event)" novalidate>
                <input type="hidden" id="unidadId" />
                <div class="mb-3">
                  <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="unidadNombre" required />
                  <div class="invalid-feedback" id="unidadNombreError">El nombre es obligatorio</div>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Abreviatura</label>
                  <input type="text" class="form-control" id="unidadAbreviatura" />
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Estado</label>
                  <select class="form-select" id="unidadActivo">
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-warning w-100">Guardar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", unidadModalHTML);
    _vincularFormulario("unidadForm", saveUnidad);
  }

  // Los modales de Categoría, Marca y Unidad ya vienen escritos en
  // index.html, así que los "if" de arriba no se ejecutan y sus formularios
  // quedaban SIN función de guardar: al darle Guardar, el navegador recargaba
  // la página y no se guardaba nada. Aquí se conectan siempre.
  _vincularFormulariosCatalogo();
}

// Conecta un formulario con su función de guardar UNA sola vez
// (evita que se guarde dos veces si esta función se llama de nuevo).
function _vincularFormulario(idForm, handler) {
  const form = document.getElementById(idForm);
  if (!form || form.dataset.vinculado === "1") return;
  form.dataset.vinculado = "1";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handler(e);
  });
}

function _vincularFormulariosCatalogo() {
  _vincularFormulario("productoForm", saveProducto);
  _vincularFormulario("categoriaForm", saveCategoria);
  _vincularFormulario("marcaForm", saveMarca);
  _vincularFormulario("unidadForm", saveUnidad);
}

// POBLAR SELECTORES DEL MODAL PRODUCTO
function populateSelects() {
  if (typeof window.crearSelectorBusqueda !== "function") {
    throw new Error("No se pudo cargar el selector de búsqueda de productos");
  }

  if (!selectoresCatalogoProducto.categoria) {
    selectoresCatalogoProducto.categoria = window.crearSelectorBusqueda({
      wrapperId: "productoCategoriaSelector",
      hiddenInputId: "productoCategoria",
      searchInputId: "productoCategoriaSearchTxt",
      dropdownId: "productoCategoriaDropdown",
      getData: () => (window.categoriasData || []).filter((c) => c.activo !== 0),
      getId: (categoria) => categoria.id,
      getLabel: (categoria) => categoria.nombre || "",
      getSearchText: (categoria) => categoria.nombre || "",
      placeholder: "Buscar categoría...",
      emptyText: "Escribe para buscar categorías...",
    });
  }

  if (!selectoresCatalogoProducto.marca) {
    selectoresCatalogoProducto.marca = window.crearSelectorBusqueda({
      wrapperId: "productoMarcaSelector",
      hiddenInputId: "productoMarca",
      searchInputId: "productoMarcaSearchTxt",
      dropdownId: "productoMarcaDropdown",
      getData: () => (window.marcasData || []).filter((m) => m.activo !== 0),
      getId: (marca) => marca.id,
      getLabel: (marca) => marca.nombre || "",
      getSearchText: (marca) => marca.nombre || "",
      placeholder: "Buscar marca...",
      emptyText: "Escribe para buscar marcas...",
    });
  }

  const unidadCompraSelect = document.getElementById("productoUnidadCompra");
  if (unidadCompraSelect) {
    unidadCompraSelect.innerHTML =
      '<option value="">Seleccionar unidad</option>';
    unidadesData
      .filter((u) => u.activo !== 0)
      .forEach((u) => {
        unidadCompraSelect.innerHTML += `<option value="${u.id}">${u.nombre} (${u.abreviatura || ""})</option>`;
      });
  }

  const unidadVentaSelect = document.getElementById("productoUnidadVenta");
  if (unidadVentaSelect) {
    unidadVentaSelect.innerHTML =
      '<option value="">Seleccionar unidad</option>';
    unidadesData
      .filter((u) => u.activo !== 0)
      .forEach((u) => {
        unidadVentaSelect.innerHTML += `<option value="${u.id}">${u.nombre} (${u.abreviatura || ""})</option>`;
      });
  }
}

// PANEL: PRODUCTOS
function renderProductosTable(productos) {
  const container = document.getElementById("productosTableContainer");
  if (!container) return;
  if (mostrarAvisoSinPermisoVerCatalogo(
    container,
    "Productos",
    "productos",
    "showCreateProductoModal()",
  )) return;

  if (!productos || productos.length === 0) {
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-box fa-3x text-muted mb-3"></i>
            <p class="text-muted">No hay productos registrados</p>
            ${
              tienePermiso("Productos", "Crear")
                ? `<button class="btn btn-success btn-sm" onclick="showCreateProductoModal()">
                <i class="fas fa-plus me-2"></i>Agregar Producto
            </button>`
                : ""
            }
        </div>
    `;
    return;
  }

  // Búsqueda (código, nombre, categoría o marca) + paginación
  const termino = busquedaProductosCatalogo.trim().toLowerCase();
  const nombreCat = (p) =>
    (categoriasData.find((c) => c.id === p.id_categoria) || {}).nombre || "";
  const nombreMarca = (p) =>
    (marcasData.find((m) => m.id === p.id_marca) || {}).nombre || "";
  const fc = filtrosProductosCatalogo;
  const filtrados = productos.filter((p) => {
    if (fc.categoria && String(p.id_categoria) !== fc.categoria) return false;
    if (fc.marca && String(p.id_marca) !== fc.marca) return false;
    const activo = p.activo !== 0;
    if (fc.estado === "1" && !activo) return false;
    if (fc.estado === "0" && activo) return false;
    const bajo = (parseFloat(p.stock_actual) || 0) <= (parseFloat(p.stock_minimo) || 0);
    if (fc.stock === "bajo" && !bajo) return false;
    if (fc.stock === "sin" && (parseFloat(p.stock_actual) || 0) > 0) return false;
    if (!termino) return true;
    return `${p.codigo || ""} ${p.nombre || ""} ${nombreCat(p)} ${nombreMarca(p)}`
      .toLowerCase()
      .includes(termino);
  });
  const opcionFiltro = (valor, texto, actual) =>
    `<option value="${valor}" ${String(valor) === String(actual) ? "selected" : ""}>${String(texto).replace(/</g, "&lt;")}</option>`;
  const tamPagina =
    porPaginaProductosCatalogo > 0 ? porPaginaProductosCatalogo : filtrados.length || 1;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / tamPagina));
  if (paginaProductosCatalogo > totalPaginas) paginaProductosCatalogo = totalPaginas;
  if (paginaProductosCatalogo < 1) paginaProductosCatalogo = 1;
  const desde = (paginaProductosCatalogo - 1) * tamPagina;
  const productosPagina = filtrados.slice(desde, desde + tamPagina);
  const controles = htmlControlesPaginacion({
    pagina: paginaProductosCatalogo,
    totalPaginas,
    desde,
    cantidad: productosPagina.length,
    total: filtrados.length,
    porPagina: porPaginaProductosCatalogo,
    onPagina: "cambiarPaginaProductosCatalogo",
    onPorPagina: "cambiarPorPaginaProductosCatalogo",
  });
  const valorBusqueda = busquedaProductosCatalogo
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Productos</h6>
            <div class="d-flex gap-2">
                ${
                  tienePermiso("Productos", "Editar")
                    ? `<button class="btn btn-outline-warning btn-sm" onclick="showActualizacionMasivaProductosModal()">
                    <i class="fas fa-file-edit me-2"></i>Actualización Masiva
                </button>`
                    : ""
                }
                ${
                  tienePermiso("Productos", "Crear")
                    ? `<button class="btn btn-outline-primary btn-sm" onclick="showCargaMasivaProductosModal()">
                    <i class="fas fa-file-upload me-2"></i>Carga Masiva
                </button>`
                    : ""
                }
                ${
                  tienePermiso("Productos", "Crear")
                    ? `<button class="btn btn-success btn-sm" onclick="showCreateProductoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Producto
                </button>`
                    : ""
                }
            </div>
        </div>
        <div class="row mb-2 g-2 align-items-center">
            <div class="col-md-6 col-lg-3">
                <div class="input-group input-group-sm">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" id="buscarProductosCatalogo"
                           placeholder="Buscar por código, nombre, categoría o marca..."
                           value="${valorBusqueda}"
                           oninput="buscarProductosCatalogo(this.value)">
                </div>
            </div>
            <div class="col-md-3 col-lg-2 col-6">
                <select class="form-select form-select-sm" onchange="filtrarProductosCatalogo('categoria', this.value)" title="Categoría">
                    ${opcionFiltro("", "Todas las categorías", fc.categoria)}
                    ${categoriasData.map((c) => opcionFiltro(c.id, c.nombre, fc.categoria)).join("")}
                </select>
            </div>
            <div class="col-md-3 col-lg-2 col-6">
                <select class="form-select form-select-sm" onchange="filtrarProductosCatalogo('marca', this.value)" title="Marca">
                    ${opcionFiltro("", "Todas las marcas", fc.marca)}
                    ${marcasData.map((m) => opcionFiltro(m.id, m.nombre, fc.marca)).join("")}
                </select>
            </div>
            <div class="col-md-3 col-lg-2 col-6">
                <select class="form-select form-select-sm" onchange="filtrarProductosCatalogo('estado', this.value)" title="Estado">
                    ${opcionFiltro("", "Activos e inactivos", fc.estado)}
                    ${opcionFiltro("1", "Solo activos", fc.estado)}
                    ${opcionFiltro("0", "Solo inactivos", fc.estado)}
                </select>
            </div>
            <div class="col-md-3 col-lg-2 col-6">
                <select class="form-select form-select-sm" onchange="filtrarProductosCatalogo('stock', this.value)" title="Stock">
                    ${opcionFiltro("", "Cualquier stock", fc.stock)}
                    ${opcionFiltro("bajo", "En o bajo el mínimo", fc.stock)}
                    ${opcionFiltro("sin", "Sin existencias", fc.stock)}
                </select>
            </div>
            <div class="col-auto">
                <button class="btn btn-sm btn-outline-danger" onclick="limpiarFiltrosProductosCatalogo()" title="Limpiar filtros">
                    <i class="fas fa-times me-1"></i>Limpiar
                </button>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Marca</th>
                        <th>Precio Venta</th>
                        <th>Stock</th>
                        <th>Stock Mínimo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  productosPagina.forEach((producto) => {
    const categoria = categoriasData.find(
      (c) => c.id === producto.id_categoria,
    );
    const marca = marcasData.find((m) => m.id === producto.id_marca);
    const activo = producto.activo !== 0;
    const stockBajo = producto.stock_actual <= (producto.stock_minimo || 0);

    html += `
            <tr>
                <td><code>${producto.codigo || "--"}</code></td>
                <td><strong>${producto.nombre || "--"}</strong></td>
                <td>${categoria ? categoria.nombre : "--"}</td>
                <td>${marca ? marca.nombre : "--"}</td>
                <td>Q${producto.precio_venta || 0}</td>
                <td>
                    <span class="${stockBajo ? "text-danger fw-bold" : ""}">
                        ${producto.stock_actual || 0}
                        ${stockBajo ? '<i class="fas fa-exclamation-triangle ms-1 text-danger"></i>' : ""}
                    </span>
                </td>
                <td>${producto.stock_minimo || 0}</td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    ${
                      tienePermiso("Productos", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditProductoModal(${producto.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                        : ""
                    }
                    ${
                      tienePermiso("Productos", "Eliminar")
                        ? `<button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleProductoEstado(${producto.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
        ${controles}
    `;

  container.innerHTML = html;
}

// PRODUCTOS - CRUD

function showCreateProductoModal() {
  ensureAllModals();
  const modal = document.getElementById("productoModal");
  const form = document.getElementById("productoForm");
  const title = document.getElementById("productoModalTitle");

  if (!modal) {
    showToast("Error: Modal de producto no encontrado", "error");
    return;
  }

  title.textContent = "Nuevo Producto";
  form.reset();
  limpiarErroresFormulario("productoForm");

  document.getElementById("productoId").value = "";
  selectoresCatalogoProducto.categoria?.reset();
  selectoresCatalogoProducto.marca?.reset();
  document.getElementById("productoActivo").value = "1";
  document.getElementById("productoPrecioAutomatico").value = "0";
  document.getElementById("productoMargenGanancia").value = "0";
  document.getElementById("productoFactorConversion").value = "1";
  document.getElementById("productoStockMinimo").value = "0";
  document.getElementById("productoStockMaximo").value = "0";

  // Listo para escanear: el cursor queda en "Código" al abrir el modal
  const codigoInput = document.getElementById("productoCodigo");
  if (codigoInput) {
    codigoInput.placeholder = "Escanea el código de barras o escríbelo";
  }
  modal.addEventListener(
    "shown.bs.modal",
    () => document.getElementById("productoCodigo")?.focus(),
    { once: true },
  );

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditProductoModal(id) {
  try {
    const producto = await api.getProducto(id);
    if (!producto) {
      showToast("Producto no encontrado", "error");
      return;
    }

    const modal = document.getElementById("productoModal");
    const title = document.getElementById("productoModalTitle");

    title.textContent = "Editar Producto";
    limpiarErroresFormulario("productoForm");

    document.getElementById("productoId").value = producto.id;
    document.getElementById("productoCodigo").value = producto.codigo || "";
    document.getElementById("productoNombre").value = producto.nombre || "";
    document.getElementById("productoDescripcion").value =
      producto.descripcion || "";
    selectoresCatalogoProducto.categoria?.setValue(producto.id_categoria || "");
    selectoresCatalogoProducto.marca?.setValue(producto.id_marca || "");
    document.getElementById("productoUnidadCompra").value =
      producto.id_unidad_compra || "";
    document.getElementById("productoUnidadVenta").value =
      producto.id_unidad_venta || "";
    document.getElementById("productoFactorConversion").value =
      producto.factor_conversion || 1;
    document.getElementById("productoPrecioCompra").value =
      producto.precio_compra || 0;
    document.getElementById("productoPrecioVenta").value =
      producto.precio_venta || 0;
    document.getElementById("productoPrecioAutomatico").value =
      producto.precio_automatico || 0;
    document.getElementById("productoMargenGanancia").value =
      producto.margen_ganancia || 0;
    document.getElementById("productoStockMinimo").value =
      producto.stock_minimo || 0;
    document.getElementById("productoStockMaximo").value =
      producto.stock_maximo || 0;
    document.getElementById("productoActivo").value =
      producto.activo !== 0 ? "1" : "0";

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error cargando producto:", error);
    showToast("Error al cargar el producto", "error");
  }
}

async function saveProducto(event) {
  event.preventDefault();

  // Validaciones
  let valid = true;

  // Validar código
  const codigo = document.getElementById("productoCodigo").value.trim();
  if (!codigo) {
    mostrarErrorCampo("productoCodigo", "El código es obligatorio");
    valid = false;
  } else {
    limpiarErrorCampo("productoCodigo");
  }

  // Validar nombre
  const nombre = document.getElementById("productoNombre").value.trim();
  if (!nombre) {
    mostrarErrorCampo("productoNombre", "El nombre es obligatorio");
    valid = false;
  } else {
    limpiarErrorCampo("productoNombre");
  }

  // Validar precios numéricos
  const precioCompra = document.getElementById("productoPrecioCompra").value;
  if (precioCompra && isNaN(parseFloat(precioCompra))) {
    mostrarErrorCampo("productoPrecioCompra", "Debe ser un número");
    valid = false;
  } else {
    limpiarErrorCampo("productoPrecioCompra");
  }

  const precioVenta = document.getElementById("productoPrecioVenta").value;
  if (precioVenta && isNaN(parseFloat(precioVenta))) {
    mostrarErrorCampo("productoPrecioVenta", "Debe ser un número");
    valid = false;
  } else {
    limpiarErrorCampo("productoPrecioVenta");
  }

  if (!valid) return;

  const id = document.getElementById("productoId").value;
  const data = {
    codigo: codigo,
    nombre: nombre,
    descripcion:
      document.getElementById("productoDescripcion").value.trim() || null,
    id_categoria:
      parseInt(document.getElementById("productoCategoria").value) || null,
    id_marca: parseInt(document.getElementById("productoMarca").value) || null,
    id_unidad_compra:
      parseInt(document.getElementById("productoUnidadCompra").value) || null,
    id_unidad_venta:
      parseInt(document.getElementById("productoUnidadVenta").value) || null,
    factor_conversion:
      parseFloat(document.getElementById("productoFactorConversion").value) ||
      1,
    precio_compra:
      parseFloat(document.getElementById("productoPrecioCompra").value) || 0,
    precio_venta:
      parseFloat(document.getElementById("productoPrecioVenta").value) || 0,
    precio_automatico:
      parseInt(document.getElementById("productoPrecioAutomatico").value) || 0,
    margen_ganancia:
      parseFloat(document.getElementById("productoMargenGanancia").value) || 0,
    stock_minimo:
      parseFloat(document.getElementById("productoStockMinimo").value) || 0,
    stock_maximo:
      parseFloat(document.getElementById("productoStockMaximo").value) || 0,
    activo: parseInt(document.getElementById("productoActivo").value),
  };

  // Control de duplicidad (frontend): solo el código no se repite. Dos
  // productos pueden llamarse igual si tienen distinto código (otra marca
  // o proveedor). El servidor también lo valida.
  const claveCodigo = (v) => String(v || "").trim().toLowerCase();
  const repetido = productosData.find(
    (p) => claveCodigo(p.codigo) === claveCodigo(data.codigo) && p.id !== parseInt(id),
  );
  if (repetido) {
    showToast(`Ya existe un producto con el código "${repetido.codigo}" (${repetido.nombre})`, "warning");
    return;
  }

  // Aviso: precio de venta menor que el de compra (se vendería con pérdida)
  if (data.precio_compra > 0 && data.precio_venta > 0 && data.precio_venta < data.precio_compra) {
    const seguir = await confirmarAccion(
      `El precio de venta (Q${data.precio_venta.toFixed(2)}) es menor que el de compra (Q${data.precio_compra.toFixed(2)}): cada venta sería con pérdida.\n¿Guardar de todos modos?`,
      { titulo: "Precio de venta menor al costo", textoAceptar: "Guardar así", peligro: true },
    );
    if (!seguir) return;
  }

  try {
    let result;
    if (id) {
      result = await api.updateProducto(id, data);
      showToast("Producto actualizado correctamente", "success");
    } else {
      result = await api.createProducto(data);
      showToast(`Producto "${data.nombre}" creado correctamente`, "success");
    }

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("productoModal"),
    );
    if (modal) modal.hide();

    // Recargar datos
    await recargarProductos();
  } catch (error) {
    console.error("Error guardando producto:", error);
    showToast(error.message || "Error al guardar el producto", "error");
  }
}

async function toggleProductoEstado(id) {
  const producto = productosData.find((p) => p.id === id);
  if (!producto) {
    showToast("Producto no encontrado", "error");
    return;
  }

  const accion = producto.activo !== 0 ? "inactivar" : "activar";
  const confirmado = await mostrarConfirmacion(
    `${accion === "inactivar" ? "Inactivar" : "Activar"} Producto`,
    `¿Está seguro de ${accion} el producto "${producto.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    if (producto.activo !== 0) {
      await api.deleteProducto(id);
    } else {
      await api.request(`/productos/${id}/reactivar`, "PATCH");
    }
    showToast(
      `Producto ${accion === "inactivar" ? "inactivado" : "activado"} correctamente`,
      "success",
    );
    await recargarProductos();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

// Eliminar (usar solo como respaldo, prefiero inactivar)
async function deleteProducto(id) {
  const producto = productosData.find((p) => p.id === id);
  if (!producto) return;

  const confirmado = await mostrarConfirmacion(
    "Eliminar Producto",
    `¿Está seguro de eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
    "Eliminar",
  );

  if (!confirmado) return;

  try {
    await api.deleteProducto(id);
    showToast("Producto eliminado correctamente", "success");
    await recargarProductos();
  } catch (error) {
    showToast(error.message || "Error al eliminar el producto", "error");
  }
}

// PANEL: CATEGORÍAS
function renderCategoriasTable(categorias) {
  const container = document.getElementById("categoriasTableContainer");
  if (!container) return;
  if (mostrarAvisoSinPermisoVerCatalogo(
    container,
    "Categorias",
    "categorías",
    "showCreateCategoriaModal()",
  )) return;

  if (!categorias || categorias.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay categorías registradas</p>
                ${
                  tienePermiso("Categorias", "Crear")
                    ? `<button class="btn btn-primary btn-sm" onclick="showCreateCategoriaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Categoría
                </button>`
                    : ""
                }
            </div>
        `;
    return;
  }

  const lista = prepararListaCatalogo(
    "categorias",
    categorias,
    ["nombre"],
    "categorías",
  );
  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Categorías</h6>
            ${
              tienePermiso("Categorias", "Crear")
                ? `<button class="btn btn-primary btn-sm" onclick="showCreateCategoriaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Categoría
            </button>`
                : ""
            }
        </div>
        ${htmlFiltrosListaCatalogo("categorias", "categorías", lista.estado)}
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      lista.pagina.length
                        ? ""
                        : '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron categorías con esos filtros</td></tr>'
                    }
    `;

  lista.pagina.forEach((c) => {
    const activo = c.activo !== 0;
    html += `
            <tr>
                <td>${c.id}</td>
                <td><strong>${c.nombre}</strong></td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    ${
                      tienePermiso("Categorias", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditCategoriaModal(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                        : ""
                    }
                    ${
                      tienePermiso("Categorias", "Eliminar")
                        ? `<button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleCategoriaEstado(${c.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
        ${lista.controlesPaginacion}
    `;

  container.innerHTML = html;
}

function showCreateCategoriaModal() {
  ensureAllModals();
  const modal = document.getElementById("categoriaModal");
  if (!modal) {
    showToast("Error: Modal de categoría no encontrado", "error");
    return;
  }

  document.getElementById("categoriaForm").reset();
  document.getElementById("categoriaId").value = "";
  document.getElementById("categoriaActivo").value = "1";
  limpiarErroresFormulario("categoriaForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditCategoriaModal(id) {
  const categoria = categoriasData.find((c) => c.id === id);
  if (!categoria) {
    showToast("Categoría no encontrada", "error");
    return;
  }

  const modal = document.getElementById("categoriaModal");
  if (!modal) {
    showToast("Error: Modal de categoría no encontrado", "error");
    return;
  }

  document.getElementById("categoriaId").value = categoria.id;
  document.getElementById("categoriaNombre").value = categoria.nombre || "";
  document.getElementById("categoriaActivo").value =
    categoria.activo !== 0 ? "1" : "0";
  limpiarErroresFormulario("categoriaForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveCategoria(event) {
  event.preventDefault();

  const id = document.getElementById("categoriaId").value;
  const nombre = document.getElementById("categoriaNombre").value.trim();

  if (!nombre) {
    mostrarErrorCampo("categoriaNombre", "El nombre es obligatorio");
    return;
  }
  limpiarErrorCampo("categoriaNombre");

  // Control de duplicidad
  const exists = categoriasData.some(
    (c) =>
      c.nombre.toLowerCase() === nombre.toLowerCase() && c.id !== parseInt(id),
  );

  if (exists) {
    showToast("Ya existe una categoría con ese nombre", "warning");
    return;
  }

  const data = {
    nombre: nombre,
    activo: parseInt(document.getElementById("categoriaActivo").value),
  };

  try {
    if (id) {
      await api.request(`/categorias/${id}`, "PUT", data);
      showToast("Categoría actualizada correctamente", "success");
    } else {
      await api.createCategoria(data);
      showToast("Categoría creada correctamente", "success");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("categoriaModal"),
    );
    if (modal) modal.hide();

    await recargarCategorias();
  } catch (error) {
    showToast(error.message || "Error al guardar categoría", "error");
  }
}

async function toggleCategoriaEstado(id) {
  const categoria = categoriasData.find((c) => c.id === id);
  if (!categoria) return;

  const accion = categoria.activo !== 0 ? "inactivar" : "activar";
  const confirmado = await mostrarConfirmacion(
    `${accion === "inactivar" ? "Inactivar" : "Activar"} Categoría`,
    `¿Está seguro de ${accion} la categoría "${categoria.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    await api.request(`/categorias/${id}/estado`, "PATCH", {
      activo: categoria.activo !== 0 ? 0 : 1,
    });
    showToast(
      `Categoría ${accion === "inactivar" ? "inactivada" : "activada"} correctamente`,
      "success",
    );
    await recargarCategorias();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

// PANEL: MARCAS
function renderMarcasTable(marcas) {
  const container = document.getElementById("marcasTableContainer");
  if (!container) return;
  if (mostrarAvisoSinPermisoVerCatalogo(
    container,
    "Marcas",
    "marcas",
    "showCreateMarcaModal()",
  )) return;

  if (!marcas || marcas.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-copyright fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay marcas registradas</p>
                ${
                  tienePermiso("Marcas", "Crear")
                    ? `<button class="btn btn-info btn-sm" onclick="showCreateMarcaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Marca
                </button>`
                    : ""
                }
            </div>
        `;
    return;
  }

  const lista = prepararListaCatalogo("marcas", marcas, ["nombre"], "marcas");
  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Marcas</h6>
            ${
              tienePermiso("Marcas", "Crear")
                ? `<button class="btn btn-info btn-sm" onclick="showCreateMarcaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Marca
            </button>`
                : ""
            }
        </div>
        ${htmlFiltrosListaCatalogo("marcas", "marcas", lista.estado)}
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      lista.pagina.length
                        ? ""
                        : '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron marcas con esos filtros</td></tr>'
                    }
    `;

  lista.pagina.forEach((m) => {
    const activo = m.activo !== 0;
    html += `
            <tr>
                <td>${m.id}</td>
                <td><strong>${m.nombre}</strong></td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    ${
                      tienePermiso("Marcas", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditMarcaModal(${m.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                        : ""
                    }
                    ${
                      tienePermiso("Marcas", "Eliminar")
                        ? `<button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleMarcaEstado(${m.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
        ${lista.controlesPaginacion}
    `;

  container.innerHTML = html;
}

function showCreateMarcaModal() {
  ensureAllModals();
  const modal = document.getElementById("marcaModal");
  if (!modal) {
    showToast("Error: Modal de marca no encontrado", "error");
    return;
  }

  document.getElementById("marcaForm").reset();
  document.getElementById("marcaId").value = "";
  document.getElementById("marcaActivo").value = "1";
  limpiarErroresFormulario("marcaForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditMarcaModal(id) {
  const marca = marcasData.find((m) => m.id === id);
  if (!marca) {
    showToast("Marca no encontrada", "error");
    return;
  }

  const modal = document.getElementById("marcaModal");
  if (!modal) {
    showToast("Error: Modal de marca no encontrado", "error");
    return;
  }

  document.getElementById("marcaId").value = marca.id;
  document.getElementById("marcaNombre").value = marca.nombre || "";
  document.getElementById("marcaActivo").value = marca.activo !== 0 ? "1" : "0";
  limpiarErroresFormulario("marcaForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveMarca(event) {
  event.preventDefault();

  const id = document.getElementById("marcaId").value;
  const nombre = document.getElementById("marcaNombre").value.trim();

  if (!nombre) {
    mostrarErrorCampo("marcaNombre", "El nombre es obligatorio");
    return;
  }
  limpiarErrorCampo("marcaNombre");

  const exists = marcasData.some(
    (m) =>
      m.nombre.toLowerCase() === nombre.toLowerCase() && m.id !== parseInt(id),
  );

  if (exists) {
    showToast("Ya existe una marca con ese nombre", "warning");
    return;
  }

  const data = {
    nombre: nombre,
    activo: parseInt(document.getElementById("marcaActivo").value),
  };

  try {
    if (id) {
      await api.request(`/marcas/${id}`, "PUT", data);
      showToast("Marca actualizada correctamente", "success");
    } else {
      await api.createMarca(data);
      showToast("Marca creada correctamente", "success");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("marcaModal"),
    );
    if (modal) modal.hide();

    await recargarMarcas();
  } catch (error) {
    showToast(error.message || "Error al guardar marca", "error");
  }
}

async function toggleMarcaEstado(id) {
  const marca = marcasData.find((m) => m.id === id);
  if (!marca) return;

  const accion = marca.activo !== 0 ? "inactivar" : "activar";
  const confirmado = await mostrarConfirmacion(
    `${accion === "inactivar" ? "Inactivar" : "Activar"} Marca`,
    `¿Está seguro de ${accion} la marca "${marca.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    await api.request(`/marcas/${id}/estado`, "PATCH", {
      activo: marca.activo !== 0 ? 0 : 1,
    });
    showToast(
      `Marca ${accion === "inactivar" ? "inactivada" : "activada"} correctamente`,
      "success",
    );
    await recargarMarcas();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

// PANEL: UNIDADES
function renderUnidadesTable(unidades) {
  const container = document.getElementById("unidadesTableContainer");
  if (!container) return;
  if (mostrarAvisoSinPermisoVerCatalogo(
    container,
    "Unidades",
    "unidades",
    "showCreateUnidadModal()",
  )) return;

  if (!unidades || unidades.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-ruler fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay unidades registradas</p>
                ${
                  tienePermiso("Unidades", "Crear")
                    ? `<button class="btn btn-warning btn-sm" onclick="showCreateUnidadModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Unidad
                </button>`
                    : ""
                }
            </div>
        `;
    return;
  }

  const lista = prepararListaCatalogo(
    "unidades",
    unidades,
    ["nombre", "abreviatura"],
    "unidades",
  );
  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Unidades de Medida</h6>
            ${
              tienePermiso("Unidades", "Crear")
                ? `<button class="btn btn-warning btn-sm" onclick="showCreateUnidadModal()">
                <i class="fas fa-plus me-2"></i>Nueva Unidad
            </button>`
                : ""
            }
        </div>
        ${htmlFiltrosListaCatalogo("unidades", "unidades", lista.estado)}
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Abreviatura</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      lista.pagina.length
                        ? ""
                        : '<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron unidades con esos filtros</td></tr>'
                    }
    `;

  lista.pagina.forEach((u) => {
    const activo = u.activo !== 0;
    html += `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.nombre}</strong></td>
                <td>${u.abreviatura || "--"}</td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    ${
                      tienePermiso("Unidades", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditUnidadModal(${u.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                        : ""
                    }
                    ${
                      tienePermiso("Unidades", "Eliminar")
                        ? `<button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleUnidadEstado(${u.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
        ${lista.controlesPaginacion}
    `;

  container.innerHTML = html;
}

function showCreateUnidadModal() {
  ensureAllModals();
  const modal = document.getElementById("unidadModal");
  if (!modal) {
    showToast("Error: Modal de unidad no encontrado", "error");
    return;
  }

  document.getElementById("unidadForm").reset();
  document.getElementById("unidadId").value = "";
  document.getElementById("unidadActivo").value = "1";
  limpiarErroresFormulario("unidadForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditUnidadModal(id) {
  const unidad = unidadesData.find((u) => u.id === id);
  if (!unidad) {
    showToast("Unidad no encontrada", "error");
    return;
  }

  const modal = document.getElementById("unidadModal");
  if (!modal) {
    showToast("Error: Modal de unidad no encontrado", "error");
    return;
  }

  document.getElementById("unidadId").value = unidad.id;
  document.getElementById("unidadNombre").value = unidad.nombre || "";
  document.getElementById("unidadAbreviatura").value = unidad.abreviatura || "";
  document.getElementById("unidadActivo").value =
    unidad.activo !== 0 ? "1" : "0";
  limpiarErroresFormulario("unidadForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveUnidad(event) {
  event.preventDefault();

  const id = document.getElementById("unidadId").value;
  const nombre = document.getElementById("unidadNombre").value.trim();

  if (!nombre) {
    mostrarErrorCampo("unidadNombre", "El nombre es obligatorio");
    return;
  }
  limpiarErrorCampo("unidadNombre");

  const exists = unidadesData.some(
    (u) =>
      u.nombre.toLowerCase() === nombre.toLowerCase() && u.id !== parseInt(id),
  );

  if (exists) {
    showToast("Ya existe una unidad con ese nombre", "warning");
    return;
  }

  const data = {
    nombre: nombre,
    abreviatura:
      document.getElementById("unidadAbreviatura").value.trim() || null,
    activo: parseInt(document.getElementById("unidadActivo").value),
  };

  try {
    if (id) {
      await api.request(`/unidades-medida/${id}`, "PUT", data);
      showToast("Unidad actualizada correctamente", "success");
    } else {
      await api.request("/unidades-medida", "POST", data);
      showToast("Unidad creada correctamente", "success");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("unidadModal"),
    );
    if (modal) modal.hide();

    await recargarUnidades();
  } catch (error) {
    showToast(error.message || "Error al guardar unidad", "error");
  }
}

async function toggleUnidadEstado(id) {
  const unidad = unidadesData.find((u) => u.id === id);
  if (!unidad) return;

  const accion = unidad.activo !== 0 ? "inactivar" : "activar";
  const confirmado = await mostrarConfirmacion(
    `${accion === "inactivar" ? "Inactivar" : "Activar"} Unidad`,
    `¿Está seguro de ${accion} la unidad "${unidad.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    await api.request(`/unidades-medida/${id}/estado`, "PATCH", {
      activo: unidad.activo !== 0 ? 0 : 1,
    });
    showToast(
      `Unidad ${accion === "inactivar" ? "inactivada" : "activada"} correctamente`,
      "success",
    );
    await recargarUnidades();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

// ============================================================
// CARGA MASIVA DE PRODUCTOS
// ============================================================

let cargaMasivaProductosFilas = []; // filas parseadas del Excel
let cargaMasivaProductosValidadas = []; // filas con validación resuelta

// ------------------------------------------------------------
// MODAL
// ------------------------------------------------------------
function showCargaMasivaProductosModal() {
  let modal = document.getElementById("cargaMasivaProductosModal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "cargaMasivaProductosModal";
  modal.setAttribute("tabindex", "-1");
  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="fas fa-file-upload me-2"></i>Carga Masiva de Productos
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">

          <div class="alert alert-info small">
            <strong>Columnas del archivo</strong> (la primera fila deben ser estos encabezados):
            ${htmlGuiaColumnas([
              { nombre: "Codigo", tipo: "obligatoria", detalle: "Código único del producto (el del código de barras, si tiene). No puede repetirse." },
              { nombre: "Nombre", tipo: "obligatoria", detalle: "Nombre del producto." },
              { nombre: "Precio_Venta", tipo: "obligatoria", detalle: "Precio al público, mayor a 0. <em>Excepción:</em> si <code>Precio_Automatico</code> = 1 se calcula solo con el precio de compra y el margen." },
              { nombre: "Precio_Compra", tipo: "recomendada", detalle: "Costo del producto. Sin él no se calcula bien la utilidad ni el inventario valorizado." },
              { nombre: "Categoria", tipo: "recomendada", detalle: "Por nombre (ej. <em>Cuadernos</em>). Si no existe se crea sola." },
              { nombre: "Stock_Minimo", tipo: "recomendada", detalle: "Cantidad con la que avisa \"stock bajo\". Vacío = 0 (nunca avisa)." },
              { nombre: "Unidad_Venta", tipo: "recomendada", detalle: "Por nombre (ej. <em>Unidad</em>, <em>Resma</em>). Si no existe se crea sola." },
              { nombre: "Marca", tipo: "opcional", detalle: "Por nombre. Si no existe se crea sola." },
              { nombre: "Descripcion", tipo: "opcional", detalle: "Texto libre." },
              { nombre: "Unidad_Compra", tipo: "opcional", detalle: "Cómo se compra (ej. <em>Caja</em>). Si no existe se crea sola." },
              { nombre: "Factor_Conversion", tipo: "opcional", detalle: "Cuántas unidades de venta trae una de compra (ej. caja de 12 = 12). Vacío = 1." },
              { nombre: "Margen_Ganancia", tipo: "opcional", detalle: "Porcentaje de ganancia. Solo se usa con <code>Precio_Automatico</code> = 1." },
              { nombre: "Precio_Automatico", tipo: "opcional", detalle: "1 = el precio de venta se calcula con compra + margen; 0 o vacío = se usa <code>Precio_Venta</code>." },
              { nombre: "Stock_Maximo", tipo: "opcional", detalle: "Para el reporte de excesos. No puede ser menor que el mínimo. Vacío = sin máximo." },
            ])}
            <ul class="mb-1 small">
              <li>Todos los productos se crean <strong>activos</strong> y con <strong>stock 0</strong>. El stock inicial se carga después con la <em>Carga Masiva de Movimientos</em> (Inventario → Movimientos).</li>
              <li>Si un código ya existe, la fila sale como error (no se sobrescribe; para cambiar productos usa la <em>Actualización Masiva</em>).</li>
            </ul>
            <button class="btn btn-sm btn-outline-primary" onclick="descargarPlantillaProductos()">
              <i class="fas fa-download me-1"></i>Descargar plantilla
            </button>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Archivo Excel / CSV *</label>
            <input type="file" class="form-control" id="cmProdArchivo"
                   accept=".xlsx,.xls,.csv" onchange="procesarArchivoProductos(event)">
          </div>

          <div id="cmProdResumen" class="mb-2"></div>
          <div id="cmProdPreview" class="table-responsive" style="max-height:400px; overflow:auto;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button class="btn btn-primary" id="cmProdBtnConfirmar" disabled
                  onclick="confirmarCargaMasivaProductos()">
            <i class="fas fa-check me-1"></i>Confirmar y Crear Productos
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
function descargarPlantillaProductos() {
  const data = [
    {
      Codigo: "PROD-001",
      Nombre: "Cuaderno profesional 100 hojas",
      Descripcion: "Cuaderno rayado",
      Categoria: "Cuadernos",
      Marca: "Scribe",
      Unidad_Compra: "Unidad",
      Unidad_Venta: "Unidad",
      Factor_Conversion: 1,
      Precio_Compra: 8.5,
      Precio_Venta: 12.0,
      Margen_Ganancia: 0,
      Precio_Automatico: 0,
      Stock_Minimo: 10,
      Stock_Maximo: 200,
    },
    {
      Codigo: "PROD-002",
      Nombre: "Lápiz HB",
      Descripcion: "Lápiz grafito",
      Categoria: "Útiles",
      Marca: "Faber-Castell",
      Unidad_Compra: "Caja",
      Unidad_Venta: "Unidad",
      Factor_Conversion: 12,
      Precio_Compra: 24.0,
      Precio_Venta: 3.5,
      Margen_Ganancia: 0,
      Precio_Automatico: 0,
      Stock_Minimo: 20,
      Stock_Maximo: 500,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  descargarExcelConColores(wb, "Plantilla_Carga_Masiva_Productos.xlsx", {
    obligatorias: ["Codigo", "Nombre", "Precio_Venta"],
    recomendadas: ["Precio_Compra", "Categoria", "Stock_Minimo", "Unidad_Venta"],
  });
  showToast("Plantilla descargada", "success");
}

// ------------------------------------------------------------
// LEER ARCHIVO
// ------------------------------------------------------------
function procesarArchivoProductos(event) {
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

      cargaMasivaProductosFilas = rows;
      validarYPrevisualizarProductos();
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
let avisosCargaProductos = [];

// Para comparar nombres sin importar mayúsculas, tildes ni espacios de más
// (igual que el servidor: "Utiles" y "Útiles" son la misma categoría)
function _claveNombreCM(v) {
  return String(v || "").trim().replace(/\s+/g, " ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function validarYPrevisualizarProductos() {
  const categorias = categoriasData || [];
  const marcas = marcasData || [];
  const unidades = unidadesData || [];

  const errores = [];
  const filasValidas = [];
  avisosCargaProductos = [];

  // Códigos ya existentes y duplicados en el archivo
  const codigosExistentes = new Set(
    (productosData || []).map((p) =>
      String(p.codigo || "")
        .trim()
        .toLowerCase(),
    ),
  );
  const codigosEnArchivo = new Set();

  cargaMasivaProductosFilas.forEach((row, idx) => {
    const numFila = idx + 2;
    const codigo = String(row.Codigo || "").trim();
    const nombre = String(row.Nombre || "").trim();

    if (!codigo) {
      errores.push(`Fila ${numFila}: falta Codigo`);
      return;
    }
    if (!nombre) {
      errores.push(`Fila ${numFila}: falta Nombre`);
      return;
    }
    // Etiquetas <...>: el servidor las rechaza; se avisa antes de confirmar
    const colConEtiqueta = Object.keys(row).find((col) => tieneEtiquetaHtmlCM(row[col]));
    if (colConEtiqueta) {
      errores.push(`Fila ${numFila}: ${colConEtiqueta} no puede llevar etiquetas como <...>`);
      return;
    }

    const codigoLower = codigo.toLowerCase();
    if (codigosExistentes.has(codigoLower)) {
      errores.push(`Fila ${numFila}: el código "${codigo}" ya existe`);
      return;
    }
    if (codigosEnArchivo.has(codigoLower)) {
      errores.push(
        `Fila ${numFila}: código "${codigo}" duplicado en el archivo`,
      );
      return;
    }
    codigosEnArchivo.add(codigoLower);

    // Resolver categoría/marca/unidades por nombre
    const categoriaNombre = String(row.Categoria || "").trim();
    const marcaNombre = String(row.Marca || "").trim();
    const unidadCompraNombre = String(row.Unidad_Compra || "").trim();
    const unidadVentaNombre = String(row.Unidad_Venta || "").trim();

    const categoriaExistente = categoriaNombre
      ? categorias.find(
          (c) => _claveNombreCM(c.nombre) === _claveNombreCM(categoriaNombre),
        )
      : null;
    const marcaExistente = marcaNombre
      ? marcas.find(
          (m) => _claveNombreCM(m.nombre) === _claveNombreCM(marcaNombre),
        )
      : null;
    const unidadCompraExistente = unidadCompraNombre
      ? unidades.find(
          (u) => _claveNombreCM(u.nombre) === _claveNombreCM(unidadCompraNombre),
        )
      : null;
    const unidadVentaExistente = unidadVentaNombre
      ? unidades.find(
          (u) => _claveNombreCM(u.nombre) === _claveNombreCM(unidadVentaNombre),
        )
      : null;

    // Números: vacío = valor por defecto; texto o negativo = error
    // (antes un negativo o un texto pasaba y la fila fallaba al crearla)
    const numero = (campo, porDefecto) => {
      const t = String(row[campo] ?? "").trim();
      if (t === "") return porDefecto;
      const n = Number(t.replace(",", "."));
      return isNaN(n) ? NaN : n;
    };
    const precioCompra = numero("Precio_Compra", 0);
    const precioVenta = numero("Precio_Venta", 0);
    const margen = numero("Margen_Ganancia", 0);
    const factor = numero("Factor_Conversion", 1);
    const stockMin = numero("Stock_Minimo", 0);
    const stockMax = numero("Stock_Maximo", 0);
    const automatico = parseInt(row.Precio_Automatico) === 1 ? 1 : 0;
    const malos = [
      ["Precio_Compra", precioCompra], ["Precio_Venta", precioVenta], ["Margen_Ganancia", margen],
      ["Stock_Minimo", stockMin], ["Stock_Maximo", stockMax],
    ].filter(([, v]) => isNaN(v) || v < 0);
    if (malos.length) {
      errores.push(`Fila ${numFila}: ${malos.map(([c]) => c).join(", ")} debe ser un número de 0 en adelante`);
      return;
    }
    if (isNaN(factor) || factor <= 0) {
      errores.push(`Fila ${numFila}: Factor_Conversion debe ser mayor a 0`);
      return;
    }
    if (automatico) {
      if (!(precioCompra > 0) || !(margen > 0)) {
        errores.push(`Fila ${numFila}: con Precio_Automatico = 1 hay que poner Precio_Compra y Margen_Ganancia`);
        return;
      }
    } else if (!(precioVenta > 0)) {
      errores.push(`Fila ${numFila}: falta Precio_Venta (o usa Precio_Automatico = 1 con compra y margen)`);
      return;
    }
    if (stockMax > 0 && stockMin > stockMax) {
      errores.push(`Fila ${numFila}: Stock_Minimo (${stockMin}) es mayor que Stock_Maximo (${stockMax})`);
      return;
    }
    if (!automatico && precioCompra > 0 && precioVenta < precioCompra) {
      avisosCargaProductos.push(`Fila ${numFila}: "${nombre}" se vendería con pérdida (venta Q${precioVenta.toFixed(2)} < compra Q${precioCompra.toFixed(2)})`);
    }

    filasValidas.push({
      numFila,
      codigo,
      nombre,
      descripcion: String(row.Descripcion || "").trim() || null,
      categoriaNombre: categoriaNombre || null,
      categoriaExistente,
      marcaNombre: marcaNombre || null,
      marcaExistente,
      unidadCompraNombre: unidadCompraNombre || null,
      unidadCompraExistente,
      unidadVentaNombre: unidadVentaNombre || null,
      unidadVentaExistente,
      factor_conversion: factor,
      precio_compra: precioCompra,
      precio_venta: precioVenta,
      margen_ganancia: margen,
      precio_automatico: automatico,
      stock_minimo: stockMin,
      stock_maximo: stockMax,
    });
  });

  cargaMasivaProductosValidadas = filasValidas;
  renderPreviewProductos(errores, filasValidas);

  const btn = document.getElementById("cmProdBtnConfirmar");
  if (btn) btn.disabled = errores.length > 0 || filasValidas.length === 0;
}

// ------------------------------------------------------------
// PREVISUALIZACIÓN
// ------------------------------------------------------------
function renderPreviewProductos(errores, filas) {
  const resumen = document.getElementById("cmProdResumen");
  const preview = document.getElementById("cmProdPreview");

  resumen.innerHTML = `
    <div class="row g-2">
      <div class="col-md-4">
        <div class="alert alert-${filas.length ? "success" : "secondary"} py-2 mb-0">
          <strong>${filas.length}</strong> productos válidos
        </div>
      </div>
      <div class="col-md-4">
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
        <ul class="mb-0">${errores.map((e) => `<li>${escaparHtmlEscaner(e)}</li>`).join("")}</ul>
      </div>`
        : ""
    }
    ${
      avisosCargaProductos.length
        ? `
      <div class="alert alert-warning small mt-2 mb-0" style="max-height:120px; overflow:auto;">
        <strong>Avisos (no impiden la carga):</strong>
        <ul class="mb-0">${avisosCargaProductos.map((e) => `<li>${escaparHtmlEscaner(e)}</li>`).join("")}</ul>
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
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Marca</th>
          <th>Und. Compra</th>
          <th>Und. Venta</th>
          <th>P. Venta</th>
          <th>Stock Mín.</th>
        </tr>
      </thead>
      <tbody>
  `;
  filas.forEach((f, i) => {
    const catMostrar = f.categoriaNombre
      ? f.categoriaNombre + (f.categoriaExistente ? "" : " ⭐")
      : "--";
    const marcaMostrar = f.marcaNombre
      ? f.marcaNombre + (f.marcaExistente ? "" : " ⭐")
      : "--";
    const undCMostrar = f.unidadCompraNombre
      ? f.unidadCompraNombre + (f.unidadCompraExistente ? "" : " ⭐")
      : "--";
    const undVMostrar = f.unidadVentaNombre
      ? f.unidadVentaNombre + (f.unidadVentaExistente ? "" : " ⭐")
      : "--";

    html += `
      <tr>
        <td>${i + 1}</td>
        <td><code>${escaparHtmlEscaner(f.codigo)}</code></td>
        <td>${escaparHtmlEscaner(f.nombre)}</td>
        <td>${escaparHtmlEscaner(catMostrar)}</td>
        <td>${escaparHtmlEscaner(marcaMostrar)}</td>
        <td>${escaparHtmlEscaner(undCMostrar)}</td>
        <td>${escaparHtmlEscaner(undVMostrar)}</td>
        <td>Q${f.precio_venta.toFixed(2)}</td>
        <td>${f.stock_minimo}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  html += `<div class="small text-muted">⭐ = se creará automáticamente</div>`;
  preview.innerHTML = html;
}

// ------------------------------------------------------------
// CONFIRMAR Y EJECUTAR
// ------------------------------------------------------------
async function confirmarCargaMasivaProductos() {
  if (cargaMasivaProductosValidadas.length === 0) {
    showToast("No hay productos para procesar", "warning");
    return;
  }

  const btn = document.getElementById("cmProdBtnConfirmar");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Procesando...`;

  let ok = 0,
    fail = 0;
  const errores = [];

  // Caches para no crear dos veces la misma categoría/marca/unidad
  const cacheCategorias = {};
  const cacheMarcas = {};
  const cacheUnidades = {};

  // Precargar caches con los existentes
  (categoriasData || []).forEach((c) => {
    cacheCategorias[_claveNombreCM(c.nombre)] = c.id;
  });
  (marcasData || []).forEach((m) => {
    cacheMarcas[_claveNombreCM(m.nombre)] = m.id;
  });
  (unidadesData || []).forEach((u) => {
    cacheUnidades[_claveNombreCM(u.nombre)] = u.id;
  });

  // Helpers para crear si no existe
  async function obtenerCategoriaId(nombre) {
    if (!nombre) return null;
    const key = _claveNombreCM(nombre);
    if (cacheCategorias[key]) return cacheCategorias[key];
    try {
      const result = await api.createCategoria({ nombre, activo: 1 });
      cacheCategorias[key] = result.id;
      return result.id;
    } catch (e) {
      // Si falla porque ya existe, intentar recuperarla
      try {
        const cats = await api.getCategorias();
        const found = (cats || []).find(
          (c) => _claveNombreCM(c.nombre) === key,
        );
        if (found) {
          cacheCategorias[key] = found.id;
          return found.id;
        }
      } catch (_) {}
      throw e;
    }
  }

  async function obtenerMarcaId(nombre) {
    if (!nombre) return null;
    const key = _claveNombreCM(nombre);
    if (cacheMarcas[key]) return cacheMarcas[key];
    try {
      const result = await api.createMarca({ nombre, activo: 1 });
      cacheMarcas[key] = result.id;
      return result.id;
    } catch (e) {
      try {
        const arr = await api.getMarcas();
        const found = (arr || []).find(
          (m) => _claveNombreCM(m.nombre) === key,
        );
        if (found) {
          cacheMarcas[key] = found.id;
          return found.id;
        }
      } catch (_) {}
      throw e;
    }
  }

  async function obtenerUnidadId(nombre) {
    if (!nombre) return null;
    const key = _claveNombreCM(nombre);
    if (cacheUnidades[key]) return cacheUnidades[key];
    try {
      const result = await api.request("/unidades-medida", "POST", {
        nombre,
        activo: 1,
      });
      cacheUnidades[key] = result.id;
      return result.id;
    } catch (e) {
      try {
        const arr = await api.getUnidadesMedida();
        const found = (arr || []).find(
          (u) => _claveNombreCM(u.nombre) === key,
        );
        if (found) {
          cacheUnidades[key] = found.id;
          return found.id;
        }
      } catch (_) {}
      throw e;
    }
  }

  for (const f of cargaMasivaProductosValidadas) {
    try {
      const id_categoria = await obtenerCategoriaId(f.categoriaNombre);
      const id_marca = await obtenerMarcaId(f.marcaNombre);
      const id_unidad_compra = await obtenerUnidadId(f.unidadCompraNombre);
      const id_unidad_venta = await obtenerUnidadId(f.unidadVentaNombre);

      const data = {
        codigo: f.codigo,
        nombre: f.nombre,
        descripcion: f.descripcion,
        id_categoria,
        id_marca,
        id_unidad_compra,
        id_unidad_venta,
        factor_conversion: f.factor_conversion,
        precio_compra: f.precio_compra,
        precio_venta: f.precio_venta,
        precio_automatico: f.precio_automatico,
        margen_ganancia: f.margen_ganancia,
        stock_minimo: f.stock_minimo,
        stock_maximo: f.stock_maximo,
        activo: 1,
      };

      await api.createProducto(data);
      ok++;
    } catch (err) {
      fail++;
      errores.push(
        `Fila ${f.numFila} (${f.codigo}): ${err.message || "error"}`,
      );
    }
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("cargaMasivaProductosModal"),
  );
  if (modal) modal.hide();

  if (fail === 0) {
    showToast(`✅ ${ok} productos creados correctamente`, "success");
  } else {
    // Se muestra la lista de filas con error (antes solo iba a la consola)
    mostrarResumenCargaMasiva("creados", ok, fail, errores);
    console.warn("Errores carga masiva productos:", errores);
  }

  // Recargar cada sección por separado (porque la carga puede crear
  // categorías/marcas/unidades nuevas)
  // Primero los catálogos y DESPUÉS los productos: la carga puede crear
  // categorías/marcas/unidades nuevas, y si la tabla de productos se dibuja
  // antes, esas columnas salen "--" hasta recargar la página.
  await recargarCategorias();
  await recargarMarcas();
  await recargarUnidades();
  await recargarProductos();
}

// ============================================================
// ACTUALIZACIÓN MASIVA DE PRODUCTOS
// ============================================================

let actualizacionMasivaFilas = []; // filas parseadas del Excel
let actualizacionMasivaValidadas = []; // filas con diff calculado

// ------------------------------------------------------------
// MODAL
// ------------------------------------------------------------
function showActualizacionMasivaProductosModal() {
  let modal = document.getElementById("actualizacionMasivaProductosModal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "actualizacionMasivaProductosModal";
  modal.setAttribute("tabindex", "-1");
  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-warning text-dark">
          <h5 class="modal-title">
            <i class="fas fa-file-edit me-2"></i>Actualización Masiva de Productos
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">

          <div class="alert alert-info small">
            <strong>¿Cómo funciona?</strong>
            <ol class="mb-2 mt-1 small">
              <li>Descarga el archivo con <strong>todo el inventario actual</strong>.</li>
              <li>Marca <code>SI</code> en la columna <strong>Actualizar</strong> de las filas que quieras modificar.</li>
              <li>Edita los campos que desees cambiar.</li>
              <li>Sube el archivo → revisa el diff → confirma.</li>
            </ol>
            ${htmlGuiaColumnas([
              { nombre: "Actualizar", tipo: "obligatoria", detalle: "<code>SI</code> en las filas que quieres cambiar (también acepta S, 1, X). Las filas con <code>NO</code> se ignoran." },
              { nombre: "Codigo", tipo: "obligatoria", detalle: "Identifica el producto. <strong>No lo cambies</strong>; si lo cambias se intenta buscar por Nombre." },
              { nombre: "Nombre, Precio_Venta, Precio_Compra, Categoria, Stock_Minimo…", tipo: "opcional", detalle: "Edita solo lo que quieras cambiar; lo que dejes igual no se modifica. Categoría, marca y unidades van por nombre." },
              { nombre: "Activo", tipo: "opcional", detalle: "<code>Activo</code>/<code>Inactivo</code> (también SI/NO, 1/0)." },
              { nombre: "Stock_Actual", tipo: "informativa", detalle: "Solo para que lo veas: si lo cambias se ignora. El stock se cambia con movimientos o ajustes de inventario." },
            ])}
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-warning" onclick="descargarInventarioActual()">
                <i class="fas fa-download me-1"></i>Descargar inventario actual
              </button>
            </div>
          </div>

          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="cmActProdModoPrueba">
            <label class="form-check-label fw-bold" for="cmActProdModoPrueba">
              Modo prueba (solo previsualizar, no aplicar cambios)
            </label>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Archivo Excel / CSV *</label>
            <input type="file" class="form-control" id="cmActProdArchivo"
                   accept=".xlsx,.xls,.csv" onchange="procesarArchivoActualizacion(event)">
          </div>

          <div id="cmActProdResumen" class="mb-2"></div>
          <div id="cmActProdPreview" class="table-responsive" style="max-height:400px; overflow:auto;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button class="btn btn-warning" id="cmActProdBtnConfirmar" disabled
                  onclick="confirmarActualizacionMasivaProductos()">
            <i class="fas fa-check me-1"></i>Aplicar Actualizaciones
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
// DESCARGAR INVENTARIO ACTUAL
// ------------------------------------------------------------
function descargarInventarioActual() {
  if (!productosData || productosData.length === 0) {
    showToast("No hay productos para exportar", "warning");
    return;
  }

  // Mapa de categorías/marcas/unidades para nombre
  const mapCat = {};
  (categoriasData || []).forEach((c) => (mapCat[c.id] = c.nombre));
  const mapMarca = {};
  (marcasData || []).forEach((m) => (mapMarca[m.id] = m.nombre));
  const mapUnd = {};
  (unidadesData || []).forEach((u) => (mapUnd[u.id] = u.nombre));

  const data = productosData.map((p) => ({
    Actualizar: "NO",
    Codigo: p.codigo || "",
    Nombre: p.nombre || "",
    Descripcion: p.descripcion || "",
    Categoria: mapCat[p.id_categoria] || "",
    Marca: mapMarca[p.id_marca] || "",
    Unidad_Compra: mapUnd[p.id_unidad_compra] || "",
    Unidad_Venta: mapUnd[p.id_unidad_venta] || "",
    Factor_Conversion: p.factor_conversion || 1,
    Precio_Compra: p.precio_compra || 0,
    Precio_Venta: p.precio_venta || 0,
    Margen_Ganancia: p.margen_ganancia || 0,
    Precio_Automatico: p.precio_automatico || 0,
    Stock_Minimo: p.stock_minimo || 0,
    Stock_Maximo: p.stock_maximo || 0,
    Stock_Actual: p.stock_actual || 0,
    Activo: p.activo !== 0 ? "Activo" : "Inactivo",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");
  descargarExcelConColores(
    wb,
    `Inventario_${hoyISOGuatemala()}.xlsx`,
    { obligatorias: ["Actualizar", "Codigo"], informativas: ["Stock_Actual"] },
  );
  showToast("Inventario descargado", "success");
}

// ------------------------------------------------------------
// LEER ARCHIVO
// ------------------------------------------------------------
function procesarArchivoActualizacion(event) {
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

      actualizacionMasivaFilas = rows;
      validarYPrevisualizarActualizacion();
    } catch (err) {
      console.error(err);
      showToast("Error al leer el archivo: " + err.message, "error");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ------------------------------------------------------------
// HELPERS DE PARSEO
// ------------------------------------------------------------
function _esSi(valor) {
  const v = String(valor || "")
    .trim()
    .toUpperCase();
  return ["SI", "SÍ", "S", "YES", "Y", "1", "TRUE", "X"].includes(v);
}

function _parseActivo(valor, valorActual) {
  // ?? y no ||: un 0 que viene como número del Excel antes se ignoraba
  const v = String(valor ?? "")
    .trim()
    .toUpperCase();
  if (["ACTIVO", "SI", "SÍ", "1", "TRUE"].includes(v)) return 1;
  if (["INACTIVO", "NO", "0", "FALSE"].includes(v)) return 0;
  return valorActual; // si está vacío o no reconocido, no cambia
}

// ------------------------------------------------------------
// VALIDACIÓN Y PREVISUALIZACIÓN (con diff)
// ------------------------------------------------------------
function validarYPrevisualizarActualizacion() {
  const productos = productosData || [];
  const categorias = categoriasData || [];
  const marcas = marcasData || [];
  const unidades = unidadesData || [];

  const errores = [];
  const advertencias = [];
  const cambios = [];

  // Solo filas marcadas con SI en Actualizar
  const filasMarcadas = [];
  actualizacionMasivaFilas.forEach((row, idx) => {
    if (_esSi(row.Actualizar)) {
      filasMarcadas.push({ row, numFila: idx + 2 });
    }
  });

  if (filasMarcadas.length === 0) {
    const btn = document.getElementById("cmActProdBtnConfirmar");
    if (btn) btn.disabled = true;
    document.getElementById("cmActProdResumen").innerHTML =
      '<div class="alert alert-warning mb-0">No hay filas marcadas con <strong>SI</strong> en la columna <em>Actualizar</em>.</div>';
    document.getElementById("cmActProdPreview").innerHTML = "";
    return;
  }

  // Mapas de búsqueda
  const porCodigo = {};
  const porNombre = {};
  productos.forEach((p) => {
    if (p.codigo) porCodigo[String(p.codigo).trim().toLowerCase()] = p;
    if (p.nombre) {
      const key = String(p.nombre).trim().toLowerCase();
      if (!porNombre[key]) porNombre[key] = [];
      porNombre[key].push(p);
    }
  });

  const codigosProcesados = new Set();

  filasMarcadas.forEach(({ row, numFila }) => {
    const codigoArchivo = String(row.Codigo || "").trim();
    const nombreArchivo = String(row.Nombre || "").trim();

    if (!codigoArchivo) {
      errores.push(`Fila ${numFila}: falta Codigo`);
      return;
    }

    // Buscar por código
    let productoEncontrado = porCodigo[codigoArchivo.toLowerCase()];
    let metodoBusqueda = "codigo";

    // Si no se encontró por código, buscar por nombre (respaldo)
    if (!productoEncontrado && nombreArchivo) {
      const matches = porNombre[nombreArchivo.toLowerCase()] || [];
      if (matches.length === 1) {
        productoEncontrado = matches[0];
        metodoBusqueda = "nombre";
        advertencias.push(
          `Fila ${numFila}: el código "${codigoArchivo}" no existe. Se encontró por nombre "${nombreArchivo}".`,
        );
      } else if (matches.length > 1) {
        errores.push(
          `Fila ${numFila}: código "${codigoArchivo}" no existe y el nombre "${nombreArchivo}" coincide con ${matches.length} productos. Ambiguo.`,
        );
        return;
      }
    }

    if (!productoEncontrado) {
      errores.push(
        `Fila ${numFila}: no se encontró producto con código "${codigoArchivo}" ni nombre "${nombreArchivo}".`,
      );
      return;
    }

    if (codigosProcesados.has(productoEncontrado.id)) {
      errores.push(
        `Fila ${numFila}: el producto "${productoEncontrado.codigo}" ya fue procesado en otra fila.`,
      );
      return;
    }
    codigosProcesados.add(productoEncontrado.id);

    // Validar duplicado de nombre (si se cambió el nombre)
    if (
      nombreArchivo &&
      nombreArchivo.toLowerCase() !==
        (productoEncontrado.nombre || "").toLowerCase()
    ) {
      const matches = porNombre[nombreArchivo.toLowerCase()] || [];
      const otro = matches.find((p) => p.id !== productoEncontrado.id);
      if (otro) {
        errores.push(
          `Fila ${numFila}: el nombre "${nombreArchivo}" ya existe en el producto "${otro.codigo}".`,
        );
        return;
      }
    }

    // Celda vacía o columna que no viene = SE DEJA COMO ESTÁ.
    // (Antes una celda vacía ponía el precio en 0, borraba la categoría,
    // la marca, la descripción y el stock mínimo.)
    const conValor = (col) =>
      Object.prototype.hasOwnProperty.call(row, col) &&
      String(row[col] ?? "").trim() !== "";
    const erroresFila = [];
    const texto = (col, actual) => (conValor(col) ? String(row[col]).trim() : actual || "");
    const numero = (col, actual, { mayorQueCero = false } = {}) => {
      if (!conValor(col)) return Number(actual || 0);
      const n = Number(String(row[col]).trim());
      if (!Number.isFinite(n) || n < 0 || (mayorQueCero && n <= 0)) {
        erroresFila.push(
          `${col} debe ser un número ${mayorQueCero ? "mayor a 0" : "de 0 en adelante"} (tiene "${row[col]}")`,
        );
        return Number(actual || 0);
      }
      return n;
    };
    const nombreDe = (lista, id) => ((lista || []).find((x) => x.id === id) || {}).nombre || "";

    const catActual = nombreDe(categorias, productoEncontrado.id_categoria);
    const marcaActual = nombreDe(marcas, productoEncontrado.id_marca);
    const undCActual = nombreDe(unidades, productoEncontrado.id_unidad_compra);
    const undVActual = nombreDe(unidades, productoEncontrado.id_unidad_venta);
    const catNombre = texto("Categoria", catActual);
    const marcaNombre = texto("Marca", marcaActual);
    const undCNombre = texto("Unidad_Compra", undCActual);
    const undVNombre = texto("Unidad_Venta", undVActual);
    const esNuevo = (lista, nombre) =>
      nombre && !(lista || []).some((x) => _claveNombreCM(x.nombre) === _claveNombreCM(nombre));
    const etiqueta = (lista, nombre) => (esNuevo(lista, nombre) ? `${nombre} (nueva)` : nombre);

    const finales = {
      codigo: productoEncontrado.codigo, // no se cambia
      nombre: nombreArchivo || productoEncontrado.nombre,
      descripcion: texto("Descripcion", productoEncontrado.descripcion) || null,
      categoriaNombre: catNombre || null,
      marcaNombre: marcaNombre || null,
      unidadCompraNombre: undCNombre || null,
      unidadVentaNombre: undVNombre || null,
      factor_conversion: numero("Factor_Conversion", productoEncontrado.factor_conversion || 1, { mayorQueCero: true }),
      precio_compra: numero("Precio_Compra", productoEncontrado.precio_compra),
      precio_venta: numero("Precio_Venta", productoEncontrado.precio_venta),
      margen_ganancia: numero("Margen_Ganancia", productoEncontrado.margen_ganancia),
      precio_automatico: conValor("Precio_Automatico")
        ? (parseInt(row.Precio_Automatico) === 1 ? 1 : 0)
        : productoEncontrado.precio_automatico || 0,
      stock_minimo: numero("Stock_Minimo", productoEncontrado.stock_minimo),
      stock_maximo: numero("Stock_Maximo", productoEncontrado.stock_maximo),
      activo: _parseActivo(row.Activo, productoEncontrado.activo !== 0 ? 1 : 0),
    };
    if (finales.stock_maximo > 0 && finales.stock_minimo > finales.stock_maximo) {
      erroresFila.push(`Stock_Minimo (${finales.stock_minimo}) es mayor que Stock_Maximo (${finales.stock_maximo})`);
    }
    if (!finales.precio_automatico && finales.precio_venta <= 0) {
      erroresFila.push("Precio_Venta debe ser mayor a 0");
    }
    const conEtiqueta = ["Nombre", "Descripcion", "Categoria", "Marca", "Unidad_Compra", "Unidad_Venta"].find(
      (col) => tieneEtiquetaHtmlCM(row[col]),
    );
    if (conEtiqueta) erroresFila.push(`${conEtiqueta} no puede llevar etiquetas como <...>`);
    if (erroresFila.length) {
      erroresFila.forEach((e) => errores.push(`Fila ${numFila} (${productoEncontrado.codigo}): ${e}`));
      return;
    }
    if (finales.precio_venta > 0 && finales.precio_compra > finales.precio_venta) {
      advertencias.push(
        `Fila ${numFila} (${productoEncontrado.codigo}): se vendería con pérdida (compra Q${finales.precio_compra}, venta Q${finales.precio_venta})`,
      );
    }

    // Diferencias para la vista previa
    const diff = [];
    const pushDiff = (campo, antes, despues) => {
      if (String(antes ?? "") !== String(despues ?? "")) diff.push({ campo, antes, despues });
    };
    pushDiff("Nombre", productoEncontrado.nombre || "", finales.nombre);
    pushDiff("Descripcion", productoEncontrado.descripcion || "", finales.descripcion || "");
    if (_claveNombreCM(catActual) !== _claveNombreCM(catNombre)) pushDiff("Categoria", catActual, etiqueta(categorias, catNombre));
    if (_claveNombreCM(marcaActual) !== _claveNombreCM(marcaNombre)) pushDiff("Marca", marcaActual, etiqueta(marcas, marcaNombre));
    if (_claveNombreCM(undCActual) !== _claveNombreCM(undCNombre)) pushDiff("Unidad_Compra", undCActual, etiqueta(unidades, undCNombre));
    if (_claveNombreCM(undVActual) !== _claveNombreCM(undVNombre)) pushDiff("Unidad_Venta", undVActual, etiqueta(unidades, undVNombre));
    pushDiff("Factor_Conversion", Number(productoEncontrado.factor_conversion || 1), finales.factor_conversion);
    pushDiff("Precio_Compra", Number(productoEncontrado.precio_compra || 0), finales.precio_compra);
    pushDiff("Precio_Venta", Number(productoEncontrado.precio_venta || 0), finales.precio_venta);
    pushDiff("Margen_Ganancia", Number(productoEncontrado.margen_ganancia || 0), finales.margen_ganancia);
    pushDiff("Precio_Automatico", productoEncontrado.precio_automatico || 0, finales.precio_automatico);
    pushDiff("Stock_Minimo", Number(productoEncontrado.stock_minimo || 0), finales.stock_minimo);
    pushDiff("Stock_Maximo", Number(productoEncontrado.stock_maximo || 0), finales.stock_maximo);
    pushDiff("Activo", productoEncontrado.activo !== 0 ? 1 : 0, finales.activo);

    // Advertir si modificaron Stock_Actual
    const stockActualArchivo = row.Stock_Actual;
    if (
      stockActualArchivo !== undefined &&
      String(stockActualArchivo).trim() !== ""
    ) {
      const stockNum = parseFloat(stockActualArchivo);
      if (
        !isNaN(stockNum) &&
        stockNum !== (productoEncontrado.stock_actual || 0)
      ) {
        advertencias.push(
          `Fila ${numFila}: se ignoró la modificación de Stock_Actual (el stock solo se cambia por movimientos).`,
        );
      }
    }

    cambios.push({
      numFila,
      metodoBusqueda,
      producto: productoEncontrado,
      diff,
      finales,
    });
  });

  actualizacionMasivaValidadas = cambios;
  renderPreviewActualizacion(errores, advertencias, cambios);

  const btn = document.getElementById("cmActProdBtnConfirmar");
  if (btn) btn.disabled = errores.length > 0 || cambios.length === 0;
}

// ------------------------------------------------------------
// PREVISUALIZACIÓN (con diff)
// ------------------------------------------------------------
function renderPreviewActualizacion(errores, advertencias, cambios) {
  const resumen = document.getElementById("cmActProdResumen");
  const preview = document.getElementById("cmActProdPreview");

  let totalCambiosCampos = 0;
  cambios.forEach((c) => (totalCambiosCampos += c.diff.length));

  resumen.innerHTML = `
    <div class="row g-2">
      <div class="col-md-4">
        <div class="alert alert-${cambios.length ? "success" : "secondary"} py-2 mb-0">
          <strong>${cambios.length}</strong> productos a actualizar
        </div>
      </div>
      <div class="col-md-4">
        <div class="alert alert-info py-2 mb-0">
          <strong>${totalCambiosCampos}</strong> cambios de campos
        </div>
      </div>
      <div class="col-md-4">
        <div class="alert alert-${errores.length ? "danger" : "secondary"} py-2 mb-0">
          <strong>${errores.length}</strong> errores
        </div>
      </div>
    </div>
    ${
      errores.length
        ? `
      <div class="alert alert-danger small mt-2 mb-0" style="max-height:150px; overflow:auto;">
        <strong>Errores (corrige el archivo y vuelve a cargarlo):</strong>
        <ul class="mb-0">${errores.map((e) => `<li>${escaparHtmlEscaner(e)}</li>`).join("")}</ul>
      </div>`
        : ""
    }
    ${
      advertencias.length
        ? `
      <div class="alert alert-warning small mt-2 mb-0" style="max-height:150px; overflow:auto;">
        <strong>Advertencias:</strong>
        <ul class="mb-0">${advertencias.map((a) => `<li>${escaparHtmlEscaner(a)}</li>`).join("")}</ul>
      </div>`
        : ""
    }
  `;

  if (cambios.length === 0) {
    preview.innerHTML =
      '<p class="text-muted text-center">Sin cambios para previsualizar</p>';
    return;
  }

  let html = `
    <table class="table table-sm table-striped">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Producto</th>
          <th>Campo</th>
          <th>Antes</th>
          <th>Después</th>
        </tr>
      </thead>
      <tbody>
  `;

  cambios.forEach((c, idx) => {
    if (c.diff.length === 0) {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escaparHtmlEscaner(c.producto.codigo)}</strong> - ${escaparHtmlEscaner(c.producto.nombre)}</td>
          <td colspan="3" class="text-muted"><em>Sin cambios detectados</em></td>
        </tr>
      `;
      return;
    }
    c.diff.forEach((d, i) => {
      html += `
        <tr>
          ${
            i === 0
              ? `<td rowspan="${c.diff.length}">${idx + 1}</td>
                       <td rowspan="${c.diff.length}"><strong>${escaparHtmlEscaner(c.producto.codigo)}</strong><br><small>${escaparHtmlEscaner(c.producto.nombre)}</small></td>`
              : ""
          }
          <td><code>${d.campo}</code></td>
          <td class="text-danger">${escaparHtmlEscaner(d.antes)}</td>
          <td class="text-success"><strong>${escaparHtmlEscaner(d.despues)}</strong></td>
        </tr>
      `;
    });
  });

  html += "</tbody></table>";
  preview.innerHTML = html;
}

// ------------------------------------------------------------
// CONFIRMAR Y APLICAR
// ------------------------------------------------------------
async function confirmarActualizacionMasivaProductos() {
  if (actualizacionMasivaValidadas.length === 0) {
    showToast("No hay cambios para aplicar", "warning");
    return;
  }

  const modoPrueba = document.getElementById("cmActProdModoPrueba")?.checked;

  const btn = document.getElementById("cmActProdBtnConfirmar");
  btn.disabled = true;
  const textoOriginal = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Procesando...`;

  // Caches para categorías/marcas/unidades
  const cacheCategorias = {};
  const cacheMarcas = {};
  const cacheUnidades = {};
  (categoriasData || []).forEach(
    (c) => (cacheCategorias[_claveNombreCM(c.nombre)] = c.id),
  );
  (marcasData || []).forEach(
    (m) => (cacheMarcas[_claveNombreCM(m.nombre)] = m.id),
  );
  (unidadesData || []).forEach(
    (u) => (cacheUnidades[_claveNombreCM(u.nombre)] = u.id),
  );

  async function obtenerCategoriaId(nombre) {
    if (!nombre) return null;
    const key = _claveNombreCM(nombre);
    if (cacheCategorias[key]) return cacheCategorias[key];
    const result = await api.createCategoria({ nombre, activo: 1 });
    cacheCategorias[key] = result.id;
    return result.id;
  }
  async function obtenerMarcaId(nombre) {
    if (!nombre) return null;
    const key = _claveNombreCM(nombre);
    if (cacheMarcas[key]) return cacheMarcas[key];
    const result = await api.createMarca({ nombre, activo: 1 });
    cacheMarcas[key] = result.id;
    return result.id;
  }
  async function obtenerUnidadId(nombre) {
    if (!nombre) return null;
    const key = _claveNombreCM(nombre);
    if (cacheUnidades[key]) return cacheUnidades[key];
    const result = await api.request("/unidades-medida", "POST", {
      nombre,
      activo: 1,
    });
    cacheUnidades[key] = result.id;
    return result.id;
  }

  let ok = 0,
    fail = 0;
  const errores = [];

  for (const c of actualizacionMasivaValidadas) {
    try {
      if (modoPrueba) {
        ok++;
        continue;
      }

      const id_categoria = await obtenerCategoriaId(c.finales.categoriaNombre);
      const id_marca = await obtenerMarcaId(c.finales.marcaNombre);
      const id_unidad_compra = await obtenerUnidadId(
        c.finales.unidadCompraNombre,
      );
      const id_unidad_venta = await obtenerUnidadId(
        c.finales.unidadVentaNombre,
      );

      const data = {
        codigo: c.finales.codigo,
        nombre: c.finales.nombre,
        descripcion: c.finales.descripcion,
        id_categoria,
        id_marca,
        id_unidad_compra,
        id_unidad_venta,
        factor_conversion: c.finales.factor_conversion,
        precio_compra: c.finales.precio_compra,
        precio_venta: c.finales.precio_venta,
        precio_automatico: c.finales.precio_automatico,
        margen_ganancia: c.finales.margen_ganancia,
        stock_minimo: c.finales.stock_minimo,
        stock_maximo: c.finales.stock_maximo,
        activo: c.finales.activo,
      };

      await api.updateProducto(c.producto.id, data);
      ok++;
    } catch (err) {
      fail++;
      errores.push(
        `Fila ${c.numFila} (${c.producto.codigo}): ${err.message || "error"}`,
      );
    }
  }

  if (modoPrueba) {
    showToast(`🧪 Modo prueba: ${ok} productos serían actualizados`, "info");
  } else if (fail === 0) {
    showToast(`✅ ${ok} productos actualizados correctamente`, "success");
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("actualizacionMasivaProductosModal"),
  );
  if (modal) modal.hide();

  if (!modoPrueba && fail > 0) {
    // Se muestra la lista de filas con error (antes solo iba a la consola)
    mostrarResumenCargaMasiva("actualizados", ok, fail, errores);
    console.warn("Errores actualización masiva productos:", errores);
  }

  if (!modoPrueba) {
    // Catálogos primero (ver nota en la carga masiva)
    await recargarCategorias();
    await recargarMarcas();
    await recargarUnidades();
    await recargarProductos();
  } else {
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

// EXPONER FUNCIONES GLOBALES

// Carga masiva de productos
window.showCargaMasivaProductosModal = showCargaMasivaProductosModal;
window.descargarPlantillaProductos = descargarPlantillaProductos;
window.procesarArchivoProductos = procesarArchivoProductos;
window.confirmarCargaMasivaProductos = confirmarCargaMasivaProductos;

// Actualización masiva de productos
window.showActualizacionMasivaProductosModal =
  showActualizacionMasivaProductosModal;
window.descargarInventarioActual = descargarInventarioActual;
window.procesarArchivoActualizacion = procesarArchivoActualizacion;
window.confirmarActualizacionMasivaProductos =
  confirmarActualizacionMasivaProductos;

// Productos
window.loadProductosModule = loadProductosModule;
window.showCreateProductoModal = showCreateProductoModal;
window.showEditProductoModal = showEditProductoModal;
window.saveProducto = saveProducto;
window.deleteProducto = deleteProducto;
window.toggleProductoEstado = toggleProductoEstado;

// Categorías
window.showCreateCategoriaModal = showCreateCategoriaModal;
window.showEditCategoriaModal = showEditCategoriaModal;
window.saveCategoria = saveCategoria;
window.toggleCategoriaEstado = toggleCategoriaEstado;

// Marcas
window.showCreateMarcaModal = showCreateMarcaModal;
window.showEditMarcaModal = showEditMarcaModal;
window.saveMarca = saveMarca;
window.toggleMarcaEstado = toggleMarcaEstado;

// Unidades
window.showCreateUnidadModal = showCreateUnidadModal;
window.showEditUnidadModal = showEditUnidadModal;
window.saveUnidad = saveUnidad;
window.toggleUnidadEstado = toggleUnidadEstado;

document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter" || !e.target || e.target.id !== "productoCodigo")
    return;
  e.preventDefault();
  const nombre = document.getElementById("productoNombre");
  if (nombre) nombre.focus();
});

// Conectar los formularios de Producto, Categoría, Marca y Unidad
document.addEventListener("DOMContentLoaded", _vincularFormulariosCatalogo);

// Recargas específicas por sección
window.recargarProductos = recargarProductos;
window.recargarCategorias = recargarCategorias;
window.recargarMarcas = recargarMarcas;
window.recargarUnidades = recargarUnidades;
window.cambiarPaginaProductosCatalogo = cambiarPaginaProductosCatalogo;
window.cambiarPorPaginaProductosCatalogo = cambiarPorPaginaProductosCatalogo;
window.buscarProductosCatalogo = buscarProductosCatalogo;
window.buscarListaCatalogo = buscarListaCatalogo;
window.filtrarEstadoListaCatalogo = filtrarEstadoListaCatalogo;
window.limpiarFiltrosListaCatalogo = limpiarFiltrosListaCatalogo;
window.cambiarPaginaListaCatalogo = cambiarPaginaListaCatalogo;
window.cambiarPorPaginaListaCatalogo = cambiarPorPaginaListaCatalogo;
