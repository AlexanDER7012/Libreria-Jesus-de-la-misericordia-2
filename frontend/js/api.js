// api.js
const PUERTOS_LIVE_SERVER = ["5500", "5501", "3000"];
const API_BASE_URL =
  window.location.protocol === "file:" || PUERTOS_LIVE_SERVER.includes(window.location.port)
    ? "http://localhost:8000"
    : window.location.origin;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem("token");
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u && u.id == null && u.usuario_id != null) {
        u.id = u.usuario_id;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (e) {}
  }

  // MÉTODO PRINCIPAL
  async request(endpoint, method = "GET", data = null, requiresAuth = true) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
    };

    this.token = localStorage.getItem("token") || this.token;
    if (requiresAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    // Autorización de administrador (ver verificarAdmin): se manda solo en la
    // siguiente acción que cambia datos y luego se descarta.
    if (this._autorizacionAdmin && method !== "GET") {
      headers["X-Autorizacion-Admin"] = this._autorizacionAdmin;
      this._autorizacionAdmin = null;
    }

    const config = { method, headers };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !requiresAuth) {
        const datos = await response.json().catch(() => ({}));
        throw new Error(
          (typeof datos.detail === "string" && datos.detail) || "Usuario o contraseña incorrectos",
        );
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_permisos");
        if (window.showToast) {
          window.showToast(
            "Tu sesión expiró. Vas a ser redirigido al inicio de sesión.",
            "warning",
            3000,
          );
          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        } else {
          window.location.href = "login.html";
        }
        throw new Error("Sesión expirada");
      }

      if (response.status === 204) {
        return null;
      }

      // Si el servidor falla (error 500) responde con texto, no con JSON.
      // Antes eso salía como "Unexpected token 'I'... is not valid JSON".
      const textoRespuesta = await response.text();
      let responseData = {};
      try {
        responseData = textoRespuesta ? JSON.parse(textoRespuesta) : {};
      } catch (e) {
        if (!response.ok) {
          throw new Error(
            response.status >= 500
              ? "Ocurrió un error en el servidor. Revisa la consola donde corre el sistema (uvicorn) para ver el detalle."
              : `Error en la petición (${response.status})`,
          );
        }
        throw new Error("El servidor respondió algo inesperado");
      }

      if (!response.ok) {
        let mensaje = "Error en la petición";
        if (responseData.detail) {
          if (typeof responseData.detail === "string") {
            mensaje = responseData.detail;
          } else if (Array.isArray(responseData.detail)) {
            mensaje = responseData.detail
              .map((e) => (e.msg || "").replace(/^Value error,\s*/, ""))
              .join(" | ");
          }
        }
        throw new Error(mensaje);
      }

      return responseData;
    } catch (error) {
      console.error("Error en API request:", error);
      throw error;
    }
  }

  // =============================================
  // AUTENTICACIÓN
  // =============================================

  async login(nombre_usuario, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_usuario, password }),
    });

    // Si la página se abrió con Live Server (puerto 5500) u otro programa, ahí
    // no está el sistema y antes salía "Usuario o contraseña incorrectos".
    if (response.status === 404 || response.status === 405) {
      throw new Error(
        "No se encontró el servidor del sistema. Revisa que uvicorn esté corriendo y abre http://localhost:8000/login.html.",
      );
    }
    // Antes, si el servidor fallaba, salía "Unexpected token 'I'... is not valid JSON"
    const texto = await response.text();
    let data = {};
    try {
      data = texto ? JSON.parse(texto) : {};
    } catch (e) {
      throw new Error(
        response.status >= 500
          ? "Ocurrió un error en el servidor. Intenta de nuevo en un momento."
          : "No se pudo iniciar sesión. Intenta de nuevo.",
      );
    }
    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string" ? data.detail : "Usuario o contraseña incorrectos",
      );
    }

    this.token = data.access_token;
    localStorage.setItem("token", data.access_token);
    // "id" = id del usuario (el resto del sistema usa getCurrentUser().id)
    localStorage.setItem(
      "user",
      JSON.stringify({ ...data, id: data.usuario_id }),
    );

    //  Cargar permisos del usuario
    try {
      const permisos = await this.request("/usuarios/mis-permisos");
      localStorage.setItem("user_permisos", JSON.stringify(permisos));
      console.log("✅ Permisos cargados:", permisos);
    } catch (e) {
      console.warn("No se pudieron cargar permisos:", e);
      localStorage.setItem("user_permisos", JSON.stringify([]));
      if (window.showToast) {
        window.showToast(
          "No se pudieron cargar tus permisos. Cierra sesión e inténtalo de nuevo.",
          "error",
          6000,
        );
      }
    }

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_permisos");
    window.location.href = "login.html";
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Obtener permisos del usuario actual
  async getMisPermisos() {
    return this.request("/usuarios/mis-permisos");
  }

  // Renovar el token mientras el usuario sigue activo (sin pedir contraseña)
  async renovarToken() {
    try {
      this.token = localStorage.getItem("token") || this.token;
      const response = await fetch(`${API_BASE_URL}/login/renovar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (!response.ok) return false;
      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem("token", data.access_token);
      // Actualizamos también los datos guardados de "user" por si acaso
      const userActual = this.getUser();
      if (userActual) {
        localStorage.setItem(
          "user",
          JSON.stringify({ ...userActual, access_token: data.access_token }),
        );
      }
      return true;
    } catch (e) {
      console.error("Error renovando token:", e);
      return false;
    }
  }

  // =============================================
  // CLIENTES
  // =============================================

  async getClientes() {
    return this.request("/clientes");
  }

  async getCliente(id) {
    return this.request(`/clientes/${id}`);
  }

  async createCliente(data) {
    return this.request("/clientes", "POST", data);
  }

  async updateCliente(id, data) {
    return this.request(`/clientes/${id}`, "PUT", data);
  }

  async deleteCliente(id) {
    return this.request(`/clientes/${id}`, "DELETE");
  }

  // =============================================
  // PRODUCTOS
  // =============================================

  async getProductos() {
    return this.request("/productos");
  }

  async getProducto(id) {
    return this.request(`/productos/${id}`);
  }

  async createProducto(data) {
    return this.request("/productos", "POST", data);
  }

  async updateProducto(id, data) {
    return this.request(`/productos/${id}`, "PUT", data);
  }

  async deleteProducto(id) {
    return this.request(`/productos/${id}`, "DELETE");
  }

  // =============================================
  // CATEGORÍAS
  // =============================================

  async getCategorias() {
    return this.request("/categorias");
  }

  async createCategoria(data) {
    return this.request("/categorias", "POST", data);
  }

  // =============================================
  // MARCAS
  // =============================================

  async getMarcas() {
    return this.request("/marcas");
  }

  async createMarca(data) {
    return this.request("/marcas", "POST", data);
  }

  // =============================================
  // UNIDADES DE MEDIDA
  // =============================================

  async getUnidadesMedida() {
    return this.request("/unidades-medida");
  }

  // =============================================
  // VENTAS
  // =============================================

  async getVentas() {
    return this.request("/ventas");
  }

  async getVenta(id) {
    return this.request(`/ventas/${id}`);
  }

  async createVenta(data) {
    return this.request("/ventas", "POST", data);
  }

  async getServiciosAdicionales() {
    return this.request("/servicios-adicionales");
  }

  async createServicioAdicional(data) {
    return this.request("/servicios-adicionales", "POST", data);
  }

  // =============================================
  // CAJA
  // =============================================

  async getCajaTurnos() {
    return this.request("/caja-turno");
  }

  async createCajaTurno(data) {
    return this.request("/caja-turno/abrir", "POST", data);
  }

  async getCajaChica() {
    return this.request("/caja-chica");
  }

  async getGastos() {
    return this.request("/gastos");
  }

  async getTiposGasto() {
    return this.request("/tipos-gasto");
  }

  async getTiposPago() {
    return this.request("/tipos-pago");
  }

  // =============================================
  // COMPRAS
  // =============================================

  async getCompras() {
    return this.request("/compras");
  }

  async createCompra(data) {
    return this.request("/compras", "POST", data);
  }

  async getDevolucionesCompra() {
    return this.request("/devoluciones-compra");
  }

  // =============================================
  // PROVEEDORES
  // =============================================

  async getProveedores() {
    return this.request("/proveedores");
  }

  async createProveedor(data) {
    return this.request("/proveedores", "POST", data);
  }

  async getTiposProveedor() {
    return this.request("/tipos-proveedor");
  }

  async getPedidos() {
    return this.request("/pedidos");
  }

  // =============================================
  // INVENTARIO
  // =============================================

  async getMovimientosInventario() {
    return this.request("/movimientos-inventario");
  }

  async createMovimientoInventario(data) {
    return this.request("/movimientos-inventario", "POST", data);
  }

  async getTiposMovimiento() {
    return this.request("/tipos-movimiento");
  }

  async getInventarioFisico() {
    return this.request("/inventario-fisico");
  }

  async getTraslados() {
    return this.request("/traslados");
  }

  async getAlertasStock() {
    return this.request("/alertas");
  }

  // =============================================
  // USUARIOS
  // =============================================

  async getUsuarios() {
    return this.request("/usuarios");
  }

  async getEmpleados() {
    return this.request("/empleados");
  }

  async getRoles() {
    return this.request("/roles");
  }

  async getPuestos() {
    return this.request("/puestos");
  }

  async getTurnos() {
    return this.request("/turnos");
  }

  async getModulos() {
    return this.request("/modulos");
  }

  async getPermisos() {
    return this.request("/permisos");
  }

  // =============================================
  // CONFIGURACIÓN
  // =============================================

  async getConfiguracion() {
    return this.request("/configuracion");
  }

  async updateConfiguracion(data) {
    return this.request("/configuracion", "PUT", data);
  }

  async getMetasFinancieras() {
    return this.request("/metas-financieras");
  }

  async verificarAdmin(nombre_usuario, password) {
    const r = await this.request(
      "/login/verificar-admin",
      "POST",
      { nombre_usuario, password },
      false,
    );
    // El servidor exige esta autorización en la acción que sigue
    this._autorizacionAdmin = (r && r.token_autorizacion) || null;
    return r;
  }
}

// Instancia global
const api = new ApiClient();
window.api = api;
