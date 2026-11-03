const ZONA_HORARIA_APLICACION = "America/Guatemala";

function fechaParaZonaHorariaGuatemala(valor) {
  if (valor instanceof Date) return valor;
  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  const fechaSolo = /^\d{4}-\d{2}-\d{2}$/.test(texto);
  const fechaConHoraLocal = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(texto);
  const fechaSinZona = fechaConHoraLocal && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto);
  const fechaNormalizada = fechaSolo
    ? `${texto}T12:00:00-06:00`
    : fechaSinZona
      ? `${texto.replace(" ", "T")}-06:00`
      : texto;
  const fecha = new Date(fechaNormalizada);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatearFechaGuatemala(valor, opciones = {}) {
  if (valor === null || valor === undefined || valor === "") return "--";
  const fecha = fechaParaZonaHorariaGuatemala(valor);
  if (!fecha) return String(valor);
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: ZONA_HORARIA_APLICACION,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...opciones,
  }).format(fecha);
}

function formatearFechaHoraGuatemala(valor, opciones = {}) {
  if (valor === undefined) valor = new Date();
  if (valor === null || valor === "") return "--";
  const fecha = fechaParaZonaHorariaGuatemala(valor);
  if (!fecha) return String(valor);
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: ZONA_HORARIA_APLICACION,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...opciones,
  }).format(fecha);
}

function fechaCalendarioGuatemala() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA_APLICACION,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return new Date(Number(valores.year), Number(valores.month) - 1, Number(valores.day), 12);
}

function fechaISOCalendarioGuatemala(fecha) {
  const pad = (valor) => String(valor).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function fechaISODeGuatemala(valor) {
  const fechaTexto = String(valor ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) return fechaTexto;
  const fecha = fechaParaZonaHorariaGuatemala(valor);
  if (!fecha) return "";
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA_APLICACION,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function hoyISOGuatemala() {
  return fechaISOCalendarioGuatemala(fechaCalendarioGuatemala());
}
