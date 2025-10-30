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

        try {
            console.log("➡️ Sending request:", {
                name,
                is_limit_active: isLimitActive,
                cash_limit: cashLimit
            });

            const res = await fetch('/method-payment/add-payment-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `name=${encodeURIComponent(name)}&is_limit_active=${isLimitActive}&cash_limit=${encodeURIComponent(cashLimit ?? '')}`
            });

            const data = await res.json();
            console.log("⬅️ Response:", data);

            if (data.success) {
                // ✅ Dodaj nowy element do listy metod płatności bez odświeżania
                const list = document.getElementById('paymentMethodList');
                if (list) {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center text-dark';
                    li.innerHTML = `
                        <div class="d-flex flex-column">
                            <span class="fw-bold">${data.category.name}</span>
                            ${data.category.is_limit_active && data.category.cash_limit
                            ? `<small class="text-muted">Limited: ${data.category.cash_limit} PLN</small>`
                            : ''}
                        </div>
                        <span>
                            <i class="fas fa-pencil-alt text-success me-2 open-edit-category-modal" 
                                role="button"
                                data-id="${data.category.id}"
                                data-name="${data.category.name}"
                                data-cash_limit="${data.category.cash_limit || ''}"
                                data-is_limit_active="${data.category.is_limit_active}"
                                data-user_id="${data.category.user_id}"
                                data-type="payment"></i>

                            <i class="fas fa-trash-alt text-danger open-delete-category-modal" 
                                role="button" 
                                data-type="payment"
                                data-id="${data.category.id}" 
                                data-name="${data.category.name}"
                                data-user_id="${data.category.user_id}"></i>
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
                categoryError.textContent = data.message || 'An error occurred.';
            }
        } catch (error) {
            console.error('❌ Error sending request:', error);
            categoryError.textContent = 'Server error.';
        }
    });


});

