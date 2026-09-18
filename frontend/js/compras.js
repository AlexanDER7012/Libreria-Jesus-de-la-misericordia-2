// compras.js
// =============================================
// VARIABLES GLOBALES
// =============================================

let comprasData = [];
let compraDetallesTemp = [];
let pedidoDetallesTemp = [];
let comprasTiposPagoData = [];
let proveedoresData = [];
let tiposProveedorData = [];
let pedidosData = [];
let tiposGastoData = [];

let skipCajaChica = 0;
const LIMITE_CAJA_CHICA = 10;
let skipGastos = 0;
const LIMITE_GASTOS = 10;

// =============================================
// FUNCIÓN PARA REGISTRAR MOVIMIENTO DE INVENTARIO
// =============================================

async function registrarMovimientoInventario(
  id_producto,
  cantidad,
  id_tipo_movimiento = null,
  observacion = null,
  costo_unitario = 0,
) {
  try {
    let idTipo = id_tipo_movimiento;

    if (!idTipo) {
      let tiposMov = [];
      try {
        tiposMov = await api.getTiposMovimiento().catch(() => []);
      } catch (e) {
        console.warn("No se pudieron obtener tipos de movimiento");
      }

      const tipoCompra = tiposMov.find(
        (t) =>
          t.nombre &&
          (t.nombre.toLowerCase().includes("compra") ||
            t.nombre.toLowerCase().includes("entrada") ||
            t.nombre === "Compra"),
      );

      if (tipoCompra) {
        idTipo = tipoCompra.id;
      } else {
        try {
          const nuevoTipo = await api.request("/tipos-movimiento", "POST", {
            nombre: "Compra",
            signo: 0,
            descripcion: "Entrada de mercancía por compra",
          });
          idTipo = nuevoTipo.id;
        } catch (e) {
          console.warn('No se pudo crear tipo de movimiento "Compra"');
          const tipoEntrada = tiposMov.find((t) => t.signo === 0);
          if (tipoEntrada) {
            idTipo = tipoEntrada.id;
          } else if (tiposMov.length > 0) {
            idTipo = tiposMov[0].id;
          } else {
            throw new Error(
              "No hay tipos de movimiento disponibles. Crea uno primero en Inventario > Tipos de Movimiento.",
            );
          }
        }
      }
    }

    if (!idTipo) throw new Error("No se pudo determinar el tipo de movimiento");

    const currentUser = getCurrentUser();
    const id_usuario = currentUser?.id || 1;

    const data = {
      id_usuario: parseInt(id_usuario),
      id_tipo_movimiento: parseInt(idTipo),
      id_ubicacion_origen: null,
      id_sububicacion_origen: null,
      id_ubicacion_destino: null,
      id_sububicacion_destino: null,
      tabla_referencia: "compra",
      id_referencia: null,
      referencia: `Compra de producto ID ${id_producto}`,
      observaciones:
        observacion || `Entrada por compra (${new Date().toLocaleString()})`,
      detalles: [
        {
          id_producto: parseInt(id_producto),
          cantidad: parseFloat(cantidad),
          costo_unitario: parseFloat(costo_unitario) || 0,
          precio_unitario: 0,
        },
      ],
    };

    const result = await api.request("/movimientos-inventario", "POST", data);
    return result;
  } catch (error) {
    console.error("❌ Error registrando movimiento de inventario:", error);
    throw error;
  }
}

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
            <div class="tab-pane fade show active" id="panel-compras" role="tabpanel">
                <div id="comprasResumenContainer" class="mb-3"></div>
                <div id="comprasTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status"></div>
                        <p class="mt-2 text-muted">Cargando compras...</p>
                    </div>
                </div>
            </div>

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

            <div class="tab-pane fade" id="panel-caja-chica" role="tabpanel">
                <div class="row mb-2 g-2 justify-content-end">
                    <div class="col-auto">
                        <input type="date" class="form-control form-control-sm" id="cajaChicaFechaDesde" onchange="skipCajaChica=0;cargarCajaChicaTabla()">
                    </div>
                    <div class="col-auto">
                        <input type="date" class="form-control form-control-sm" id="cajaChicaFechaHasta" onchange="skipCajaChica=0;cargarCajaChicaTabla()">
                    </div>
                </div>
                <div id="cajaChicaContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-success" role="status"></div>
                        <p class="mt-2 text-muted">Cargando movimientos de caja chica...</p>
                    </div>
                </div>
            </div>

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
                        <div class="row mb-2 g-2 justify-content-end">
                            <div class="col-auto">
                                <input type="date" class="form-control form-control-sm" id="gastosFechaDesde" onchange="skipGastos=0;cargarGastosTabla()">
                            </div>
                            <div class="col-auto">
                                <input type="date" class="form-control form-control-sm" id="gastosFechaHasta" onchange="skipGastos=0;cargarGastosTabla()">
                            </div>
                        </div>
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
      tiposGasto,
      tiposPago,
      productos,
      ubicaciones,
      usuarios,
    ] = await Promise.all([
      api.getCompras().catch(() => []),
      api.getProveedores().catch(() => []),
      api.getTiposProveedor().catch(() => []),
      api.getPedidos().catch(() => []),
      api.getTiposGasto().catch(() => []),
      api.getTiposPago().catch(() => []),
      api.getProductos().catch(() => []),
      api.request("/ubicaciones").catch(() => []),
      api.getUsuarios().catch(() => []),
    ]);

    comprasData = compras || [];
    proveedoresData = proveedores || [];
    tiposProveedorData = tiposProveedor || [];
    pedidosData = pedidos || [];
    tiposGastoData = tiposGasto || [];
    comprasTiposPagoData = tiposPago || [];
    window.usuariosData = usuarios || [];

    window.proveedoresData = proveedores || [];
    window.productosData = productos || [];
    window.ubicacionesData = ubicaciones || [];
    window.tiposPagoData = tiposPago || [];
    window.tiposProveedorData = tiposProveedor || [];
    window.tiposGastoData = tiposGasto || [];

    renderComprasTable(comprasData);
    cargarResumenCompras();
    renderProveedoresTab(proveedoresData);
    renderTiposProveedorTab(tiposProveedorData);
    renderPedidosTab(pedidosData);
    cargarCajaChicaTabla();
    cargarGastosTabla();
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

  const proveedoresOptions = (window.proveedoresData || [])
    .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
    .join("");

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Compras</h6>
            <button class="btn btn-info btn-sm" onclick="showCreateCompraModal()">
                <i class="fas fa-plus me-2"></i>Nueva Compra
            </button>
        </div>

        <div class="row g-2 mb-3">
            <div class="col-md-3">
                <label class="form-label small mb-0">Proveedor</label>
                <select class="form-select form-select-sm" id="filtroCompraProveedor">
                    <option value="">Todos</option>
                    ${proveedoresOptions}
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-0">Desde</label>
                <input type="date" class="form-control form-control-sm" id="filtroCompraDesde" />
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-0">Hasta</label>
                <input type="date" class="form-control form-control-sm" id="filtroCompraHasta" />
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-0">Estado</label>
                <select class="form-select form-select-sm" id="filtroCompraEstado">
                    <option value="">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Recibida">Recibida</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Pagada">Pagada</option>
                    <option value="Cancelada">Cancelada</option>
                </select>
            </div>
            <div class="col-md-3 d-flex align-items-end gap-1">
                <button class="btn btn-sm btn-primary w-100" onclick="filtrarCompras()">
                    <i class="fas fa-search me-1"></i>Filtrar
                </button>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="limpiarFiltrosCompras()">
                    <i class="fas fa-times me-1"></i>Limpiar
                </button>
            </div>
        </div>

        <div class="row g-2 mb-3">
            <div class="col-md-6">
                <label class="form-label small mb-0">Buscar por N° Factura</label>
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" id="filtroCompraBuscar"
                           placeholder="Número de factura..."
                           onkeyup="if(event.key==='Enter') filtrarCompras()" />
                    <button class="btn btn-outline-primary" onclick="filtrarCompras()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
        </div>

        <div id="comprasListadoContainer">
  `;

  if (!compras || compras.length === 0) {
    html += `
            <div class="text-center py-5">
                <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay compras registradas</p>
                <button class="btn btn-info btn-sm" onclick="showCreateCompraModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Compra
                </button>
            </div>
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
            ? "bg-success"
            : estado === "Parcial"
              ? "bg-warning text-dark"
              : estado === "Recibida"
                ? "bg-info"
                : estado === "Cancelada"
                  ? "bg-danger"
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
                    <button class="btn btn-sm btn-outline-info" onclick="verCompra(${c.id})" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="imprimirCompra(${c.id})" title="Imprimir reporte">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="registrarNotaEntrega(${c.id})" title="Nota de entrega">
                        <i class="fas fa-file-signature"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="registrarPagoCompra(${c.id})" title="Registrar pago">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                    ${
                      c.estado !== "Cancelada"
                        ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelarCompra(${c.id})" title="Cancelar compra">
                          <i class="fas fa-ban"></i>
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
            <small class="text-muted">Total: ${compras.length} compras</small>
        </div>
    </div>
    `;

  container.innerHTML = html;
}

async function cargarResumenCompras() {
  const container = document.getElementById("comprasResumenContainer");
  if (!container) return;

  try {
    const resumen = await api.request("/compras/resumen-totales");
    container.innerHTML = `
      <div class="row g-2">
        <div class="col-md-4">
          <div class="card border-info h-100">
            <div class="card-body py-2 text-center">
              <div class="text-muted small">Total en Compras</div>
              <div class="fw-bold fs-5 text-info">Q${Number(resumen.total_comprado || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-success h-100">
            <div class="card-body py-2 text-center">
              <div class="text-muted small">Total Pagado</div>
              <div class="fw-bold fs-5 text-success">Q${Number(resumen.total_pagado || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-danger h-100">
            <div class="card-body py-2 text-center">
              <div class="text-muted small">Saldo Pendiente por Pagar</div>
              <div class="fw-bold fs-5 text-danger">Q${Number(resumen.total_pendiente || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.warn("No se pudo cargar el resumen de compras:", error);
    container.innerHTML = "";
  }
}

// =============================================
// PANEL: PROVEEDORES
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

// =============================================
// PANEL: PEDIDOS (con filtros)
// =============================================

function renderPedidosTab(pedidos) {
  const container = document.getElementById("pedidosContainer");
  if (!container) return;

  const proveedoresOptions = (window.proveedoresData || [])
    .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
    .join("");

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Listado de Pedidos</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreatePedidoModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Pedido
            </button>
        </div>

        <div class="row g-2 mb-3">
            <div class="col-md-3">
                <label class="form-label small mb-0">Proveedor</label>
                <select class="form-select form-select-sm" id="filtroPedidoProveedor">
                    <option value="">Todos</option>
                    ${proveedoresOptions}
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-0">Desde</label>
                <input type="date" class="form-control form-control-sm" id="filtroPedidoDesde" />
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-0">Hasta</label>
                <input type="date" class="form-control form-control-sm" id="filtroPedidoHasta" />
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-0">Estado</label>
                <select class="form-select form-select-sm" id="filtroPedidoEstado">
                    <option value="">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cotizado">Cotizado</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Comprado">Comprado</option>
                    <option value="Cancelado">Cancelado</option>
                </select>
            </div>
            <div class="col-md-3 d-flex align-items-end gap-1">
                <button class="btn btn-sm btn-primary w-100" onclick="filtrarPedidos()">
                    <i class="fas fa-search me-1"></i>Filtrar
                </button>
                <button class="btn btn-sm btn-outline-secondary w-100" onclick="limpiarFiltrosPedidos()">
                    <i class="fas fa-times me-1"></i>Limpiar
                </button>
            </div>
        </div>

        <div id="pedidosListadoContainer">
  `;

  if (!pedidos || pedidos.length === 0) {
    html += `
            <div class="text-center py-5">
                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay pedidos registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreatePedidoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Pedido
                </button>
            </div>
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
                        <th>ID</th>
                        <th>Proveedor</th>
                        <th>Fecha</th>
                        <th>Productos</th>
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
    const numProductos = (p.detalles || []).length;

    html += `
            <tr>
                <td>${p.id}</td>
                <td>${nombreProveedor}</td>
                <td>${p.fecha ? new Date(p.fecha).toLocaleDateString() : "--"}</td>
                <td>${numProductos}</td>
                <td><span class="badge ${estadoBadge}">${estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verPedido(${p.id})" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="cambiarEstadoPedido(${p.id})" title="Cambiar estado">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="verTotalPedido(${p.id})" title="Verificar mínimo">
                        <i class="fas fa-calculator"></i>
                    </button>
                    ${
                      estado !== "Cancelado"
                        ? `
                    <button class="btn btn-sm btn-outline-danger" onclick="cancelarPedido(${p.id})" title="Cancelar pedido">
                        <i class="fas fa-ban"></i>
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
            <small class="text-muted">Total: ${pedidos.length} pedidos</small>
        </div>
    </div>
    `;

  container.innerHTML = html;
}

async function filtrarPedidos() {
  const id_proveedor = document.getElementById("filtroPedidoProveedor").value;
  const fecha_desde = document.getElementById("filtroPedidoDesde").value;
  const fecha_hasta = document.getElementById("filtroPedidoHasta").value;
  const estado = document.getElementById("filtroPedidoEstado").value;

  let url = "/pedidos?skip=0&limit=200";
  if (id_proveedor) url += `&id_proveedor=${id_proveedor}`;
  if (fecha_desde) url += `&fecha_desde=${fecha_desde}`;
  if (fecha_hasta) url += `&fecha_hasta=${fecha_hasta}`;
  if (estado) url += `&estado=${estado}`;

  try {
    const pedidos = await api.request(url);
    pedidosData = pedidos || [];
    renderPedidosTab(pedidosData);
  } catch (error) {
    showToast(error.message || "Error al filtrar pedidos", "error");
  }
}

function limpiarFiltrosPedidos() {
  const prov = document.getElementById("filtroPedidoProveedor");
  const desde = document.getElementById("filtroPedidoDesde");
  const hasta = document.getElementById("filtroPedidoHasta");
  const estado = document.getElementById("filtroPedidoEstado");
  if (prov) prov.value = "";
  if (desde) desde.value = "";
  if (hasta) hasta.value = "";
  if (estado) estado.value = "";
  filtrarPedidos();
}

async function filtrarCompras() {
  const id_proveedor = document.getElementById("filtroCompraProveedor").value;
  const fecha_desde = document.getElementById("filtroCompraDesde").value;
  const fecha_hasta = document.getElementById("filtroCompraHasta").value;
  const estado = document.getElementById("filtroCompraEstado").value;
  const buscar = document.getElementById("filtroCompraBuscar").value.trim();

  let url = "/compras?skip=0&limit=200";
  if (id_proveedor) url += `&id_proveedor=${id_proveedor}`;
  if (fecha_desde) url += `&fecha_desde=${fecha_desde}`;
  if (fecha_hasta) url += `&fecha_hasta=${fecha_hasta}`;
  if (estado) url += `&estado=${estado}`;
  if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;

  try {
    const compras = await api.request(url);
    comprasData = compras || [];
    renderComprasTable(comprasData);
  } catch (error) {
    showToast(error.message || "Error al filtrar compras", "error");
  }
}

function limpiarFiltrosCompras() {
  const prov = document.getElementById("filtroCompraProveedor");
  const desde = document.getElementById("filtroCompraDesde");
  const hasta = document.getElementById("filtroCompraHasta");
  const estado = document.getElementById("filtroCompraEstado");
  const buscar = document.getElementById("filtroCompraBuscar");
  if (prov) prov.value = "";
  if (desde) desde.value = "";
  if (hasta) hasta.value = "";
  if (estado) estado.value = "";
  if (buscar) buscar.value = "";
  filtrarCompras();
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
                <td>${(() => {
                  const u = (window.usuariosData || []).find(
                    (x) => x.id === m.id_usuario,
                  );
                  return u
                    ? u.nombre_usuario || u.nombre || u.username || u.email
                    : m.id_usuario || "--";
                })()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verCajaChica(${m.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarCajaChica(${m.id})" title="Eliminar">
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
            <small class="text-muted">Total: ${movimientos.length} movimientos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// PANEL: GASTOS
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
                <td>${(() => {
                  const u = (window.usuariosData || []).find(
                    (x) => x.id === g.id_usuario_registra,
                  );
                  return u
                    ? u.nombre_usuario || u.nombre || u.username || u.email
                    : g.id_usuario_registra || "--";
                })()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verGasto(${g.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto(${g.id})" title="Eliminar">
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
            <small class="text-muted">Total: ${gastos.length} gastos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// PAGINACIÓN (server-side) DE CAJA CHICA Y GASTOS
// =============================================
function _agregarControlesPaginacionCompras(
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

async function cargarCajaChicaTabla() {
  try {
    const desde = document.getElementById("cajaChicaFechaDesde")?.value;
    const hasta = document.getElementById("cajaChicaFechaHasta")?.value;
    let url = `/caja-chica?skip=${skipCajaChica}&limit=${LIMITE_CAJA_CHICA}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    const movimientos = await api.request(url);
    renderCajaChicaTab(movimientos);
    _agregarControlesPaginacionCompras(
      "cajaChicaContainer",
      `skipCajaChica=Math.max(0,skipCajaChica-${LIMITE_CAJA_CHICA});cargarCajaChicaTabla()`,
      `skipCajaChica+=${LIMITE_CAJA_CHICA};cargarCajaChicaTabla()`,
      skipCajaChica,
    );
  } catch (error) {
    document.getElementById("cajaChicaContainer").innerHTML =
      `<div class="alert alert-danger">${error.message}</div>`;
  }
}

async function cargarGastosTabla() {
  try {
    const desde = document.getElementById("gastosFechaDesde")?.value;
    const hasta = document.getElementById("gastosFechaHasta")?.value;
    let url = `/gastos?skip=${skipGastos}&limit=${LIMITE_GASTOS}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    const gastos = await api.request(url);
    renderGastosTab(gastos);
    _agregarControlesPaginacionCompras(
      "gastosContainer",
      `skipGastos=Math.max(0,skipGastos-${LIMITE_GASTOS});cargarGastosTabla()`,
      `skipGastos+=${LIMITE_GASTOS};cargarGastosTabla()`,
      skipGastos,
    );
  } catch (error) {
    document.getElementById("gastosContainer").innerHTML =
      `<div class="alert alert-danger">${error.message}</div>`;
  }
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
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  tiposCompra.forEach((t) => {
    const activo = t.activo !== 0;
    html += `
            <tr>
                <td>${t.id}</td>
                <td><strong>${t.nombre}</strong></td>
                <td><span class="badge ${t.para_ventas === 1 ? "bg-success" : "bg-secondary"}">${t.para_ventas === 1 ? "Sí" : "No"}</span></td>
                <td><span class="badge bg-success">Sí</span></td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleTipoPagoEstado(${t.id})" title="${activo ? "Inactivar" : "Activar"}">
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
            <small class="text-muted">Total: ${tiposCompra.length} tipos</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// FUNCIONES CRUD: PROVEEDORES
// =============================================
function showCreateProveedorModal() {
  const existingModal = document.getElementById("proveedorModal");
  if (existingModal) existingModal.remove();

  const html = `
        <div class="modal fade" id="proveedorModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable" style="max-height: 90vh;">
                <div class="modal-content" style="max-height: 90vh;">
                    <div class="modal-header bg-primary text-white sticky-top">
                        <h5 class="modal-title">
                            <i class="fas fa-building me-2"></i>Nuevo Proveedor
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="overflow-y: auto; max-height: calc(90vh - 130px);">
                        <form id="proveedorForm">
                            <input type="hidden" id="proveedorId" value="" />
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="proveedorNombre" required />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Contacto</label>
                                    <input type="text" class="form-control" id="proveedorContacto" />
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Teléfono</label>
                                    <input type="text" class="form-control" id="proveedorTelefono" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Email</label>
                                    <input type="email" class="form-control" id="proveedorEmail" />
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Dirección</label>
                                    <input type="text" class="form-control" id="proveedorDireccion" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">NIT</label>
                                    <input type="text" class="form-control" id="proveedorNit" />
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Código Proveedor</label>
                                    <input type="text" class="form-control" id="proveedorCodigo" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Días de Crédito</label>
                                    <input type="number" class="form-control" id="proveedorDiasCredito" placeholder="30" />
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Tipo de Proveedor</label>
                                    <select class="form-select" id="proveedorTipo">
                                        <option value="">Seleccionar tipo</option>
                                        ${(window.tiposProveedorData || []).map((t) => `<option value="${t.id}">${t.nombre}</option>`).join("")}
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Estado</label>
                                    <select class="form-select" id="proveedorActivo">
                                        <option value="1">Activo</option>
                                        <option value="0">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="fas fa-save me-2"></i>Guardar Proveedor
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);
  document
    .getElementById("proveedorForm")
    .addEventListener("submit", saveProveedor);
  new bootstrap.Modal(document.getElementById("proveedorModal")).show();
}

async function showEditProveedorModal(id) {
  const proveedor = (window.proveedoresData || []).find((p) => p.id === id);
  if (!proveedor) return showToast("Proveedor no encontrado", "error");

  const existingModal = document.getElementById("proveedorModal");
  if (existingModal) existingModal.remove();

  const html = `
        <div class="modal fade" id="proveedorModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-building me-2"></i>Editar Proveedor
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="proveedorForm">
                            <input type="hidden" id="proveedorId" value="${proveedor.id}" />

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="proveedorNombre" value="${proveedor.nombre || ""}" required />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Contacto</label>
                                    <input type="text" class="form-control" id="proveedorContacto" value="${proveedor.contacto || ""}" />
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Teléfono</label>
                                    <input type="text" class="form-control" id="proveedorTelefono" value="${proveedor.telefono || ""}" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Email</label>
                                    <input type="email" class="form-control" id="proveedorEmail" value="${proveedor.email || ""}" />
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Dirección</label>
                                    <input type="text" class="form-control" id="proveedorDireccion" value="${proveedor.direccion || ""}" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">NIT</label>
                                    <input type="text" class="form-control" id="proveedorNit" value="${proveedor.nit || ""}" />
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Código Proveedor</label>
                                    <input type="text" class="form-control" id="proveedorCodigo" value="${proveedor.codigo_proveedor || ""}" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Días de Crédito</label>
                                    <input type="number" class="form-control" id="proveedorDiasCredito" value="${proveedor.dias_credito || ""}" />
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Tipo de Proveedor</label>
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
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Estado</label>
                                    <select class="form-select" id="proveedorActivo">
                                        <option value="1" ${proveedor.activo !== 0 ? "selected" : ""}>Activo</option>
                                        <option value="0" ${proveedor.activo === 0 ? "selected" : ""}>Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100">
                                <i class="fas fa-save me-2"></i>Guardar Proveedor
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);
  document
    .getElementById("proveedorForm")
    .addEventListener("submit", saveProveedor);
  new bootstrap.Modal(document.getElementById("proveedorModal")).show();
}

async function saveProveedor(event) {
  event.preventDefault();

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

  if (!data.nombre) return showToast("El nombre es obligatorio", "error");

  try {
    if (id) {
      data.activo = parseInt(document.getElementById("proveedorActivo").value);
      await api.request(`/proveedores/${id}`, "PUT", data);
      showToast("Proveedor actualizado correctamente", "success");
    } else {
      await api.request("/proveedores", "POST", data);
      showToast("Proveedor creado correctamente", "success");
    }

    bootstrap.Modal.getInstance(
      document.getElementById("proveedorModal"),
    ).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al guardar proveedor", "error");
  }
}

async function toggleProveedorEstado(id) {
  const proveedor = (window.proveedoresData || []).find((p) => p.id === id);
  if (!proveedor) return;

  const accion = proveedor.activo !== 0 ? "inactivar" : "reactivar";
  if (
    !confirm(
      `¿${accion === "inactivar" ? "Inactivar" : "Reactivar"} el proveedor "${proveedor.nombre}"?`,
    )
  )
    return;

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

// =============================================
// FUNCIONES CRUD: TIPOS DE PROVEEDOR
// =============================================

function showCreateTipoProveedorModal() {
  crearModalTipoProveedor();
  document.getElementById("tipoProveedorModalTitle").textContent =
    "Nuevo Tipo de Proveedor";
  document.getElementById("tipoProveedorForm").reset();
  document.getElementById("tipoProveedorId").value = "";
  document.getElementById("tipoProveedorActivo").value = "1";
  new bootstrap.Modal(document.getElementById("tipoProveedorModal")).show();
}

function showEditTipoProveedorModal(id) {
  const tipo = (window.tiposProveedorData || []).find((t) => t.id === id);
  if (!tipo) return showToast("Tipo no encontrado", "error");

  crearModalTipoProveedor();
  document.getElementById("tipoProveedorModalTitle").textContent =
    "Editar Tipo de Proveedor";
  document.getElementById("tipoProveedorId").value = tipo.id;
  document.getElementById("tipoProveedorNombre").value = tipo.nombre || "";
  document.getElementById("tipoProveedorDescripcion").value =
    tipo.descripcion || "";
  document.getElementById("tipoProveedorActivo").value =
    tipo.activo !== 0 ? "1" : "0";
  new bootstrap.Modal(document.getElementById("tipoProveedorModal")).show();
}

async function saveTipoProveedor(event) {
  event.preventDefault();

  const id = document.getElementById("tipoProveedorId").value;
  const data = {
    nombre: document.getElementById("tipoProveedorNombre").value.trim(),
    descripcion:
      document.getElementById("tipoProveedorDescripcion").value.trim() || null,
  };

  if (!data.nombre) return showToast("El nombre es obligatorio", "error");

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

  const nuevo = tipo.activo === 0 ? 1 : 0;
  const accion = nuevo === 1 ? "activar" : "inactivar";
  if (!confirm(`¿Está seguro de ${accion} el tipo "${tipo.nombre}"?`)) return;

  try {
    await api.request(`/tipos-proveedor/${id}`, "PUT", {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      activo: nuevo,
    });
    showToast(
      `Tipo ${accion === "activar" ? "activado" : "inactivado"}`,
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
  document
    .getElementById("tipoProveedorForm")
    .addEventListener("submit", saveTipoProveedor);
}

// =============================================
// FUNCIONES CRUD: PEDIDOS
// =============================================

function showCreatePedidoModal() {
  pedidoDetallesTemp = [];

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
      <div class="modal-dialog modal-lg modal-dialog-scrollable" style="max-height:90vh;">
        <div class="modal-content" style="max-height:90vh;">
          <div class="modal-header bg-primary text-white sticky-top">
            <h5 class="modal-title"><i class="fas fa-clipboard-list me-2"></i>Nuevo Pedido</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="overflow-y:auto; max-height:calc(90vh - 130px);">
            <form id="pedidoForm">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Proveedor <span class="text-danger">*</span></label>
                  <select class="form-select" id="pedidoProveedor" required>
                    <option value="">Seleccionar proveedor</option>
                    ${options}
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Observaciones</label>
                <textarea class="form-control" id="pedidoObservaciones" rows="2"></textarea>
              </div>

              <hr />
              <h6 class="fw-bold"><i class="fas fa-boxes me-1"></i>Productos del pedido</h6>

              <div class="row g-2 align-items-end mb-2" id="pedidoDetalleRow">
                <div class="col-md-4">
                  <label class="form-label small mb-0">Producto</label>
                  <select class="form-select form-select-sm pedido-detalle-producto" onchange="actualizarCostoPedido()"></select>
                </div>
                <div class="col-md-2">
                  <label class="form-label small mb-0">Cant. pedida</label>
                  <input type="number" step="0.01" min="0.01" class="form-control form-control-sm pedido-detalle-cantidad" value="1" oninput="actualizarSubtotalPedido()" />
                </div>
                <div class="col-md-2">
                  <label class="form-label small mb-0">Costo est. (Q)</label>
                  <input type="number" step="0.01" min="0" class="form-control form-control-sm pedido-detalle-costo" value="0" oninput="actualizarSubtotalPedido()" />
                </div>
                <div class="col-md-2">
                  <label class="form-label small mb-0">Subtotal</label>
                  <input type="text" class="form-control form-control-sm pedido-detalle-subtotal" value="Q0.00" readonly />
                </div>
                <div class="col-md-1">
                  <button type="button" class="btn btn-sm btn-primary w-100" onclick="agregarDetallePedido(event)">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>

              <div id="pedidoDetallesList" class="mb-3"></div>

              <div class="alert alert-info py-2 d-flex justify-content-between align-items-center mb-2">
                <div>
                  <i class="fas fa-info-circle me-1"></i>
                  Total: <strong id="pedidoTotalPreview">Q0.00</strong>
                </div>
                <div id="pedidoMinimoPreview">
                  <span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i>Faltan Q500.00</span>
                </div>
              </div>

              <button type="submit" class="btn btn-primary w-100 mt-2">
                <i class="fas fa-save me-2"></i>Guardar Pedido
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", html);
  document
    .getElementById("pedidoForm")
    .addEventListener("submit", savePedidoCompleto);
  llenarSelectProductoPedido();
  renderDetallesPedido();
  actualizarTotalesPedidoPreview();
  new bootstrap.Modal(document.getElementById("pedidoModal")).show();
}

function llenarSelectProductoPedido() {
  const select = document.querySelector(".pedido-detalle-producto");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar producto</option>';
  (window.productosData || []).forEach((p) => {
    if (p.activo !== 0) {
      select.innerHTML += `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`;
    }
  });
}

function actualizarCostoPedido() {
  const row = document.getElementById("pedidoDetalleRow");
  if (!row) return;
  const id_producto = parseInt(
    row.querySelector(".pedido-detalle-producto").value,
  );
  if (!id_producto) return;

  const producto = (window.productosData || []).find(
    (p) => p.id === id_producto,
  );
  if (!producto) return;

  const costo =
    producto.precio_compra || producto.costo || producto.precio_costo || 0;
  const costoInput = row.querySelector(".pedido-detalle-costo");
  if (costoInput && (!costoInput.value || parseFloat(costoInput.value) === 0)) {
    costoInput.value = costo;
  }

  actualizarSubtotalPedido();
}

function actualizarSubtotalPedido() {
  const row = document.getElementById("pedidoDetalleRow");
  if (!row) return;
  const cantidad =
    parseFloat(row.querySelector(".pedido-detalle-cantidad").value) || 0;
  const costo =
    parseFloat(row.querySelector(".pedido-detalle-costo").value) || 0;
  const subtotalEl = row.querySelector(".pedido-detalle-subtotal");
  if (subtotalEl) subtotalEl.value = `Q${(cantidad * costo).toFixed(2)}`;
}

function actualizarTotalesPedidoPreview() {
  let total = 0;
  pedidoDetallesTemp.forEach((d) => {
    total += (d.cantidad_pedida || 0) * (d.costo_estimado || 0);
  });

  const totalEl = document.getElementById("pedidoTotalPreview");
  if (totalEl) totalEl.textContent = `Q${total.toFixed(2)}`;

  const minEl = document.getElementById("pedidoMinimoPreview");
  if (minEl) {
    if (total >= 500) {
      minEl.innerHTML =
        '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Alcanza mínimo Q500</span>';
    } else {
      minEl.innerHTML = `<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i>Faltan Q${(500 - total).toFixed(2)}</span>`;
    }
  }
}

function agregarDetallePedido(event) {
  if (event) event.preventDefault();

  const row = document.getElementById("pedidoDetalleRow");
  const id_producto = parseInt(
    row.querySelector(".pedido-detalle-producto").value,
  );
  const cantidad_pedida =
    parseFloat(row.querySelector(".pedido-detalle-cantidad").value) || 0;
  const costo_estimado =
    parseFloat(row.querySelector(".pedido-detalle-costo").value) || 0;

  if (!id_producto) return showToast("Selecciona un producto", "error");
  if (cantidad_pedida <= 0)
    return showToast("La cantidad debe ser mayor a 0", "error");
  if (costo_estimado <= 0)
    return showToast("El costo debe ser mayor a 0", "error");

  const producto = (window.productosData || []).find(
    (p) => p.id === id_producto,
  );

  pedidoDetallesTemp.push({
    id_producto,
    cantidad_pedida,
    cantidad_sugerida: 0,
    costo_estimado,
    observaciones: null,
    producto,
  });

  renderDetallesPedido();
  actualizarTotalesPedidoPreview();

  row.querySelector(".pedido-detalle-producto").value = "";
  row.querySelector(".pedido-detalle-cantidad").value = 1;
  row.querySelector(".pedido-detalle-costo").value = 0;
  row.querySelector(".pedido-detalle-subtotal").value = "Q0.00";
}

function renderDetallesPedido() {
  const container = document.getElementById("pedidoDetallesList");
  if (!container) return;
  if (pedidoDetallesTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay productos agregados</p>';
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="table table-sm table-hover">
        <thead class="table-light">
          <tr>
            <th>Producto</th>
            <th class="text-end">Cant.</th>
            <th class="text-end" style="width:120px">Costo est.</th>
            <th class="text-end">Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
  `;

  let total = 0;
  pedidoDetallesTemp.forEach((d, i) => {
    const subtotal = (d.cantidad_pedida || 0) * (d.costo_estimado || 0);
    total += subtotal;
    html += `
      <tr>
        <td>${d.producto ? d.producto.nombre : "Producto #" + d.id_producto}</td>
        <td class="text-end">${d.cantidad_pedida}</td>
        <td class="text-end">
          <input type="number" step="0.01" min="0"
                 class="form-control form-control-sm text-end"
                 value="${d.costo_estimado}"
                 onchange="editarCostoDetallePedido(${i}, this.value)" />
        </td>
        <td class="text-end fw-bold">Q${subtotal.toFixed(2)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarDetallePedido(${i})">
            <i class="fas fa-times"></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
        <tfoot>
          <tr class="table-light">
            <td colspan="3" class="text-end fw-bold">TOTAL:</td>
            <td class="text-end fw-bold">Q${total.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
  container.innerHTML = html;
}

function editarCostoDetallePedido(index, nuevoCosto) {
  const costo = parseFloat(nuevoCosto) || 0;
  if (costo <= 0) {
    showToast("El costo debe ser mayor a 0", "error");
    renderDetallesPedido();
    return;
  }
  pedidoDetallesTemp[index].costo_estimado = costo;
  renderDetallesPedido();
  actualizarTotalesPedidoPreview();
}

function eliminarDetallePedido(index) {
  pedidoDetallesTemp.splice(index, 1);
  renderDetallesPedido();
  actualizarTotalesPedidoPreview();
}

async function savePedidoCompleto(event) {
  event.preventDefault();

  const id_proveedor = parseInt(
    document.getElementById("pedidoProveedor").value,
  );
  const observaciones =
    document.getElementById("pedidoObservaciones").value.trim() || null;

  if (!id_proveedor) return showToast("Selecciona un proveedor", "error");
  if (pedidoDetallesTemp.length === 0)
    return showToast("Agrega al menos un producto", "error");

  const total = pedidoDetallesTemp.reduce(
    (s, d) => s + (d.cantidad_pedida || 0) * (d.costo_estimado || 0),
    0,
  );
  if (total < 500) {
    const ok = confirm(
      `El pedido suma Q${total.toFixed(2)}, no alcanza el mínimo de Q500.\n\n¿Continuar de todas formas?\n(El pedido quedará como Pendiente)`,
    );
    if (!ok) return;
  }

  const btn = event.target.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
  }

  let pedidoCreado = null;
  let detallesOk = 0;
  let errores = [];

  try {
    pedidoCreado = await api.request("/pedidos", "POST", {
      id_usuario: getCurrentUser()?.id || 1,
      id_proveedor,
      observaciones,
    });

    for (const d of pedidoDetallesTemp) {
      try {
        await api.request(`/pedidos/${pedidoCreado.id}/detalles`, "POST", {
          id_producto: d.id_producto,
          cantidad_pedida: d.cantidad_pedida,
          cantidad_sugerida: d.cantidad_sugerida || 0,
          observaciones: d.observaciones,
          precio_compra: d.costo_estimado, // OJO: solo si backend lo acepta
        });
        detallesOk++;
      } catch (err) {
        errores.push(
          `• ${d.producto?.nombre || "Producto #" + d.id_producto}: ${err.message}`,
        );
      }
    }

    if (errores.length === 0) {
      showToast(
        `Pedido #${pedidoCreado.id} creado con ${detallesOk} productos (Q${total.toFixed(2)})`,
        "success",
      );
    } else {
      showToast(
        `Pedido #${pedidoCreado.id} creado, pero ${errores.length} producto(s) fallaron:\n${errores.join("\n")}`,
        "warning",
      );
    }

    bootstrap.Modal.getInstance(document.getElementById("pedidoModal")).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al crear pedido", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Pedido';
    }
  }
}

async function verPedido(id) {
  try {
    const [pedido, totalData] = await Promise.all([
      api.request(`/pedidos/${id}`),
      api
        .request(`/pedidos/${id}/total`)
        .catch(() => ({ total: 0, alcanza_minimo: false })),
    ]);

    if (!pedido) return showToast("Pedido no encontrado", "error");

    const proveedor = (window.proveedoresData || []).find(
      (p) => p.id === pedido.id_proveedor,
    );
    const nombreProveedor = proveedor ? proveedor.nombre : "--";

    let detallesHtml = (pedido.detalles || [])
      .map((d) => {
        const producto = (window.productosData || []).find(
          (p) => p.id === d.id_producto,
        );
        const precio = d.precio_compra || d.costo_estimado || 0;
        const subtotal = (d.cantidad_pedida || 0) * precio;
        return `
                    <tr>
                        <td>${producto ? producto.nombre : "--"}</td>
                        <td class="text-end">${d.cantidad_pedida || 0}</td>
                        <td class="text-end">Q${Number(precio).toFixed(2)}</td>
                        <td class="text-end">Q${subtotal.toFixed(2)}</td>
                    </tr>
                `;
      })
      .join("");

    const total = totalData.total || 0;
    const minimoBadge = totalData.alcanza_minimo
      ? '<span class="badge bg-success">Alcanza mínimo Q500</span>'
      : `<span class="badge bg-warning text-dark">Faltan Q${(500 - total).toFixed(2)}</span>`;

    const estadoBadge =
      pedido.estado === "Cancelado"
        ? "bg-danger"
        : pedido.estado === "Comprado"
          ? "bg-primary"
          : pedido.estado === "Aprobado"
            ? "bg-info"
            : pedido.estado === "Cotizado"
              ? "bg-warning"
              : "bg-secondary";

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Pedido #${pedido.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Proveedor:</strong> ${nombreProveedor}</div>
                    <div class="col-md-6"><strong>Fecha:</strong> ${pedido.fecha ? new Date(pedido.fecha).toLocaleString() : "--"}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Estado:</strong> <span class="badge ${estadoBadge}">${pedido.estado || "Pendiente"}</span></div>
                    <div class="col-md-6"><strong>Total:</strong> Q${total.toFixed(2)} ${minimoBadge}</div>
                </div>
                ${pedido.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${pedido.observaciones}</div>` : ""}

                <h6 class="fw-bold mt-3">Detalles</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-end">Cantidad</th>
                                <th class="text-end">Costo est.</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}</tbody>
                        <tfoot>
                            <tr class="table-light fw-bold">
                                <td colspan="3" class="text-end">TOTAL:</td>
                                <td class="text-end">Q${total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
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
    new bootstrap.Modal(modalDiv).show();
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
    if (!result) return showToast("Error al calcular total", "error");

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
    return showToast(`Estado inválido. Use: ${estados.join(", ")}`, "error");
  }

  const forzar = confirm(
    "¿Forzar aprobación aunque no alcance el mínimo de Q500?",
  );

  try {
    const url = `/pedidos/${id}/estado?nuevo_estado=${encodeURIComponent(estadoActual)}&forzar=${forzar}`;
    await api.request(url, "PATCH");
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
  if (ubicaciones.length === 0)
    return showToast("No hay ubicaciones disponibles", "warning");

  const ubicacionOptions = ubicaciones
    .map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`)
    .join("");

  const html = `
        <div class="modal fade" id="cajaChicaModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable" style="max-height: 90vh;">
                <div class="modal-content" style="max-height: 90vh;">
                    <div class="modal-header bg-success text-white sticky-top">
                        <h5 class="modal-title">
                            <i class="fas fa-coins me-2"></i>Nuevo Movimiento de Caja Chica
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="overflow-y: auto; max-height: calc(90vh - 130px);">
                        <form id="cajaChicaForm">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Ubicación <span class="text-danger">*</span></label>
                                    <select class="form-select" id="cajaChicaUbicacion" required>
                                        <option value="">Seleccionar ubicación</option>
                                        ${ubicacionOptions}
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Tipo <span class="text-danger">*</span></label>
                                    <select class="form-select" id="cajaChicaTipo" required>
                                        <option value="ingreso">Ingreso</option>
                                        <option value="egreso">Egreso</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Monto <span class="text-danger">*</span></label>
                                    <input type="number" step="0.01" class="form-control" id="cajaChicaMonto" required placeholder="0.00" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Concepto <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="cajaChicaConcepto" required />
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Referencia</label>
                                    <input type="text" class="form-control" id="cajaChicaReferencia" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Observaciones</label>
                                    <textarea class="form-control" id="cajaChicaObservaciones" rows="2"></textarea>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-success w-100">
                                <i class="fas fa-save me-2"></i>Registrar Movimiento
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);
  document
    .getElementById("cajaChicaForm")
    .addEventListener("submit", saveCajaChica);
  new bootstrap.Modal(document.getElementById("cajaChicaModal")).show();
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

  if (!data.id_ubicacion) return showToast("Selecciona una ubicación", "error");
  if (!data.concepto) return showToast("El concepto es obligatorio", "error");
  if (data.monto <= 0) return showToast("El monto debe ser mayor a 0", "error");

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
    if (!movimiento) return showToast("Movimiento no encontrado", "error");

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
                    <div class="col-md-6"><strong>Ubicación:</strong> ${nombreUbicacion}</div>
                    <div class="col-md-6"><strong>Fecha:</strong> ${movimiento.fecha ? new Date(movimiento.fecha).toLocaleString() : "--"}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Tipo:</strong> <span class="badge ${movimiento.tipo === "ingreso" ? "bg-success" : "bg-danger"}">${movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"}</span></div>
                    <div class="col-md-6"><strong>Monto:</strong> Q${movimiento.monto || 0}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Saldo:</strong> Q${movimiento.saldo || 0}</div>
                    <div class="col-md-6"><strong>Usuario:</strong> ${movimiento.id_usuario || "--"}</div>
                </div>
                <div class="mb-3"><strong>Concepto:</strong> ${movimiento.concepto || "--"}</div>
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
    new bootstrap.Modal(modalDiv).show();
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
  if (tiposGasto.length === 0)
    return showToast("No hay tipos de gasto. Crea uno primero.", "warning");

  const ubicaciones = (window.ubicacionesData || []).filter(
    (u) => u.activo !== 0,
  );
  if (ubicaciones.length === 0)
    return showToast("No hay ubicaciones disponibles", "warning");

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
                                <select class="form-select" id="gasto-tipo" required>
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
  document.getElementById("gastoForm").addEventListener("submit", saveGasto);
  new bootstrap.Modal(document.getElementById("gastoModal")).show();
}

async function saveGasto(event) {
  event.preventDefault();

  const data = {
    id_tipo_gasto: parseInt(document.getElementById("gasto-tipo").value),
    id_ubicacion: parseInt(document.getElementById("gastoUbicacion").value),
    concepto: document.getElementById("gastoConcepto").value.trim(),
    monto: parseFloat(document.getElementById("gastoMonto").value) || 0,
    id_usuario_registra: getCurrentUser()?.id || 1,
    observaciones:
      document.getElementById("gastoObservaciones").value.trim() || null,
  };

  if (!data.id_tipo_gasto)
    return showToast("Selecciona un tipo de gasto", "error");
  if (!data.id_ubicacion) return showToast("Selecciona una ubicación", "error");
  if (!data.concepto) return showToast("El concepto es obligatorio", "error");
  if (data.monto <= 0) return showToast("El monto debe ser mayor a 0", "error");

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
    if (!gasto) return showToast("Gasto no encontrado", "error");

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
                    <div class="col-md-6"><strong>Tipo:</strong> ${nombreTipo}</div>
                    <div class="col-md-6"><strong>Ubicación:</strong> ${nombreUbicacion}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Fecha:</strong> ${gasto.fecha ? new Date(gasto.fecha).toLocaleString() : "--"}</div>
                    <div class="col-md-6"><strong>Monto:</strong> Q${gasto.monto || 0}</div>
                </div>
                <div class="mb-3"><strong>Concepto:</strong> ${gasto.concepto || "--"}</div>
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
    new bootstrap.Modal(modalDiv).show();
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
  crearModalTipoGasto();
  document.getElementById("tipoGastoModalTitle").textContent =
    "Nuevo Tipo de Gasto";
  document.getElementById("tipoGastoForm").reset();
  document.getElementById("tipoGastoId").value = "";
  document.getElementById("tipoGastoActivo").value = "1";
  document.getElementById("tipoGastoEsFijo").value = "0";
  new bootstrap.Modal(document.getElementById("tipoGastoModal")).show();
}

function showEditTipoGastoModal(id) {
  const tipo = (window.tiposGastoData || []).find((t) => t.id === id);
  if (!tipo) return showToast("Tipo no encontrado", "error");

  crearModalTipoGasto();
  document.getElementById("tipoGastoModalTitle").textContent =
    "Editar Tipo de Gasto";
  document.getElementById("tipoGastoId").value = tipo.id;
  document.getElementById("tipoGastoNombre").value = tipo.nombre || "";
  document.getElementById("tipoGastoDescripcion").value =
    tipo.descripcion || "";
  document.getElementById("tipoGastoEsFijo").value = tipo.es_fijo || 0;
  document.getElementById("tipoGastoActivo").value =
    tipo.activo !== 0 ? "1" : "0";
  new bootstrap.Modal(document.getElementById("tipoGastoModal")).show();
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

  if (!data.nombre) return showToast("El nombre es obligatorio", "error");

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
  if (
    !confirm(
      `¿${tipo.activo !== 0 ? "Inactivar" : "Activar"} el tipo "${tipo.nombre}"?`,
    )
  )
    return;

  try {
    await api.request(`/tipos-gasto/${id}`, "PUT", {
      ...tipo,
      activo: tipo.activo !== 0 ? 0 : 1,
    });
    showToast("Estado actualizado", "success");
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
  document
    .getElementById("tipoGastoForm")
    .addEventListener("submit", saveTipoGasto);
}

// =============================================
// FUNCIONES CRUD: TIPOS DE PAGO (COMPRAS)
// =============================================

function showCreateTipoPagoCompraModal() {
  crearModalTipoPago();
  document.getElementById("tipoPagoModalTitle").textContent =
    "Nuevo Tipo de Pago para Compras";
  document.getElementById("tipoPagoForm").reset();
  document.getElementById("tipoPagoCompras").value = "1";
  document.getElementById("tipoPagoVentas").value = "0";
  new bootstrap.Modal(document.getElementById("tipoPagoModal")).show();
}

async function saveTipoPagoCompra(event) {
  event.preventDefault();

  const nombre = document.getElementById("tipoPagoNombre").value.trim();
  const para_ventas = parseInt(document.getElementById("tipoPagoVentas").value);
  const para_compras = parseInt(
    document.getElementById("tipoPagoCompras").value,
  );

  if (!nombre) return showToast("El nombre es obligatorio", "error");

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
  document
    .getElementById("tipoPagoForm")
    .addEventListener("submit", saveTipoPagoCompra);
}

// =============================================
// FUNCIONES CRUD: COMPRAS
// =============================================

function showCreateCompraModal() {
  compraDetallesTemp = [];

  const modal = document.getElementById("compraModal");
  const form = document.getElementById("compraForm");

  if (!modal || !form) {
    return showToast("No se encontró el modal de compras en el HTML.", "error");
  }

  document.getElementById("compraModalTitle").textContent = "Nueva Compra";
  form.reset();
  document.getElementById("compraId").value = "";
  const montoExentoEl = document.getElementById("compraMontoExento");
  if (montoExentoEl) montoExentoEl.value = 0;
  document.getElementById("compraObservaciones").value = "";

  const numPedidoEl = document.getElementById("compraNumeroPedido");
  if (numPedidoEl) numPedidoEl.value = "";
  const infoPedidoEl = document.getElementById("compraPedidoInfo");
  if (infoPedidoEl) infoPedidoEl.textContent = "";

  llenarSelectProveedor();
  llenarSelectProductoCompra();

  const lista = document.getElementById("compraDetallesList");
  if (lista) lista.innerHTML = "";

  new bootstrap.Modal(modal).show();
}

async function cargarPedidoEnCompra() {
  const el = document.getElementById("compraNumeroPedido");
  if (!el) return showToast("No existe el campo Nº Pedido", "error");

  const idPedido = parseInt(el.value);
  if (!idPedido) return showToast("Ingresa un número de pedido", "error");

  try {
    const pedido = await api.request(`/pedidos/${idPedido}`);
    if (!pedido) return showToast("Pedido no encontrado", "error");

    if (pedido.estado === "Cancelado") {
      return showToast("Ese pedido está cancelado", "error");
    }
    if (pedido.estado === "Comprado") {
      return showToast(
        "Ese pedido ya fue cargado en una compra anterior",
        "warning",
      );
    }

    const selProv = document.getElementById("compraProveedor");
    if (selProv) selProv.value = pedido.id_proveedor || "";

    compraDetallesTemp = (pedido.detalles || []).map((d) => {
      const producto = (window.productosData || []).find(
        (p) => p.id === d.id_producto,
      );
      const costoEstimado = d.precio_compra || d.costo_estimado || 0;
      const cantidad = Math.max(
        1,
        Math.round(parseFloat(d.cantidad_pedida) || 1),
      );
      return {
        id_producto: d.id_producto,
        cantidad_comprada: cantidad,
        cantidad_unidades: cantidad,
        costo_unitario: costoEstimado,
        producto: producto || { nombre: `Producto #${d.id_producto}` },
      };
    });
    renderDetallesCompra();

    const info = document.getElementById("compraPedidoInfo");
    if (info) {
      info.textContent = `Pedido #${pedido.id} cargado (${compraDetallesTemp.length} productos). Revisa costos.`;
    }

    // Cambiar estado del pedido a "Comprado"
    try {
      await api.request(
        `/pedidos/${idPedido}/estado?nuevo_estado=Comprado&forzar=true`,
        "PATCH",
      );
      showToast(`Pedido #${idPedido} marcado como Comprado`, "success");
    } catch (err) {
      showToast(
        `Pedido cargado, pero no se pudo cambiar su estado: ${err.message}`,
        "warning",
      );
    }
  } catch (error) {
    showToast(error.message || "Error al cargar pedido", "error");
  }
}

function llenarSelectProveedor() {
  const select = document.getElementById("compraProveedor");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar proveedor</option>';
  (window.proveedoresData || []).forEach((p) => {
    if (p.activo !== 0) {
      select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
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
  if (!row) return;

  const productSelect = row.querySelector(".compra-detalle-producto");
  const cantidadInput = row.querySelector(".compra-detalle-cantidad");
  const costoInput = row.querySelector(".compra-detalle-costo");

  const id_producto = parseInt(productSelect.value);
  const cantidad = parseInt(cantidadInput.value) || 1;
  if (cantidad <= 0) {
    showToast("La cantidad debe ser mayor a 0", "error");
    return;
  }
  const costo_unitario = parseFloat(costoInput.value) || 0;

  if (!id_producto) return showToast("Selecciona un producto", "error");

  const producto = (window.productosData || []).find(
    (p) => p.id === id_producto,
  );
  if (!producto) return showToast("Producto no encontrado", "error");

  compraDetallesTemp.push({
    id_producto,
    cantidad_comprada: cantidad,
    cantidad_unidades: cantidad,
    costo_unitario,
    producto,
  });

  renderDetallesCompra();
  cantidadInput.value = 1;
  costoInput.value = 0;
  productSelect.value = "";
}

function renderDetallesCompra() {
  const container = document.getElementById("compraDetallesList");
  if (!container) return;

  if (compraDetallesTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay productos agregados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  let totalFactura = 0;
  compraDetallesTemp.forEach((d, index) => {
    const subtotal = d.cantidad_comprada * d.costo_unitario;
    totalFactura += subtotal;
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

  // IVA incluido (Guatemala): se extrae del gravado
  const montoExentoEl = document.getElementById("compraMontoExento");
  let exento = parseFloat(montoExentoEl?.value) || 0;
  if (exento < 0) exento = 0;
  if (exento > totalFactura) exento = totalFactura;

  const gravado = totalFactura - exento;
  const montoIva = gravado > 0 ? gravado * (12 / 112) : 0;
  const subtotalSinIva = totalFactura - montoIva;

  html += `
        <li class="list-group-item">
            <div class="d-flex justify-content-between">
                <span>Subtotal (sin IVA):</span>
                <span>Q${subtotalSinIva.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span>Exento:</span>
                <span>Q${exento.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span>IVA (12% incluido):</span>
                <span>Q${montoIva.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold border-top pt-2 mt-2">
                <span>TOTAL FACTURA:</span>
                <span>Q${totalFactura.toFixed(2)}</span>
            </div>
        </li>
    </ul>`;
  container.innerHTML = html;
}

function eliminarDetalleCompra(index) {
  compraDetallesTemp.splice(index, 1);
  renderDetallesCompra();
}

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "compraMontoExento") {
      renderDetallesCompra();
    }
  });
});

// =============================================
// SAVE COMPRA - ACTUALIZA INVENTARIO
// =============================================
async function saveCompra(event) {
  event.preventDefault();

  const id_proveedor = parseInt(
    document.getElementById("compraProveedor").value,
  );
  const numero_factura = document.getElementById("compraFactura").value || null;
  const monto_exento =
    parseFloat(document.getElementById("compraMontoExento").value) || 0;
  const observaciones =
    document.getElementById("compraObservaciones").value || null;
  const id_usuario_registra = getCurrentUser()?.id || 1;
  const id_pedido =
    parseInt(document.getElementById("compraNumeroPedido")?.value) || null;

  if (!id_proveedor) return showToast("Selecciona un proveedor", "error");
  if (compraDetallesTemp.length === 0)
    return showToast("Agrega al menos un producto", "error");

  // ✅ UBICACIÓN DESDE CONFIGURACIÓN (igual que ventas)
  let id_ubicacion_destino = null;
  try {
    const config = await api.request("/configuracion").catch(() => ({}));
    id_ubicacion_destino = config.id_ubicacion || null;
    if (!id_ubicacion_destino) {
      showToast(
        "No hay ubicación configurada. Contacta al administrador.",
        "error",
      );
      return;
    }
  } catch (error) {
    showToast("Error al obtener configuración", "error");
    return;
  }

  // Validar que todas las cantidades sean enteras positivas
  for (const d of compraDetallesTemp) {
    if (!Number.isInteger(d.cantidad_comprada) || d.cantidad_comprada <= 0) {
      return showToast(
        `Cantidad inválida en "${d.producto.nombre}". Debe ser un entero mayor a 0.`,
        "error",
      );
    }
  }

  const data = {
    id_proveedor,
    id_ubicacion_destino,
    numero_factura,
    id_usuario_registra,
    iva: 12,
    monto_exento,
    observaciones,
    id_pedido,
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

    let movimientosRegistrados = 0;
    let erroresMovimientos = [];

    for (const detalle of compraDetallesTemp) {
      try {
        await registrarMovimientoInventario(
          detalle.id_producto,
          detalle.cantidad_comprada,
          null,
          `Compra #${result.id} - ${detalle.producto.nombre}`,
          detalle.costo_unitario,
        );
        movimientosRegistrados++;
      } catch (error) {
        erroresMovimientos.push({
          producto: detalle.producto.nombre,
          error: error.message,
        });
      }
    }

    if (movimientosRegistrados > 0) {
      showToast(
        `✅ Inventario actualizado: ${movimientosRegistrados} productos`,
        "success",
      );
    }
    if (erroresMovimientos.length > 0) {
      const mensaje = erroresMovimientos
        .map((e) => `• ${e.producto}: ${e.error}`)
        .join("\n");
      showToast(
        `⚠️ Algunos productos no actualizaron inventario:\n${mensaje}`,
        "warning",
      );
    }

    bootstrap.Modal.getInstance(document.getElementById("compraModal")).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al crear compra", "error");
  }
}

// =============================================
// VER COMPRA
// =============================================

async function verCompra(id) {
  try {
    const compra = await api.request(`/compras/${id}`);
    if (!compra) return showToast("Compra no encontrada", "error");

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
                        <td class="text-end">${d.cantidad_comprada || 0}</td>
                        <td class="text-end">Q${d.costo_unitario || 0}</td>
                        <td class="text-end">Q${d.subtotal || 0}</td>
                    </tr>
                `;
      })
      .join("");

    // --- Pagos ---
const pagosHtml =
  (compra.pagos || []).length === 0
    ? '<tr><td colspan="5" class="text-center">Sin pagos registrados</td></tr>'
    : (compra.pagos || [])
        .map((p) => {
          const tipo = (window.tiposPagoData || []).find(
            (t) => t.id === p.id_tipo_pago,
          );
          const anulado = p.anulado === 1;
          return `
        <tr class="${anulado ? "text-muted" : ""}">
          <td>${tipo ? tipo.nombre : "--"} ${anulado ? '<span class="badge bg-secondary ms-1">Anulado</span>' : ""}</td>
          <td class="text-end" style="${anulado ? "text-decoration: line-through;" : ""}">Q${p.monto || 0}</td>
          <td>${p.referencia || "--"}</td>
          <td>${p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : "--"}</td>
          <td class="text-end">
            ${
              anulado
                ? ""
                : `<button class="btn btn-sm btn-outline-danger"
                    onclick="eliminarPagoCompra(${compra.id}, ${p.id})">
              <i class="fas fa-trash"></i>
            </button>`
            }
          </td>
        </tr>
      `;
        })
        .join("");

    const estadoBadge =
      compra.estado === "Cancelada"
        ? "bg-danger"
        : compra.estado === "Pagada"
          ? "bg-success"
          : compra.estado === "Parcial"
            ? "bg-warning text-dark"
            : compra.estado === "Recibida"
              ? "bg-info"
              : "bg-secondary";

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Compra #${compra.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Proveedor:</strong> ${nombreProveedor}</div>
                    <div class="col-md-6"><strong>Factura:</strong> ${compra.numero_factura || "--"}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Fecha:</strong> ${compra.fecha ? new Date(compra.fecha).toLocaleString() : "--"}</div>
                    <div class="col-md-6"><strong>Estado:</strong> <span class="badge ${estadoBadge}">${compra.estado || "Pendiente"}</span></div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Subtotal:</strong> Q${compra.subtotal || 0}</div>
                    <div class="col-md-6"><strong>Total:</strong> Q${compra.total || 0}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Saldo Pendiente:</strong> Q${compra.saldo_pendiente || 0}</div>
                    <div class="col-md-6"><strong>Vencimiento:</strong> ${compra.fecha_vencimiento_pago || "--"}</div>
                </div>
                ${compra.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${compra.observaciones}</div>` : ""}
                ${compra.estado === "Cancelada" && compra.motivo_cancelacion ? `<div class="mb-3 text-danger"><strong>Motivo de cancelación:</strong> ${compra.motivo_cancelacion}</div>` : ""}

                <h6 class="fw-bold mt-3">Detalles</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr><th>Producto</th><th class="text-end">Cantidad</th><th class="text-end">Costo Unitario</th><th class="text-end">Subtotal</th></tr>
                        </thead>
                        <tbody>${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}</tbody>
                    </table>
                </div>

                <h6 class="fw-bold mt-4">Pagos</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th class="text-end">Monto</th>
                                <th>Referencia</th>
                                <th>Fecha</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>${pagosHtml}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button class="btn btn-outline-primary" onclick="imprimirCompra(${compra.id})">
                    <i class="fas fa-print me-1"></i>Imprimir Reporte
                </button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "compraDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);
    new bootstrap.Modal(modalDiv).show();
    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver compra", "error");
  }
}

// =============================================
// IMPRIMIR REPORTE DE COMPRA
// =============================================
async function imprimirCompra(id) {
  try {
    const compra = await api.request(`/compras/${id}`);
    if (!compra) return showToast("Compra no encontrada", "error");

    const proveedor = (window.proveedoresData || []).find(
      (p) => p.id === compra.id_proveedor,
    );
    const nombreProveedor = proveedor ? proveedor.nombre : "--";

    const filasDetalle = (compra.detalles || [])
      .map((d) => {
        const producto = (window.productosData || []).find(
          (p) => p.id === d.id_producto,
        );
        return `
          <tr>
            <td>${producto ? producto.nombre : "--"}</td>
            <td style="text-align:center">${d.cantidad_comprada || 0}</td>
            <td style="text-align:right">Q${Number(d.costo_unitario || 0).toFixed(2)}</td>
            <td style="text-align:right">Q${Number(d.subtotal || 0).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    const fecha = compra.fecha ? new Date(compra.fecha).toLocaleString() : "--";

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Compra #${compra.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #222; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .subtitulo { color: #666; margin-bottom: 20px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 13px; }
          th { background: #f2f2f2; text-align: left; }
          .datos { margin-bottom: 6px; font-size: 14px; }
          .datos strong { display: inline-block; width: 140px; }
          .totales { margin-top: 15px; text-align: right; font-size: 14px; }
          .totales div { margin-bottom: 4px; }
          .total-final { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 6px; margin-top: 6px; }
          .btn-imprimir { margin-top: 25px; padding: 8px 18px; font-size: 14px; cursor: pointer; }
          @media print { .btn-imprimir { display: none; } }
        </style>
      </head>
      <body>
        <h1>Reporte de Compra #${compra.id}</h1>
        <div class="subtitulo">Generado el ${new Date().toLocaleString()}</div>
        <div class="datos"><strong>Proveedor:</strong> ${nombreProveedor}</div>
        <div class="datos"><strong>N° Factura:</strong> ${compra.numero_factura || "--"}</div>
        <div class="datos"><strong>Fecha:</strong> ${fecha}</div>
        <div class="datos"><strong>Estado:</strong> ${compra.estado || "Pendiente"}</div>
        ${compra.observaciones ? `<div class="datos"><strong>Observaciones:</strong> ${compra.observaciones}</div>` : ""}
        ${compra.estado === "Cancelada" && compra.motivo_cancelacion ? `<div class="datos"><strong>Motivo de cancelación:</strong> ${compra.motivo_cancelacion}</div>` : ""}
        <table>
          <thead><tr><th>Producto</th><th>Cantidad</th><th>Costo Unitario</th><th>Subtotal</th></tr></thead>
          <tbody>${filasDetalle || '<tr><td colspan="4" style="text-align:center">Sin detalles</td></tr>'}</tbody>
        </table>
        <div class="totales">
          <div>Subtotal: Q${Number(compra.subtotal || 0).toFixed(2)}</div>
          <div>IVA: Q${Number(compra.iva || 0).toFixed(2)}</div>
          <div class="total-final">Total: Q${Number(compra.total || 0).toFixed(2)}</div>
          <div>Saldo Pendiente: Q${Number(compra.saldo_pendiente || 0).toFixed(2)}</div>
        </div>
        <button class="btn-imprimir" onclick="window.print()">Imprimir</button>
      </body>
      </html>
    `;

    const ventanaImpresion = window.open("", "_blank");
    if (!ventanaImpresion) {
      return showToast(
        "El navegador bloqueó la ventana de impresión.",
        "warning",
      );
    }
    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
  } catch (error) {
    showToast(error.message || "Error al generar el reporte", "error");
  }
}

async function registrarNotaEntrega(id) {
  const existing = document.getElementById("registrarNotaEntregaModal");
  if (existing) existing.remove();

  const html = `
    <div class="modal fade" id="registrarNotaEntregaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="fas fa-file-signature me-2"></i>Nota de Entrega</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="registrarNotaEntregaForm">
              <div class="mb-3">
                <label class="form-label fw-bold">Número de Nota <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="notaEntregaNumero" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">¿El receptor está conforme?</label>
                <select class="form-select" id="notaEntregaConforme">
                  <option value="1">Sí, conforme</option>
                  <option value="0">No conforme</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Observaciones</label>
                <textarea class="form-control" id="notaEntregaObservaciones" rows="2" placeholder="Opcional"></textarea>
              </div>
              <button type="submit" class="btn btn-success w-100">
                <i class="fas fa-save me-2"></i>Registrar Nota
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  const modalEl = document.getElementById("registrarNotaEntregaModal");
  const modalInstance = new bootstrap.Modal(modalEl);
  modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());

  document
    .getElementById("registrarNotaEntregaForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const numero_nota = document
        .getElementById("notaEntregaNumero")
        .value.trim();
      const conforme = parseInt(
        document.getElementById("notaEntregaConforme").value,
      );
      const observaciones =
        document.getElementById("notaEntregaObservaciones").value.trim() ||
        null;

      if (!numero_nota)
        return showToast("El número de nota es obligatorio", "error");

      const data = {
        numero_nota,
        id_usuario_receptor: getCurrentUser()?.id || 1,
        conforme,
        observaciones,
      };

      try {
        await api.request(`/compras/${id}/nota-entrega`, "POST", data);
        showToast("Nota de entrega registrada correctamente", "success");
        modalInstance.hide();
        await loadComprasModule();
      } catch (error) {
        showToast(error.message || "Error al registrar nota de entrega", "error");
      }
    });

  modalInstance.show();
}

async function registrarPagoCompra(id) {
  const tiposPago = await api.getTiposPago();
  if (!tiposPago || tiposPago.length === 0)
    return showToast("No hay tipos de pago disponibles", "error");

  const tiposValidos = tiposPago.filter(
    (t) => t.para_compras === 1 && t.activo !== 0,
  );

  if (tiposValidos.length === 0) {
    return showToast("No hay tipos de pago activos para compras", "warning");
  }

  const existing = document.getElementById("registrarPagoCompraModal");
  if (existing) existing.remove();

  const opcionesTipo = tiposValidos
    .map((t) => `<option value="${t.id}">${t.nombre}</option>`)
    .join("");

  const html = `
    <div class="modal fade" id="registrarPagoCompraModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title"><i class="fas fa-money-bill-wave me-2"></i>Registrar Pago</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="registrarPagoCompraForm">
              <div class="mb-3">
                <label class="form-label fw-bold">Tipo de Pago <span class="text-danger">*</span></label>
                <select class="form-select" id="pagoCompraTipo" required>
                  <option value="">Seleccionar...</option>
                  ${opcionesTipo}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Monto <span class="text-danger">*</span></label>
                <input type="number" step="0.01" min="0.01" class="form-control" id="pagoCompraMonto" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Referencia</label>
                <input type="text" class="form-control" id="pagoCompraReferencia" placeholder="Opcional (No. de recibo, transferencia, etc.)" />
              </div>
              <button type="submit" class="btn btn-warning w-100">
                <i class="fas fa-save me-2"></i>Registrar Pago
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  const modalEl = document.getElementById("registrarPagoCompraModal");
  const modalInstance = new bootstrap.Modal(modalEl);
  modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());

  document
    .getElementById("registrarPagoCompraForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const id_tipo_pago = parseInt(
        document.getElementById("pagoCompraTipo").value,
      );
      const monto = parseFloat(document.getElementById("pagoCompraMonto").value);
      const referencia =
        document.getElementById("pagoCompraReferencia").value.trim() || null;

      if (!id_tipo_pago) return showToast("Selecciona un tipo de pago", "error");
      if (!monto || monto <= 0) return showToast("Monto inválido", "error");

      try {
        await api.request(`/compras/${id}/pagos`, "POST", {
          id_tipo_pago,
          monto,
          referencia,
        });
        showToast("Pago registrado correctamente", "success");
        modalInstance.hide();
        await loadComprasModule();
      } catch (error) {
        showToast(error.message || "Error al registrar pago", "error");
      }
    });

  modalInstance.show();
}

// =============================================
// CANCELAR COMPRA Y PEDIDO
// =============================================
function pedirMotivoCancelacion() {
  return new Promise((resolve) => {
    const existing = document.getElementById("motivoCancelacionModal");
    if (existing) existing.remove();

    const html = `
      <div class="modal fade" id="motivoCancelacionModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title"><i class="fas fa-ban me-2"></i>Cancelar Compra</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="small text-muted mb-3">
                Al cancelar: se revertirá el inventario si la compra ya fue recibida,
                y los pagos registrados quedarán <strong>anulados</strong> (no se
                eliminan, pero ya no cuentan para el saldo). Esta acción no se puede deshacer.
              </p>
              <label class="form-label fw-bold">Motivo de cancelación <span class="text-danger">*</span></label>
              <textarea class="form-control" id="motivoCancelacionTexto" rows="3" placeholder="Ej: proveedor no entregó la mercadería"></textarea>
              <div class="text-danger small mt-1" id="motivoCancelacionError" style="display:none;">
                El motivo es obligatorio.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Volver</button>
              <button type="button" class="btn btn-sm btn-danger" id="motivoCancelacionContinuar">
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    const modalEl = document.getElementById("motivoCancelacionModal");
    const modalInstance = new bootstrap.Modal(modalEl);
    let resolved = false;

    modalEl.addEventListener("hidden.bs.modal", () => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
      modalEl.remove();
    });

    document.getElementById("motivoCancelacionContinuar").onclick = () => {
      const texto = document.getElementById("motivoCancelacionTexto").value.trim();
      if (!texto) {
        document.getElementById("motivoCancelacionError").style.display = "block";
        return;
      }
      resolved = true;
      resolve(texto);
      modalInstance.hide();
    };

    modalInstance.show();
  });
}

async function cancelarCompra(id) {
  const motivo = await pedirMotivoCancelacion();
  if (motivo === null) return; // el usuario cerró el modal sin escribir motivo

  const ok = await mostrarConfirmacion(
    "Cancelar Compra",
    "¿Confirmas que deseas cancelar esta compra? Esta acción no se puede deshacer.",
    "Cancelar Compra",
  );
  if (!ok) return;

  const autorizado = await confirmarAdmin(
    "Se cancelará la compra #" + id + ". Motivo: " + motivo,
  );
  if (!autorizado) return;

  try {
    await api.request(`/compras/${id}/cancelar`, "PATCH", { motivo });
    showToast("Compra cancelada correctamente", "success");
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cancelar compra", "error");
  }
}

async function cancelarPedido(id) {
  if (!confirm("¿Cancelar este pedido?")) return;
  try {
    await api.request(
      `/pedidos/${id}/estado?nuevo_estado=Cancelado&forzar=true`,
      "PATCH",
    );
    showToast("Pedido cancelado", "success");
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cancelar pedido", "error");
  }
}

async function eliminarPagoCompra(compraId, pagoId) {
  if (!confirm("¿Eliminar este pago? El saldo de la compra se recalculará."))
    return;
  try {
    await api.request(`/compras/${compraId}/pagos/${pagoId}`, "DELETE");
    showToast("Pago eliminado", "success");
    verCompra(compraId);
  } catch (error) {
    showToast(error.message || "Error al eliminar pago", "error");
  }
}

// =============================================
// CONFIRMACIÓN CON AUTORIZACIÓN ADMIN
// =============================================

async function confirmarAdmin(mensaje) {
  return new Promise((resolve) => {
    const existing = document.getElementById("adminAuthModal");
    if (existing) existing.remove();

    const html = `
      <div class="modal fade" id="adminAuthModal" tabindex="-1">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <i class="fas fa-shield-alt me-2"></i>Autorización
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="text-danger fw-bold mb-3">
                <i class="fas fa-exclamation-triangle me-1"></i>${mensaje}
              </p>
              <p class="small text-muted mb-3">
                Un Administrador o Dueña debe autorizar esta acción.
              </p>
              <div class="mb-2">
                <label class="form-label small mb-1">Usuario</label>
                <input type="text" class="form-control form-control-sm" id="adminAuthUsuario" autocomplete="off" />
              </div>
              <div class="mb-2">
                <label class="form-label small mb-1">Contraseña</label>
                <input type="password" class="form-control form-control-sm" id="adminAuthPassword" autocomplete="off" />
              </div>
              <div class="text-danger small mt-2" id="adminAuthError" style="display:none;"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-sm btn-danger" id="adminAuthConfirmar">
                <i class="fas fa-check me-1"></i>Autorizar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    const modalEl = document.getElementById("adminAuthModal");
    const modalInstance = new bootstrap.Modal(modalEl);

    let resolved = false;

    const cerrar = (resultado) => {
      if (resolved) return;
      resolved = true;
      resolve(resultado);
      modalInstance.hide();
    };

    modalEl.addEventListener("hidden.bs.modal", () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
      modalEl.remove();
    });

    document.getElementById("adminAuthConfirmar").onclick = async () => {
      const usuario = document.getElementById("adminAuthUsuario").value.trim();
      const pass = document.getElementById("adminAuthPassword").value;
      const errEl = document.getElementById("adminAuthError");
      errEl.style.display = "none";

      if (!usuario || !pass) {
        errEl.textContent = "Ingresa usuario y contraseña";
        errEl.style.display = "block";
        return;
      }

      try {
        await api.verificarAdmin(usuario, pass);
        cerrar(true);
      } catch (error) {
        errEl.textContent = error.message || "Credenciales inválidas";
        errEl.style.display = "block";
      }
    };

    modalEl.addEventListener("keyup", (e) => {
      if (e.key === "Enter")
        document.getElementById("adminAuthConfirmar").click();
    });

    modalInstance.show();
  });
}

// =============================================
// ELIMINAR GASTO
// =============================================

async function eliminarGasto(id) {
  const ok = confirm("¿Está seguro de eliminar este gasto?");
  if (!ok) return;

  const autorizado = await confirmarAdmin(
    "Se eliminará permanentemente el gasto #" + id,
  );
  if (!autorizado) return;

  try {
    await api.request(`/gastos/${id}`, "DELETE");
    showToast("Gasto eliminado", "success");
    cargarGastosTabla();
  } catch (error) {
    showToast(error.message || "Error al eliminar gasto", "error");
  }
}

// =============================================
// ELIMINAR MOVIMIENTO DE CAJA CHICA
// =============================================

async function eliminarCajaChica(id) {
  const ok = confirm("¿Está seguro de eliminar este movimiento?");
  if (!ok) return;

  const autorizado = await confirmarAdmin(
    "Se eliminará permanentemente el movimiento #" + id,
  );
  if (!autorizado) return;

  try {
    await api.request(`/caja-chica/${id}`, "DELETE");
    showToast("Movimiento eliminado", "success");
    cargarCajaChicaTabla();
  } catch (error) {
    showToast(error.message || "Error al eliminar movimiento", "error");
  }
}

// =============================================
// INACTIVAR TIPO DE PAGO
// =============================================

async function toggleTipoPagoEstado(id) {
  const tipo = (window.tiposPagoData || []).find((t) => t.id === id);
  if (!tipo) return;

  const nuevo = tipo.activo === 1 ? 0 : 1;
  const accion = nuevo === 1 ? "activar" : "inactivar";
  const ok = confirm(
    `¿Está seguro de ${accion} el tipo de pago "${tipo.nombre}"?`,
  );
  if (!ok) return;

  try {
    await api.request(`/tipos-pago/${id}`, "PUT", {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      para_ventas: tipo.para_ventas,
      para_compras: tipo.para_compras,
      activo: nuevo,
    });
    showToast(
      `Tipo de pago ${accion === "activar" ? "activado" : "inactivado"}`,
      "success",
    );
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

// =============================================
// INACTIVAR TIPO DE GASTO
// =============================================

async function toggleTipoGastoEstado(id) {
  const tipo = (window.tiposGastoData || []).find((t) => t.id === id);
  if (!tipo) return;

  const nuevo = tipo.activo === 1 ? 0 : 1;
  const accion = nuevo === 1 ? "activar" : "inactivar";
  const ok = confirm(
    `¿Está seguro de ${accion} el tipo de gasto "${tipo.nombre}"?`,
  );
  if (!ok) return;

  try {
    await api.request(`/tipos-gasto/${id}`, "PUT", {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      es_fijo: tipo.es_fijo,
      activo: nuevo,
    });
    showToast(
      `Tipo de gasto ${accion === "activar" ? "activado" : "inactivado"}`,
      "success",
    );
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

// =============================================
// FUNCIONES GLOBALES
// =============================================

window.loadComprasModule = loadComprasModule;
window.showCreateCompraModal = showCreateCompraModal;
window.saveCompra = saveCompra;
window.verCompra = verCompra;
window.imprimirCompra = imprimirCompra;
window.registrarNotaEntrega = registrarNotaEntrega;
window.registrarPagoCompra = registrarPagoCompra;
window.registrarMovimientoInventario = registrarMovimientoInventario;

// Proveedores
window.renderProveedoresTab = renderProveedoresTab;
window.showCreateProveedorModal = showCreateProveedorModal;
window.showEditProveedorModal = showEditProveedorModal;
window.saveProveedor = saveProveedor;
window.toggleProveedorEstado = toggleProveedorEstado;

// Tipos de Proveedor
window.renderTiposProveedorTab = renderTiposProveedorTab;
window.showCreateTipoProveedorModal = showCreateTipoProveedorModal;
window.showEditTipoProveedorModal = showEditTipoProveedorModal;
window.saveTipoProveedor = saveTipoProveedor;
window.toggleTipoProveedorEstado = toggleTipoProveedorEstado;

// Pedidos
window.renderPedidosTab = renderPedidosTab;
window.showCreatePedidoModal = showCreatePedidoModal;
window.verPedido = verPedido;
window.verTotalPedido = verTotalPedido;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.agregarDetallePedido = agregarDetallePedido;
window.eliminarDetallePedido = eliminarDetallePedido;
window.renderDetallesPedido = renderDetallesPedido;
window.editarCostoDetallePedido = editarCostoDetallePedido;
window.actualizarCostoPedido = actualizarCostoPedido;
window.actualizarSubtotalPedido = actualizarSubtotalPedido;
window.actualizarTotalesPedidoPreview = actualizarTotalesPedidoPreview;
window.filtrarPedidos = filtrarPedidos;
window.limpiarFiltrosPedidos = limpiarFiltrosPedidos;

// Caja Chica
window.renderCajaChicaTab = renderCajaChicaTab;
window.cargarCajaChicaTabla = cargarCajaChicaTabla;
window.cargarGastosTabla = cargarGastosTabla;
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

// Compras (auxiliares)
window.cargarPedidoEnCompra = cargarPedidoEnCompra;
window.llenarSelectProveedor = llenarSelectProveedor;
window.llenarSelectProductoCompra = llenarSelectProductoCompra;
window.agregarDetalleCompra = agregarDetalleCompra;
window.eliminarDetalleCompra = eliminarDetalleCompra;
window.renderDetallesCompra = renderDetallesCompra;
window.cancelarCompra = cancelarCompra;
window.cancelarPedido = cancelarPedido;
window.eliminarPagoCompra = eliminarPagoCompra;
window.filtrarCompras = filtrarCompras;
window.limpiarFiltrosCompras = limpiarFiltrosCompras;

// Exponer globalmente
window.eliminarGasto = eliminarGasto;
window.eliminarCajaChica = eliminarCajaChica;
window.toggleTipoPagoEstado = toggleTipoPagoEstado;
window.toggleTipoGastoEstado = toggleTipoGastoEstado;

// Confirmar Admin
window.confirmarAdmin = confirmarAdmin;
