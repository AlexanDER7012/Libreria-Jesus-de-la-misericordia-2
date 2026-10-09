// APP.js

class App {
  constructor() {
    // requireAuth (y no solo checkAuth) para que se active el control de
    // sesión: renovar el token mientras el usuario trabaja y cerrar la
    // sesión tras 15 minutos sin actividad. Antes nunca se activaba, y el
    // sistema sacaba al usuario a los 60 minutos aunque estuviera trabajando.
    if (!requireAuth()) return;
    this.currentModule = null;
    this.user = getCurrentUser();
    console.log("👤 Usuario actual:", this.user);
    this.sidebarVisible = false;

    this.modules = [
      { id: "reportes", label: "Reportes", icon: "fa-chart-bar" },
      { id: "ventas", label: "Ventas", icon: "fa-shopping-cart" },
      { id: "compras", label: "Compras", icon: "fa-truck" },
      { id: "caja", label: "Caja", icon: "fa-cash-register" },
      { id: "inventario", label: "Inventario", icon: "fa-warehouse" },
      { id: "usuarios", label: "Usuarios", icon: "fa-user-shield" },
      { id: "configuracion", label: "Configuración", icon: "fa-cog" },
    ];


    this.redirects = {
      dashboard: { module: "reportes", tab: "dashboard" },
      productos: { module: "inventario", tab: "productos" },
    };

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
  // OBTENER PERMISOS DEL USUARIO
  // =============================================

  getPermisosUsuario() {
    try {
      const permisos = localStorage.getItem("user_permisos");
      return permisos ? JSON.parse(permisos) : [];
    } catch (e) {
      return [];
    }
  }

  tienePermiso(moduleId) {
    // ⭐ CAMBIO: "reportes" siempre visible (antes era "dashboard").
    //    Si el usuario podía ver Dashboard, sigue viendo Reportes.
    if (moduleId === "reportes") {
      return true;
    }

    // ⭐ CAMBIO: compatibilidad con permisos antiguos.
    //    Si el módulo está mapeado en redirects, se valida el permiso
    //    del módulo destino Y también se acepta el permiso del módulo
    //    original (para no romper instalaciones existentes).
    const redirect = this.redirects[moduleId];
    if (redirect) {
      return (
        this.tienePermiso(redirect.module) || this._checkPermisoRaw(moduleId)
      );
    }

    return this._checkPermisoRaw(moduleId);
  }

  // ⭐ NUEVO: lógica original de verificación, extraída para reutilizar
  _checkPermisoRaw(moduleId) {
    const permisos = this.getPermisosUsuario();
    console.log(`🔍 Verificando permiso para ${moduleId}, permisos:`, permisos);

    if (!permisos || permisos.length === 0) {
      console.warn(`⚠️ Sin permisos, solo Reportes para ${moduleId}`);
      return false;
    }

    const moduleLower = moduleId.toLowerCase();
    const tieneAcceso = permisos.some((p) => {
      const nombreModulo = p.modulo_nombre;
      const moduloLower = nombreModulo ? nombreModulo.toLowerCase() : "";
      const coincide =
        moduloLower === moduleLower && (p.nombre || "").toLowerCase() === "ver";

      if (coincide) {
        console.log(
          `✅ Permiso encontrado: ${moduloLower} para ${moduleLower}`,
        );
      }
      return coincide;
    });

    if (!tieneAcceso) {
      console.warn(`❌ Sin permiso para: ${moduleId}`);
    }

    return tieneAcceso;
  }

  // =============================================
  // NAVEGACIÓN
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

    const permisos = this.getPermisosUsuario();
    console.log("📋 Permisos del usuario:", permisos);

    this.modules.forEach((mod) => {
      if (this.tienePermiso(mod.id)) {
        const a = document.createElement("a");
        a.href = "#";
        a.className = "sidebar-link";
        a.dataset.module = mod.id;
        a.innerHTML = `<i class="fas ${mod.icon} sidebar-icon"></i><span class="sidebar-label">${mod.label}</span>`;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          this.loadModule(mod.id);
        });
        nav.appendChild(a);
      }
    });

    if (nav.children.length === 0) {
      nav.innerHTML = `
        <div class="text-center text-white-50 p-3">
          <i class="fas fa-lock fa-2x mb-2"></i>
          <p class="small">No tienes permisos para ver módulos</p>
        </div>
      `;
    }
  }

  showSidebar() {
    const sidebar = document.getElementById("sidebar");
    const icon = document.getElementById("sidebarCollapseIcon");

    if (sidebar) {
      sidebar.classList.add("active");
      this.sidebarVisible = true;
      if (icon) icon.className = "fas fa-chevron-left";
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
    const sidebar = document.getElementById("sidebar");
    const icon = document.getElementById("sidebarCollapseIcon");
    if (!sidebar) return;

    if (this.sidebarVisible) {
      sidebar.classList.remove("active");
      this.sidebarVisible = false;
      if (icon) icon.className = "fas fa-chevron-right";
    } else {
      sidebar.classList.add("active");
      this.sidebarVisible = true;
      if (icon) icon.className = "fas fa-chevron-left";
    }
    this.updateFloatingButton();
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
      btn.style.display = this.currentModule !== null ? "flex" : "none";
    }
  }

  // =============================================
  // PANTALLA DE INICIO (MATRIZ)
  // =============================================

  showHome() {
    this.currentModule = null;
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    const allModules = [
      {
        id: "reportes",
        label: "Reportes",
        icon: "fa-chart-bar",
        color: "primary",
        imagen: "reportes.png",
      },
      {
        id: "ventas",
        label: "Ventas",
        icon: "fa-shopping-cart",
        color: "warning",
        imagen: "ventas.png",
      },
      {
        id: "compras",
        label: "Compras",
        icon: "fa-truck",
        color: "info",
        imagen: "compras.png",
      },
      {
        id: "caja",
        label: "Caja",
        icon: "fa-cash-register",
        color: "primary",
        imagen: "caja.png",
      },
      {
        id: "inventario",
        label: "Inventario",
        icon: "fa-warehouse",
        color: "secondary",
        imagen: "inventario.png",
      },
      {
        id: "usuarios",
        label: "Usuarios",
        icon: "fa-user-shield",
        color: "danger",
        imagen: "usuarios.png",
      },
      {
        id: "configuracion",
        label: "Configuración",
        icon: "fa-cog",
        color: "dark",
        imagen: "configuracion.png",
      },
    ];

    const mainModules = allModules.filter((mod) => this.tienePermiso(mod.id));

    if (mainModules.length === 0) {
      mainContent.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-lock fa-4x text-muted mb-3"></i>
          <h5 class="text-muted">No tienes acceso a ningún módulo</h5>
          <p class="text-muted small">Contacta al administrador para solicitar permisos.</p>
        </div>
      `;
      this.hideSidebar();
      document.getElementById("sidebarToggleBtn")?.classList.add("d-none");
      this.updateFloatingButton();
      this.updateTitle("Inicio");
      return;
    }

    let cards = mainModules
      .map(
        (m) => `
      <div class="col-12 col-sm-6 col-lg-4">
        <div class="card modulo-card text-center p-3" onclick="window.app.loadModule('${m.id}')">
          <div class="modulo-icon">
            <img src="assets/img/modulos/${m.imagen}" alt="${m.label}" loading="lazy">
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
      reportes: "Reportes",
      ventas: "Ventas",
      compras: "Compras",
      caja: "Caja",
      inventario: "Inventario",
      usuarios: "Usuarios",
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

  async loadModule(moduleName, tabId) {
    if (!moduleName) return;

    // Resolver redirección si aplica
    let realModule = moduleName;
    let realTab = tabId;
    const redirect = this.redirects[moduleName];
    if (redirect) {
      realModule = redirect.module;
      realTab = realTab || redirect.tab;
      console.log(
        `🔀 Redirigiendo ${moduleName} → ${realModule} (tab: ${realTab})`,
      );
    }

    if (realModule === this.currentModule && !realTab) return;

    if (!this.tienePermiso(realModule)) {
      showToast("No tienes permiso para acceder a este módulo", "error");
      return;
    }

    this.currentModule = realModule;
    this.showSidebar();
    this.updateActiveNav(realModule);
    this.updateTitle(realModule);
    this.updateFloatingButton();

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    try {
      switch (realModule) {
        case "reportes":
          await this.loadReportes(mainContent);
          break;
        case "ventas":
          await this.loadVentas(mainContent);
          break;
        case "compras":
          await this.loadCompras(mainContent);
          break;
        case "caja":
          await this.loadCaja(mainContent);
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
        default:
          mainContent.innerHTML = `<div class="alert alert-warning">Módulo no encontrado</div>`;
      }

      if (realTab) {
        this.activarTabDeModulo(realModule, realTab);
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

  activarTabDeModulo(moduleName, tabId) {
    // Esperar a que el DOM del módulo se haya renderizado
    setTimeout(() => {
      // Buscar un botón de pestaña cuyo data-bs-target o id coincida
      const selector = `[data-bs-target="#${tabId}"], [data-tab-id="${tabId}"]`;
      const tabBtn = document.querySelector(selector);
      if (tabBtn && window.bootstrap) {
        try {
          const tab = new bootstrap.Tab(tabBtn);
          tab.show();
          console.log(`📑 Pestaña activada: ${tabId}`);
        } catch (e) {
          console.warn(`No se pudo activar la pestaña ${tabId}:`, e);
        }
      } else {
        console.warn(`Pestaña no encontrada: ${tabId}`);
      }
    }, 400);
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

  async loadVentas(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-shopping-cart me-2 text-warning"></i>Ventas</h4>
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

  async loadCaja(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-cash-register me-2 text-primary"></i>Caja</h4>
      </div>
      <div id="cajaTableContainer">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted">Cargando caja...</p>
        </div>
      </div>
    `;
    if (typeof loadCajaModule === "function") {
      await loadCajaModule();
    }
  }

  async loadInventario(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-warehouse me-2 text-secondary"></i>Inventario</h4>
      </div>

      <!--  Pestañas padre: Catálogo / Operaciones -->
      <ul class="nav nav-pills mb-3" id="inventarioGrupoTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="grupo-catalogo" data-bs-toggle="pill"
                  data-bs-target="#panel-grupo-catalogo" type="button" role="tab">
            <i class="fas fa-boxes me-1"></i>Catálogo
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="grupo-operaciones" data-bs-toggle="pill"
                  data-bs-target="#panel-grupo-operaciones" type="button" role="tab">
            <i class="fas fa-clipboard-list me-1"></i>Operaciones
          </button>
        </li>
      </ul>

      <div class="tab-content" id="inventarioGrupoContent">
        <!--  GRUPO CATÁLOGO -->
        <div class="tab-pane fade show active" id="panel-grupo-catalogo" role="tabpanel">
          <ul class="nav nav-tabs mb-3" id="inventarioTabs" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" id="tab-inv-productos" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-productos" type="button">
                <i class="fas fa-box me-1"></i>Productos
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tab-inv-categorias" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-categorias" type="button">
                <i class="fas fa-tags me-1"></i>Categorías
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tab-inv-marcas" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-marcas" type="button">
                <i class="fas fa-copyright me-1"></i>Marcas
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tab-inv-unidades" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-unidades" type="button">
                <i class="fas fa-ruler me-1"></i>Unidades
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tab-inv-tipos" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-tipos" type="button">
                <i class="fas fa-exchange-alt me-1"></i>Tipos Mov.
              </button>
            </li>
          </ul>

          <div class="tab-content" id="inventarioTabContent">
            <div class="tab-pane fade show active" id="panel-inv-productos" role="tabpanel">
              <div id="productosTableContainer">
                <div class="text-center py-5">
                  <div class="spinner-border text-success" role="status"></div>
                  <p class="mt-2 text-muted">Cargando productos...</p>
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="panel-inv-categorias" role="tabpanel">
              <div id="categoriasTableContainer"></div>
            </div>
            <div class="tab-pane fade" id="panel-inv-marcas" role="tabpanel">
              <div id="marcasTableContainer"></div>
            </div>
            <div class="tab-pane fade" id="panel-inv-unidades" role="tabpanel">
              <div id="unidadesTableContainer"></div>
            </div>
            <div class="tab-pane fade" id="panel-inv-tipos" role="tabpanel">
              <div id="tiposMovimientoContainer"></div>
            </div>
          </div>
        </div>

        <!--  GRUPO OPERACIONES -->
        <div class="tab-pane fade" id="panel-grupo-operaciones" role="tabpanel">
          <ul class="nav nav-tabs mb-3" id="inventarioOpsTabs" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" id="tab-inv-resumen" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-resumen" type="button">
                <i class="fas fa-warehouse me-1"></i>Resumen
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tab-inv-conteo" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-conteo" type="button">
                <i class="fas fa-clipboard-list me-1"></i>Conteo Físico
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tab-inv-traslados" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-traslados" type="button">
                <i class="fas fa-arrows-alt-h me-1"></i>Traslados
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tab-inv-alertas" data-bs-toggle="tab"
                      data-bs-target="#panel-inv-alertas" type="button">
                <i class="fas fa-exclamation-triangle me-1"></i>Alertas
              </button>
            </li>
          </ul>

          <div class="tab-content" id="inventarioOpsContent">
            <div class="tab-pane fade show active" id="panel-inv-resumen" role="tabpanel">
              <div id="inventarioTableContainer"></div>
            </div>
            <div class="tab-pane fade" id="panel-inv-conteo" role="tabpanel">
              <div class="row mb-2 g-2 justify-content-end">
                <div class="col-auto">
                  <input type="date" class="form-control form-control-sm" id="conteoFechaDesde"
                         onchange="skipConteo=0;cargarConteoTabla()">
                </div>
                <div class="col-auto">
                  <input type="date" class="form-control form-control-sm" id="conteoFechaHasta"
                         onchange="skipConteo=0;cargarConteoTabla()">
                </div>
              </div>
              <div id="conteoContainer"></div>
            </div>
            <div class="tab-pane fade" id="panel-inv-traslados" role="tabpanel">
              <div class="row mb-2 g-2 justify-content-end">
                <div class="col-auto">
                  <select class="form-select form-select-sm" id="trasladosFiltroEstado"
                          onchange="skipTraslados=0;cargarTrasladosTabla()">
                    <option value="">Todos los estados</option>
                    <option value="EnProceso">En Proceso</option>
                    <option value="Recibido">Recibido</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
                <div class="col-auto">
                  <input type="date" class="form-control form-control-sm" id="trasladosFechaDesde"
                         onchange="skipTraslados=0;cargarTrasladosTabla()">
                </div>
                <div class="col-auto">
                  <input type="date" class="form-control form-control-sm" id="trasladosFechaHasta"
                         onchange="skipTraslados=0;cargarTrasladosTabla()">
                </div>
              </div>
              <div id="trasladosContainer"></div>
            </div>
            <div class="tab-pane fade" id="panel-inv-alertas" role="tabpanel">
              <div class="row mb-2 g-2 justify-content-end">
                <div class="col-auto">
                  <input type="date" class="form-control form-control-sm" id="alertasFechaDesde"
                         onchange="skipAlertas=0;cargarAlertasTabla()">
                </div>
                <div class="col-auto">
                  <input type="date" class="form-control form-control-sm" id="alertasFechaHasta"
                         onchange="skipAlertas=0;cargarAlertasTabla()">
                </div>
              </div>
              <div id="alertasContainer"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cargar los submódulos
    if (typeof loadProductosModule === "function") {
      try {
        await loadProductosModule();
      } catch (e) {
        console.warn(e);
      }
    }
    if (typeof loadInventarioModule === "function") {
      try {
        await loadInventarioModule();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async loadUsuarios(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-user-shield me-2 text-danger"></i>Usuarios</h4>
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

  async loadReportes(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-chart-bar me-2 text-primary"></i>Reportes</h4>
      </div>

      <ul class="nav nav-tabs mb-3" id="reportesTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="tab-rep-dashboard" data-bs-toggle="tab"
                  data-bs-target="#panel-rep-dashboard" type="button" role="tab">
            <i class="fas fa-tachometer-alt me-1"></i>Dashboard
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-rep-reportes" data-bs-toggle="tab"
                  data-bs-target="#panel-rep-reportes" type="button" role="tab">
            <i class="fas fa-file-alt me-1"></i>Reportes detallados
          </button>
        </li>
      </ul>

      <div class="tab-content">
        <div class="tab-pane fade show active" id="panel-rep-dashboard" role="tabpanel">
          <div id="dashboardContainer">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2 text-muted">Cargando dashboard...</p>
            </div>
          </div>
        </div>
        <div class="tab-pane fade" id="panel-rep-reportes" role="tabpanel">
          <div id="reportesContainer">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2 text-muted">Cargando reportes...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    if (typeof loadDashboardModule === "function") {
      try {
        await loadDashboardModule();
      } catch (e) {
        console.warn(e);
      }
    }
    if (typeof loadReportesModule === "function") {
      try {
        await loadReportesModule();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async loadConfiguracion(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="fas fa-cog me-2 text-dark"></i>Configuración</h4>
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
window.loadModule = (mod, tab) => window.app?.loadModule(mod, tab);