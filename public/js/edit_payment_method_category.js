document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('editCategoryMethodPyamentModal');
    if (!modalEl) {
        console.error('❌ Modal element not found: #editCategoryMethodPyamentModal');
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('editCategoryMethodPyamentForm');
    const nameInput = document.getElementById('categoryEditMethodPyamentName');
    const checkbox = document.getElementById('categoryEditMethodPyamentLimitActive'); // poprawione
    const cashLimitInput = document.getElementById('categoryEditMethodPyamentCashLimit'); // poprawione
    const categoryError = document.getElementById('categoryEditMethodPyamentError');

    // Zamknij wszystkie inne otwarte modale przed otwarciem nowego
    function closeAllOtherModals() {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(m => {
            const modalInstance = bootstrap.Modal.getInstance(m);
            if (modalInstance) modalInstance.hide();
        });
    }

    // Checkbox - aktywacja/ dezaktywacja pola limitu
    checkbox.addEventListener('change', () => {
        cashLimitInput.disabled = !checkbox.checked;
        cashLimitInput.placeholder = checkbox.checked
            ? "Enter limit or leave empty"
            : "Limit is blocked now";
        if (!checkbox.checked) cashLimitInput.value = '';
    });

    // Otwierania modala 
    document.querySelectorAll('.edit-payment-method-category-modal[data-type="payment"]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllOtherModals();

            const { id, name, cash_limit, is_limit_active, user_id } = btn.dataset;
            console.log("✏️ Dane z ikony:", { id, name, cash_limit, is_limit_active, user_id });

            nameInput.value = name || '';
            checkbox.checked = (is_limit_active == 1 || is_limit_active === true || is_limit_active === 'true');

            if (checkbox.checked) {
                cashLimitInput.disabled = false;
                cashLimitInput.placeholder = 'Enter limit or leave empty';
                cashLimitInput.value = cash_limit || '';
            } else {
                cashLimitInput.disabled = true;
                cashLimitInput.placeholder = 'Limit is blocked now';
                cashLimitInput.value = '';
            }

            form.dataset.id = id;
            document.getElementById('categoryEditMethodPyamentUserId').value = user_id;
            categoryError.textContent = '';
            nameInput.classList.remove('is-invalid');
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
            const id = form.dataset.id;
            const user_id = document.getElementById('categoryEditMethodPyamentUserId').value;

            const res = await fetch('/method-payment/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include', // 🔹 zapewnia, że cookies (sesja) są wysyłane!
                body: new URLSearchParams({
                    id,
                    user_id,
                    name,
                    is_limit_active: isLimitActive,
                    cash_limit: cashLimit ?? ''
                })
            });


            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();

            if (data.success) {
                // ✅ Znajdź istniejący element <li> po ID
                const existingLi = document.querySelector(`#paymentMethodList [data-id="${data.category.id}"]`);


                if (existingLi) {
                    // 🔹 Znajdź najbliższy <li> — ikony są wewnątrz <span>, więc musimy wejść wyżej
                    const li = existingLi.closest('li');
                    if (li) {
                        // 🔹 Zaktualizuj zawartość elementu
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
                                            <i class="fas fa-pencil-alt text-success edit-payment-method-category-modal"
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
                                                data-user_id="${data.category.user_id}"></i></button>
                                        </span>
                                    `;
                        // 🔹 Podłącz ponownie event do nowo wstawionej ikony edycji
                        li.querySelector('.edit-payment-method-category-modal')
                            ?.addEventListener('click', () => {
                                closeAllOtherModals();
                                modal.show();
                                showToast('You just edited this item — reopen to edit again!');
                            });
                    }
                } else {
                    console.warn('⚠️ Nie znaleziono elementu li o id:', data.category.id);
                }

                modal.hide();
                showToast('Payment Method updated successfully!');
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
