// components.js

// TOAST NOTIFICATIONS
function showToast(message, type = "success", duration = 4000) {
  // Eliminar toasts anteriores
  const oldToasts = document.querySelectorAll(".custom-toast");
  oldToasts.forEach((t) => t.remove());

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  const colors = {
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
  };

  const toast = document.createElement("div");
  toast.className = "custom-toast";
  toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        min-width: 300px;
        max-width: 500px;
        padding: 16px 20px;
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        background: ${colors[type] || colors.info};
        border-left: 6px solid ${darkenColor(colors[type] || colors.info, 20)};
        animation: slideInRight 0.4s ease;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    `;

  toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}" style="font-size: 20px;"></i>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.7;
            padding: 0 4px;
        ">&times;</button>
        <div style="
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            background: rgba(255,255,255,0.4);
            border-radius: 0 0 0 8px;
            width: 100%;
            animation: progressBar ${duration}ms linear forwards;
        "></div>
    `;

  document.body.appendChild(toast);

  // Auto-cerrar
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 400);
    }
  }, duration);

  // Agregar estilos de animación si no existen
  if (!document.getElementById("toastStyles")) {
    const style = document.createElement("style");
    style.id = "toastStyles";
    style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes progressBar {
                from { width: 100%; }
                to { width: 0%; }
            }
        `;
    document.head.appendChild(style);
  }
}

function darkenColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// VALIDACIONES VISUALES

function mostrarErrorCampo(idCampo, mensaje) {
  const campo = document.getElementById(idCampo);
  if (!campo) return;

  campo.classList.add("is-invalid");

  const errorDiv = document.getElementById(`${idCampo}Error`);
  if (errorDiv) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = "block";
  }
}

function limpiarErrorCampo(idCampo) {
  const campo = document.getElementById(idCampo);
  if (!campo) return;

  campo.classList.remove("is-invalid");
  campo.classList.remove("is-valid");

  const errorDiv = document.getElementById(`${idCampo}Error`);
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }
}

function limpiarErroresFormulario(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const inputs = form.querySelectorAll(".form-control, .form-select");
  inputs.forEach((input) => {
    input.classList.remove("is-invalid");
    input.classList.remove("is-valid");
    const errorDiv = document.getElementById(`${input.id}Error`);
    if (errorDiv) {
      errorDiv.textContent = "";
      errorDiv.style.display = "none";
    }
  });
}

function validarCampoNoVacio(idCampo, mensaje) {
  const campo = document.getElementById(idCampo);
  if (!campo) return false;

  const valor = campo.value.trim();
  if (!valor) {
    mostrarErrorCampo(idCampo, mensaje || "Este campo es obligatorio");
    return false;
  }

  limpiarErrorCampo(idCampo);
  return true;
}

function validarCampoNumerico(idCampo, mensaje) {
  const campo = document.getElementById(idCampo);
  if (!campo) return false;

  const valor = campo.value.trim();
  if (!valor) {
    limpiarErrorCampo(idCampo);
    return true; // Permitir vacío (si no es obligatorio)
  }

  const numero = parseFloat(valor);
  if (isNaN(numero) || numero < 0) {
    mostrarErrorCampo(idCampo, mensaje || "Debe ser un número válido");
    return false;
  }

  limpiarErrorCampo(idCampo);
  return true;
}

function validarCampoEmail(idCampo, mensaje) {
  const campo = document.getElementById(idCampo);
  if (!campo) return false;

  const valor = campo.value.trim();
  if (!valor) {
    limpiarErrorCampo(idCampo);
    return true; // Permitir vacío
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(valor)) {
    mostrarErrorCampo(idCampo, mensaje || "Ingrese un email válido");
    return false;
  }

  limpiarErrorCampo(idCampo);
  return true;
}

// MODAL DE CONFIRMACIÓN

function mostrarConfirmacion(titulo, mensaje, textoBoton = "Confirmar") {
  return new Promise((resolve) => {
    // Crear modal si no existe
    let modal = document.getElementById("confirmModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "confirmModal";
      modal.className = "modal fade";
      modal.tabIndex = "-1";
      modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="confirmModalTitle">Confirmar</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="confirmModalBody">
                            ¿Está seguro?
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="confirmModalCancel">Cancelar</button>
                            <button type="button" class="btn btn-danger" id="confirmModalConfirm">${textoBoton}</button>
                        </div>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    }

    // Actualizar contenido
    document.getElementById("confirmModalTitle").textContent =
      titulo || "Confirmar";
    document.getElementById("confirmModalBody").textContent =
      mensaje || "¿Está seguro de continuar?";
    document.getElementById("confirmModalConfirm").textContent = textoBoton;

    // Determinar color del botón
    const confirmBtn = document.getElementById("confirmModalConfirm");
    if (
      textoBoton.toLowerCase().includes("eliminar") ||
      textoBoton.toLowerCase().includes("anular")
    ) {
      confirmBtn.className = "btn btn-danger";
    } else if (textoBoton.toLowerCase().includes("cerrar")) {
      confirmBtn.className = "btn btn-warning";
    } else {
      confirmBtn.className = "btn btn-primary";
    }

    // Event listeners (una sola vez)
    const modalInstance = new bootstrap.Modal(modal);

    // Limpiar listeners anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const newCancelBtn = document
      .getElementById("confirmModalCancel")
      .cloneNode(true);
    document
      .getElementById("confirmModalCancel")
      .parentNode.replaceChild(
        newCancelBtn,
        document.getElementById("confirmModalCancel"),
      );

    let resolved = false;

    newConfirmBtn.addEventListener("click", function () {
      if (!resolved) {
        resolved = true;
        modalInstance.hide();
        resolve(true);
      }
    });

    newCancelBtn.addEventListener("click", function () {
      if (!resolved) {
        resolved = true;
        modalInstance.hide();
        resolve(false);
      }
    });

    modal.addEventListener("hidden.bs.modal", function () {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    modalInstance.show();
  });
}

// LOADING SPINNER

function mostrarLoading(containerId, mensaje = "Cargando...") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-muted">${mensaje}</p>
        </div>
    `;
}


/**
 * Oculta las pestañas de un módulo para las que el usuario logueado no
 * tenga el permiso correspondiente.
 *
 * @param {string} idContenedorTabs - id del <ul> que contiene las pestañas
 *   (ej. "usuariosTabs", "reportesTabs").
 * @param {Object} mapaPermisos - objeto { idTabPane: "NombrePermisoExacto" }.
 *   Ej: { rolesTab: "Tab:Usuarios:Roles", logsTab: "Tab:Usuarios:Bitacora" }
 * @param {Array|null} catalogoCompletoDePermisos - si se proporciona, una
 *   pestaña solo se controla cuando su permiso ya está registrado. El catálogo
 *   se registra desde el backend para que pueda asignarse a roles.
 */
function aplicarControlAccesoPorPestana(idContenedorTabs, mapaPermisos, catalogoCompletoDePermisos = null) {
  const nav = document.getElementById(idContenedorTabs);
  if (!nav) return;

  let misPermisosNombres = new Set();
  try {
    const misPermisos = JSON.parse(localStorage.getItem("user_permisos") || "[]");
    misPermisosNombres = new Set(
      misPermisos.map((permiso) => (permiso.nombre || "").toLowerCase()),
    );
  } catch (e) {
    console.warn("No se pudo leer user_permisos de localStorage:", e);
  }

  Object.entries(mapaPermisos).forEach(([idTabPane, nombrePermiso]) => {
    const permisoExisteEnCatalogo = catalogoCompletoDePermisos === null ||
      catalogoCompletoDePermisos.some(
        (permiso) => (permiso.nombre || "").toLowerCase() === nombrePermiso.toLowerCase(),
      );
    if (!permisoExisteEnCatalogo) return;

    const permisoAsignado = misPermisosNombres.has(nombrePermiso.toLowerCase());
    const disparador = Array.from(
      nav.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]'),
    ).find((elemento) =>
      elemento.getAttribute("href") === `#${idTabPane}` ||
      elemento.getAttribute("data-bs-target") === `#${idTabPane}`,
    );
    const elementoLista = disparador?.closest("li");
    const pane = document.getElementById(idTabPane);
    if (elementoLista) elementoLista.hidden = !permisoAsignado;
    if (pane) {
      pane.hidden = !permisoAsignado;
      if (!permisoAsignado) pane.classList.remove("show", "active");
    }
  });

  const disparadoresVisibles = Array.from(
    nav.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]'),
  ).filter((elemento) => !elemento.closest("li")?.hidden);
  const activaVisible = disparadoresVisibles.some((elemento) =>
    elemento.classList.contains("active"),
  );
  if (!activaVisible && disparadoresVisibles.length && window.bootstrap) {
    bootstrap.Tab.getOrCreateInstance(disparadoresVisibles[0]).show();
  }
}

const PERMISOS_PESTANAS_MODULOS = {
  ventas: {
    ventasSubTabs: {
      subVentas: "Tab:Ventas:Ventas",
      subClientes: "Tab:Ventas:Clientes",
      subServicios: "Tab:Ventas:Servicios",
      subCotizaciones: "Tab:Ventas:Cotizaciones",
      subCaja: "Tab:Ventas:Caja",
      subVendedores: "Tab:Ventas:Vendedores",
    },
    clienteFichaTabs: {
      "panel-ficha-ventas": "Tab:Ventas:FichaClienteVentas",
      "panel-ficha-servicios": "Tab:Ventas:FichaClienteServicios",
    },
  },
  compras: {
    comprasTabs: {
      "panel-compras": "Tab:Compras:Compras",
      "panel-proveedores": "Tab:Compras:Proveedores",
      "panel-caja-chica": "Tab:Compras:CajaChica",
      "panel-gastos": "Tab:Compras:Gastos",
      "panel-tipos-pago": "Tab:Compras:TiposPago",
    },
    proveedoresSubTabs: {
      "subpanel-proveedores": "Tab:Compras:ListaProveedores",
      "subpanel-tipos-proveedor": "Tab:Compras:TiposProveedor",
      "subpanel-pedidos": "Tab:Compras:Pedidos",
    },
    gastosSubTabs: {
      "subpanel-gastos": "Tab:Compras:ListaGastos",
      "subpanel-tipos-gasto": "Tab:Compras:TiposGasto",
    },
  },
  caja: {
    cajaTabs: {
      turnosTab: "Tab:Caja:Turnos",
      cajaChicaTab: "Tab:Caja:CajaChica",
      gastosTab: "Tab:Caja:Gastos",
      tiposTab: "Tab:Caja:Catalogos",
    },
  },
  inventario: {
    inventarioGrupoTabs: {
      "panel-grupo-catalogo": "Tab:Inventario:Catalogo",
      "panel-grupo-operaciones": "Tab:Inventario:Operaciones",
    },
    inventarioTabs: {
      "panel-inv-productos": "Tab:Inventario:Productos",
      "panel-inv-categorias": "Tab:Inventario:Categorias",
      "panel-inv-marcas": "Tab:Inventario:Marcas",
      "panel-inv-unidades": "Tab:Inventario:Unidades",
      "panel-inv-tipos": "Tab:Inventario:TiposMovimiento",
    },
    inventarioOpsTabs: {
      "panel-inv-resumen": "Tab:Inventario:Resumen",
      "panel-inv-conteo": "Tab:Inventario:ConteoFisico",
      "panel-inv-traslados": "Tab:Inventario:Traslados",
      "panel-inv-alertas": "Tab:Inventario:Alertas",
    },
  },
  reportes: {
    reportesTabs: {
      "panel-rep-dashboard": "Tab:Reportes:Dashboard",
      "panel-rep-reportes": "Tab:Reportes:Reportes",
    },
    reportesSubTabs: {
      reportesVentas: "Tab:Reportes:Ventas",
      reportesCompras: "Tab:Reportes:Compras",
      reportesInventario: "Tab:Reportes:Inventario",
      reportesUsuarios: "Tab:Reportes:Usuarios",
    },
    ventasSubTabs: {
      subVentasDiarias: "Tab:Reportes:VentasDiarias",
      subConciliacion: "Tab:Reportes:Conciliacion",
      subCuadreCaja: "Tab:Reportes:CuadreCaja",
      subUtilidad: "Tab:Reportes:Utilidad",
      subTopProductos: "Tab:Reportes:TopProductos",
    },
    comprasSubTabs: {
      subComprasResumen: "Tab:Reportes:ComprasResumen",
      subComprasProveedor: "Tab:Reportes:ComprasProveedor",
      subCuentasPagar: "Tab:Reportes:CuentasPagar",
    },
    inventarioSubTabs: {
      subStockBajo: "Tab:Reportes:StockBajo",
      subMovimientosResumen: "Tab:Reportes:Movimientos",
      subInventarioValorizado: "Tab:Reportes:InventarioValorizado",
    },
    usuariosSubTabs: {
      subLoginResumen: "Tab:Reportes:LoginResumen",
      subUsuariosActivos: "Tab:Reportes:UsuariosActivos",
      subBitacora: "Tab:Reportes:Bitacora",
      subCuentasActivas: "Tab:Reportes:CuentasActivas",
      subCuentasInactivas: "Tab:Reportes:CuentasInactivas",
      subUsuariosPorFecha: "Tab:Reportes:UsuariosPorFecha",
      subUsuariosBuscar: "Tab:Reportes:UsuariosBuscar",
    },
  },
  usuarios: {
    usuariosTabs: {
      usuariosTab: "Tab:Usuarios:Usuarios",
      empleadosTab: "Tab:Usuarios:Empleados",
      rolesTab: "Tab:Usuarios:Roles",
      pagosTab: "Tab:Usuarios:Pagos",
      catalogosTab: "Tab:Usuarios:Catalogos",
      logsTab: "Tab:Usuarios:Bitacora",
    },
  },
  configuracion: {
    configTabs: {
      generalTab: "Tab:Configuracion:General",
      ubicacionesTab: "Tab:Configuracion:Ubicaciones",
      metasTab: "Tab:Configuracion:Metas",
    },
  },
};

function aplicarPermisosPestanasModulo(modulo, raiz = document) {
  const grupos = PERMISOS_PESTANAS_MODULOS[(modulo || "").toLowerCase()];
  if (!grupos) return;
  Object.entries(grupos).forEach(([idNav, mapaPermisos]) => {
    const nav = document.getElementById(idNav);
    if (!nav || (raiz !== document && !raiz.contains(nav))) return;
    aplicarControlAccesoPorPestana(idNav, mapaPermisos);
  });
}

/**
 * Revisa si el usuario logueado tiene asignado el permiso "<accion>" del
 * módulo "<modulo>" (ej. tienePermiso("Productos", "Crear")).
 *
 * OJO: esto es SOLO para decidir qué mostrar en pantalla (ocultar/deshabilitar
 * botones) -- una comodidad visual, no la seguridad real. La seguridad de
 * verdad vive en el backend (la dependencia requiere_permiso() de
 * app/security.py), que rechaza la petición aunque alguien se salte estos
 * botones y llame al endpoint directo. Aquí solo evitamos mostrarle al
 * usuario una acción que de todos modos el servidor le va a rechazar.
 *
 * Las acciones se ocultan si el catálogo de permisos no se pudo cargar;
 * el backend mantiene la validación definitiva.
 */
// Caja no tiene permisos propios: usa los de Ventas
// (debe coincidir con ALIAS_PERMISOS en app/security.py).
const ALIAS_PERMISOS = { caja: "ventas" };

function moduloDePermiso(modulo) {
  const m = (modulo || "").toLowerCase();
  return ALIAS_PERMISOS[m] || m;
}

function tienePermiso(modulo, accion) {
  try {
    const misPermisos = JSON.parse(localStorage.getItem("user_permisos") || "[]");
    const moduloLower = moduloDePermiso(modulo);
    const accionLower = (accion || "").toLowerCase();
    // Comparacion sin distinguir mayusculas/minusculas: en la base de
    // datos los nombres vienen en minuscula ("ver", "crear", ...).
    return misPermisos.some(
      (p) =>
        (p.modulo_nombre || "").toLowerCase() === moduloLower &&
        (p.nombre || "").toLowerCase() === accionLower,
    );
  } catch (e) {
    console.warn("No se pudo leer user_permisos de localStorage:", e);
    return false;
  }
}

// EXPONER FUNCIONES GLOBALES

window.showToast = showToast;
window.moduloDePermiso = moduloDePermiso;
window.mostrarErrorCampo = mostrarErrorCampo;
window.limpiarErrorCampo = limpiarErrorCampo;
window.limpiarErroresFormulario = limpiarErroresFormulario;
window.validarCampoNoVacio = validarCampoNoVacio;
window.validarCampoNumerico = validarCampoNumerico;
window.validarCampoEmail = validarCampoEmail;
window.mostrarConfirmacion = mostrarConfirmacion;
window.mostrarLoading = mostrarLoading;
window.aplicarControlAccesoPorPestana = aplicarControlAccesoPorPestana;
window.aplicarPermisosPestanasModulo = aplicarPermisosPestanasModulo;
window.tienePermiso = tienePermiso;


// ============================================================
// IMPRIMIR SIN SALIR DEL SISTEMA
// Antes cada impresión abría una pestaña/ventana en blanco con el reporte
// y no había cómo regresar al sistema (solo con las flechas del navegador).
// Ahora el documento se imprime desde un marco oculto dentro de la misma
// página: sale el diálogo de impresión (o "Guardar como PDF") y al
// cerrarlo el usuario sigue donde estaba.
// ============================================================
function imprimirDocumentoHtml(html) {
  document.getElementById("marcoImpresion")?.remove();
  const marco = document.createElement("iframe");
  marco.id = "marcoImpresion";
  marco.setAttribute("aria-hidden", "true");
  Object.assign(marco.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(marco);

  const quitar = () => setTimeout(() => marco.remove(), 500);
  let impreso = false;
  const imprimir = () => {
    if (impreso) return;
    impreso = true;
    try {
      marco.contentWindow.onafterprint = quitar;
      marco.contentWindow.focus();
      marco.contentWindow.print();
    } catch (e) {
      console.error("No se pudo imprimir:", e);
      if (typeof showToast === "function") showToast("No se pudo abrir la impresión", "error");
    }
    // por si el navegador no avisa cuando se cierra el diálogo
    setTimeout(() => marco.remove(), 120000);
  };

  marco.onload = () => setTimeout(imprimir, 300);
  const doc = marco.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  // algunos navegadores no disparan onload con document.write
  setTimeout(imprimir, 1200);
}
window.imprimirDocumentoHtml = imprimirDocumentoHtml;
