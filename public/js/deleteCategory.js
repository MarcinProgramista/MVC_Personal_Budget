document.addEventListener('DOMContentLoaded', () => {
    // 🔹 Modal Bootstrap
    const modalEl = document.getElementById('deleteCategoryModal');
    const modal = new bootstrap.Modal(modalEl);

    // 🔹 Elementy w modalu
    const infoParagraph = document.getElementById('deleteCategoryInfo');
    const nameParagraph = document.getElementById('deleteCategoryName');
    const hiddenIdInput = document.getElementById('deleteCategoryId');
    const confirmBtn = document.getElementById('confirmDeleteCategoryButton');

    // 🔹 Wybrane wartości do usunięcia
    let selectedType = null;
    let selectedId = null;
    let selectedUserId = null;

    // 🔹 Kliknięcie ikony kosza — otwiera modal i zapisuje dane
    document.querySelectorAll('.open-delete-category-modal').forEach(icon => {
        icon.addEventListener('click', () => {
            const id = icon.dataset.id;
            const name = icon.dataset.name;
            const user_id = icon.dataset.user_id || 'unknown';
            const type = icon.dataset.type || 'expense';

            selectedType = type;
            selectedId = id;
            selectedUserId = user_id;

            hiddenIdInput.value = id;
            infoParagraph.textContent = `Are you sure you want to delete this ${type} category?`;
            nameParagraph.textContent = name;

            // Dynamiczny tytuł modala
            document.getElementById('deleteCategoryModalLabel').textContent =
                type === 'payment' ? 'Delete Payment Method' :
                    type === 'income' ? 'Delete Income Category' :
                        'Delete Expense Category';

            modal.show();
        });
    });

    // 🔹 Kliknięcie "Delete" — wysyła zapytanie AJAX
    confirmBtn.addEventListener('click', async () => {
        if (!selectedId || !selectedType) return;
        console.log(selectedType);

        // Endpoint w zależności od typu
        let endpoint = '';
        if (selectedType === 'expense') endpoint = '/category-expense/delete';
        else if (selectedType === 'income') endpoint = '/category-income/delete';
        else if (selectedType === 'payment') endpoint = '/method-payment/delete';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedId,
                    user_id: selectedUserId
                })
            });

            const data = await res.json();
            console.log(data);

            if (data.success) {
                // 🔹 Znajdź ikonę odpowiadającą temu ID i typowi
                const icon = document.querySelector(
                    `.open-delete-category-modal[data-id="${selectedId}"][data-type="${selectedType}"]`
                );

                if (icon) {
                    const li = icon.closest('li');
                    if (li) {
                        // 🔹 Animacja fade-out
                        li.style.transition = 'opacity 0.3s ease';
                        li.style.opacity = '0';
                        setTimeout(() => li.remove(), 300);
                    }
                }

                // 🔹 Zamknij modal poprawnie
                modal.hide();
                showToast(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} added successfully!`);
            } else {
                alert(data.message || '❌ Failed to delete category.');
            }

        } catch (error) {
            console.error('❌ Error sending delete request:', error);
            alert('An error occurred while deleting category.');
        }
    });

    // 🔹 Funkcja toast powiadomień
    function showToast(message) {
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

        const toastEl = document.createElement('div');
        toastEl.className = 'toast align-items-center text-white bg-success border-0 show';
        toastEl.setAttribute('role', 'alert');
        toastEl.style.minWidth = '200px';
        toastEl.style.marginBottom = '10px';
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.remove()"></button>
            </div>
        `;
        toastContainer.appendChild(toastEl);
        setTimeout(() => toastEl.remove(), 3000);
    }
});
