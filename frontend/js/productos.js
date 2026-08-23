// productos.js

let productosData = [];
let categoriasData = [];
let marcasData = [];
let unidadesData = [];

// CARGA DEL MÓDULO PRINCIPAL CON PESTAÑAS
async function loadProductosModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-box me-2 text-success"></i>Productos</h4>
            <div>
                <button class="btn btn-success btn-sm" onclick="showCreateProductoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Producto
                </button>
            </div>
        </div>

        <!-- PESTAÑAS INTERNAS -->
        <ul class="nav nav-tabs mb-3" id="productosTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="tab-productos" data-bs-toggle="tab"
                        data-bs-target="#panel-productos" type="button" role="tab">
                    <i class="fas fa-box me-1"></i>Productos
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-categorias" data-bs-toggle="tab"
                        data-bs-target="#panel-categorias" type="button" role="tab">
                    <i class="fas fa-tags me-1"></i>Categorías
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-marcas" data-bs-toggle="tab"
                        data-bs-target="#panel-marcas" type="button" role="tab">
                    <i class="fas fa-copyright me-1"></i>Marcas
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-unidades" data-bs-toggle="tab"
                        data-bs-target="#panel-unidades" type="button" role="tab">
                    <i class="fas fa-ruler me-1"></i>Unidades
                </button>
            </li>
        </ul>

        <div class="tab-content" id="productosTabContent">
            <!-- PANEL: PRODUCTOS -->
            <div class="tab-pane fade show active" id="panel-productos" role="tabpanel">
                <div id="productosTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-success" role="status"></div>
                        <p class="mt-2 text-muted">Cargando productos...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: CATEGORÍAS -->
            <div class="tab-pane fade" id="panel-categorias" role="tabpanel">
                <div id="categoriasTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando categorías...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: MARCAS -->
            <div class="tab-pane fade" id="panel-marcas" role="tabpanel">
                <div id="marcasTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status"></div>
                        <p class="mt-2 text-muted">Cargando marcas...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: UNIDADES -->
            <div class="tab-pane fade" id="panel-unidades" role="tabpanel">
                <div id="unidadesTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted">Cargando unidades...</p>
                    </div>
                </div>
            </div>
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
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleProductoEstado(${producto.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
    await loadProductosModule();
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
    await loadProductosModule();
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
    await loadProductosModule();
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
                <button class="btn btn-primary btn-sm" onclick="showCreateCategoriaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Categoría
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Categorías</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreateCategoriaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Categoría
            </button>
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
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditCategoriaModal(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleCategoriaEstado(${c.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
            <small class="text-muted">Total: ${categorias.length} categorías</small>
        </div>
    `;

  container.innerHTML = html;
}

function showCreateCategoriaModal() {
  const modal = document.getElementById("categoriaModal");
  if (!modal) {
    crearModalCategoria();
    setTimeout(() => showCreateCategoriaModal(), 100);
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
    crearModalCategoria();
    setTimeout(() => showEditCategoriaModal(id), 100);
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

    await loadProductosModule();
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
    await loadProductosModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

function crearModalCategoria() {
  const html = `
        <div class="modal fade" id="categoriaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Categoría</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="categoriaForm" novalidate>
                            <input type="hidden" id="categoriaId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="categoriaNombre" required />
                                <div class="invalid-feedback" id="categoriaNombreError">El nombre es obligatorio</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
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
  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("categoriaForm").onsubmit = saveCategoria;
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
                <button class="btn btn-info btn-sm" onclick="showCreateMarcaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Marca
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Marcas</h6>
            <button class="btn btn-info btn-sm" onclick="showCreateMarcaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Marca
            </button>
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
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditMarcaModal(${m.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleMarcaEstado(${m.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
            <small class="text-muted">Total: ${marcas.length} marcas</small>
        </div>
    `;

  container.innerHTML = html;
}

function showCreateMarcaModal() {
  const modal = document.getElementById("marcaModal");
  if (!modal) {
    crearModalMarca();
    setTimeout(() => showCreateMarcaModal(), 100);
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
    crearModalMarca();
    setTimeout(() => showEditMarcaModal(id), 100);
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

    await loadProductosModule();
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
    await loadProductosModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

function crearModalMarca() {
  const html = `
        <div class="modal fade" id="marcaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Marca</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="marcaForm" novalidate>
                            <input type="hidden" id="marcaId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="marcaNombre" required />
                                <div class="invalid-feedback" id="marcaNombreError">El nombre es obligatorio</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="marcaActivo">
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
  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("marcaForm").onsubmit = saveMarca;
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
                <button class="btn btn-warning btn-sm" onclick="showCreateUnidadModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Unidad
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Unidades de Medida</h6>
            <button class="btn btn-warning btn-sm" onclick="showCreateUnidadModal()">
                <i class="fas fa-plus me-2"></i>Nueva Unidad
            </button>
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
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditUnidadModal(${u.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleUnidadEstado(${u.id})">
                        <i class="fas fa-${activo ? "times" : "check"}"></i>
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
            <small class="text-muted">Total: ${unidades.length} unidades</small>
        </div>
    `;

  container.innerHTML = html;
}

function showCreateUnidadModal() {
  const modal = document.getElementById("unidadModal");
  if (!modal) {
    crearModalUnidad();
    setTimeout(() => showCreateUnidadModal(), 100);
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
    crearModalUnidad();
    setTimeout(() => showEditUnidadModal(id), 100);
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

    await loadProductosModule();
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
    await loadProductosModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

function crearModalUnidad() {
  const html = `
        <div class="modal fade" id="unidadModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Unidad de Medida</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="unidadForm" novalidate>
                            <input type="hidden" id="unidadId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="unidadNombre" required />
                                <div class="invalid-feedback" id="unidadNombreError">El nombre es obligatorio</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Abreviatura</label>
                                <input type="text" class="form-control" id="unidadAbreviatura" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="unidadActivo">
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
  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("unidadForm").onsubmit = saveUnidad;
}

// EXPONER FUNCIONES GLOBALES

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
