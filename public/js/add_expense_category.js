document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('addCategoryExpenseModal');
    if (!modalEl) {
        console.error('❌ Modal element not found: #addCategoryExpenseModal');
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('addCategoryExpenseForm');
    const nameInput = document.getElementById('categoryExpenseName');
    const checkbox = document.getElementById('categoryExpenseLimitActive');
    const cashLimitInput = document.getElementById('categoryExpenseCashLimit');
    const categoryError = document.getElementById('categoryExpenseError');

    // 🔹 Zamknij wszystkie inne otwarte modale przed otwarciem nowego
    function closeAllOtherModals() {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(m => {
            const modalInstance = bootstrap.Modal.getInstance(m);
            if (modalInstance) modalInstance.hide();
        });
    }

    // 🔹 Checkbox — aktywacja/dezaktywacja pola limitu
    checkbox.addEventListener('change', () => {
        cashLimitInput.disabled = !checkbox.checked;
        cashLimitInput.placeholder = checkbox.checked
            ? "Enter limit or leave empty"
            : "Limit is blocked now";
        if (!checkbox.checked) cashLimitInput.value = '';
    });

    // 🔹 Otwieranie modala
    document.querySelectorAll('.open-add-category-expense-modal[data-type="expense"]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllOtherModals();

            form.reset();
            checkbox.checked = false;
            cashLimitInput.disabled = true;
            cashLimitInput.placeholder = "Limit is blocked now";
            categoryError.textContent = '';

            modal.show();
        });
    });

    // 🔹 Wysłanie formularza
    // 🔹 Wysłanie formularza
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const csrfToken = formData.get('csrf_token');

        if (!checkbox.checked) {
            formData.set('is_limit_active', 0);
            formData.set('cash_limit', '');
        } else {
            formData.set('is_limit_active', 1);
        }

        // 🔥 Blokada przycisku aby użytkownik nie klikał 5x
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        // 🔥 TIMEOUT dla fetch (np. po 10 sekundach)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const res = await fetch('/category-expense/add-expense-category', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-Token': csrfToken
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // 🔥 Obsługa błędów HTTP
            if (!res.ok) {
                if (res.status === 403) {
                    showToast("Access denied. Please log in again.", "error");
                    setTimeout(() => (window.location.href = "/login"), 1500);
                    throw new Error("403 Forbidden");
                }

                if (res.status >= 500) {
                    showToast("Server error. Try again later.", "error");
                    throw new Error(`Server error ${res.status}`);
                }
            }

            // 🔥 Bezpieczne pobieranie JSON
            let data;
            try {
                data = await res.json();
            } catch (parseError) {
                showToast("Invalid server response.", "error");
                console.error("JSON parse error:", parseError);
                return;
            }

            console.log("⬅️ Response:", data);

            // 🔥 Obsługa błędów zwróconych przez backend
            if (!data.success) {
                if (data.field === 'name') {
                    nameInput.classList.add('is-invalid');
                    categoryError.textContent = data.message || "Invalid name.";
                } else {
                    showToast(data.message || "Unknown error.", "error");
                }
                return;
            }

            // 🔥 Sukces → dodaj nową kategorię
            const list = document.getElementById('expenseCategoriesList');

            if (list) {
                const li = document.createElement('li');
                li.className =
                    'list-group-item d-flex justify-content-between border border-warning align-items-center text-light';

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
                    <button class="btn btn-outline-warning d-flex align-items-center justify-content-center icon-btn m-1">
                        <i class="fas fa-pencil-alt text-success open-edit-expense-category-modal"
                            data-id="${data.category.id}"
                            data-name="${data.category.name}"
                            data-cash_limit="${data.category.cash_limit ?? ''}"
                            data-is_limit_active="${data.category.is_limit_active}"
                            data-user_id="${data.category.user_id}"
                            data-type="expense"></i>
                    </button>
                    <button class="btn btn-outline-warning d-flex align-items-center justify-content-center icon-btn m-1">
                        <i class="fas fa-trash-alt text-danger open-delete-expense-category-modal"
                            data-id="${data.category.id}"
                            data-name="${data.category.name}"
                            data-user_id="${data.category.user_id}"
                            data-type="expense"></i>
                    </button>
                </span>
            `;

                list.appendChild(li);
            }

            modal.hide();
            showToast("Category added successfully!");
            form.reset();

        } catch (error) {
            console.error("❌ Error sending request:", error);

            if (error.name === "AbortError") {
                showToast("Request timed out. Try again.", "error");
            } else {
                showToast("Unexpected error occurred.", "error");
            }

        } finally {
            // 🔥 Przywróć przycisk
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });




});

