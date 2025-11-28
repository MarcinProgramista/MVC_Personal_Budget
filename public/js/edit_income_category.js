document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("editCategoryIncomeModal");
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const form = document.getElementById("editCategoryIncomeForm");
  const submitBtn = form.querySelector("button[type='submit']");

  const nameInput = document.getElementById("categoryEditIncomeName");
  const checkbox = document.getElementById("categoryEditIncomeLimitActive");
  const cashLimitInput = document.getElementById("categoryEditIncomeCashLimit");
  const categoryError = document.getElementById("categoryEditIncomeError");
  const csrfToken = document.getElementById("editIncomeCsrf").value;

  function closeAllOtherModals() {
    document.querySelectorAll(".modal.show").forEach((m) => {
      bootstrap.Modal.getInstance(m)?.hide();
    });
  }

  checkbox.addEventListener("change", () => {
    cashLimitInput.disabled = !checkbox.checked;
    cashLimitInput.placeholder = checkbox.checked
      ? "Enter limit or leave empty"
      : "Limit is blocked now";
    if (!checkbox.checked) cashLimitInput.value = "";
  });

  // 🔥 🔥 🔥 NAPRAWA: Funkcja przeniesiona do środka, aby widzieć zmienne
  function attachIncomeCategoryListeners() {
    document
      .querySelectorAll(".open-edit-income-category-modal")
      .forEach((btn) => {
        // Usuń stare listenery
        btn.replaceWith(btn.cloneNode(true));
        btn = document.querySelector(
          `.open-edit-income-category-modal[data-id="${btn.dataset.id}"]`
        );

        btn.addEventListener("click", () => {
          closeAllOtherModals();

          const { id, name, cash_limit, is_limit_active, user_id } =
            btn.dataset;

          nameInput.value = name || "";
          checkbox.checked = is_limit_active == 1;

          if (checkbox.checked) {
            cashLimitInput.disabled = false;
            cashLimitInput.value = cash_limit || "";
          } else {
            cashLimitInput.disabled = true;
            cashLimitInput.value = "";
          }

          form.dataset.id = id;
          document.getElementById("categoryEditIncomeUserId").value = user_id;

          nameInput.classList.remove("is-invalid");
          categoryError.textContent = "";

          modal.show();
        });
      });

    document
      .querySelectorAll(".open-delete-category-income-modal")
      .forEach((btn) => {
        btn.replaceWith(btn.cloneNode(true));
        btn = document.querySelector(
          `.open-delete-category-income-modal[data-id="${btn.dataset.id}"]`
        );

        btn.addEventListener("click", () => {
          const { id, name, user_id } = btn.dataset;

          document.getElementById("deleteIncomeCategoryId").value = id;
          document.getElementById("deleteIncomeCategoryName").textContent =
            name;
          document.getElementById("deleteIncomeUserId").value = user_id;

          bootstrap.Modal.getOrCreateInstance(
            document.getElementById("deleteIncomeCategoryModal")
          ).show();
        });
      });
  }

  // Po załadowaniu — podłącz listenery pierwszy raz
  attachIncomeCategoryListeners();

  // -----------------------------------------------------------
  // SUBMIT FORM
  // -----------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const isLimitActive = checkbox.checked ? 1 : 0;
    const cashLimit =
      checkbox.checked && cashLimitInput.value
        ? parseFloat(cashLimitInput.value)
        : null;

    if (!name) {
      nameInput.classList.add("is-invalid");
      categoryError.textContent = "Please enter a name.";
      return;
    }

    const payload = {
      id: form.dataset.id,
      user_id: document.getElementById("categoryEditIncomeUserId").value,
      name,
      is_limit_active: isLimitActive,
      cash_limit: cashLimit ?? "",
      csrf_token: csrfToken,
    };

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";

    let res;
    try {
      res = await fetch("/category-income/edit-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrfToken,
        },
        body: new URLSearchParams(payload),
      });
    } catch {
      showToast("Network error", "error");
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
      showToast(data.message, "error");
      resetButton();
      return;
    }

    // REFRESH
    refreshIncomeList(data.categories);

    // 🔥 podłącz nowe listenery
    attachIncomeCategoryListeners();

    showToast("Income category updated!", "success");
    modal.hide();
    resetButton();
  });

  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save";
  }

  function refreshIncomeList(categories) {
    const list = document.getElementById("incomeCategoriesList");
    list.innerHTML = "";

    categories.forEach((cat) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between border border-warning align-items-center text-light";

      li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row align-items-center">
                        <i class="fas fa-circle me-2 text-success"></i>
                        <span class="fw-bold">${cat.name}</span>
                    </div>
                    ${
                      cat.is_limit_active && cat.cash_limit
                        ? `<small class="text-info">Limited: ${cat.cash_limit} PLN</small>`
                        : ""
                    }
                </div>

                <span class="d-flex flex-row">
                    <button class="btn btn-outline-warning icon-btn m-1">
                        <i class="fas fa-pencil-alt text-success open-edit-income-category-modal"
                            data-id="${cat.id}"
                            data-name="${cat.name}"
                            data-cash_limit="${cat.cash_limit ?? ""}"
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
