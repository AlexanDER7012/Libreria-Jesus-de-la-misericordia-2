// CLIENTES

let clientesData = [];

// CARGA DE CLIENTES
async function loadClientesModule() {
  const container = document.getElementById("clientesTableContainer");
  if (!container) return;

  try {
    clientesData = await api.getClientes();
    renderClientesTable(clientesData);
  } catch (error) {
    console.error("Error cargando clientes:", error);
    container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar clientes: ${error.message}
            </div>
        `;
  }
}

// RENDERIZAR TABLA
function renderClientesTable(clientes) {
  const container = document.getElementById("clientesTableContainer");
  if (!container) return;

  if (!clientes || clientes.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay clientes registrados</p>
                <button class="btn btn-primary btn-sm" onclick="showCreateClienteModal()">
                    <i class="fas fa-plus me-2"></i>Agregar Cliente
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

  clientes.forEach((cliente) => {
    const activo = cliente.activo !== 0;
    html += `
            <tr>
                <td>${cliente.id}</td>
                <td><strong>${cliente.nombre || "--"}</strong></td>
                <td>${cliente.telefono || "--"}</td>
                <td>${cliente.email || "--"}</td>
                <td>${cliente.nit || "--"}</td>
                <td><span class="badge bg-info">${cliente.tipo_cliente || "General"}</span></td>
                <td>
                    <span class="badge ${activo ? "bg-success" : "bg-danger"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showEditClienteModal(${cliente.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCliente(${cliente.id})">
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
            <small class="text-muted">Total: ${clientes.length} clientes</small>
        </div>
    `;

  container.innerHTML = html;
}

// CREAR CLIENTE
function showCreateClienteModal() {
  const modal = document.getElementById("clienteModal");
  const form = document.getElementById("clienteForm");
  const title = document.getElementById("clienteModalTitle");

  title.textContent = "Nuevo Cliente";
  form.reset();
  document.getElementById("clienteId").value = "";
  document.getElementById("clienteActivo").value = "1";

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

// EDITAR CLIENTE
async function showEditClienteModal(id) {
  try {
    const cliente = await api.getCliente(id);
    if (!cliente) {
      showToast("Cliente no encontrado", "error");
      return;
    }

    const modal = document.getElementById("clienteModal");
    const form = document.getElementById("clienteForm");
    const title = document.getElementById("clienteModalTitle");

    title.textContent = "Editar Cliente";
    document.getElementById("clienteId").value = cliente.id;
    document.getElementById("clienteNombre").value = cliente.nombre || "";
    document.getElementById("clienteTelefono").value = cliente.telefono || "";
    document.getElementById("clienteEmail").value = cliente.email || "";
    document.getElementById("clienteDireccion").value = cliente.direccion || "";
    document.getElementById("clienteNit").value = cliente.nit || "";
    document.getElementById("clienteTipo").value =
      cliente.tipo_cliente || "General";
    document.getElementById("clienteActivo").value =
      cliente.activo !== 0 ? "1" : "0";

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  } catch (error) {
    console.error("Error cargando cliente:", error);
    showToast("Error al cargar el cliente", "error");
  }
}

// GUARDAR CLIENTE
async function saveCliente(event) {
  event.preventDefault();

  const id = document.getElementById("clienteId").value;
  const data = {
    nombre: document.getElementById("clienteNombre").value.trim(),
    telefono: document.getElementById("clienteTelefono").value.trim(),
    email: document.getElementById("clienteEmail").value.trim(),
    direccion: document.getElementById("clienteDireccion").value.trim(),
    nit: document.getElementById("clienteNit").value.trim(),
    tipo_cliente: document.getElementById("clienteTipo").value,
    activo: parseInt(document.getElementById("clienteActivo").value),
  };

  if (!data.nombre) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  try {
    let result;
    if (id) {
      result = await api.updateCliente(id, data);
      showToast("Cliente actualizado correctamente", "success");
    } else {
      result = await api.createCliente(data);
      showToast("Cliente creado correctamente", "success");
    }

    // Cerrar modal y recargar
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("clienteModal"),
    );
    modal.hide();
    await loadClientesModule();
  } catch (error) {
    console.error("Error guardando cliente:", error);
    showToast(error.message || "Error al guardar el cliente", "error");
  }
}

// ELIMINAR CLIENTE
async function deleteCliente(id) {
  if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

  try {
    await api.deleteCliente(id);
    showToast("Cliente eliminado correctamente", "success");
    await loadClientesModule();
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    showToast(error.message || "Error al eliminar el cliente", "error");
  }
}

// Fun globales
window.loadClientesModule = loadClientesModule;
window.showCreateClienteModal = showCreateClienteModal;
window.showEditClienteModal = showEditClienteModal;
window.saveCliente = saveCliente;
window.deleteCliente = deleteCliente;
