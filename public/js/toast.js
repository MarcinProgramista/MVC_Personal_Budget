// 🔔 Globalna funkcja showToast — można jej używać w dowolnym pliku JS
window.showToast = function (message, type = 'success') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = 1055;
        document.body.appendChild(toastContainer);
    }

    const bgClass =
        type === 'error'
            ? 'bg-danger'
            : type === 'warning'
                ? 'bg-warning text-dark'
                : 'bg-success';

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white ${bgClass} border-0 show`;
    toastEl.setAttribute('role', 'alert');
    toastEl.style.minWidth = '220px';
    toastEl.style.marginBottom = '10px';
    toastEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
};
