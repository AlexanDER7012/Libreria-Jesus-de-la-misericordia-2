// usuarios.js - VERSIÓN DEFINITIVA Y FUNCIONAL

let usuariosData = [];
let empleadosData = [];
let rolesData = [];
let puestosData = [];
let turnosData = [];
let modulosData = [];
let permisosData = [];
let rolPermisosData = [];
// Paginación (server-side) de las tablas de Empleados y Pagos
let skipEmpleadosTabla = 0;
const LIMITE_EMPLEADOS_TABLA = 10;
let skipPagos = 0;
const LIMITE_PAGOS = 10;

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
            <div class="tab-pane fade show active" id="usuariosTab">
                <div class="d-flex justify-content-end mb-2">
                    <select class="form-select form-select-sm" style="max-width: 200px" id="filtroEstadoUsuarios" onchange="filtrarUsuariosTabla()">
                        <option value="activos" selected>Activos</option>
                        <option value="inactivos">Inactivos</option>
                        <option value="todos">Todos</option>
                    </select>
                </div>
                <div id="usuariosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando usuarios...</p></div></div>
            </div>
            <div class="tab-pane fade" id="empleadosTab">
                <div class="d-flex justify-content-end mb-2">
                    <select class="form-select form-select-sm" style="max-width: 200px" id="filtroEstadoEmpleados" onchange="skipEmpleadosTabla=0;cargarEmpleadosTabla()">
                        <option value="activos" selected>Activos</option>
                        <option value="inactivos">Inactivos</option>
                        <option value="todos">Todos</option>
                    </select>
                </div>
                <div id="empleadosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando empleados...</p></div></div>
            </div>
            <div class="tab-pane fade" id="rolesTab">
                <h6 class="fw-bold mb-3"><i class="fas fa-user-tag me-2"></i>Roles y sus Permisos</h6>
                <div id="rolesContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando roles...</p></div></div>
            </div>
            <div class="tab-pane fade" id="pagosTab">
                <div class="row mb-2 g-2 justify-content-end">
                    <div class="col-auto">
                        <input type="date" class="form-control form-control-sm" id="pagosFechaDesde" onchange="skipPagos=0;cargarPagosTabla()">
                    </div>
                    <div class="col-auto">
                        <input type="date" class="form-control form-control-sm" id="pagosFechaHasta" onchange="skipPagos=0;cargarPagosTabla()">
                    </div>
                </div>
                <div id="pagosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando pagos...</p></div></div>
            </div>
            <div class="tab-pane fade" id="catalogosTab">
                <div id="catalogosContainer"><div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 text-muted">Cargando catálogos...</p></div></div>
            </div>
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
    ] = await Promise.all([
      api.getUsuarios().catch(() => []),
      api.request("/empleados?estado=todos").catch(() => []),
      api.getRoles().catch(() => []),
      api.getPuestos().catch(() => []),
      api.getTurnos().catch(() => []),
      api.getModulos().catch(() => []),
      api.getPermisos().catch(() => []),
    ]);

    usuariosData = usuarios || [];
    empleadosData = empleados || []; // se mantiene completa (sin paginar) -- otras partes de la pantalla la usan para cruzar nombres (Pagos, Usuarios, selects)
    rolesData = roles || [];
    puestosData = puestos || [];
    turnosData = turnos || [];
    modulosData = modulos || [];
    permisosData = permisos || [];

    console.log("✅ Datos cargados:");
    console.log("  - Usuarios:", usuariosData.length);
    console.log("  - Empleados:", empleadosData.length);
    console.log("  - Roles:", rolesData.length);

    renderUsuarios(usuariosData);
    cargarEmpleadosTabla(); // trae solo la primera página de la tabla (server-side)
    renderRoles(rolesData);
    cargarPagosTabla(); // trae solo la primera página de la tabla (server-side)
    renderCatalogos();
    cargarBitacoraUsuarios();

    await cargarPermisosRoles();
    renderRoles(rolesData); // se vuelve a llamar ya con rolPermisosData listo, para que las tarjetas de rol muestren los permisos correctos desde la primera carga

    // Oculta las pestañas para las que el usuario logueado no tenga el
    // permiso correspondiente (la función genérica vive en components.js).
    aplicarControlAccesoPorPestana("usuariosTabs", PESTANAS_CONTROLADAS_USUARIOS, permisosData);
  } catch (error) {
    console.error("Error cargando datos:", error);
    showToast("Error al cargar datos: " + error.message, "error");
  }
}

// ============================================================
// CONTROL DE ACCESO POR PESTAÑA
// ============================================================
// La lógica genérica ahora vive en components.js (aplicarControlAccesoPorPestana),
// para poder reutilizarla igual en Reportes, Compras, Ventas, etc. Aquí solo
// se define el mapa de pestañas propio de este módulo.
const PESTANAS_CONTROLADAS_USUARIOS = {
  usuariosTab: "Tab:Usuarios:Usuarios",
  empleadosTab: "Tab:Usuarios:Empleados",
  rolesTab: "Tab:Usuarios:Roles",
  pagosTab: "Tab:Usuarios:Pagos",
  catalogosTab: "Tab:Usuarios:Catalogos",
  logsTab: "Tab:Usuarios:Bitacora",
};

// ============================================================
// CARGAR PERMISOS DE ROLES
// ============================================================
async function cargarPermisosRoles() {
  rolPermisosData = [];
  for (const rol of rolesData) {
    try {
      const permisos = await api.request(`/roles/${rol.id}/permisos-detalle`);
      rolPermisosData = rolPermisosData.concat(
        permisos.map((p) => ({ ...p, id_rol: rol.id, rol_nombre: rol.nombre })),
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
// FILTRO DE ESTADO (activos/inactivos/todos) EN LA TABLA DE USUARIOS
// ============================================================
// OJO: esto NO reasigna la variable global 'usuariosData' -- esa se usa
// también en la pestaña de Roles (para saber quién tiene cada rol, y para
// el selector de "agregar usuario a este rol"). Si se pisara aquí, filtrar
// esta tabla podría alterar sin querer lo que se ve en Roles.
async function filtrarUsuariosTabla() {
  const estado = document.getElementById("filtroEstadoUsuarios")?.value || "activos";
  try {
    const usuarios = await api.request(`/usuarios?estado=${estado}`);
    renderUsuarios(usuarios);
  } catch (error) {
    showToast(error.message || "Error al filtrar usuarios", "error");
  }
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
                    ${
                      activo
                        ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteEmpleado(${e.id})" title="Desactivar">
                             <i class="fas fa-trash"></i>
                           </button>`
                        : `<button class="btn btn-sm btn-outline-success" onclick="reactivarEmpleado(${e.id})" title="Reactivar">
                             <i class="fas fa-check"></i>
                           </button>`
                    }
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
                // rolPermisosData ya trae el permiso completo (nombre,
                // id_modulo) gracias a que cargarPermisosRoles usa
                // /permisos-detalle -- no hace falta cruzar contra
                // permisosData otra vez.
                const permisosDelRol = rolPermisosData.filter((p) => p.id_rol === r.id);

                // Agrupar los permisos por módulo, ej: "Ventas: Ver, Crear"
                const permisosPorModulo = {};
                permisosDelRol.forEach((p) => {
                  const modulo = modulosData.find((m) => m.id === p.id_modulo);
                  const nombreModulo = modulo ? modulo.nombre : "General";
                  if (!permisosPorModulo[nombreModulo]) permisosPorModulo[nombreModulo] = [];
                  permisosPorModulo[nombreModulo].push(p.nombre || "(sin nombre)");
                });

                const htmlPermisos = Object.keys(permisosPorModulo).length
                  ? Object.entries(permisosPorModulo)
                      .map(
                        ([modulo, acciones]) =>
                          `<div class="small mb-1"><strong>${modulo}:</strong> ${acciones.join(", ")}</div>`,
                      )
                      .join("")
                  : `<div class="small text-muted">(sin permisos asignados)</div>`;

                // Usuarios que tienen este rol asignado (ya vienen solo
                // los activos, gracias al filtro por default de getUsuarios()
                // -- si alguien se desactiva, desaparece solo de aquí).
                const usuariosDelRol = (usuariosData || []).filter((u) => u.id_rol === r.id);
                const htmlUsuariosLista = usuariosDelRol.length
                  ? usuariosDelRol
                      .map(
                        (u) => `
                        <span class="badge bg-light text-dark border me-1 mb-1">
                          ${u.nombre_usuario}
                          <i class="fas fa-times ms-1 text-danger" style="cursor:pointer" onclick="quitarUsuarioDeRol(${u.id})" title="Quitar de este rol"></i>
                        </span>`,
                      )
                      .join("")
                  : `<span class="small text-muted">(ninguno todavía)</span>`;

                // Selector para asignar un usuario más a este rol (cualquiera
                // que hoy NO tenga ya este mismo rol -- puede venir de otro
                // rol distinto, o de ningún rol).
                const usuariosDisponibles = (usuariosData || []).filter((u) => u.id_rol !== r.id);
                const htmlSelectorAgregar = usuariosDisponibles.length
                  ? `<select class="form-select form-select-sm mt-1" onchange="asignarUsuarioARol(this, ${r.id})">
                       <option value="">+ Agregar usuario a este rol...</option>
                       ${usuariosDisponibles.map((u) => `<option value="${u.id}">${u.nombre_usuario}</option>`).join("")}
                     </select>`
                  : "";

                return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="fw-bold"><i class="fas fa-user-tag me-2"></i>${r.nombre}</h6>
                            <p class="small text-muted mb-2">${r.descripcion || "Sin descripción"}</p>

                            <div class="mb-2">
                                <i class="fas fa-users me-1 text-muted"></i>
                                <span class="small"><strong>Usuarios con este rol:</strong></span>
                                <div class="mt-1">${htmlUsuariosLista}</div>
                                ${htmlSelectorAgregar}
                            </div>

                            <div class="mb-2">
                                <i class="fas fa-key me-1 text-muted"></i>
                                <span class="small"><strong>Permisos:</strong></span>
                                <div class="ms-3 mt-1">${htmlPermisos}</div>
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
// ASIGNAR / QUITAR USUARIO DE UN ROL (desde la tarjeta del rol)
// ============================================================
async function asignarUsuarioARol(selectElement, idRol) {
  const idUsuario = parseInt(selectElement.value);
  if (!idUsuario) return;

  try {
    await api.request(`/usuarios/${idUsuario}`, "PUT", { id_rol: idRol });
    showToast("Usuario asignado al rol correctamente", "success");
    await cargarDatos();
  } catch (error) {
    showToast(error.message || "Error al asignar el usuario a este rol", "error");
  }
}

async function quitarUsuarioDeRol(idUsuario) {
  const usuario = (usuariosData || []).find((u) => u.id === idUsuario);
  const nombre = usuario ? usuario.nombre_usuario : `usuario #${idUsuario}`;

  const confirmado = await mostrarConfirmacion(
    "Quitar usuario del rol",
    `¿Quitar a "${nombre}" de este rol?`,
    "Quitar",
  );
  if (!confirmado) return;

  try {
    await api.request(`/usuarios/${idUsuario}`, "PUT", { id_rol: null });
    showToast(`"${nombre}" fue removido de este rol`, "success");
    await cargarDatos();
  } catch (error) {
    showToast(error.message || "Error al quitar el usuario de este rol", "error");
  }
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
// PAGINACIÓN (server-side) DE EMPLEADOS Y PAGOS
// ============================================================
function _agregarControlesPaginacion(containerId, onAnterior, onSiguiente, skipActual) {
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

async function cargarEmpleadosTabla() {
  const estado = document.getElementById("filtroEstadoEmpleados")?.value || "activos";
  try {
    const empleados = await api.request(
      `/empleados?estado=${estado}&skip=${skipEmpleadosTabla}&limit=${LIMITE_EMPLEADOS_TABLA}`,
    );
    renderEmpleados(empleados);
    _agregarControlesPaginacion(
      "empleadosContainer",
      `skipEmpleadosTabla=Math.max(0,skipEmpleadosTabla-${LIMITE_EMPLEADOS_TABLA});cargarEmpleadosTabla()`,
      `skipEmpleadosTabla+=${LIMITE_EMPLEADOS_TABLA};cargarEmpleadosTabla()`,
      skipEmpleadosTabla,
    );
  } catch (error) {
    showToast(error.message || "Error al cargar empleados", "error");
  }
}

async function cargarPagosTabla() {
  const desde = document.getElementById("pagosFechaDesde")?.value;
  const hasta = document.getElementById("pagosFechaHasta")?.value;
  try {
    let url = `/pagos-empleado?skip=${skipPagos}&limit=${LIMITE_PAGOS}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    const pagos = await api.request(url);
    renderPagos(pagos);
    _agregarControlesPaginacion(
      "pagosContainer",
      `skipPagos=Math.max(0,skipPagos-${LIMITE_PAGOS});cargarPagosTabla()`,
      `skipPagos+=${LIMITE_PAGOS};cargarPagosTabla()`,
      skipPagos,
    );
  } catch (error) {
    showToast(error.message || "Error al cargar pagos", "error");
  }
}

// ============================================================
// RENDER: CATÁLOGOS
// ============================================================
function renderCatalogos() {
  const container = document.getElementById("catalogosContainer");
  if (!container) return;

  let html = `
        <div class="row">
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
// RENDER: BITÁCORA
// ============================================================
async function cargarBitacoraUsuarios() {
  const container = document.getElementById("logsContainer");
  if (!container) return;

  const hoy = new Date();
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const usuariosOptions = (usuariosData || [])
    .map((u) => `<option value="${u.id}">${u.nombre_usuario}</option>`)
    .join("");

  container.innerHTML = `
        <div class="row mb-3 g-2">
            <div class="col-md-3">
                <label class="form-label small">Fecha Desde</label>
                <input type="date" class="form-control form-control-sm" id="bitacoraUsrDesde" value="${hace30Dias.toISOString().split("T")[0]}">
            </div>
            <div class="col-md-3">
                <label class="form-label small">Fecha Hasta</label>
                <input type="date" class="form-control form-control-sm" id="bitacoraUsrHasta" value="${hoy.toISOString().split("T")[0]}">
            </div>
            <div class="col-md-3">
                <label class="form-label small">Usuario</label>
                <select class="form-select form-select-sm" id="bitacoraUsrUsuario">
                    <option value="">Todos los usuarios</option>
                    ${usuariosOptions}
                </select>
            </div>
            <div class="col-md-1 d-flex align-items-end">
                <button class="btn btn-primary btn-sm" onclick="actualizarBitacoraUsuarios()" title="Consultar">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <div class="col-md-2 d-flex align-items-end gap-1">
                <button class="btn btn-success btn-sm" onclick="exportarPDF('bitacoraUsrResultado', 'Bitacora_Usuarios')" title="Exportar a PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="btn btn-info btn-sm" onclick="exportarExcel('bitacoraUsrResultado', 'Bitacora_Usuarios')" title="Exportar a Excel">
                    <i class="fas fa-file-excel"></i>
                </button>
            </div>
        </div>
        <div id="bitacoraUsrResultado">
            <div class="text-center py-5">
                <div class="spinner-border text-danger" role="status"></div>
                <p class="mt-2 text-muted">Cargando bitácora...</p>
            </div>
        </div>
    `;

  await actualizarBitacoraUsuarios();
}

async function actualizarBitacoraUsuarios() {
  const desde = document.getElementById("bitacoraUsrDesde")?.value;
  const hasta = document.getElementById("bitacoraUsrHasta")?.value;
  const idUsuario = document.getElementById("bitacoraUsrUsuario")?.value;
  const resultado = document.getElementById("bitacoraUsrResultado");
  if (!desde || !hasta || !resultado) return;

  try {
    let url = `/reportes/usuarios/bitacora?desde=${desde}&hasta=${hasta}`;
    if (idUsuario) url += `&id_usuario=${idUsuario}`;
    const data = await api.request(url);

    if (!data || !data.detalle || data.detalle.length === 0) {
      resultado.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-history fa-3x mb-3"></i>
                <p>No hay registros en la bitácora para este filtro</p>
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
                    </tr>
                </thead>
                <tbody>
    `;

    data.detalle.forEach((l) => {
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
                <td><strong>${l.nombre_usuario || "--"}</strong></td>
                <td>${l.fecha ? new Date(l.fecha).toLocaleString() : "--"}</td>
                <td><span class="badge bg-${accionColor}">${l.accion || "--"}</span></td>
                <td>${l.modulo || "--"}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div class="text-end"><small class="text-muted">${data.cantidad} registros (período ${data.desde} al ${data.hasta})</small></div>
    `;

    resultado.innerHTML = html;
  } catch (error) {
    resultado.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ============================================================
// USUARIOS - CRUD
// ============================================================
function showCreateUsuarioModal() {
  let modal = document.getElementById("usuarioModal");
  if (!modal) {
    crearModalUsuario();
    setTimeout(() => showCreateUsuarioModal(), 150);
    return;
  }

  const title = document.getElementById("usuarioModalTitle");
  if (title) title.textContent = "Nuevo Usuario";

  const form = document.getElementById("usuarioForm");
  if (form) form.reset();

  const idInput = document.getElementById("usuarioId");
  if (idInput) idInput.value = "";

  const passwordInput = document.getElementById("usuarioPassword");
  if (passwordInput) {
    passwordInput.required = true;
    passwordInput.placeholder = "Nueva contraseña";
    passwordInput.value = "";
  }

  const helpText = document.getElementById("passwordHelp");
  if (helpText) {
    helpText.textContent = "La contraseña es obligatoria para nuevos usuarios";
  }

  const activoSelect = document.getElementById("usuarioActivo");
  if (activoSelect) {
    activoSelect.value = "1";
  }

  llenarSelectEmpleado();
  llenarSelectRol();

  try {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error al mostrar modal:", error);
    modal.remove();
    setTimeout(() => showCreateUsuarioModal(), 200);
  }
}

async function showEditUsuarioModal(id) {
  try {
    const usuario = usuariosData.find((u) => u.id === id);
    if (!usuario) {
      showToast("Usuario no encontrado", "error");
      return;
    }

    let modal = document.getElementById("usuarioModal");
    if (!modal) {
      crearModalUsuario();
      setTimeout(() => showEditUsuarioModal(id), 150);
      return;
    }

    const title = document.getElementById("usuarioModalTitle");
    if (title) title.textContent = "Editar Usuario";

    const idInput = document.getElementById("usuarioId");
    if (idInput) idInput.value = usuario.id;

    const nombreInput = document.getElementById("usuarioNombre");
    if (nombreInput) nombreInput.value = usuario.nombre_usuario || "";

    const passwordInput = document.getElementById("usuarioPassword");
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.required = false;
      passwordInput.placeholder = "Dejar en blanco para no cambiar";
    }

    const helpText = document.getElementById("passwordHelp");
    if (helpText) {
      helpText.textContent = "Dejar en blanco para no cambiar la contraseña";
    }

    const activoSelect = document.getElementById("usuarioActivo");
    if (activoSelect) {
      activoSelect.value = usuario.activo !== 0 ? "1" : "0";
    }

    llenarSelectEmpleado(usuario.id_empleado);
    llenarSelectRol(usuario.id_rol);

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    showToast(error.message || "Error al cargar usuario", "error");
  }
}

// ============================================================
// USUARIOS - GUARDAR (DEFINITIVO - FUNCIONAL)
// ============================================================
async function saveUsuario(event) {
  // ✅ Prevenir que el formulario recargue la página
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log("🔄 saveUsuario ejecutado");

  const id = document.getElementById("usuarioId")?.value || "";
  const nombre_usuario =
    document.getElementById("usuarioNombre")?.value?.trim() || "";
  const password =
    document.getElementById("usuarioPassword")?.value?.trim() || "";
  const id_empleado =
    parseInt(document.getElementById("usuarioEmpleado")?.value) || null;
  const id_rol = parseInt(document.getElementById("usuarioRol")?.value) || null;
  const activo = parseInt(document.getElementById("usuarioActivo")?.value) || 1;

  if (!nombre_usuario) {
    showToast("El nombre de usuario es obligatorio", "error");
    return;
  }

  const btn = document.querySelector('#usuarioForm button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
  }

  try {
    if (id) {
      const data = { id_rol, activo };
      if (password) data.password = password;
      await api.request(`/usuarios/${id}`, "PUT", data);
      showToast("Usuario actualizado correctamente", "success");
    } else {
      if (!password) {
        showToast("La contraseña es obligatoria", "error");
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = "Guardar";
        }
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
    const modal = document.getElementById("usuarioModal");
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    // ✅ Recargar datos
    await cargarDatos();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Guardar";
    }

    llenarSelectEmpleado();
    llenarSelectRol();
  } catch (error) {
    console.error("❌ Error en saveUsuario:", error);
    showToast(error.message || "Error al guardar usuario", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Guardar";
    }
  }
}

async function deleteUsuario(id) {
  const confirmado = await mostrarConfirmacion(
    "Desactivar usuario",
    "¿Desactivar este usuario? Podrá reactivarse después.",
    "Desactivar",
  );
  if (!confirmado) return;
  try {
    await api.request(`/usuarios/${id}`, "DELETE");
    showToast("Usuario desactivado correctamente", "success");
    await cargarDatos();
  } catch (error) {
    showToast(error.message || "Error al desactivar usuario", "error");
  }
}

async function reactivarUsuario(id) {
  const confirmado = await mostrarConfirmacion(
    "Reactivar usuario",
    "¿Reactivar este usuario?",
    "Reactivar",
  );
  if (!confirmado) return;
  try {
    await api.request(`/usuarios/${id}/reactivar`, "PATCH");
    showToast("Usuario reactivado correctamente", "success");
    await cargarDatos();
  } catch (error) {
    showToast(error.message || "Error al reactivar usuario", "error");
  }
}

// ============================================================
// EMPLEADOS - CRUD
// ============================================================
function showCreateEmpleadoModal() {
  let modal = document.getElementById("empleadoModal");
  if (!modal) {
    crearModalEmpleado();
    setTimeout(() => showCreateEmpleadoModal(), 150);
    return;
  }

  const title = document.getElementById("empleadoModalTitle");
  if (title) title.textContent = "Nuevo Empleado";

  const form = document.getElementById("empleadoForm");
  if (form) form.reset();

  const idInput = document.getElementById("empleadoId");
  if (idInput) idInput.value = "";

  llenarSelectPuesto();
  llenarSelectTurno();

  try {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error al mostrar modal:", error);
    modal.remove();
    setTimeout(() => showCreateEmpleadoModal(), 200);
  }
}

async function showEditEmpleadoModal(id) {
  try {
    const empleado = empleadosData.find((e) => e.id === id);
    if (!empleado) {
      showToast("Empleado no encontrado", "error");
      return;
    }

    let modal = document.getElementById("empleadoModal");
    if (!modal) {
      crearModalEmpleado();
      setTimeout(() => showEditEmpleadoModal(id), 150);
      return;
    }

    const title = document.getElementById("empleadoModalTitle");
    if (title) title.textContent = "Editar Empleado";

    const idInput = document.getElementById("empleadoId");
    if (idInput) idInput.value = empleado.id;

    const nombreInput = document.getElementById("empleadoNombre");
    if (nombreInput) nombreInput.value = empleado.nombre || "";

    const dpiInput = document.getElementById("empleadoDpi");
    if (dpiInput) dpiInput.value = empleado.dpi || "";

    const telefonoInput = document.getElementById("empleadoTelefono");
    if (telefonoInput) telefonoInput.value = empleado.telefono || "";

    const emailInput = document.getElementById("empleadoEmail");
    if (emailInput) emailInput.value = empleado.email || "";

    const direccionInput = document.getElementById("empleadoDireccion");
    if (direccionInput) direccionInput.value = empleado.direccion || "";

    const salarioInput = document.getElementById("empleadoSalario");
    if (salarioInput) salarioInput.value = empleado.salario_base || "";

    const activoSelect = document.getElementById("empleadoActivo");
    if (activoSelect) {
      activoSelect.value = empleado.activo !== 0 ? "1" : "0";
    }

    llenarSelectPuesto(empleado.id_puesto);
    llenarSelectTurno(empleado.id_turno);

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    showToast(error.message || "Error al cargar empleado", "error");
  }
}

async function saveEmpleado(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const id = document.getElementById("empleadoId")?.value || "";
  const data = {
    nombre: document.getElementById("empleadoNombre")?.value?.trim() || "",
    dpi: document.getElementById("empleadoDpi")?.value?.trim() || "",
    telefono:
      document.getElementById("empleadoTelefono")?.value?.trim() || null,
    email: document.getElementById("empleadoEmail")?.value?.trim() || null,
    direccion:
      document.getElementById("empleadoDireccion")?.value?.trim() || null,
    salario_base:
      parseFloat(document.getElementById("empleadoSalario")?.value) || null,
    id_puesto:
      parseInt(document.getElementById("empleadoPuesto")?.value) || null,
    id_turno: parseInt(document.getElementById("empleadoTurno")?.value) || null,
    activo: parseInt(document.getElementById("empleadoActivo")?.value) || 1,
  };

  if (!data.nombre || !data.dpi) {
    showToast("Nombre y DPI son obligatorios", "error");
    return;
  }

  const btn = document.querySelector('#empleadoForm button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
  }

  try {
    if (id) {
      await api.request(`/empleados/${id}`, "PUT", data);
      showToast("Empleado actualizado correctamente", "success");
    } else {
      await api.request("/empleados", "POST", data);
      showToast("Empleado creado correctamente", "success");
    }

    const modal = document.getElementById("empleadoModal");
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    }

    await cargarDatos();
    llenarSelectEmpleado();
    llenarSelectEmpleadoPago();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Guardar";
    }
  } catch (error) {
    console.error("Error en saveEmpleado:", error);
    showToast(error.message || "Error al guardar empleado", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Guardar";
    }
  }
}

async function deleteEmpleado(id) {
  const confirmado = await mostrarConfirmacion(
    "Desactivar empleado",
    "¿Desactivar este empleado? Podrá reactivarse después.",
    "Desactivar",
  );
  if (!confirmado) return;
  try {
    await api.request(`/empleados/${id}`, "DELETE");
    showToast("Empleado desactivado correctamente", "success");
    await cargarDatos();
  } catch (error) {
    showToast(error.message || "Error al desactivar empleado", "error");
  }
}

async function reactivarEmpleado(id) {
  const confirmado = await mostrarConfirmacion(
    "Reactivar empleado",
    "¿Reactivar este empleado?",
    "Reactivar",
  );
  if (!confirmado) return;
  try {
    await api.request(`/empleados/${id}/reactivar`, "PATCH");
    showToast("Empleado reactivado correctamente", "success");
    await cargarDatos();
  } catch (error) {
    showToast(error.message || "Error al reactivar empleado", "error");
  }
}

// ============================================================
// ROLES - CRUD
// ============================================================
function showCreateRolModal() {
  let modal = document.getElementById("rolModal");
  if (!modal) {
    crearModalRol();
    setTimeout(() => showCreateRolModal(), 150);
    return;
  }

  const title = document.getElementById("rolModalTitle");
  if (title) title.textContent = "Nuevo Rol";

  const form = document.getElementById("rolForm");
  if (form) form.reset();

  const idInput = document.getElementById("rolId");
  if (idInput) idInput.value = "";

  try {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error al mostrar modal:", error);
    modal.remove();
    setTimeout(() => showCreateRolModal(), 200);
  }
}

async function saveRol(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const nombre = document.getElementById("rolNombre")?.value?.trim() || "";
  const descripcion =
    document.getElementById("rolDescripcion")?.value?.trim() || null;
  const nivel = parseInt(document.getElementById("rolNivel")?.value) || 0;

  if (!nombre) {
    showToast("El nombre del rol es obligatorio", "error");
    return;
  }

  const btn = document.querySelector('#rolForm button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
  }

  try {
    await api.request("/roles", "POST", { nombre, descripcion, nivel });
    showToast("Rol creado correctamente", "success");

    const modal = document.getElementById("rolModal");
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    }

    await cargarDatos();
    llenarSelectRol();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Guardar";
    }
  } catch (error) {
    console.error("Error en saveRol:", error);
    showToast(error.message || "Error al crear rol", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Guardar";
    }
  }
}

// ============================================================
// PUESTOS - CRUD
// ============================================================
function showCreatePuestoModal() {
  let modal = document.getElementById("puestoModal");
  if (!modal) {
    crearModalPuesto();
    setTimeout(() => showCreatePuestoModal(), 150);
    return;
  }

  const title = document.getElementById("puestoModalTitle");
  if (title) title.textContent = "Nuevo Puesto";

  const form = document.getElementById("puestoForm");
  if (form) form.reset();

  const idInput = document.getElementById("puestoId");
  if (idInput) idInput.value = "";

  try {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error al mostrar modal:", error);
    modal.remove();
    setTimeout(() => showCreatePuestoModal(), 200);
  }
}

async function savePuesto(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const nombre = document.getElementById("puestoNombre")?.value?.trim() || "";
  const descripcion =
    document.getElementById("puestoDescripcion")?.value?.trim() || null;

  if (!nombre) {
    showToast("El nombre del puesto es obligatorio", "error");
    return;
  }

  try {
    await api.request("/puestos", "POST", { nombre, descripcion });
    showToast("Puesto creado correctamente", "success");

    const modal = document.getElementById("puestoModal");
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    }

    await cargarDatos();
    llenarSelectPuesto();
  } catch (error) {
    console.error("Error en savePuesto:", error);
    showToast(error.message || "Error al crear puesto", "error");
  }
}

// ============================================================
// TURNOS - CRUD
// ============================================================
function showCreateTurnoModal() {
  let modal = document.getElementById("turnoModal");
  if (!modal) {
    crearModalTurno();
    setTimeout(() => showCreateTurnoModal(), 150);
    return;
  }

  const title = document.getElementById("turnoModalTitle");
  if (title) title.textContent = "Nuevo Turno";

  const form = document.getElementById("turnoForm");
  if (form) form.reset();

  const idInput = document.getElementById("turnoId");
  if (idInput) idInput.value = "";

  try {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error al mostrar modal:", error);
    modal.remove();
    setTimeout(() => showCreateTurnoModal(), 200);
  }
}

async function saveTurno(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const nombre = document.getElementById("turnoNombre")?.value?.trim() || "";
  const hora_inicio = document.getElementById("turnoHoraInicio")?.value || "";
  const hora_fin = document.getElementById("turnoHoraFin")?.value || "";

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

    const modal = document.getElementById("turnoModal");
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    }

    await cargarDatos();
    llenarSelectTurno();
  } catch (error) {
    console.error("Error en saveTurno:", error);
    showToast(error.message || "Error al crear turno", "error");
  }
}

// ============================================================
// MÓDULOS - CRUD
// ============================================================
function showCreateModuloModal() {
  let modal = document.getElementById("moduloModal");
  if (!modal) {
    crearModalModulo();
    setTimeout(() => showCreateModuloModal(), 150);
    return;
  }

  const title = document.getElementById("moduloModalTitle");
  if (title) title.textContent = "Nuevo Módulo";

  const form = document.getElementById("moduloForm");
  if (form) form.reset();

  const idInput = document.getElementById("moduloId");
  if (idInput) idInput.value = "";

  try {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error al mostrar modal:", error);
    modal.remove();
    setTimeout(() => showCreateModuloModal(), 200);
  }
}

async function saveModulo(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const nombre = document.getElementById("moduloNombre")?.value?.trim() || "";
  const descripcion =
    document.getElementById("moduloDescripcion")?.value?.trim() || null;
  const icono =
    document.getElementById("moduloIcono")?.value?.trim() || "fa-cube";
  const orden = parseInt(document.getElementById("moduloOrden")?.value) || 0;

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

    const modal = document.getElementById("moduloModal");
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    }

    await cargarDatos();
  } catch (error) {
    console.error("Error en saveModulo:", error);
    showToast(error.message || "Error al crear módulo", "error");
  }
}

// ============================================================
// PAGOS DE EMPLEADOS - CRUD
// ============================================================
function showCreatePagoEmpleadoModal() {
  let modal = document.getElementById("pagoEmpleadoModal");
  if (!modal) {
    crearModalPagoEmpleado();
    setTimeout(() => showCreatePagoEmpleadoModal(), 150);
    return;
  }

  const title = document.getElementById("pagoEmpleadoModalTitle");
  if (title) title.textContent = "Registrar Pago";

  const form = document.getElementById("pagoEmpleadoForm");
  if (form) form.reset();

  const idInput = document.getElementById("pagoEmpleadoId");
  if (idInput) idInput.value = "";

  llenarSelectEmpleadoPago();

  try {
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error al mostrar modal:", error);
    modal.remove();
    setTimeout(() => showCreatePagoEmpleadoModal(), 200);
  }
}

async function savePagoEmpleado(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const data = {
    id_empleado:
      parseInt(document.getElementById("pagoEmpleadoEmpleado")?.value) || null,
    concepto:
      document.getElementById("pagoEmpleadoConcepto")?.value?.trim() || "",
    monto: parseFloat(document.getElementById("pagoEmpleadoMonto")?.value) || 0,
    periodo:
      document.getElementById("pagoEmpleadoPeriodo")?.value?.trim() || "",
    referencia:
      document.getElementById("pagoEmpleadoReferencia")?.value?.trim() || null,
    observaciones:
      document.getElementById("pagoEmpleadoObservaciones")?.value?.trim() ||
      null,
  };

  if (!data.id_empleado) {
    showToast("Selecciona un empleado", "error");
    return;
  }
  if (!data.concepto) {
    showToast("El concepto es obligatorio", "error");
    return;
  }
  if (data.monto <= 0) {
    showToast("El monto debe ser mayor a 0", "error");
    return;
  }

  try {
    await api.request("/pagos-empleado", "POST", data);
    showToast("Pago registrado correctamente", "success");

    const modal = document.getElementById("pagoEmpleadoModal");
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    }

    await cargarDatos();
  } catch (error) {
    console.error("Error en savePagoEmpleado:", error);
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

    if (!permisosData || permisosData.length === 0) {
      let html = `
                <div class="modal-header">
                    <h5 class="modal-title">Gestionar Permisos - ${rol.nombre}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No hay permisos definidos en el sistema.
                        <br>Contacta al administrador para crear permisos.
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
      return;
    }

    const permisosPorModulo = {};

    modulosData.forEach((modulo) => {
      const moduloNombre = modulo.nombre || "Sin módulo";
      if (!permisosPorModulo[moduloNombre]) {
        permisosPorModulo[moduloNombre] = {
          id: modulo.id,
          icono: modulo.icono || "fa-cube",
          permisos: [],
        };
      }
    });

    permisosData.forEach((p) => {
      let moduloNombre = "Sin módulo";
      if (p.id_modulo) {
        const modulo = modulosData.find((m) => m.id === p.id_modulo);
        if (modulo) {
          moduloNombre = modulo.nombre || "Sin módulo";
        }
      }

      if (!permisosPorModulo[moduloNombre]) {
        permisosPorModulo[moduloNombre] = {
          id: null,
          icono: "fa-cube",
          permisos: [],
        };
      }

      permisosPorModulo[moduloNombre].permisos.push({
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

    const tieneModulos = Object.keys(permisosPorModulo).some(
      (key) => permisosPorModulo[key].permisos.length > 0,
    );

    if (!tieneModulos) {
      html += `
                <div class="card">
                    <div class="card-header bg-light">
                        <strong>Todos los Permisos</strong>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${permisosData
                              .map(
                                (p) => `
                                <div class="col-md-6 col-lg-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox"
                                               id="permiso_${p.id}"
                                               ${permisosIds.includes(p.id) ? "checked" : ""}
                                               onchange="togglePermiso(${idRol}, ${p.id}, ${permisosRol.find((rp) => rp.id_permiso === p.id)?.id || "null"})">
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
    } else {
      Object.keys(permisosPorModulo).forEach((moduloNombre) => {
        const moduloData = permisosPorModulo[moduloNombre];
        const permisos = moduloData.permisos;

        if (permisos.length === 0) return;

        html += `
                    <div class="card mb-2">
                        <div class="card-header bg-light">
                            <i class="fas ${moduloData.icono || "fa-cube"} me-2"></i>
                            <strong>${moduloNombre}</strong>
                            <span class="badge bg-secondary ms-2">${permisos.length} permisos</span>
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
    }

    html += `
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button class="btn btn-primary" onclick="cargarDatos(); showToast('Datos recargados', 'info');">
                    <i class="fas fa-sync me-1"></i>Recargar
                </button>
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

    // OJO: verPermisosRol se vuelve a llamar cada vez que togglePermiso marca
    // o desmarca un permiso (para refrescar los datos). Antes, esto volvía a
    // crear un bootstrap.Modal nuevo y a llamar .show() aunque el modal ya
    // estuviera abierto -- eso causaba el parpadeo visual. Y como también
    // volvía a agregar el listener de 'hidden.bs.modal' cada vez, si
    // marcabas 5 permisos se acumulaban 5 listeners, y al cerrar el modal
    // se disparaban 5 recargas completas del módulo a la vez (de ahí que
    // "se quedara trabado"). Ahora: solo se crea/muestra/engancha el
    // listener LA PRIMERA VEZ que se abre.
    let modalInstance = bootstrap.Modal.getInstance(modalDiv);
    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(modalDiv);
      modalDiv.addEventListener("hidden.bs.modal", function () {
        cargarDatos();
      });
    }
    if (!modalDiv.classList.contains("show")) {
      modalInstance.show();
    }
  } catch (error) {
    console.error("Error en verPermisosRol:", error);
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
// RESTAURAR MODALES
// ============================================================
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
                                    <label class="form-label">Icono</label>
                                    <input type="text" class="form-control" id="moduloIcono" value="fa-cube" />
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
window.cargarBitacoraUsuarios = cargarBitacoraUsuarios;
window.asignarUsuarioARol = asignarUsuarioARol;
window.quitarUsuarioDeRol = quitarUsuarioDeRol;
window.reactivarEmpleado = reactivarEmpleado;
window.filtrarUsuariosTabla = filtrarUsuariosTabla;
window.cargarEmpleadosTabla = cargarEmpleadosTabla;
window.cargarPagosTabla = cargarPagosTabla;
window.actualizarBitacoraUsuarios = actualizarBitacoraUsuarios;