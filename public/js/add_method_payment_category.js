document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('addCategoryMethodPyamentModal');
    if (!modalEl) {
        console.error('❌ Modal element not found: #addCategoryMethodPyamentModal');
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('addCategoryMForm');
    const nameInput = document.getElementById('categoryMethodPyamentName');
    const checkbox = document.getElementById('categoryMethodPyamentLimitActive');
    const cashLimitInput = document.getElementById('categoryMethodPyamentCashLimit');
    const categoryError = document.getElementById('categoryMethodPyamentError');

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
    document.querySelectorAll('.open-add-category-modal[data-type="payment"]').forEach(btn => {
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const csrfToken = formData.get('csrf_token');

        const name = nameInput.value.trim();
        const isLimitActive = checkbox.checked ? 1 : 0;
        const cashLimit = checkbox.checked && cashLimitInput.value
            ? parseFloat(cashLimitInput.value)
            : null;

        if (!name) {
            nameInput.classList.add('is-invalid');
            categoryError.textContent = 'Please enter a name.';
            return;
        }

        nameInput.classList.remove('is-invalid');
        categoryError.textContent = '';

        // 🔥 Blokada przycisku aby użytkownik nie klikał 5x
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        // 🔥 TIMEOUT dla fetch (np. po 10 sekundach)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            console.log("➡️ Sending request:", {
                name,
                is_limit_active: isLimitActive,
                cash_limit: cashLimit
            });

            const res = await fetch('/method-payment/add-payment-method', {
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


            if (data.success) {
                // ✅ Dodaj nowy element do listy metod płatności bez odświeżania
                const list = document.getElementById('paymentMethodList');
                if (list) {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between border border-warning align-items-center text-light';
                    li.innerHTML = `
                        <div class="d-flex flex-column">
                            <span class="fw-bold">${data.category.name}</span>
                            ${data.category.is_limit_active && data.category.cash_limit
                            ? `<small class="text-info">Limited: ${data.category.cash_limit} PLN</small>`
                            : ''}
                        </div>
                        <span class="d-flex flex-row">
                        <button
                            class="btn btn-outline-warning d-flex align-items-center justify-content-center icon-btn m-1">
                            <i class="fas fa-pencil-alt text-success me-2 open-edit-category-modal" 
                                role="button"
                                data-id="${data.category.id}"
                                data-name="${data.category.name}"
                                data-cash_limit="${data.category.cash_limit || ''}"
                                data-is_limit_active="${data.category.is_limit_active}"
                                data-user_id="${data.category.user_id}"
                                data-type="payment"></i>
                        </button>
                        <button
                            class="btn btn-outline-warning d-flex align-items-center justify-content-center icon-btn m-1">       
                            <i class="fas fa-trash-alt text-danger open-delete-category-modal" 
                                role="button" 
                                data-type="payment"
                                data-id="${data.category.id}" 
                                data-name="${data.category.name}"
                                data-user_id="${data.category.user_id}"></i>
                        </button>        
                        </span>
                    `;
                    list.appendChild(li);
                    // 🔹 Podpięcie eventów po dodaniu
                    li.querySelector('.open-edit-category-modal')?.addEventListener('click', (e) => {
                        console.log("🟢 Edit clicked:", e.target.dataset);
                        showToast('Edit clicked!');
                    });
                    li.querySelector('.open-delete-category-modal')?.addEventListener('click', (e) => {
                        console.log("🗑️ Delete clicked:", e.target.dataset);
                        showToast('Delete clicked!');
                    });
                }

                modal.hide();
                showToast('Payment method added successfully!');
                form.reset();
            } else {
                // ❌ Obsługa błędów
                if (data.field === 'name') {
                    nameInput.classList.add('is-invalid');
                    categoryError.textContent = data.message || 'Invalid name.';
                } else {
                    showToast(data.message || 'An error occurred.', 'error');
                }
            }
        } catch (error) {
            console.error('❌ Error sending request:', error);
            categoryError.textContent = 'Server error.';
        }
    });


});

