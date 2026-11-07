// excel-colores.js
// Descarga de plantillas de Excel con los encabezados de color.
//
// La librería XLSX que usa el sistema (SheetJS, versión gratuita) no guarda
// colores. Para las plantillas se usa "xlsx-js-style" (misma librería con
// soporte de estilos), que se carga solo al descargar y SIN reemplazar la
// XLSX normal del resto del sistema. Si no se puede cargar (sin internet),
// la plantilla se descarga igual, sin colores.
//
// Colores de los encabezados:
//   - Verde:   columnas obligatorias
//   - Naranja: columnas recomendadas (no son obligatorias, pero conviene llenarlas)
//   - Azul:    columnas opcionales
//   - Gris:   columnas informativas (se ignoran al subir)

const EXCEL_COLORES_URL =
  "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";

const EXCEL_COLOR_OBLIGATORIA = "1E7B34";
const EXCEL_COLOR_RECOMENDADA = "C55A11";
const EXCEL_COLOR_OPCIONAL = "1F4E78";
const EXCEL_COLOR_INFORMATIVA = "7F7F7F";

let _xlsxConEstilos = null;

function _cargarXlsxConEstilos() {
  if (_xlsxConEstilos) return Promise.resolve(_xlsxConEstilos);
  return new Promise((resolve, reject) => {
    const original = window.XLSX;
    const script = document.createElement("script");
    script.src = EXCEL_COLORES_URL;
    script.onload = () => {
      const conEstilos = window.XLSX;
      window.XLSX = original; // el resto del sistema sigue con su XLSX
      if (!conEstilos || conEstilos === original) {
        reject(new Error("No se pudo cargar la librería de estilos"));
        return;
      }
      _xlsxConEstilos = conEstilos;
      resolve(conEstilos);
    };
    script.onerror = () => {
      window.XLSX = original;
      reject(new Error("No se pudo cargar la librería de estilos"));
    };
    document.head.appendChild(script);
  });
}

// opciones: { obligatorias: ["Codigo", ...], informativas: ["Stock_Actual"] }
// (por hoja: { "Movimientos": {obligatorias: [...]}, ... } o una sola para todas)
function _pintarEncabezados(wb, opcionesPorHoja) {
  wb.SheetNames.forEach((nombreHoja) => {
    const ws = wb.Sheets[nombreHoja];
    if (!ws || !ws["!ref"]) return;
    let opciones = {};
    if (opcionesPorHoja && opcionesPorHoja[nombreHoja]) {
      opciones = opcionesPorHoja[nombreHoja];
    } else if (
      opcionesPorHoja &&
      (opcionesPorHoja.obligatorias || opcionesPorHoja.informativas || opcionesPorHoja.recomendadas)
    ) {
      opciones = opcionesPorHoja;
    }
    const obligatorias = opciones.obligatorias || [];
    const informativas = opciones.informativas || [];
    const recomendadas = opciones.recomendadas || [];
    const rango = XLSX.utils.decode_range(ws["!ref"]);
    const anchos = [];

    for (let c = rango.s.c; c <= rango.e.c; c++) {
      const ref = XLSX.utils.encode_cell({ r: rango.s.r, c });
      const celda = ws[ref];
      if (!celda) continue;
      const titulo = String(celda.v ?? "");
      const color = obligatorias.includes(titulo)
        ? EXCEL_COLOR_OBLIGATORIA
        : recomendadas.includes(titulo)
          ? EXCEL_COLOR_RECOMENDADA
          : informativas.includes(titulo)
          ? EXCEL_COLOR_INFORMATIVA
          : EXCEL_COLOR_OPCIONAL;
      celda.s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial" },
        fill: { patternType: "solid", fgColor: { rgb: color } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } },
        },
      };
      // Ancho de columna según el texto más largo (encabezado o datos)
      let largo = titulo.length;
      for (let r = rango.s.r + 1; r <= rango.e.r; r++) {
        const v = ws[XLSX.utils.encode_cell({ r, c })];
        if (v && v.v != null) largo = Math.max(largo, String(v.v).length);
      }
      anchos.push({ wch: Math.min(Math.max(largo + 3, 10), 50) });
    }
    ws["!cols"] = anchos;
    ws["!rows"] = [{ hpt: 22 }];
    // Fila de encabezados fija al bajar
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  });
}

async function descargarExcelConColores(wb, nombreArchivo, opciones) {
  try {
    const XLSXEstilos = await _cargarXlsxConEstilos();
    _pintarEncabezados(wb, opciones);
    XLSXEstilos.writeFile(wb, nombreArchivo);
  } catch (error) {
    console.warn("Plantilla sin colores:", error.message);
    XLSX.writeFile(wb, nombreArchivo);
  }
}

window.descargarExcelConColores = descargarExcelConColores;

// Tabla que explica cada columna de una carga masiva, con el mismo color
// que lleva su encabezado en la plantilla de Excel.
// columnas: [{ nombre, tipo: "obligatoria"|"recomendada"|"opcional"|"informativa", detalle }]
function htmlGuiaColumnas(columnas) {
  const estilos = {
    obligatoria: ["Obligatoria", EXCEL_COLOR_OBLIGATORIA],
    recomendada: ["Recomendada", EXCEL_COLOR_RECOMENDADA],
    opcional: ["Opcional", EXCEL_COLOR_OPCIONAL],
    informativa: ["Solo informativa", EXCEL_COLOR_INFORMATIVA],
  };
  const badge = (tipo) => {
    const [texto, color] = estilos[tipo] || estilos.opcional;
    return `<span class="badge" style="background:#${color}">${texto}</span>`;
  };
  return `
    <div class="table-responsive">
      <table class="table table-sm table-bordered align-middle mb-1 small bg-body">
        <thead class="table-light">
          <tr><th style="width:190px">Columna</th><th style="width:130px">¿Es obligatoria?</th><th>Qué poner</th></tr>
        </thead>
        <tbody>
          ${columnas
            .map(
              (c) => `<tr>
                <td><code>${c.nombre}</code></td>
                <td>${badge(c.tipo)}</td>
                <td>${c.detalle}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="small text-muted mb-1">
      En la plantilla de Excel el encabezado de cada columna tiene el mismo color:
      ${badge("obligatoria")} ${badge("recomendada")} ${badge("opcional")}${columnas.some((c) => c.tipo === "informativa") ? " " + badge("informativa") : ""}.
      No cambies los nombres de los encabezados.
    </div>`;
}

window.htmlGuiaColumnas = htmlGuiaColumnas;

// ---------------------------------------------------------------------------
// Ayudas comunes para TODAS las cargas masivas
// ---------------------------------------------------------------------------

// ¿El texto trae una etiqueta HTML como <b> o <script>? El servidor las
// rechaza; se avisan en la vista previa para que no fallen al confirmar.
// "< 5" (con espacio o número) sí se permite.
function tieneEtiquetaHtmlCM(valor) {
  return /<\s*[a-zA-Z!\/?]/.test(String(valor ?? ""));
}
window.tieneEtiquetaHtmlCM = tieneEtiquetaHtmlCM;

// Los archivos CSV guardados como UTF-8 (lo normal en Excel, Google Sheets y
// LibreOffice) se leían como si fueran de otro idioma: "Lápiz" salía
// "LÃ¡piz" y no se encontraban productos, clientes ni proveedores con tilde.
// Se le indica a la librería que lea el texto como UTF-8.
(function leerCsvComoUtf8() {
  if (!window.XLSX || typeof XLSX.read !== "function" || XLSX.__lecturaUtf8) return;
  const leerOriginal = XLSX.read.bind(XLSX);
  XLSX.read = function (datos, opciones = {}) {
    if (opciones && opciones.codepage === undefined && opciones.type === "array") {
      try {
        const bytes = datos instanceof Uint8Array ? datos : new Uint8Array(datos);
        // Los .xlsx empiezan con "PK" (son un zip) y los .xls con D0 CF:
        // solo a los archivos de texto (CSV) se les aplica UTF-8
        const esLibroExcel =
          (bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf);
        if (!esLibroExcel) {
          let texto = new TextDecoder("utf-8").decode(bytes);
          if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
          return leerOriginal(texto, { ...opciones, type: "string" });
        }
      } catch (e) {
        // si algo falla se lee como antes
      }
    }
    return leerOriginal(datos, opciones);
  };
  XLSX.__lecturaUtf8 = true;
})();
