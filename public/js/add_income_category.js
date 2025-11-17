document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('addCategoryIncomeModal');
    if (!modalEl) {
        console.error('❌ Modal element not found: #addCategoryIncomeModal');
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('addCategoryIncomeForm');
    const nameInput = document.getElementById('categoryIncomeName');
    const checkbox = document.getElementById('categoryIncomeLimitActive');
    const cashLimitInput = document.getElementById('categoryIncomeCashLimit');
    const categoryError = document.getElementById('categoryIncomeError');

    function closeAllOtherModals() {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(m => {
            const modalInstance = bootstrap.Modal.getInstance(m);
            if (modalInstance) modalInstance.hide();
        });
    }

    checkbox.addEventListener('change', () => {
        cashLimitInput.disabled = !checkbox.checked;
        cashLimitInput.placeholder = checkbox.checked
            ? "Enter limit or leave empty"
            : "Limit is blocked now";

        if (!checkbox.checked) cashLimitInput.value = '';
    });

    document.querySelectorAll('.open-add-category-income-modal[data-type="income"]').forEach(btn => {
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

    // 🔥 TU JEST POPRAWIONY SUBMIT Z FormData + CSRF
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const csrfToken = formData.get('csrf_token');

        // Ustal limit
        if (!checkbox.checked) {
            formData.set('is_limit_active', 0);
            formData.set('cash_limit', '');
        } else {
            formData.set('is_limit_active', 1);
        }

        try {
            const res = await fetch('/category-income/add-income-category', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-Token': csrfToken
                }
            });

            const data = await res.json();
            console.log("⬅️ Response:", data);

            if (data.success) {

                const list = document.getElementById('incomeCategoriesList');
                if (list) {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between border border-warning align-items-center text-light';

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
                <i class="fas fa-pencil-alt text-success open-edit-category-income-modal"
                    data-id="${data.category.id}"
                    data-name="${data.category.name}"
                    data-cash_limit="${data.category.cash_limit ?? ''}"
                    data-is_limit_active="${data.category.is_limit_active}"
                    data-user_id="${data.category.user_id}"
                    data-type="income"></i>
            </button>

            <button class="btn btn-outline-warning d-flex align-items-center justify-content-center icon-btn m-1">
                <i class="fas fa-trash-alt text-danger open-delete-category-income-modal"
                    data-id="${data.category.id}"
                    data-name="${data.category.name}"
                    data-user_id="${data.category.user_id}"
                    data-type="income"></i>
            </button>
        </span>
    `;

                    list.appendChild(li);

                    li.querySelector('.open-edit-category-income-modal')
                        .addEventListener('click', () => showToast('Edit clicked!'));

                    li.querySelector('.open-delete-category-income-modal')
                        .addEventListener('click', () => showToast('Delete clicked!'));
                }


                modal.hide();
                showToast('Income category added successfully!');
                form.reset();
            }

        } catch (error) {
            console.error('❌ Error sending request:', error);
            categoryError.textContent = 'Server error.';
        }
    });

});
