// productos.js

let productosData = [];
let categoriasData = [];
let marcasData = [];
let unidadesData = [];

// CARGA DEL MÓDULO PRINCIPAL CON PESTAÑAS
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
      api.getProductos().catch(() => []),
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
    const productos = (await api.getProductos().catch(() => [])) || [];
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
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="productoModalTitle">
                <i class="fas fa-box me-2"></i>Nuevo Producto
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="productoForm" novalidate>
                <input type="hidden" id="productoId" />
                
                <!-- FILA 1: Código y Nombre -->
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Código <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="productoCodigo" placeholder="Ej: PROD-001" required />
                    <div class="invalid-feedback" id="productoCodigoError">El código es obligatorio</div>
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
                    <select class="form-select" id="productoCategoria">
                      <option value="">Seleccionar categoría</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Marca</label>
                    <select class="form-select" id="productoMarca">
                      <option value="">Seleccionar marca</option>
                    </select>
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
    document
      .getElementById("productoForm")
      .addEventListener("submit", saveProducto);
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
              <form id="categoriaForm" novalidate>
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
    document
      .getElementById("categoriaForm")
      .addEventListener("submit", saveCategoria);
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
              <form id="marcaForm" novalidate>
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
    document.getElementById("marcaForm").addEventListener("submit", saveMarca);
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
              <form id="unidadForm" novalidate>
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
    document
      .getElementById("unidadForm")
      .addEventListener("submit", saveUnidad);
  }
}

// POBLAR SELECTS DEL MODAL PRODUCTO
function populateSelects() {
  const categoriaSelect = document.getElementById("productoCategoria");
  if (categoriaSelect) {
    categoriaSelect.innerHTML =
      '<option value="">Seleccionar categoría</option>';
    categoriasData
      .filter((c) => c.activo !== 0)
      .forEach((c) => {
        categoriaSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
      });
  }

  const marcaSelect = document.getElementById("productoMarca");
  if (marcaSelect) {
    marcaSelect.innerHTML = '<option value="">Seleccionar marca</option>';
    marcasData
      .filter((m) => m.activo !== 0)
      .forEach((m) => {
        marcaSelect.innerHTML += `<option value="${m.id}">${m.nombre}</option>`;
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

  productos.forEach((producto) => {
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
        <div class="text-end">
            <small class="text-muted">Total: ${productos.length} productos</small>
        </div>
    `;

  container.innerHTML = html;
}

// PRODUCTOS - CRUD

function showCreateProductoModal() {
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
    document.getElementById("productoCategoria").value =
      producto.id_categoria || "";
    document.getElementById("productoMarca").value = producto.id_marca || "";
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

  // Control de duplicidad (frontend)
  const exists = productosData.some(
    (p) =>
      (p.codigo === data.codigo || p.nombre === data.nombre) &&
      p.id !== parseInt(id),
  );

  if (exists) {
    showToast("Ya existe un producto con ese código o nombre", "warning");
    return;
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
    await api.updateProducto(id, {
      ...producto,
      activo: producto.activo !== 0 ? 0 : 1,
    });
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

  if (!categorias || categorias.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay categorías registradas</p>
                ${
                  tienePermiso("Productos", "Crear")
                    ? `<button class="btn btn-primary btn-sm" onclick="showCreateCategoriaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Categoría
                </button>`
                    : ""
                }
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Categorías</h6>
            ${
              tienePermiso("Productos", "Crear")
                ? `<button class="btn btn-primary btn-sm" onclick="showCreateCategoriaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Categoría
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
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  categorias.forEach((c) => {
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
                      tienePermiso("Productos", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditCategoriaModal(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                        : ""
                    }
                    ${
                      tienePermiso("Productos", "Eliminar")
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
        <div class="text-end">
            <small class="text-muted">Total: ${categorias.length} categorías</small>
        </div>
    `;

  container.innerHTML = html;
}

function showCreateCategoriaModal() {
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
    await api.request(`/categorias/${id}`, "PUT", {
      ...categoria,
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

  if (!marcas || marcas.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-copyright fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay marcas registradas</p>
                ${
                  tienePermiso("Productos", "Crear")
                    ? `<button class="btn btn-info btn-sm" onclick="showCreateMarcaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Marca
                </button>`
                    : ""
                }
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Marcas</h6>
            ${
              tienePermiso("Productos", "Crear")
                ? `<button class="btn btn-info btn-sm" onclick="showCreateMarcaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Marca
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
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  marcas.forEach((m) => {
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
                      tienePermiso("Productos", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditMarcaModal(${m.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                        : ""
                    }
                    ${
                      tienePermiso("Productos", "Eliminar")
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
        <div class="text-end">
            <small class="text-muted">Total: ${marcas.length} marcas</small>
        </div>
    `;

  container.innerHTML = html;
}

function showCreateMarcaModal() {
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
    await api.request(`/marcas/${id}`, "PUT", {
      ...marca,
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

  if (!unidades || unidades.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-ruler fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay unidades registradas</p>
                ${
                  tienePermiso("Productos", "Crear")
                    ? `<button class="btn btn-warning btn-sm" onclick="showCreateUnidadModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Unidad
                </button>`
                    : ""
                }
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Unidades de Medida</h6>
            ${
              tienePermiso("Productos", "Crear")
                ? `<button class="btn btn-warning btn-sm" onclick="showCreateUnidadModal()">
                <i class="fas fa-plus me-2"></i>Nueva Unidad
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
                        <th>Abreviatura</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  unidades.forEach((u) => {
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
                      tienePermiso("Productos", "Editar")
                        ? `<button class="btn btn-sm btn-outline-primary" onclick="showEditUnidadModal(${u.id})">
                        <i class="fas fa-edit"></i>
                    </button>`
                        : ""
                    }
                    ${
                      tienePermiso("Productos", "Eliminar")
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
        <div class="text-end">
            <small class="text-muted">Total: ${unidades.length} unidades</small>
        </div>
    `;

  container.innerHTML = html;
}

function showCreateUnidadModal() {
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
    await api.request(`/unidades-medida/${id}`, "PUT", {
      ...unidad,
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
            <strong>Formato esperado del archivo (fila de encabezados obligatoria):</strong>
            <div class="mt-1" style="font-family: monospace; font-size: 0.85rem;">
              Codigo | Nombre | Descripcion | Categoria | Marca | Unidad_Compra | Unidad_Venta |
              Factor_Conversion | Precio_Compra | Precio_Venta | Margen_Ganancia |
              Precio_Automatico | Stock_Minimo | Stock_Maximo
            </div>
            <ul class="mb-0 mt-2 small">
              <li>Las <strong>categorías, marcas y unidades</strong> que no existan se crearán automáticamente.</li>
              <li>Todos los productos se crean como <strong>activos</strong>.</li>
              <li>El <strong>stock actual</strong> arranca en 0. Los stocks iniciales se cargan con la Carga Masiva de Movimientos.</li>
              <li>Si un <strong>código ya existe</strong>, la fila se reporta como error (no se sobrescribe).</li>
            </ul>
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-primary" onclick="descargarPlantillaProductos()">
                <i class="fas fa-download me-1"></i>Descargar plantilla
              </button>
            </div>
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
  XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Productos.xlsx");
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
function validarYPrevisualizarProductos() {
  const categorias = categoriasData || [];
  const marcas = marcasData || [];
  const unidades = unidadesData || [];

  const errores = [];
  const filasValidas = [];

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
          (c) =>
            (c.nombre || "").toLowerCase() === categoriaNombre.toLowerCase(),
        )
      : null;
    const marcaExistente = marcaNombre
      ? marcas.find(
          (m) => (m.nombre || "").toLowerCase() === marcaNombre.toLowerCase(),
        )
      : null;
    const unidadCompraExistente = unidadCompraNombre
      ? unidades.find(
          (u) =>
            (u.nombre || "").toLowerCase() === unidadCompraNombre.toLowerCase(),
        )
      : null;
    const unidadVentaExistente = unidadVentaNombre
      ? unidades.find(
          (u) =>
            (u.nombre || "").toLowerCase() === unidadVentaNombre.toLowerCase(),
        )
      : null;

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
      factor_conversion: parseFloat(row.Factor_Conversion) || 1,
      precio_compra: parseFloat(row.Precio_Compra) || 0,
      precio_venta: parseFloat(row.Precio_Venta) || 0,
      margen_ganancia: parseFloat(row.Margen_Ganancia) || 0,
      precio_automatico: parseInt(row.Precio_Automatico) === 1 ? 1 : 0,
      stock_minimo: parseFloat(row.Stock_Minimo) || 0,
      stock_maximo: parseFloat(row.Stock_Maximo) || 0,
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
        <td><code>${f.codigo}</code></td>
        <td>${f.nombre}</td>
        <td>${catMostrar}</td>
        <td>${marcaMostrar}</td>
        <td>${undCMostrar}</td>
        <td>${undVMostrar}</td>
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
    cacheCategorias[(c.nombre || "").toLowerCase()] = c.id;
  });
  (marcasData || []).forEach((m) => {
    cacheMarcas[(m.nombre || "").toLowerCase()] = m.id;
  });
  (unidadesData || []).forEach((u) => {
    cacheUnidades[(u.nombre || "").toLowerCase()] = u.id;
  });

  // Helpers para crear si no existe
  async function obtenerCategoriaId(nombre) {
    if (!nombre) return null;
    const key = nombre.toLowerCase();
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
          (c) => (c.nombre || "").toLowerCase() === key,
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
    const key = nombre.toLowerCase();
    if (cacheMarcas[key]) return cacheMarcas[key];
    try {
      const result = await api.createMarca({ nombre, activo: 1 });
      cacheMarcas[key] = result.id;
      return result.id;
    } catch (e) {
      try {
        const arr = await api.getMarcas();
        const found = (arr || []).find(
          (m) => (m.nombre || "").toLowerCase() === key,
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
    const key = nombre.toLowerCase();
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
          (u) => (u.nombre || "").toLowerCase() === key,
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

  if (fail === 0) {
    showToast(`✅ ${ok} productos creados correctamente`, "success");
  } else {
    showToast(
      `⚠ ${ok} creados, ${fail} fallidos. Revisa la consola.`,
      "warning",
    );
    console.warn("Errores carga masiva productos:", errores);
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("cargaMasivaProductosModal"),
  );
  if (modal) modal.hide();

  // Recargar cada sección por separado (porque la carga puede crear
  // categorías/marcas/unidades nuevas)
  await recargarProductos();
  await recargarCategorias();
  await recargarMarcas();
  await recargarUnidades();
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
            <ul class="mb-2 small">
              <li><strong>Codigo:</strong> no lo modifiques. Si lo cambias, se intentará buscar por Nombre.</li>
              <li><strong>Stock_Actual:</strong> es informativa. Si la modificas, se ignora.</li>
              <li><strong>Activo:</strong> acepta <code>Activo</code>, <code>Inactivo</code>, <code>SI</code>, <code>NO</code>, <code>1</code>, <code>0</code>.</li>
              <li><strong>Actualizar:</strong> acepta <code>SI</code>, <code>S</code>, <code>1</code>, <code>X</code>, <code>YES</code>, <code>TRUE</code>.</li>
            </ul>
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
  XLSX.writeFile(
    wb,
    `Inventario_${new Date().toISOString().slice(0, 10)}.xlsx`,
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
  const v = String(valor || "")
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

    // Resolver categoría/marca/unidades
    const catNombre = String(row.Categoria || "").trim();
    const marcaNombre = String(row.Marca || "").trim();
    const undCNombre = String(row.Unidad_Compra || "").trim();
    const undVNombre = String(row.Unidad_Venta || "").trim();

    const catExistente = catNombre
      ? categorias.find(
          (c) => (c.nombre || "").toLowerCase() === catNombre.toLowerCase(),
        )
      : null;
    const marcaExistente = marcaNombre
      ? marcas.find(
          (m) => (m.nombre || "").toLowerCase() === marcaNombre.toLowerCase(),
        )
      : null;
    const undCExistente = undCNombre
      ? unidades.find(
          (u) => (u.nombre || "").toLowerCase() === undCNombre.toLowerCase(),
        )
      : null;
    const undVExistente = undVNombre
      ? unidades.find(
          (u) => (u.nombre || "").toLowerCase() === undVNombre.toLowerCase(),
        )
      : null;

    // Calcular diff
    const diff = [];
    const pushDiff = (campo, antes, despues) => {
      if (String(antes) !== String(despues)) {
        diff.push({ campo, antes, despues });
      }
    };

    pushDiff(
      "Nombre",
      productoEncontrado.nombre || "",
      nombreArchivo || productoEncontrado.nombre || "",
    );
    pushDiff(
      "Descripcion",
      productoEncontrado.descripcion || "",
      String(row.Descripcion || "").trim(),
    );
    pushDiff(
      "Categoria",
      catNombre
        ? catExistente
          ? catExistente.nombre
          : "(nueva) " + catNombre
        : "",
      catNombre,
    );
    pushDiff(
      "Marca",
      marcaNombre
        ? marcaExistente
          ? marcaExistente.nombre
          : "(nueva) " + marcaNombre
        : "",
      marcaNombre,
    );
    pushDiff(
      "Unidad_Compra",
      undCNombre
        ? undCExistente
          ? undCExistente.nombre
          : "(nueva) " + undCNombre
        : "",
      undCNombre,
    );
    pushDiff(
      "Unidad_Venta",
      undVNombre
        ? undVExistente
          ? undVExistente.nombre
          : "(nueva) " + undVNombre
        : "",
      undVNombre,
    );
    pushDiff(
      "Factor_Conversion",
      productoEncontrado.factor_conversion || 1,
      parseFloat(row.Factor_Conversion) || 1,
    );
    pushDiff(
      "Precio_Compra",
      productoEncontrado.precio_compra || 0,
      parseFloat(row.Precio_Compra) || 0,
    );
    pushDiff(
      "Precio_Venta",
      productoEncontrado.precio_venta || 0,
      parseFloat(row.Precio_Venta) || 0,
    );
    pushDiff(
      "Margen_Ganancia",
      productoEncontrado.margen_ganancia || 0,
      parseFloat(row.Margen_Ganancia) || 0,
    );
    pushDiff(
      "Precio_Automatico",
      productoEncontrado.precio_automatico || 0,
      parseInt(row.Precio_Automatico) === 1 ? 1 : 0,
    );
    pushDiff(
      "Stock_Minimo",
      productoEncontrado.stock_minimo || 0,
      parseFloat(row.Stock_Minimo) || 0,
    );
    pushDiff(
      "Stock_Maximo",
      productoEncontrado.stock_maximo || 0,
      parseFloat(row.Stock_Maximo) || 0,
    );

    const activoNuevo = _parseActivo(
      row.Activo,
      productoEncontrado.activo !== 0 ? 1 : 0,
    );
    pushDiff("Activo", productoEncontrado.activo !== 0 ? 1 : 0, activoNuevo);

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
      // Datos finales para aplicar
      finales: {
        codigo: productoEncontrado.codigo, // no se cambia
        nombre: nombreArchivo || productoEncontrado.nombre,
        descripcion: String(row.Descripcion || "").trim() || null,
        categoriaNombre: catNombre || null,
        marcaNombre: marcaNombre || null,
        unidadCompraNombre: undCNombre || null,
        unidadVentaNombre: undVNombre || null,
        factor_conversion: parseFloat(row.Factor_Conversion) || 1,
        precio_compra: parseFloat(row.Precio_Compra) || 0,
        precio_venta: parseFloat(row.Precio_Venta) || 0,
        margen_ganancia: parseFloat(row.Margen_Ganancia) || 0,
        precio_automatico: parseInt(row.Precio_Automatico) === 1 ? 1 : 0,
        stock_minimo: parseFloat(row.Stock_Minimo) || 0,
        stock_maximo: parseFloat(row.Stock_Maximo) || 0,
        activo: activoNuevo,
      },
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
        <ul class="mb-0">${errores.map((e) => `<li>${e}</li>`).join("")}</ul>
      </div>`
        : ""
    }
    ${
      advertencias.length
        ? `
      <div class="alert alert-warning small mt-2 mb-0" style="max-height:150px; overflow:auto;">
        <strong>Advertencias:</strong>
        <ul class="mb-0">${advertencias.map((a) => `<li>${a}</li>`).join("")}</ul>
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
          <td><strong>${c.producto.codigo}</strong> - ${c.producto.nombre}</td>
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
                       <td rowspan="${c.diff.length}"><strong>${c.producto.codigo}</strong><br><small>${c.producto.nombre}</small></td>`
              : ""
          }
          <td><code>${d.campo}</code></td>
          <td class="text-danger">${d.antes}</td>
          <td class="text-success"><strong>${d.despues}</strong></td>
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
    (c) => (cacheCategorias[(c.nombre || "").toLowerCase()] = c.id),
  );
  (marcasData || []).forEach(
    (m) => (cacheMarcas[(m.nombre || "").toLowerCase()] = m.id),
  );
  (unidadesData || []).forEach(
    (u) => (cacheUnidades[(u.nombre || "").toLowerCase()] = u.id),
  );

  async function obtenerCategoriaId(nombre) {
    if (!nombre) return null;
    const key = nombre.toLowerCase();
    if (cacheCategorias[key]) return cacheCategorias[key];
    const result = await api.createCategoria({ nombre, activo: 1 });
    cacheCategorias[key] = result.id;
    return result.id;
  }
  async function obtenerMarcaId(nombre) {
    if (!nombre) return null;
    const key = nombre.toLowerCase();
    if (cacheMarcas[key]) return cacheMarcas[key];
    const result = await api.createMarca({ nombre, activo: 1 });
    cacheMarcas[key] = result.id;
    return result.id;
  }
  async function obtenerUnidadId(nombre) {
    if (!nombre) return null;
    const key = nombre.toLowerCase();
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
  } else {
    showToast(
      `⚠ ${ok} actualizados, ${fail} fallidos. Revisa la consola.`,
      "warning",
    );
    console.warn("Errores actualización masiva productos:", errores);
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("actualizacionMasivaProductosModal"),
  );
  if (modal) modal.hide();

  if (!modoPrueba) {
    await recargarProductos();
    await recargarCategorias();
    await recargarMarcas();
    await recargarUnidades();
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

// Event listener permanente para el formulario producto
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("productoForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      saveProducto(e);
    });
    console.log("Event listener de productoForm configurado");
  }
});

// Recargas específicas por sección
window.recargarProductos = recargarProductos;
window.recargarCategorias = recargarCategorias;
window.recargarMarcas = recargarMarcas;
window.recargarUnidades = recargarUnidades;
