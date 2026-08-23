// inventario.js

let movimientosData = [];
let tiposMovimientoData = [];
let inventarioFisicoData = [];
let trasladosData = [];
let alertasData = [];

// CARGA DEL MÓDULO PRINCIPAL
async function loadInventarioModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-warehouse me-2 text-secondary"></i>Inventario</h4>
            <div>
                <button class="btn btn-primary btn-sm me-2" onclick="showMovimientoModal()">
                    <i class="fas fa-exchange-alt me-1"></i>Movimiento
                </button>
                <button class="btn btn-warning btn-sm me-2" onclick="showConteoFisicoModal()">
                    <i class="fas fa-clipboard-list me-1"></i>Conteo Físico
                </button>
                <button class="btn btn-info btn-sm" onclick="showTrasladoModal()">
                    <i class="fas fa-arrows-alt-h me-1"></i>Traslado
                </button>
            </div>
        </div>

        <ul class="nav nav-tabs mb-3" id="inventarioTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" id="tab-movimientos" data-bs-toggle="tab"
                        data-bs-target="#panel-movimientos" type="button" role="tab">
                    <i class="fas fa-exchange-alt me-1"></i>Movimientos
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-conteo" data-bs-toggle="tab"
                        data-bs-target="#panel-conteo" type="button" role="tab">
                    <i class="fas fa-clipboard-list me-1"></i>Conteo Físico
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-traslados" data-bs-toggle="tab"
                        data-bs-target="#panel-traslados" type="button" role="tab">
                    <i class="fas fa-arrows-alt-h me-1"></i>Traslados
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" id="tab-alertas" data-bs-toggle="tab"
                        data-bs-target="#panel-alertas" type="button" role="tab">
                    <i class="fas fa-exclamation-triangle me-1"></i>Alertas
                </button>
            </li>
        </ul>

        <div class="tab-content" id="inventarioTabContent">
            <!-- PANEL: MOVIMIENTOS -->
            <div class="tab-pane fade show active" id="panel-movimientos" role="tabpanel">
                <div id="movimientosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando movimientos...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: CONTEO FÍSICO -->
            <div class="tab-pane fade" id="panel-conteo" role="tabpanel">
                <div id="conteoContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted">Cargando conteos físicos...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: TRASLADOS -->
            <div class="tab-pane fade" id="panel-traslados" role="tabpanel">
                <div id="trasladosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status"></div>
                        <p class="mt-2 text-muted">Cargando traslados...</p>
                    </div>
                </div>
            </div>

            <!-- PANEL: ALERTAS -->
            <div class="tab-pane fade" id="panel-alertas" role="tabpanel">
                <div id="alertasContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-danger" role="status"></div>
                        <p class="mt-2 text-muted">Cargando alertas...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Crear modales si no existen
  crearModalesInventario();

  try {
    const [movimientos, tiposMov, conteo, traslados, alertas] =
      await Promise.all([
        api.getMovimientosInventario().catch(() => []),
        api.getTiposMovimiento().catch(() => []),
        api.getInventarioFisico().catch(() => []),
        api.getTraslados().catch(() => []),
        api.getAlertasStock().catch(() => []),
      ]);

    movimientosData = movimientos || [];
    tiposMovimientoData = tiposMov || [];
    inventarioFisicoData = conteo || [];
    trasladosData = traslados || [];
    alertasData = alertas || [];

    renderMovimientos(movimientosData);
    renderConteoFisico(inventarioFisicoData);
    renderTraslados(trasladosData);
    renderAlertas(alertasData);

    // Poblar selects
    populateSelectsInventario();
  } catch (error) {
    console.error("Error cargando inventario:", error);
    document.getElementById("movimientosContainer").innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar datos: ${error.message}
            </div>
        `;
  }
}

// POBLAR SELECTS
function populateSelectsInventario() {
  // Productos
  const productSelects = document.querySelectorAll(".inv-producto-select");
  productSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    (window.productosData || []).forEach((p) => {
      select.innerHTML += `<option value="${p.id}">${p.codigo} - ${p.nombre} (Stock: ${p.stock_actual || 0})</option>`;
    });
  });

  // Tipos de movimiento
  const tipoSelects = document.querySelectorAll(".inv-tipo-movimiento");
  tipoSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar tipo</option>';
    tiposMovimientoData.forEach((t) => {
      select.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });
  });

  // Ubicaciones
  const ubicacionSelects = document.querySelectorAll(".inv-ubicacion-select");
  ubicacionSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar ubicación</option>';
    (window.ubicacionesData || []).forEach((u) => {
      select.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
    });
  });
}

// CREAR MODALES
function crearModalesInventario() {
  // Modal Movimiento
  if (!document.getElementById("movimientoModal")) {
    const html = `
            <div class="modal fade" id="movimientoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nuevo Movimiento de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="movimientoForm" novalidate>
                                <input type="hidden" id="movimientoId" />
                                <div class="mb-3">
                                    <label class="form-label">Producto *</label>
                                    <select class="form-select inv-producto-select" id="movimientoProducto" required></select>
                                    <div class="invalid-feedback" id="movimientoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Tipo de Movimiento *</label>
                                    <select class="form-select inv-tipo-movimiento" id="movimientoTipo" required></select>
                                    <div class="invalid-feedback" id="movimientoTipoError">Seleccione un tipo</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Cantidad *</label>
                                    <input type="number" step="0.01" class="form-control" id="movimientoCantidad" required />
                                    <div class="invalid-feedback" id="movimientoCantidadError">Ingrese una cantidad válida</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Motivo / Observación</label>
                                    <textarea class="form-control" id="movimientoObservacion" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Guardar Movimiento</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("movimientoForm").onsubmit = saveMovimiento;
  }

  // Modal Conteo Físico
  if (!document.getElementById("conteoModal")) {
    const html = `
            <div class="modal fade" id="conteoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Conteo Físico de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="conteoForm" novalidate>
                                <input type="hidden" id="conteoId" />
                                <div class="mb-3">
                                    <label class="form-label">Producto *</label>
                                    <select class="form-select inv-producto-select" id="conteoProducto" required></select>
                                    <div class="invalid-feedback" id="conteoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación *</label>
                                    <select class="form-select inv-ubicacion-select" id="conteoUbicacion" required></select>
                                    <div class="invalid-feedback" id="conteoUbicacionError">Seleccione una ubicación</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Cantidad Contada *</label>
                                    <input type="number" step="0.01" class="form-control" id="conteoCantidad" required />
                                    <div class="invalid-feedback" id="conteoCantidadError">Ingrese una cantidad válida</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Stock en Sistema</label>
                                    <input type="number" step="0.01" class="form-control" id="conteoStockSistema" readonly />
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="conteoObservacion" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-warning w-100">Guardar Conteo</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("conteoForm").onsubmit = saveConteoFisico;

    // Actualizar stock al seleccionar producto
    document
      .getElementById("conteoProducto")
      .addEventListener("change", function () {
        const producto = (window.productosData || []).find(
          (p) => p.id === parseInt(this.value),
        );
        document.getElementById("conteoStockSistema").value = producto
          ? producto.stock_actual || 0
          : 0;
      });
  }

  // Modal Traslado
  if (!document.getElementById("trasladoModal")) {
    const html = `
            <div class="modal fade" id="trasladoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Traslado de Inventario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="trasladoForm" novalidate>
                                <input type="hidden" id="trasladoId" />
                                <div class="mb-3">
                                    <label class="form-label">Producto *</label>
                                    <select class="form-select inv-producto-select" id="trasladoProducto" required></select>
                                    <div class="invalid-feedback" id="trasladoProductoError">Seleccione un producto</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación Origen *</label>
                                    <select class="form-select inv-ubicacion-select" id="trasladoOrigen" required></select>
                                    <div class="invalid-feedback" id="trasladoOrigenError">Seleccione una ubicación</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Ubicación Destino *</label>
                                    <select class="form-select inv-ubicacion-select" id="trasladoDestino" required></select>
                                    <div class="invalid-feedback" id="trasladoDestinoError">Seleccione una ubicación</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Cantidad *</label>
                                    <input type="number" step="0.01" class="form-control" id="trasladoCantidad" required />
                                    <div class="invalid-feedback" id="trasladoCantidadError">Ingrese una cantidad válida</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="trasladoObservacion" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-info w-100">Guardar Traslado</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("trasladoForm").onsubmit = saveTraslado;
  }
}

// FUNCIONES PARA ABRIR MODALES
function showMovimientoModal() {
  const modal = document.getElementById("movimientoModal");
  if (!modal) {
    crearModalesInventario();
    setTimeout(() => showMovimientoModal(), 100);
    return;
  }

  document.getElementById("movimientoForm").reset();
  document.getElementById("movimientoId").value = "";
  limpiarErroresFormulario("movimientoForm");
  populateSelectsInventario();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function showConteoFisicoModal() {
  const modal = document.getElementById("conteoModal");
  if (!modal) {
    crearModalesInventario();
    setTimeout(() => showConteoFisicoModal(), 100);
    return;
  }

  document.getElementById("conteoForm").reset();
  document.getElementById("conteoId").value = "";
  document.getElementById("conteoStockSistema").value = 0;
  limpiarErroresFormulario("conteoForm");
  populateSelectsInventario();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function showTrasladoModal() {
  const modal = document.getElementById("trasladoModal");
  if (!modal) {
    crearModalesInventario();
    setTimeout(() => showTrasladoModal(), 100);
    return;
  }

  document.getElementById("trasladoForm").reset();
  document.getElementById("trasladoId").value = "";
  limpiarErroresFormulario("trasladoForm");
  populateSelectsInventario();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// GUARDAR MOVIMIENTO
async function saveMovimiento(event) {
  event.preventDefault();

  let valid = true;

  const idProducto = parseInt(
    document.getElementById("movimientoProducto").value,
  );
  if (!idProducto) {
    mostrarErrorCampo("movimientoProducto", "Seleccione un producto");
    valid = false;
  } else {
    limpiarErrorCampo("movimientoProducto");
  }

  const idTipo = parseInt(document.getElementById("movimientoTipo").value);
  if (!idTipo) {
    mostrarErrorCampo("movimientoTipo", "Seleccione un tipo de movimiento");
    valid = false;
  } else {
    limpiarErrorCampo("movimientoTipo");
  }

  const cantidad = parseFloat(
    document.getElementById("movimientoCantidad").value,
  );
  if (!cantidad || cantidad <= 0) {
    mostrarErrorCampo("movimientoCantidad", "Ingrese una cantidad válida");
    valid = false;
  } else {
    limpiarErrorCampo("movimientoCantidad");
  }

  if (!valid) return;

  const data = {
    id_producto: idProducto,
    id_tipo_movimiento: idTipo,
    cantidad: cantidad,
    observacion:
      document.getElementById("movimientoObservacion").value.trim() || null,
  };

  try {
    const result = await api.createMovimientoInventario(data);
    showToast(`Movimiento #${result.id} registrado correctamente`, "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("movimientoModal"),
    );
    if (modal) modal.hide();

    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar movimiento", "error");
  }
}

// GUARDAR CONTEO FÍSICO
async function saveConteoFisico(event) {
  event.preventDefault();

  let valid = true;

  const idProducto = parseInt(document.getElementById("conteoProducto").value);
  if (!idProducto) {
    mostrarErrorCampo("conteoProducto", "Seleccione un producto");
    valid = false;
  } else {
    limpiarErrorCampo("conteoProducto");
  }

  const idUbicacion = parseInt(
    document.getElementById("conteoUbicacion").value,
  );
  if (!idUbicacion) {
    mostrarErrorCampo("conteoUbicacion", "Seleccione una ubicación");
    valid = false;
  } else {
    limpiarErrorCampo("conteoUbicacion");
  }

  const cantidad = parseFloat(document.getElementById("conteoCantidad").value);
  if (!cantidad || cantidad < 0) {
    mostrarErrorCampo("conteoCantidad", "Ingrese una cantidad válida");
    valid = false;
  } else {
    limpiarErrorCampo("conteoCantidad");
  }

  if (!valid) return;

  const data = {
    id_producto: idProducto,
    id_ubicacion: idUbicacion,
    cantidad_contada: cantidad,
    observaciones:
      document.getElementById("conteoObservacion").value.trim() || null,
  };

  try {
    await api.request("/inventario-fisico", "POST", data);
    showToast("Conteo físico registrado correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("conteoModal"),
    );
    if (modal) modal.hide();

    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar conteo", "error");
  }
}

// GUARDAR TRASLADO
async function saveTraslado(event) {
  event.preventDefault();

  let valid = true;

  const idProducto = parseInt(
    document.getElementById("trasladoProducto").value,
  );
  if (!idProducto) {
    mostrarErrorCampo("trasladoProducto", "Seleccione un producto");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoProducto");
  }

  const idOrigen = parseInt(document.getElementById("trasladoOrigen").value);
  if (!idOrigen) {
    mostrarErrorCampo("trasladoOrigen", "Seleccione una ubicación origen");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoOrigen");
  }

  const idDestino = parseInt(document.getElementById("trasladoDestino").value);
  if (!idDestino) {
    mostrarErrorCampo("trasladoDestino", "Seleccione una ubicación destino");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoDestino");
  }

  if (idOrigen === idDestino) {
    mostrarErrorCampo(
      "trasladoDestino",
      "Origen y destino no pueden ser iguales",
    );
    valid = false;
  }

  const cantidad = parseFloat(
    document.getElementById("trasladoCantidad").value,
  );
  if (!cantidad || cantidad <= 0) {
    mostrarErrorCampo("trasladoCantidad", "Ingrese una cantidad válida");
    valid = false;
  } else {
    limpiarErrorCampo("trasladoCantidad");
  }

  if (!valid) return;

  const data = {
    id_producto: idProducto,
    id_ubicacion_origen: idOrigen,
    id_ubicacion_destino: idDestino,
    cantidad: cantidad,
    observaciones:
      document.getElementById("trasladoObservacion").value.trim() || null,
  };

  try {
    await api.request("/traslados", "POST", data);
    showToast("Traslado registrado correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("trasladoModal"),
    );
    if (modal) modal.hide();

    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al registrar traslado", "error");
  }
}

// RENDER: MOVIMIENTOS
function renderMovimientos(movimientos) {
  const container = document.getElementById("movimientosContainer");
  if (!container) return;

  if (!movimientos || movimientos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exchange-alt fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay movimientos registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showMovimientoModal()">
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
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Stock Actual</th>
                        <th>Fecha</th>
                        <th>Observación</th>
                    </tr>
                </thead>
                <tbody>
    `;

  movimientos.forEach((m) => {
    const producto = (window.productosData || []).find(
      (p) => p.id === m.id_producto,
    );
    const tipo = tiposMovimientoData.find((t) => t.id === m.id_tipo_movimiento);
    const esEntrada =
      tipo && tipo.nombre && tipo.nombre.toLowerCase().includes("entrada");

    html += `
            <tr>
                <td>${m.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>
                    <span class="badge ${esEntrada ? "bg-success" : "bg-danger"}">
                        ${tipo ? tipo.nombre : "--"}
                    </span>
                </td>
                <td class="${esEntrada ? "text-success" : "text-danger"} fw-bold">
                    ${esEntrada ? "+" : "-"} ${m.cantidad || 0}
                </td>
                <td>${m.stock_actual || 0}</td>
                <td>${m.fecha ? new Date(m.fecha).toLocaleString() : "--"}</td>
                <td>${m.observacion || "--"}</td>
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

// RENDER: CONTEO FÍSICO
function renderConteoFisico(conteos) {
  const container = document.getElementById("conteoContainer");
  if (!container) return;

  if (!conteos || conteos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay conteos físicos registrados</p>
                <button class="btn btn-warning btn-sm" onclick="showConteoFisicoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Conteo
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
                        <th>Producto</th>
                        <th>Ubicación</th>
                        <th>Cantidad Contada</th>
                        <th>Stock Sistema</th>
                        <th>Diferencia</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
    `;

  conteos.forEach((c) => {
    const producto = (window.productosData || []).find(
      (p) => p.id === c.id_producto,
    );
    const ubicacion = (window.ubicacionesData || []).find(
      (u) => u.id === c.id_ubicacion,
    );
    const diferencia = (c.cantidad_contada || 0) - (c.stock_sistema || 0);
    const esDiferencia = diferencia !== 0;

    html += `
            <tr>
                <td>${c.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>${ubicacion ? ubicacion.nombre || ubicacion.id : "--"}</td>
                <td>${c.cantidad_contada || 0}</td>
                <td>${c.stock_sistema || 0}</td>
                <td class="${esDiferencia ? (diferencia > 0 ? "text-success" : "text-danger") : ""}">
                    ${diferencia !== 0 ? (diferencia > 0 ? "+" : "") + diferencia : "0"}
                </td>
                <td>${c.fecha ? new Date(c.fecha).toLocaleString() : "--"}</td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${conteos.length} conteos</small>
        </div>
    `;

  container.innerHTML = html;
}

// RENDER: TRASLADOS
function renderTraslados(traslados) {
  const container = document.getElementById("trasladosContainer");
  if (!container) return;

  if (!traslados || traslados.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-arrows-alt-h fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay traslados registrados</p>
                <button class="btn btn-info btn-sm" onclick="showTrasladoModal()">
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
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
    `;

  traslados.forEach((t) => {
    const producto = (window.productosData || []).find(
      (p) => p.id === t.id_producto,
    );
    const origen = (window.ubicacionesData || []).find(
      (u) => u.id === t.id_ubicacion_origen,
    );
    const destino = (window.ubicacionesData || []).find(
      (u) => u.id === t.id_ubicacion_destino,
    );
    const estado = t.estado || "Pendiente";

    html += `
            <tr>
                <td>${t.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td>${origen ? origen.nombre || origen.id : "--"}</td>
                <td>${destino ? destino.nombre || destino.id : "--"}</td>
                <td>${t.cantidad || 0}</td>
                <td>
                    <span class="badge ${estado === "Recibido" ? "bg-success" : "bg-warning"}">
                        ${estado}
                    </span>
                    ${
                      estado === "Pendiente"
                        ? `
                        <button class="btn btn-sm btn-outline-success ms-1" onclick="recibirTraslado(${t.id})">
                            <i class="fas fa-check"></i>
                        </button>
                    `
                        : ""
                    }
                </td>
                <td>${t.fecha ? new Date(t.fecha).toLocaleString() : "--"}</td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${traslados.length} traslados</small>
        </div>
    `;

  container.innerHTML = html;
}

// RECIBIR TRASLADO
async function recibirTraslado(id) {
  const confirmado = await mostrarConfirmacion(
    "Recibir Traslado",
    "¿Confirmar recepción del traslado? Esto actualizará el stock en la ubicación destino.",
  );

  if (!confirmado) return;

  try {
    await api.request(`/traslados/${id}/recibir`, "PATCH");
    showToast("Traslado recibido correctamente", "success");
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al recibir traslado", "error");
  }
}

// RENDER: ALERTAS
function renderAlertas(alertas) {
  const container = document.getElementById("alertasContainer");
  if (!container) return;

  if (!alertas || alertas.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <p class="text-muted">No hay alertas de stock</p>
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
                        <th>Producto</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  alertas.forEach((a) => {
    const producto = (window.productosData || []).find(
      (p) => p.id === a.id_producto,
    );
    const leida = a.leida !== 0;

    html += `
            <tr>
                <td>${a.id}</td>
                <td>${producto ? producto.nombre : "--"}</td>
                <td class="text-danger fw-bold">${a.stock_actual || 0}</td>
                <td>${a.stock_minimo || 0}</td>
                <td>
                    <span class="badge ${leida ? "bg-secondary" : "bg-danger"}">
                        ${leida ? "Leída" : "Pendiente"}
                    </span>
                </td>
                <td>
                    ${
                      !leida
                        ? `
                        <button class="btn btn-sm btn-outline-success" onclick="marcarAlertaLeida(${a.id})">
                            <i class="fas fa-check"></i> Marcar Leída
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
        <div class="text-end">
            <small class="text-muted">Total: ${alertas.length} alertas</small>
        </div>
    `;

  container.innerHTML = html;
}

// MARCAR ALERTA LEÍDA
async function marcarAlertaLeida(id) {
  try {
    await api.request(`/alertas/${id}/leer`, "PATCH");
    showToast("Alerta marcada como leída", "success");
    await loadInventarioModule();
  } catch (error) {
    showToast(error.message || "Error al marcar alerta", "error");
  }
}

// EXPONER FUNCIONES GLOBALES
window.loadInventarioModule = loadInventarioModule;
window.showMovimientoModal = showMovimientoModal;
window.showConteoFisicoModal = showConteoFisicoModal;
window.showTrasladoModal = showTrasladoModal;
window.saveMovimiento = saveMovimiento;
window.saveConteoFisico = saveConteoFisico;
window.saveTraslado = saveTraslado;
window.recibirTraslado = recibirTraslado;
window.marcarAlertaLeida = marcarAlertaLeida;
