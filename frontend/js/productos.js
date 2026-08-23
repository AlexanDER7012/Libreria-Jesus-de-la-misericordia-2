// PRODUCTOS

let productosData = [];
let categoriasData = [];
let marcasData = [];
let unidadesData = [];

// CARGA DE PRODUCTOS
async function loadProductosModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-box me-2 text-success"></i>Productos</h4>
            <div>
                <button class="btn btn-success btn-sm me-2" onclick="showCreateProductoModal()">
                    <i class="fas fa-plus me-2"></i>Producto
                </button>
                <button class="btn btn-outline-primary btn-sm me-2" onclick="showCreateCategoriaModal()">
                    <i class="fas fa-tag me-1"></i>Categoría
                </button>
                <button class="btn btn-outline-primary btn-sm me-2" onclick="showCreateMarcaModal()">
                    <i class="fas fa-copyright me-1"></i>Marca
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="showCreateUnidadModal()">
                    <i class="fas fa-ruler me-1"></i>Unidad
                </button>
            </div>
        </div>
        <div id="productosTableContainer">
            <div class="text-center py-5">
                <div class="spinner-border text-success" role="status"></div>
                <p class="mt-2 text-muted">Cargando productos...</p>
            </div>
        </div>
    `;

  try {
    const [productos, categorias, marcas, unidades] = await Promise.all([
      api.getProductos(),
      api.getCategorias().catch(() => []),
      api.getMarcas().catch(() => []),
      api.getUnidadesMedida().catch(() => []),
    ]);

    productosData = productos || [];
    categoriasData = categorias || [];
    marcasData = marcas || [];
    unidadesData = unidades || [];

    populateSelects();
    renderProductosTable(productosData);
  } catch (error) {
    console.error("Error cargando productos:", error);
    document.getElementById("productosTableContainer").innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar productos: ${error.message}
            </div>
        `;
  }
}

// SELECTS DE CATEGORÍAS, MARCAS, UNIDADES
function populateSelects() {
  const categoriaSelect = document.getElementById("productoCategoria");
  if (categoriaSelect) {
    categoriaSelect.innerHTML =
      '<option value="">Seleccionar categoría</option>';
    categoriasData.forEach((c) => {
      categoriaSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    });
  }

  const marcaSelect = document.getElementById("productoMarca");
  if (marcaSelect) {
    marcaSelect.innerHTML = '<option value="">Seleccionar marca</option>';
    marcasData.forEach((m) => {
      marcaSelect.innerHTML += `<option value="${m.id}">${m.nombre}</option>`;
    });
  }

  const unidadCompraSelect = document.getElementById("productoUnidadCompra");
  if (unidadCompraSelect) {
    unidadCompraSelect.innerHTML =
      '<option value="">Seleccionar unidad</option>';
    unidadesData.forEach((u) => {
      unidadCompraSelect.innerHTML += `<option value="${u.id}">${u.nombre} (${u.abreviatura || ""})</option>`;
    });
  }

  const unidadVentaSelect = document.getElementById("productoUnidadVenta");
  if (unidadVentaSelect) {
    unidadVentaSelect.innerHTML =
      '<option value="">Seleccionar unidad</option>';
    unidadesData.forEach((u) => {
      unidadVentaSelect.innerHTML += `<option value="${u.id}">${u.nombre} (${u.abreviatura || ""})</option>`;
    });
  }
}

// RENDERIZAR TABLA DE PRODUCTOS
function renderProductosTable(productos) {
  const container = document.getElementById("productosTableContainer");
  if (!container) return;

  if (!productos || productos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-box fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay productos registrados</p>
                <button class="btn btn-success btn-sm" onclick="showCreateProductoModal()">
                    <i class="fas fa-plus me-2"></i>Agregar Producto
                </button>
            </div>
        `;
    return;
  }

  let html = `
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
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditProductoModal(${producto.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProducto(${producto.id})">
                        <i class="fas fa-trash"></i>
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
            <small class="text-muted">Total: ${productos.length} productos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// PRODUCTOS - CRUD
// =============================================

function showCreateProductoModal() {
  const modal = document.getElementById("productoModal");
  const form = document.getElementById("productoForm");
  const title = document.getElementById("productoModalTitle");

  if (!modal) {
    console.error("Modal no encontrado");
    return;
  }

  title.textContent = "Nuevo Producto";
  form.reset();

  const idInput = document.getElementById("productoId");
  const activoInput = document.getElementById("productoActivo");

  if (idInput) idInput.value = "";
  if (activoInput) activoInput.value = "1";

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

  const id = document.getElementById("productoId").value;
  const data = {
    codigo: document.getElementById("productoCodigo").value.trim(),
    nombre: document.getElementById("productoNombre").value.trim(),
    descripcion: document.getElementById("productoDescripcion").value.trim(),
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

  if (!data.codigo || !data.nombre) {
    showToast("Código y nombre son obligatorios", "error");
    return;
  }

  try {
    if (id) {
      await api.updateProducto(id, data);
      showToast("Producto actualizado correctamente", "success");
    } else {
      await api.createProducto(data);
      showToast("Producto creado correctamente", "success");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("productoModal"),
    );
    modal.hide();
    await loadProductosModule();
  } catch (error) {
    console.error("Error guardando producto:", error);
    showToast(error.message || "Error al guardar el producto", "error");
  }
}

async function deleteProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;

  try {
    await api.deleteProducto(id);
    showToast("Producto eliminado correctamente", "success");
    await loadProductosModule();
  } catch (error) {
    console.error("Error eliminando producto:", error);
    showToast(error.message || "Error al eliminar el producto", "error");
  }
}

// =============================================
// CATEGORÍAS - CRUD
// =============================================

function showCreateCategoriaModal() {
  const modal = document.getElementById("categoriaModal");
  if (!modal) {
    crearModalCategoria();
    setTimeout(() => showCreateCategoriaModal(), 100);
    return;
  }
  document.getElementById("categoriaForm").reset();
  document.getElementById("categoriaId").value = "";
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveCategoria(event) {
  event.preventDefault();
  const nombre = document.getElementById("categoriaNombre").value.trim();
  if (!nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }
  try {
    await api.createCategoria({ nombre });
    showToast("Categoría creada correctamente", "success");
    bootstrap.Modal.getInstance(
      document.getElementById("categoriaModal"),
    ).hide();
    await loadProductosModule();
  } catch (error) {
    showToast(error.message || "Error al crear categoría", "error");
  }
}

function crearModalCategoria() {
  const html = `
        <div class="modal fade" id="categoriaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nueva Categoría</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="categoriaForm">
                            <input type="hidden" id="categoriaId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="categoriaNombre" required />
                            </div>
                            <button type="submit" class="btn btn-primary w-100" onclick="saveCategoria(event)">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
}

// =============================================
// MARCAS - CRUD
// =============================================

function showCreateMarcaModal() {
  const modal = document.getElementById("marcaModal");
  if (!modal) {
    crearModalMarca();
    setTimeout(() => showCreateMarcaModal(), 100);
    return;
  }
  document.getElementById("marcaForm").reset();
  document.getElementById("marcaId").value = "";
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveMarca(event) {
  event.preventDefault();
  const nombre = document.getElementById("marcaNombre").value.trim();
  if (!nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }
  try {
    await api.createMarca({ nombre });
    showToast("Marca creada correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("marcaModal")).hide();
    await loadProductosModule();
  } catch (error) {
    showToast(error.message || "Error al crear marca", "error");
  }
}

function crearModalMarca() {
  const html = `
        <div class="modal fade" id="marcaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nueva Marca</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="marcaForm">
                            <input type="hidden" id="marcaId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="marcaNombre" required />
                            </div>
                            <button type="submit" class="btn btn-primary w-100" onclick="saveMarca(event)">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
}

// =============================================
// UNIDADES DE MEDIDA - CRUD
// =============================================

function showCreateUnidadModal() {
  const modal = document.getElementById("unidadModal");
  if (!modal) {
    crearModalUnidad();
    setTimeout(() => showCreateUnidadModal(), 100);
    return;
  }
  document.getElementById("unidadForm").reset();
  document.getElementById("unidadId").value = "";
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveUnidad(event) {
  event.preventDefault();
  const nombre = document.getElementById("unidadNombre").value.trim();
  const abreviatura = document.getElementById("unidadAbreviatura").value.trim();
  if (!nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }
  try {
    await api.request("/unidades-medida", "POST", { nombre, abreviatura });
    showToast("Unidad creada correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("unidadModal")).hide();
    await loadProductosModule();
  } catch (error) {
    showToast(error.message || "Error al crear unidad", "error");
  }
}

function crearModalUnidad() {
  const html = `
        <div class="modal fade" id="unidadModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nueva Unidad de Medida</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="unidadForm">
                            <input type="hidden" id="unidadId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="unidadNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Abreviatura</label>
                                <input type="text" class="form-control" id="unidadAbreviatura" />
                            </div>
                            <button type="submit" class="btn btn-primary w-100" onclick="saveUnidad(event)">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
}

// =============================================
// EXPONER FUNCIONES GLOBALES
// =============================================

// Productos
window.loadProductosModule = loadProductosModule;
window.showCreateProductoModal = showCreateProductoModal;
window.showEditProductoModal = showEditProductoModal;
window.saveProducto = saveProducto;
window.deleteProducto = deleteProducto;

// Categorías
window.showCreateCategoriaModal = showCreateCategoriaModal;
window.saveCategoria = saveCategoria;

// Marcas
window.showCreateMarcaModal = showCreateMarcaModal;
window.saveMarca = saveMarca;

// Unidades
window.showCreateUnidadModal = showCreateUnidadModal;
window.saveUnidad = saveUnidad;
