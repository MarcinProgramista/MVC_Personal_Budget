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

    // 🔹 Zamknij inne modale
    function closeAllOtherModals() {
        document.querySelectorAll('.modal.show').forEach(m => {
            const instance = bootstrap.Modal.getInstance(m);
            if (instance) instance.hide();
        });
    }

    // 🔹 Checkbox limitu
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
            categoryError.textContent = '';
            modal.show();
        });
    });

    // 🔥 Wysłanie formularza
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let name = nameInput.value.trim();
        let isLimitActive = checkbox.checked ? 1 : 0;
        let cashLimit = checkbox.checked && cashLimitInput.value
            ? parseFloat(cashLimitInput.value)
            : "";

        if (!name) {
            nameInput.classList.add('is-invalid');
            categoryError.textContent = 'Please enter a name.';
            return;
        }

        nameInput.classList.remove('is-invalid');
        categoryError.textContent = '';

        // Pobieramy FormData
        const formData = new FormData(form);
        const csrfToken = formData.get('csrf_token');

        // ✔️ Nadpisujemy wartości aby na pewno wyszły poprawnie
        formData.set("name", name);
        formData.set("is_limit_active", isLimitActive);
        formData.set("cash_limit", cashLimit);

        // 🔥 Blokada przycisku
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        // 🔥 Timeout
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
                headers: { 'X-CSRF-Token': csrfToken },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                if (res.status === 403) {
                    showToast("Access denied. Please log in again.", "error");
                    setTimeout(() => (window.location.href = "/login"), 1500);
                    return;
                }
                if (res.status >= 500) {
                    showToast("Server error. Try again later.", "error");
                    return;
                }
                showToast("Unknown error.", "error");
                return;
            }

            let data;
            try {
                data = await res.json();
            } catch {
                showToast("Invalid server response.", "error");
                return;
            }

            console.log("⬅️ Response:", data);

            if (!data.success) {
                showToast(data.message || "Validation error.", "error");
                return;
            }

            // 🔥 Dodanie nowej kategorii do listy
            const list = document.getElementById('paymentMethodList');
            if (list) {
                const li = document.createElement('li');
                li.className =
                    'list-group-item d-flex justify-content-between border border-warning align-items-center text-light';

                li.innerHTML = `
                    <div class="d-flex flex-column">
                        <span class="fw-bold">${data.category.name}</span>
                        ${data.category.is_limit_active && data.category.cash_limit
                        ? `<small class="text-info">Limited: ${data.category.cash_limit} PLN</small>`
                        : ''}
                    </div>
                    <span class="d-flex flex-row">
                        <button class="btn btn-outline-warning icon-btn m-1">
                            <i class="fas fa-pencil-alt text-success open-edit-category-modal"
                                data-id="${data.category.id}"
                                data-name="${data.category.name}"
                                data-cash_limit="${data.category.cash_limit || ''}"
                                data-is_limit_active="${data.category.is_limit_active}"
                                data-user_id="${data.category.user_id}"
                                data-type="payment"></i>
                        </button>
                        <button class="btn btn-outline-warning icon-btn m-1">
                            <i class="fas fa-trash-alt text-danger open-delete-category-modal"
                                data-id="${data.category.id}"
                                data-name="${data.category.name}"
                                data-user_id="${data.category.user_id}"
                                data-type="payment"></i>
                        </button>
                    </span>
                `;

                list.appendChild(li);
            }

            modal.hide();
            showToast("Payment method added successfully!");
            form.reset();

        } catch (error) {
            if (error.name === "AbortError") {
                showToast("Request timed out. Try again.", "error");
            } else {
                showToast("Network error. Check your connection.", "error");
            }
            console.error("❌ Error:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});
