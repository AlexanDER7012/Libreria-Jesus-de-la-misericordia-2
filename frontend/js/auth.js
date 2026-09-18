// AUTENTICACION

function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function getPermisosUsuario() {
  try {
    const permisos = localStorage.getItem("user_permisos");
    return permisos ? JSON.parse(permisos) : [];
  } catch (e) {
    return [];
  }
}

// Exponer globalmente
window.getPermisosUsuario = getPermisosUsuario;

function requireAuth() {
  const ok = checkAuth();
  if (ok) iniciarControlInactividad();
  return ok;
}

function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_permisos");
  window.location.href = "login.html";
}

function getToken() {
  return localStorage.getItem("token");
}

// ✅ Función para recargar permisos manualmente
async function recargarPermisos() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const response = await fetch(
      "http://localhost:8000/usuarios/mis-permisos",
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      },
    );

    if (!response.ok) {
      console.warn("No se pudieron recargar permisos");
      return false;
    }

    const permisos = await response.json();
    localStorage.setItem("user_permisos", JSON.stringify(permisos));
    console.log("✅ Permisos recargados:", permisos);
    return true;
  } catch (error) {
    console.error("Error recargando permisos:", error);
    return false;
  }
}

// =============================================
// CONTROL DE INACTIVIDAD (con aviso antes de cerrar sesión)
// =============================================

const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000; // 15 minutos sin actividad
const TIEMPO_AVISO_SEGUNDOS = 60; // segundos para reaccionar antes de cerrar sesión

let inactividadTimer = null;
let countdownInterval = null;
let controlInactividadIniciado = false;

function iniciarControlInactividad() {
  if (controlInactividadIniciado) return; // evita duplicar listeners si se llama más de una vez
  controlInactividadIniciado = true;

  const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
  const reiniciarTimer = () => {
    if (document.getElementById("inactividadModal")) return; // ya se está mostrando el aviso
    clearTimeout(inactividadTimer);
    inactividadTimer = setTimeout(mostrarAvisoInactividad, TIEMPO_INACTIVIDAD_MS);
  };

  eventos.forEach((ev) =>
    document.addEventListener(ev, reiniciarTimer, { passive: true }),
  );
  reiniciarTimer();
}

function mostrarAvisoInactividad() {
  if (!localStorage.getItem("token")) return;

  const html = `
    <div class="modal fade" id="inactividadModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title"><i class="fas fa-clock me-2"></i>Sesión por inactividad</h5>
          </div>
          <div class="modal-body text-center">
            <p>Tu sesión se cerrará en <strong id="inactividadSegundos">${TIEMPO_AVISO_SEGUNDOS}</strong> segundos por inactividad.</p>
            <p class="text-muted small mb-0">Haz clic en "Seguir conectado" para continuar trabajando.</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button type="button" class="btn btn-primary" id="seguirConectadoBtn">
              <i class="fas fa-check me-1"></i>Seguir conectado
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const modalEl = document.getElementById("inactividadModal");
  const modalInstance = new bootstrap.Modal(modalEl);
  modalInstance.show();

  let segundosRestantes = TIEMPO_AVISO_SEGUNDOS;
  countdownInterval = setInterval(() => {
    segundosRestantes--;
    const span = document.getElementById("inactividadSegundos");
    if (span) span.textContent = segundosRestantes;
    if (segundosRestantes <= 0) {
      clearInterval(countdownInterval);
      modalInstance.hide();
      modalEl.remove();
      logout();
    }
  }, 1000);

  document
    .getElementById("seguirConectadoBtn")
    .addEventListener("click", async () => {
      clearInterval(countdownInterval);
      modalInstance.hide();
      modalEl.remove();

      const ok = await window.api.renovarToken();
      if (!ok) {
        logout();
        return;
      }
      clearTimeout(inactividadTimer);
      inactividadTimer = setTimeout(mostrarAvisoInactividad, TIEMPO_INACTIVIDAD_MS);
    });
}

// Exponer globalmente
window.iniciarControlInactividad = iniciarControlInactividad;
window.recargarPermisos = recargarPermisos;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.getToken = getToken;