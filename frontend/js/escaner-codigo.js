function _escElemento(ref) {
  if (!ref) return null;
  return typeof ref === "string" ? document.getElementById(ref) : ref;
}

function escaparHtmlEscaner(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mostrarAvisoEscaner(info, tipo, texto) {
  const el = _escElemento(info);
  if (!el) return;
  const clases = { ok: "text-success", error: "text-danger", aviso: "text-warning" };
  const iconos = {
    ok: "fa-check-circle",
    error: "fa-times-circle",
    aviso: "fa-exclamation-triangle",
  };
  el.innerHTML = `<span class="${clases[tipo] || "text-muted"}"><i class="fas ${
    iconos[tipo] || "fa-info-circle"
  } me-1"></i>${escaparHtmlEscaner(texto)}</span>`;
}

// Busca un producto por su código exacto. Devuelve el producto o lanza Error.
async function buscarProductoPorCodigo(codigo) {
  const limpio = String(codigo || "").trim();
  if (!limpio) throw new Error("Código vacío");

  const local = (window.productosData || []).find(
    (p) => String(p.codigo || "").trim() === limpio,
  );
  if (local) return local;

  // No está en la lista cargada (por ejemplo, por el límite de 50 productos)
  const remoto = await api.request(
    `/productos/buscar-codigo/${encodeURIComponent(limpio)}`,
  );
  if (!remoto) throw new Error("No existe ningún producto con ese código");

  window.productosData = window.productosData || [];
  if (!window.productosData.some((p) => p.id === remoto.id)) {
    window.productosData.push(remoto);
  }
  return remoto;
}

function crearEscanerCodigo(config) {
  const input = _escElemento(config.input);
  if (!input) return null;

  // Evita registrar dos veces el mismo campo (modales que se reutilizan)
  if (input._escaner) return input._escaner;

  const info = config.info;
  let cola = Promise.resolve();

  async function procesar(codigo) {
    let producto;
    try {
      producto = await buscarProductoPorCodigo(codigo);
    } catch (error) {
      mostrarAvisoEscaner(
        info,
        "error",
        `${error.message || "Producto no encontrado"}: ${codigo}`,
      );
      return;
    }

    if (!config.permitirInactivos && producto.activo === 0) {
      mostrarAvisoEscaner(info, "aviso", `${producto.nombre} está inactivo`);
      return;
    }

    try {
      const resultado = (await config.onProducto(producto)) || {};
      if (resultado.texto) {
        mostrarAvisoEscaner(info, resultado.tipo || "ok", resultado.texto);
      }
    } catch (error) {
      console.error("Error procesando producto escaneado:", error);
      mostrarAvisoEscaner(info, "error", error.message || "Error al procesar el código");
    }
  }

  input.setAttribute("autocomplete", "off");
  input.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    // Sin esto, el Enter del lector enviaría el formulario
    event.preventDefault();
    const codigo = (input.value || "").trim();
    input.value = "";
    if (!codigo) return;
    // En cola: si se escanean varios seguidos, se procesan en orden
    cola = cola.then(() => procesar(codigo));
  });

  const api_ = {
    procesar: (codigo) => (cola = cola.then(() => procesar(codigo))),
    enfocar: () => input.focus(),
    limpiarAviso: () => {
      const el = _escElemento(info);
      if (el) el.innerHTML = "";
    },
  };
  input._escaner = api_;
  return api_;
}

// Inserta en un <select> de productos la opción de un producto que no estaba
// en la lista (por ejemplo, uno que se trajo del servidor al escanear).
function asegurarOpcionProducto(select, producto, etiqueta) {
  const el = _escElemento(select);
  if (!el || !producto) return;
  const existe = Array.from(el.options).some(
    (o) => String(o.value) === String(producto.id),
  );
  if (!existe) {
    const opcion = document.createElement("option");
    opcion.value = producto.id;
    opcion.textContent =
      etiqueta || `${producto.codigo || ""} - ${producto.nombre}`;
    el.appendChild(opcion);
  }
}

window.crearEscanerCodigo = crearEscanerCodigo;
window.buscarProductoPorCodigo = buscarProductoPorCodigo;
window.mostrarAvisoEscaner = mostrarAvisoEscaner;
window.escaparHtmlEscaner = escaparHtmlEscaner;
window.asegurarOpcionProducto = asegurarOpcionProducto;