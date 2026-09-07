// Configuracion

let configuracionData = null;
let metasData = [];

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function getNombreUbicacion(id) {
  const ubicacion = (window.ubicacionesData || []).find((u) => u.id === id);
  return ubicacion ? ubicacion.nombre : `ID: ${id}`;
}

// =============================================
// CARGA DEL MODULO
// =============================================
async function loadConfiguracionModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-cog me-2 text-dark"></i>Configuración</h4>
        </div>

        <ul class="nav nav-tabs mb-3" id="configTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#generalTab">
                    <i class="fas fa-building me-1"></i>General
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#ubicacionesTab">
                    <i class="fas fa-map-marker-alt me-1"></i>Ubicaciones
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#metasTab">
                    <i class="fas fa-bullseye me-1"></i>Metas Financieras
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <div class="tab-pane fade show active" id="generalTab">
                <div id="configuracionContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-dark" role="status"></div>
                        <p class="mt-2 text-muted">Cargando configuración...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="ubicacionesTab">
                <div id="ubicacionesContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando ubicaciones...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="metasTab">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">Metas Financieras</h6>
                    <button class="btn btn-sm btn-outline-primary" onclick="showCreateMetaModal()">
                        <i class="fas fa-plus me-1"></i>Nueva Meta
                    </button>
                </div>
                <div id="metasContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-dark" role="status"></div>
                        <p class="mt-2 text-muted">Cargando metas...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  try {
    const [configuracion, metas, ubicaciones] = await Promise.all([
      api.getConfiguracion().catch(() => null),
      api.getMetasFinancieras().catch(() => []),
      api.request("/ubicaciones").catch((err) => {
        console.warn("Error al cargar ubicaciones:", err);
        return [];
      }),
    ]);

    configuracionData = configuracion;
    metasData = metas || [];
    window.ubicacionesData = ubicaciones || [];

    // Guardar backup en localStorage
    try {
      localStorage.setItem(
        "ubicaciones_backup",
        JSON.stringify(window.ubicacionesData),
      );
    } catch (e) {}

    renderConfiguracion(configuracionData);
    renderMetas(metasData);
    renderUbicaciones(window.ubicacionesData);
  } catch (error) {
    document.getElementById("configuracionContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// =============================================
// RENDER CONFIGURACION GENERAL
// =============================================
function renderConfiguracion(config) {
  const container = document.getElementById("configuracionContainer");
  if (!container) return;

  if (!config) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-cog fa-3x mb-3"></i>
                <p>No hay configuración registrada</p>
                <button class="btn btn-dark btn-sm" onclick="showEditConfigModal()">
                    <i class="fas fa-plus me-2"></i>Configurar
                </button>
            </div>
        `;
    return;
  }

  container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 fw-bold">Configuración General</h6>
                    <button class="btn btn-sm btn-outline-dark" onclick="showEditConfigModal()">
                        <i class="fas fa-edit me-1"></i>Editar
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-2"><strong>Nombre Negocio:</strong> ${config.nombre_negocio || "--"}</div>
                        <div class="mb-2"><strong>Dirección:</strong> ${config.direccion || "--"}</div>
                        <div class="mb-2"><strong>Teléfono:</strong> ${config.telefono || "--"}</div>
                        <div class="mb-2"><strong>Email:</strong> ${config.email || "--"}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-2"><strong>NIT:</strong> ${config.nit || "--"}</div>
                        <div class="mb-2"><strong>IVA %:</strong> ${config.iva_porcentaje || 0}%</div>
                        <div class="mb-2"><strong>Caja Chica Default:</strong> Q${config.monto_caja_chica_default || 0}</div>
                        <div class="mb-2"><strong>Días Alerta Stock:</strong> ${config.dias_alerta_stock || 0}</div>
                        <div class="mb-2"><strong>Moneda:</strong> ${config.moneda || "Q"}</div>
                        <div class="mb-2"><strong>Formato Impresión:</strong> ${config.formato_impresion || "--"}</div>
                        <div class="mb-2"><strong>Ubicación por Defecto:</strong> ${config.id_ubicacion ? getNombreUbicacion(config.id_ubicacion) : "--"}</div>
                    </div>
                </div>
                ${config.logo_ruta ? `<div class="mt-3"><strong>Logo:</strong> <img src="${config.logo_ruta}" style="max-height:100px;" /></div>` : ""}
                <div class="mt-3 text-muted small">
                    Última actualización: ${config.fecha_actualizacion ? new Date(config.fecha_actualizacion).toLocaleString() : "--"}
                </div>
            </div>
        </div>
    `;
}

// =============================================
// EDITAR CONFIGURACION - MODAL
// =============================================
function showEditConfigModal() {
  let modal = document.getElementById("configModal");
  if (!modal) {
    crearModalConfig();
    modal = document.getElementById("configModal");
    if (!modal) {
      showToast("Error al crear modal", "error");
      return;
    }
  }

  const title = document.getElementById("configModalTitle");
  if (title) title.textContent = "Editar Configuración";

  const form = document.getElementById("configForm");
  if (form) form.reset();

  // Cargar datos de configuración
  if (configuracionData) {
    document.getElementById("configNombreNegocio").value =
      configuracionData.nombre_negocio || "";
    document.getElementById("configDireccion").value =
      configuracionData.direccion || "";
    document.getElementById("configTelefono").value =
      configuracionData.telefono || "";
    document.getElementById("configEmail").value =
      configuracionData.email || "";
    document.getElementById("configNit").value = configuracionData.nit || "";
    document.getElementById("configIva").value =
      configuracionData.iva_porcentaje || 0;
    document.getElementById("configCajaChica").value =
      configuracionData.monto_caja_chica_default || 0;
    document.getElementById("configDiasAlerta").value =
      configuracionData.dias_alerta_stock || 0;
    document.getElementById("configMoneda").value =
      configuracionData.moneda || "Q";
    document.getElementById("configFormato").value =
      configuracionData.formato_impresion || "";
    document.getElementById("configLogo").value =
      configuracionData.logo_ruta || "";
  }

  // ✅ Cargar ubicaciones en el select
  const selectUbicacion = document.getElementById("configUbicacion");
  if (selectUbicacion) {
    const currentValue = configuracionData?.id_ubicacion || "";
    selectUbicacion.innerHTML =
      '<option value="">Seleccionar ubicación</option>';
    (window.ubicacionesData || []).forEach((u) => {
      selectUbicacion.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
    });
    if (currentValue) {
      selectUbicacion.value = currentValue;
    }
  }

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// =============================================
// GUARDAR CONFIGURACION
// =============================================
async function saveConfig(event) {
  event.preventDefault();

  const data = {
    nombre_negocio:
      document.getElementById("configNombreNegocio").value.trim() || null,
    direccion: document.getElementById("configDireccion").value.trim() || null,
    telefono: document.getElementById("configTelefono").value.trim() || null,
    email: document.getElementById("configEmail").value.trim() || null,
    nit: document.getElementById("configNit").value.trim() || null,
    iva_porcentaje: parseFloat(document.getElementById("configIva").value) || 0,
    monto_caja_chica_default:
      parseFloat(document.getElementById("configCajaChica").value) || 0,
    dias_alerta_stock:
      parseInt(document.getElementById("configDiasAlerta").value) || 0,
    moneda: document.getElementById("configMoneda").value || "Q",
    formato_impresion: document.getElementById("configFormato").value || null,
    logo_ruta: document.getElementById("configLogo").value || null,
    id_ubicacion:
      parseInt(document.getElementById("configUbicacion").value) || null,
  };

  try {
    // ✅ Usar la ruta exacta con slash al final
    await api.request("/configuracion/", "PUT", data);
    showToast("Configuración actualizada correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("configModal"),
    );
    if (modal) modal.hide();

    await loadConfiguracionModule();
  } catch (error) {
    showToast(error.message || "Error al guardar configuración", "error");
  }
}

// =============================================
// METAS FINANCIERAS
// =============================================
function renderMetas(metas) {
  const container = document.getElementById("metasContainer");
  if (!container) return;

  if (!metas || metas.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-bullseye fa-3x mb-3"></i>
                <p>No hay metas financieras registradas</p>
                <button class="btn btn-sm btn-outline-primary" onclick="showCreateMetaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Meta
                </button>
            </div>
        `;
    return;
  }

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  let html = `
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>Mes</th>
                        <th>Año</th>
                        <th>Meta Ingresos</th>
                        <th>Meta Utilidad</th>
                        <th>Meta Gastos</th>
                        <th>Fecha Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  metas.forEach((m) => {
    html += `
            <tr>
                <td>${meses[m.mes - 1] || m.mes}</td>
                <td>${m.anio}</td>
                <td>Q${m.meta_ingresos || 0}</td>
                <td>Q${m.meta_utilidad || 0}</td>
                <td>Q${m.meta_gastos || 0}</td>
                <td>${m.fecha_registro ? new Date(m.fecha_registro).toLocaleDateString() : "--"}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMeta(${m.id})">
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
    `;

  container.innerHTML = html;
}

function showCreateMetaModal() {
  let modal = document.getElementById("metaModal");
  if (!modal) {
    crearModalMeta();
    modal = document.getElementById("metaModal");
    if (!modal) {
      showToast("Error al crear modal", "error");
      return;
    }
  }

  const title = document.getElementById("metaModalTitle");
  if (title) title.textContent = "Nueva Meta Financiera";

  document.getElementById("metaForm").reset();
  document.getElementById("metaId").value = "";
  document.getElementById("metaAnio").value = new Date().getFullYear();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveMeta(event) {
  event.preventDefault();

  const data = {
    mes: parseInt(document.getElementById("metaMes").value),
    anio: parseInt(document.getElementById("metaAnio").value),
    meta_ingresos:
      parseFloat(document.getElementById("metaIngresos").value) || null,
    meta_utilidad:
      parseFloat(document.getElementById("metaUtilidad").value) || null,
    meta_gastos:
      parseFloat(document.getElementById("metaGastos").value) || null,
  };

  if (!data.mes || !data.anio) {
    showToast("Mes y año son obligatorios", "error");
    return;
  }

  try {
    await api.request("/metas-financieras", "POST", data);
    showToast("Meta creada correctamente", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("metaModal"),
    );
    if (modal) modal.hide();

    await loadConfiguracionModule();
  } catch (error) {
    showToast(error.message || "Error al crear meta", "error");
  }
}

async function deleteMeta(id) {
  const confirmado = await mostrarConfirmacion(
    "Eliminar Meta",
    "¿Estás seguro de eliminar esta meta?",
  );
  if (!confirmado) return;

  try {
    await api.request(`/metas-financieras/${id}`, "DELETE");
    showToast("Meta eliminada correctamente", "success");
    await loadConfiguracionModule();
  } catch (error) {
    showToast(error.message || "Error al eliminar meta", "error");
  }
}

// =============================================
// CREAR MODALES
// =============================================
function crearModalConfig() {
  if (document.getElementById("configModal")) return;

  const html = `
    <div class="modal fade" id="configModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="configModalTitle">Configuración</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="configForm" onsubmit="saveConfig(event)">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Nombre Negocio</label>
                  <input type="text" class="form-control" id="configNombreNegocio" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">NIT</label>
                  <input type="text" class="form-control" id="configNit" />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Dirección</label>
                <input type="text" class="form-control" id="configDireccion" />
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Teléfono</label>
                  <input type="text" class="form-control" id="configTelefono" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="configEmail" />
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">IVA %</label>
                  <input type="number" step="0.01" class="form-control" id="configIva" />
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Caja Chica Default</label>
                  <input type="number" step="0.01" class="form-control" id="configCajaChica" />
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Días Alerta Stock</label>
                  <input type="number" class="form-control" id="configDiasAlerta" />
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Moneda</label>
                  <input type="text" class="form-control" id="configMoneda" placeholder="Q" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Formato Impresión</label>
                  <select class="form-select" id="configFormato">
                    <option value="">Seleccionar</option>
                    <option value="ticket">Ticket</option>
                    <option value="carta">Carta</option>
                    <option value="media">Media</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 mb-3">
                  <label class="form-label">Ubicación por Defecto</label>
                  <select class="form-select" id="configUbicacion">
                    <option value="">Seleccionar ubicación</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Ruta Logo</label>
                <input type="text" class="form-control" id="configLogo" placeholder="/assets/img/logo.png" />
              </div>
              <button type="submit" class="btn btn-dark w-100">Guardar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
}

function crearModalMeta() {
  if (document.getElementById("metaModal")) return;

  const html = `
    <div class="modal fade" id="metaModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="metaModalTitle">Meta Financiera</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="metaForm" onsubmit="saveMeta(event)">
              <input type="hidden" id="metaId" />
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Mes</label>
                  <select class="form-select" id="metaMes" required>
                    <option value="">Seleccionar</option>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Año</label>
                  <input type="number" class="form-control" id="metaAnio" value="${new Date().getFullYear()}" required />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Meta Ingresos</label>
                <input type="number" step="0.01" class="form-control" id="metaIngresos" />
              </div>
              <div class="mb-3">
                <label class="form-label">Meta Utilidad</label>
                <input type="number" step="0.01" class="form-control" id="metaUtilidad" />
              </div>
              <div class="mb-3">
                <label class="form-label">Meta Gastos</label>
                <input type="number" step="0.01" class="form-control" id="metaGastos" />
              </div>
              <button type="submit" class="btn btn-primary w-100">Guardar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
}

// =============================================
// UBICACIONES
// =============================================
async function cargarUbicaciones() {
  const container = document.getElementById("ubicacionesContainer");
  if (!container) return;

  try {
    const ubicaciones = await api.request("/ubicaciones").catch(() => []);
    window.ubicacionesData = ubicaciones || [];

    try {
      localStorage.setItem(
        "ubicaciones_backup",
        JSON.stringify(window.ubicacionesData),
      );
    } catch (e) {}

    renderUbicaciones(ubicaciones);
    actualizarSelectsUbicacion();
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error al cargar ubicaciones: ${error.message}</div>`;
  }
}

function renderUbicaciones(ubicaciones) {
  const container = document.getElementById("ubicacionesContainer");
  if (!container) return;

  if (!ubicaciones || ubicaciones.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="fas fa-map-marker-alt fa-3x mb-3"></i>
        <p>No hay ubicaciones registradas</p>
        <button class="btn btn-primary btn-sm" onclick="showCreateUbicacionModal()">
          <i class="fas fa-plus me-1"></i>Nueva Ubicación
        </button>
      </div>
    `;
    return;
  }

  let html = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0">Listado de Ubicaciones</h6>
      <button class="btn btn-primary btn-sm" onclick="showCreateUbicacionModal()">
        <i class="fas fa-plus me-1"></i>Nueva Ubicación
      </button>
    </div>
    <div class="table-responsive">
      <table class="table table-hover table-striped">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;

  ubicaciones.forEach((u) => {
    const activo = u.activo !== 0;
    html += `
      <tr>
        <td>${u.id}</td>
        <td><strong>${u.nombre || "--"}</strong></td>
        <td>${u.descripcion || "--"}</td>
        <td>${u.tipo || "--"}</td>
        <td>
          <span class="badge ${activo ? "bg-success" : "bg-danger"}">
            ${activo ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="showEditUbicacionModal(${u.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-${activo ? "danger" : "success"}" onclick="toggleUbicacionEstado(${u.id})">
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
      <small class="text-muted">Total: ${ubicaciones.length} ubicaciones</small>
    </div>
  `;

  container.innerHTML = html;
}

function showCreateUbicacionModal() {
  let modal = document.getElementById("ubicacionModal");
  if (!modal) {
    crearModalUbicacion();
    modal = document.getElementById("ubicacionModal");
    if (!modal) {
      showToast("Error al crear modal", "error");
      return;
    }
  }

  const title = document.getElementById("ubicacionModalTitle");
  if (title) title.textContent = "Nueva Ubicación";

  document.getElementById("ubicacionForm").reset();
  document.getElementById("ubicacionId").value = "";
  document.getElementById("ubicacionActivo").value = "1";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditUbicacionModal(id) {
  try {
    const ubicacion = window.ubicacionesData.find((u) => u.id === id);
    if (!ubicacion) {
      showToast("Ubicación no encontrada", "error");
      return;
    }

    let modal = document.getElementById("ubicacionModal");
    if (!modal) {
      crearModalUbicacion();
      modal = document.getElementById("ubicacionModal");
      if (!modal) {
        showToast("Error al crear modal", "error");
        return;
      }
    }

    const title = document.getElementById("ubicacionModalTitle");
    if (title) title.textContent = "Editar Ubicación";

    document.getElementById("ubicacionId").value = ubicacion.id;
    document.getElementById("ubicacionNombre").value = ubicacion.nombre || "";
    document.getElementById("ubicacionDescripcion").value =
      ubicacion.descripcion || "";
    document.getElementById("ubicacionTipo").value = ubicacion.tipo || "";
    document.getElementById("ubicacionActivo").value =
      ubicacion.activo !== 0 ? "1" : "0";

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    showToast(error.message || "Error al cargar ubicación", "error");
  }
}

async function saveUbicacion(event) {
  event.preventDefault();

  const id = document.getElementById("ubicacionId").value;
  const nombre = document.getElementById("ubicacionNombre").value.trim();

  if (!nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  const data = {
    nombre: nombre,
    descripcion:
      document.getElementById("ubicacionDescripcion").value.trim() || null,
    tipo: document.getElementById("ubicacionTipo").value || null,
    activo: parseInt(document.getElementById("ubicacionActivo").value),
  };

  try {
    if (id) {
      await api.request(`/ubicaciones/${id}`, "PUT", data);
      showToast("Ubicación actualizada correctamente", "success");
    } else {
      await api.request("/ubicaciones", "POST", data);
      showToast("Ubicación creada correctamente", "success");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("ubicacionModal"),
    );
    if (modal) modal.hide();

    await cargarUbicaciones();
    await loadConfiguracionModule();
  } catch (error) {
    showToast(error.message || "Error al guardar ubicación", "error");
  }
}

async function toggleUbicacionEstado(id) {
  const ubicacion = window.ubicacionesData.find((u) => u.id === id);
  if (!ubicacion) return;

  const accion = ubicacion.activo !== 0 ? "inactivar" : "activar";
  const confirmado = await mostrarConfirmacion(
    `${accion === "inactivar" ? "Inactivar" : "Activar"} Ubicación`,
    `¿Está seguro de ${accion} la ubicación "${ubicacion.nombre}"?`,
  );

  if (!confirmado) return;

  try {
    await api.request(`/ubicaciones/${id}`, "PUT", {
      ...ubicacion,
      activo: ubicacion.activo !== 0 ? 0 : 1,
    });
    showToast(
      `Ubicación ${accion === "inactivar" ? "inactivada" : "activada"} correctamente`,
      "success",
    );
    await cargarUbicaciones();
    await loadConfiguracionModule();
  } catch (error) {
    showToast(error.message || "Error al cambiar estado", "error");
  }
}

function crearModalUbicacion() {
  if (document.getElementById("ubicacionModal")) return;

  const html = `
    <div class="modal fade" id="ubicacionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ubicacionModalTitle">Ubicación</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="ubicacionForm" onsubmit="saveUbicacion(event)" novalidate>
              <input type="hidden" id="ubicacionId" />
              <div class="mb-3">
                <label class="form-label">Nombre *</label>
                <input type="text" class="form-control" id="ubicacionNombre" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <input type="text" class="form-control" id="ubicacionDescripcion" />
              </div>
              <div class="mb-3">
                <label class="form-label">Tipo</label>
                <select class="form-select" id="ubicacionTipo">
                  <option value="">Seleccionar tipo</option>
                  <option value="Física">Física</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Almacén">Almacén</option>
                  <option value="Tienda">Tienda</option>
                  <option value="Bodega">Bodega</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Estado</label>
                <select class="form-select" id="ubicacionActivo">
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
}

// =============================================
// FUNCIONES GLOBALES PARA SELECTS
// =============================================
function actualizarSelectsUbicacion() {
  const selects = document.querySelectorAll('select[data-ubicacion="true"]');
  selects.forEach((sel) => {
    llenarSelectUbicacion(sel, window.ubicacionesData || []);
  });
}

function llenarSelectUbicacion(selectElement, ubicaciones) {
  if (!selectElement) return;
  const currentValue = selectElement.value;
  selectElement.innerHTML = '<option value="">Seleccionar ubicación</option>';
  (ubicaciones || []).forEach((u) => {
    selectElement.innerHTML += `<option value="${u.id}">${u.nombre || u.id}</option>`;
  });
  if (
    currentValue &&
    [...selectElement.options].some((o) => o.value == currentValue)
  ) {
    selectElement.value = currentValue;
  }
}

// =============================================
// EXPONER FUNCIONES GLOBALES
// =============================================
window.loadConfiguracionModule = loadConfiguracionModule;
window.showEditConfigModal = showEditConfigModal;
window.saveConfig = saveConfig;
window.showCreateMetaModal = showCreateMetaModal;
window.saveMeta = saveMeta;
window.deleteMeta = deleteMeta;
window.cargarUbicaciones = cargarUbicaciones;
window.showCreateUbicacionModal = showCreateUbicacionModal;
window.showEditUbicacionModal = showEditUbicacionModal;
window.saveUbicacion = saveUbicacion;
window.toggleUbicacionEstado = toggleUbicacionEstado;
window.actualizarSelectsUbicacion = actualizarSelectsUbicacion;
window.llenarSelectUbicacion = llenarSelectUbicacion;
window.getNombreUbicacion = getNombreUbicacion;
