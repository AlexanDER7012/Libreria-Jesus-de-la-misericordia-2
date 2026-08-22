// PRODUCTOS


let productosData = [];
let categoriasData = [];
let marcasData = [];
let unidadesData = [];

// CARGA DE PRODUCTOS
async function loadProductosModule() {
    const container = document.getElementById('productosTableContainer');
    if (!container) return;

    try {
        const [productos, categorias, marcas, unidades] = await Promise.all([
            api.getProductos(),
            api.getCategorias().catch(() => []),
            api.getMarcas().catch(() => []),
            api.getUnidadesMedida().catch(() => [])
        ]);

        productosData = productos || [];
        categoriasData = categorias || [];
        marcasData = marcas || [];
        unidadesData = unidades || [];

        populateSelects();

        renderProductosTable(productosData);
    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar productos: ${error.message}
            </div>
        `;
    }
}


// SELECTS DE CATEGORÍAS, MARCAS, UNIDADES
function populateSelects() {
    // Categorías
    const categoriaSelect = document.getElementById('productoCategoria');
    if (categoriaSelect) {
        categoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
        categoriasData.forEach(c => {
            categoriaSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
        });
    }

    // Marcas
    const marcaSelect = document.getElementById('productoMarca');
    if (marcaSelect) {
        marcaSelect.innerHTML = '<option value="">Seleccionar marca</option>';
        marcasData.forEach(m => {
            marcaSelect.innerHTML += `<option value="${m.id}">${m.nombre}</option>`;
        });
    }

    // Unidades de compra
    const unidadCompraSelect = document.getElementById('productoUnidadCompra');
    if (unidadCompraSelect) {
        unidadCompraSelect.innerHTML = '<option value="">Seleccionar unidad</option>';
        unidadesData.forEach(u => {
            unidadCompraSelect.innerHTML += `<option value="${u.id}">${u.nombre} (${u.abreviatura || ''})</option>`;
        });
    }

    // Unidades de venta
    const unidadVentaSelect = document.getElementById('productoUnidadVenta');
    if (unidadVentaSelect) {
        unidadVentaSelect.innerHTML = '<option value="">Seleccionar unidad</option>';
        unidadesData.forEach(u => {
            unidadVentaSelect.innerHTML += `<option value="${u.id}">${u.nombre} (${u.abreviatura || ''})</option>`;
        });
    }
}

// RENDERIZAR TABLA DE PRODUCTOS
function renderProductosTable(productos) {
    const container = document.getElementById('productosTableContainer');
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

    productos.forEach(producto => {
        const categoria = categoriasData.find(c => c.id === producto.id_categoria);
        const marca = marcasData.find(m => m.id === producto.id_marca);
        const activo = producto.activo !== 0;
        const stockBajo = producto.stock_actual <= (producto.stock_minimo || 0);

        html += `
            <tr>
                <td><code>${producto.codigo || '--'}</code></td>
                <td><strong>${producto.nombre || '--'}</strong></td>
                <td>${categoria ? categoria.nombre : '--'}</td>
                <td>${marca ? marca.nombre : '--'}</td>
                <td>$${producto.precio_venta || 0}</td>
                <td>
                    <span class="${stockBajo ? 'text-danger fw-bold' : ''}">
                        ${producto.stock_actual || 0}
                        ${stockBajo ? '<i class="fas fa-exclamation-triangle ms-1 text-danger"></i>' : ''}
                    </span>
                </td>
                <td>${producto.stock_minimo || 0}</td>
                <td>
                    <span class="badge ${activo ? 'bg-success' : 'bg-danger'}">
                        ${activo ? 'Activo' : 'Inactivo'}
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

// CREAR PRODUCTO
function showCreateProductoModal() {
    const modal = document.getElementById('productoModal');
    const form = document.getElementById('productoForm');
    const title = document.getElementById('productoModalTitle');
    
    title.textContent = 'Nuevo Producto';
    form.reset();
    document.getElementById('productoId').value = '';
    document.getElementById('productoActivo').value = '1';
    document.getElementById('productoPrecioAutomatico').value = '0';
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// EDITAR PRODUCTO
async function showEditProductoModal(id) {
    try {
        const producto = await api.getProducto(id);
        if (!producto) {
            showToast('Producto no encontrado', 'error');
            return;
        }

        const modal = document.getElementById('productoModal');
        const form = document.getElementById('productoForm');
        const title = document.getElementById('productoModalTitle');
        
        title.textContent = 'Editar Producto';
        document.getElementById('productoId').value = producto.id;
        document.getElementById('productoCodigo').value = producto.codigo || '';
        document.getElementById('productoNombre').value = producto.nombre || '';
        document.getElementById('productoDescripcion').value = producto.descripcion || '';
        document.getElementById('productoCategoria').value = producto.id_categoria || '';
        document.getElementById('productoMarca').value = producto.id_marca || '';
        document.getElementById('productoUnidadCompra').value = producto.id_unidad_compra || '';
        document.getElementById('productoUnidadVenta').value = producto.id_unidad_venta || '';
        document.getElementById('productoFactorConversion').value = producto.factor_conversion || 1;
        document.getElementById('productoPrecioCompra').value = producto.precio_compra || 0;
        document.getElementById('productoPrecioVenta').value = producto.precio_venta || 0;
        document.getElementById('productoPrecioAutomatico').value = producto.precio_automatico || 0;
        document.getElementById('productoMargenGanancia').value = producto.margen_ganancia || 0;
        document.getElementById('productoStockMinimo').value = producto.stock_minimo || 0;
        document.getElementById('productoStockMaximo').value = producto.stock_maximo || 0;
        document.getElementById('productoActivo').value = producto.activo !== 0 ? '1' : '0';
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('Error cargando producto:', error);
        showToast('Error al cargar el producto', 'error');
    }
}

// GUARDAR PRODUCTO
async function saveProducto(event) {
    event.preventDefault();
    
    const id = document.getElementById('productoId').value;
    const data = {
        codigo: document.getElementById('productoCodigo').value.trim(),
        nombre: document.getElementById('productoNombre').value.trim(),
        descripcion: document.getElementById('productoDescripcion').value.trim(),
        id_categoria: parseInt(document.getElementById('productoCategoria').value) || null,
        id_marca: parseInt(document.getElementById('productoMarca').value) || null,
        id_unidad_compra: parseInt(document.getElementById('productoUnidadCompra').value) || null,
        id_unidad_venta: parseInt(document.getElementById('productoUnidadVenta').value) || null,
        factor_conversion: parseFloat(document.getElementById('productoFactorConversion').value) || 1,
        precio_compra: parseFloat(document.getElementById('productoPrecioCompra').value) || 0,
        precio_venta: parseFloat(document.getElementById('productoPrecioVenta').value) || 0,
        precio_automatico: parseInt(document.getElementById('productoPrecioAutomatico').value) || 0,
        margen_ganancia: parseFloat(document.getElementById('productoMargenGanancia').value) || 0,
        stock_minimo: parseFloat(document.getElementById('productoStockMinimo').value) || 0,
        stock_maximo: parseFloat(document.getElementById('productoStockMaximo').value) || 0,
        activo: parseInt(document.getElementById('productoActivo').value)
    };

    if (!data.codigo || !data.nombre) {
        showToast('Código y nombre son obligatorios', 'error');
        return;
    }

    try {
        if (id) {
            await api.updateProducto(id, data);
            showToast('Producto actualizado correctamente', 'success');
        } else {
            await api.createProducto(data);
            showToast('Producto creado correctamente', 'success');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('productoModal'));
        modal.hide();
        await loadProductosModule();
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        showToast(error.message || 'Error al guardar el producto', 'error');
    }
}

// ELIMINAR PRODUCTO
async function deleteProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        await api.deleteProducto(id);
        showToast('Producto eliminado correctamente', 'success');
        await loadProductosModule();