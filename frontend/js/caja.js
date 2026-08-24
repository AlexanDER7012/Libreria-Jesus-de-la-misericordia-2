// caja.js

let cajaChicaData = [];
let gastosData = [];
let tiposGastoData = [];
let cajaTurnosData = [];
let tiposPagoData = [];
let ubicacionesData = [];

// HELPER
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// CREAR MODALES
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

// CARGA DEL MÓDULO PRINCIPAL
async function loadCajaModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-cash-register me-2 text-primary"></i>Caja</h4>
            <div>
                <button class="btn btn-primary btn-sm me-2" onclick="showAbrirTurnoModal()">
                    <i class="fas fa-play me-1"></i>Abrir Turno
                </button>
                <button class="btn btn-warning btn-sm me-2" onclick="showCerrarTurnoModal()">
                    <i class="fas fa-stop me-1"></i>Cerrar Turno
                </button>
                <button class="btn btn-success btn-sm" onclick="showRegistrarGastoModal()">
                    <i class="fas fa-plus me-1"></i>Registrar Gasto
                </button>
            </div>
        </div>

        <!-- Pestañas -->
        <ul class="nav nav-tabs mb-3" id="cajaTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#turnosTab">
                    <i class="fas fa-clock me-1"></i>Turnos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#cajaChicaTab">
                    <i class="fas fa-coins me-1"></i>Caja Chica
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#gastosTab">
                    <i class="fas fa-money-bill-wave me-1"></i>Gastos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#tiposTab">
                    <i class="fas fa-tags me-1"></i>Catálogos
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <!-- Turnos -->
            <div class="tab-pane fade show active" id="turnosTab">
                <div id="turnosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando turnos...</p>
                    </div>
                </div>
            </div>

            <!-- Caja Chica -->
            <div class="tab-pane fade" id="cajaChicaTab">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">Movimientos de Caja Chica</h6>
                    <button class="btn btn-sm btn-outline-success" onclick="showRegistrarCajaChicaModal()">
                        <i class="fas fa-plus me-1"></i>Registrar Movimiento
                    </button>
                </div>
                <div id="cajaChicaContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-success" role="status"></div>
                        <p class="mt-2 text-muted">Cargando movimientos...</p>
                    </div>
                </div>
            </div>

            <!-- Gastos -->
            <div class="tab-pane fade" id="gastosTab">
                <div id="gastosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted">Cargando gastos...</p>
                    </div>
                </div>
            </div>

            <!-- Catálogos -->
            <div class="tab-pane fade" id="tiposTab">
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Tipos de Gasto</h6>
                        <div id="tiposGastoContainer">
                            <div class="text-center py-3">
                                <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="showCrearTipoGastoModal()">
                            <i class="fas fa-plus me-1"></i>Nuevo Tipo
                        </button>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold">Tipos de Pago</h6>
                        <div id="tiposPagoContainer">
                            <div class="text-center py-3">
                                <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="showCrearTipoPagoModal()">
                            <i class="fas fa-plus me-1"></i>Nuevo Tipo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Crear modal si no existe
  crearModalCaja();

  // Cargar todos los datos
  await Promise.all([
    loadTurnos(),
    loadCajaChica(),
    loadGastos(),
    loadTiposGasto(),
    loadTiposPago(),
    loadUbicaciones(),
  ]);
}

// CARGA PARA CONTENEDOR (desde Ventas)
async function cargarCajaEnContainer(container) {
  if (!container) return;

  // Guardar referencia y cargar
  window.cajaContainer = container;

  try {
    const [turnos, gastos, tiposGasto, tiposPago, cajaChica] =
      await Promise.all([
        api.getCajaTurnos().catch(() => []),
        api.getGastos().catch(() => []),
        api.getTiposGasto().catch(() => []),
        api.getTiposPago().catch(() => []),
        api.getCajaChica().catch(() => []),
      ]);

    cajaTurnosData = turnos || [];
    gastosData = gastos || [];
    tiposGastoData = tiposGasto || [];
    tiposPagoData = tiposPago || [];
    cajaChicaData = cajaChica || [];

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
                    <button class="btn btn-sm btn-success mb-2" onclick="showAbrirTurnoModal()">
                        <i class="fas fa-play me-1"></i>Abrir Turno
                    </button>
                    ${
                      abiertos.length > 0
                        ? `
                        <button class="btn btn-sm btn-danger mb-2 ms-1" onclick="showCerrarTurnoModal()">
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
                    <h6 class="fw-bold">Tipos de Pago (Ventas)</h6>
                    <div class="d-flex flex-wrap gap-1 mb-2">
                        ${tiposPago
                          .filter((t) => t.para_ventas === 1)
                          .map(
                            (t) => `
                            <span class="badge bg-primary">${t.nombre}</span>
                        `,
                          )
                          .join("")}
                    </div>
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="showCrearTipoPagoModal()">
                        <i class="fas fa-plus me-1"></i>Nuevo Tipo Pago
                    </button>
                    <div class="text-muted small mt-3">
                        <i class="fas fa-info-circle me-1"></i>
                        Para gestionar gastos y caja chica, usa el módulo Caja desde el menú principal.
                    </div>
                </div>
            </div>
        `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// TURNOS
async function loadTurnos() {
  const container = document.getElementById("turnosContainer");
  if (!container) return;
  try {
    cajaTurnosData = (await api.getCajaTurnos()) || [];
    renderTurnos(cajaTurnosData);
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

function renderTurnos(turnos) {
  const container = document.getElementById("turnosContainer");
  if (!container) return;

  if (!turnos || turnos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-clock fa-3x mb-3"></i>
                <p>No hay turnos registrados</p>
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
                        <th>Usuario</th>
                        <th>Ubicación</th>
                        <th>Apertura</th>
                        <th>Cierre</th>
                        <th>Fondo Inicial</th>
                        <th>Total Ventas</th>
                        <th>Total Contado</th>
                        <th>Diferencia</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;

  turnos.forEach((t) => {
    const estado = t.estado || "Abierto";
    const estadoBadge = estado === "Abierto" ? "bg-success" : "bg-secondary";
    const fechaApertura = t.fecha_apertura
      ? new Date(t.fecha_apertura).toLocaleString()
      : "--";
    const fechaCierre = t.fecha_cierre
      ? new Date(t.fecha_cierre).toLocaleString()
      : "--";

    html += `
            <tr>
                <td>${t.id}</td>
                <td>${t.id_usuario || "--"}</td>
                <td>${t.id_ubicacion || "--"}</td>
                <td>${fechaApertura}</td>
                <td>${fechaCierre}</td>
                <td>Q${t.fondo_inicial || 0}</td>
                <td>Q${t.total_ventas || 0}</td>
                <td>Q${t.total_contado || 0}</td>
                <td class="${t.diferencia && t.diferencia !== 0 ? "text-danger fw-bold" : ""}">
                    Q${t.diferencia || 0}
                </td>
                <td><span class="badge ${estadoBadge}">${estado}</span></td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <small class="text-muted">Total: ${turnos.length} turnos</small>
        </div>
    `;

  container.innerHTML = html;
}

// ABRIR TURNO
function showAbrirTurnoModal() {
  let modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error al crear modal de caja", "error");
      return;
    }
  }

  const title = document.getElementById("cajaModalTitle");
  if (title) title.textContent = "Abrir Turno de Caja";

  const body = document.getElementById("cajaModalBody");
  if (!body) {
    showToast("Error: cuerpo del modal no encontrado", "error");
    return;
  }

  body.innerHTML = `
    <form id="cajaForm">
      <input type="hidden" id="cajaId" />
      <div class="mb-3">
        <label class="form-label">Ubicación</label>
        <select class="form-select" id="cajaUbicacion" required>
          <option value="">Seleccionar</option>
          ${(ubicacionesData || []).map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
        </select>
        <div class="text-muted small mt-1">No hay ubicaciones? Crea una en Configuración</div>
      </div>
      <div class="mb-3">
        <label class="form-label">Fondo Inicial</label>
        <input type="number" step="0.01" class="form-control" id="cajaFondoInicial" value="500" />
      </div>
      <button type="submit" class="btn btn-success w-100" onclick="abrirTurno(event)">Abrir Turno</button>
    </form>
  `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function abrirTurno(event) {
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
    await loadTurnos();
    // Actualizar vista en ventas si existe
    if (window.cajaContainer) {
      await cargarCajaEnContainer(window.cajaContainer);
    }
  } catch (error) {
    showToast(error.message || "Error al abrir turno", "error");
  }
}

// CERRAR TURNO
let turnoParaCerrar = null;

async function showCerrarTurnoModal() {
  try {
    const turnos = await api.getCajaTurnos();
    const abiertos = turnos.filter((t) => t.estado === "Abierto");

    if (abiertos.length === 0) {
      showToast("No hay turnos abiertos para cerrar", "warning");
      return;
    }

    turnoParaCerrar = abiertos[0];

    let modal = document.getElementById("cajaModal");
    if (!modal) {
      crearModalCaja();
      modal = document.getElementById("cajaModal");
      if (!modal) {
        showToast("Error al crear modal de caja", "error");
        return;
      }
    }

    const title = document.getElementById("cajaModalTitle");
    if (title) title.textContent = `Cerrar Turno #${turnoParaCerrar.id}`;

    const body = document.getElementById("cajaModalBody");
    if (!body) {
      showToast("Error: cuerpo del modal no encontrado", "error");
      return;
    }

    body.innerHTML = `
      <form id="cajaForm">
        <input type="hidden" id="cajaId" value="${turnoParaCerrar.id}" />
        <div class="mb-3">
          <label class="form-label">Ubicación</label>
          <input type="text" class="form-control" value="${turnoParaCerrar.id_ubicacion || "--"}" disabled />
        </div>
        <div class="mb-3">
          <label class="form-label">Fondo Inicial</label>
          <input type="text" class="form-control" value="Q${turnoParaCerrar.fondo_inicial || 0}" disabled />
        </div>
        <div class="mb-3">
          <label class="form-label">Denominaciones</label>
          <div id="cajaDenominacionesList"></div>
        </div>
        <div class="mb-3">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" id="cajaObservaciones" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-danger w-100" onclick="cerrarTurno(event)">Cerrar Turno</button>
      </form>
    `;

    renderDenominaciones();

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    showToast(error.message || "Error al cargar turnos", "error");
  }
}

function renderDenominaciones() {
  const container = document.getElementById("cajaDenominacionesList");
  if (!container) return;

  const denominaciones = [
    { valor: 0.01, label: "1¢" },
    { valor: 0.05, label: "5¢" },
    { valor: 0.1, label: "10¢" },
    { valor: 0.25, label: "25¢" },
    { valor: 0.5, label: "50¢" },
    { valor: 1, label: "Q1" },
    { valor: 5, label: "Q5" },
    { valor: 10, label: "Q10" },
    { valor: 20, label: "Q20" },
    { valor: 50, label: "Q50" },
    { valor: 100, label: "Q100" },
    { valor: 200, label: "Q200" },
  ];

  container.innerHTML = denominaciones
    .map(
      (d) => `
        <div class="row g-2 align-items-center mb-2">
            <div class="col-4">
                <label class="form-label small">${d.label}</label>
            </div>
            <div class="col-6">
                <input type="number" class="form-control form-control-sm denominacion-cantidad" 
                       data-denominacion="${d.valor}" value="0" min="0" />
            </div>
            <div class="col-2">
                <span class="small">= Q${(d.valor * 0).toFixed(2)}</span>
            </div>
        </div>
    `,
    )
    .join("");

  container.querySelectorAll(".denominacion-cantidad").forEach((input) => {
    input.addEventListener("input", function () {
      const valor = parseFloat(this.dataset.denominacion);
      const cantidad = parseInt(this.value) || 0;
      const total = valor * cantidad;
      const span = this.closest(".row").querySelector(".col-2 span");
      if (span) span.textContent = `= Q${total.toFixed(2)}`;
    });
  });
}

async function cerrarTurno(event) {
  event.preventDefault();
  const turnoId = document.getElementById("cajaId").value;

  const denominacionInputs = document.querySelectorAll(
    ".denominacion-cantidad",
  );
  const denominaciones = [];
  let totalContado = 0;

  denominacionInputs.forEach((input) => {
    const cantidad = parseInt(input.value) || 0;
    if (cantidad > 0) {
      const denominacion = parseFloat(input.dataset.denominacion);
      denominaciones.push({
        denominacion: denominacion,
        cantidad: cantidad,
      });
      totalContado += denominacion * cantidad;
    }
  });

  if (denominaciones.length === 0) {
    showToast("Debes registrar al menos una denominación", "error");
    return;
  }

  const data = {
    denominaciones: denominaciones,
    observaciones: document.getElementById("cajaObservaciones").value || null,
  };

  try {
    await api.request(`/caja-turno/${turnoId}/cerrar`, "PATCH", data);
    showToast(
      `Turno cerrado correctamente. Total contado: Q${totalContado.toFixed(2)}`,
      "success",
    );
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadTurnos();
    if (window.cajaContainer) {
      await cargarCajaEnContainer(window.cajaContainer);
    }
  } catch (error) {
    showToast(error.message || "Error al cerrar turno", "error");
  }
}

// CAJA CHICA
async function loadCajaChica() {
  const container = document.getElementById("cajaChicaContainer");
  if (!container) return;
  try {
    cajaChicaData = (await api.getCajaChica()) || [];
    renderCajaChica(cajaChicaData);
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

function renderCajaChica(movimientos) {
  const container = document.getElementById("cajaChicaContainer");
  if (!container) return;

  if (!movimientos || movimientos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-coins fa-3x mb-3"></i>
                <p>No hay movimientos de caja chica</p>
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
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Saldo</th>
                        <th>Referencia</th>
                    </tr>
                </thead>
                <tbody>
    `;

  movimientos.forEach((m) => {
    const tipo = m.tipo || "--";
    const tipoBadge = tipo === "Ingreso" ? "bg-success" : "bg-danger";
    const monto = m.monto || 0;
    const montoClass = monto >= 0 ? "text-success" : "text-danger";

    html += `
            <tr>
                <td>${m.fecha ? new Date(m.fecha).toLocaleString() : "--"}</td>
                <td><span class="badge ${tipoBadge}">${tipo}</span></td>
                <td>${m.concepto || "--"}</td>
                <td class="${montoClass} fw-bold">Q${monto}</td>
                <td>Q${m.saldo || 0}</td>
                <td>${m.referencia || "--"}</td>
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

function showRegistrarCajaChicaModal() {
  let modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error al crear modal de caja", "error");
      return;
    }
  }

  const title = document.getElementById("cajaModalTitle");
  if (title) title.textContent = "Registrar Movimiento de Caja Chica";

  const body = document.getElementById("cajaModalBody");
  if (!body) {
    showToast("Error: cuerpo del modal no encontrado", "error");
    return;
  }

  body.innerHTML = `
    <form id="cajaForm">
      <input type="hidden" id="cajaId" />
      <div class="mb-3">
        <label class="form-label">Ubicación</label>
        <select class="form-select" id="cajaChicaUbicacion" required>
          <option value="">Seleccionar ubicación</option>
          ${(ubicacionesData || []).map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="cajaChicaTipo" required>
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Monto</label>
        <input type="number" step="0.01" class="form-control" id="cajaChicaMonto" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Concepto</label>
        <input type="text" class="form-control" id="cajaChicaConcepto" />
      </div>
      <div class="mb-3">
        <label class="form-label">Referencia</label>
        <input type="text" class="form-control" id="cajaChicaReferencia" />
      </div>
      <div class="mb-3">
        <label class="form-label">Observaciones</label>
        <textarea class="form-control" id="cajaChicaObservaciones" rows="2"></textarea>
      </div>
      <button type="submit" class="btn btn-success w-100" onclick="registrarCajaChica(event)">Registrar</button>
    </form>
  `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function registrarCajaChica(event) {
  event.preventDefault();
  const data = {
    id_ubicacion: parseInt(document.getElementById("cajaChicaUbicacion").value),
    tipo: document.getElementById("cajaChicaTipo").value,
    monto: parseFloat(document.getElementById("cajaChicaMonto").value),
    concepto: document.getElementById("cajaChicaConcepto").value || null,
    referencia: document.getElementById("cajaChicaReferencia").value || null,
    observaciones:
      document.getElementById("cajaChicaObservaciones").value || null,
    id_usuario: getCurrentUser()?.id || 1,
  };

  if (!data.id_ubicacion || !data.monto) {
    showToast("Ubicación y monto son obligatorios", "error");
    return;
  }

  if (data.tipo === "Egreso") {
    data.monto = -Math.abs(data.monto);
  }

  try {
    await api.request("/caja-chica", "POST", data);
    showToast("Movimiento registrado correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadCajaChica();
  } catch (error) {
    showToast(error.message || "Error al registrar movimiento", "error");
  }
}

// GASTOS
async function loadGastos() {
  const container = document.getElementById("gastosContainer");
  if (!container) return;
  try {
    gastosData = (await api.getGastos()) || [];
    renderGastos(gastosData);
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

function renderGastos(gastos) {
  const container = document.getElementById("gastosContainer");
  if (!container) return;

  if (!gastos || gastos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-money-bill-wave fa-3x mb-3"></i>
                <p>No hay gastos registrados</p>
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
                        <th>Tipo Gasto</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  gastos.forEach((g) => {
    const tipoGasto = tiposGastoData.find((t) => t.id === g.id_tipo_gasto);
    html += `
            <tr>
                <td>${g.fecha ? new Date(g.fecha).toLocaleString() : "--"}</td>
                <td>${tipoGasto ? tipoGasto.nombre : "--"}</td>
                <td>${g.concepto || "--"}</td>
                <td class="text-danger fw-bold">Q${g.monto || 0}</td>
                <td>${g.observaciones || "--"}</td>
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

function showRegistrarGastoModal() {
  let modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error al crear modal de caja", "error");
      return;
    }
  }

  const title = document.getElementById("cajaModalTitle");
  if (title) title.textContent = "Registrar Gasto";

  const body = document.getElementById("cajaModalBody");
  if (!body) {
    showToast("Error: cuerpo del modal no encontrado", "error");
    return;
  }

  body.innerHTML = `
    <form id="cajaForm">
      <div class="mb-3">
        <label class="form-label">Tipo de Gasto</label>
        <select class="form-select" id="gastoTipo" required>
          <option value="">Seleccionar tipo</option>
          ${tiposGastoData.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join("")}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Ubicación</label>
        <select class="form-select" id="gastoUbicacion">
          <option value="">Seleccionar ubicación</option>
          ${(ubicacionesData || []).map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Concepto</label>
        <input type="text" class="form-control" id="gastoConcepto" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Monto</label>
        <input type="number" step="0.01" class="form-control" id="gastoMonto" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Observaciones</label>
        <textarea class="form-control" id="gastoObservaciones" rows="2"></textarea>
      </div>
      <button type="submit" class="btn btn-danger w-100" onclick="registrarGasto(event)">Registrar Gasto</button>
    </form>
  `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function registrarGasto(event) {
  event.preventDefault();
  const data = {
    id_tipo_gasto: parseInt(document.getElementById("gastoTipo").value),
    id_ubicacion:
      parseInt(document.getElementById("gastoUbicacion").value) || null,
    concepto: document.getElementById("gastoConcepto").value,
    monto: parseFloat(document.getElementById("gastoMonto").value),
    observaciones: document.getElementById("gastoObservaciones").value || null,
    id_usuario_registra: getCurrentUser()?.id || 1,
  };

  if (!data.id_tipo_gasto || !data.concepto || !data.monto) {
    showToast("Tipo, concepto y monto son obligatorios", "error");
    return;
  }

  try {
    await api.request("/gastos", "POST", data);
    showToast("Gasto registrado correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadGastos();
  } catch (error) {
    showToast(error.message || "Error al registrar gasto", "error");
  }
}

// TIPOS DE GASTO
async function loadTiposGasto() {
  const container = document.getElementById("tiposGastoContainer");
  if (!container) return;
  try {
    tiposGastoData = (await api.getTiposGasto()) || [];
    renderTiposGasto(tiposGastoData);
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

function renderTiposGasto(tipos) {
  const container = document.getElementById("tiposGastoContainer");
  if (!container) return;

  if (!tipos || tipos.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay tipos registrados</p>';
    return;
  }
  container.innerHTML = tipos
    .map(
      (t) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-1">
            <span>${t.nombre}</span>
            <small class="text-muted">${t.es_fijo ? "Fijo" : "Variable"}</small>
        </div>
    `,
    )
    .join("");
}

function showCrearTipoGastoModal() {
  let modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error al crear modal de caja", "error");
      return;
    }
  }

  const title = document.getElementById("cajaModalTitle");
  if (title) title.textContent = "Nuevo Tipo de Gasto";

  const body = document.getElementById("cajaModalBody");
  if (!body) {
    showToast("Error: cuerpo del modal no encontrado", "error");
    return;
  }

  body.innerHTML = `
    <form id="cajaForm">
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="tipoGastoNombre" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <input type="text" class="form-control" id="tipoGastoDescripcion" />
      </div>
      <div class="mb-3">
        <label class="form-label">¿Es fijo?</label>
        <select class="form-select" id="tipoGastoFijo">
          <option value="0">No</option>
          <option value="1">Sí</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary w-100" onclick="crearTipoGasto(event)">Guardar</button>
    </form>
  `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function crearTipoGasto(event) {
  event.preventDefault();
  const data = {
    nombre: document.getElementById("tipoGastoNombre").value,
    descripcion: document.getElementById("tipoGastoDescripcion").value || null,
    es_fijo: parseInt(document.getElementById("tipoGastoFijo").value),
  };

  if (!data.nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    await api.request("/tipos-gasto", "POST", data);
    showToast("Tipo de gasto creado correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadTiposGasto();
  } catch (error) {
    showToast(error.message || "Error al crear tipo de gasto", "error");
  }
}

// TIPOS DE PAGO
async function loadTiposPago() {
  const container = document.getElementById("tiposPagoContainer");
  if (!container) return;
  try {
    tiposPagoData = (await api.getTiposPago()) || [];
    renderTiposPago(tiposPagoData);
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

function renderTiposPago(tipos) {
  const container = document.getElementById("tiposPagoContainer");
  if (!container) return;

  if (!tipos || tipos.length === 0) {
    container.innerHTML =
      '<p class="text-muted small">No hay tipos registrados</p>';
    return;
  }
  container.innerHTML = tipos
    .map(
      (t) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-1">
            <span>${t.nombre}</span>
            <small class="text-muted">
                ${t.para_ventas ? "Ventas " : ""}${t.para_compras ? "Compras" : ""}
            </small>
        </div>
    `,
    )
    .join("");
}

function showCrearTipoPagoModal() {
  let modal = document.getElementById("cajaModal");
  if (!modal) {
    crearModalCaja();
    modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error al crear modal de caja", "error");
      return;
    }
  }

  const title = document.getElementById("cajaModalTitle");
  if (title) title.textContent = "Nuevo Tipo de Pago";

  const body = document.getElementById("cajaModalBody");
  if (!body) {
    showToast("Error: cuerpo del modal no encontrado", "error");
    return;
  }

  body.innerHTML = `
    <form id="cajaForm">
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="tipoPagoNombre" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <input type="text" class="form-control" id="tipoPagoDescripcion" />
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
      <button type="submit" class="btn btn-primary w-100" onclick="crearTipoPago(event)">Guardar</button>
    </form>
  `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function crearTipoPago(event) {
  event.preventDefault();
  const data = {
    nombre: document.getElementById("tipoPagoNombre").value,
    descripcion: document.getElementById("tipoPagoDescripcion").value || null,
    para_ventas: parseInt(document.getElementById("tipoPagoVentas").value),
    para_compras: parseInt(document.getElementById("tipoPagoCompras").value),
  };

  if (!data.nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    await api.request("/tipos-pago", "POST", data);
    showToast("Tipo de pago creado correctamente", "success");
    bootstrap.Modal.getInstance(document.getElementById("cajaModal")).hide();
    await loadTiposPago();
  } catch (error) {
    showToast(error.message || "Error al crear tipo de pago", "error");
  }
}

// UBICACIONES
async function loadUbicaciones() {
  try {
    ubicacionesData = (await api.request("/ubicaciones")) || [];
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
    ubicacionesData = [];
  }
}

// EXPONER FUNCIONES GLOBALES
window.loadCajaModule = loadCajaModule;
window.cargarCajaEnContainer = cargarCajaEnContainer;
window.showAbrirTurnoModal = showAbrirTurnoModal;
window.showCerrarTurnoModal = showCerrarTurnoModal;
window.showRegistrarGastoModal = showRegistrarGastoModal;
window.showRegistrarCajaChicaModal = showRegistrarCajaChicaModal;
window.registrarCajaChica = registrarCajaChica;
window.registrarGasto = registrarGasto;
window.crearTipoGasto = crearTipoGasto;
window.crearTipoPago = crearTipoPago;
window.showCrearTipoGastoModal = showCrearTipoGastoModal;
window.showCrearTipoPagoModal = showCrearTipoPagoModal;
window.abrirTurno = abrirTurno;
window.cerrarTurno = cerrarTurno;
window.renderDenominaciones = renderDenominaciones;
