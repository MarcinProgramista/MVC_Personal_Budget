document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('deleteExpenseCategoryModal');
    if (!modalEl) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    const nameField = document.getElementById('deleteExpenseCategoryName');
    const idField = document.getElementById('deleteExpenseCategoryId');
    const userIdField = document.getElementById('deleteExpenseUserId');
    const csrfField = document.getElementById('deleteExpenseCsrf');
    const form = document.getElementById('deleteExpenseCategoryForm');

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
            console.error("❌ No category ID.");
            return;
        }

        try {
            const res = await fetch('/category-expense/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: new URLSearchParams({ id, user_id, csrf_token: csrfToken })
            });

            const data = await res.json();
            console.log("⬅️ Response:", data);

            if (data.success) {

                // 👇 usuń element z listy
                const liToRemove = document.querySelector(
                    `#expenseCategoriesList [data-id="${id}"]`
                );

                if (liToRemove) {
                    liToRemove.closest('li').remove();
                    showToast(`Expense category "${nameField.textContent}" deleted.`);
                }

                modal.hide();
            } else {
                showToast(data.message || 'Failed to delete category.', 'error');
            }

        } catch (error) {
            console.error('❌ Error:', error);
            showToast('Server error.', 'error');
        }
    });
});
