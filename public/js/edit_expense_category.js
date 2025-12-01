document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('editCategoryExpenseModal');
    if (!modalEl) {
        console.error('❌ Modal element not found: #editCategoryExpenseModal');
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('editCategoryExpenseForm');
    const nameInput = document.getElementById('categoryEditExpenseName');
    const checkbox = document.getElementById('categoryEditExpenseLimitActive');
    const cashLimitInput = document.getElementById('categoryEditExpenseCashLimit');
    const categoryError = document.getElementById('categoryEditExpenseError');

    function closeAllOtherModals() {
        document.querySelectorAll('.modal.show').forEach(m => {
            const instance = bootstrap.Modal.getInstance(m);
            if (instance) instance.hide();
        });
    }

    checkbox.addEventListener('change', () => {
        cashLimitInput.disabled = !checkbox.checked;
        cashLimitInput.placeholder = checkbox.checked
            ? "Enter limit or leave empty"
            : "Limit is blocked now";

        if (!checkbox.checked) cashLimitInput.value = '';
    });

    document.querySelectorAll('.open-edit-expense-category-modal[data-type="expense"]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllOtherModals();

            const { id, name, cash_limit, is_limit_active, user_id } = btn.dataset;

            nameInput.value = name || '';
            checkbox.checked = is_limit_active == 1;

            if (checkbox.checked) {
                cashLimitInput.disabled = false;
                cashLimitInput.placeholder = "Enter limit or leave empty";
                cashLimitInput.value = cash_limit || '';
            } else {
                cashLimitInput.disabled = true;
                cashLimitInput.placeholder = "Limit is blocked now";
                cashLimitInput.value = '';
            }

            form.dataset.id = id;
            document.getElementById('categoryEditExpenseUserId').value = user_id;

            nameInput.classList.remove('is-invalid');
            categoryError.textContent = '';

            modal.show();
        });
    });

    // ============================================================
    //        SUBMIT WITH TIMEOUT + ERROR HANDLING (403,500)
    // ============================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const isLimitActive = checkbox.checked ? 1 : 0;
        const cashLimit = checkbox.checked && cashLimitInput.value ? parseFloat(cashLimitInput.value) : null;

        const csrfToken = document.getElementById('editExpenseCsrf').value;
        const id = form.dataset.id;
        const user_id = document.getElementById('categoryEditExpenseUserId').value;

        if (!name) {
            nameInput.classList.add('is-invalid');
            categoryError.textContent = 'Please enter a name.';
            return;
        }

        nameInput.classList.remove('is-invalid');
        categoryError.textContent = '';

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        let res;
        try {
            res = await fetch('/category-expense/edit-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                signal: controller.signal,
                body: new URLSearchParams({
                    id,
                    user_id,
                    name,
                    is_limit_active: isLimitActive,
                    cash_limit: cashLimit ?? '',
                    csrf_token: csrfToken
                })
            });

        } catch (err) {
            console.error("❌ Error:", err);

            if (err.name === "AbortError") {
                categoryError.textContent = "⏳ Request timed out. Try again.";
            } else {
                categoryError.textContent = "Network error.";
            }

            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }

        clearTimeout(timeout);

        // 🔒 403 — ACCESS DENIED
        if (res.status === 403) {
            showToast("Access denied. Please log in again.", "error");
            setTimeout(() => (window.location.href = "/login"), 1500);
            return;
        }

        // 🔥 500+ — SERVER ERROR
        if (res.status >= 500) {
            showToast("Server error. Try again later.", "error");
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }

        if (!res.ok) {
            categoryError.textContent = "Unexpected server error.";
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }

        const data = await res.json();

        if (!data.success) {
            if (data.field === "name") {
                nameInput.classList.add("is-invalid");
                categoryError.textContent = data.message;
            } else {
                showToast(data.message || "Error updating category.", "error");
            }

            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }

        // =====================================================
        //         SUCCESS — UPDATE LIST ELEMENT
        // =====================================================
        const existingLi = document.querySelector(`#expenseCategoriesList [data-id="${data.category.id}"]`);
        if (existingLi) {
            const li = existingLi.closest('li');
            li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row align-items-center">
                        <i class="fas fa-circle me-2 text-success"></i>
                        <span class="fw-bold">${data.category.name}</span>
                    </div>
                    ${data.category.is_limit_active && data.category.cash_limit
                    ? `<small class="text-info">Limited: ${data.category.cash_limit} PLN</small>`
                    : ''}
                </div>

                <span class="d-flex flex-row">
                    <button class="btn btn-outline-warning icon-btn m-1 open-edit-expense-category-modal"
                        data-id="${data.category.id}"
                        data-name="${data.category.name}"
                        data-cash_limit="${data.category.cash_limit || ''}"
                        data-is_limit_active="${data.category.is_limit_active}"
                        data-user_id="${user_id}"
                        data-type="expense">
                        <i class="fas fa-pencil-alt text-success"></i>
                    </button>

                    <button class="btn btn-outline-warning icon-btn m-1 open-delete-expense-category-modal"
                        data-id="${data.category.id}"
                        data-name="${data.category.name}"
                        data-user_id="${user_id}"
                        data-type="expense">
                        <i class="fas fa-trash-alt text-danger"></i>
                    </button>
                </span>
            `;
        }

        showToast("Expense category updated successfully!", "success");
        modal.hide();
        form.reset();

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }); // END SUBMIT

});
