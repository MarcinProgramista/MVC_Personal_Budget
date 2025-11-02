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
    // 🔹 Otwieranie modala edycji kategorii wydatków
    // 🔹 Otwieranie modala edycji kategorii wydatków
    document.querySelectorAll('.open-edit-expense-category-modal[data-type="expense"]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllOtherModals();

            const { id, name, cash_limit, is_limit_active, user_id } = btn.dataset;

            nameInput.value = name || '';
            checkbox.checked = is_limit_active == 1 || is_limit_active === true || is_limit_active === 'true';

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
            const user_id = document.getElementById('categoryEditExpenseUserId').value;

            const res = await fetch('/category-expense/edit-category', {
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
                const existingLi = document.querySelector(
                    `#expenseCategoriesList [data-id="${data.category.id}"]`
                );

                if (existingLi) {
                    // 🔹 Znajdź najbliższy <li> — ikony są wewnątrz <span>, więc musimy wejść wyżej
                    const li = existingLi.closest('li');
                    if (li) {
                        // 🔹 Zaktualizuj zawartość elementu
                        li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row   align-items-center ">
                        <i class="fas fa-circle me-2 text-success"></i>
                      
                    <span class="fw-bold">${data.category.name}</span>
                    </div> 
                    ${data.category.is_limit_active && data.category.cash_limit
                                ? `<small class="text-info">Limited: ${data.category.cash_limit} PLN</small>`
                                : ''}
                </div>
                <span class="d-flex flex-row">
                 <button
                        class="btn btn-outline-warning d-flex align-items-center justify-content-center icon-btn m-1">
                    <i class="fas fa-pencil-alt text-success me-2 open-edit-expense-category-modal"
                        role="button"
                        data-id="${data.category.id}"
                        data-name="${data.category.name}"
                        data-cash_limit="${data.category.cash_limit || ''}"
                        data-is_limit_active="${data.category.is_limit_active}"
                        data-user_id="${data.category.user_id}"
                        data-type="expense"></i>
                </button>
                <button
                        class="btn btn-outline-warning d-flex align-items-center justify-content-center icon-btn m-1">
                    <i class="fas fa-trash-alt text-danger open-delete-category-expense-modal"
                        role="button"
                        data-type="expense"
                        data-id="${data.category.id}"
                        data-name="${data.category.name}"
                        data-user_id="${data.category.user_id}"></i> </button>
                </span>    
            `;

                        // 🔹 Podłącz ponownie event do nowo wstawionej ikony edycji
                        li.querySelector('.open-edit-expense-category-modal')
                            ?.addEventListener('click', () => {
                                showToast('You just edited this item — reopen to edit again!');
                            });
                    }
                } else {
                    console.warn('⚠️ Nie znaleziono elementu li o id:', data.category.id);
                }

                modal.hide();
                showToast('Expense category updated successfully!');
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

