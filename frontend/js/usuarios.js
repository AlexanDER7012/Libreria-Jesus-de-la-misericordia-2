// usuarios.js - VERSIÓN COMPLETA CON TODAS LAS FUNCIONALIDADES

let usuariosData = [];
let empleadosData = [];
let rolesData = [];
let puestosData = [];
let turnosData = [];
let modulosData = [];
let permisosData = [];
let rolPermisosData = [];
let pagosEmpleadoData = [];
let logsData = [];

// ============================================================
// CARGA DEL MÓDULO
// ============================================================
async function loadUsuariosModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-user-shield me-2 text-danger"></i>Usuarios</h4>
            <div>
                <button class="btn btn-danger btn-sm me-2" onclick="showCreateUsuarioModal()">
                    <i class="fas fa-plus me-2"></i>Usuario
                </button>
                <button class="btn btn-outline-danger btn-sm me-2" onclick="showCreateEmpleadoModal()">
                    <i class="fas fa-user-plus me-1"></i>Empleado
                </button>
                <button class="btn btn-outline-primary btn-sm me-2" onclick="showCreateRolModal()">
                    <i class="fas fa-user-tag me-1"></i>Rol
                </button>
                <button class="btn btn-outline-success btn-sm" onclick="showCreatePagoEmpleadoModal()">
                    <i class="fas fa-money-bill-wave me-1"></i>Pago
                </button>
            </div>
        </div>

        <!-- PESTAÑAS PRINCIPALES -->
        <ul class="nav nav-tabs mb-3" id="usuariosTabs">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#usuariosTab">
                    <i class="fas fa-users me-1"></i>Usuarios
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#empleadosTab">
                    <i class="fas fa-user-tie me-1"></i>Empleados
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#rolesTab">
                    <i class="fas fa-user-tag me-1"></i>Roles y Permisos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#pagosTab">
                    <i class="fas fa-money-bill-wave me-1"></i>Pagos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#catalogosTab">
                    <i class="fas fa-list me-1"></i>Catálogos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#logsTab">
                    <i class="fas fa-history me-1"></i>Bitácora
                </a>
            </li>
        </ul>

        <div class="tab-content">
            <!-- USUARIOS -->
            <div class="tab-pane fade show active" id="usuariosTab">
                <div id="usuariosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando usuarios...</p></div></div>
            </div>
            <!-- EMPLEADOS -->
            <div class="tab-pane fade" id="empleadosTab">
                <div id="empleadosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando empleados...</p></div></div>
            </div>
            <!-- ROLES Y PERMISOS -->
            <div class="tab-pane fade" id="rolesTab">
                <div id="rolesContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando roles...</p></div></div>
            </div>
            <!-- PAGOS -->
            <div class="tab-pane fade" id="pagosTab">
                <div id="pagosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando pagos...</p></div></div>
            </div>
            <!-- CATÁLOGOS -->
            <div class="tab-pane fade" id="catalogosTab">
                <div id="catalogosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando catálogos...</p></div></div>
            </div>
            <!-- BITÁCORA -->
            <div class="tab-pane fade" id="logsTab">
                <div id="logsContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando bitácora...</p></div></div>
            </div>
        </div>
    `;

  await cargarDatos();
}

// ============================================================
// CARGAR DATOS
// ============================================================
async function cargarDatos() {
  try {
    const [
      usuarios,
      empleados,
      roles,
      puestos,
      turnos,
      modulos,
      permisos,
      pagos,
      logs,
    ] = await Promise.all([
      api.getUsuarios().catch(() => []),
      api.getEmpleados().catch(() => []),
      api.getRoles().catch(() => []),
      api.getPuestos().catch(() => []),
      api.getTurnos().catch(() => []),
      api.getModulos().catch(() => []),
      api.getPermisos().catch(() => []),
      api.request("/pagos-empleado").catch(() => []),
      api.request("/logs").catch(() => []),
    ]);

    usuariosData = usuarios || [];
    empleadosData = empleados || [];
    rolesData = roles || [];
    puestosData = puestos || [];
    turnosData = turnos || [];
    modulosData = modulos || [];
    permisosData = permisos || [];
    pagosEmpleadoData = pagos || [];
    logsData = logs || [];

    renderUsuarios(usuariosData);
    renderEmpleados(empleadosData);
    renderRoles(rolesData);
    renderPagos(pagosEmpleadoData);
    renderCatalogos();
    renderLogs(logsData);

    await cargarPermisosRoles();
  } catch (error) {
    console.error("Error cargando datos:", error);
    showToast("Error al cargar datos: " + error.message, "error");
  }
}

// ============================================================
// CARGAR PERMISOS DE ROLES
// ============================================================
async function cargarPermisosRoles() {
  rolPermisosData = [];
  for (const rol of rolesData) {
    try {
      const permisos = await api.request(`/roles/${rol.id}/permisos`);
      rolPermisosData = rolPermisosData.concat(
        permisos.map((p) => ({ ...p, rol_nombre: rol.nombre })),
      );
    } catch (e) {
      console.warn(`No se pudieron cargar permisos para rol ${rol.id}`);
    }
  }
}

// ============================================================
// RENDER: USUARIOS
// ============================================================
function renderUsuarios(usuarios) {
  const container = document.getElementById("usuariosContainer");
  if (!container) return;

  if (!usuarios || usuarios.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-users fa-3x mb-3"></i>
                <p>No hay usuarios registrados</p>
                <button class="btn btn-danger btn-sm" onclick="showCreateUsuarioModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Usuario
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
                        <th>Usuario</th>
                        <th>Empleado</th>
                        <th>Rol</th>
                        <th>Último Acceso</th>
                        <th>Intentos</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  usuarios.forEach((u) => {
    const empleado = empleadosData.find((e) => e.id === u.id_empleado);
    const rol = rolesData.find((r) => r.id === u.id_rol);
    const activo = u.activo !== 0;

    html += `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.nombre_usuario || "--"}</strong></td>
                <td>${empleado ? empleado.nombre : "--"}</td>
                <td>${rol ? rol.nombre : "--"}</td>
                <td>${u.fecha_ultimo_acceso ? new Date(u.fecha_ultimo_acceso).toLocaleString() : "--"}</td>
                <td>${u.intentos_fallidos || 0}</td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditUsuarioModal(${u.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${
                      activo
                        ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUsuario(${u.id})" title="Desactivar">
                            <i class="fas fa-times"></i>
                        </button>
                    `
                        : `
                        <button class="btn btn-sm btn-outline-success" onclick="reactivarUsuario(${u.id})" title="Reactivar">
                            <i class="fas fa-check"></i>
                        </button>
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
        <div class="text-end"><small class="text-muted">Total: ${usuarios.length} usuarios</small></div>
    `;

  container.innerHTML = html;
}

// ============================================================
// RENDER: EMPLEADOS
// ============================================================
function renderEmpleados(empleados) {
  const container = document.getElementById("empleadosContainer");
  if (!container) return;

  if (!empleados || empleados.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-user-tie fa-3x mb-3"></i>
                <p>No hay empleados registrados</p>
                <button class="btn btn-danger btn-sm" onclick="showCreateEmpleadoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Empleado
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
                        <th>Nombre</th>
                        <th>DPI</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Puesto</th>
                        <th>Turno</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  empleados.forEach((e) => {
    const puesto = puestosData.find((p) => p.id === e.id_puesto);
    const turno = turnosData.find((t) => t.id === e.id_turno);
    const activo = e.activo !== 0;

    html += `
            <tr>
                <td>${e.id}</td>
                <td><strong>${e.nombre || "--"}</strong></td>
                <td>${e.dpi || "--"}</td>
                <td>${e.telefono || "--"}</td>
                <td>${e.email || "--"}</td>
                <td>${puesto ? puesto.nombre : "--"}</td>
                <td>${turno ? turno.nombre : "--"}</td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditEmpleadoModal(${e.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmpleado(${e.id})" title="Eliminar">
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
        <div class="text-end"><small class="text-muted">Total: ${empleados.length} empleados</small></div>
    `;

  container.innerHTML = html;
}

// ============================================================
// RENDER: ROLES Y PERMISOS
// ============================================================
function renderRoles(roles) {
  const container = document.getElementById("rolesContainer");
  if (!container) return;

  if (!roles || roles.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-user-tag fa-3x mb-3"></i>
                <p>No hay roles registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateRolModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Rol
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="row">
            ${roles
              .map((r) => {
                const permisosRol = rolPermisosData.filter(
                  (p) => p.id_rol === r.id,
                );
                const permisosNombres = permisosRol.map((p) => {
                  const permiso = permisosData.find(
                    (per) => per.id === p.id_permiso,
                  );
                  return permiso ? permiso.nombre : "--";
                });

                return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="fw-bold">${r.nombre}</h6>
                            <p class="small text-muted">${r.descripcion || "Sin descripción"}</p>
                            <p class="small">Nivel: ${r.nivel || 0}</p>
                            <div class="mb-2">
                                <span class="badge bg-secondary">${permisosRol.length} permisos</span>
                            </div>
                            <div class="d-flex gap-1 flex-wrap">
                                ${permisosNombres
                                  .slice(0, 5)
                                  .map(
                                    (n) =>
                                      `<span class="badge bg-primary">${n}</span>`,
                                  )
                                  .join("")}
                                ${permisosNombres.length > 5 ? `<span class="badge bg-secondary">+${permisosNombres.length - 5}</span>` : ""}
                            </div>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-outline-primary" onclick="verPermisosRol(${r.id})">
                                <i class="fas fa-key me-1"></i>Gestionar Permisos
                            </button>
                        </div>
                    </div>
                </div>
            `;
              })
              .join("")}
        </div>
        <div class="mt-3">
            <button class="btn btn-primary btn-sm" onclick="showCreateRolModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Rol
            </button>
        </div>
    `;

  container.innerHTML = html;
}

// ============================================================
// RENDER: PAGOS DE EMPLEADOS
// ============================================================
function renderPagos(pagos) {
  const container = document.getElementById("pagosContainer");
  if (!container) return;

  if (!pagos || pagos.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-money-bill-wave fa-3x mb-3"></i>
                <p>No hay pagos registrados</p>
                <button class="btn btn-success btn-sm" onclick="showCreatePagoEmpleadoModal()">
                    <i class="fas fa-plus me-2"></i>Registrar Pago
                </button>
            </div>
        `;
    return;
  }

  let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Historial de Pagos</h6>
            <button class="btn btn-success btn-sm" onclick="showCreatePagoEmpleadoModal()">
                <i class="fas fa-plus me-2"></i>Nuevo Pago
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Empleado</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                        <th>Periodo</th>
                        <th>Referencia</th>
                        <th>Fecha Pago</th>
                    </tr>
                </thead>
                <tbody>
    `;

  pagos.forEach((p) => {
    const empleado = empleadosData.find((e) => e.id === p.id_empleado);
    html += `
            <tr>
                <td>${p.id}</td>
                <td><strong>${empleado ? empleado.nombre : "--"}</strong></td>
                <td>${p.concepto || "--"}</td>
                <td class="fw-bold text-success">Q${(p.monto || 0).toFixed(2)}</td>
                <td>${p.periodo || "--"}</td>
                <td>${p.referencia || "--"}</td>
                <td>${p.fecha_pago ? new Date(p.fecha_pago).toLocaleString() : "--"}</td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end"><small class="text-muted">Total: ${pagos.length} pagos</small></div>
    `;

  container.innerHTML = html;
}

// ============================================================
// RENDER: CATÁLOGOS (Puestos, Turnos, Módulos)
// ============================================================
function renderCatalogos() {
  const container = document.getElementById("catalogosContainer");
  if (!container) return;

  let html = `
        <div class="row">
            <!-- Puestos -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="fas fa-briefcase me-2"></i>Puestos</h6>
                    </div>
                    <div class="card-body" style="max-height:300px;overflow-y:auto;">
                        ${puestosData.length === 0 ? '<p class="text-muted small">No hay puestos</p>' : ""}
                        <ul class="list-group list-group-flush">
                            ${puestosData
                              .map(
                                (p) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span><strong>${p.nombre}</strong></span>
                                    <span class="badge bg-secondary">${p.descripcion || "--"}</span>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-primary" onclick="showCreatePuestoModal()">
                            <i class="fas fa-plus me-1"></i>Nuevo Puesto
                        </button>
                    </div>
                </div>
            </div>

            <!-- Turnos -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-clock me-2"></i>Turnos</h6>
                    </div>
                    <div class="card-body" style="max-height:300px;overflow-y:auto;">
                        ${turnosData.length === 0 ? '<p class="text-muted small">No hay turnos</p>' : ""}
                        <ul class="list-group list-group-flush">
                            ${turnosData
                              .map(
                                (t) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span><strong>${t.nombre}</strong></span>
                                    <span class="badge bg-secondary">${t.hora_inicio ? t.hora_inicio.substring(0, 5) : "--"} - ${t.hora_fin ? t.hora_fin.substring(0, 5) : "--"}</span>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-success" onclick="showCreateTurnoModal()">
                            <i class="fas fa-plus me-1"></i>Nuevo Turno
                        </button>
                    </div>
                </div>
            </div>

            <!-- Módulos -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-cubes me-2"></i>Módulos</h6>
                    </div>
                    <div class="card-body" style="max-height:300px;overflow-y:auto;">
                        ${modulosData.length === 0 ? '<p class="text-muted small">No hay módulos</p>' : ""}
                        <ul class="list-group list-group-flush">
                            ${modulosData
                              .map(
                                (m) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span><i class="fas ${m.icono || "fa-cube"} me-2"></i><strong>${m.nombre}</strong></span>
                                    <span class="badge bg-secondary">Orden: ${m.orden || 0}</span>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-info" onclick="showCreateModuloModal()">
                            <i class="fas fa-plus me-1"></i>Nuevo Módulo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  container.innerHTML = html;
}

// ============================================================
// RENDER: BITÁCORA (LOGS)
// ============================================================
function renderLogs(logs) {
  const container = document.getElementById("logsContainer");
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-history fa-3x mb-3"></i>
                <p>No hay registros en la bitácora</p>
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
                        <th>Fecha</th>
                        <th>Acción</th>
                        <th>Módulo</th>
                        <th>IP</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody>
    `;

  logs.slice(0, 200).forEach((l) => {
    const usuario = usuariosData.find((u) => u.id === l.id_usuario);
    const accionColor =
      l.accion === "LOGIN"
        ? "success"
        : l.accion === "LOGIN_FALLIDO"
          ? "danger"
          : l.accion === "CREAR"
            ? "primary"
            : l.accion === "EDITAR"
              ? "warning"
              : l.accion === "ELIMINAR"
                ? "danger"
                : "secondary";

    html += `
            <tr>
                <td>${l.id}</td>
                <td><strong>${usuario ? usuario.nombre_usuario : "--"}</strong></td>
                <td>${l.fecha ? new Date(l.fecha).toLocaleString() : "--"}</td>
                <td><span class="badge bg-${accionColor}">${l.accion || "--"}</span></td>
                <td>${l.modulo || "--"}</td>
                <td>${l.ip || "--"}</td>
                <td><small>${l.detalles || "--"}</small></td>
            </tr>
        `;
  });

  html += `
                </tbody>
            </table>
        </div>
        <div class="text-end"><small class="text-muted">Mostrando últimos 200 registros de ${logs.length}</small></div>
    `;

  container.innerHTML = html;
}

// ============================================================
// USUARIOS - CRUD
// ============================================================

function showCreateUsuarioModal() {
  const modal = document.getElementById("usuarioModal");
  if (!modal) {
    crearModalUsuario();
    setTimeout(() => showCreateUsuarioModal(), 100);
    return;
  }
  document.getElementById("usuarioModalTitle").textContent = "Nuevo Usuario";
  document.getElementById("usuarioForm").reset();
  document.getElementById("usuarioId").value = "";
  document.getElementById("usuarioPassword").required = true;
  document.getElementById("usuarioPassword").placeholder = "Nueva contraseña";
  llenarSelectEmpleado();
  llenarSelectRol();
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditUsuarioModal(id) {
  try {
    const usuario = usuariosData.find((u) => u.id === id);
    if (!usuario) {
      showToast("Usuario no encontrado", "error");
      return;
    }

    const modal = document.getElementById("usuarioModal");
    if (!modal) {
      crearModalUsuario();
      setTimeout(() => showEditUsuarioModal(id), 100);
      return;
    }

    document.getElementById("usuarioModalTitle").textContent = "Editar Usuario";
    document.getElementById("usuarioId").value = usuario.id;
    document.getElementById("usuarioNombre").value =
      usuario.nombre_usuario || "";
    document.getElementById("usuarioPassword").value = "";
    document.getElementById("usuarioPassword").required = false;
    document.getElementById("usuarioPassword").placeholder =
      "Dejar en blanco para no cambiar";
    document.getElementById("usuarioActivo").value =
      usuario.activo !== 0 ? "1" : "0";

    llenarSelectEmpleado(usuario.id_empleado);
    llenarSelectRol(usuario.id_rol);

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    showToast(error.message || "Error al cargar usuario", "error");
  }
}

// ============================================================
// USUARIOS - CRUD (CORREGIDO)
// ============================================================

async function saveUsuario(event) {
  event.preventDefault();

  const id = document.getElementById("usuarioId").value;
  const nombre_usuario = document.getElementById("usuarioNombre").value.trim();
  const password = document.getElementById("usuarioPassword").value.trim();
  const id_empleado =
    parseInt(document.getElementById("usuarioEmpleado").value) || null;
  const id_rol = parseInt(document.getElementById("usuarioRol").value) || null;
  const activo = parseInt(document.getElementById("usuarioActivo").value);

  if (!nombre_usuario) {
    showToast("El nombre de usuario es obligatorio", "error");
    return;
  }

  try {
    if (id) {
      // Editar usuario
      const data = { id_rol, activo };
      if (password) {
        data.password = password;
      }
      await api.request(`/usuarios/${id}`, "PUT", data);
      showToast("Usuario actualizado correctamente", "success");
    } else {
      // Crear usuario
      if (!password) {
        showToast("La contraseña es obligatoria", "error");
        return;
      }
      await api.request("/usuarios", "POST", {
        nombre_usuario,
        password,
        id_empleado,
        id_rol,
      });
      showToast("Usuario creado correctamente", "success");
    }

    // ✅ Cerrar modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("usuarioModal"),
    );
    if (modal) modal.hide();

    // ✅ Solo recargar datos, NO todo el módulo
    await cargarDatos();

    // ✅ Actualizar selects sin recargar todo
    llenarSelectEmpleado();
    llenarSelectRol();
  } catch (error) {
    showToast(error.message || "Error al guardar usuario", "error");
  }
}

async function deleteUsuario(id) {
  if (!confirm("¿Desactivar este usuario? Podrá reactivarse después.")) return;
  try {
    await api.request(`/usuarios/${id}`, "DELETE");
    showToast("Usuario desactivado correctamente", "success");
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al desactivar usuario", "error");
  }
}

async function reactivarUsuario(id) {
  if (!confirm("¿Reactivar este usuario?")) return;
  try {
    await api.request(`/usuarios/${id}/reactivar`, "PATCH");
    showToast("Usuario reactivado correctamente", "success");
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al reactivar usuario", "error");
  }
}

// ============================================================
// EMPLEADOS - CRUD
// ============================================================

function showCreateEmpleadoModal() {
  const modal = document.getElementById("empleadoModal");
  if (!modal) {
    crearModalEmpleado();
    setTimeout(() => showCreateEmpleadoModal(), 100);
    return;
  }
  document.getElementById("empleadoModalTitle").textContent = "Nuevo Empleado";
  document.getElementById("empleadoForm").reset();
  document.getElementById("empleadoId").value = "";
  llenarSelectPuesto();
  llenarSelectTurno();
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function showEditEmpleadoModal(id) {
  try {
    const empleado = empleadosData.find((e) => e.id === id);
    if (!empleado) {
      showToast("Empleado no encontrado", "error");
      return;
    }

    const modal = document.getElementById("empleadoModal");
    if (!modal) {
      crearModalEmpleado();
      setTimeout(() => showEditEmpleadoModal(id), 100);
      return;
    }

    document.getElementById("empleadoModalTitle").textContent =
      "Editar Empleado";
    document.getElementById("empleadoId").value = empleado.id;
    document.getElementById("empleadoNombre").value = empleado.nombre || "";
    document.getElementById("empleadoDpi").value = empleado.dpi || "";
    document.getElementById("empleadoTelefono").value = empleado.telefono || "";
    document.getElementById("empleadoEmail").value = empleado.email || "";
    document.getElementById("empleadoDireccion").value =
      empleado.direccion || "";
    document.getElementById("empleadoSalario").value =
      empleado.salario_base || "";
    document.getElementById("empleadoActivo").value =
      empleado.activo !== 0 ? "1" : "0";

    llenarSelectPuesto(empleado.id_puesto);
    llenarSelectTurno(empleado.id_turno);

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    showToast(error.message || "Error al cargar empleado", "error");
  }
}

async function saveEmpleado(event) {
  event.preventDefault();

  const id = document.getElementById("empleadoId").value;
  const data = {
    nombre: document.getElementById("empleadoNombre").value.trim(),
    dpi: document.getElementById("empleadoDpi").value.trim(),
    telefono: document.getElementById("empleadoTelefono").value.trim() || null,
    email: document.getElementById("empleadoEmail").value.trim() || null,
    direccion:
      document.getElementById("empleadoDireccion").value.trim() || null,
    salario_base:
      parseFloat(document.getElementById("empleadoSalario").value) || null,
    id_puesto:
      parseInt(document.getElementById("empleadoPuesto").value) || null,
    id_turno: parseInt(document.getElementById("empleadoTurno").value) || null,
    activo: parseInt(document.getElementById("empleadoActivo").value),
  };

  if (!data.nombre || !data.dpi) {
    showToast("Nombre y DPI son obligatorios", "error");
    return;
  }

  try {
    if (id) {
      await api.request(`/empleados/${id}`, "PUT", data);
      showToast("Empleado actualizado correctamente", "success");
    } else {
      await api.request("/empleados", "POST", data);
      showToast("Empleado creado correctamente", "success");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("empleadoModal"),
    );
    if (modal) modal.hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al guardar empleado", "error");
  }
}

async function deleteEmpleado(id) {
  if (!confirm("¿Eliminar este empleado?")) return;
  try {
    await api.request(`/empleados/${id}`, "DELETE");
    showToast("Empleado eliminado correctamente", "success");
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al eliminar empleado", "error");
  }
}

// ============================================================
// ROLES - CRUD
// ============================================================

function showCreateRolModal() {
  const modal = document.getElementById("rolModal");
  if (!modal) {
    crearModalRol();
    setTimeout(() => showCreateRolModal(), 100);
    return;
  }
  document.getElementById("rolModalTitle").textContent = "Nuevo Rol";
  document.getElementById("rolForm").reset();
  document.getElementById("rolId").value = "";
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveRol(event) {
  event.preventDefault();

  const nombre = document.getElementById("rolNombre").value.trim();
  const descripcion =
    document.getElementById("rolDescripcion").value.trim() || null;
  const nivel = parseInt(document.getElementById("rolNivel").value) || 0;

  if (!nombre) {
    showToast("El nombre del rol es obligatorio", "error");
    return;
  }

  try {
    await api.request("/roles", "POST", { nombre, descripcion, nivel });
    showToast("Rol creado correctamente", "success");
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("rolModal"),
    );
    if (modal) modal.hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al crear rol", "error");
  }
}

// ============================================================
// PUESTOS - CRUD
// ============================================================

function showCreatePuestoModal() {
  const modal = document.getElementById("puestoModal");
  if (!modal) {
    crearModalPuesto();
    setTimeout(() => showCreatePuestoModal(), 100);
    return;
  }
  document.getElementById("puestoModalTitle").textContent = "Nuevo Puesto";
  document.getElementById("puestoForm").reset();
  document.getElementById("puestoId").value = "";
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function savePuesto(event) {
  event.preventDefault();

  const nombre = document.getElementById("puestoNombre").value.trim();
  const descripcion =
    document.getElementById("puestoDescripcion").value.trim() || null;

  if (!nombre) {
    showToast("El nombre del puesto es obligatorio", "error");
    return;
  }

  try {
    await api.request("/puestos", "POST", { nombre, descripcion });
    showToast("Puesto creado correctamente", "success");
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("puestoModal"),
    );
    if (modal) modal.hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al crear puesto", "error");
  }
}

// ============================================================
// TURNOS - CRUD
// ============================================================

function showCreateTurnoModal() {
  const modal = document.getElementById("turnoModal");
  if (!modal) {
    crearModalTurno();
    setTimeout(() => showCreateTurnoModal(), 100);
    return;
  }
  document.getElementById("turnoModalTitle").textContent = "Nuevo Turno";
  document.getElementById("turnoForm").reset();
  document.getElementById("turnoId").value = "";
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveTurno(event) {
  event.preventDefault();

  const nombre = document.getElementById("turnoNombre").value.trim();
  const hora_inicio = document.getElementById("turnoHoraInicio").value;
  const hora_fin = document.getElementById("turnoHoraFin").value;

  if (!nombre) {
    showToast("El nombre del turno es obligatorio", "error");
    return;
  }
  if (!hora_inicio || !hora_fin) {
    showToast("Las horas de inicio y fin son obligatorias", "error");
    return;
  }

  try {
    await api.request("/turnos", "POST", { nombre, hora_inicio, hora_fin });
    showToast("Turno creado correctamente", "success");
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("turnoModal"),
    );
    if (modal) modal.hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al crear turno", "error");
  }
}

// ============================================================
// MÓDULOS - CRUD
// ============================================================

function showCreateModuloModal() {
  const modal = document.getElementById("moduloModal");
  if (!modal) {
    crearModalModulo();
    setTimeout(() => showCreateModuloModal(), 100);
    return;
  }
  document.getElementById("moduloModalTitle").textContent = "Nuevo Módulo";
  document.getElementById("moduloForm").reset();
  document.getElementById("moduloId").value = "";
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function saveModulo(event) {
  event.preventDefault();

  const nombre = document.getElementById("moduloNombre").value.trim();
  const descripcion =
    document.getElementById("moduloDescripcion").value.trim() || null;
  const icono =
    document.getElementById("moduloIcono").value.trim() || "fa-cube";
  const orden = parseInt(document.getElementById("moduloOrden").value) || 0;

  if (!nombre) {
    showToast("El nombre del módulo es obligatorio", "error");
    return;
  }

  try {
    await api.request("/modulos", "POST", {
      nombre,
      descripcion,
      icono,
      orden,
    });
    showToast("Módulo creado correctamente", "success");
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("moduloModal"),
    );
    if (modal) modal.hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al crear módulo", "error");
  }
}

// ============================================================
// PAGOS DE EMPLEADOS - CRUD
// ============================================================

function showCreatePagoEmpleadoModal() {
  const modal = document.getElementById("pagoEmpleadoModal");
  if (!modal) {
    crearModalPagoEmpleado();
    setTimeout(() => showCreatePagoEmpleadoModal(), 100);
    return;
  }
  document.getElementById("pagoEmpleadoModalTitle").textContent =
    "Registrar Pago";
  document.getElementById("pagoEmpleadoForm").reset();
  document.getElementById("pagoEmpleadoId").value = "";
  llenarSelectEmpleadoPago();
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

async function savePagoEmpleado(event) {
  event.preventDefault();

  const data = {
    id_empleado: parseInt(
      document.getElementById("pagoEmpleadoEmpleado").value,
    ),
    concepto: document.getElementById("pagoEmpleadoConcepto").value.trim(),
    monto: parseFloat(document.getElementById("pagoEmpleadoMonto").value),
    periodo: document.getElementById("pagoEmpleadoPeriodo").value.trim(),
    referencia:
      document.getElementById("pagoEmpleadoReferencia").value.trim() || null,
    observaciones:
      document.getElementById("pagoEmpleadoObservaciones").value.trim() || null,
  };

  if (!data.id_empleado) {
    showToast("Selecciona un empleado", "error");
    return;
  }
  if (!data.concepto) {
    showToast("El concepto es obligatorio", "error");
    return;
  }
  if (!data.monto || data.monto <= 0) {
    showToast("El monto debe ser mayor a 0", "error");
    return;
  }

  try {
    await api.request("/pagos-empleado", "POST", data);
    showToast("Pago registrado correctamente", "success");
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("pagoEmpleadoModal"),
    );
    if (modal) modal.hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al registrar pago", "error");
  }
}

// ============================================================
// GESTIÓN DE PERMISOS POR ROL
// ============================================================

async function verPermisosRol(idRol) {
  try {
    const rol = rolesData.find((r) => r.id === idRol);
    if (!rol) {
      showToast("Rol no encontrado", "error");
      return;
    }

    const permisosRol = await api.request(`/roles/${idRol}/permisos`);
    const permisosIds = permisosRol.map((p) => p.id_permiso);

    const permisosPorModulo = {};
    permisosData.forEach((p) => {
      const modulo = modulosData.find((m) => m.id === p.id_modulo);
      const moduloNombre = modulo ? modulo.nombre : "Sin módulo";
      if (!permisosPorModulo[moduloNombre]) {
        permisosPorModulo[moduloNombre] = [];
      }
      permisosPorModulo[moduloNombre].push({
        ...p,
        tienePermiso: permisosIds.includes(p.id),
        rolPermisoId: permisosRol.find((rp) => rp.id_permiso === p.id)?.id,
      });
    });

    let html = `
            <div class="modal-header">
                <h5 class="modal-title">Gestionar Permisos - ${rol.nombre}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p class="text-muted small">Marca o desmarca los permisos para este rol. Los cambios se guardan automáticamente.</p>
                <div id="permisosContainer">
        `;

    Object.keys(permisosPorModulo).forEach((moduloNombre) => {
      const permisos = permisosPorModulo[moduloNombre];
      html += `
                <div class="card mb-2">
                    <div class="card-header bg-light">
                        <strong>${moduloNombre}</strong>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${permisos
                              .map(
                                (p) => `
                                <div class="col-md-6 col-lg-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" 
                                               id="permiso_${p.id}" 
                                               ${p.tienePermiso ? "checked" : ""}
                                               onchange="togglePermiso(${idRol}, ${p.id}, ${p.rolPermisoId || "null"})">
                                        <label class="form-check-label" for="permiso_${p.id}">
                                            ${p.nombre}
                                            ${p.descripcion ? `<br><small class="text-muted">${p.descripcion}</small>` : ""}
                                        </label>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            `;
    });

    html += `
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `;

    let modalDiv = document.getElementById("permisosModal");
    if (!modalDiv) {
      modalDiv = document.createElement("div");
      modalDiv.className = "modal fade";
      modalDiv.id = "permisosModal";
      document.body.appendChild(modalDiv);
    }
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${html}</div></div>`;

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      cargarDatos();
    });
  } catch (error) {
    showToast(error.message || "Error al cargar permisos", "error");
  }
}

async function togglePermiso(idRol, idPermiso, rolPermisoId) {
  try {
    if (rolPermisoId) {
      await api.request(`/roles/permisos/${rolPermisoId}`, "DELETE");
      showToast("Permiso removido", "success");
    } else {
      await api.request("/roles/permisos", "POST", {
        id_rol: idRol,
        id_permiso: idPermiso,
      });
      showToast("Permiso asignado", "success");
    }
    await verPermisosRol(idRol);
  } catch (error) {
    showToast(error.message || "Error al cambiar permiso", "error");
  }
}

// ============================================================
// SELECTS
// ============================================================

function llenarSelectEmpleado(selectedId) {
  const select = document.getElementById("usuarioEmpleado");
  if (!select) return;
  select.innerHTML = '<option value="">Sin empleado</option>';
  empleadosData.forEach((e) => {
    const sel = e.id === selectedId ? "selected" : "";
    select.innerHTML += `<option value="${e.id}" ${sel}>${e.nombre}</option>`;
  });
}

function llenarSelectRol(selectedId) {
  const select = document.getElementById("usuarioRol");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar rol</option>';
  rolesData.forEach((r) => {
    const sel = r.id === selectedId ? "selected" : "";
    select.innerHTML += `<option value="${r.id}" ${sel}>${r.nombre}</option>`;
  });
}

function llenarSelectPuesto(selectedId) {
  const select = document.getElementById("empleadoPuesto");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar puesto</option>';
  puestosData.forEach((p) => {
    const sel = p.id === selectedId ? "selected" : "";
    select.innerHTML += `<option value="${p.id}" ${sel}>${p.nombre}</option>`;
  });
}

function llenarSelectTurno(selectedId) {
  const select = document.getElementById("empleadoTurno");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar turno</option>';
  turnosData.forEach((t) => {
    const sel = t.id === selectedId ? "selected" : "";
    select.innerHTML += `<option value="${t.id}" ${sel}>${t.nombre}</option>`;
  });
}

function llenarSelectEmpleadoPago(selectedId) {
  const select = document.getElementById("pagoEmpleadoEmpleado");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar empleado</option>';
  empleadosData.forEach((e) => {
    const sel = e.id === selectedId ? "selected" : "";
    select.innerHTML += `<option value="${e.id}" ${sel}>${e.nombre}</option>`;
  });
}

// ============================================================
// CREAR MODALES
// ============================================================

function crearModalUsuario() {
  if (document.getElementById("usuarioModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div class="modal fade" id="usuarioModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="usuarioModalTitle">Usuario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="usuarioForm" onsubmit="saveUsuario(event)">
                            <input type="hidden" id="usuarioId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre Usuario *</label>
                                <input type="text" class="form-control" id="usuarioNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="usuarioPassword" />
                                <small class="text-muted" id="passwordHelp">Dejar en blanco para no cambiar</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Empleado</label>
                                <select class="form-select" id="usuarioEmpleado"></select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Rol</label>
                                <select class="form-select" id="usuarioRol"></select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="usuarioActivo">
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-danger w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
  );
}

function crearModalEmpleado() {
  if (document.getElementById("empleadoModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div class="modal fade" id="empleadoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="empleadoModalTitle">Empleado</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="empleadoForm" onsubmit="saveEmpleado(event)">
                            <input type="hidden" id="empleadoId" />
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Nombre *</label>
                                    <input type="text" class="form-control" id="empleadoNombre" required />
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">DPI *</label>
                                    <input type="text" class="form-control" id="empleadoDpi" required />
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Teléfono</label>
                                    <input type="text" class="form-control" id="empleadoTelefono" />
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="empleadoEmail" />
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="empleadoDireccion" />
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Salario Base</label>
                                    <input type="number" step="0.01" class="form-control" id="empleadoSalario" />
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Puesto</label>
                                    <select class="form-select" id="empleadoPuesto"></select>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Turno</label>
                                    <select class="form-select" id="empleadoTurno"></select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="empleadoActivo">
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-danger w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
  );
}

function crearModalRol() {
  if (document.getElementById("rolModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div class="modal fade" id="rolModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="rolModalTitle">Rol</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="rolForm" onsubmit="saveRol(event)">
                            <input type="hidden" id="rolId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="rolNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="rolDescripcion" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nivel</label>
                                <input type="number" class="form-control" id="rolNivel" value="0" />
                                <small class="text-muted">Nivel de jerarquía (mayor = más permisos)</small>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
  );
}

function crearModalPuesto() {
  if (document.getElementById("puestoModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div class="modal fade" id="puestoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="puestoModalTitle">Puesto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="puestoForm" onsubmit="savePuesto(event)">
                            <input type="hidden" id="puestoId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="puestoNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="puestoDescripcion" rows="2"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
  );
}

function crearModalTurno() {
  if (document.getElementById("turnoModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div class="modal fade" id="turnoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="turnoModalTitle">Turno</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="turnoForm" onsubmit="saveTurno(event)">
                            <input type="hidden" id="turnoId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="turnoNombre" required />
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Hora Inicio *</label>
                                    <input type="time" class="form-control" id="turnoHoraInicio" required />
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Hora Fin *</label>
                                    <input type="time" class="form-control" id="turnoHoraFin" required />
                                </div>
                            </div>
                            <button type="submit" class="btn btn-success w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
  );
}

function crearModalModulo() {
  if (document.getElementById("moduloModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div class="modal fade" id="moduloModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="moduloModalTitle">Módulo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="moduloForm" onsubmit="saveModulo(event)">
                            <input type="hidden" id="moduloId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="moduloNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="moduloDescripcion" rows="2"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Icono (FontAwesome)</label>
                                    <input type="text" class="form-control" id="moduloIcono" value="fa-cube" />
                                    <small class="text-muted">Ej: fa-cog, fa-user, fa-box</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Orden</label>
                                    <input type="number" class="form-control" id="moduloOrden" value="0" />
                                </div>
                            </div>
                            <button type="submit" class="btn btn-info w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
  );
}

function crearModalPagoEmpleado() {
  if (document.getElementById("pagoEmpleadoModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div class="modal fade" id="pagoEmpleadoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="pagoEmpleadoModalTitle">Registrar Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="pagoEmpleadoForm" onsubmit="savePagoEmpleado(event)">
                            <input type="hidden" id="pagoEmpleadoId" />
                            <div class="mb-3">
                                <label class="form-label">Empleado *</label>
                                <select class="form-select" id="pagoEmpleadoEmpleado" required></select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Concepto *</label>
                                <input type="text" class="form-control" id="pagoEmpleadoConcepto" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Monto *</label>
                                <input type="number" step="0.01" class="form-control" id="pagoEmpleadoMonto" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Periodo</label>
                                <input type="text" class="form-control" id="pagoEmpleadoPeriodo" placeholder="Ej: Agosto 2024" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Referencia</label>
                                <input type="text" class="form-control" id="pagoEmpleadoReferencia" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea class="form-control" id="pagoEmpleadoObservaciones" rows="2"></textarea>
                            </div>
                            <button type="submit" class="btn btn-success w-100">Registrar Pago</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
  );
}

// ============================================================
// FUNCIONES GLOBALES
// ============================================================

window.loadUsuariosModule = loadUsuariosModule;
window.showCreateUsuarioModal = showCreateUsuarioModal;
window.showEditUsuarioModal = showEditUsuarioModal;
window.saveUsuario = saveUsuario;
window.deleteUsuario = deleteUsuario;
window.reactivarUsuario = reactivarUsuario;

window.showCreateEmpleadoModal = showCreateEmpleadoModal;
window.showEditEmpleadoModal = showEditEmpleadoModal;
window.saveEmpleado = saveEmpleado;
window.deleteEmpleado = deleteEmpleado;

window.showCreateRolModal = showCreateRolModal;
window.saveRol = saveRol;
window.verPermisosRol = verPermisosRol;
window.togglePermiso = togglePermiso;

window.showCreatePuestoModal = showCreatePuestoModal;
window.savePuesto = savePuesto;

window.showCreateTurnoModal = showCreateTurnoModal;
window.saveTurno = saveTurno;

window.showCreateModuloModal = showCreateModuloModal;
window.saveModulo = saveModulo;

window.showCreatePagoEmpleadoModal = showCreatePagoEmpleadoModal;
window.savePagoEmpleado = savePagoEmpleado;

window.llenarSelectEmpleado = llenarSelectEmpleado;
window.llenarSelectRol = llenarSelectRol;
window.llenarSelectPuesto = llenarSelectPuesto;
window.llenarSelectTurno = llenarSelectTurno;
window.llenarSelectEmpleadoPago = llenarSelectEmpleadoPago;
window.cargarDatos = cargarDatos;
