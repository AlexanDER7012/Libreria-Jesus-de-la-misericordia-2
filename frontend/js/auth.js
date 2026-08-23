// AUTENTICACION

function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

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

// Funciones globales
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.getToken = getToken;
