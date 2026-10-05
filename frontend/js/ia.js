// ia.js

let iaChatOpen = false;
let iaHistorial = [];

function initIAChat() {
  if (document.getElementById("iaWidget")) return;

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
               placeholder="Escribe tu pregunta..." onkeyup="if(event.key==='Enter') enviarMensajeIA()">
        <button class="btn btn-sm btn-primary" onclick="enviarMensajeIA()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);
}

function toggleIAChat() {
  iaChatOpen = !iaChatOpen;
  const panel = document.getElementById("iaPanel");
  if (panel) panel.style.display = iaChatOpen ? "flex" : "none";
  if (iaChatOpen) {
    setTimeout(() => document.getElementById("iaInput")?.focus(), 100);
  }
}

async function enviarMensajeIA() {
  const input = document.getElementById("iaInput");
  const mensaje = input.value.trim();
  if (!mensaje) return;

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
    agregarMensajeAlChat("bot", `Error: ${error.message}`);
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
