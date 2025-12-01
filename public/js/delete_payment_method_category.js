document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('deleteMethodPaymentCategoryModal');
    if (!modalEl) {
        console.error('❌ Modal element not found: #deleteMethodPaymentCategoryModal');
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const nameField = document.getElementById('deleteMethodPaymentCategoryName');
    const idField = document.getElementById('deleteMethodPaymentCategoryId');
    const userIdField = document.getElementById('deleteMethodPaymentUserId');
    const confirmButton = document.getElementById('confirmDeleteMethodPaymentCategoryButton');
    const safeToast = (msg, type = "info") => {
        if (typeof showToast === "function") showToast(msg, type);
        else console.log(msg);
    };
    // 🔹 Otwieranie modala po kliknięciu kosza
    document.querySelectorAll('.open-delete-payment-method-category-modal[data-type="payment"]').forEach(btn => {
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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let res;
        try {
            const csrfToken = document.getElementById('deletePaymentCsrf').value;

            res = await fetch('/method-payment/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: new URLSearchParams({
                    id,
                    user_id,
                    csrf_token: csrfToken
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);
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
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            if (!data.success) {
                showToast(data.message || "Failed to delete category.", "error");
                return;
            }
            if (data.success) {
                // 🔹 Usuń element z listy bez odświeżania
                const liToRemove = document.querySelector(
                    `#paymentMethodList [data-id="${id}"]`
                );

                if (liToRemove) {
                    liToRemove.closest('li').remove();
                    showToast(`Payment method "${nameField.textContent}" deleted successfully.`);
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
