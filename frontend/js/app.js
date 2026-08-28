// APP.js

class App {
  constructor() {
    if (!checkAuth()) return;
    this.currentModule = null;
    this.user = getCurrentUser();
    this.sidebarVisible = false;

    // ✅ Lista de módulos del sistema (SIN Clientes y SIN Proveedores)
    this.modules = [
      { id: "dashboard", label: "Dashboard", icon: "fa-chart-bar" },
      { id: "productos", label: "Productos", icon: "fa-box" },
      { id: "ventas", label: "Ventas", icon: "fa-shopping-cart" },
      { id: "compras", label: "Compras", icon: "fa-truck" },
      { id: "inventario", label: "Inventario", icon: "fa-warehouse" },
      { id: "usuarios", label: "Usuarios", icon: "fa-user-shield" },
      { id: "reportes", label: "Reportes", icon: "fa-chart-bar" },
      { id: "configuracion", label: "Configuración", icon: "fa-cog" },
    ];

    this.init();
  }

  init() {
    console.log("App iniciada");
    this.setupNavigation();
    this.setupUserInfo();
    this.setupLogout();
    this.buildSidebar();
    this.setupFloatingButton();
    this.showHome();
  }

  // =============================================
  // NAVEGACIÓN ORIGINAL (adaptada)
  // =============================================

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
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }
    const logoutTopBtn = document.querySelector(
      ".navbar .btn-outline-light:last-child",
    );
    if (logoutTopBtn && !logoutTopBtn.id) {
      logoutTopBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }
  }

  // =============================================
  // SIDEBAR
  // =============================================

  buildSidebar() {
    const nav = document.getElementById("sidebarNav");
    if (!nav) return;
    nav.innerHTML = "";
    this.modules.forEach((mod) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "sidebar-link";
      a.dataset.module = mod.id;
      a.innerHTML = `<i class="fas ${mod.icon} me-2"></i> ${mod.label}`;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadModule(mod.id);
      });
      nav.appendChild(a);
    });
  }

  showSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.add("active");
      this.sidebarVisible = true;
    }
    document.getElementById("sidebarToggleBtn")?.classList.remove("d-none");
    this.updateFloatingButton();
  }

  hideSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.remove("active");
      this.sidebarVisible = false;
    }
    document.getElementById("sidebarToggleBtn")?.classList.add("d-none");
    this.updateFloatingButton();
  }

  toggleSidebar() {
    if (this.sidebarVisible) {
      this.hideSidebar();
    } else {
      this.showSidebar();
    }
  }

  setActiveLink(moduleId) {
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.module === moduleId);
    });
  }

  // =============================================
  // BOTÓN FLOTANTE
  // =============================================

  setupFloatingButton() {
    const btn = document.getElementById("showSidebarBtn");
    if (!btn) return;
    btn.style.display = "none";
  }

  updateFloatingButton() {
    const btn = document.getElementById("showSidebarBtn");
    if (!btn) return;

    if (this.sidebarVisible) {
      btn.style.display = "none";
    } else {
      if (this.currentModule !== null) {
        btn.style.display = "flex";
      } else {
        btn.style.display = "none";
      }
    }
  }

  // =============================================
  // PANTALLA DE INICIO (MATRIZ) - SIN Clientes y Proveedores
  // =============================================

  showHome() {
    this.currentModule = null;
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    const mainModules = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "fa-chart-bar",
        color: "primary",
      },
      { id: "productos", label: "Productos", icon: "fa-box", color: "success" },
      {
        id: "ventas",
        label: "Ventas",
        icon: "fa-shopping-cart",
        color: "warning",
      },
      { id: "compras", label: "Compras", icon: "fa-truck", color: "info" },
      {
        id: "inventario",
        label: "Inventario",
        icon: "fa-warehouse",
        color: "secondary",
      },
      {
        id: "usuarios",
        label: "Usuarios",
        icon: "fa-user-shield",
        color: "danger",
      },
      {
        id: "reportes",
        label: "Reportes",
        icon: "fa-chart-bar",
        color: "primary",
      },
      {
        id: "configuracion",
        label: "Configuración",
        icon: "fa-cog",
        color: "dark",
      },
    ];

    let cards = mainModules
      .map(
        (m) => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card modulo-card text-center p-3" onclick="window.app.loadModule('${m.id}')">
          <div class="modulo-icon bg-${m.color}">
            <i class="fas ${m.icon} fa-2x text-white"></i>
          </div>
          <h6 class="mt-2 mb-0">${m.label}</h6>
        </div>
      </div>
    `,
      )
      .join("");

    mainContent.innerHTML = `
      <div class="row g-4 justify-content-center">
        ${cards}
      </div>
    `;

    this.hideSidebar();
    document.getElementById("sidebarToggleBtn")?.classList.add("d-none");
    this.updateFloatingButton();
    this.updateTitle("Inicio");
  }

  // =============================================
  // CARGA DE MÓDULOS
  // =============================================

  updateActiveNav(moduleName) {
    document.querySelectorAll("[data-module]").forEach((link) => {
      link.classList.toggle("active", link.dataset.module === moduleName);
    });
    this.setActiveLink(moduleName);
  }

  updateTitle(moduleName) {
    const titles = {
      dashboard: "Dashboard",
      productos: "Productos",
      ventas: "Ventas",
      compras: "Compras",
      inventario: "Inventario",
      usuarios: "Usuarios",
      reportes: "Reportes",
      configuracion: "Configuración",
      Inicio: "Inicio",
    };
    const titleEl = document.getElementById("pageTitle");
    const displayName = titles[moduleName] || moduleName;
    if (titleEl) {
      titleEl.textContent = displayName;
    }
    document.title = `${displayName} - Librería`;
  }

  async loadModule(moduleName) {
    if (!moduleName || moduleName === this.currentModule) return;
    this.currentModule = moduleName;

    this.showSidebar();
    this.updateActiveNav(moduleName);
    this.updateTitle(moduleName);
    this.updateFloatingButton();

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    try {
      switch (moduleName) {
        case "dashboard":
          await this.loadDashboard(mainContent);
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
        case "reportes":
          await this.loadReportes(mainContent);
          break;
        case "configuracion":
          await this.loadConfiguracion(mainContent);
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

  // =============================================
  // VOLVER AL INICIO
  // =============================================

  goHome() {
    this.showHome();
    this.currentModule = null;
    document.getElementById("sidebarToggleBtn")?.classList.add("d-none");
    this.updateFloatingButton();
  }

  // =============================================
  // MÉTODOS DE CARGA DE MÓDULOS
  // =============================================

  async loadDashboard(container) {
    try {
      const [clientes, productos, ventas, alertas] = await Promise.all([
        api.getClientes().catch(() => []),
        api.getProductos().catch(() => []),
        api.getVentas().catch(() => []),
        api.getAlertasStock().catch(() => []),
      ]);

      container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4><i class="fas fa-chart-bar me-2 text-primary"></i>Dashboard</h4>
        </div>
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
                              <td>Q${v.total || 0}</td>
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
    if (typeof loadProductosModule === "function") {
      await loadProductosModule();
    }
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
    if (typeof loadVentasModule === "function") {
      await loadVentasModule();
    }
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
    if (typeof loadComprasModule === "function") {
      await loadComprasModule();
    }
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
    if (typeof loadInventarioModule === "function") {
      await loadInventarioModule();
    }
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
    if (typeof loadUsuariosModule === "function") {
      await loadUsuariosModule();
    }
  }

  // =============================================
  // CARGA DEL MÓDULO DE REPORTES
  // =============================================
  async loadReportes(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-chart-bar me-2 text-primary"></i>Reportes</h4>
      </div>
      <div id="reportesContainer">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted">Cargando módulo de reportes...</p>
        </div>
      </div>
    `;
    if (typeof loadReportesModule === "function") {
      await loadReportesModule();
    } else {
      container.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>
          El módulo de reportes no está disponible. Verifica que el archivo reportes.js esté cargado.
        </div>
      `;
    }
  }

  async loadConfiguracion(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-cog me-2 text-dark"></i>Configuración</h4>
        <button class="btn btn-dark" onclick="showEditConfiguracionModal()">
          <i class="fas fa-edit me-2"></i>Editar Configuración
        </button>
      </div>
      <div id="configuracionContainer">
        <div class="text-center py-5">
          <div class="spinner-border text-dark" role="status"></div>
          <p class="mt-2 text-muted">Cargando configuración...</p>
        </div>
      </div>
    `;
    if (typeof loadConfiguracionModule === "function") {
      await loadConfiguracionModule();
    }
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

// Exponer funciones para uso global
window.goHome = () => window.app?.goHome();
window.toggleSidebar = () => window.app?.toggleSidebar();
window.loadModule = (mod) => window.app?.loadModule(mod);
