document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('addCategoryModal');
    const modal = new bootstrap.Modal(modalEl);

    const form = document.getElementById('addCategoryForm');
    const typeInput = document.getElementById('categoryType');
    const nameInput = document.getElementById('categoryName');
    const cashLimitInput = document.getElementById('categoryCashLimit');
    const checkbox = document.getElementById('categoryLimitActive');
    const categoryError = document.getElementById('categoryError');

    // 🔹 Sprawdzenie unikalności nazwy w czasie wpisywania
    nameInput.addEventListener('blur', async () => {
        const name = nameInput.value.trim();
        const type = typeInput.value;

        if (!name) return; // puste pole → nic nie robimy

        let endpoint = '';
        if (type === 'expense') endpoint = '/category-expense/check-name';
        else if (type === 'income') endpoint = '/category-income/check-name';
        else if (type === 'payment') endpoint = '/method-payment/check-name';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `name=${encodeURIComponent(name)}`
            });

            const data = await res.json();

            if (data.exists) {
                nameInput.classList.add('is-invalid');
                categoryError.textContent = 'This name already exists.';
            } else {
                nameInput.classList.remove('is-invalid');
                categoryError.textContent = '';
            }
        } catch (err) {
            console.error(err);
        }
    });


    // 🔘 Checkbox → blokowanie pola limitu
    checkbox.onchange = () => {
        cashLimitInput.disabled = !checkbox.checked;
        cashLimitInput.placeholder = checkbox.checked ? "Enter limit or leave empty" : "Limit is blocked now";
        if (!checkbox.checked) cashLimitInput.value = '';
    };

    // 🔘 Przycisk otwierający modal z typem
    document.querySelectorAll('.open-add-category-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type || 'expense'; // 'expense' | 'income' | 'payment'
            typeInput.value = type;

            form.reset();
            cashLimitInput.disabled = true;
            cashLimitInput.placeholder = "Limit is blocked now";
            categoryError.textContent = '';

            // Dynamiczny tytuł
            document.getElementById('addCategoryModalLabel').textContent =
                type === 'payment' ? 'Add Payment Method' :
                    type === 'income' ? 'Add Income Category' :
                        'Add Expense Category';

            modal.show();
        });
    });

    // 🔘 Obsługa wysyłki formularza
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const cashLimit = cashLimitInput.value.trim();
        const isLimitActive = checkbox.checked ? 1 : 0;
        const type = typeInput.value;

        if (!name) {
            nameInput.classList.add('is-invalid');
            categoryError.textContent = 'Name is required.';
            return;
        } else {
            nameInput.classList.remove('is-invalid');
            categoryError.textContent = '';
        }

        try {
            // 🧭 Wybór endpointa
            let endpoint = '';
            if (type === 'expense') endpoint = '/category-expense/add-expense-category';
            else if (type === 'income') endpoint = '/category-income/add-income-category';
            else if (type === 'payment') endpoint = '/method-payment/add-payment-method';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `name=${encodeURIComponent(name)}&cash_limit=${encodeURIComponent(cashLimit)}&is_limit_active=${isLimitActive}`
            });

            const data = await res.json();

            if (data.success) {
                // ✅ Dodaj nowy element do listy odpowiedniego typu
                let listId = '';
                if (type === 'expense') listId = 'expenseCategoriesList';
                else if (type === 'income') listId = 'incomeCategoriesList';
                else if (type === 'payment') listId = 'paymentMethodList';

                const list = document.getElementById(listId);

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
                <i class="fas fa-pencil-alt text-success me-2 edit-${type}-category" 
                    role="button"
                    data-id="${data.category.id}"
                    data-name="${data.category.name}"
                    data-cash_limit="${data.category.cash_limit || ''}"
                    data-is_limit_active="${data.category.is_limit_active}">
                </i>
                <i class="fas fa-trash-alt text-danger delete-${type}-category" 
                    data-id="${data.category.id}" 
                    data-name="${data.category.name}">
                </i>
            </span>
        `;
                    list.appendChild(li);
                }

                // ✅ Zamknij modal, zresetuj formularz i pokaż toast
                modal.hide();
                form.reset();
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
            } else if (data.field === 'name') {
                // 🔴 Duplikat nazwy
                nameInput.classList.add('is-invalid');
                categoryError.textContent = data.message || 'This name already exists.';
            } else {
                // 🔴 Inny błąd
                categoryError.textContent = data.message || 'Unexpected error occurred.';
            }


        } catch (err) {
            console.error(err);
            categoryError.textContent = 'Server error.';
        }
    });

    // 🔹 Funkcja toast powiadomień
    function showToast(message) {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.position = 'fixed';
            toastContainer.style.top = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = 1055;
            document.body.appendChild(toastContainer);
        }

        const toastEl = document.createElement('div');
        toastEl.className = 'toast align-items-center text-white bg-success border-0 show';
        toastEl.setAttribute('role', 'alert');
        toastEl.style.minWidth = '200px';
        toastEl.style.marginBottom = '10px';
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.remove()"></button>
            </div>
        `;
        toastContainer.appendChild(toastEl);
        setTimeout(() => toastEl.remove(), 3000);
    }
});
