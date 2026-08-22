const API_BASE_URL = "http://localhost:8000";

class ApiClient {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  // MÉTODO PRINCIPAL
  async request(endpoint, method = "GET", data = null, requiresAuth = true) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
    };

    if (requiresAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const config = { method, headers };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login.html";
        throw new Error("Sesión expirada");
      }

      if (response.status === 204) {
        return null;
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || "Error en la petición");
      }

      return responseData;
    } catch (error) {
      console.error("Error en API request:", error);
      throw error;
    }
  }

  // AUTENTICACIÓN
  async login(nombre_usuario, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_usuario, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Credenciales incorrectas");
    }

    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem("token", data.access_token);

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // CLIENTES
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

  // PRODUCTOS
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

  // Categorías
  async getCategorias() {
    return this.request("/categorias");
  }

  async createCategoria(data) {
    return this.request("/categorias", "POST", data);
  }

  // Marcas
  async getMarcas() {
    return this.request("/marcas");
  }

  async createMarca(data) {
    return this.request("/marcas", "POST", data);
  }

  // Unidades de medida
  async getUnidadesMedida() {
    return this.request("/unidades-medida");
  }

  // VENTAS
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

  // CAJA
  async getCajaTurnos() {
    return this.request("/caja-turno");
  }

  async createCajaTurno(data) {
    return this.request("/caja-turno", "POST", data);
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

  // COMPRAS
  async getCompras() {
    return this.request("/compras");
  }

  async createCompra(data) {
    return this.request("/compras", "POST", data);
  }

  async getDevolucionesCompra() {
    return this.request("/devoluciones-compra");
  }

  // Proveedores
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

  // INVENTARIO
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

  // USUARIOS
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

  // CONFIGURACIÓN
  async getConfiguracion() {
    return this.request("/configuracion");
  }

  async updateConfiguracion(data) {
    return this.request("/configuracion", "PUT", data);
  }

  async getMetasFinancieras() {
    return this.request("/metas-financieras");
  }
}

// Instancia global
const api = new ApiClient();
window.api = api;
