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
          <div id="alertaModalLista" style="white-space:pre-line;max-height:60vh;overflow-y:auto;"></div>
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

  // Resumen de una carga masiva: muestra QUÉ filas fallaron y por qué.
  // Antes solo decía "Revisa la consola", y el usuario no podía verlo.
  // Llamarlo DESPUÉS de cerrar el modal de la carga.
  function mostrarResumenCargaMasiva(accion, ok, fallidos, errores) {
    const lista = (errores || []).slice(0, 30);
    const resto = (errores || []).length - lista.length;
    let mensaje =
      `${ok} ${accion} correctamente y ${fallidos} con error.\n` +
      `Corrige estas filas en el Excel y vuelve a subir solo esas:\n\n` +
      lista.map((e) => `• ${e}`).join("\n");
    if (resto > 0) mensaje += `\n• ... y ${resto} filas más con error`;
    mostrarAlertaModal(mensaje, "warning");
  }

  window.mostrarResumenCargaMasiva = mostrarResumenCargaMasiva;

  // ==========================================================
  // Diálogos que reemplazan a confirm() y prompt() del navegador
  // (devuelven una Promesa, se usan con "await")
  // ==========================================================
  function _dialogo({ tituloTexto, iconoClase, cuerpoHtml, botones, alAbrir }) {
    return new Promise((resolve) => {
      const previoFoco = document.activeElement;
      const capa = document.createElement("div");
      capa.setAttribute("role", "dialog");
      capa.setAttribute("aria-modal", "true");
      capa.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2100;" +
        "display:flex;align-items:center;justify-content:center;padding:16px;";
      capa.innerHTML = `
        <div class="card shadow-lg" style="max-width:480px;width:100%;">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <i class="${iconoClase} fa-2x me-3"></i>
              <h5 class="mb-0">${escapar(tituloTexto)}</h5>
            </div>
            <div>${cuerpoHtml}</div>
            <div class="text-end mt-3 d-flex justify-content-end gap-2">
              ${botones
                .map(
                  (b, i) =>
                    `<button type="button" class="btn ${b.clase}" data-i="${i}">${escapar(b.texto)}</button>`,
                )
                .join("")}
            </div>
          </div>
        </div>
      `;
      const modales = document.querySelectorAll(".modal.show");
      (modales.length ? modales[modales.length - 1] : document.body).appendChild(capa);

      let terminado = false;
      const terminar = (valor) => {
        if (terminado) return;
        terminado = true;
        capa.remove();
        if (previoFoco && document.contains(previoFoco)) {
          try {
            previoFoco.focus();
          } catch (e) {}
        }
        resolve(valor);
      };

      capa.querySelectorAll("button[data-i]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const b = botones[Number(btn.dataset.i)];
          const valor = b.valor(capa);
          if (valor === undefined) return; // validación falló: no cerrar
          terminar(valor);
        });
      });
      capa.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          terminar(botones.find((b) => b.cancelar)?.valor(capa) ?? null);
        } else if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
          e.stopPropagation();
          capa.querySelector("button.btn-principal")?.click();
        }
      });
      setTimeout(() => {
        if (alAbrir) alAbrir(capa);
        else capa.querySelector("button.btn-principal")?.focus();
      }, 0);
    });
  }

  // await confirmarAccion("¿Seguro?") -> true / false
  function confirmarAccion(mensaje, opciones = {}) {
    const peligro = opciones.peligro !== false;
    return _dialogo({
      tituloTexto: opciones.titulo || "Confirmar",
      iconoClase: peligro
        ? "fas fa-exclamation-triangle text-warning"
        : "fas fa-question-circle text-primary",
      cuerpoHtml: `<div style="white-space:pre-line;">${escapar(mensaje)}</div>`,
      botones: [
        { texto: opciones.textoCancelar || "Cancelar", clase: "btn-secondary", cancelar: true, valor: () => false },
        {
          texto: opciones.textoAceptar || "Aceptar",
          clase: `${peligro ? "btn-danger" : "btn-primary"} btn-principal`,
          valor: () => true,
        },
      ],
    });
  }

  // await pedirTextoModal("Motivo", {obligatorio:true}) -> texto o null si cancela
  function pedirTextoModal(mensaje, opciones = {}) {
    return _dialogo({
      tituloTexto: opciones.titulo || "Ingresa la información",
      iconoClase: "fas fa-pen text-primary",
      cuerpoHtml: `
        <label class="form-label">${escapar(mensaje)}</label>
        <textarea class="form-control" rows="2" data-campo>${escapar(opciones.valor || "")}</textarea>
        <div class="invalid-feedback">Este dato es obligatorio</div>`,
      botones: [
        { texto: "Cancelar", clase: "btn-secondary", cancelar: true, valor: () => null },
        {
          texto: opciones.textoAceptar || "Aceptar",
          clase: "btn-primary btn-principal",
          valor: (capa) => {
            const campo = capa.querySelector("[data-campo]");
            const texto = campo.value.trim();
            if (opciones.obligatorio && !texto) {
              campo.classList.add("is-invalid");
              campo.focus();
              return undefined;
            }
            return texto;
          },
        },
      ],
      alAbrir: (capa) => capa.querySelector("[data-campo]")?.focus(),
    });
  }

  // await elegirOpcionModal("Nuevo estado", ["A","B"], "B") -> opción o null
  function elegirOpcionModal(mensaje, opcionesLista, valorInicial, opciones = {}) {
    return _dialogo({
      tituloTexto: opciones.titulo || "Elige una opción",
      iconoClase: "fas fa-list text-primary",
      cuerpoHtml: `
        <label class="form-label">${escapar(mensaje)}</label>
        <select class="form-select" data-campo>
          ${opcionesLista
            .map(
              (o) =>
                `<option value="${escapar(o)}" ${o === valorInicial ? "selected" : ""}>${escapar(o)}</option>`,
            )
            .join("")}
        </select>`,
      botones: [
        { texto: "Cancelar", clase: "btn-secondary", cancelar: true, valor: () => null },
        {
          texto: opciones.textoAceptar || "Aceptar",
          clase: "btn-primary btn-principal",
          valor: (capa) => capa.querySelector("[data-campo]").value,
        },
      ],
      alAbrir: (capa) => capa.querySelector("[data-campo]")?.focus(),
    });
  }

  window.confirmarAccion = confirmarAccion;
  window.pedirTextoModal = pedirTextoModal;
  window.elegirOpcionModal = elegirOpcionModal;

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

// ============================================================
// Comportamientos comunes de la interfaz (para todos los módulos)
// ============================================================
(function () {
  // ---------- 1. Un modal abierto encima de otro ----------
  // Bootstrap no apila modales: el segundo (ej. "Nuevo movimiento" desde el
  // Historial) quedaba DEBAJO del primero y no se veía hasta cerrarlo.
  // Cada modal nuevo se pone por encima de los que ya están abiertos.
  document.addEventListener("show.bs.modal", (e) => {
    const abiertos = document.querySelectorAll(".modal.show").length;
    if (abiertos === 0) return;
    const z = 1055 + abiertos * 20;
    e.target.style.zIndex = z;
    setTimeout(() => {
      const fondos = document.querySelectorAll(".modal-backdrop");
      const ultimo = fondos[fondos.length - 1];
      if (ultimo) ultimo.style.zIndex = z - 1;
    }, 0);
  });
  // Al cerrar el de arriba, el de abajo debe seguir pudiendo hacer scroll
  document.addEventListener("hidden.bs.modal", (e) => {
    e.target.style.zIndex = "";
    if (document.querySelectorAll(".modal.show").length > 0) {
      document.body.classList.add("modal-open");
    }
  });

  // ---------- 2. No regresar a la primera pestaña al guardar ----------
  // Varios módulos vuelven a dibujarse completos después de guardar o
  // eliminar algo, y quedaban en la primera pestaña. Se recuerdan las
  // pestañas abiertas y se vuelven a abrir. (Ventas y Compras ya lo hacían.)
  function capturarPestanas() {
    const cont = document.getElementById("mainContent");
    if (!cont) return [];
    return Array.from(
      cont.querySelectorAll(
        '[data-bs-toggle="tab"].active, [data-bs-toggle="pill"].active',
      ),
    )
      .map((el) =>
        el.id
          ? { id: el.id }
          : { href: el.getAttribute("href") || el.getAttribute("data-bs-target") },
      )
      .filter((p) => p.id || p.href);
  }

  function restaurarPestanas(lista) {
    if (!lista || !lista.length || typeof bootstrap === "undefined") return;
    const todas = Array.from(
      document.querySelectorAll(
        '#mainContent [data-bs-toggle="tab"], #mainContent [data-bs-toggle="pill"]',
      ),
    );
    lista.forEach((p) => {
      const el = p.id
        ? document.getElementById(p.id)
        : todas.find(
            (t) =>
              t.getAttribute("href") === p.href ||
              t.getAttribute("data-bs-target") === p.href,
          );
      if (el && !el.classList.contains("active")) {
        bootstrap.Tab.getOrCreateInstance(el).show();
      }
    });
  }

  window.capturarPestanasModulo = capturarPestanas;
  window.restaurarPestanasModulo = restaurarPestanas;

  [
    "loadConfiguracionModule",
    "loadUsuariosModule",
    "loadClientesModule",
    "loadReportesModule",
  ].forEach((nombre) => {
    const original = window[nombre];
    if (typeof original !== "function" || original.__conPestanas) return;
    const envuelta = async function (...args) {
      const previas = capturarPestanas();
      const resultado = await original.apply(this, args);
      restaurarPestanas(previas);
      return resultado;
    };
    envuelta.__conPestanas = true;
    window[nombre] = envuelta;
  });
})();
