// INVENTARIO

let movimientosData = [];
let tiposMovimientoData = [];
let inventarioFisicoData = [];
let alertasData = [];
let productosData = [];
let ubicacionesData = [];
let sububicacionesData = [];
let trasladosData = [];

// CARGA DEL MÓDULO
async function loadInventarioModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-warehouse me-2 text-secondary"></i>Inventario</h4>
            <div>
                <button class="btn btn-secondary btn-sm me-2" onclick="showCreateMovimientoModal()">
                    <i class="fas fa-exchange-alt me-1"></i>Movimiento
                </button>
                <button class="btn btn-outline-secondary btn-sm me-2" onclick="showCreateInventarioFisicoModal()">
                    <i class="fas fa-clipboard-list me-1"></i>Conteo Físico
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="showCreateTrasladoModal()">
                    <i class="fas fa-arrows-alt-h me-1"></i>Traslado
                </button>
            </div>
        </div>

        <ul class="nav nav-tabs mb-3" id="inventarioTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#movimientosTab">
                    <i class="fas fa-exchange-alt me-1"></i>Movimientos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#stockTab">
                    <i class="fas fa-boxes me-1"></i>Stock Actual
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#alertasTab">
                    <i class="fas fa-exclamation-triangle me-1"></i>Alertas
                    <span id="alertasBadge" class="badge bg-danger ms-1" style="display:none;">0</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#trasladosTab">
                    <i class="fas fa-arrows-alt-h me-1"></i>Traslados
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <div class="tab-pane fade show active" id="movimientosTab">
                <div id="movimientosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-secondary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando movimientos...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="stockTab">
                <div id="stockContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-secondary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando inventario físico...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="alertasTab">
                <div id="alertasContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-danger" role="status"></div>
                        <p class="mt-2 text-muted">Cargando alertas...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="trasladosTab">
                <div id="trasladosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-secondary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando traslados...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  try {
    const [
      movimientos,
      tiposMov,
      inventario,
      alertas,
      productos,
      ubicaciones,
      traslados,
    ] = await Promise.all([
      api.getMovimientosInventario().catch(() => []),
      api.getTiposMovimiento().catch(() => []),
      api.getInventarioFisico().catch(() => []),
      api.getAlertasStock().catch(() => []),
      api.getProductos().catch(() => []),
      api.request("/ubicaciones").catch(() => []),
      api.getTraslados().catch(() => []),
    ]);

    movimientosData = movimientos || [];
    tiposMovimientoData = tiposMov || [];
    inventarioFisicoData = inventario || [];
    alertasData = alertas || [];
    productosData = productos || [];
    ubicacionesData = ubicaciones || [];
    trasladosData = traslados || [];

    try {
      sububicacionesData = (await api.request("/sububicaciones")) || [];
    } catch (e) {
      sububicacionesData = [];
    }

    renderMovimientos(movimientosData);
    renderStock(inventarioFisicoData);
    renderAlertas(alertasData);
    renderTraslados(trasladosData);

    const badge = document.getElementById("alertasBadge");
    if (alertasData.length > 0) {
      badge.style.display = "inline";
      badge.textContent = alertasData.length;
    }
  } catch (error) {
    document.getElementById("movimientosContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// RENDERIZAR MOVIMIENTOS
function renderMovimientos(movimientos) {
  const container = document.getElementById("movimientosContainer");
  if (!container) return;

  if (!movimientos || movimientos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-exchange-alt fa-3x mb-3"></i>
                <p>No hay movimientos registrados</p>
                <button class="btn btn-secondary btn-sm" onclick="showCreateMovimientoModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Movimiento
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
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Referencia</th>
                    </tr>
                </thead>
                <tbody>
    `;

  movimientos.forEach((m) => {
    const tipo = tiposMovimientoData.find((t) => t.id === m.id_tipo_movimiento);
    const detalles = m.detalles || [];

    detalles.forEach((d) => {
      const producto = productosData.find((p) => p.id === d.id_producto);
      const origen = ubicacionesData.find(
        (u) => u.id === m.id_ubicacion_origen,
      );
      const destino = ubicacionesData.find(
        (u) => u.id === m.id_ubicacion_destino,
      );

      const signo = tipo ? (tipo.signo === 1 ? "+" : "-") : "";
      const clase = signo === "+" ? "text-success" : "text-danger";

      html += `
                <tr>
                    <td>${m.fecha ? new Date(m.fecha).toLocaleString() : "--"}</td>
                    <td><span class="badge bg-secondary">${tipo ? tipo.nombre : "--"}</span></td>
                    <td>${producto ? producto.nombre : "--"}</td>
                    <td class="${clase} fw-bold">${signo} ${d.cantidad || 0}</td>
                    <td>${origen ? origen.nombre : "--"}</td>
                    <td>${destino ? destino.nombre : "--"}</td>
                    <td>${m.referencia || "--"}</td>
                </tr>
            `;
    });
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

// RENDERIZAR STOCK ACTUAL
function renderStock(inventario) {
  const container = document.getElementById("stockContainer");
  if (!container) return;

  const stockMap = new Map();
  productosData.forEach((p) => {
    const item = inventario.find((i) => i.id_producto === p.id);
    stockMap.set(p.id, {
      producto: p,
      stock_sistema: p.stock_actual || 0,
      stock_real: item ? item.stock_real : null,
      diferencia: item ? item.diferencia : null,
      ultimo_conteo: item ? item.fecha : null,
    });
  });

  const stockArray = Array.from(stockMap.values());

  if (stockArray.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-boxes fa-3x mb-3"></i>
                <p>No hay productos en inventario</p>
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
                        <th>Producto</th>
                        <th>Stock Sistema</th>
                        <th>Stock Real</th>
                        <th>Diferencia</th>
                        <th>Último Conteo</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;

  stockArray.forEach((item) => {
    const p = item.producto;
    const diferencia = item.diferencia || 0;
    const estado =
      item.stock_real !== null && diferencia !== 0
        ? "warning"
        : p.stock_actual <= p.stock_minimo
          ? "danger"
          : "success";
    const estadoText =
      item.stock_real !== null && diferencia !== 0
        ? "Ajustar"
        : p.stock_actual <= p.stock_minimo
          ? "Stock Bajo"
          : "OK";

    html += `
            <tr>
                <td><code>${p.codigo || "--"}</code></td>
                <td>${p.nombre || "--"}</td>
                <td>${p.stock_actual || 0}</td>
                <td>${item.stock_real !== null ? item.stock_real : "--"}</td>
                <td class="${diferencia !== 0 ? "text-danger fw-bold" : ""}">
                    ${diferencia !== 0 ? diferencia : "--"}
                </td>
                <td>${item.ultimo_conteo ? new Date(item.ultimo_conteo).toLocaleDateString() : "--"}</td>
                <td>
                    <span class="badge bg-${estado}">${estadoText}</span>
                </td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
    `;

  container.innerHTML = html;
}

// RENDERIZAR ALERTAS
function renderAlertas(alertas) {
  const container = document.getElementById("alertasContainer");
  if (!container) return;

  if (!alertas || alertas.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-check-circle fa-3x mb-3 text-success"></i>
                <p>No hay alertas de stock</p>
            </div>
        `;
    return;
  }

  let html = `
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Producto</th>
                        <th>Mensaje</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;

  alertas.forEach((a) => {
    const producto = productosData.find((p) => p.id === a.id_producto);
    const leida = a.leida === 1;

    html += `
            <tr class="${!leida ? "table-warning" : ""}">
                <td>${a.fecha ? new Date(a.fecha).toLocaleString() : "--"}</td>
                <td><span class="badge ${a.tipo === "stock_minimo" ? "bg-danger" : "bg-warning"}">${a.tipo || "--"}</span></td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>${a.mensaje || "--"}</td>
                <td>
                    ${
                      !leida
                        ? `
                        <button class="btn btn-sm btn-outline-success" onclick="marcarAlertaLeida(${a.id})">
                            <i class="fas fa-check"></i> Marcar leída
                        </button>
                    `
                        : `
                        <span class="badge bg-success">Leída</span>
                    `
                    }
                </td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
    `;

  container.innerHTML = html;
}

// RENDERIZAR TRASLADOS
function renderTraslados(traslados) {
  const container = document.getElementById("trasladosContainer");
  if (!container) return;

  if (!traslados || traslados.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-arrows-alt-h fa-3x mb-3"></i>
                <p>No hay traslados registrados</p>
                <button class="btn btn-secondary btn-sm" onclick="showCreateTrasladoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Traslado
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
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Método</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  traslados.forEach((t) => {
    const producto = productosData.find((p) => p.id === t.id_producto);
    const origen = ubicacionesData.find((u) => u.id === t.id_ubicacion_origen);
    const destino = ubicacionesData.find(
      (u) => u.id === t.id_ubicacion_destino,
    );
    const estado = t.estado || "Pendiente";
    const estadoBadge =
      estado === "Completado"
        ? "bg-success"
        : estado === "En tránsito"
          ? "bg-warning"
          : "bg-secondary";

    html += `
            <tr>
                <td>${t.fecha ? new Date(t.fecha).toLocaleDateString() : "--"}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>${t.cantidad || 0}</td>
                <td>${origen ? origen.nombre : "--"}</td>
                <td>${destino ? destino.nombre : "--"}</td>
                <td>${t.metodo_traslado || "--"}</td>
                <td><span class="badge ${estadoBadge}">${estado}</span></td>
                <td>
                    ${
                      estado === "Pendiente"
                        ? `
                        <button class="btn btn-sm btn-outline-success" onclick="confirmarTraslado(${t.id})">
                            <i class="fas fa-check"></i>
                        </button>
                    `
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
    `;

  container.innerHTML = html;
}

// CREAR MOVIMIENTO - MODAL
function showCreateMovimientoModal() {
  const modal = document.getElementById("inventarioModal");
  if (!modal) {
    crearModalInventario();
    setTimeout(() => showCreateMovimientoModal(), 100);
    return;
  }

  const form = document.getElementById("inventarioForm");
  const title = document.getElementById("inventarioModalTitle");

  title.textContent = "Nuevo Movimiento de Inventario";
  form.reset();
  document.getElementById("inventarioId").value = "";
  document.getElementById("inventarioDetallesContainer").style.display =
    "block";

  const body = form.querySelector(".modal-body");
  body.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Tipo de Movimiento</label>
            <select class="form-select" id="invTipoMovimiento" required>
                <option value="">Seleccionar tipo</option>
                ${tiposMovimientoData.map((t) => `<option value="${t.id}">${t.nombre} (${t.signo === 1 ? "Entrada" : "Salida"})</option>`).join("")}
            </select>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Ubicación Origen</label>
                <select class="form-select" id="invUbicacionOrigen">
                    <option value="">Seleccionar origen</option>
                    ${ubicacionesData.map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Ubicación Destino</label>
                <select class="form-select" id="invUbicacionDestino">
                    <option value="">Seleccionar destino</option>
                    ${ubicacionesData.map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
                </select>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Referencia</label>
            <input type="text" class="form-control" id="invReferencia" placeholder="Ej: Ajuste, Devolución, etc." />
        </div>
        <div class="mb-3">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" id="invObservaciones" rows="2"></textarea>
        </div>
        <hr />
        <h6 class="fw-bold">Detalles</h6>
        <div id="invDetallesContainer">
            <div class="row g-2 align-items-end" id="invDetalleRow">
                <div class="col-md-5">
                    <label class="form-label">Producto</label>
                    <select class="form-select inv-detalle-producto">
                        <option value="">Seleccionar producto</option>
                        ${productosData.map((p) => `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`).join("")}
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Cantidad</label>
                    <input type="number" step="0.01" class="form-control inv-detalle-cantidad" value="1" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">Costo Unitario</label>
                    <input type="number" step="0.01" class="form-control inv-detalle-costo" />
                </div>
                <div class="col-md-1">
                    <button class="btn btn-success btn-sm mt-2" onclick="agregarDetalleInventario(event)">+</button>
                </div>
            </div>
        </div>
        <div id="invDetallesList" class="mt-2"></div>
        <button type="submit" class="btn btn-secondary w-100 mt-3" onclick="saveMovimientoInventario(event)">Guardar Movimiento</button>
    `;

  window.invDetallesTemp = [];

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// AGREGAR DETALLE DE INVENTARIO
function agregarDetalleInventario(event) {
  event.preventDefault();

  const row = document.getElementById("invDetalleRow");
  const productSelect = row.querySelector(".inv-detalle-producto");
  const cantidadInput = row.querySelector(".inv-detalle-cantidad");
  const costoInput = row.querySelector(".inv-detalle-costo");

  const id_producto = parseInt(productSelect.value);
  const cantidad = parseFloat(cantidadInput.value) || 1;
  const costo_unitario = parseFloat(costoInput.value) || null;

  if (!id_producto) {
    showToast("Selecciona un producto", "error");
    return;
  }

  const producto = productosData.find((p) => p.id === id_producto);
  if (!producto) {
    showToast("Producto no encontrado", "error");
    return;
  }

  if (!window.invDetallesTemp) window.invDetallesTemp = [];

  window.invDetallesTemp.push({
    id_producto: id_producto,
    cantidad: cantidad,
    costo_unitario: costo_unitario,
    producto: producto,
  });

  renderDetallesInventario();
  cantidadInput.value = 1;
  costoInput.value = "";
  productSelect.value = "";
}

function renderDetallesInventario() {
  const container = document.getElementById("invDetallesList");
  if (!window.invDetallesTemp || window.invDetallesTemp.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay productos agregados</p>';
    return;
  }

  let html = '<ul class="list-group">';
  window.invDetallesTemp.forEach((d, index) => {
    html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${d.producto.nombre}</strong>
                    <span class="text-muted small"> x ${d.cantidad}</span>
                    ${d.costo_unitario ? `<span class="text-muted small"> Q${d.costo_unitario} c/u</span>` : ""}
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="eliminarDetalleInventario(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </li>
        `;
  });
  html += "</ul>";
  container.innerHTML = html;
}

function eliminarDetalleInventario(index) {
  if (window.invDetallesTemp) {
    window.invDetallesTemp.splice(index, 1);
    renderDetallesInventario();
  }
}

// GUARDAR MOVIMIENTO DE INVENTARIO
async function saveMovimientoInventario(event) {
  event.preventDefault();

  const id_tipo_movimiento = parseInt(
    document.getElementById("invTipoMovimiento").value,
  );
  const id_ubicacion_origen =
    parseInt(document.getElementById("invUbicacionOrigen").value) || null;
  const id_ubicacion_destino =
    parseInt(document.getElementById("invUbicacionDestino").value) || null;
  const referencia = document.getElementById("invReferencia").value || null;
  const observaciones =
    document.getElementById("invObservaciones").value || null;
  const id_usuario = getCurrentUser()?.id || 1;

  if (!id_tipo_movimiento) {
    showToast("Selecciona un tipo de movimiento", "error");
    return;
  }
  if (!window.invDetallesTemp || window.invDetallesTemp.length === 0) {
    showToast("Agrega al menos un producto", "error");
    return;
  }

  const data = {
    id_usuario: id_usuario,
    id_tipo_movimiento: id_tipo_movimiento,
    id_ubicacion_origen: id_ubicacion_origen,
    id_ubicacion_destino: id_ubicacion_destino,
    referencia: referencia,
    observaciones: observaciones,
    detalles: window.invDetallesTemp.map((d) => ({
      id_producto: d.id_producto,
      cantidad: d.cantidad,
      costo_unitario: d.costo_unitario,
    })),
  };

  try {
    await api.createMovimientoInventario(data);
    showToast("Movimiento registrado correctamente", "success");
    bootstrap.Modal.getInstance(
      document.getElementById("inventarioModal"),
    ).hide();
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar movimiento", "error");
  }
}

// CREAR INVENTARIO FÍSICO - MODAL
function showCreateInventarioFisicoModal() {
  const modal = document.getElementById("inventarioModal");
  if (!modal) {
    crearModalInventario();
    setTimeout(() => showCreateInventarioFisicoModal(), 100);
    return;
  }

  const form = document.getElementById("inventarioForm");
  const title = document.getElementById("inventarioModalTitle");

  title.textContent = "Conteo Físico de Inventario";
  form.reset();
  document.getElementById("inventarioId").value = "";
  document.getElementById("inventarioDetallesContainer").style.display = "none";

  const body = form.querySelector(".modal-body");
  body.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Producto</label>
            <select class="form-select" id="invFisicoProducto" required>
                <option value="">Seleccionar producto</option>
                ${productosData.map((p) => `<option value="${p.id}">${p.codigo} - ${p.nombre} (Stock: ${p.stock_actual || 0})</option>`).join("")}
            </select>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Ubicación</label>
                <select class="form-select" id="invFisicoUbicacion">
                    <option value="">Seleccionar ubicación</option>
                    ${ubicacionesData.map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Stock Real</label>
                <input type="number" step="0.01" class="form-control" id="invFisicoStockReal" required />
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" id="invFisicoObservaciones" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-secondary w-100" onclick="saveInventarioFisico(event)">Guardar Conteo</button>
    `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveInventarioFisico(event) {
  event.preventDefault();

  const id_producto = parseInt(
    document.getElementById("invFisicoProducto").value,
  );
  const id_ubicacion =
    parseInt(document.getElementById("invFisicoUbicacion").value) || null;
  const stock_real = parseFloat(
    document.getElementById("invFisicoStockReal").value,
  );
  const observaciones =
    document.getElementById("invFisicoObservaciones").value || null;
  const id_usuario = getCurrentUser()?.id || 1;

  if (!id_producto) {
    showToast("Selecciona un producto", "error");
    return;
  }
  if (!stock_real || stock_real < 0) {
    showToast("Ingresa un stock real válido", "error");
    return;
  }

  const data = {
    id_producto: id_producto,
    id_ubicacion: id_ubicacion,
    stock_real: stock_real,
    id_usuario: id_usuario,
    observaciones: observaciones,
  };

  try {
    await api.request("/inventario-fisico", "POST", data);
    showToast("Conteo físico registrado correctamente", "success");
    bootstrap.Modal.getInstance(
      document.getElementById("inventarioModal"),
    ).hide();
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar conteo", "error");
  }
}

// CREAR TRASLADO - MODAL
function showCreateTrasladoModal() {
  const modal = document.getElementById("inventarioModal");
  if (!modal) {
    crearModalInventario();
    setTimeout(() => showCreateTrasladoModal(), 100);
    return;
  }

  const form = document.getElementById("inventarioForm");
  const title = document.getElementById("inventarioModalTitle");

  title.textContent = "Nuevo Traslado entre Sucursales";
  form.reset();
  document.getElementById("inventarioId").value = "";
  document.getElementById("inventarioDetallesContainer").style.display = "none";

  const body = form.querySelector(".modal-body");
  body.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Producto</label>
            <select class="form-select" id="trasladoProducto" required>
                <option value="">Seleccionar producto</option>
                ${productosData.map((p) => `<option value="${p.id}">${p.codigo} - ${p.nombre} (Stock: ${p.stock_actual || 0})</option>`).join("")}
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Cantidad</label>
            <input type="number" step="0.01" class="form-control" id="trasladoCantidad" required />
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Ubicación Origen</label>
                <select class="form-select" id="trasladoUbicacionOrigen" required>
                    <option value="">Seleccionar origen</option>
                    ${ubicacionesData.map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Ubicación Destino</label>
                <select class="form-select" id="trasladoUbicacionDestino" required>
                    <option value="">Seleccionar destino</option>
                    ${ubicacionesData.map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
                </select>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Método de Traslado</label>
            <select class="form-select" id="trasladoMetodo" required>
                <option value="">Seleccionar método</option>
                <option value="Uber Moto">Uber Moto</option>
                <option value="Empleado Interno">Empleado Interno</option>
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" id="trasladoObservaciones" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-secondary w-100" onclick="saveTraslado(event)">Guardar Traslado</button>
    `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveTraslado(event) {
  event.preventDefault();

  const id_producto = parseInt(
    document.getElementById("trasladoProducto").value,
  );
  const cantidad = parseFloat(
    document.getElementById("trasladoCantidad").value,
  );
  const id_ubicacion_origen = parseInt(
    document.getElementById("trasladoUbicacionOrigen").value,
  );
  const id_ubicacion_destino = parseInt(
    document.getElementById("trasladoUbicacionDestino").value,
  );
  const metodo_traslado = document.getElementById("trasladoMetodo").value;
  const observaciones =
    document.getElementById("trasladoObservaciones").value || null;
  const id_usuario_autoriza = getCurrentUser()?.id || 1;

  if (
    !id_producto ||
    !cantidad ||
    !id_ubicacion_origen ||
    !id_ubicacion_destino ||
    !metodo_traslado
  ) {
    showToast("Todos los campos son obligatorios", "error");
    return;
  }

  const data = {
    id_producto: id_producto,
    cantidad: cantidad,
    id_ubicacion_origen: id_ubicacion_origen,
    id_ubicacion_destino: id_ubicacion_destino,
    metodo_traslado: metodo_traslado,
    id_usuario_autoriza: id_usuario_autoriza,
    observaciones: observaciones,
  };

  try {
    await api.request("/traslados", "POST", data);
    showToast("Traslado registrado correctamente", "success");
    bootstrap.Modal.getInstance(
      document.getElementById("inventarioModal"),
    ).hide();
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar traslado", "error");
  }
}

// MARCAR ALERTA COMO LEÍDA
async function marcarAlertaLeida(id) {
  try {
    await api.request(`/alertas/${id}/leer`, "PATCH");
    showToast("Alerta marcada como leída", "success");
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al marcar alerta", "error");
  }
}

// CONFIRMAR TRASLADO
async function confirmarTraslado(id) {
  if (!confirm("¿Confirmar recepción de este traslado?")) return;

  try {
    await api.request(`/traslados/${id}/recibir`, "PATCH");
    showToast("Traslado confirmado", "success");
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al confirmar traslado", "error");
  }
}

// CREAR MODAL DE INVENTARIO
function crearModalInventario() {
  const modalHtml = `
        <div class="modal fade" id="inventarioModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="inventarioModalTitle">Inventario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="inventarioForm">
                            <input type="hidden" id="inventarioId" />
                            <div id="inventarioDetallesContainer"></div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  window.invDetallesTemp = [];
}

// EXPONER FUNCIONES GLOBALES
window.loadInventarioModule = loadInventarioModule;
window.showCreateMovimientoModal = showCreateMovimientoModal;
window.showCreateInventarioFisicoModal = showCreateInventarioFisicoModal;
window.showCreateTrasladoModal = showCreateTrasladoModal;
window.agregarDetalleInventario = agregarDetalleInventario;
window.eliminarDetalleInventario = eliminarDetalleInventario;
window.saveMovimientoInventario = saveMovimientoInventario;
window.saveInventarioFisico = saveInventarioFisico;
window.saveTraslado = saveTraslado;
window.marcarAlertaLeida = marcarAlertaLeida;
window.confirmarTraslado = confirmarTraslado;
