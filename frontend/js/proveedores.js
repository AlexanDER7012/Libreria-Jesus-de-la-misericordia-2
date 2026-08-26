// PROVEEDORES

let proveedoresData = [];
let tiposProveedorData = [];

// CARGA DEL MÓDULO
async function loadProveedoresModule() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-building me-2 text-primary"></i>Proveedores</h4>
            <div>
                <button class="btn btn-primary btn-sm me-2" onclick="showCreateProveedorModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Proveedor
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="cargarModulo('compras')">
                    <i class="fas fa-truck me-1"></i>Compras
                </button>
            </div>
        </div>
        <div id="proveedoresTableContainer">
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Cargando proveedores...</p>
            </div>
        </div>
    `;

  try {
    const [proveedores, tipos] = await Promise.all([
      api.getProveedores().catch(() => []),
      api.getTiposProveedor().catch(() => []),
    ]);

    proveedoresData = proveedores || [];
    tiposProveedorData = tipos || [];

    renderProveedoresTable(proveedoresData);
  } catch (error) {
    document.getElementById("proveedoresTableContainer").innerHTML = `
            <div class="alert alert-danger">Error al cargar datos: ${error.message}</div>
        `;
  }
}

// RENDERIZAR TABLA DE PROVEEDORES
function renderProveedoresTable(proveedores) {
  const container = document.getElementById("proveedoresTableContainer");
  if (!container) return;

  if (!proveedores || proveedores.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-building fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay proveedores registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateProveedorModal()">
                    <i class="fas fa-plus me-2"></i>Agregar Proveedor
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
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>NIT</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  proveedores.forEach((p) => {
    const tipo = tiposProveedorData.find((t) => t.id === p.id_tipo_proveedor);
    const activo = p.activo !== 0;

    html += `
            <tr>
                <td>${p.id}</td>
                <td><strong>${p.nombre || "--"}</strong></td>
                <td>${p.contacto || "--"}</td>
                <td>${p.telefono || "--"}</td>
                <td>${p.email || "--"}</td>
                <td>${p.nit || "--"}</td>
                <td>${tipo ? tipo.nombre : "--"}</td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditProveedorModal(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProveedor(${p.id})">
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
        <div class="text-end">
            <small class="text-muted">Total: ${proveedores.length} proveedores</small>
        </div>
    `;

  container.innerHTML = html;
}

// CREAR PROVEEDOR - MODAL
function showCreateProveedorModal() {
  const modal = document.getElementById("proveedorModal");
  const form = document.getElementById("proveedorForm");
  const title = document.getElementById("proveedorModalTitle");

  if (!modal) {
    // Crear modal si no existe
    crearModalProveedor();
    setTimeout(() => showCreateProveedorModal(), 100);
    return;
  }

  title.textContent = "Nuevo Proveedor";
  form.reset();
  document.getElementById("proveedorId").value = "";
  document.getElementById("proveedorActivo").value = "1";

  llenarSelectTipoProveedor();

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// EDITAR PROVEEDOR
async function showEditProveedorModal(id) {
  try {
    const proveedor = (await api.getProveedores)
      ? (await api.getProveedores()).find((p) => p.id === id)
      : proveedoresData.find((p) => p.id === id);

    if (!proveedor) {
      showToast("Proveedor no encontrado", "error");
      return;
    }

    const modal = document.getElementById("proveedorModal");
    const form = document.getElementById("proveedorForm");
    const title = document.getElementById("proveedorModalTitle");

    if (!modal) {
      crearModalProveedor();
      setTimeout(() => showEditProveedorModal(id), 100);
      return;
    }

    title.textContent = "Editar Proveedor";
    document.getElementById("proveedorId").value = proveedor.id;
    document.getElementById("proveedorNombre").value = proveedor.nombre || "";
    document.getElementById("proveedorContacto").value =
      proveedor.contacto || "";
    document.getElementById("proveedorTelefono").value =
      proveedor.telefono || "";
    document.getElementById("proveedorEmail").value = proveedor.email || "";
    document.getElementById("proveedorDireccion").value =
      proveedor.direccion || "";
    document.getElementById("proveedorNit").value = proveedor.nit || "";
    document.getElementById("proveedorCodigo").value =
      proveedor.codigo_proveedor || "";
    document.getElementById("proveedorDiasCredito").value =
      proveedor.dias_credito || "";
    document.getElementById("proveedorActivo").value =
      proveedor.activo !== 0 ? "1" : "0";

    llenarSelectTipoProveedor(proveedor.id_tipo_proveedor);

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    showToast(error.message || "Error al cargar proveedor", "error");
  }
}

// CREAR MODAL DE PROVEEDOR
function crearModalProveedor() {
  const modalHtml = `
        <div class="modal fade" id="proveedorModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="proveedorModalTitle">Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="proveedorForm">
                            <input type="hidden" id="proveedorId" />
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-control" id="proveedorNombre" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Contacto</label>
                                <input type="text" class="form-control" id="proveedorContacto" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="proveedorTelefono" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="proveedorEmail" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="proveedorDireccion" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">NIT</label>
                                <input type="text" class="form-control" id="proveedorNit" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Código Proveedor</label>
                                <input type="text" class="form-control" id="proveedorCodigo" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Días de Crédito</label>
                                <input type="number" class="form-control" id="proveedorDiasCredito" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipo de Proveedor</label>
                                <select class="form-select" id="proveedorTipo">
                                    <option value="">Seleccionar tipo</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="proveedorActivo">
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" onclick="saveProveedor(event)">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

// LLENAR SELECT TIPO PROVEEDOR
function llenarSelectTipoProveedor(selectedId) {
  const select = document.getElementById("proveedorTipo");
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar tipo</option>';
  tiposProveedorData.forEach((t) => {
    const selected = t.id === selectedId ? "selected" : "";
    select.innerHTML += `<option value="${t.id}" ${selected}>${t.nombre}</option>`;
  });
}

// GUARDAR PROVEEDOR
async function saveProveedor(event) {
  event.preventDefault();

  const id = document.getElementById("proveedorId").value;
  const data = {
    nombre: document.getElementById("proveedorNombre").value.trim(),
    contacto: document.getElementById("proveedorContacto").value.trim() || null,
    telefono: document.getElementById("proveedorTelefono").value.trim() || null,
    email: document.getElementById("proveedorEmail").value.trim() || null,
    direccion:
      document.getElementById("proveedorDireccion").value.trim() || null,
    nit: document.getElementById("proveedorNit").value.trim() || null,
    codigo_proveedor:
      document.getElementById("proveedorCodigo").value.trim() || null,
    dias_credito:
      parseInt(document.getElementById("proveedorDiasCredito").value) || null,
    id_tipo_proveedor:
      parseInt(document.getElementById("proveedorTipo").value) || null,
    activo: parseInt(document.getElementById("proveedorActivo").value),
  };

  if (!data.nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    if (id) {
      await api.updateProveedor(id, data);
      showToast("Proveedor actualizado correctamente", "success");
    } else {
      await api.createProveedor(data);
      showToast("Proveedor creado correctamente", "success");
    }

    bootstrap.Modal.getInstance(
      document.getElementById("proveedorModal"),
    ).hide();
    await loadProveedoresModule();
  } catch (error) {
    showToast(error.message || "Error al guardar proveedor", "error");
  }
}

// ELIMINAR PROVEEDOR
async function deleteProveedor(id) {
  if (!confirm("¿Estás seguro de eliminar este proveedor?")) return;

  try {
    await api.deleteProveedor(id);
    showToast("Proveedor eliminado correctamente", "success");
    await loadProveedoresModule();
  } catch (error) {
    showToast(error.message || "Error al eliminar proveedor", "error");
  }
}

// FUNCIONES GLOBALES
window.proveedoresData = proveedoresData;
window.tiposProveedorData = tiposProveedorData;
window.loadProveedoresModule = loadProveedoresModule;
window.showCreateProveedorModal = showCreateProveedorModal;
window.showEditProveedorModal = showEditProveedorModal;
window.saveProveedor = saveProveedor;
window.deleteProveedor = deleteProveedor;
window.llenarSelectTipoProveedor = llenarSelectTipoProveedor;
