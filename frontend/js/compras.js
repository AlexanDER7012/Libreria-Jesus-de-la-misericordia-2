// COMPRAS - CON TODAS LAS PESTAÑAS (Compras, Proveedores, Caja Chica, Gastos, Tipos de Pago)

// =============================================
// VARIABLES GLOBALES
// =============================================

let comprasData = [];
let compraDetallesTemp = [];
let comprasTiposPagoData = [];
let proveedoresData = [];
let tiposProveedorData = [];
let pedidosData = [];
let cajaChicaData = [];
let gastosData = [];
let tiposGastoData = [];

// =============================================
// CARGA DEL MÓDULO PRINCIPAL
// =============================================

async function loadComprasModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-truck me-2 text-info"></i>Compras</h4>
            <button class="btn btn-info btn-sm" onclick="showCreateCompraModal()">
                <i class="fas fa-plus me-2"></i>Nueva Compra
            </button>
        </div>

        <!-- PESTAÑAS PRINCIPALES -->
        <ul class="nav nav-tabs mb-3" id="comprasTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" id="tab-compras" data-bs-toggle="tab"
                        data-bs-target="#panel-compras" type="button" role="tab">
                    <i class="fas fa-list me-1"></i>Compras
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-proveedores" data-bs-toggle="tab"
                        data-bs-target="#panel-proveedores" type="button" role="tab">
                    <i class="fas fa-building me-1"></i>Proveedores
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-caja-chica" data-bs-toggle="tab"
                        data-bs-target="#panel-caja-chica" type="button" role="tab">
                    <i class="fas fa-coins me-1"></i>Caja Chica
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-gastos" data-bs-toggle="tab"
                        data-bs-target="#panel-gastos" type="button" role="tab">
                    <i class="fas fa-receipt me-1"></i>Gastos
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-tipos-pago" data-bs-toggle="tab"
                        data-bs-target="#panel-tipos-pago" type="button" role="tab">
                    <i class="fas fa-credit-card me-1"></i>Tipos de Pago
                </button>
            </li>
        </ul>

        <div class="tab-content" id="comprasTabContent">
            <!-- PANEL: COMPRAS -->
            <div class="tab-pane fade show active" id="panel-compras" role="tabpanel">
                <div id="comprasTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status"></div>
                        <p class="mt-2 text-muted">Cargando compras...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: PROVEEDORES (con sub-pestañas) -->
            <div class="tab-pane fade" id="panel-proveedores" role="tabpanel">
                <ul class="nav nav-tabs mb-3" id="proveedoresSubTabs" role="tablist">
                    <li class="nav-item">
                        <button class="nav-link active" id="subtab-proveedores" data-bs-toggle="tab"
                                data-bs-target="#subpanel-proveedores" type="button" role="tab">
                            <i class="fas fa-building me-1"></i>Proveedores
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" id="subtab-tipos-proveedor" data-bs-toggle="tab"
                                data-bs-target="#subpanel-tipos-proveedor" type="button" role="tab">
                            <i class="fas fa-tags me-1"></i>Tipos de Proveedor
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" id="subtab-pedidos" data-bs-toggle="tab"
                                data-bs-target="#subpanel-pedidos" type="button" role="tab">
                            <i class="fas fa-clipboard-list me-1"></i>Pedidos
                        </button>
                    </li>
                </ul>

                <div class="tab-content" id="proveedoresSubContent">
                    <div class="tab-pane fade show active" id="subpanel-proveedores" role="tabpanel">
                        <div id="proveedoresContainer">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status"></div>
                                <p class="mt-2 text-muted">Cargando proveedores...</p>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="subpanel-tipos-proveedor" role="tabpanel">
                        <div id="tiposProveedorContainer">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status"></div>
                                <p class="mt-2 text-muted">Cargando tipos de proveedor...</p>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="subpanel-pedidos" role="tabpanel">
                        <div id="pedidosContainer">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status"></div>
                                <p class="mt-2 text-muted">Cargando pedidos...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PANEL: CAJA CHICA -->
            <div class="tab-pane fade" id="panel-caja-chica" role="tabpanel">
                <div id="cajaChicaContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-success" role="status"></div>
                        <p class="mt-2 text-muted">Cargando movimientos de caja chica...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: GASTOS (con sub-pestañas) -->
            <div class="tab-pane fade" id="panel-gastos" role="tabpanel">
                <ul class="nav nav-tabs mb-3" id="gastosSubTabs" role="tablist">
                    <li class="nav-item">
                        <button class="nav-link active" id="subtab-gastos" data-bs-toggle="tab"
                                data-bs-target="#subpanel-gastos" type="button" role="tab">
                            <i class="fas fa-receipt me-1"></i>Gastos
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" id="subtab-tipos-gasto" data-bs-toggle="tab"
                                data-bs-target="#subpanel-tipos-gasto" type="button" role="tab">
                            <i class="fas fa-tags me-1"></i>Tipos de Gasto
                        </button>
                    </li>
                </ul>

                <div class="tab-content" id="gastosSubContent">
                    <div class="tab-pane fade show active" id="subpanel-gastos" role="tabpanel">
                        <div id="gastosContainer">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status"></div>
                                <p class="mt-2 text-muted">Cargando gastos...</p>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="subpanel-tipos-gasto" role="tabpanel">
                        <div id="tiposGastoContainer">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status"></div>
                                <p class="mt-2 text-muted">Cargando tipos de gasto...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PANEL: TIPOS DE PAGO -->
            <div class="tab-pane fade" id="panel-tipos-pago" role="tabpanel">
                <div id="tiposPagoContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando tipos de pago...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  try {
    const [
      compras,
      proveedores,
      tiposProveedor,
      pedidos,
      cajaChica,
      gastos,
      tiposGasto,
      tiposPago,
      productos,
      ubicaciones,
    ] = await Promise.all([
      api.getCompras().catch(() => []),
      api.getProveedores().catch(() => []),
      api.getTiposProveedor().catch(() => []),
      api.getPedidos().catch(() => []),
      api.getCajaChica().catch(() => []),
      api.getGastos().catch(() => []),
      api.getTiposGasto().catch(() => []),
      api.getTiposPago().catch(() => []),
      api.getProductos().catch(() => []),
      api.request("/ubicaciones").catch(() => []),
    ]);

    comprasData = compras || [];
    proveedoresData = proveedores || [];
    tiposProveedorData = tiposProveedor || [];
    pedidosData = pedidos || [];
    cajaChicaData = cajaChica || [];
    gastosData = gastos || [];
    tiposGastoData = tiposGasto || [];
    comprasTiposPagoData = tiposPago || [];

    window.proveedoresData = proveedores || [];
    window.productosData = productos || [];
    window.ubicacionesData = ubicaciones || [];
    window.tiposPagoData = tiposPago || [];
    window.tiposProveedorData = tiposProveedor || [];
    window.tiposGastoData = tiposGasto || [];

    renderComprasTable(comprasData);
    renderProveedoresTab(proveedoresData);
    renderTiposProveedorTab(tiposProveedorData);
    renderPedidosTab(pedidosData);
    renderCajaChicaTab(cajaChicaData);
    renderGastosTab(gastosData);
    renderTiposGastoTab(tiposGastoData);
    renderTiposPagoCompras(comprasTiposPagoData);
  } catch (error) {
    document.getElementById("comprasTableContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// =============================================
// PANEL: COMPRAS
// =============================================

function renderComprasTable(compras) {
  const container = document.getElementById("comprasTableContainer");
  if (!container) return;

  if (!compras || compras.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay compras registradas</p>
                <button class="btn btn-info btn-sm" onclick="showCreateCompraModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Compra
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
                        <th>ID</th>
                        <th>Proveedor</th>
                        <th>Factura</th>
                        <th>Fecha</th>
                        <th>Subtotal</th>
                        <th>IVA</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Saldo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  compras.forEach((c) => {
    const proveedor = (window.proveedoresData || []).find(
      (p) => p.id === c.id_proveedor,
    );
    const nombreProveedor = proveedor ? proveedor.nombre : "--";
    const estado = c.estado || "Pendiente";
    const estadoBadge =
      estado === "Completada"
        ? "bg-success"
        : estado === "Pendiente"
          ? "bg-warning"
          : estado === "Pagada"
            ? "bg-info"
            : "bg-secondary";

    html += `
            <tr>
                <td>${c.id}</td>
                <td>${nombreProveedor}</td>
                <td>${c.numero_factura || "--"}</td>
                <td>${c.fecha ? new Date(c.fecha).toLocaleDateString() : "--"}</td>
                <td>Q${c.subtotal || 0}</td>
                <td>Q${c.iva || 0}</td>
                <td><strong>Q${c.total || 0}</strong></td>
                <td><span class="badge ${estadoBadge}">${estado}</span></td>
                <td>Q${c.saldo_pendiente || 0}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verCompra(${c.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="registrarNotaEntrega(${c.id})">
                        <i class="fas fa-file-signature"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="registrarPagoCompra(${c.id})">
                        <i class="fas fa-money-bill-wave"></i>
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
            <small class="text-muted">Total: ${compras.length} compras</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// PANEL: PROVEEDORES (sub-pestañas)
// =============================================

function renderProveedoresTab(proveedores) {
  const container = document.getElementById("proveedoresContainer");
  if (!container) return;

  if (!proveedores || proveedores.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-building fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay proveedores registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateProveedorModal()">
                    <i class="fas fa-plus me-2"></i>Agregar Proveedor
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Proveedores</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreateProveedorModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Proveedor
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>NIT</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  proveedores.forEach((p) => {
    const tipo = (window.tiposProveedorData || []).find(
      (t) => t.id === p.id_tipo_proveedor,
    );
    const activo = p.activo !== 0;

    html += `
            <tr>
                <td>${p.id}</td>
                <td><strong>${p.nombre || "--"}</strong></td>
                <td>${p.contacto || "--"}</td>
                <td>${p.telefono || "--"}</td>
                <td>${p.email || "--"}</td>
                <td>${p.nit || "--"}</td>
                <td>${tipo ? tipo.nombre : "--"}</td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditProveedorModal(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleProveedorEstado(${p.id})">
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
            <small class="text-muted">Total: ${proveedores.length} proveedores</small>
        </div>
    `;

  container.innerHTML = html;
}

function renderTiposProveedorTab(tipos) {
  const container = document.getElementById("tiposProveedorContainer");
  if (!container) return;

  if (!tipos || tipos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay tipos de proveedor registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateTipoProveedorModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Tipo
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Tipos de Proveedor</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreateTipoProveedorModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Tipo
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  tipos.forEach((t) => {
    const activo = t.activo !== 0;

    html += `
            <tr>
                <td>${t.id}</td>
                <td><strong>${t.nombre}</strong></td>
                <td>${t.descripcion || "--"}</td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditTipoProveedorModal(${t.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleTipoProveedorEstado(${t.id})">
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
            <small class="text-muted">Total: ${tipos.length} tipos</small>
        </div>
    `;

  container.innerHTML = html;
}

function renderPedidosTab(pedidos) {
  const container = document.getElementById("pedidosContainer");
  if (!container) return;

  if (!pedidos || pedidos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay pedidos registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreatePedidoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Pedido
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Pedidos</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreatePedidoModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Pedido
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Proveedor</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  pedidos.forEach((p) => {
    const proveedor = (window.proveedoresData || []).find(
      (prov) => prov.id === p.id_proveedor,
    );
    const nombreProveedor = proveedor ? proveedor.nombre : "--";
    const estado = p.estado || "Pendiente";
    const estadoBadge =
      estado === "Completado"
        ? "bg-success"
        : estado === "Aprobado"
          ? "bg-info"
          : estado === "Cotizado"
            ? "bg-warning"
            : estado === "Comprado"
              ? "bg-primary"
              : estado === "Cancelado"
                ? "bg-danger"
                : "bg-secondary";

    html += `
            <tr>
                <td>${p.id}</td>
                <td>${nombreProveedor}</td>
                <td>${p.fecha ? new Date(p.fecha).toLocaleDateString() : "--"}</td>
                <td><strong>Q${p.total || 0}</strong></td>
                <td><span class="badge ${estadoBadge}">${estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verPedido(${p.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="cambiarEstadoPedido(${p.id})">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="verTotalPedido(${p.id})">
                        <i class="fas fa-calculator"></i>
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
            <small class="text-muted">Total: ${pedidos.length} pedidos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// PANEL: CAJA CHICA
// =============================================

function renderCajaChicaTab(movimientos) {
  const container = document.getElementById("cajaChicaContainer");
  if (!container) return;

  if (!movimientos || movimientos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-coins fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay movimientos de caja chica</p>
                <button class="btn btn-success btn-sm" onclick="showCreateCajaChicaModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Movimiento
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Movimientos de Caja Chica</h6>
            <button class="btn btn-success btn-sm" onclick="showCreateCajaChicaModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Movimiento
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Ubicación</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Saldo</th>
                        <th>Concepto</th>
                        <th>Usuario</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  movimientos.forEach((m) => {
    const ubicacion = (window.ubicacionesData || []).find(
      (u) => u.id === m.id_ubicacion,
    );
    const nombreUbicacion = ubicacion ? ubicacion.nombre : "--";
    const tipo = m.tipo === "ingreso" ? "Ingreso" : "Egreso";
    const tipoBadge = m.tipo === "ingreso" ? "bg-success" : "bg-danger";

    html += `
            <tr>
                <td>${m.id}</td>
                <td>${nombreUbicacion}</td>
                <td>${m.fecha ? new Date(m.fecha).toLocaleString() : "--"}</td>
                <td><span class="badge ${tipoBadge}">${tipo}</span></td>
                <td><strong>Q${m.monto || 0}</strong></td>
                <td>Q${m.saldo || 0}</td>
                <td>${m.concepto || "--"}</td>
                <td>${m.id_usuario || "--"}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verCajaChica(${m.id})">
                        <i class="fas fa-eye"></i>
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
            <small class="text-muted">Total: ${movimientos.length} movimientos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// PANEL: GASTOS (sub-pestañas)
// =============================================

function renderGastosTab(gastos) {
  const container = document.getElementById("gastosContainer");
  if (!container) return;

  if (!gastos || gastos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay gastos registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateGastoModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Gasto
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Gastos</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreateGastoModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Gasto
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Ubicación</th>
                        <th>Usuario</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  gastos.forEach((g) => {
    const tipoGasto = (window.tiposGastoData || []).find(
      (t) => t.id === g.id_tipo_gasto,
    );
    const ubicacion = (window.ubicacionesData || []).find(
      (u) => u.id === g.id_ubicacion,
    );
    const nombreTipo = tipoGasto ? tipoGasto.nombre : "--";
    const nombreUbicacion = ubicacion ? ubicacion.nombre : "--";

    html += `
            <tr>
                <td>${g.id}</td>
                <td>${g.fecha ? new Date(g.fecha).toLocaleString() : "--"}</td>
                <td><strong>${nombreTipo}</strong></td>
                <td>${g.concepto || "--"}</td>
                <td><strong>Q${g.monto || 0}</strong></td>
                <td>${nombreUbicacion}</td>
                <td>${g.id_usuario_registra || "--"}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verGasto(${g.id})">
                        <i class="fas fa-eye"></i>
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
            <small class="text-muted">Total: ${gastos.length} gastos</small>
        </div>
    `;

  container.innerHTML = html;
}

function renderTiposGastoTab(tipos) {
  const container = document.getElementById("tiposGastoContainer");
  if (!container) return;

  if (!tipos || tipos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay tipos de gasto registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateTipoGastoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Tipo
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Tipos de Gasto</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreateTipoGastoModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Tipo
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Es Fijo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  tipos.forEach((t) => {
    const activo = t.activo !== 0;

    html += `
            <tr>
                <td>${t.id}</td>
                <td><strong>${t.nombre}</strong></td>
                <td>${t.descripcion || "--"}</td>
                <td><span class="badge ${t.es_fijo === 1 ? "bg-info" : "bg-secondary"}">${t.es_fijo === 1 ? "Fijo" : "Variable"}</span></td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditTipoGastoModal(${t.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleTipoGastoEstado(${t.id})">
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
            <small class="text-muted">Total: ${tipos.length} tipos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// PANEL: TIPOS DE PAGO
// =============================================

function renderTiposPagoCompras(tipos) {
  const container = document.getElementById("tiposPagoContainer");
  if (!container) return;

  const tiposCompra = (tipos || []).filter((t) => t.para_compras === 1);

  if (tiposCompra.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-credit-card fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay tipos de pago registrados para compras</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateTipoPagoCompraModal()">
                    <i class="fas fa-plus me-2"></i>Crear Tipo de Pago
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Tipos de Pago para Compras</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreateTipoPagoCompraModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Tipo
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Para Ventas</th>
                        <th>Para Compras</th>
                    </tr>
                </thead>
                <tbody>
    `;

  tiposCompra.forEach((t) => {
    html += `
            <tr>
                <td>${t.id}</td>
                <td><strong>${t.nombre}</strong></td>
                <td><span class="badge ${t.para_ventas === 1 ? "bg-success" : "bg-secondary"}">${t.para_ventas === 1 ? "Sí" : "No"}</span></td>
                <td><span class="badge bg-success">Sí</span></td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${tiposCompra.length} tipos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// FUNCIONES CRUD: PROVEEDORES
// =============================================
function showCreateProveedorModal() {
  // Eliminar modal existente si hay uno viejo
  const existingModal = document.getElementById("proveedorModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Crear el modal con el evento correcto
  const html = `
        <div class="modal fade" id="proveedorModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="proveedorModalTitle">Nuevo Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="proveedorForm">
                            <input type="hidden" id="proveedorId" value="" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="proveedorNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Contacto</label>
                                <input type="text" class="form-control" id="proveedorContacto" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="proveedorTelefono" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="proveedorEmail" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="proveedorDireccion" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">NIT</label>
                                <input type="text" class="form-control" id="proveedorNit" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Código Proveedor</label>
                                <input type="text" class="form-control" id="proveedorCodigo" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Días de Crédito</label>
                                <input type="number" class="form-control" id="proveedorDiasCredito" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipo de Proveedor</label>
                                <select class="form-select" id="proveedorTipo">
                                    <option value="">Seleccionar tipo</option>
                                    ${(window.tiposProveedorData || []).map((t) => `<option value="${t.id}">${t.nombre}</option>`).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="proveedorActivo">
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" id="btnGuardarProveedor">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);

  // Asignar evento submit - USANDO addEventListener
  const form = document.getElementById("proveedorForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("Formulario de proveedor enviado"); // Para debug
    saveProveedor(e);
  });

  // Mostrar modal
  const modalInstance = new bootstrap.Modal(
    document.getElementById("proveedorModal"),
  );
  modalInstance.show();
}

async function showEditProveedorModal(id) {
  const proveedor = (window.proveedoresData || []).find((p) => p.id === id);
  if (!proveedor) {
    showToast("Proveedor no encontrado", "error");
    return;
  }

  // Eliminar modal existente si hay uno viejo
  const existingModal = document.getElementById("proveedorModal");
  if (existingModal) {
    existingModal.remove();
  }

  const html = `
        <div class="modal fade" id="proveedorModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="proveedorModalTitle">Editar Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="proveedorForm">
                            <input type="hidden" id="proveedorId" value="${proveedor.id}" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="proveedorNombre" value="${proveedor.nombre || ""}" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Contacto</label>
                                <input type="text" class="form-control" id="proveedorContacto" value="${proveedor.contacto || ""}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="proveedorTelefono" value="${proveedor.telefono || ""}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="proveedorEmail" value="${proveedor.email || ""}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="proveedorDireccion" value="${proveedor.direccion || ""}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">NIT</label>
                                <input type="text" class="form-control" id="proveedorNit" value="${proveedor.nit || ""}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Código Proveedor</label>
                                <input type="text" class="form-control" id="proveedorCodigo" value="${proveedor.codigo_proveedor || ""}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Días de Crédito</label>
                                <input type="number" class="form-control" id="proveedorDiasCredito" value="${proveedor.dias_credito || ""}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipo de Proveedor</label>
                                <select class="form-select" id="proveedorTipo">
                                    <option value="">Seleccionar tipo</option>
                                    ${(window.tiposProveedorData || [])
                                      .map(
                                        (t) =>
                                          `<option value="${t.id}" ${t.id === proveedor.id_tipo_proveedor ? "selected" : ""}>${t.nombre}</option>`,
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="proveedorActivo">
                                    <option value="1" ${proveedor.activo !== 0 ? "selected" : ""}>Activo</option>
                                    <option value="0" ${proveedor.activo === 0 ? "selected" : ""}>Inactivo</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" id="btnGuardarProveedor">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);

  // Asignar evento submit
  const form = document.getElementById("proveedorForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("Formulario de proveedor enviado (editar)"); // Para debug
    saveProveedor(e);
  });

  const modalInstance = new bootstrap.Modal(
    document.getElementById("proveedorModal"),
  );
  modalInstance.show();
}

async function saveProveedor(event) {
  event.preventDefault();
  console.log("saveProveedor ejecutado"); // Para debug

  const id = document.getElementById("proveedorId").value;
  const data = {
    nombre: document.getElementById("proveedorNombre").value.trim(),
    contacto: document.getElementById("proveedorContacto").value.trim() || null,
    telefono: document.getElementById("proveedorTelefono").value.trim() || null,
    email: document.getElementById("proveedorEmail").value.trim() || null,
    direccion:
      document.getElementById("proveedorDireccion").value.trim() || null,
    nit: document.getElementById("proveedorNit").value.trim() || null,
    codigo_proveedor:
      document.getElementById("proveedorCodigo").value.trim() || null,
    dias_credito:
      parseInt(document.getElementById("proveedorDiasCredito").value) || null,
    id_tipo_proveedor:
      parseInt(document.getElementById("proveedorTipo").value) || null,
  };

  if (!data.nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    let result;
    if (id) {
      data.activo = parseInt(document.getElementById("proveedorActivo").value);
      result = await api.request(`/proveedores/${id}`, "PUT", data);
      showToast("Proveedor actualizado correctamente", "success");
    } else {
      result = await api.request("/proveedores", "POST", data);
      showToast("Proveedor creado correctamente", "success");
    }

    console.log("Resultado:", result); // Para debug

    // Cerrar modal
    const modal = document.getElementById("proveedorModal");
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    }

    // Recargar datos
    await loadComprasModule();
  } catch (error) {
    console.error("Error en saveProveedor:", error);
    showToast(error.message || "Error al guardar proveedor", "error");
  }
}

async function toggleProveedorEstado(id) {
  const proveedor = (window.proveedoresData || []).find((p) => p.id === id);
  if (!proveedor) return;

  const accion = proveedor.activo !== 0 ? "inactivar" : "reactivar";
  const confirmado = confirm(
    `¿${accion === "inactivar" ? "Inactivar" : "Reactivar"} el proveedor "${proveedor.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    if (accion === "inactivar") {
      await api.request(`/proveedores/${id}`, "DELETE");
    } else {
      await api.request(`/proveedores/${id}/reactivar`, "PATCH");
    }
    showToast(
      `Proveedor ${accion === "inactivar" ? "inactivado" : "reactivado"} correctamente`,
      "success",
    );
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

function crearModalProveedor() {
  if (document.getElementById("proveedorModal")) return;

  const html = `
        <div class="modal fade" id="proveedorModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="proveedorModalTitle">Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="proveedorForm">
                            <input type="hidden" id="proveedorId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="proveedorNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Contacto</label>
                                <input type="text" class="form-control" id="proveedorContacto" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="proveedorTelefono" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="proveedorEmail" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="proveedorDireccion" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">NIT</label>
                                <input type="text" class="form-control" id="proveedorNit" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Código Proveedor</label>
                                <input type="text" class="form-control" id="proveedorCodigo" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Días de Crédito</label>
                                <input type="number" class="form-control" id="proveedorDiasCredito" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipo de Proveedor</label>
                                <select class="form-select" id="proveedorTipo"></select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="proveedorActivo">
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

  // Asignar el evento submit correctamente
  document.getElementById("proveedorForm").onsubmit = saveProveedor;
}

function llenarSelectTipoProveedor(selectedId) {
  const select = document.getElementById("proveedorTipo");
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar tipo</option>';
  (window.tiposProveedorData || []).forEach((t) => {
    const selected = t.id === selectedId ? "selected" : "";
    select.innerHTML += `<option value="${t.id}" ${selected}>${t.nombre}</option>`;
  });
}

// =============================================
// FUNCIONES CRUD: TIPOS DE PROVEEDOR
// =============================================

function showCreateTipoProveedorModal() {
  const modal = document.getElementById("tipoProveedorModal");
  if (!modal) {
    crearModalTipoProveedor();
    setTimeout(() => showCreateTipoProveedorModal(), 100);
    return;
  }

  document.getElementById("tipoProveedorModalTitle").textContent =
    "Nuevo Tipo de Proveedor";
  document.getElementById("tipoProveedorForm").reset();
  document.getElementById("tipoProveedorId").value = "";
  document.getElementById("tipoProveedorActivo").value = "1";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditTipoProveedorModal(id) {
  const tipo = (window.tiposProveedorData || []).find((t) => t.id === id);
  if (!tipo) {
    showToast("Tipo no encontrado", "error");
    return;
  }

  const modal = document.getElementById("tipoProveedorModal");
  if (!modal) {
    crearModalTipoProveedor();
    setTimeout(() => showEditTipoProveedorModal(id), 100);
    return;
  }

  document.getElementById("tipoProveedorModalTitle").textContent =
    "Editar Tipo de Proveedor";
  document.getElementById("tipoProveedorId").value = tipo.id;
  document.getElementById("tipoProveedorNombre").value = tipo.nombre || "";
  document.getElementById("tipoProveedorDescripcion").value =
    tipo.descripcion || "";
  document.getElementById("tipoProveedorActivo").value =
    tipo.activo !== 0 ? "1" : "0";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveTipoProveedor(event) {
  event.preventDefault();

  const id = document.getElementById("tipoProveedorId").value;
  const data = {
    nombre: document.getElementById("tipoProveedorNombre").value.trim(),
    descripcion:
      document.getElementById("tipoProveedorDescripcion").value.trim() || null,
  };

  if (!data.nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    if (id) {
      data.activo = parseInt(
        document.getElementById("tipoProveedorActivo").value,
      );
      await api.request(`/tipos-proveedor/${id}`, "PUT", data);
      showToast("Tipo actualizado correctamente", "success");
    } else {
      await api.request("/tipos-proveedor", "POST", data);
      showToast("Tipo creado correctamente", "success");
    }

    bootstrap.Modal.getInstance(
      document.getElementById("tipoProveedorModal"),
    ).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al guardar tipo", "error");
  }
}

async function toggleTipoProveedorEstado(id) {
  const tipo = (window.tiposProveedorData || []).find((t) => t.id === id);
  if (!tipo) return;

  const accion = tipo.activo !== 0 ? "inactivar" : "activar";
  const confirmado = confirm(
    `¿${accion === "inactivar" ? "Inactivar" : "Activar"} el tipo "${tipo.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    await api.request(`/tipos-proveedor/${id}`, "PUT", {
      ...tipo,
      activo: tipo.activo !== 0 ? 0 : 1,
    });
    showToast(
      `Tipo ${accion === "inactivar" ? "inactivado" : "activado"} correctamente`,
      "success",
    );
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

function crearModalTipoProveedor() {
  if (document.getElementById("tipoProveedorModal")) return;

  const html = `
        <div class="modal fade" id="tipoProveedorModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="tipoProveedorModalTitle">Tipo de Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="tipoProveedorForm">
                            <input type="hidden" id="tipoProveedorId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="tipoProveedorNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="tipoProveedorDescripcion" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="tipoProveedorActivo">
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
  document.getElementById("tipoProveedorForm").onsubmit = saveTipoProveedor;
}

// =============================================
// FUNCIONES CRUD: PEDIDOS
// =============================================

function showCreatePedidoModal() {
  const proveedores = (window.proveedoresData || []).filter(
    (p) => p.activo !== 0,
  );
  if (proveedores.length === 0) {
    showToast("No hay proveedores activos. Crea uno primero.", "warning");
    return;
  }

  const options = proveedores
    .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
    .join("");

  const html = `
        <div class="modal fade" id="pedidoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nuevo Pedido</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="pedidoForm">
                            <div class="mb-3">
                                <label class="form-label">Proveedor *</label>
                                <select class="form-select" id="pedidoProveedor" required>
                                    <option value="">Seleccionar proveedor</option>
                                    ${options}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea class="form-control" id="pedidoObservaciones" rows="2"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Crear Pedido</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("pedidoForm").onsubmit = savePedido;

  const modalInstance = new bootstrap.Modal(
    document.getElementById("pedidoModal"),
  );
  modalInstance.show();
}

async function savePedido(event) {
  event.preventDefault();

  const id_proveedor = parseInt(
    document.getElementById("pedidoProveedor").value,
  );
  const observaciones =
    document.getElementById("pedidoObservaciones").value || null;

  if (!id_proveedor) {
    showToast("Selecciona un proveedor", "error");
    return;
  }

  const data = {
    id_usuario: getCurrentUser()?.id || 1,
    id_proveedor: id_proveedor,
    observaciones: observaciones,
  };

  try {
    const result = await api.request("/pedidos", "POST", data);
    showToast(`Pedido #${result.id} creado correctamente`, "success");
    bootstrap.Modal.getInstance(document.getElementById("pedidoModal")).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al crear pedido", "error");
  }
}

async function verPedido(id) {
  try {
    const pedido = await api.request(`/pedidos/${id}`);
    if (!pedido) {
      showToast("Pedido no encontrado", "error");
      return;
    }

    const proveedor = (window.proveedoresData || []).find(
      (p) => p.id === pedido.id_proveedor,
    );
    const nombreProveedor = proveedor ? proveedor.nombre : "--";

    let detallesHtml = (pedido.detalles || [])
      .map((d) => {
        const producto = (window.productosData || []).find(
          (p) => p.id === d.id_producto,
        );
        return `
                <tr>
                    <td>${producto ? producto.nombre : "--"}</td>
                    <td>${d.cantidad_pedida || 0}</td>
                    <td>${d.cantidad_sugerida || 0}</td>
                    <td>${d.observaciones || "--"}</td>
                </tr>
            `;
      })
      .join("");

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Pedido #${pedido.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Proveedor:</strong> ${nombreProveedor}
                    </div>
                    <div class="col-md-6">
                        <strong>Fecha:</strong> ${pedido.fecha ? new Date(pedido.fecha).toLocaleString() : "--"}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Estado:</strong> <span class="badge bg-warning">${pedido.estado || "Pendiente"}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>Usuario:</strong> ${pedido.id_usuario || "--"}
                    </div>
                </div>
                ${pedido.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${pedido.observaciones}</div>` : ""}

                <h6 class="fw-bold mt-3">Detalles</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr><th>Producto</th><th>Cant. Pedida</th><th>Cant. Sugerida</th><th>Observaciones</th></tr>
                        </thead>
                        <tbody>${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "pedidoDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver pedido", "error");
  }
}

async function verTotalPedido(id) {
  try {
    const result = await api.request(`/pedidos/${id}/total`);
    if (!result) {
      showToast("Error al calcular total", "error");
      return;
    }

    const estado = result.alcanza_minimo
      ? "✅ Alcanza el mínimo de Q500"
      : "❌ No alcanza el mínimo de Q500";

    showToast(
      `Total del pedido #${id}: Q${result.total || 0} - ${estado}`,
      result.alcanza_minimo ? "success" : "warning",
    );
  } catch (error) {
    showToast(error.message || "Error al calcular total", "error");
  }
}

async function cambiarEstadoPedido(id) {
  const estados = [
    "Pendiente",
    "Cotizado",
    "Aprobado",
    "Comprado",
    "Cancelado",
  ];
  const estadoActual = prompt(
    `Ingrese el nuevo estado (${estados.join(", ")}):`,
    "Aprobado",
  );

  if (!estadoActual) return;

  if (!estados.includes(estadoActual)) {
    showToast(`Estado inválido. Use: ${estados.join(", ")}`, "error");
    return;
  }

  const forzar = confirm(
    `¿Forzar aprobación aunque no alcance el mínimo de Q500?`,
  );

  try {
    const url = `/pedidos/${id}/estado?nuevo_estado=${encodeURIComponent(estadoActual)}&forzar=${forzar}`;
    const result = await api.request(url, "PATCH");
    showToast(`Pedido #${id} actualizado a "${estadoActual}"`, "success");
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

// =============================================
// FUNCIONES CRUD: CAJA CHICA
// =============================================

function showCreateCajaChicaModal() {
  const ubicaciones = (window.ubicacionesData || []).filter(
    (u) => u.activo !== 0,
  );
  if (ubicaciones.length === 0) {
    showToast("No hay ubicaciones disponibles", "warning");
    return;
  }

  const ubicacionOptions = ubicaciones
    .map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`)
    .join("");

  const html = `
        <div class="modal fade" id="cajaChicaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nuevo Movimiento de Caja Chica</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="cajaChicaForm">
                            <div class="mb-3">
                                <label class="form-label">Ubicación *</label>
                                <select class="form-select" id="cajaChicaUbicacion" required>
                                    <option value="">Seleccionar ubicación</option>
                                    ${ubicacionOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipo *</label>
                                <select class="form-select" id="cajaChicaTipo" required>
                                    <option value="ingreso">Ingreso</option>
                                    <option value="egreso">Egreso</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Monto *</label>
                                <input type="number" step="0.01" class="form-control" id="cajaChicaMonto" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Concepto *</label>
                                <input type="text" class="form-control" id="cajaChicaConcepto" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Referencia</label>
                                <input type="text" class="form-control" id="cajaChicaReferencia" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea class="form-control" id="cajaChicaObservaciones" rows="2"></textarea>
                            </div>
                            <button type="submit" class="btn btn-success w-100">Registrar Movimiento</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("cajaChicaForm").onsubmit = saveCajaChica;

  const modalInstance = new bootstrap.Modal(
    document.getElementById("cajaChicaModal"),
  );
  modalInstance.show();
}

async function saveCajaChica(event) {
  event.preventDefault();

  const data = {
    id_ubicacion: parseInt(document.getElementById("cajaChicaUbicacion").value),
    tipo: document.getElementById("cajaChicaTipo").value,
    monto: parseFloat(document.getElementById("cajaChicaMonto").value) || 0,
    concepto: document.getElementById("cajaChicaConcepto").value.trim(),
    id_usuario: getCurrentUser()?.id || 1,
    referencia:
      document.getElementById("cajaChicaReferencia").value.trim() || null,
    observaciones:
      document.getElementById("cajaChicaObservaciones").value.trim() || null,
  };

  if (!data.id_ubicacion) {
    showToast("Selecciona una ubicación", "error");
    return;
  }
  if (!data.concepto) {
    showToast("El concepto es obligatorio", "error");
    return;
  }
  if (data.monto <= 0) {
    showToast("El monto debe ser mayor a 0", "error");
    return;
  }

  try {
    const result = await api.request("/caja-chica", "POST", data);
    showToast(`Movimiento #${result.id} registrado correctamente`, "success");
    bootstrap.Modal.getInstance(
      document.getElementById("cajaChicaModal"),
    ).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al registrar movimiento", "error");
  }
}

async function verCajaChica(id) {
  try {
    const movimiento = await api.request(`/caja-chica/${id}`);
    if (!movimiento) {
      showToast("Movimiento no encontrado", "error");
      return;
    }

    const ubicacion = (window.ubicacionesData || []).find(
      (u) => u.id === movimiento.id_ubicacion,
    );
    const nombreUbicacion = ubicacion ? ubicacion.nombre : "--";

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Movimiento Caja Chica #${movimiento.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Ubicación:</strong> ${nombreUbicacion}
                    </div>
                    <div class="col-md-6">
                        <strong>Fecha:</strong> ${movimiento.fecha ? new Date(movimiento.fecha).toLocaleString() : "--"}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Tipo:</strong> <span class="badge ${movimiento.tipo === "ingreso" ? "bg-success" : "bg-danger"}">${movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>Monto:</strong> Q${movimiento.monto || 0}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Saldo:</strong> Q${movimiento.saldo || 0}
                    </div>
                    <div class="col-md-6">
                        <strong>Usuario:</strong> ${movimiento.id_usuario || "--"}
                    </div>
                </div>
                <div class="mb-3">
                    <strong>Concepto:</strong> ${movimiento.concepto || "--"}
                </div>
                ${movimiento.referencia ? `<div class="mb-3"><strong>Referencia:</strong> ${movimiento.referencia}</div>` : ""}
                ${movimiento.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${movimiento.observaciones}</div>` : ""}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "cajaChicaDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver movimiento", "error");
  }
}

// =============================================
// FUNCIONES CRUD: GASTOS
// =============================================

function showCreateGastoModal() {
  const tiposGasto = (window.tiposGastoData || []).filter(
    (t) => t.activo !== 0,
  );
  if (tiposGasto.length === 0) {
    showToast("No hay tipos de gasto. Crea uno primero.", "warning");
    return;
  }

  const ubicaciones = (window.ubicacionesData || []).filter(
    (u) => u.activo !== 0,
  );
  if (ubicaciones.length === 0) {
    showToast("No hay ubicaciones disponibles", "warning");
    return;
  }

  const tipoOptions = tiposGasto
    .map((t) => `<option value="${t.id}">${t.nombre}</option>`)
    .join("");
  const ubicacionOptions = ubicaciones
    .map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`)
    .join("");

  const html = `
        <div class="modal fade" id="gastoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Registrar Gasto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="gastoForm">
                            <div class="mb-3">
                                <label class="form-label">Tipo de Gasto *</label>
                                <select class="form-select" id="gastroTipo" required>
                                    <option value="">Seleccionar tipo</option>
                                    ${tipoOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ubicación *</label>
                                <select class="form-select" id="gastoUbicacion" required>
                                    <option value="">Seleccionar ubicación</option>
                                    ${ubicacionOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Concepto *</label>
                                <input type="text" class="form-control" id="gastoConcepto" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Monto *</label>
                                <input type="number" step="0.01" class="form-control" id="gastoMonto" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea class="form-control" id="gastoObservaciones" rows="2"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Registrar Gasto</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("gastoForm").onsubmit = saveGasto;

  const modalInstance = new bootstrap.Modal(
    document.getElementById("gastoModal"),
  );
  modalInstance.show();
}

async function saveGasto(event) {
  event.preventDefault();

  const data = {
    id_tipo_gasto: parseInt(document.getElementById("gastroTipo").value),
    id_ubicacion: parseInt(document.getElementById("gastoUbicacion").value),
    concepto: document.getElementById("gastoConcepto").value.trim(),
    monto: parseFloat(document.getElementById("gastoMonto").value) || 0,
    id_usuario_registra: getCurrentUser()?.id || 1,
    observaciones:
      document.getElementById("gastoObservaciones").value.trim() || null,
  };

  if (!data.id_tipo_gasto) {
    showToast("Selecciona un tipo de gasto", "error");
    return;
  }
  if (!data.id_ubicacion) {
    showToast("Selecciona una ubicación", "error");
    return;
  }
  if (!data.concepto) {
    showToast("El concepto es obligatorio", "error");
    return;
  }
  if (data.monto <= 0) {
    showToast("El monto debe ser mayor a 0", "error");
    return;
  }

  try {
    const result = await api.request("/gastos", "POST", data);
    showToast(`Gasto #${result.id} registrado correctamente`, "success");
    bootstrap.Modal.getInstance(document.getElementById("gastoModal")).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al registrar gasto", "error");
  }
}

async function verGasto(id) {
  try {
    const gasto = await api.request(`/gastos/${id}`);
    if (!gasto) {
      showToast("Gasto no encontrado", "error");
      return;
    }

    const tipoGasto = (window.tiposGastoData || []).find(
      (t) => t.id === gasto.id_tipo_gasto,
    );
    const ubicacion = (window.ubicacionesData || []).find(
      (u) => u.id === gasto.id_ubicacion,
    );
    const nombreTipo = tipoGasto ? tipoGasto.nombre : "--";
    const nombreUbicacion = ubicacion ? ubicacion.nombre : "--";

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Gasto #${gasto.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Tipo:</strong> ${nombreTipo}
                    </div>
                    <div class="col-md-6">
                        <strong>Ubicación:</strong> ${nombreUbicacion}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Fecha:</strong> ${gasto.fecha ? new Date(gasto.fecha).toLocaleString() : "--"}
                    </div>
                    <div class="col-md-6">
                        <strong>Monto:</strong> Q${gasto.monto || 0}
                    </div>
                </div>
                <div class="mb-3">
                    <strong>Concepto:</strong> ${gasto.concepto || "--"}
                </div>
                ${gasto.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${gasto.observaciones}</div>` : ""}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "gastoDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver gasto", "error");
  }
}

// =============================================
// FUNCIONES CRUD: TIPOS DE GASTO
// =============================================

function showCreateTipoGastoModal() {
  const modal = document.getElementById("tipoGastoModal");
  if (!modal) {
    crearModalTipoGasto();
    setTimeout(() => showCreateTipoGastoModal(), 100);
    return;
  }

  document.getElementById("tipoGastoModalTitle").textContent =
    "Nuevo Tipo de Gasto";
  document.getElementById("tipoGastoForm").reset();
  document.getElementById("tipoGastoId").value = "";
  document.getElementById("tipoGastoActivo").value = "1";
  document.getElementById("tipoGastoEsFijo").value = "0";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditTipoGastoModal(id) {
  const tipo = (window.tiposGastoData || []).find((t) => t.id === id);
  if (!tipo) {
    showToast("Tipo no encontrado", "error");
    return;
  }

  const modal = document.getElementById("tipoGastoModal");
  if (!modal) {
    crearModalTipoGasto();
    setTimeout(() => showEditTipoGastoModal(id), 100);
    return;
  }

  document.getElementById("tipoGastoModalTitle").textContent =
    "Editar Tipo de Gasto";
  document.getElementById("tipoGastoId").value = tipo.id;
  document.getElementById("tipoGastoNombre").value = tipo.nombre || "";
  document.getElementById("tipoGastoDescripcion").value =
    tipo.descripcion || "";
  document.getElementById("tipoGastoEsFijo").value = tipo.es_fijo || 0;
  document.getElementById("tipoGastoActivo").value =
    tipo.activo !== 0 ? "1" : "0";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveTipoGasto(event) {
  event.preventDefault();

  const id = document.getElementById("tipoGastoId").value;
  const data = {
    nombre: document.getElementById("tipoGastoNombre").value.trim(),
    descripcion:
      document.getElementById("tipoGastoDescripcion").value.trim() || null,
    es_fijo: parseInt(document.getElementById("tipoGastoEsFijo").value) || 0,
  };

  if (!data.nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    if (id) {
      data.activo = parseInt(document.getElementById("tipoGastoActivo").value);
      await api.request(`/tipos-gasto/${id}`, "PUT", data);
      showToast("Tipo actualizado correctamente", "success");
    } else {
      await api.request("/tipos-gasto", "POST", data);
      showToast("Tipo creado correctamente", "success");
    }

    bootstrap.Modal.getInstance(
      document.getElementById("tipoGastoModal"),
    ).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al guardar tipo", "error");
  }
}

async function toggleTipoGastoEstado(id) {
  const tipo = (window.tiposGastoData || []).find((t) => t.id === id);
  if (!tipo) return;

  const accion = tipo.activo !== 0 ? "inactivar" : "activar";
  const confirmado = confirm(
    `¿${accion === "inactivar" ? "Inactivar" : "Activar"} el tipo "${tipo.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    await api.request(`/tipos-gasto/${id}`, "PUT", {
      ...tipo,
      activo: tipo.activo !== 0 ? 0 : 1,
    });
    showToast(
      `Tipo ${accion === "inactivar" ? "inactivado" : "activado"} correctamente`,
      "success",
    );
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

function crearModalTipoGasto() {
  if (document.getElementById("tipoGastoModal")) return;

  const html = `
        <div class="modal fade" id="tipoGastoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="tipoGastoModalTitle">Tipo de Gasto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="tipoGastoForm">
                            <input type="hidden" id="tipoGastoId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="tipoGastoNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="tipoGastoDescripcion" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">¿Es Fijo?</label>
                                <select class="form-select" id="tipoGastoEsFijo">
                                    <option value="1">Sí</option>
                                    <option value="0" selected>No</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="tipoGastoActivo">
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
  document.getElementById("tipoGastoForm").onsubmit = saveTipoGasto;
}

// =============================================
// FUNCIONES CRUD: TIPOS DE PAGO (COMPRAS)
// =============================================

function showCreateTipoPagoCompraModal() {
  const modal = document.getElementById("tipoPagoModal");
  if (!modal) {
    crearModalTipoPago();
    setTimeout(() => showCreateTipoPagoCompraModal(), 100);
    return;
  }

  document.getElementById("tipoPagoModalTitle").textContent =
    "Nuevo Tipo de Pago para Compras";
  document.getElementById("tipoPagoForm").reset();
  document.getElementById("tipoPagoCompras").value = "1";
  document.getElementById("tipoPagoVentas").value = "0";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveTipoPagoCompra(event) {
  event.preventDefault();

  const nombre = document.getElementById("tipoPagoNombre").value.trim();
  const para_ventas = parseInt(document.getElementById("tipoPagoVentas").value);
  const para_compras = parseInt(
    document.getElementById("tipoPagoCompras").value,
  );

  if (!nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    await api.request("/tipos-pago", "POST", {
      nombre,
      para_ventas,
      para_compras,
    });
    showToast("Tipo de pago creado correctamente", "success");
    bootstrap.Modal.getInstance(
      document.getElementById("tipoPagoModal"),
    ).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al crear tipo de pago", "error");
  }
}

function crearModalTipoPago() {
  if (document.getElementById("tipoPagoModal")) return;

  const html = `
        <div class="modal fade" id="tipoPagoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="tipoPagoModalTitle">Tipo de Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="tipoPagoForm">
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="tipoPagoNombre" required />
                            </div>
                            <div class="row">
                                <div class="col-6 mb-3">
                                    <label class="form-label">¿Para ventas?</label>
                                    <select class="form-select" id="tipoPagoVentas">
                                        <option value="1">Sí</option>
                                        <option value="0" selected>No</option>
                                    </select>
                                </div>
                                <div class="col-6 mb-3">
                                    <label class="form-label">¿Para compras?</label>
                                    <select class="form-select" id="tipoPagoCompras">
                                        <option value="1" selected>Sí</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("tipoPagoForm").onsubmit = saveTipoPagoCompra;
}

// =============================================
// FUNCIONES CRUD: COMPRAS (crear, ver, etc.)
// =============================================

function showCreateCompraModal() {
  compraDetallesTemp = [];

  const modal = document.getElementById("compraModal");
  const form = document.getElementById("compraForm");
  const title = document.getElementById("compraModalTitle");

  title.textContent = "Nueva Compra";
  form.reset();
  document.getElementById("compraId").value = "";
  document.getElementById("compraIva").value = 0;
  document.getElementById("compraObservaciones").value = "";

  llenarSelectProveedor();
  llenarSelectUbicacionCompra();
  llenarSelectProductoCompra();

  document.getElementById("compraDetallesList").innerHTML = "";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function llenarSelectProveedor() {
  const select = document.getElementById("compraProveedor");
  select.innerHTML = '<option value="">Seleccionar proveedor</option>';
  (window.proveedoresData || []).forEach((p) => {
    if (p.activo !== 0) {
      select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    }
  });
}

function llenarSelectUbicacionCompra() {
  const select = document.getElementById("compraUbicacion");
  select.innerHTML = '<option value="">Seleccionar ubicación</option>';
  (window.ubicacionesData || []).forEach((u) => {
    if (u.activo !== 0) {
      select.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
    }
  });
}

function llenarSelectProductoCompra() {
  const selects = document.querySelectorAll(".compra-detalle-producto");
  selects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    (window.productosData || []).forEach((p) => {
      if (p.activo !== 0) {
        select.innerHTML += `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`;
      }
    });
  });
}

function agregarDetalleCompra(event) {
  event.preventDefault();

  const row = document.getElementById("compraDetalleRow");
  const productSelect = row.querySelector(".compra-detalle-producto");
  const cantidadInput = row.querySelector(".compra-detalle-cantidad");
  const costoInput = row.querySelector(".compra-detalle-costo");

  const id_producto = parseInt(productSelect.value);
  const cantidad = parseFloat(cantidadInput.value) || 1;
  const costo_unitario = parseFloat(costoInput.value) || 0;

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

  compraDetallesTemp.push({
    id_producto: id_producto,
    cantidad_comprada: cantidad,
    cantidad_unidades: cantidad,
    costo_unitario: costo_unitario,
    producto: producto,
  });

  renderDetallesCompra();
  cantidadInput.value = 1;
  costoInput.value = 0;
  productSelect.value = "";
}

function renderDetallesCompra() {
  const container = document.getElementById("compraDetallesList");
  if (compraDetallesTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay productos agregados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  let total = 0;
  compraDetallesTemp.forEach((d, index) => {
    const subtotal = d.cantidad_comprada * d.costo_unitario;
    total += subtotal;
    html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${d.producto.nombre}</strong>
                    <span class="text-muted small"> x ${d.cantidad_comprada}</span>
                    <span class="text-muted small"> Q${d.costo_unitario} c/u</span>
                </div>
                <div>
                    <span class="fw-bold">Q${subtotal.toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarDetalleCompra(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </li>
        `;
  });
  html += `
        <li class="list-group-item fw-bold">
            Subtotal: Q${total.toFixed(2)}
        </li>
    </ul>`;
  container.innerHTML = html;

  const ivaInput = document.getElementById("compraIva");
  const iva = parseFloat(ivaInput.value) || 0;
  const totalConIva = total + (total * iva) / 100;
  const totalElement = container.querySelector(".list-group-item.fw-bold");
  if (totalElement) {
    totalElement.textContent = `Subtotal: Q${total.toFixed(2)} | IVA: ${iva}% | Total: Q${totalConIva.toFixed(2)}`;
  }
}

function eliminarDetalleCompra(index) {
  compraDetallesTemp.splice(index, 1);
  renderDetallesCompra();
}

document.addEventListener("DOMContentLoaded", function () {
  const ivaInput = document.getElementById("compraIva");
  if (ivaInput) {
    ivaInput.addEventListener("input", function () {
      renderDetallesCompra();
    });
  }
});

async function saveCompra(event) {
  event.preventDefault();

  const id_proveedor = parseInt(
    document.getElementById("compraProveedor").value,
  );
  const id_ubicacion_destino =
    parseInt(document.getElementById("compraUbicacion").value) || null;
  const numero_factura = document.getElementById("compraFactura").value || null;
  const iva = parseFloat(document.getElementById("compraIva").value) || 0;
  const observaciones =
    document.getElementById("compraObservaciones").value || null;
  const id_usuario_registra = getCurrentUser()?.id || 1;

  if (!id_proveedor) {
    showToast("Selecciona un proveedor", "error");
    return;
  }
  if (compraDetallesTemp.length === 0) {
    showToast("Agrega al menos un producto", "error");
    return;
  }

  const data = {
    id_proveedor: id_proveedor,
    id_ubicacion_destino: id_ubicacion_destino,
    numero_factura: numero_factura,
    id_usuario_registra: id_usuario_registra,
    iva: iva,
    observaciones: observaciones,
    detalles: compraDetallesTemp.map((d) => ({
      id_producto: d.id_producto,
      cantidad_comprada: d.cantidad_comprada,
      cantidad_unidades: d.cantidad_unidades,
      costo_unitario: d.costo_unitario,
    })),
  };

  try {
    const result = await api.request("/compras", "POST", data);
    showToast(`Compra #${result.id} creada correctamente`, "success");
    bootstrap.Modal.getInstance(document.getElementById("compraModal")).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al crear compra", "error");
  }
}

async function verCompra(id) {
  try {
    const compra = await api.request(`/compras/${id}`);
    if (!compra) {
      showToast("Compra no encontrada", "error");
      return;
    }

    const proveedor = (window.proveedoresData || []).find(
      (p) => p.id === compra.id_proveedor,
    );
    const nombreProveedor = proveedor ? proveedor.nombre : "--";

    let detallesHtml = (compra.detalles || [])
      .map((d) => {
        const producto = (window.productosData || []).find(
          (p) => p.id === d.id_producto,
        );
        return `
                <tr>
                    <td>${producto ? producto.nombre : "--"}</td>
                    <td>${d.cantidad_comprada || 0}</td>
                    <td>Q${d.costo_unitario || 0}</td>
                    <td>Q${d.subtotal || 0}</td>
                </tr>
            `;
      })
      .join("");

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Compra #${compra.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Proveedor:</strong> ${nombreProveedor}
                    </div>
                    <div class="col-md-6">
                        <strong>Factura:</strong> ${compra.numero_factura || "--"}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Fecha:</strong> ${compra.fecha ? new Date(compra.fecha).toLocaleString() : "--"}
                    </div>
                    <div class="col-md-6">
                        <strong>Estado:</strong> <span class="badge bg-success">${compra.estado || "Pendiente"}</span>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Subtotal:</strong> Q${compra.subtotal || 0}
                    </div>
                    <div class="col-md-6">
                        <strong>Total:</strong> Q${compra.total || 0}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Saldo Pendiente:</strong> Q${compra.saldo_pendiente || 0}
                    </div>
                    <div class="col-md-6">
                        <strong>Vencimiento:</strong> ${compra.fecha_vencimiento_pago || "--"}
                    </div>
                </div>
                ${compra.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${compra.observaciones}</div>` : ""}

                <h6 class="fw-bold mt-3">Detalles</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr><th>Producto</th><th>Cantidad</th><th>Costo Unitario</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "compraDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver compra", "error");
  }
}

async function registrarNotaEntrega(id) {
  const numero_nota = prompt("Ingrese el número de nota de entrega:");
  if (!numero_nota) return;

  const conforme = confirm("¿El receptor está conforme?");
  const data = {
    numero_nota: numero_nota,
    id_usuario_receptor: getCurrentUser()?.id || 1,
    conforme: conforme ? 1 : 0,
    observaciones: prompt("Observaciones (opcional):") || null,
  };

  try {
    await api.request(`/compras/${id}/nota-entrega`, "POST", data);
    showToast("Nota de entrega registrada correctamente", "success");
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al registrar nota de entrega", "error");
  }
}

async function registrarPagoCompra(id) {
  const tiposPago = await api.getTiposPago();
  if (!tiposPago || tiposPago.length === 0) {
    showToast("No hay tipos de pago disponibles", "error");
    return;
  }

  const tipoOptions = tiposPago
    .filter((t) => t.para_compras === 1)
    .map((t) => `${t.id} - ${t.nombre}`)
    .join("\n");

  const tipoId = prompt(
    `Tipos de pago disponibles:\n${tipoOptions}\n\nIngrese el ID del tipo de pago:`,
  );
  if (!tipoId) return;

  const monto = prompt("Ingrese el monto del pago:");
  if (!monto || isNaN(parseFloat(monto))) {
    showToast("Monto inválido", "error");
    return;
  }

  const data = {
    id_tipo_pago: parseInt(tipoId),
    monto: parseFloat(monto),
    referencia: prompt("Referencia (opcional):") || null,
    observaciones: prompt("Observaciones (opcional):") || null,
  };

  try {
    await api.request(`/compras/${id}/pagos`, "POST", data);
    showToast("Pago registrado correctamente", "success");
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al registrar pago", "error");
  }
}

// =============================================
// FUNCIONES GLOBALES
// =============================================

window.loadComprasModule = loadComprasModule;
window.showCreateCompraModal = showCreateCompraModal;
window.saveCompra = saveCompra;
window.verCompra = verCompra;
window.registrarNotaEntrega = registrarNotaEntrega;
window.registrarPagoCompra = registrarPagoCompra;

// Proveedores
window.renderProveedoresTab = renderProveedoresTab;
window.showCreateProveedorModal = showCreateProveedorModal;
window.showEditProveedorModal = showEditProveedorModal;
window.saveProveedor = saveProveedor;
window.toggleProveedorEstado = toggleProveedorEstado;
window.llenarSelectTipoProveedor = llenarSelectTipoProveedor;

// Tipos de Proveedor
window.renderTiposProveedorTab = renderTiposProveedorTab;
window.showCreateTipoProveedorModal = showCreateTipoProveedorModal;
window.showEditTipoProveedorModal = showEditTipoProveedorModal;
window.saveTipoProveedor = saveTipoProveedor;
window.toggleTipoProveedorEstado = toggleTipoProveedorEstado;

// Pedidos
window.renderPedidosTab = renderPedidosTab;
window.showCreatePedidoModal = showCreatePedidoModal;
window.savePedido = savePedido;
window.verPedido = verPedido;
window.verTotalPedido = verTotalPedido;
window.cambiarEstadoPedido = cambiarEstadoPedido;

// Caja Chica
window.renderCajaChicaTab = renderCajaChicaTab;
window.showCreateCajaChicaModal = showCreateCajaChicaModal;
window.saveCajaChica = saveCajaChica;
window.verCajaChica = verCajaChica;

// Gastos
window.renderGastosTab = renderGastosTab;
window.showCreateGastoModal = showCreateGastoModal;
window.saveGasto = saveGasto;
window.verGasto = verGasto;

// Tipos de Gasto
window.renderTiposGastoTab = renderTiposGastoTab;
window.showCreateTipoGastoModal = showCreateTipoGastoModal;
window.showEditTipoGastoModal = showEditTipoGastoModal;
window.saveTipoGasto = saveTipoGasto;
window.toggleTipoGastoEstado = toggleTipoGastoEstado;

// Tipos de Pago
window.renderTiposPagoCompras = renderTiposPagoCompras;
window.showCreateTipoPagoCompraModal = showCreateTipoPagoCompraModal;
window.saveTipoPagoCompra = saveTipoPagoCompra;

// Funciones auxiliares
window.llenarSelectProveedor = llenarSelectProveedor;
window.llenarSelectUbicacionCompra = llenarSelectUbicacionCompra;
window.llenarSelectProductoCompra = llenarSelectProductoCompra;
window.agregarDetalleCompra = agregarDetalleCompra;
window.eliminarDetalleCompra = eliminarDetalleCompra;
window.renderDetallesCompra = renderDetallesCompra;
