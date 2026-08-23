// Usuarios

let usuariosData = [];
let empleadosData = [];
let rolesData = [];
let puestosData = [];
let turnosData = [];
let modulosData = [];
let permisosData = [];

// Carga del módulo
async function loadUsuariosModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-user-shield me-2 text-danger"></i>Usuarios</h4>
            <div>
                <button class="btn btn-danger btn-sm me-2" onclick="showCreateUsuarioModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Usuario
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="showCreateEmpleadoModal()">
                    <i class="fas fa-user-plus me-1"></i>Empleado
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
        </ul>

        <div class="tab-content">
            <div class="tab-pane fade show active" id="usuariosTab">
                <div id="usuariosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-danger" role="status"></div>
                        <p class="mt-2 text-muted">Cargando usuarios...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="empleadosTab">
                <div id="empleadosContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-danger" role="status"></div>
                        <p class="mt-2 text-muted">Cargando empleados...</p>
                    </div>
                </div>
            </div>
            <div class="tab-pane fade" id="rolesTab">
                <div id="rolesContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-danger" role="status"></div>
                        <p class="mt-2 text-muted">Cargando roles...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  try {
    const [usuarios, empleados, roles, puestos, turnos, modulos, permisos] =
      await Promise.all([
        api.getUsuarios().catch(() => []),
        api.getEmpleados().catch(() => []),
        api.getRoles().catch(() => []),
        api.getPuestos().catch(() => []),
        api.getTurnos().catch(() => []),
        api.getModulos().catch(() => []),
        api.getPermisos().catch(() => []),
      ]);

    usuariosData = usuarios || [];
    empleadosData = empleados || [];
    rolesData = roles || [];
    puestosData = puestos || [];
    turnosData = turnos || [];
    modulosData = modulos || [];
    permisosData = permisos || [];

    renderUsuarios(usuariosData);
    renderEmpleados(empleadosData);
    renderRoles(rolesData);
  } catch (error) {
    document.getElementById("usuariosContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// Renderizar usuarios
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
                        <th>Intentos Fallidos</th>
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
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditUsuarioModal(${u.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUsuario(${u.id})">
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

// Renderizar empleados
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
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditEmpleadoModal(${e.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmpleado(${e.id})">
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

// Renderizar roles
function renderRoles(roles) {
  const container = document.getElementById("rolesContainer");
  if (!container) return;

  if (!roles || roles.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-user-tag fa-3x mb-3"></i>
                <p>No hay roles registrados</p>
            </div>
        `;
    return;
  }

  let html = `
        <div class="row">
            ${roles
              .map(
                (r) => `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="fw-bold">${r.nombre}</h6>
                            <p class="small text-muted">${r.descripcion || "Sin descripción"}</p>
                            <p class="small">Nivel: ${r.nivel || 0}</p>
                            <button class="btn btn-sm btn-outline-primary" onclick="verPermisosRol(${r.id})">
                                <i class="fas fa-key me-1"></i>Permisos
                            </button>
                        </div>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
    `;

  container.innerHTML = html;
}

// Crear usuario - modal
function showCreateUsuarioModal() {
  const modal = document.getElementById("usuarioModal");
  if (!modal) {
    crearModalUsuario();
    setTimeout(() => showCreateUsuarioModal(), 100);
    return;
  }

  const title = document.getElementById("usuarioModalTitle");
  title.textContent = "Nuevo Usuario";
  document.getElementById("usuarioForm").reset();
  document.getElementById("usuarioId").value = "";

  llenarSelectEmpleado();
  llenarSelectRol();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// Editar usuario
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

    const title = document.getElementById("usuarioModalTitle");
    title.textContent = "Editar Usuario";
    document.getElementById("usuarioId").value = usuario.id;
    document.getElementById("usuarioNombre").value =
      usuario.nombre_usuario || "";
    document.getElementById("usuarioPassword").value = "";
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

// Guardar usuario
async function saveUsuario(event) {
  event.preventDefault();

  const id = document.getElementById("usuarioId").value;
  const data = {
    nombre_usuario: document.getElementById("usuarioNombre").value.trim(),
    password: document.getElementById("usuarioPassword").value.trim(),
    id_empleado:
      parseInt(document.getElementById("usuarioEmpleado").value) || null,
    id_rol: parseInt(document.getElementById("usuarioRol").value) || null,
    activo: parseInt(document.getElementById("usuarioActivo").value),
  };

  if (!data.nombre_usuario) {
    showToast("El nombre de usuario es obligatorio", "error");
    return;
  }

  try {
    if (id) {
      if (data.password) {
        await api.request(`/usuarios/${id}`, "PUT", data);
      } else {
        const updateData = {
          id_rol: data.id_rol,
          activo: data.activo,
        };
        await api.request(`/usuarios/${id}`, "PUT", updateData);
      }
      showToast("Usuario actualizado correctamente", "success");
    } else {
      if (!data.password) {
        showToast("La contraseña es obligatoria", "error");
        return;
      }
      await api.request("/usuarios", "POST", data);
      showToast("Usuario creado correctamente", "success");
    }

    bootstrap.Modal.getInstance(document.getElementById("usuarioModal")).hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al guardar usuario", "error");
  }
}

// Eliminar usuario
async function deleteUsuario(id) {
  if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

  try {
    await api.request(`/usuarios/${id}`, "DELETE");
    showToast("Usuario eliminado correctamente", "success");
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al eliminar usuario", "error");
  }
}

// Crear empleado - modal
function showCreateEmpleadoModal() {
  const modal = document.getElementById("empleadoModal");
  if (!modal) {
    crearModalEmpleado();
    setTimeout(() => showCreateEmpleadoModal(), 100);
    return;
  }

  const title = document.getElementById("empleadoModalTitle");
  title.textContent = "Nuevo Empleado";
  document.getElementById("empleadoForm").reset();
  document.getElementById("empleadoId").value = "";

  llenarSelectPuesto();
  llenarSelectTurno();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// Editar empleado
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

    const title = document.getElementById("empleadoModalTitle");
    title.textContent = "Editar Empleado";
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

// Guardar empleado
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

    bootstrap.Modal.getInstance(
      document.getElementById("empleadoModal"),
    ).hide();
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al guardar empleado", "error");
  }
}

// Eliminar empleado
async function deleteEmpleado(id) {
  if (!confirm("¿Estás seguro de eliminar este empleado?")) return;

  try {
    await api.request(`/empleados/${id}`, "DELETE");
    showToast("Empleado eliminado correctamente", "success");
    await loadUsuariosModule();
  } catch (error) {
    showToast(error.message || "Error al eliminar empleado", "error");
  }
}

// Ver permisos de rol
async function verPermisosRol(id) {
  try {
    const permisos = await api.request(`/roles/${id}/permisos`);
    const rol = rolesData.find((r) => r.id === id);

    let html = `
            <div class="modal-header">
                <h5 class="modal-title">Permisos - ${rol ? rol.nombre : "Rol"}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
        `;

    modulosData.forEach((modulo) => {
      const modPermisos = permisos.filter((p) => p.id_modulo === modulo.id);
      html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <strong>${modulo.nombre}</strong>
                        </div>
                        <div class="card-body">
                            ${
                              modPermisos.length > 0
                                ? modPermisos
                                    .map(
                                      (p) => `
                                <span class="badge bg-primary me-1">${p.nombre}</span>
                            `,
                                    )
                                    .join("")
                                : '<span class="text-muted">Sin permisos</span>'
                            }
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

    const modalDiv = document.createElement("div");
    modalDiv.className = "modal fade";
    modalDiv.id = "permisosModal";
    modalDiv.innerHTML = `<div class="modal-dialog modal-lg"><div class="modal-content">${html}</div></div>`;
    document.body.appendChild(modalDiv);

    const modalInstance = new bootstrap.Modal(modalDiv);
    modalInstance.show();

    modalDiv.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  } catch (error) {
    showToast(error.message || "Error al cargar permisos", "error");
  }
}

// Llenar selects
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

// Crear modal usuario
function crearModalUsuario() {
  const modalHtml = `
        <div class="modal fade" id="usuarioModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="usuarioModalTitle">Usuario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="usuarioForm">
                            <input type="hidden" id="usuarioId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre Usuario</label>
                                <input type="text" class="form-control" id="usuarioNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Contraseña ${document.getElementById("usuarioId")?.value ? "(dejar en blanco para no cambiar)" : ""}</label>
                                <input type="password" class="form-control" id="usuarioPassword" ${!document.getElementById("usuarioId")?.value ? "required" : ""} />
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
                            <button type="submit" class="btn btn-danger w-100" onclick="saveUsuario(event)">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

// Crear modal empleado
function crearModalEmpleado() {
  const modalHtml = `
        <div class="modal fade" id="empleadoModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="empleadoModalTitle">Empleado</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="empleadoForm">
                            <input type="hidden" id="empleadoId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="empleadoNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">DPI</label>
                                <input type="text" class="form-control" id="empleadoDpi" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="empleadoTelefono" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="empleadoEmail" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="empleadoDireccion" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Salario Base</label>
                                <input type="number" step="0.01" class="form-control" id="empleadoSalario" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Puesto</label>
                                <select class="form-select" id="empleadoPuesto"></select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Turno</label>
                                <select class="form-select" id="empleadoTurno"></select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="empleadoActivo">
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-danger w-100" onclick="saveEmpleado(event)">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

// Exponer funciones globales
window.loadUsuariosModule = loadUsuariosModule;
window.showCreateUsuarioModal = showCreateUsuarioModal;
window.showEditUsuarioModal = showEditUsuarioModal;
window.saveUsuario = saveUsuario;
window.deleteUsuario = deleteUsuario;
window.showCreateEmpleadoModal = showCreateEmpleadoModal;
window.showEditEmpleadoModal = showEditEmpleadoModal;
window.saveEmpleado = saveEmpleado;
window.deleteEmpleado = deleteEmpleado;
window.verPermisosRol = verPermisosRol;
