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
//   - Verde:  columnas obligatorias
//   - Azul:   columnas opcionales
//   - Gris:   columnas informativas (se ignoran al subir)

const EXCEL_COLORES_URL =
  "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";

const EXCEL_COLOR_OBLIGATORIA = "1E7B34";
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
      (opcionesPorHoja.obligatorias || opcionesPorHoja.informativas)
    ) {
      opciones = opcionesPorHoja;
    }
    const obligatorias = opciones.obligatorias || [];
    const informativas = opciones.informativas || [];
    const rango = XLSX.utils.decode_range(ws["!ref"]);
    const anchos = [];

    for (let c = rango.s.c; c <= rango.e.c; c++) {
      const ref = XLSX.utils.encode_cell({ r: rango.s.r, c });
      const celda = ws[ref];
      if (!celda) continue;
      const titulo = String(celda.v ?? "");
      const color = obligatorias.includes(titulo)
        ? EXCEL_COLOR_OBLIGATORIA
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
