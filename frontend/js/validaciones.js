
(function () {
  // Municipios por departamento (códigos 01 a 22 del DPI / CUI)
  const MUNICIPIOS_POR_DEPARTAMENTO = [
    17, 8, 16, 16, 14, 14, 19, 8, 24, 21, 9, 30, 33, 21, 8, 17, 14, 5, 11, 11, 7, 17,
  ];

  const REGEX_EMAIL = /^[^\s@]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

  function tipoDeCampo(el) {
    if (!el || el.tagName !== "INPUT" || !el.id) return null;
    if (/Telefono$/.test(el.id)) return "telefono";
    if (/Email$/.test(el.id)) return "email";
    if (/Dpi$/.test(el.id)) return "dpi";
    return null;
  }

  function soloDigitos(texto) {
    return String(texto || "").replace(/\D/g, "");
  }

  function formatearTelefono(texto) {
    const d = soloDigitos(texto).slice(0, 8);
    return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
  }

  function formatearDpi(texto) {
    const d = soloDigitos(texto).slice(0, 13);
    if (d.length > 9) return `${d.slice(0, 4)} ${d.slice(4, 9)} ${d.slice(9)}`;
    if (d.length > 4) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return d;
  }

  // Devuelve el mensaje de error, o "" si está bien
  function validarTelefono(valor) {
    const v = String(valor || "").trim();
    if (!v) return "";
    if (!/^\d{4}-\d{4}$/.test(v)) return "El teléfono debe tener 8 dígitos (ej. 1234-5678)";
    return "";
  }

  function validarEmail(valor) {
    const v = String(valor || "").trim();
    if (!v) return "";
    if (!REGEX_EMAIL.test(v)) {
      return "Correo no válido: debe llevar @ y terminar en .com, .live, .net, etc. (ej. nombre@gmail.com)";
    }
    return "";
  }

  function validarDpi(valor) {
    const v = String(valor || "").trim();
    if (!v) return "";
    const d = soloDigitos(v);
    if (d.length !== 13 || !/^[\d ]+$/.test(v)) {
      return "El DPI debe tener 13 dígitos (ej. 1234 56789 0101)";
    }
    const depto = parseInt(d.slice(9, 11), 10);
    const muni = parseInt(d.slice(11, 13), 10);
    if (depto < 1 || depto > 22) {
      return "DPI no válido: los dígitos del departamento no existen";
    }
    if (muni < 1 || muni > MUNICIPIOS_POR_DEPARTAMENTO[depto - 1]) {
      return "DPI no válido: los dígitos del municipio no existen";
    }
    return "";
  }

  function validarCampo(el) {
    switch (tipoDeCampo(el)) {
      case "telefono":
        return validarTelefono(el.value);
      case "email":
        return validarEmail(el.value);
      case "dpi":
        return validarDpi(el.value);
      default:
        return "";
    }
  }

  function mostrarError(el, mensaje) {
    let aviso = el.parentElement.querySelector(".validacion-formato");
    if (!mensaje) {
      el.classList.remove("is-invalid");
      if (aviso) aviso.remove();
      return;
    }
    el.classList.add("is-invalid");
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.className = "invalid-feedback d-block validacion-formato";
      el.insertAdjacentElement("afterend", aviso);
    }
    aviso.textContent = mensaje;
  }

  function prepararCampo(el) {
    if (el.dataset.validacionLista) return;
    el.dataset.validacionLista = "1";
    const tipo = tipoDeCampo(el);
    if (tipo === "telefono") {
      el.setAttribute("inputmode", "numeric");
      el.setAttribute("maxlength", "9");
      if (!el.placeholder) el.placeholder = "1234-5678";
    } else if (tipo === "dpi") {
      el.setAttribute("inputmode", "numeric");
      el.setAttribute("maxlength", "15");
      if (!el.placeholder) el.placeholder = "1234 56789 0101";
    } else if (tipo === "email") {
      if (!el.placeholder) el.placeholder = "nombre@gmail.com";
    }
  }

  // Al entrar al campo: le pone el placeholder y el largo máximo
  document.addEventListener("focusin", (e) => {
    if (tipoDeCampo(e.target)) prepararCampo(e.target);
  });

  // Mientras se escribe: pone el guion / los espacios solo
  document.addEventListener("input", (e) => {
    const el = e.target;
    const tipo = tipoDeCampo(el);
    if (tipo === "telefono") el.value = formatearTelefono(el.value);
    else if (tipo === "dpi") el.value = formatearDpi(el.value);
    if (tipo && el.classList.contains("is-invalid")) {
      mostrarError(el, validarCampo(el));
    }
  });

  // Al salir del campo: avisa si quedó mal escrito
  document.addEventListener("focusout", (e) => {
    const el = e.target;
    if (!tipoDeCampo(el)) return;
    if (tipoDeCampo(el) === "email") el.value = el.value.trim();
    mostrarError(el, validarCampo(el));
  });

  // Al guardar: si algo está mal, no se envía. Se escucha en "captura" para
  // correr ANTES que el onsubmit propio de cada formulario.
  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!form || !form.querySelectorAll) return;
      let primero = null;
      form.querySelectorAll("input[id]").forEach((el) => {
        if (!tipoDeCampo(el)) return;
        const tipo = tipoDeCampo(el);
        if (
          tipo === "dpi" &&
          el.dataset.valorOriginal &&
          soloDigitos(el.value) === soloDigitos(el.dataset.valorOriginal)
        ) {
          mostrarError(el, "");
          return; // DPI ya guardado y sin cambios: se deja como está
        }
        // Datos viejos sin guion (ej. 12345678): se acomodan antes de validar
        if (tipo === "telefono" && el.value) el.value = formatearTelefono(el.value);
        if (tipo === "dpi" && el.value) el.value = formatearDpi(el.value);
        if (tipo === "email") el.value = el.value.trim();
        const mensaje = validarCampo(el);
        mostrarError(el, mensaje);
        if (mensaje && !primero) primero = el;
      });
      if (primero) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        primero.focus();
        if (typeof showToast === "function") {
          showToast("Revisa los campos marcados en rojo", "warning");
        }
      }
    },
    true,
  );

  // Al abrir un formulario (modal) se quitan las marcas rojas de la vez anterior
  document.addEventListener("show.bs.modal", (e) => {
    if (!e.target || !e.target.querySelectorAll) return;
    e.target.querySelectorAll("input[id]").forEach((el) => {
      if (!tipoDeCampo(el)) return;
      mostrarError(el, "");
      // Valor con el que se abrió (para no exigir que se corrija un DPI viejo
      // que no se está cambiando)
      el.dataset.valorOriginal = el.value;
    });
  });

  // Por si algún módulo quiere usarlas directamente
  window.validaciones = {
    formatearTelefono,
    formatearDpi,
    validarTelefono,
    validarEmail,
    validarDpi,
  };
})();
