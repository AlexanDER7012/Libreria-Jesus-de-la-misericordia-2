// COMPRAS

let comprasData = [];
let proveedoresData = [];
let productosData = [];
let ubicacionesData = [];
let tiposPagoData = [];
let compraDetallesTemp = [];

// CARGA DEL MÓDULO
async function loadComprasModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-truck me-2 text-info"></i>Compras</h4>
            <div>
                <button class="btn btn-info btn-sm me-2" onclick="showCreateCompraModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Compra
                </button>
                <button class="btn btn-outline-info btn-sm" onclick="cargarModulo('proveedores')">
                    <i class="fas fa-building me-1"></i>Proveedores
                </button>
            </div>
        </div>
        <div id="comprasTableContainer">
            <div class="text-center py-5">
                <div class="spinner-border text-info" role="status"></div>
                <p class="mt-2 text-muted">Cargando compras...</p>
            </div>
        </div>
    `;

  // Cargar datos en paralelo
  try {
    const [compras, proveedores, productos, ubicaciones, tiposPago] =
      await Promise.all([
        api.getCompras().catch(() => []),
        api.getProveedores().catch(() => []),
        api.getProductos().catch(() => []),
        api.request("/ubicaciones").catch(() => []),
        api.getTiposPago().catch(() => []),
      ]);

    comprasData = compras || [];
    proveedoresData = proveedores || [];
    productosData = productos || [];
    ubicacionesData = ubicaciones || [];
    tiposPagoData = tiposPago || [];

    renderComprasTable(comprasData);
  } catch (error) {
    document.getElementById("comprasTableContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// RENDERIZAR TABLA DE COMPRAS
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
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  compras.forEach((c) => {
    const proveedor = proveedoresData.find((p) => p.id === c.id_proveedor);
    const nombreProveedor = proveedor ? proveedor.nombre : "--";
    const estado = c.estado || "Pendiente";
    const estadoBadge =
      estado === "Completada"
        ? "bg-success"
        : estado === "Pendiente"
          ? "bg-warning"
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
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="verCompra(${c.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="recibirCompra(${c.id})">
                        <i class="fas fa-check"></i>
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

// CREAR COMPRA - MODAL
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

  // Llenar selects
  llenarSelectProveedor();
  llenarSelectUbicacionCompra();
  llenarSelectProductoCompra();

  // Limpiar lista de detalles
  document.getElementById("compraDetallesList").innerHTML = "";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// LLENAR SELECTS
function llenarSelectProveedor() {
  const select = document.getElementById("compraProveedor");
  select.innerHTML = '<option value="">Seleccionar proveedor</option>';
  proveedoresData.forEach((p) => {
    select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
  });
}

function llenarSelectUbicacionCompra() {
  const select = document.getElementById("compraUbicacion");
  select.innerHTML = '<option value="">Seleccionar ubicación</option>';
  ubicacionesData.forEach((u) => {
    select.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
  });
}

function llenarSelectProductoCompra() {
  const selects = document.querySelectorAll(".compra-detalle-producto");
  selects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    productosData.forEach((p) => {
      select.innerHTML += `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`;
    });
  });
}

// AGREGAR DETALLE DE COMPRA
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

  const producto = productosData.find((p) => p.id === id_producto);
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

  // Actualizar IVA y total
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

// Actualizar total al cambiar IVA
document.addEventListener("DOMContentLoaded", function () {
  const ivaInput = document.getElementById("compraIva");
  if (ivaInput) {
    ivaInput.addEventListener("input", function () {
      renderDetallesCompra();
    });
  }
});

// GUARDAR COMPRA
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
    const result = await api.createCompra(data);
    showToast(`Compra #${result.id} creada correctamente`, "success");
    bootstrap.Modal.getInstance(document.getElementById("compraModal")).hide();
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al crear compra", "error");
  }
}

// VER COMPRA (detalle)
async function verCompra(id) {
  try {
    const compra = await api.request(`/compras/${id}`);
    if (!compra) {
      showToast("Compra no encontrada", "error");
      return;
    }

    const proveedor = proveedoresData.find((p) => p.id === compra.id_proveedor);
    const nombreProveedor = proveedor ? proveedor.nombre : "--";

    let detallesHtml = compra.detalles
      .map((d) => {
        const producto = productosData.find((p) => p.id === d.id_producto);
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

// RECIBIR COMPRA
async function recibirCompra(id) {
  if (
    !confirm(
      "¿Confirmar recepción de esta compra? Se actualizará el inventario.",
    )
  )
    return;

  try {
    await api.request(`/compras/${id}/recibir`, "PATCH");
    showToast("Compra recibida correctamente", "success");
    await loadComprasModule();
  } catch (error) {
    showToast(error.message || "Error al recibir compra", "error");
  }
}

// FUNCIONES GLOBALES
window.loadComprasModule = loadComprasModule;
window.showCreateCompraModal = showCreateCompraModal;
window.agregarDetalleCompra = agregarDetalleCompra;
window.eliminarDetalleCompra = eliminarDetalleCompra;
window.saveCompra = saveCompra;
window.verCompra = verCompra;
window.recibirCompra = recibirCompra;
window.renderDetallesCompra = renderDetallesCompra;
window.llenarSelectProductoCompra = llenarSelectProductoCompra;
