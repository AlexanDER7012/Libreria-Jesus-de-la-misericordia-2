// APP

class App {
  constructor() {
    if (!checkAuth()) return;
    this.currentModule = "dashboard";
    this.user = getCurrentUser();
    this.init();
  }

  init() {
    console.log("App iniciada");
    this.setupNavigation();
    this.setupUserInfo();
    this.setupLogout();
    this.loadModule("dashboard");
  }

  setupNavigation() {
    document.querySelectorAll("[data-module]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadModule(link.dataset.module);
      });
    });
  }

  setupUserInfo() {
    if (this.user) {
      const nameEl = document.getElementById("userName");
      const emailEl = document.getElementById("userEmail");
      if (nameEl) nameEl.textContent = this.user.nombre_usuario || "Usuario";
      if (emailEl) emailEl.textContent = this.user.nombre_usuario || "";
    }
  }

  setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn)
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
  }

  updateActiveNav(moduleName) {
    document.querySelectorAll("[data-module]").forEach((link) => {
      link.classList.toggle("active", link.dataset.module === moduleName);
    });
  }

  updateTitle(moduleName) {
    const titles = {
      dashboard: "Dashboard",
      clientes: "Clientes",
      productos: "Productos",
      ventas: "Ventas",
      compras: "Compras",
      inventario: "Inventario",
      usuarios: "Usuarios",
      configuracion: "Configuración",
    };
    const titleEl = document.getElementById("pageTitle");
    if (titleEl) {
      titleEl.textContent = titles[moduleName] || moduleName;
      document.title = `${titles[moduleName] || moduleName} - Librería`;
    }
  }

  async loadModule(moduleName) {
    this.currentModule = moduleName;
    this.updateActiveNav(moduleName);
    this.updateTitle(moduleName);

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    try {
      switch (moduleName) {
        case "dashboard":
          await this.loadDashboard(mainContent);
          break;
        case "clientes":
          await this.loadClientes(mainContent);
          break;
        case "productos":
          await this.loadProductos(mainContent);
          break;
        case "ventas":
          await this.loadVentas(mainContent);
          break;
        case "compras":
          await this.loadCompras(mainContent);
          break;
        case "inventario":
          await this.loadInventario(mainContent);
          break;
        case "usuarios":
          await this.loadUsuarios(mainContent);
          break;
        case "configuracion":
          await this.loadConfiguracion(mainContent);
          break;
        case "proveedores":
          await this.loadProveedores(mainContent);
          break;
        default:
          mainContent.innerHTML = `<div class="alert alert-warning">Módulo no encontrado</div>`;
      }
    } catch (error) {
      mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error: ${error.message}
                </div>
            `;
    }
  }

  async loadProveedores(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-building me-2 text-primary"></i>Proveedores</h4>
        <button class="btn btn-primary" onclick="showCreateProveedorModal()">
            <i class="fas fa-plus me-2"></i>Nuevo Proveedor
        </button>
        </div>
        <div id="proveedoresTableContainer">
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Cargando proveedores...</p>
        </div>
        </div>
    `;
    // Si tienes un archivo proveedores.js con una función loadProveedoresModule, llámala
    if (typeof loadProveedoresModule === "function") {
      await loadProveedoresModule();
    } else {
      // Fallback: carga simple desde api
      try {
        const proveedores = await api.getProveedores();
        const containerTable = document.getElementById(
          "proveedoresTableContainer",
        );
        // renderizar tabla...
      } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
      }
    }
  }

  async loadDashboard(container) {
    try {
      const [clientes, productos, ventas, alertas] = await Promise.all([
        api.getClientes().catch(() => []),
        api.getProductos().catch(() => []),
        api.getVentas().catch(() => []),
        api.getAlertasStock().catch(() => []),
      ]);

      container.innerHTML = `
                <div class="row g-4">
                    <div class="col-12 col-sm-6 col-xl-3">
                        <div class="card bg-primary bg-gradient text-white border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-white-50 mb-1">Total Clientes</h6>
                                        <h2 class="mb-0">${clientes.length}</h2>
                                    </div>
                                    <div class="bg-white bg-opacity-25 rounded-circle p-3">
                                        <i class="fas fa-users fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-sm-6 col-xl-3">
                        <div class="card bg-success bg-gradient text-white border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-white-50 mb-1">Total Productos</h6>
                                        <h2 class="mb-0">${productos.length}</h2>
                                    </div>
                                    <div class="bg-white bg-opacity-25 rounded-circle p-3">
                                        <i class="fas fa-box fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-sm-6 col-xl-3">
                        <div class="card bg-warning bg-gradient text-white border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-white-50 mb-1">Total Ventas</h6>
                                        <h2 class="mb-0">${ventas.length}</h2>
                                    </div>
                                    <div class="bg-white bg-opacity-25 rounded-circle p-3">
                                        <i class="fas fa-shopping-cart fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-sm-6 col-xl-3">
                        <div class="card bg-danger bg-gradient text-white border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-white-50 mb-1">Alertas Stock</h6>
                                        <h2 class="mb-0">${alertas.length}</h2>
                                    </div>
                                    <div class="bg-white bg-opacity-25 rounded-circle p-3">
                                        <i class="fas fa-exclamation-triangle fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-white">
                                <h5 class="mb-0"><i class="fas fa-clock me-2 text-primary"></i>Ventas Recientes</h5>
                            </div>
                            <div class="card-body">
                                ${
                                  ventas.length > 0
                                    ? `
                                    <div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Cliente</th>
                                                    <th>Fecha</th>
                                                    <th>Total</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${ventas
                                                  .slice(0, 5)
                                                  .map(
                                                    (v, i) => `
                                                    <tr>
                                                        <td>${i + 1}</td>
                                                        <td>${v.id_cliente || "--"}</td>
                                                        <td>${v.fecha ? new Date(v.fecha).toLocaleDateString() : "--"}</td>
                                                        <td>$${v.total || 0}</td>
                                                        <td><span class="badge bg-success">${v.estado || "Completada"}</span></td>
                                                    </tr>
                                                `,
                                                  )
                                                  .join("")}
                                            </tbody>
                                        </table>
                                    </div>
                                `
                                    : `
                                    <div class="text-center py-4 text-muted">
                                        <i class="fas fa-inbox fa-3x mb-3"></i>
                                        <p>No hay ventas registradas</p>
                                    </div>
                                `
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
    } catch (error) {
      container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
  }

  async loadClientes(container) {
    container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4><i class="fas fa-users me-2 text-primary"></i>Clientes</h4>
                <button class="btn btn-primary" onclick="showCreateClienteModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Cliente
                </button>
            </div>
            <div id="clientesTableContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando clientes...</p>
                </div>
            </div>
        `;
    await loadClientesModule();
  }

  async loadProductos(container) {
    container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4><i class="fas fa-box me-2 text-success"></i>Productos</h4>
                <button class="btn btn-success" onclick="showCreateProductoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Producto
                </button>
            </div>
            <div id="productosTableContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-success" role="status"></div>
                    <p class="mt-2 text-muted">Cargando productos...</p>
                </div>
            </div>
        `;
    await loadProductosModule();
  }

  async loadVentas(container) {
    container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4><i class="fas fa-shopping-cart me-2 text-warning"></i>Ventas</h4>
                <button class="btn btn-warning" onclick="showCreateVentaModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Venta
                </button>
            </div>
            <div id="ventasTableContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-warning" role="status"></div>
                    <p class="mt-2 text-muted">Cargando ventas...</p>
                </div>
            </div>
        `;
    await loadVentasModule();
  }

  async loadCompras(container) {
    container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4><i class="fas fa-truck me-2 text-info"></i>Compras</h4>
                <button class="btn btn-info" onclick="showCreateCompraModal()">
                    <i class="fas fa-plus me-2"></i>Nueva Compra
                </button>
            </div>
            <div id="comprasTableContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-info" role="status"></div>
                    <p class="mt-2 text-muted">Cargando compras...</p>
                </div>
            </div>
        `;
    await loadComprasModule();
  }

  async loadInventario(container) {
    container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4><i class="fas fa-warehouse me-2 text-secondary"></i>Inventario</h4>
                <button class="btn btn-secondary" onclick="showCreateMovimientoModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Movimiento
                </button>
            </div>
            <div id="inventarioTableContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-secondary" role="status"></div>
                    <p class="mt-2 text-muted">Cargando inventario...</p>
                </div>
            </div>
        `;
    await loadInventarioModule();
  }

  async loadUsuarios(container) {
    container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4><i class="fas fa-user-shield me-2 text-danger"></i>Usuarios</h4>
                <button class="btn btn-danger" onclick="showCreateUsuarioModal()">
                    <i class="fas fa-plus me-2"></i>Nuevo Usuario
                </button>
            </div>
            <div id="usuariosTableContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-danger" role="status"></div>
                    <p class="mt-2 text-muted">Cargando usuarios...</p>
                </div>
            </div>
        `;
    await loadUsuariosModule();
  }

  async loadConfiguracion(container) {
    container.innerHTML = `
            <h4><i class="fas fa-cog me-2 text-dark"></i>Configuración</h4>
            <div id="configuracionContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-dark" role="status"></div>
                    <p class="mt-2 text-muted">Cargando configuración...</p>
                </div>
            </div>
        `;
    await loadConfiguracionModule();
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
