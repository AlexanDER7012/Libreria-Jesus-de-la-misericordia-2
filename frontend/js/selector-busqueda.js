// selector-busqueda.js
// Utilidad genérica (vanilla JS, sin librerías externas) para sustituir un
// <select> con muchas opciones por una barra de búsqueda + lista desplegable
// filtrada. Se usa, por ejemplo, para elegir Cliente en Ventas o Proveedor
// en Compras sin mostrar una lista desplegable con cientos de opciones.
//
// Uso:
//   const selector = crearSelectorBusqueda({
//     wrapperId: "miContenedor",      // div vacío donde se inyecta el widget
//     hiddenInputId: "miCampoId",     // input hidden con el id seleccionado
//     searchInputId: "miCampoTexto",  // input de texto visible (búsqueda)
//     dropdownId: "miLista",          // ul con los resultados
//     getData: () => window.datos || [],
//     getId: (item) => item.id,
//     getLabel: (item) => item.nombre,
//     placeholder: "Buscar...",
//   });
//
// El input hidden conserva el mismo id que el <select> original, así que el
// resto del código que hace document.getElementById(id).value sigue
// funcionando sin cambios.

function crearSelectorBusqueda(config) {
  const {
    wrapperId,
    hiddenInputId,
    searchInputId,
    dropdownId,
    getData,
    getLabel,
    getId,
    placeholder,
    maxResultados,
    small,
    onSelect,
  } = config;

  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return null;

  const limite = maxResultados || 50;
  const grupoClase = small ? "input-group input-group-sm" : "input-group";
  const itemClase = small
    ? "list-group-item list-group-item-action py-1 px-2 small"
    : "list-group-item list-group-item-action py-1 px-2";

  wrapper.innerHTML = `
    <div class="position-relative selector-busqueda-container">
      <input type="hidden" id="${hiddenInputId}" value="">
      <div class="${grupoClase}">
        <span class="input-group-text"><i class="fas fa-search"></i></span>
        <input type="text" class="form-control" id="${searchInputId}"
               placeholder="${placeholder || "Buscar..."}" autocomplete="off">
        <button class="btn btn-outline-secondary" type="button" id="${searchInputId}_clear" title="Limpiar">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <ul class="list-group position-absolute w-100 shadow-sm" id="${dropdownId}"
          style="z-index: 1060; max-height: 220px; overflow-y: auto; display: none; top: 100%;"></ul>
    </div>
  `;

  const searchInput = document.getElementById(searchInputId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const dropdown = document.getElementById(dropdownId);
  const clearBtn = document.getElementById(`${searchInputId}_clear`);

  function renderLista(filtro) {
    const data = getData() || [];
    const termino = (filtro || "").toLowerCase().trim();
    let filtrados = termino
      ? data.filter((item) =>
          (getLabel(item) || "").toLowerCase().includes(termino),
        )
      : data;
    const totalEncontrados = filtrados.length;
    filtrados = filtrados.slice(0, limite);

    if (filtrados.length === 0) {
      dropdown.innerHTML = `<li class="list-group-item text-muted small">Sin resultados</li>`;
    } else {
      dropdown.innerHTML = filtrados
        .map(
          (item) =>
            `<li class="${itemClase}" style="cursor:pointer;" data-id="${getId(item)}">${getLabel(item)}</li>`,
        )
        .join("");
      if (totalEncontrados > limite) {
        dropdown.innerHTML += `<li class="list-group-item text-muted small">Y ${totalEncontrados - limite} más... sigue escribiendo para filtrar</li>`;
      }
    }
    dropdown.style.display = "block";
  }

  searchInput.addEventListener("input", () => renderLista(searchInput.value));
  searchInput.addEventListener("focus", () => renderLista(searchInput.value));

  // Se usa "mousedown" (y no "click") para que el evento se dispare antes
  // del "blur" del input de búsqueda, y así la selección no se pierda.
  dropdown.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    e.preventDefault();
    const id = li.dataset.id;
    const data = getData() || [];
    const item = data.find((d) => String(getId(d)) === String(id));
    if (!item) return;
    hiddenInput.value = id;
    searchInput.value = getLabel(item);
    dropdown.style.display = "none";
    if (typeof onSelect === "function") onSelect(item);
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      dropdown.style.display = "none";
    }, 150);
  });

  clearBtn.addEventListener("click", () => {
    hiddenInput.value = "";
    searchInput.value = "";
    dropdown.style.display = "none";
    searchInput.focus();
    if (typeof onSelect === "function") onSelect(null);
  });

  const controlador = {
    setValue: function (id) {
      if (id === null || id === undefined || id === "") {
        this.reset();
        return;
      }
      const data = getData() || [];
      const item = data.find((d) => String(getId(d)) === String(id));
      if (item) {
        hiddenInput.value = getId(item);
        searchInput.value = getLabel(item);
      } else {
        hiddenInput.value = "";
        searchInput.value = "";
      }
    },
    reset: function () {
      hiddenInput.value = "";
      searchInput.value = "";
      dropdown.style.display = "none";
    },
  };

  return controlador;
}

window.crearSelectorBusqueda = crearSelectorBusqueda;