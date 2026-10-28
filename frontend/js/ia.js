// ia.js

let iaChatOpen = false;
let iaHistorial = [];

let iaEnviando = false;

// Solo quien tiene algún permiso de Reportes ve el asistente (muestra cifras del negocio)
function _puedeUsarIA() {
  try {
    const permisos = JSON.parse(localStorage.getItem("user_permisos") || "[]");
    return permisos.some((p) => (p.modulo_nombre || "").toLowerCase() === "reportes");
  } catch (e) {
    return false;
  }
}

function initIAChat() {
  if (document.getElementById("iaWidget")) return;
  if (!localStorage.getItem("token") || !_puedeUsarIA()) return;

  const widget = document.createElement("div");
  widget.id = "iaWidget";
  widget.innerHTML = `
    <button id="iaToggle" class="ia-toggle-btn" onclick="toggleIAChat()">
      <i class="fas fa-robot"></i>
    </button>
    <div id="iaPanel" class="ia-panel" style="display: none;">
      <div class="ia-panel-header">
        <div>
          <i class="fas fa-robot me-2"></i>
          <strong>Asistente IA</strong>
        </div>
        <button class="btn-close btn-close-white btn-sm" onclick="toggleIAChat()"></button>
      </div>
      <div id="iaMessages" class="ia-messages">
        <div class="ia-message ia-message-bot">
          ¡Hola! Soy tu asistente. Pregúntame sobre ventas, stock o clientes.
        </div>
      </div>
      <div class="ia-input-row">
        <input type="text" id="iaInput" class="form-control form-control-sm"
               placeholder="Escribe tu pregunta..." maxlength="1000" onkeyup="if(event.key==='Enter') enviarMensajeIA()">
        <button class="btn btn-sm btn-primary" onclick="enviarMensajeIA()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);
  hacerBotonIAArrastrable();
}

let iaArrastradoEn = 0; 
const IA_POS_KEY = "ia_boton_posicion";

function _limitarPosicionIA(x, y, boton) {
  const margen = 8;
  const ancho = boton.offsetWidth || 56;
  const alto = boton.offsetHeight || 56;
  return {
    x: Math.min(Math.max(margen, x), window.innerWidth - ancho - margen),
    y: Math.min(Math.max(margen, y), window.innerHeight - alto - margen),
  };
}

function _colocarBotonIA(x, y) {
  const boton = document.getElementById("iaToggle");
  if (!boton) return;
  const pos = _limitarPosicionIA(x, y, boton);
  boton.style.left = pos.x + "px";
  boton.style.top = pos.y + "px";
  boton.style.right = "auto";
  boton.style.bottom = "auto";
  _colocarPanelIA();
}

// El chat se abre junto al botón, del lado donde haya espacio
function _colocarPanelIA() {
  const boton = document.getElementById("iaToggle");
  const panel = document.getElementById("iaPanel");
  if (!boton || !panel || !boton.style.left) return; // sin mover: posición original del CSS
  const r = boton.getBoundingClientRect();
  const anchoPanel = Math.min(380, window.innerWidth - 40);
  const altoPanel = Math.min(500, window.innerHeight - 120);
  const margen = 10;

  let left = r.left + r.width / 2 > window.innerWidth / 2
    ? r.right - anchoPanel            // botón a la derecha: el chat se abre hacia la izquierda
    : r.left;                         // botón a la izquierda: hacia la derecha
  left = Math.min(Math.max(margen, left), window.innerWidth - anchoPanel - margen);

  let top = r.top + r.height / 2 > window.innerHeight / 2
    ? r.top - altoPanel - margen      // botón abajo: el chat se abre arriba
    : r.bottom + margen;              // botón arriba: el chat se abre abajo
  top = Math.min(Math.max(margen, top), window.innerHeight - altoPanel - margen);

  panel.style.left = left + "px";
  panel.style.top = top + "px";
  panel.style.right = "auto";
  panel.style.bottom = "auto";
}

function hacerBotonIAArrastrable() {
  const boton = document.getElementById("iaToggle");
  if (!boton || boton.dataset.arrastrable) return;
  boton.dataset.arrastrable = "1";
  boton.style.touchAction = "none"; // en celular, arrastrar no mueve la página
  boton.title = "Asistente IA (mantén presionado para moverlo)";

  // Posición guardada de la vez anterior
  try {
    const guardada = JSON.parse(localStorage.getItem(IA_POS_KEY) || "null");
    if (guardada && typeof guardada.x === "number") {
      _colocarBotonIA(guardada.x, guardada.y);
    }
  } catch (e) {}

  let inicio = null;
  boton.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const r = boton.getBoundingClientRect();
    inicio = { px: e.clientX, py: e.clientY, x: r.left, y: r.top, movido: false };
    boton.setPointerCapture?.(e.pointerId);
  });

  boton.addEventListener("pointermove", (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.px;
    const dy = e.clientY - inicio.py;
    // Menos de 5 px cuenta como clic, no como arrastre
    if (!inicio.movido && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    inicio.movido = true;
    boton.style.cursor = "grabbing";
    boton.style.transition = "none";
    _colocarBotonIA(inicio.x + dx, inicio.y + dy);
  });

  const soltar = (e) => {
    if (!inicio) return;
    if (inicio.movido) {
      iaArrastradoEn = Date.now(); // el "click" de soltar no debe abrir/cerrar el chat
      boton.style.cursor = "";
      boton.style.transition = "";
      try {
        const r = boton.getBoundingClientRect();
        localStorage.setItem(IA_POS_KEY, JSON.stringify({ x: r.left, y: r.top }));
      } catch (err) {}
    }
    boton.releasePointerCapture?.(e.pointerId);
    inicio = null;
  };
  boton.addEventListener("pointerup", soltar);
  boton.addEventListener("pointercancel", soltar);

  // Si cambia el tamaño de la ventana, el botón no se queda fuera de la pantalla
  window.addEventListener("resize", () => {
    if (!boton.style.left) return;
    const r = boton.getBoundingClientRect();
    _colocarBotonIA(r.left, r.top);
  });
}

function toggleIAChat() {
  if (Date.now() - iaArrastradoEn < 400) return;
  iaChatOpen = !iaChatOpen;
  const panel = document.getElementById("iaPanel");
  if (panel) panel.style.display = iaChatOpen ? "flex" : "none";
  if (iaChatOpen) _colocarPanelIA();
  if (iaChatOpen) {
    setTimeout(() => document.getElementById("iaInput")?.focus(), 100);
  }
}

async function enviarMensajeIA() {
  const input = document.getElementById("iaInput");
  const mensaje = input.value.trim();
  if (!mensaje || iaEnviando) return; // evita mandar otra pregunta mientras responde
  if (mensaje.length > 1000) {
    agregarMensajeAlChat("bot", "La pregunta es muy larga (máximo 1000 caracteres).");
    return;
  }
  iaEnviando = true;
  input.disabled = true;
  const botonEnviar = document.querySelector("#iaPanel .ia-input-row button");
  if (botonEnviar) botonEnviar.disabled = true;

  // Agregar mensaje del usuario al chat
  agregarMensajeAlChat("user", mensaje);
  input.value = "";

  // Mostrar indicador de "escribiendo..."
  agregarMensajeAlChat("bot", "...", "escribiendo");

  try {
    const respuesta = await api.request("/ia/chat", "POST", { mensaje });

    // Quitar el "escribiendo..."
    const escribiendo = document.querySelector(".ia-message-escribiendo");
    if (escribiendo) escribiendo.remove();

    agregarMensajeAlChat("bot", respuesta.respuesta);
  } catch (error) {
    const escribiendo = document.querySelector(".ia-message-escribiendo");
    if (escribiendo) escribiendo.remove();
    const texto = /failed to fetch|networkerror|load failed/i.test(error.message || "")
      ? "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo."
      : error.message || "No se pudo obtener respuesta del asistente.";
    agregarMensajeAlChat("bot", texto, "error");
  } finally {
    iaEnviando = false;
    input.disabled = false;
    const botonEnviar = document.querySelector("#iaPanel .ia-input-row button");
    if (botonEnviar) botonEnviar.disabled = false;
    input.focus();
  }
}

function agregarMensajeAlChat(tipo, texto, claseExtra = "") {
  const container = document.getElementById("iaMessages");
  if (!container) return;

  const div = document.createElement("div");
  div.className = `ia-message ia-message-${tipo} ${claseExtra ? "ia-message-" + claseExtra : ""}`;
  div.textContent = texto;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

window.initIAChat = initIAChat;
window.toggleIAChat = toggleIAChat;
window.enviarMensajeIA = enviarMensajeIA;
