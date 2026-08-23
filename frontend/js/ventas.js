// VENTAS

let ventasData = [];
let clientesData = [];
let productosData = [];
let tiposPagoData = [];
let cajaTurnosData = [];
let ubicacionesData = [];
let ventaDetallesTemp = [];
let ventaPagosTemp = [];

// CARGA DEL MÓDULO
async function loadVentasModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-shopping-cart me-2 text-warning"></i>Ventas</h4>
            <button class="btn btn-warning" onclick="showCreateVentaModal()">
                <i class="fas fa-plus me-2"></i>Nueva Venta
            </button>
        </div>
        <div id="ventasTableContainer">
            <div class="text-center py-5">
                <div class="spinner-border text-warning" role="status"></div>
                <p class="mt-2 text-muted">Cargando ventas...</p>
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
    clientesData = clientes || [];
    productosData = productos || [];
    tiposPagoData = tiposPago || [];
    cajaTurnosData = cajaTurnos || [];
    ubicacionesData = ubicaciones || [];

    renderVentasTable(ventasData);
  } catch (error) {
    document.getElementById("ventasTableContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// RENDERIZAR TABLA DE VENTAS
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
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  ventas.forEach((v) => {
    const cliente = clientesData.find((c) => c.id === v.id_cliente);
    const nombreCliente = cliente ? cliente.nombre : "--";
    const estado = v.estado || "Completada";
    const estadoBadge = estado === "Completada" ? "bg-success" : "bg-warning";

    html += `
            <tr>
                <td>${v.id}</td>
                <td>${nombreCliente}</td>
                <td>${v.fecha ? new Date(v.fecha).toLocaleString() : "--"}</td>
                <td>Q${v.subtotal || 0}</td>
                <td>Q${v.descuento || 0}</td>
                <td><strong>Q${v.total || 0}</strong></td>
                <td><span class="badge ${estadoBadge}">${estado}</span></td>
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

// CREAR VENTA - MODAL
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

// LLENAR SELECTS
function llenarSelectCliente() {
  const select = document.getElementById("ventaCliente");
  select.innerHTML = '<option value="">Sin cliente</option>';
  clientesData.forEach((c) => {
    select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

function llenarSelectCajaTurno() {
  const select = document.getElementById("ventaCajaTurno");
  select.innerHTML = '<option value="">Seleccionar turno</option>';
  const abiertos = cajaTurnosData.filter((t) => t.estado === "Abierto");
  abiertos.forEach((t) => {
    select.innerHTML += `<option value="${t.id}">Turno #${t.id} - ${t.fecha_apertura ? new Date(t.fecha_apertura).toLocaleDateString() : ""}</option>`;
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
    productosData.forEach((p) => {
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

// AGREGAR DETALLE DE VENTA
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

  const producto = productosData.find((p) => p.id === id_producto);
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
                    <strong>${d.producto.nombre}</strong>
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
            Total: Q${total.toFixed(2)}
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

document.addEventListener("DOMContentLoaded", function () {
  const descuentoInput = document.getElementById("ventaDescuento");
  if (descuentoInput) {
    descuentoInput.addEventListener("input", function () {
      renderDetallesVenta();
    });
  }
});

// AGREGAR PAGO
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

// GUARDAR VENTA
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

// VER VENTA (detalle)
async function verVenta(id) {
  try {
    const venta = await api.getVenta(id);
    if (!venta) {
      showToast("Venta no encontrada", "error");
      return;
    }

    const cliente = clientesData.find((c) => c.id === venta.id_cliente);
    const nombreCliente = cliente ? cliente.nombre : "Sin cliente";

    let detallesHtml = venta.detalles
      .map((d) => {
        const producto = productosData.find((p) => p.id === d.id_producto);
        return `
                <tr>
                    <td>${producto ? producto.nombre : "--"}</td>
                    <td>${d.cantidad || 0}</td>
                    <td>Q${d.precio_unitario || 0}</td>
                    <td>Q${d.subtotal || 0}</td>
                </tr>
            `;
      })
      .join("");

    let pagosHtml = venta.pagos
      .map((p) => {
        const tipoPago = tiposPagoData.find((t) => t.id === p.id_tipo_pago);
        return `
                <tr>
                    <td>${tipoPago ? tipoPago.nombre : "--"}</td>
                    <td>Q${p.monto || 0}</td>
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
                        <strong>Cliente:</strong> ${nombreCliente}
                    </div>
                    <div class="col-md-6">
                        <strong>Fecha:</strong> ${venta.fecha ? new Date(venta.fecha).toLocaleString() : "--"}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Subtotal:</strong> Q${venta.subtotal || 0}
                    </div>
                    <div class="col-md-6">
                        <strong>Total:</strong> Q${venta.total || 0}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Descuento:</strong> ${venta.descuento_porcentaje || 0}%
                    </div>
                    <div class="col-md-6">
                        <strong>Estado:</strong> <span class="badge bg-success">${venta.estado || "Completada"}</span>
                    </div>
                </div>
                ${venta.observaciones ? `<div class="mb-3"><strong>Observaciones:</strong> ${venta.observaciones}</div>` : ""}

                <h6 class="fw-bold mt-3">Detalles</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>${detallesHtml || '<tr><td colspan="4" class="text-center">Sin detalles</td></tr>'}</tbody>
                    </table>
                </div>

                <h6 class="fw-bold mt-3">Pagos</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr><th>Tipo</th><th>Monto</th><th>Referencia</th></tr>
                        </thead>
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

// ANULAR VENTA
async function anularVenta(id) {
  if (
    !confirm(
      "¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.",
    )
  )
    return;

  try {
    await api.request(`/ventas/${id}`, "PATCH", { estado: "Anulada" });
    showToast("Venta anulada correctamente", "success");
    await loadVentasModule();
  } catch (error) {
    showToast(error.message || "Error al anular venta", "error");
  }
}

// FUNCIONES GLOBALES
window.loadVentasModule = loadVentasModule;
window.showCreateVentaModal = showCreateVentaModal;
window.agregarDetalleVenta = agregarDetalleVenta;
window.eliminarDetalleVenta = eliminarDetalleVenta;
window.agregarPagoVenta = agregarPagoVenta;
window.eliminarPagoVenta = eliminarPagoVenta;
window.saveVenta = saveVenta;
window.verVenta = verVenta;
window.anularVenta = anularVenta;
window.renderDetallesVenta = renderDetallesVenta;
window.renderPagosVenta = renderPagosVenta;
window.llenarSelectProductoDetalle = llenarSelectProductoDetalle;
window.llenarSelectTipoPago = llenarSelectTipoPago;
