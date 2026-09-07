// caja.js
(function () {
  "use strict";

  // Variables locales
  let cajaChicaData = [];
  let gastosData = [];
  let tiposGastoData = [];

  // HELPER
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  // CARGA DEL MÓDULO PRINCIPAL
  async function loadCajaModule() {
    const container = document.getElementById("mainContent");
    if (!container) return;

    container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4><i class="fas fa-cash-register me-2 text-primary"></i>Caja</h4>
                <div>
                    <button class="btn btn-primary btn-sm me-2" onclick="window.showAbrirTurnoModal()">
                        <i class="fas fa-play me-1"></i>Abrir Turno
                    </button>
                    <button class="btn btn-warning btn-sm me-2" onclick="window.showCerrarTurnoModal()">
                        <i class="fas fa-stop me-1"></i>Cerrar Turno
                    </button>
                    <button class="btn btn-success btn-sm" onclick="window.showRegistrarGastoModal()">
                        <i class="fas fa-plus me-1"></i>Registrar Gasto
                    </button>
                </div>
            </div>

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
                <div class="tab-pane fade show active" id="turnosTab">
                    <div id="turnosContainer">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-muted">Cargando turnos...</p>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="cajaChicaTab">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Movimientos de Caja Chica</h6>
                        <button class="btn btn-sm btn-outline-success" onclick="window.showRegistrarCajaChicaModal()">
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
                <div class="tab-pane fade" id="gastosTab">
                    <div id="gastosContainer">
                        <div class="text-center py-5">
                            <div class="spinner-border text-warning" role="status"></div>
                            <p class="mt-2 text-muted">Cargando gastos...</p>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="tiposTab">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="fw-bold">Tipos de Gasto</h6>
                            <div id="tiposGastoContainer">
                                <div class="text-center py-3">
                                    <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.showCrearTipoGastoModal()">
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
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.showCrearTipoPagoModal()">
                                <i class="fas fa-plus me-1"></i>Nuevo Tipo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    await Promise.all([
      loadTurnos(),
      loadCajaChica(),
      loadGastos(),
      loadTiposGasto(),
      loadTiposPago(),
    ]);
  }

  // CARGA PARA CONTENEDOR (desde Ventas)
  // CARGA PARA CONTENEDOR (desde Ventas)
  async function cargarCajaEnContainer(container) {
    if (!container) return;
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

      window.cajaTurnosData = turnos || [];
      window.tiposPagoData = tiposPago || [];
      gastosData = gastos || [];
      tiposGastoData = tiposGasto || [];
      cajaChicaData = cajaChica || [];

      const abiertos = turnos.filter((t) => t.estado === "Abierto");
      const cerrados = turnos.filter((t) => t.estado === "Cerrado");

      // Calcular totales
      const totalVentas = turnos.reduce(
        (sum, t) => sum + (parseFloat(t.total_ventas) || 0),
        0,
      );

      let turnosHtml = "";
      if (turnos.length === 0) {
        turnosHtml =
          '<p class="text-muted small">No hay turnos registrados</p>';
      } else {
        turnosHtml = `
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Apertura</th>
                  <th>Fondo</th>
                  <th>Ventas</th>
                  <th>Contado</th>
                  <th>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                ${turnos
                  .slice(0, 10)
                  .map((t) => {
                    const estado = t.estado || "Abierto";
                    const estadoBadge =
                      estado === "Abierto" ? "bg-success" : "bg-secondary";
                    const fechaApertura = t.fecha_apertura
                      ? new Date(t.fecha_apertura).toLocaleDateString()
                      : "--";
                    const totalVentas = parseFloat(t.total_ventas) || 0;
                    const totalContado = parseFloat(t.total_contado) || 0;
                    const diferencia = parseFloat(t.diferencia) || 0;
                    const diferenciaClass =
                      diferencia !== 0 ? "text-danger fw-bold" : "";
                    return `
                    <tr>
                      <td>#${t.id}</td>
                      <td><span class="badge ${estadoBadge}">${estado}</span></td>
                      <td>${fechaApertura}</td>
                      <td>Q${parseFloat(t.fondo_inicial || 0).toFixed(2)}</td>
                      <td class="text-primary">Q${totalVentas.toFixed(2)}</td>
                      <td class="text-success">Q${totalContado.toFixed(2)}</td>
                      <td class="${diferenciaClass}">Q${diferencia.toFixed(2)}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
            ${turnos.length > 10 ? `<p class="text-muted small">Mostrando 10 de ${turnos.length} turnos</p>` : ""}
          </div>
        `;
      }

      container.innerHTML = `
        <div class="row">
          <!-- Columna Izquierda: Turnos -->
          <div class="col-md-7">
            <div class="card">
              <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <span><i class="fas fa-clock me-2"></i>Turnos de Caja</span>
                <span class="badge bg-light text-dark">Abiertos: ${abiertos.length} | Total: ${turnos.length}</span>
              </div>
              <div class="card-body">
                <div class="d-flex gap-2 mb-3">
                  <button class="btn btn-sm btn-success" onclick="window.showAbrirTurnoModal()">
                    <i class="fas fa-play me-1"></i>Abrir Turno
                  </button>
                  ${
                    abiertos.length > 0
                      ? `
                    <button class="btn btn-sm btn-danger" onclick="window.showCerrarTurnoModal()">
                      <i class="fas fa-stop me-1"></i>Cerrar Turno
                    </button>
                  `
                      : ""
                  }
                </div>
                ${turnosHtml}
                <div class="mt-2 small text-muted">
                  <i class="fas fa-info-circle me-1"></i>
                  Total Ventas Generadas: <strong class="text-primary">Q${totalVentas.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Tipos de Pago -->
          <div class="col-md-5">
            <div class="card">
              <div class="card-header bg-success text-white">
                <i class="fas fa-credit-card me-2"></i>Tipos de Pago (Ventas)
              </div>
              <div class="card-body">
                <div class="d-flex flex-wrap gap-2 mb-3">
                  ${
                    tiposPago.filter((t) => t.para_ventas === 1).length === 0
                      ? '<p class="text-muted small">No hay tipos de pago configurados</p>'
                      : tiposPago
                          .filter((t) => t.para_ventas === 1)
                          .map(
                            (t) =>
                              `<span class="badge bg-primary fs-6 p-2">${t.nombre}</span>`,
                          )
                          .join("")
                  }
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="window.showCrearTipoPagoModal()">
                  <i class="fas fa-plus me-1"></i>Nuevo Tipo Pago
                </button>
                <hr>
                <div class="text-muted small">
                  <i class="fas fa-info-circle me-1"></i>
                  Para gestionar gastos y caja chica, usa el módulo 
                  <button class="btn btn-link btn-sm p-0 text-primary" onclick="window.app?.loadModule('caja')">
                    Caja
                  </button>
                  desde el menú principal.
                </div>
              </div>
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
      window.cajaTurnosData = (await api.getCajaTurnos()) || [];
      renderTurnos(window.cajaTurnosData);
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

  function abrirModalTurno() {
    const modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error: Modal de caja no encontrado", "error");
      return;
    }

    const title = document.getElementById("cajaModalTitle");
    if (title) title.textContent = "Abrir Turno de Caja";

    const denominacionesContainer = document.getElementById(
      "cajaDenominacionesContainer",
    );
    if (denominacionesContainer) denominacionesContainer.style.display = "none";

    const denominacionesList = document.getElementById(
      "cajaDenominacionesList",
    );
    if (denominacionesList) denominacionesList.innerHTML = "";

    const observaciones = document.getElementById("cajaObservaciones");
    if (observaciones) observaciones.value = "";

    const fondoInicial = document.getElementById("cajaFondoInicial");
    if (fondoInicial) {
      fondoInicial.value = 500;
      fondoInicial.readOnly = false;
      fondoInicial.min = 0;
      fondoInicial.step = 1;
    }

    const cajaId = document.getElementById("cajaId");
    if (cajaId) cajaId.value = "";

    const btnAbrir = document.getElementById("btnAbrirTurno");
    if (btnAbrir) {
      btnAbrir.style.display = "block";
      btnAbrir.textContent = "Abrir Turno";
    }

    const btnCerrar = document.getElementById("btnCerrarTurno");
    if (btnCerrar) btnCerrar.style.display = "none";

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
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

      if (abiertos.length > 1) {
        const turnoSeleccionado = await mostrarSelectorTurnos(abiertos);
        if (!turnoSeleccionado) return;
        turnoParaCerrar = turnoSeleccionado;
      } else {
        turnoParaCerrar = abiertos[0];
      }

      const modal = document.getElementById("cajaModal");
      if (!modal) {
        showToast("Error: Modal de caja no encontrado", "error");
        return;
      }

      const title = document.getElementById("cajaModalTitle");
      if (title) title.textContent = `Cerrar Turno #${turnoParaCerrar.id}`;

      // ✅ Mostrar denominaciones
      const denominacionesContainer = document.getElementById(
        "cajaDenominacionesContainer",
      );
      if (denominacionesContainer)
        denominacionesContainer.style.display = "block";

      const denominacionesList = document.getElementById(
        "cajaDenominacionesList",
      );
      if (denominacionesList) denominacionesList.innerHTML = "";

      const observaciones = document.getElementById("cajaObservaciones");
      if (observaciones) observaciones.value = "";

      const cajaId = document.getElementById("cajaId");
      if (cajaId) cajaId.value = turnoParaCerrar.id;

      const fondoInicial = document.getElementById("cajaFondoInicial");
      if (fondoInicial) {
        fondoInicial.value = turnoParaCerrar.fondo_inicial || 0;
        fondoInicial.readOnly = true; // ✅ Solo lectura
      }

      // ✅ OBTENER Y MOSTRAR UBICACIÓN COMO TEXTO
      const ubicacionSelect = document.getElementById("cajaUbicacion");
      const ubicacionLabel = document.getElementById("cajaUbicacionLabel");

      // Buscar nombre de ubicación desde configuración
      let nombreUbicacion = "Cargando...";
      try {
        const config = await api.request("/configuracion").catch(() => ({}));
        const idUbicacion = config.id_ubicacion;
        if (idUbicacion) {
          const ubicaciones = await api.request("/ubicaciones").catch(() => []);
          const ubicacion = ubicaciones.find((u) => u.id === idUbicacion);
          if (ubicacion) nombreUbicacion = ubicacion.nombre || ubicacion.id;
        } else {
          nombreUbicacion = "No configurada";
        }
      } catch (e) {
        nombreUbicacion = "Error al cargar";
      }

      if (ubicacionSelect) {
        ubicacionSelect.style.display = "none";
      }
      if (ubicacionLabel) {
        ubicacionLabel.textContent = `📍 Ubicación: ${nombreUbicacion}`;
        ubicacionLabel.style.display = "block";
      } else {
        const ubicacionGroup = ubicacionSelect?.closest(".mb-3");
        if (ubicacionGroup) {
          const label = document.createElement("p");
          label.id = "cajaUbicacionLabel";
          label.className = "form-control-plaintext fw-bold";
          label.textContent = `📍 Ubicación: ${nombreUbicacion}`;
          ubicacionGroup.appendChild(label);
          if (ubicacionSelect) ubicacionSelect.style.display = "none";
        }
      }

      const btnAbrir = document.getElementById("btnAbrirTurno");
      if (btnAbrir) btnAbrir.style.display = "none";

      const btnCerrar = document.getElementById("btnCerrarTurno");
      if (btnCerrar) btnCerrar.style.display = "block";

      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();
    } catch (error) {
      showToast(error.message || "Error al cargar turnos", "error");
    }
  }

  // SELECCIONAR TURNO
  function mostrarSelectorTurnos(turnos) {
    return new Promise((resolve) => {
      // Eliminar modal anterior si existe
      const modalExistente = document.getElementById("selectorTurnoModal");
      if (modalExistente) {
        modalExistente.remove();
      }

      const modal = document.createElement("div");
      modal.className = "modal fade";
      modal.id = "selectorTurnoModal";
      modal.setAttribute("tabindex", "-1");
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = `
        <div class="modal-dialog modal-md">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title text-white">
                <i class="fas fa-clock me-2"></i>Seleccionar Turno
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted small mb-3">Hay <strong>${turnos.length}</strong> turnos abiertos. Selecciona cuál deseas cerrar:</p>
              <div class="list-group">
                ${turnos
                  .map((t) => {
                    const fechaApertura = t.fecha_apertura
                      ? new Date(t.fecha_apertura).toLocaleString()
                      : "--";
                    return `
                    <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
                            onclick="window.seleccionarTurnoParaCerrar(${t.id})">
                      <div>
                        <strong>Turno #${t.id}</strong>
                        <br>
                        <small class="text-muted">Usuario: ${t.id_usuario || "--"} | Apertura: ${fechaApertura}</small>
                      </div>
                      <span class="badge bg-success">Abierto</span>
                    </button>
                  `;
                  })
                  .join("")}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Función global para seleccionar turno
      window.seleccionarTurnoParaCerrar = function (id) {
        const turno = turnos.find((t) => t.id === id);
        const modalInstance = bootstrap.Modal.getInstance(
          document.getElementById("selectorTurnoModal"),
        );
        if (modalInstance) modalInstance.hide();
        setTimeout(() => {
          const el = document.getElementById("selectorTurnoModal");
          if (el) el.remove();
        }, 300);
        resolve(turno);
      };

      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();

      modal.addEventListener("hidden.bs.modal", function () {
        setTimeout(() => {
          const el = document.getElementById("selectorTurnoModal");
          if (el) el.remove();
        }, 300);
        resolve(null);
      });
    });
  }

  // AGREGAR DENOMINACION
  function agregarDenominacion() {
    const container = document.getElementById("cajaDenominacionesList");
    if (!container) {
      showToast("Error: contenedor de denominaciones no encontrado", "error");
      return;
    }

    const row = document.createElement("div");
    row.className = "row g-2 align-items-center mb-2 denominacion-row";
    row.innerHTML = `
      <div class="col-4">
        <input type="number" class="form-control form-control-sm denominacion-valor" 
              placeholder="Valor" min="0.01" step="0.01" />
      </div>
      <div class="col-5">
        <input type="number" class="form-control form-control-sm denominacion-cantidad" 
              placeholder="Cantidad" min="0" step="1" />
      </div>
      <div class="col-3">
        <button type="button" class="btn btn-sm btn-outline-danger" 
                onclick="this.closest('.denominacion-row').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="col-12 mt-1">
        <small class="text-muted denominacion-total">Total: Q0.00</small>
      </div>
    `;

    // ✅ CORREGIDO: Evento con selectores específicos
    const valorInput = row.querySelector(".denominacion-valor");
    const cantidadInput = row.querySelector(".denominacion-cantidad");
    const totalLabel = row.querySelector(".denominacion-total");

    function calcularTotal() {
      const valor = parseFloat(valorInput.value) || 0;
      const cantidad = parseInt(cantidadInput.value) || 0;
      const total = valor * cantidad;
      if (totalLabel) {
        totalLabel.textContent = `Total: Q${total.toFixed(2)}`;
        totalLabel.className =
          total > 0
            ? "text-success denominacion-total"
            : "text-muted denominacion-total";
      }
    }

    valorInput.addEventListener("input", calcularTotal);
    cantidadInput.addEventListener("input", calcularTotal);

    container.appendChild(row);

    // Enfocar el primer input
    setTimeout(() => {
      if (valorInput) valorInput.focus();
    }, 100);
  }

  // GUARDAR TURNO (ABRIR)
  async function abrirTurno(event) {
    event.preventDefault();

    const id_usuario = getCurrentUser()?.id || 1;

    let id_ubicacion = null;
    try {
      const config = await api.request("/configuracion").catch(() => ({}));
      id_ubicacion = config.id_ubicacion || null;
      if (!id_ubicacion) {
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

    const fondo_inicial =
      parseFloat(document.getElementById("cajaFondoInicial").value) || 500;

    if (fondo_inicial < 0) {
      showToast("El fondo inicial no puede ser negativo", "error");
      return;
    }

    try {
      // Verificar si el usuario ya tiene un turno abierto
      const turnos = await api.getCajaTurnos();
      const turnoExistente = turnos.find(
        (t) => t.id_usuario === id_usuario && t.estado === "Abierto",
      );

      if (turnoExistente) {
        const confirmar = await mostrarConfirmacion(
          "Turno ya abierto",
          `Ya tienes un turno abierto (ID: ${turnoExistente.id}). ¿Deseas abrir otro turno igual?`,
        );
        if (!confirmar) return;
      }

      await api.createCajaTurno({ id_usuario, id_ubicacion, fondo_inicial });
      showToast("Turno abierto correctamente", "success");

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("cajaModal"),
      );
      if (modal) modal.hide();

      await loadTurnos();
      if (window.cajaContainer) {
        await cargarCajaEnContainer(window.cajaContainer);
      }
    } catch (error) {
      showToast(error.message || "Error al abrir turno", "error");
    }
  }

  // CERRAR TURNO (GUARDAR)
  async function cerrarTurno(event) {
    event.preventDefault();

    const turnoId = document.getElementById("cajaId").value;
    if (!turnoId) {
      showToast("Error: No hay turno para cerrar", "error");
      return;
    }

    const container = document.getElementById("cajaDenominacionesList");
    if (!container) {
      showToast("Error: contenedor de denominaciones no encontrado", "error");
      return;
    }

    const rows = container.querySelectorAll(".denominacion-row");
    if (rows.length === 0) {
      showToast("Debes registrar al menos una denominación", "error");
      return;
    }

    const denominaciones = [];
    let totalContado = 0;
    let isValid = true;

    rows.forEach((row) => {
      const valorInput = row.querySelector(".denominacion-valor");
      const cantidadInput = row.querySelector(".denominacion-cantidad");

      if (valorInput && cantidadInput) {
        const valor = parseFloat(valorInput.value) || 0;
        const cantidad = parseInt(cantidadInput.value) || 0;
        if (valor > 0 && cantidad > 0) {
          denominaciones.push({ denominacion: valor, cantidad: cantidad });
          totalContado += valor * cantidad;
        } else if (valorInput.value && !cantidadInput.value) {
          isValid = false;
          showToast(
            "Completa la cantidad para todas las denominaciones",
            "error",
          );
        }
      }
    });

    if (!isValid) return;

    if (denominaciones.length === 0) {
      showToast("Debes registrar al menos una denominación válida", "error");
      return;
    }

    // Confirmar cierre
    const confirmar = await mostrarConfirmacion(
      "Confirmar Cierre",
      `Total contado: Q${totalContado.toFixed(2)}\n¿Estás seguro de cerrar el turno?`,
    );

    if (!confirmar) return;

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

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("cajaModal"),
      );
      if (modal) modal.hide();

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
    const modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error: Modal de caja no encontrado", "error");
      return;
    }

    document.getElementById("cajaModalTitle").textContent =
      "Registrar Movimiento de Caja Chica";
    document.getElementById("cajaDenominacionesContainer").style.display =
      "none";
    document.getElementById("btnAbrirTurno").style.display = "none";
    document.getElementById("btnCerrarTurno").style.display = "none";

    const body = document.getElementById("cajaModalBody");
    body.innerHTML = `
            <form id="cajaForm">
                <input type="hidden" id="cajaId" />
                <div class="mb-3">
                    <label class="form-label">Ubicación</label>
                    <select class="form-select" id="cajaChicaUbicacion" required>
                        <option value="">Seleccionar ubicación</option>
                        ${(window.ubicacionesData || []).map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
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
                <button type="submit" class="btn btn-success w-100" onclick="window.registrarCajaChica(event)">Registrar</button>
            </form>
        `;

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }

  async function registrarCajaChica(event) {
    event.preventDefault();
    const data = {
      id_ubicacion: parseInt(
        document.getElementById("cajaChicaUbicacion").value,
      ),
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
    const modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error: Modal de caja no encontrado", "error");
      return;
    }

    document.getElementById("cajaModalTitle").textContent = "Registrar Gasto";
    document.getElementById("cajaDenominacionesContainer").style.display =
      "none";
    document.getElementById("btnAbrirTurno").style.display = "none";
    document.getElementById("btnCerrarTurno").style.display = "none";

    const body = document.getElementById("cajaModalBody");
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
                        ${(window.ubicacionesData || []).map((u) => `<option value="${u.id}">${u.nombre || u.id}</option>`).join("")}
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
                <button type="submit" class="btn btn-danger w-100" onclick="window.registrarGasto(event)">Registrar Gasto</button>
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
      observaciones:
        document.getElementById("gastoObservaciones").value || null,
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
    const modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error: Modal de caja no encontrado", "error");
      return;
    }

    const body = modal.querySelector(".modal-body");
    if (!body) {
      showToast("Error: Cuerpo del modal no encontrado", "error");
      return;
    }

    const title = document.getElementById("cajaModalTitle");
    if (title) title.textContent = "Nuevo Tipo de Gasto";

    const denominacionesContainer = document.getElementById(
      "cajaDenominacionesContainer",
    );
    if (denominacionesContainer) denominacionesContainer.style.display = "none";

    const btnAbrir = document.getElementById("btnAbrirTurno");
    if (btnAbrir) btnAbrir.style.display = "none";

    const btnCerrar = document.getElementById("btnCerrarTurno");
    if (btnCerrar) btnCerrar.style.display = "none";

    body.innerHTML = `
      <form id="cajaForm" onsubmit="window.crearTipoGasto(event)">
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
        <button type="submit" class="btn btn-primary w-100">Guardar</button>
      </form>
    `;

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }

  async function crearTipoGasto(event) {
    event.preventDefault();
    const data = {
      nombre: document.getElementById("tipoGastoNombre").value,
      descripcion:
        document.getElementById("tipoGastoDescripcion").value || null,
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
      window.tiposPagoData = (await api.getTiposPago()) || [];
      renderTiposPago(window.tiposPagoData);
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
    const modal = document.getElementById("cajaModal");
    if (!modal) {
      showToast("Error: Modal de caja no encontrado", "error");
      return;
    }

    const body = modal.querySelector(".modal-body");
    if (!body) {
      showToast("Error: Cuerpo del modal no encontrado", "error");
      return;
    }

    // ✅ Verificar que los elementos existan antes de usarlos
    const title = document.getElementById("cajaModalTitle");
    if (title) title.textContent = "Nuevo Tipo de Pago";

    const denominacionesContainer = document.getElementById(
      "cajaDenominacionesContainer",
    );
    if (denominacionesContainer) denominacionesContainer.style.display = "none";

    const btnAbrir = document.getElementById("btnAbrirTurno");
    if (btnAbrir) btnAbrir.style.display = "none";

    const btnCerrar = document.getElementById("btnCerrarTurno");
    if (btnCerrar) btnCerrar.style.display = "none";

    body.innerHTML = `
      <form id="cajaForm" onsubmit="window.crearTipoPago(event)">
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
        <button type="submit" class="btn btn-primary w-100">Guardar</button>
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

  function mostrarConfirmacion(titulo, mensaje) {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal fade";
      modal.id = "confirmModal";
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${titulo}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">${mensaje.replace(/\n/g, "<br>")}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="confirmYes">Confirmar</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();
      document.getElementById("confirmYes").addEventListener("click", () => {
        modalInstance.hide();
        setTimeout(() => modal.remove(), 300);
        resolve(true);
      });
      modal.addEventListener("hidden.bs.modal", () => {
        setTimeout(() => modal.remove(), 300);
        resolve(false);
      });
    });
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
  window.abrirModalTurno = abrirModalTurno;
  window.agregarDenominacion = agregarDenominacion;
  window.mostrarSelectorTurnos = mostrarSelectorTurnos;
})();
