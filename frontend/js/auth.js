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
  return checkAuth();
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
  window.location.href = "login.html";
}

function getToken() {
  return localStorage.getItem("token");
}

// auth.js - Agregar al final

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

// Exponer globalmente
window.recargarPermisos = recargarPermisos;

// Funciones globales
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.getToken = getToken;
