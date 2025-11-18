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
    const form = document.getElementById('deleteIncomeCategoryForm');
    form.addEventListener('submit', async () => {
        const id = idField.value;
        const user_id = userIdField.value;
        const csrfToken = document.getElementById('deleteIncomeCsrf').value;
        const payload = {
            id: idValue,
            user_id,
            csrf_token: csrfToken,

        };

        if (!id) {
            console.error("❌ Brak ID kategorii do usunięcia.");
            return;
        }
        // 🔒 Blokada przycisku
        const submitBtn = document.getElementById('confirmDeleteIncomeCategoryButton');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Deleting...";

        // Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch('/category-income/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': csrfToken // 🔥 header
                },
                credentials: 'include',
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            // 🔥 Obsługa HTTP errorów
            if (!res.ok) {
                if (res.status === 403) {
                    showToast("Access denied. Please log in again.", "error");
                    setTimeout(() => window.location.href = "/login", 2000);
                    return;
                }
                if (res.status >= 500) {
                    showToast("Server error. Try again later.", "error");
                    return;
                }
                showToast("Unexpected server error.", "error");
                return;
            }

            let data;
            try {
                data = await res.json();
            } catch {
                showToast("Invalid server response.", "error");
                return;
            }

            if (data.status !== 'success') {
                showToast(data.message || "Failed to delete expense.", "error");
                return;
            }
            //
            if (data.success) {
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

            if (error.name === "AbortError") {
                showToast("Request timed out.", "error");
            } else {
                showToast("Network error.", "error");
            }

            console.error("❌ Error:", error);

        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

    });

});


