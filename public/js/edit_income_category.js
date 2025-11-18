document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('editCategoryIncomeModal');
    if (!modalEl) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('editCategoryIncomeForm');
    const submitBtn = form.querySelector("button[type='submit']");

    const nameInput = document.getElementById('categoryEditIncomeName');
    const checkbox = document.getElementById('categoryEditIncomeLimitActive');
    const cashLimitInput = document.getElementById('categoryEditIncomeCashLimit');
    const categoryError = document.getElementById('categoryEditIncomeError');
    const csrfToken = document.getElementById('editIncomeCsrf').value;

    function closeAllOtherModals() {
        document.querySelectorAll('.modal.show').forEach(m => {
            const modalInstance = bootstrap.Modal.getInstance(m);
            modalInstance?.hide();
        });
    }

    checkbox.addEventListener('change', () => {
        cashLimitInput.disabled = !checkbox.checked;
        cashLimitInput.placeholder = checkbox.checked
            ? "Enter limit or leave empty"
            : "Limit is blocked now";

        if (!checkbox.checked) cashLimitInput.value = "";
    });

    // -----------------------------------------------------------
    // OPEN MODAL
    // -----------------------------------------------------------
    document.querySelectorAll('.open-edit-income-category-modal[data-type="income"]').forEach(btn => {
        btn.addEventListener("click", () => {
            closeAllOtherModals();

            const { id, name, cash_limit, is_limit_active, user_id } = btn.dataset;

            nameInput.value = name || "";
            checkbox.checked = is_limit_active == 1 || is_limit_active === "true";

            if (checkbox.checked) {
                cashLimitInput.disabled = false;
                cashLimitInput.value = cash_limit || "";
            } else {
                cashLimitInput.disabled = true;
                cashLimitInput.value = "";
            }

            form.dataset.id = id;
            document.getElementById('categoryEditIncomeUserId').value = user_id;

            nameInput.classList.remove("is-invalid");
            categoryError.textContent = "";

            modal.show();
        });
    });

    // -----------------------------------------------------------
    // SUBMIT FORM
    // -----------------------------------------------------------
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const isLimitActive = checkbox.checked ? 1 : 0;
        const cashLimit = checkbox.checked && cashLimitInput.value
            ? parseFloat(cashLimitInput.value)
            : null;

        if (!name) {
            nameInput.classList.add("is-invalid");
            categoryError.textContent = "Please enter a name.";
            return;
        }

        const payload = {
            id: form.dataset.id,
            user_id: document.getElementById('categoryEditIncomeUserId').value,
            name,
            is_limit_active: isLimitActive,
            cash_limit: cashLimit ?? "",
            csrf_token: csrfToken
        };

        // Disable button
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Saving...";

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        let res;

        try {
            res = await fetch('/category-income/edit-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': csrfToken
                },
                body: new URLSearchParams(payload),
                credentials: 'include',
                signal: controller.signal
            });
        } catch (err) {
            if (err.name === "AbortError") showToast("Request timeout", "error");
            else showToast("Network error", "error");
            resetButton();
            return;
        }

        clearTimeout(timeout);

        if (res.status === 403) {
            showToast("Access denied. Please log in again.", "error");
            setTimeout(() => window.location.href = "/login", 1200);
            return;
        }

        if (res.status >= 500) {
            showToast("Server error. Try again later.", "error");
            resetButton();
            return;
        }

        let data;
        try {
            data = await res.json();
        } catch {
            showToast("Invalid server response.", "error");
            resetButton();
            return;
        }

        if (!data.success) {
            showToast(data.message || "Error updating category.", "error");
            resetButton();
            return;
        }

        // -----------------------------------------------------------
        // REFRESH LIST
        // -----------------------------------------------------------
        refreshIncomeList(data.categories);

        showToast("Income category updated successfully!", "success");

        modal.hide();
        resetButton();
    });

    function resetButton() {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save";
    }

    // -----------------------------------------------------------
    // REFRESH LIST FUNCTION
    // -----------------------------------------------------------
    function refreshIncomeList(categories) {
        if (!Array.isArray(categories)) {
            console.warn("refreshIncomeList: no category list returned");
            return;
        }

        const list = document.getElementById("incomeCategoriesList");
        if (!list) return;

        list.innerHTML = "";

        categories.forEach(cat => {
            const li = document.createElement("li");
            li.dataset.id = cat.id;
            li.className =
                "list-group-item d-flex justify-content-between border border-warning align-items-center text-light";

            li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row align-items-center">
                        <i class="fas fa-circle me-2 text-success"></i>
                        <span class="fw-bold">${cat.name}</span>
                    </div>
                    ${cat.is_limit_active && cat.cash_limit
                    ? `<small class="text-info">Limited: ${cat.cash_limit} PLN</small>`
                    : ""
                }
                </div>

                <span class="d-flex flex-row">
                    <button class="btn btn-outline-warning icon-btn m-1">
                        <i class="fas fa-pencil-alt text-success open-edit-income-category-modal"
                           data-id="${cat.id}"
                           data-name="${cat.name}"
                           data-cash_limit="${cat.cash_limit ?? ''}"
                           data-is_limit_active="${cat.is_limit_active}"
                           data-user_id="${cat.user_id}"
                           data-type="income"></i>
                    </button>

                    <button class="btn btn-outline-warning icon-btn m-1">
                        <i class="fas fa-trash-alt text-danger open-delete-category-income-modal"
                           data-id="${cat.id}"
                           data-name="${cat.name}"
                           data-user_id="${cat.user_id}"
                           data-type="income"></i>
                    </button>
                </span>
            `;

            list.appendChild(li);
        });
    }
});
