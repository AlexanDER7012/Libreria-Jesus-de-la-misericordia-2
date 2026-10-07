    // alertas.js
// ============================================================
// Recuadro de aviso para errores y advertencias.
// Los mensajes de error/advertencia (showToast(..., "error"|"warning"))
// dejan de salir unos segundos en la esquina: ahora aparece un recuadro
// en el centro que se queda hasta que el usuario presiona "Ok".
// Los mensajes de éxito siguen saliendo como antes.
//
// IMPORTANTE: este archivo debe cargarse DESPUÉS de todos los demás .js
// en index.html, para envolver la versión final de showToast.
// ============================================================
(function () {
  let overlay = null;
  let lista = null;
  let titulo = null;
  let icono = null;
  let focoAnterior = null;

  function escapar(texto) {
    return String(texto ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function esPermiso(mensaje) {
    return /no tienes permiso/i.test(String(mensaje || ""));
  }

  function cerrar() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    lista = null;
    if (focoAnterior && document.contains(focoAnterior)) {
      try {
        focoAnterior.focus();
      } catch (e) {}
    }
    focoAnterior = null;
  }

  function crear(tipo) {
    focoAnterior = document.activeElement;
    overlay = document.createElement("div");
    overlay.id = "alertaModalOverlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2100;" +
      "display:flex;align-items:center;justify-content:center;padding:16px;";
    overlay.innerHTML = `
      <div class="card shadow-lg" style="max-width:480px;width:100%;">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <i id="alertaModalIcono" class="fas fa-2x me-3"></i>
            <h5 class="mb-0" id="alertaModalTitulo"></h5>
          </div>
          <div id="alertaModalLista" style="white-space:pre-line;"></div>
          <div class="text-end mt-3">
            <button type="button" class="btn btn-primary px-4" id="alertaModalOk">Ok</button>
          </div>
        </div>
      </div>
    `;

    // Si hay un modal de Bootstrap abierto, el recuadro va DENTRO de él;
    // si no, Bootstrap no deja poner el foco en el botón "Ok".
    const modales = document.querySelectorAll(".modal.show");
    const destino = modales.length ? modales[modales.length - 1] : document.body;
    destino.appendChild(overlay);

    lista = overlay.querySelector("#alertaModalLista");
    titulo = overlay.querySelector("#alertaModalTitulo");
    icono = overlay.querySelector("#alertaModalIcono");

    const boton = overlay.querySelector("#alertaModalOk");
    boton.addEventListener("click", cerrar);
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        cerrar();
      }
    });
    setTimeout(() => boton.focus(), 0);
  }

  function actualizarEncabezado(tipo, mensaje) {
    if (esPermiso(mensaje)) {
      titulo.textContent = "Sin permiso";
      icono.className = "fas fa-lock fa-2x me-3 text-danger";
    } else if (tipo === "warning") {
      // Si ya había un error en el recuadro, se mantiene el encabezado de error
      if (!titulo.textContent) {
        titulo.textContent = "Atención";
        icono.className = "fas fa-exclamation-triangle fa-2x me-3 text-warning";
      }
    } else if (titulo.textContent !== "Sin permiso") {
      titulo.textContent = "No se pudo completar la acción";
      icono.className = "fas fa-times-circle fa-2x me-3 text-danger";
    }
  }

  function mostrarAlertaModal(mensaje, tipo = "error") {
    if (!overlay) crear(tipo);
    actualizarEncabezado(tipo, mensaje);

    let texto = escapar(mensaje);
    if (esPermiso(mensaje)) {
      texto +=
        '<div class="small text-muted mt-1">Pide a un administrador que te asigne este permiso.</div>';
    }
    // Si llegan varios mensajes seguidos, se juntan en el mismo recuadro
    const bloque = document.createElement("div");
    bloque.className = lista.children.length ? "border-top pt-2 mt-2" : "";
    bloque.innerHTML = texto;
    lista.appendChild(bloque);
  }

  window.mostrarAlertaModal = mostrarAlertaModal;

  const showToastOriginal = window.showToast;
  window.showToast = function (mensaje, tipo = "success", ...resto) {
    if (tipo === "error" || tipo === "danger" || tipo === "warning") {
      mostrarAlertaModal(mensaje, tipo === "warning" ? "warning" : "error");
      return;
    }
    if (typeof showToastOriginal === "function") {
      return showToastOriginal.call(this, mensaje, tipo, ...resto);
    }
  };
})();