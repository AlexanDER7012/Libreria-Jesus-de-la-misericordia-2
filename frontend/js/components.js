// COMPONENTES - funciones reutilizables

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  toast.style.zIndex = "9999";
  toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

window.showToast = showToast;
