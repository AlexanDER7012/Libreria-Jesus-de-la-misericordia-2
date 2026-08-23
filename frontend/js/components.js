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

// EXPONER FUNCIONES GLOBALES

window.showToast = showToast;
window.mostrarErrorCampo = mostrarErrorCampo;
window.limpiarErrorCampo = limpiarErrorCampo;
window.limpiarErroresFormulario = limpiarErroresFormulario;
window.validarCampoNoVacio = validarCampoNoVacio;
window.validarCampoNumerico = validarCampoNumerico;
window.validarCampoEmail = validarCampoEmail;
window.mostrarConfirmacion = mostrarConfirmacion;
window.mostrarLoading = mostrarLoading;
