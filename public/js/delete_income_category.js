document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('deleteIncomeCategoryModal');
    if (!modalEl) {
        console.error('❌ Modal element not found: #deleteIncomeCategoryModal');
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const nameField = document.getElementById('deleteIncomeCategoryName');
    const idField = document.getElementById('deleteIncomeCategoryId');
    const userIdField = document.getElementById('deleteIncomeUserId');
    const confirmButton = document.getElementById('confirmDeleteIncomeCategoryButton');

    // 🔹 Otwieranie modala po kliknięciu kosza
    document.querySelectorAll('.open-delete-income-category-modal[data-type="income"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, name, user_id } = btn.dataset;

            console.log("🗑️ Usuwanie kategorii:", { id, name, user_id });

            // 🔹 Ustaw dane w modalu
            nameField.textContent = name || 'Unknown category';
            idField.value = id;
            userIdField.value = user_id;

            modal.show();
        });
    });

    // 🔹 Kliknięcie przycisku "Delete"
    confirmButton.addEventListener('click', async () => {
        const id = idField.value;
        const user_id = userIdField.value;

        if (!id) {
            console.error("❌ Brak ID kategorii do usunięcia.");
            return;
        }

        try {
            const res = await fetch('/category-income/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                body: new URLSearchParams({ id, user_id })
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                // 🔹 Usuń element z listy bez odświeżania
                const liToRemove = document.querySelector(
                    `#incomeCategoriesList [data-id="${id}"]`
                );

                if (liToRemove) {
                    liToRemove.closest('li').remove();
                    showToast(`Income category "${nameField.textContent}" deleted successfully.`);
                } else {
                    console.warn('⚠️ Nie znaleziono elementu <li> do usunięcia.');
                }

                modal.hide();
            } else {
                showToast(data.message || 'An error occurred while deleting.', 'error');
            }
        } catch (error) {
            console.error('❌ Error during deletion:', error);
            showToast('Server error.', 'error');
        }
    });
});
