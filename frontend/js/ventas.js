// ventas.js

let ventasData = [];
let tiposPagoData = [];
let cajaTurnosData = [];
let ubicacionesData = [];
let ventaDetallesTemp = [];
let ventaPagosTemp = [];
let vendedoresData = [];

// =============================================
// CARGA DEL MODULO PRINCIPAL
// =============================================
async function loadVentasModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-shopping-cart me-2 text-warning"></i>Ventas</h4>
            <div>
                <button class="btn btn-warning btn-sm" onclick="showCreateVentaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Venta
                </button>
            </div>
        </div>

        <ul class="nav nav-tabs mb-3" id="ventasSubTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#subVentas">
                    <i class="fas fa-list me-1"></i>Ventas
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subClientes">
                    <i class="fas fa-users me-1"></i>Clientes
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subCaja">
                    <i class="fas fa-cash-register me-1"></i>Caja
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#subVendedores">
                    <i class="fas fa-user-tie me-1"></i>Vendedores
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <!-- Pestaña: Ventas -->
            <div class="tab-pane fade show active" id="subVentas">
                <div id="ventasTableContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted">Cargando ventas...</p>
                    </div>
                </div>
            </div>

            <!-- Pestaña: Clientes -->
            <div class="tab-pane fade" id="subClientes">
                <div id="clientesSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando clientes...</p>
                    </div>
                </div>
            </div>

            <!-- Pestaña: Caja -->
            <div class="tab-pane fade" id="subCaja">
                <div id="cajaSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted">Cargando caja...</p>
                    </div>
                </div>
            </div>

            <!-- Pestaña: Vendedores -->
            <div class="tab-pane fade" id="subVendedores">
                <div id="vendedoresSubContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status"></div>
                        <p class="mt-2 text-muted">Cargando vendedores...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  try {
    const [ventas, clientes, productos, tiposPago, cajaTurnos, ubicaciones] =
      await Promise.all([
        api.getVentas().catch(() => []),
        api.getClientes().catch(() => []),
        api.getProductos().catch(() => []),
        api.getTiposPago().catch(() => []),
        api.getCajaTurnos().catch(() => []),
        api.request("/ubicaciones").catch(() => []),
      ]);

    ventasData = ventas || [];
    window.clientesData = clientes || [];
    window.productosData = productos || [];
    tiposPagoData = tiposPago || [];
    cajaTurnosData = cajaTurnos || [];
    ubicacionesData = ubicaciones || [];

    renderVentasTable(ventasData);
    cargarSubClientes();
    cargarSubCaja();
    cargarSubVendedores();
  } catch (error) {
    document.getElementById("ventasTableContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// =============================================
// PESTAÑA: VENTAS
// =============================================
function renderVentasTable(ventas) {
  const container = document.getElementById("ventasTableContainer");
  if (!container) return;

  if (!ventas || ventas.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay ventas registradas</p>
                <button class="btn btn-warning btn-sm" onclick="showCreateVentaModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Venta
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
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Subtotal</th>
                        <th>Descuento</th>
                        <th>Total</th>
                        <th>Saldo</th>
                        <th>Estado Pago</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  ventas.forEach((v) => {
    const cliente = (window.clientesData || []).find(
      (c) => c.id === v.id_cliente,
    );
    const nombreCliente = cliente ? cliente.nombre : "--";
    const estado = v.estado || "Completada";
    const totalPagos = (v.pagos || []).reduce(
      (sum, p) => sum + (p.monto || 0),
      0,
    );
    const saldo = (v.total || 0) - totalPagos;
    const pagada = saldo <= 0;

    html += `
            <tr>
                <td>
                    <button class="btn btn-link btn-sm p-0 text-primary" onclick="verVenta(${v.id})">
                        #${v.id}
                    </button>
                </td>
                <td>
                    <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${v.id_cliente})">
                        ${nombreCliente}
                    </button>
                </td>
                <td>${v.fecha ? new Date(v.fecha).toLocaleString() : "--"}</td>
                <td>Q${(v.subtotal || 0).toFixed(2)}</td>
                <td>Q${(v.descuento || 0).toFixed(2)}</td>
                <td><strong>Q${(v.total || 0).toFixed(2)}</strong></td>
                <td>Q${saldo.toFixed(2)}</td>
                <td>
                    <span class="badge ${pagada ? "bg-success" : "bg-danger"}">
                        ${pagada ? "Pagada" : "Pendiente"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verVenta(${v.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="anularVenta(${v.id})">
                        <i class="fas fa-times"></i>
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
            <small class="text-muted">Total: ${ventas.length} ventas</small>
        </div>
    `;

  container.innerHTML = html;
}

// =============================================
// VER FICHA CLIENTE (con historial)
// =============================================
async function verFichaCliente(idCliente) {
  if (!idCliente) {
    showToast("Cliente no especificado", "warning");
    return;
  }

  try {
    const cliente = (window.clientesData || []).find((c) => c.id === idCliente);
    if (!cliente) {
      showToast("Cliente no encontrado", "error");
      return;
    }

    // Obtener ventas del cliente
    const ventasCliente = ventasData.filter((v) => v.id_cliente === idCliente);

    let ventasHtml =
      ventasCliente.length === 0
        ? '<p class="text-muted">No hay ventas registradas para este cliente</p>'
        : `
        <div class="table-responsive">
            <table class="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado Pago</th>
                    </tr>
                </thead>
                <tbody>
                    ${ventasCliente
                      .map((v) => {
                        const totalPagos = (v.pagos || []).reduce(
                          (sum, p) => sum + (p.monto || 0),
                          0,
                        );
                        const saldo = (v.total || 0) - totalPagos;
                        const pagada = saldo <= 0;
                        return `
                        <tr>
                            <td><button class="btn btn-link btn-sm p-0" onclick="verVenta(${v.id})">#${v.id}</button></td>
                            <td>${v.fecha ? new Date(v.fecha).toLocaleDateString() : "--"}</td>
                            <td>Q${(v.total || 0).toFixed(2)}</td>
                            <td><span class="badge ${pagada ? "bg-success" : "bg-danger"}">${pagada ? "Pagada" : "Pendiente"}</span></td>
                        </tr>
                      `;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>
      `;

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Ficha del Cliente</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Nombre:</strong> ${cliente.nombre || "--"}</p>
                        <p><strong>Teléfono:</strong> ${cliente.telefono || "--"}</p>
                        <p><strong>Email:</strong> ${cliente.email || "--"}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Dirección:</strong> ${cliente.direccion || "--"}</p>
                        <p><strong>NIT:</strong> ${cliente.nit || "--"}</p>
                        <p><strong>Tipo:</strong> ${cliente.tipo_cliente || "General"}</p>
                    </div>
                </div>
                <hr>
                <h6 class="fw-bold">Historial de Ventas</h6>
                ${ventasHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "clienteFichaModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al cargar ficha del cliente", "error");
  }
}

// =============================================
// VER FICHA PRODUCTO (con veces vendido)
// =============================================
async function verFichaProducto(idProducto) {
  if (!idProducto) {
    showToast("Producto no especificado", "warning");
    return;
  }

  try {
    const producto = (window.productosData || []).find(
      (p) => p.id === idProducto,
    );
    if (!producto) {
      showToast("Producto no encontrado", "error");
      return;
    }

    // Contar veces vendido
    let vecesVendido = 0;
    let cantidadTotal = 0;
    ventasData.forEach((v) => {
      (v.detalles || []).forEach((d) => {
        if (d.id_producto === idProducto) {
          vecesVendido++;
          cantidadTotal += d.cantidad || 0;
        }
      });
    });

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Ficha del Producto</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Código:</strong> ${producto.codigo || "--"}</p>
                        <p><strong>Nombre:</strong> ${producto.nombre || "--"}</p>
                        <p><strong>Descripción:</strong> ${producto.descripcion || "--"}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Precio Venta:</strong> Q${(producto.precio_venta || 0).toFixed(2)}</p>
                        <p><strong>Stock Actual:</strong> ${producto.stock_actual || 0}</p>
                        <p><strong>Stock Mínimo:</strong> ${producto.stock_minimo || 0}</p>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card bg-info bg-opacity-10">
                            <div class="card-body text-center">
                                <h5 class="text-info">${vecesVendido}</h5>
                                <small class="text-muted">Veces vendido</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card bg-success bg-opacity-10">
                            <div class="card-body text-center">
                                <h5 class="text-success">${cantidadTotal}</h5>
                                <small class="text-muted">Unidades vendidas</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "productoFichaModal";
    modalDiv.innerHTML = `<div class="modal-dialog"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al cargar ficha del producto", "error");
  }
}

// =============================================
// FUNCIONES DE VENTAS (CRUD)
// =============================================
function showCreateVentaModal() {
  ventaDetallesTemp = [];
  ventaPagosTemp = [];

  const modal = document.getElementById("ventaModal");
  const form = document.getElementById("ventaForm");
  const title = document.getElementById("ventaModalTitle");

  title.textContent = "Nueva Venta";
  form.reset();
  document.getElementById("ventaId").value = "";
  document.getElementById("ventaDescuento").value = 0;
  document.getElementById("ventaObservaciones").value = "";

  llenarSelectCliente();
  llenarSelectCajaTurno();
  llenarSelectUbicacion();
  llenarSelectProductoDetalle();
  llenarSelectTipoPago();

  document.getElementById("ventaDetallesList").innerHTML = "";
  document.getElementById("ventaPagosList").innerHTML = "";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function llenarSelectCliente() {
  const select = document.getElementById("ventaCliente");
  select.innerHTML = '<option value="">Sin cliente</option>';
  (window.clientesData || []).forEach((c) => {
    select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

function llenarSelectCajaTurno() {
  const select = document.getElementById("ventaCajaTurno");
  select.innerHTML = '<option value="">Seleccionar turno</option>';
  const abiertos = cajaTurnosData.filter((t) => t.estado === "Abierto");
  abiertos.forEach((t) => {
    select.innerHTML += `<option value="${t.id}">Turno #${t.id}</option>`;
  });
}

function llenarSelectUbicacion() {
  const select = document.getElementById("ventaUbicacion");
  select.innerHTML = '<option value="">Seleccionar ubicación</option>';
  ubicacionesData.forEach((u) => {
    select.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
  });
}

function llenarSelectProductoDetalle() {
  const selects = document.querySelectorAll(".venta-detalle-producto");
  selects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    (window.productosData || []).forEach((p) => {
      select.innerHTML += `<option value="${p.id}">${p.codigo} - ${p.nombre} (Stock: ${p.stock_actual || 0})</option>`;
    });
  });
}

function llenarSelectTipoPago() {
  const selects = document.querySelectorAll(".venta-pago-tipo");
  selects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar tipo</option>';
    tiposPagoData
      .filter((t) => t.para_ventas === 1)
      .forEach((t) => {
        select.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
      });
  });
}

function agregarDetalleVenta(event) {
  event.preventDefault();

  const row = document.getElementById("ventaDetalleRow");
  const productSelect = row.querySelector(".venta-detalle-producto");
  const cantidadInput = row.querySelector(".venta-detalle-cantidad");

  const id_producto = parseInt(productSelect.value);
  const cantidad = parseFloat(cantidadInput.value) || 1;

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

  if ((producto.stock_actual || 0) < cantidad) {
    showToast(
      `Stock insuficiente. Disponible: ${producto.stock_actual || 0}`,
      "error",
    );
    return;
  }

  ventaDetallesTemp.push({
    id_producto: id_producto,
    cantidad: cantidad,
    producto: producto,
  });

  renderDetallesVenta();
  cantidadInput.value = 1;
  productSelect.value = "";
}

function renderDetallesVenta() {
  const container = document.getElementById("ventaDetallesList");
  if (ventaDetallesTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay productos agregados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  let total = 0;
  ventaDetallesTemp.forEach((d, index) => {
    const subtotal = d.cantidad * (d.producto.precio_venta || 0);
    total += subtotal;
    html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaProducto(${d.producto.id})">
                        <strong>${d.producto.nombre}</strong>
                    </button>
                    <span class="text-muted small"> x ${d.cantidad}</span>
                    <span class="text-muted small"> Q${d.producto.precio_venta || 0} c/u</span>
                </div>
                <div>
                    <span class="fw-bold">Q${subtotal.toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarDetalleVenta(${index})">
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

  const descuentoInput = document.getElementById("ventaDescuento");
  const descuento = parseFloat(descuentoInput.value) || 0;
  const totalFinal = total - (total * descuento) / 100;
  mostrarTotalVenta(total, descuento, totalFinal);
}

function eliminarDetalleVenta(index) {
  ventaDetallesTemp.splice(index, 1);
  renderDetallesVenta();
}

function mostrarTotalVenta(subtotal, descuento, total) {
  const container = document.getElementById("ventaDetallesList");
  const totalElement = container.querySelector(".list-group-item.fw-bold");
  if (totalElement) {
    totalElement.textContent = `Subtotal: Q${subtotal.toFixed(2)} | Descuento: ${descuento}% | Total: Q${total.toFixed(2)}`;
  }
}

function agregarPagoVenta(event) {
  event.preventDefault();

  const row = document.getElementById("ventaPagoRow");
  const tipoSelect = row.querySelector(".venta-pago-tipo");
  const montoInput = row.querySelector(".venta-pago-monto");
  const referenciaInput = row.querySelector(".venta-pago-referencia");

  const id_tipo_pago = parseInt(tipoSelect.value);
  const monto = parseFloat(montoInput.value);

  if (!id_tipo_pago) {
    showToast("Selecciona un tipo de pago", "error");
    return;
  }
  if (!monto || monto <= 0) {
    showToast("Ingresa un monto válido", "error");
    return;
  }

  const tipoPago = tiposPagoData.find((t) => t.id === id_tipo_pago);

  ventaPagosTemp.push({
    id_tipo_pago: id_tipo_pago,
    monto: monto,
    referencia: referenciaInput.value || null,
    tipoPago: tipoPago,
  });

  renderPagosVenta();
  montoInput.value = "";
  referenciaInput.value = "";
  tipoSelect.value = "";
}

function renderPagosVenta() {
  const container = document.getElementById("ventaPagosList");
  if (ventaPagosTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay pagos registrados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  let total = 0;
  ventaPagosTemp.forEach((p, index) => {
    total += p.monto;
    html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${p.tipoPago ? p.tipoPago.nombre : "--"}</strong>
                    <span class="text-muted small"> ${p.referencia ? "Ref: " + p.referencia : ""}</span>
                </div>
                <div>
                    <span class="fw-bold">Q${p.monto.toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarPagoVenta(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </li>
        `;
  });
  html += `
        <li class="list-group-item fw-bold">
            Total Pagos: Q${total.toFixed(2)}
        </li>
    </ul>`;
  container.innerHTML = html;
}

function eliminarPagoVenta(index) {
  ventaPagosTemp.splice(index, 1);
  renderPagosVenta();
}

async function saveVenta(event) {
  event.preventDefault();

  const id_usuario = getCurrentUser()?.id || 1;
  const id_cliente =
    parseInt(document.getElementById("ventaCliente").value) || null;
  const id_caja_turno = parseInt(
    document.getElementById("ventaCajaTurno").value,
  );
  const id_ubicacion = parseInt(
    document.getElementById("ventaUbicacion").value,
  );
  const descuento_porcentaje =
    parseFloat(document.getElementById("ventaDescuento").value) || 0;
  const observaciones =
    document.getElementById("ventaObservaciones").value || null;

  if (!id_caja_turno) {
    showToast("Selecciona un turno de caja abierto", "error");
    return;
  }
  if (!id_ubicacion) {
    showToast("Selecciona una ubicación", "error");
    return;
  }
  if (ventaDetallesTemp.length === 0) {
    showToast("Agrega al menos un producto", "error");
    return;
  }
  if (ventaPagosTemp.length === 0) {
    showToast("Agrega al menos un pago", "error");
    return;
  }

  let subtotal = 0;
  ventaDetallesTemp.forEach((d) => {
    subtotal += d.cantidad * (d.producto.precio_venta || 0);
  });

  let totalPagos = 0;
  ventaPagosTemp.forEach((p) => {
    totalPagos += p.monto;
  });

  if (totalPagos < subtotal - (subtotal * descuento_porcentaje) / 100) {
    showToast("El total de pagos no cubre el total de la venta", "error");
    return;
  }

  const data = {
    id_usuario: id_usuario,
    id_cliente: id_cliente,
    id_caja_turno: id_caja_turno,
    id_ubicacion: id_ubicacion,
    descuento_porcentaje: descuento_porcentaje,
    observaciones: observaciones,
    detalles: ventaDetallesTemp.map((d) => ({
      id_producto: d.id_producto,
      cantidad: d.cantidad,
    })),
    pagos: ventaPagosTemp.map((p) => ({
      id_tipo_pago: p.id_tipo_pago,
      monto: p.monto,
      referencia: p.referencia,
    })),
  };

  try {
    const result = await api.createVenta(data);
    showToast(`Venta #${result.id} creada correctamente`, "success");
    bootstrap.Modal.getInstance(document.getElementById("ventaModal")).hide();
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al crear venta", "error");
  }
}

async function verVenta(id) {
  try {
    const venta = await api.getVenta(id);
    if (!venta) {
      showToast("Venta no encontrada", "error");
      return;
    }

    const cliente = (window.clientesData || []).find(
      (c) => c.id === venta.id_cliente,
    );
    const nombreCliente = cliente ? cliente.nombre : "Sin cliente";

    const totalPagos = (venta.pagos || []).reduce(
      (sum, p) => sum + (p.monto || 0),
      0,
    );
    const saldo = (venta.total || 0) - totalPagos;
    const pagada = saldo <= 0;

    let detallesHtml = (venta.detalles || [])
      .map((d) => {
        const producto = (window.productosData || []).find(
          (p) => p.id === d.id_producto,
        );
        return `
                <tr>
                    <td>
                        <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaProducto(${d.id_producto})">
                            ${producto ? producto.nombre : "--"}
                        </button>
                    </td>
                    <td>${d.cantidad || 0}</td>
                    <td>Q${(d.precio_unitario || 0).toFixed(2)}</td>
                    <td>Q${(d.subtotal || 0).toFixed(2)}</td>
                </tr>
            `;
      })
      .join("");

    let pagosHtml = (venta.pagos || [])
      .map((p) => {
        const tipoPago = tiposPagoData.find((t) => t.id === p.id_tipo_pago);
        return `
                <tr>
                    <td>${tipoPago ? tipoPago.nombre : "--"}</td>
                    <td>Q${(p.monto || 0).toFixed(2)}</td>
                    <td>${p.referencia || "--"}</td>
                </tr>
            `;
      })
      .join("");

    const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">Venta #${venta.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Cliente:</strong>
                        <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${venta.id_cliente})">
                            ${nombreCliente}
                        </button>
                    </div>
                    <div class="col-md-6"><strong>Fecha:</strong> ${venta.fecha ? new Date(venta.fecha).toLocaleString() : "--"}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-4"><strong>Subtotal:</strong> Q${(venta.subtotal || 0).toFixed(2)}</div>
                    <div class="col-md-4"><strong>Total:</strong> Q${(venta.total || 0).toFixed(2)}</div>
                    <div class="col-md-4"><strong>Saldo:</strong> Q${saldo.toFixed(2)}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6"><strong>Descuento:</strong> ${venta.descuento_porcentaje || 0}%</div>
                    <div class="col-md-6">
                        <strong>Estado Pago:</strong>
                        <span class="badge ${pagada ? "bg-success" : "bg-danger"}">
                            ${pagada ? "Pagada" : "Pendiente"}
                        </span>
                    </div>
                </div>
                ${venta.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${venta.observaciones}</div>` : ""}

                <h6 class="fw-bold mt-3">Detalles</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                        <tbody>${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}</tbody>
                    </table>
                </div>

                <h6 class="fw-bold mt-3">Pagos</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead><tr><th>Tipo</th><th>Monto</th><th>Referencia</th></tr></thead>
                        <tbody>${pagosHtml || '<tr><td colspan="3" class="text-center">Sin pagos</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "ventaDetalleModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${modalContent}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al ver venta", "error");
  }
}

async function anularVenta(id) {
  const confirmado = await mostrarConfirmacion(
    "Anular Venta",
    "¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.",
    "Anular",
  );

  if (!confirmado) return;

  try {
    await api.request(`/ventas/${id}`, "PATCH", { estado: "Anulada" });
    showToast("Venta anulada correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al anular venta", "error");
  }
}

// =============================================
// PESTAÑA: CLIENTES (CRUD completo)
// =============================================
async function cargarSubClientes() {
  const container = document.getElementById("clientesSubContainer");
  if (!container) return;

  try {
    const clientes = await api.getClientes().catch(() => []);
    window.clientesData = clientes || [];

    if (!clientes || clientes.length === 0) {
      container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay clientes registrados</p>
                    <button class="btn btn-primary btn-sm" onclick="showCreateClienteSubModal()">
                        <i class="fas fa-plus me-2"></i>Agregar Cliente
                    </button>
                </div>
            `;
      return;
    }

    let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">Listado de Clientes</h6>
                <button class="btn btn-primary btn-sm" onclick="showCreateClienteSubModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Cliente
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-striped">
                    <thead class="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>NIT</th>
                            <th>Ventas</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    clientes.forEach((c) => {
      const ventasCliente = ventasData.filter((v) => v.id_cliente === c.id);
      const activo = c.activo !== 0;
      html += `
                <tr>
                    <td>${c.id}</td>
                    <td>
                        <button class="btn btn-link btn-sm p-0 text-primary" onclick="verFichaCliente(${c.id})">
                            ${c.nombre || "--"}
                        </button>
                    </td>
                    <td>${c.telefono || "--"}</td>
                    <td>${c.email || "--"}</td>
                    <td>${c.nit || "--"}</td>
                    <td><span class="badge bg-info">${ventasCliente.length}</span></td>
                    <td>
                        <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                            ${activo ? "Activo" : "Inactivo"}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="showEditClienteSubModal(${c.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteClienteSub(${c.id})">
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
                <small class="text-muted">Total: ${clientes.length} clientes</small>
            </div>
        `;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar clientes: ${error.message}</div>`;
  }
}

// =============================================
// CLIENTES - CRUD (funciones existentes)
// =============================================
function showCreateClienteSubModal() {
  const modal = document.getElementById("clienteModal");
  if (!modal) return;

  const title = document.getElementById("clienteModalTitle");
  title.textContent = "Nuevo Cliente";

  document.getElementById("clienteForm").reset();
  document.getElementById("clienteId").value = "";
  document.getElementById("clienteActivo").value = "1";
  limpiarErroresFormulario("clienteForm");

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();

  const form = document.getElementById("clienteForm");
  form.onsubmit = function (e) {
    e.preventDefault();
    saveClienteSub();
  };
}

async function showEditClienteSubModal(id) {
  try {
    const cliente = (window.clientesData || []).find((c) => c.id === id);
    if (!cliente) {
      showToast("Cliente no encontrado", "error");
      return;
    }

    const modal = document.getElementById("clienteModal");
    if (!modal) return;

    const title = document.getElementById("clienteModalTitle");
    title.textContent = "Editar Cliente";

    document.getElementById("clienteId").value = cliente.id;
    document.getElementById("clienteNombre").value = cliente.nombre || "";
    document.getElementById("clienteTelefono").value = cliente.telefono || "";
    document.getElementById("clienteEmail").value = cliente.email || "";
    document.getElementById("clienteDireccion").value = cliente.direccion || "";
    document.getElementById("clienteNit").value = cliente.nit || "";
    document.getElementById("clienteTipo").value =
      cliente.tipo_cliente || "General";
    document.getElementById("clienteActivo").value =
      cliente.activo !== 0 ? "1" : "0";
    limpiarErroresFormulario("clienteForm");

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    const form = document.getElementById("clienteForm");
    form.onsubmit = function (e) {
      e.preventDefault();
      saveClienteSub();
    };
  } catch (error) {
    showToast(error.message || "Error al cargar cliente", "error");
  }
}

async function saveClienteSub() {
  const id = document.getElementById("clienteId").value;
  const nombre = document.getElementById("clienteNombre").value.trim();

  if (!nombre) {
    mostrarErrorCampo("clienteNombre", "El nombre es obligatorio");
    return;
  }
  limpiarErrorCampo("clienteNombre");

  const data = {
    nombre: nombre,
    telefono: document.getElementById("clienteTelefono").value.trim() || null,
    email: document.getElementById("clienteEmail").value.trim() || null,
    direccion: document.getElementById("clienteDireccion").value.trim() || null,
    nit: document.getElementById("clienteNit").value.trim() || null,
    tipo_cliente: document.getElementById("clienteTipo").value,
    activo: parseInt(document.getElementById("clienteActivo").value),
  };

  try {
    if (id) {
      await api.updateCliente(id, data);
      showToast("Cliente actualizado correctamente", "success");
    } else {
      await api.createCliente(data);
      showToast("Cliente creado correctamente", "success");
    }

    bootstrap.Modal.getInstance(document.getElementById("clienteModal")).hide();
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al guardar cliente", "error");
  }
}

async function deleteClienteSub(id) {
  const confirmado = await mostrarConfirmacion(
    "Eliminar Cliente",
    "¿Estás seguro de eliminar este cliente?",
    "Eliminar",
  );

  if (!confirmado) return;

  try {
    await api.deleteCliente(id);
    showToast("Cliente eliminado correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al eliminar cliente", "error");
  }
}

// =============================================
// PESTAÑA: VENDEDORES
// =============================================
async function cargarSubVendedores() {
  const container = document.getElementById("vendedoresSubContainer");
  if (!container) return;

  try {
    const empleados = await api.getEmpleados().catch(() => []);
    // Filtrar solo vendedores (asumiendo que tienen rol_id correspondiente)
    vendedoresData = empleados.filter(
      (e) => e.id_rol === 3 || e.rol === "vendedor",
    );

    if (!vendedoresData || vendedoresData.length === 0) {
      container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-user-tie fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay vendedores registrados</p>
                    <button class="btn btn-info btn-sm" onclick="cargarModulo('usuarios')">
                        <i class="fas fa-plus me-2"></i>Ir a Usuarios
                    </button>
                </div>
            `;
      return;
    }

    let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">Listado de Vendedores</h6>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-striped">
                    <thead class="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>DPI</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>Fecha Contratación</th>
                            <th>Ventas</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    vendedoresData.forEach((v) => {
      const ventasVendedor = ventasData.filter(
        (venta) => venta.id_usuario === v.id_usuario,
      );
      const activo = v.activo !== 0;
      html += `
                <tr>
                    <td>${v.id}</td>
                    <td><strong>${v.nombre || "--"}</strong></td>
                    <td>${v.dpi || "--"}</td>
                    <td>${v.telefono || "--"}</td>
                    <td>${v.email || "--"}</td>
                    <td>${v.fecha_contratacion ? new Date(v.fecha_contratacion).toLocaleDateString() : "--"}</td>
                    <td><span class="badge bg-warning">${ventasVendedor.length}</span></td>
                    <td>
                        <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                            ${activo ? "Activo" : "Inactivo"}
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
                <small class="text-muted">Total: ${vendedoresData.length} vendedores</small>
            </div>
        `;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar vendedores: ${error.message}</div>`;
  }
}

// =============================================
// PESTAÑA: CAJA (mejorada con denominaciones)
// =============================================
async function cargarSubCaja() {
  const container = document.getElementById("cajaSubContainer");
  if (!container) return;

  try {
    const [turnos, gastos, tiposGasto, tiposPago, cajaChica] =
      await Promise.all([
        api.getCajaTurnos().catch(() => []),
        api.getGastos().catch(() => []),
        api.getTiposGasto().catch(() => []),
        api.getTiposPago().catch(() => []),
        api.getCajaChica().catch(() => []),
      ]);

    const abiertos = turnos.filter((t) => t.estado === "Abierto");
    const saldoCajaChica = cajaChica.reduce(
      (sum, c) => sum + (c.monto || 0),
      0,
    );

    container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">Turnos de Caja</h6>
                    <p class="small text-muted">Abiertos: ${abiertos.length} | Total: ${turnos.length}</p>
                    <button class="btn btn-sm btn-success mb-2" onclick="showAbrirTurnoSubModal()">
                        <i class="fas fa-play me-1"></i>Abrir Turno
                    </button>
                    ${
                      abiertos.length > 0
                        ? `
                        <button class="btn btn-sm btn-danger mb-2 ms-1" onclick="showCerrarTurnoSubModal()">
                            <i class="fas fa-stop me-1"></i>Cerrar Turno
                        </button>
                    `
                        : ""
                    }
                    <div class="table-responsive mt-2">
                        <table class="table table-sm table-striped">
                            <thead><tr><th>ID</th><th>Estado</th><th>Apertura</th><th>Fondo</th></tr></thead>
                            <tbody>
                                ${turnos
                                  .slice(0, 10)
                                  .map(
                                    (t) => `
                                    <tr>
                                        <td>${t.id}</td>
                                        <td><span class="badge ${t.estado === "Abierto" ? "bg-success" : "bg-secondary"}">${t.estado}</span></td>
                                        <td>${t.fecha_apertura ? new Date(t.fecha_apertura).toLocaleDateString() : "--"}</td>
                                        <td>Q${t.fondo_inicial || 0}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                    <div class="card mt-3 border-success">
                        <div class="card-body">
                            <h6 class="fw-bold text-success">
                                <i class="fas fa-piggy-bank me-2"></i>Saldo Caja Chica: Q${saldoCajaChica.toFixed(2)}
                            </h6>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">Tipos de Pago</h6>
                    <div class="d-flex flex-wrap gap-1 mb-2">
                        ${tiposPago
                          .map(
                            (t) => `
                            <span class="badge bg-primary">${t.nombre}</span>
                        `,
                          )
                          .join("")}
                        <button class="btn btn-sm btn-outline-primary" onclick="showCreateTipoPagoSubModal()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <h6 class="fw-bold mt-3">Gastos Recientes</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead><tr><th>Concepto</th><th>Monto</th></tr></thead>
                            <tbody>
                                ${gastos
                                  .slice(0, 5)
                                  .map(
                                    (g) => `
                                    <tr>
                                        <td>${g.concepto || "--"}</td>
                                        <td class="text-danger">Q${g.monto || 0}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                    <button class="btn btn-sm btn-outline-danger mt-1" onclick="showRegistrarGastoSubModal()">
                        <i class="fas fa-plus me-1"></i>Registrar Gasto
                    </button>
                </div>
            </div>
        `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// =============================================
// CAJA - CERRAR TURNO CON DENOMINACIONES
// =============================================
function showCerrarTurnoSubModal() {
  const modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    setTimeout(() => showCerrarTurnoSubModal(), 100);
    return;
  }

  const title = document.getElementById("cajaModalTitle");
  title.textContent = "Cerrar Turno - Denominaciones";

  const body = document.getElementById("cajaModalBody");
  body.innerHTML = `
        <form id="cerrarTurnoForm">
            <p class="text-muted small">Ingrese la cantidad de cada denominación para el cierre de turno</p>
            <div class="row g-2">
                <div class="col-6">
                    <label class="form-label">Billetes Q200</label>
                    <input type="number" class="form-control" id="den200" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Billetes Q100</label>
                    <input type="number" class="form-control" id="den100" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Billetes Q50</label>
                    <input type="number" class="form-control" id="den50" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Billetes Q20</label>
                    <input type="number" class="form-control" id="den20" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Billetes Q10</label>
                    <input type="number" class="form-control" id="den10" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Billetes Q5</label>
                    <input type="number" class="form-control" id="den5" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Monedas Q1</label>
                    <input type="number" class="form-control" id="den1" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Monedas Q0.50</label>
                    <input type="number" step="0.5" class="form-control" id="den05" value="0" min="0" />
                </div>
                <div class="col-6">
                    <label class="form-label">Monedas Q0.25</label>
                    <input type="number" step="0.25" class="form-control" id="den025" value="0" min="0" />
                </div>
            </div>
            <div class="mt-3 p-2 bg-light rounded">
                <strong>Total contado: Q<span id="totalContado">0.00</span></strong>
            </div>
            <button type="submit" class="btn btn-danger w-100 mt-3" onclick="cerrarTurnoConDenominaciones(event)">Cerrar Turno</button>
        </form>
    `;

  // Calcular total en tiempo real
  document.querySelectorAll("#cerrarTurnoForm input").forEach((input) => {
    input.addEventListener("input", function () {
      calcularTotalDenominaciones();
    });
  });

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function calcularTotalDenominaciones() {
  const denominaciones = [
    { id: "den200", valor: 200 },
    { id: "den100", valor: 100 },
    { id: "den50", valor: 50 },
    { id: "den20", valor: 20 },
    { id: "den10", valor: 10 },
    { id: "den5", valor: 5 },
    { id: "den1", valor: 1 },
    { id: "den05", valor: 0.5 },
    { id: "den025", valor: 0.25 },
  ];

  let total = 0;
  denominaciones.forEach((d) => {
    const input = document.getElementById(d.id);
    if (input) {
      total += (parseFloat(input.value) || 0) * d.valor;
    }
  });

  document.getElementById("totalContado").textContent = total.toFixed(2);
}

async function cerrarTurnoConDenominaciones(event) {
  event.preventDefault();

  const confirmado = await mostrarConfirmacion(
    "Cerrar Turno",
    "¿Está seguro de cerrar el turno? Se registrará el total contado.",
  );

  if (!confirmado) return;

  const totalContado =
    parseFloat(document.getElementById("totalContado").textContent) || 0;

  try {
    const turnoAbierto = cajaTurnosData.find((t) => t.estado === "Abierto");
    if (!turnoAbierto) {
      showToast("No hay turno abierto", "error");
      return;
    }

    await api.request(`/caja-turno/${turnoAbierto.id}/cerrar`, "PATCH", {
      total_contado: totalContado,
    });

    showToast(
      `Turno cerrado correctamente. Total contado: Q${totalContado.toFixed(2)}`,
      "success",
    );
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al cerrar turno", "error");
  }
}

// =============================================
// EXPONER FUNCIONES GLOBALES
// =============================================
window.loadVentasModule = loadVentasModule;
window.showCreateVentaModal = showCreateVentaModal;
window.agregarDetalleVenta = agregarDetalleVenta;
window.eliminarDetalleVenta = eliminarDetalleVenta;
window.agregarPagoVenta = agregarPagoVenta;
window.eliminarPagoVenta = eliminarPagoVenta;
window.saveVenta = saveVenta;
window.verVenta = verVenta;
window.anularVenta = anularVenta;
window.verFichaCliente = verFichaCliente;
window.verFichaProducto = verFichaProducto;

window.cargarSubClientes = cargarSubClientes;
window.cargarSubCaja = cargarSubCaja;
window.cargarSubVendedores = cargarSubVendedores;
window.showCreateClienteSubModal = showCreateClienteSubModal;
window.showEditClienteSubModal = showEditClienteSubModal;
window.deleteClienteSub = deleteClienteSub;
window.saveClienteSub = saveClienteSub;
window.showAbrirTurnoSubModal = showAbrirTurnoSubModal;
window.showCerrarTurnoSubModal = showCerrarTurnoSubModal;
window.showCreateTipoPagoSubModal = showCreateTipoPagoSubModal;
window.showRegistrarGastoSubModal = showRegistrarGastoSubModal;
window.cerrarTurnoConDenominaciones = cerrarTurnoConDenominaciones;

// Funciones existentes de caja (simplificadas)
window.abrirTurnoSub = async function (event) {
  event.preventDefault();
  const id_usuario = getCurrentUser()?.id || 1;
  const id_ubicacion = parseInt(document.getElementById("cajaUbicacion").value);
  const fondo_inicial =
    parseFloat(document.getElementById("cajaFondoInicial").value) || 500;

  if (!id_ubicacion) {
    showToast("Selecciona una ubicación", "error");
    return;
  }

  try {
    await api.createCajaTurno({ id_usuario, id_ubicacion, fondo_inicial });
    showToast("Turno abierto correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al abrir turno", "error");
  }
};

window.saveTipoPagoSub = async function (event) {
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
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al crear tipo de pago", "error");
  }
};

window.registrarGastoSub = async function (event) {
  event.preventDefault();
  const concepto = document.getElementById("gastoConcepto").value.trim();
  const monto = parseFloat(document.getElementById("gastoMonto").value);
  const id_tipo_gasto =
    parseInt(document.getElementById("gastoTipo").value) || null;
  const observaciones =
    document.getElementById("gastoObservaciones").value || null;
  const id_usuario_registra = getCurrentUser()?.id || 1;

  if (!concepto || !monto) {
    showToast("Concepto y monto son obligatorios", "error");
    return;
  }

  try {
    await api.request("/gastos", "POST", {
      concepto,
      monto,
      id_tipo_gasto,
      observaciones,
      id_usuario_registra,
    });
    showToast("Gasto registrado correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al registrar gasto", "error");
  }
};

// Funciones auxiliares para modales
function showAbrirTurnoSubModal() {
  const modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    setTimeout(() => showAbrirTurnoSubModal(), 100);
    return;
  }

  const title = document.getElementById("cajaModalTitle");
  title.textContent = "Abrir Turno de Caja";

  const body = document.getElementById("cajaModalBody");
  body.innerHTML = `
        <form id="cajaForm" novalidate>
            <input type="hidden" id="cajaId" />
            <div class="mb-3">
                <label class="form-label">Ubicación</label>
                <select class="form-select" id="cajaUbicacion" required>
                    <option value="">Seleccionar</option>
                    ${(window.ubicacionesData || []).map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Fondo Inicial</label>
                <input type="number" step="0.01" class="form-control" id="cajaFondoInicial" value="500" />
            </div>
            <button type="submit" class="btn btn-success w-100" onclick="window.abrirTurnoSub(event)">Abrir Turno</button>
        </form>
    `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function showCreateTipoPagoSubModal() {
  const modal = document.getElementById("tipoPagoModal");
  if (!modal) {
    crearModalTipoPago();
    setTimeout(() => showCreateTipoPagoSubModal(), 100);
    return;
  }

  const title = document.getElementById("tipoPagoModalTitle");
  title.textContent = "Nuevo Tipo de Pago";

  const form = document.getElementById("tipoPagoForm");
  form.reset();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function showRegistrarGastoSubModal() {
  const modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    setTimeout(() => showRegistrarGastoSubModal(), 100);
    return;
  }

  const title = document.getElementById("cajaModalTitle");
  title.textContent = "Registrar Gasto";

  const body = document.getElementById("cajaModalBody");
  body.innerHTML = `
        <form id="gastoForm" novalidate>
            <div class="mb-3">
                <label class="form-label">Concepto</label>
                <input type="text" class="form-control" id="gastoConcepto" required />
            </div>
            <div class="mb-3">
                <label class="form-label">Monto</label>
                <input type="number" step="0.01" class="form-control" id="gastoMonto" required />
            </div>
            <div class="mb-3">
                <label class="form-label">Tipo de Gasto</label>
                <select class="form-select" id="gastoTipo">
                    <option value="">Seleccionar</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Observaciones</label>
                <textarea class="form-control" id="gastoObservaciones" rows="2"></textarea>
            </div>
            <button type="submit" class="btn btn-danger w-100" onclick="window.registrarGastoSub(event)">Registrar Gasto</button>
        </form>
    `;

  // Cargar tipos de gasto
  api
    .getTiposGasto()
    .then((tipos) => {
      const select = document.getElementById("gastoTipo");
      tipos.forEach((t) => {
        select.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
      });
    })
    .catch(() => {});

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function crearModalCaja() {
  if (document.getElementById("cajaModal")) return;
  const html = `
        <div class="modal fade" id="cajaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="cajaModalTitle">Caja</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="cajaModalBody"></div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
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
                        <form id="tipoPagoForm" novalidate>
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="tipoPagoNombre" required />
                            </div>
                            <div class="row">
                                <div class="col-6 mb-3">
                                    <label class="form-label">¿Para ventas?</label>
                                    <select class="form-select" id="tipoPagoVentas">
                                        <option value="1">Sí</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                                <div class="col-6 mb-3">
                                    <label class="form-label">¿Para compras?</label>
                                    <select class="form-select" id="tipoPagoCompras">
                                        <option value="1">Sí</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" onclick="window.saveTipoPagoSub(event)">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
}

// Helper para obtener usuario actual
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}
