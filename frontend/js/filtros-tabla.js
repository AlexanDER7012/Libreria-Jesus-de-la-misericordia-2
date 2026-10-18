// ============================================================
// BARRA DE FILTROS COMÚN (búsqueda + filtros + rango de fechas)
// Se usa en las tablas que filtran en el navegador. Si la barra se vuelve
// a dibujar, conserva lo que el usuario ya había escrito o elegido.
//
//   htmlBarraFiltros({
//     id: "gastos",                       // prefijo de los ids
//     placeholder: "Buscar por concepto...",
//     selects: [{ id: "Tipo", label: "Todos los tipos", opciones: [["1", "Luz"]] }],
//     fechas: true,
//     onChange: "filtrarGastos()",       // se llama al cambiar cualquier filtro
//   })
//   leerBarraFiltros("gastos") -> { texto, desde, hasta, Tipo: "1" }
// ============================================================

function _valorPrevioFiltro(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function _escFiltro(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlBarraFiltros(cfg) {
  const id = cfg.id;
  const onChange = cfg.onChange || "";
  const textoPrevio = _valorPrevioFiltro(`${id}Buscar`);
  const desdePrevio = _valorPrevioFiltro(`${id}Desde`);
  const hastaPrevio = _valorPrevioFiltro(`${id}Hasta`);

  const selects = (cfg.selects || [])
    .map((s) => {
      const previo = _valorPrevioFiltro(`${id}${s.id}`);
      const opciones = (s.opciones || [])
        .map(([valor, texto]) => {
          const sel = String(valor) === String(previo) ? "selected" : "";
          return `<option value="${_escFiltro(valor)}" ${sel}>${_escFiltro(texto)}</option>`;
        })
        .join("");
      return `
        <div class="col-md-2 col-6">
          <select class="form-select form-select-sm" id="${id}${s.id}" onchange="${onChange}" title="${_escFiltro(s.label)}">
            <option value="">${_escFiltro(s.label)}</option>
            ${opciones}
          </select>
        </div>`;
    })
    .join("");

  const fechas = cfg.fechas
    ? `
        <div class="col-md-2 col-6">
          <div class="input-group input-group-sm">
            <span class="input-group-text">Desde</span>
            <input type="date" class="form-control" id="${id}Desde" value="${desdePrevio}" onchange="${onChange}">
          </div>
        </div>
        <div class="col-md-2 col-6">
          <div class="input-group input-group-sm">
            <span class="input-group-text">Hasta</span>
            <input type="date" class="form-control" id="${id}Hasta" value="${hastaPrevio}" onchange="${onChange}">
          </div>
        </div>`
    : "";

  return `
    <div class="row g-2 mb-3 align-items-center barra-filtros" id="${id}BarraFiltros">
      <div class="col-md-3 col-12">
        <div class="input-group input-group-sm">
          <span class="input-group-text"><i class="fas fa-search"></i></span>
          <input type="text" class="form-control" id="${id}Buscar"
                 placeholder="${_escFiltro(cfg.placeholder || "Buscar...")}"
                 value="${_escFiltro(textoPrevio)}"
                 oninput="clearTimeout(window.__tFiltro_${id}); window.__tFiltro_${id} = setTimeout(() => { ${onChange} }, 300)">
        </div>
      </div>
      ${selects}
      ${fechas}
      <div class="col-auto">
        <button class="btn btn-sm btn-outline-danger" title="Limpiar filtros"
                onclick="limpiarBarraFiltros('${id}'); ${onChange}">
          <i class="fas fa-times me-1"></i>Limpiar
        </button>
      </div>
      ${cfg.extraHtml ? `<div class="col text-end">${cfg.extraHtml}</div>` : ""}
    </div>`;
}

function leerBarraFiltros(id) {
  const datos = {
    texto: (_valorPrevioFiltro(`${id}Buscar`) || "").trim().toLowerCase(),
    desde: _valorPrevioFiltro(`${id}Desde`),
    hasta: _valorPrevioFiltro(`${id}Hasta`),
  };
  document
    .querySelectorAll(`#${id}BarraFiltros select`)
    .forEach((s) => {
      datos[s.id.slice(id.length)] = s.value;
    });
  return datos;
}

function limpiarBarraFiltros(id) {
  document
    .querySelectorAll(`#${id}BarraFiltros input, #${id}BarraFiltros select`)
    .forEach((el) => {
      el.value = "";
    });
}

// Fecha (texto del servidor) -> "AAAA-MM-DD" en la hora que se muestra en pantalla
function fechaLocalFiltro(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d)) return String(fecha).slice(0, 10);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ¿La fecha cae dentro del rango? (sin rango -> siempre sí; sin fecha -> no, si hay rango)
function coincideFechaFiltro(fecha, desde, hasta) {
  if (!desde && !hasta) return true;
  const f = fechaLocalFiltro(fecha);
  if (!f) return false;
  if (desde && f < desde) return false;
  if (hasta && f > hasta) return false;
  return true;
}

// ¿Algún campo contiene el texto buscado? (sin distinguir mayúsculas ni tildes)
function _normalizarFiltro(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function coincideTextoFiltro(texto, ...campos) {
  if (!texto) return true;
  const buscado = _normalizarFiltro(texto);
  return campos.some((c) => _normalizarFiltro(c).includes(buscado));
}

// Rango de fechas al revés (desde > hasta): avisa y no filtra
function rangoFechasValidoFiltro(desde, hasta) {
  if (desde && hasta && desde > hasta) {
    if (typeof showToast === "function") {
      showToast("La fecha 'Desde' no puede ser mayor que 'Hasta'", "warning");
    }
    return false;
  }
  return true;
}

// Llena (o vuelve a llenar) las opciones de un filtro de la barra cuando
// los datos llegan después de dibujarla. Conserva lo que estaba elegido.
function llenarOpcionesFiltro(selectId, opciones) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const previo = select.value;
  const primera = select.options[0] ? select.options[0].outerHTML : '<option value="">Todos</option>';
  select.innerHTML =
    primera +
    (opciones || [])
      .map(([valor, texto]) => `<option value="${_escFiltro(valor)}">${_escFiltro(texto)}</option>`)
      .join("");
  if ([...select.options].some((o) => o.value === previo)) select.value = previo;
}

// Opciones de ubicaciones para los filtros
function opcionesUbicacionesFiltro() {
  return (window.ubicacionesData || []).map((u) => [u.id, u.nombre || `Ubicación ${u.id}`]);
}
