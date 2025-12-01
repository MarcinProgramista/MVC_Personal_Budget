document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('deleteExpenseCategoryModal');
    if (!modalEl) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    const nameField = document.getElementById('deleteExpenseCategoryName');
    const idField = document.getElementById('deleteExpenseCategoryId');
    const userIdField = document.getElementById('deleteExpenseUserId');
    const csrfField = document.getElementById('deleteExpenseCsrf');
    const form = document.getElementById('deleteExpenseCategoryForm');
    const safeToast = (msg, type = "info") => {
        if (typeof showToast === "function") showToast(msg, type);
        else console.log(msg);
    };
    // 🔹 Otwieranie modala po kliknięciu kosza
    document.querySelectorAll('.open-delete-expense-category-modal[data-type="expense"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, name, user_id } = btn.dataset;

            nameField.textContent = name || 'Unknown';
            idField.value = id;
            userIdField.value = user_id;

            modal.show();
        });
    });

    // 🔥 Obsługa submit formularza
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = idField.value;
        const user_id = userIdField.value;
        const csrfToken = csrfField.value;

        if (!id) {
            showToast("Missing category ID.", "error");
            return;
        }

        // 🔥 Blokada przycisku
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Deleting...";

        // ⏳ Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const res = await fetch('/category-expense/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: new URLSearchParams({ id, user_id, csrf_token: csrfToken }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.status === 403) {
                showToast("Access denied. Please log in again.", "error");
                setTimeout(() => (window.location.href = "/login"), 1500);
                return;
            }

            if (res.status >= 500) {
                showToast("Server error. Try again later.", "error");
                return;
            }

            let data = await res.json();

            if (!data.success) {
                showToast(data.message || "Failed to delete category.", "error");
                return;
            }

            // 🗑️ Usuwanie elementu
            const liToRemove = document.querySelector(
                `#expenseCategoriesList [data-id="${id}"]`
            );

            if (liToRemove) {
                liToRemove.closest('li').remove();
                showToast(`Expense category "${nameField.textContent}" deleted.`);
            }

            modal.hide();

        } catch (error) {
            console.error("❌ Error:", error);

            if (error.name === "AbortError") {
                showToast("Request timed out. Try again.", "error");
            } else {
                showToast("Network error. Try again.", "error");
            }

        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});
