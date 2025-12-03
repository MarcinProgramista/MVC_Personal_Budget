document.addEventListener("DOMContentLoaded", () => {
  // === ELEMENTY STAŁE ===
  const modalEl = document.getElementById("editCategoryExpenseModal");
  if (!modalEl) return console.error("Modal not found");

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const form = document.getElementById("editCategoryExpenseForm");
  const nameInput = document.getElementById("categoryEditExpenseName");
  const checkbox = document.getElementById("categoryEditExpenseLimitActive");
  const cashLimitInput = document.getElementById(
    "categoryEditExpenseCashLimit"
  );
  const userIdInput = document.getElementById("categoryEditExpenseUserId");
  const categoryError = document.getElementById("categoryEditExpenseError");
  const csrfToken = document.getElementById("editExpenseCsrf").value;

  const list = document.getElementById("expenseCategoriesList");

  // ===============================================================
  // 1️⃣ AUTO-HANDLER CHECKBOX LIMITU
  // ===============================================================
  checkbox.addEventListener("change", () => {
    cashLimitInput.disabled = !checkbox.checked;
    cashLimitInput.placeholder = checkbox.checked
      ? "Enter limit or leave empty"
      : "Limit is blocked now";

    if (!checkbox.checked) cashLimitInput.value = "";
  });

  // ===============================================================
  // 2️⃣ EVENT DELEGATION → działa dla NOWYCH elementów dynamicznych
  // ===============================================================
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".open-edit-expense-category-modal");
    if (!btn) return;

    openEditModal(btn.dataset);
  });

  // ===============================================================
  // 3️⃣ FUNKCJA OTWIERAJĄCA MODAL (czytelnie + reuse)
  // ===============================================================
  function openEditModal(data) {
    const { id, name, cash_limit, is_limit_active, user_id } = data;

    nameInput.value = name || "";
    checkbox.checked = Number(is_limit_active) === 1;

    if (checkbox.checked) {
      cashLimitInput.disabled = false;
      cashLimitInput.value = cash_limit || "";
      cashLimitInput.placeholder = "Enter limit or leave empty";
    } else {
      cashLimitInput.disabled = true;
      cashLimitInput.value = "";
      cashLimitInput.placeholder = "Limit is blocked now";
    }

    form.dataset.id = id;
    userIdInput.value = user_id;

    nameInput.classList.remove("is-invalid");
    categoryError.textContent = "";

    modal.show();
  }

  // ===============================================================
  // 4️⃣ SUBMIT FORMULARZA — w pełni działający
  // ===============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = form.dataset.id;
    const name = nameInput.value.trim();
    const isLimitActive = checkbox.checked ? 1 : 0;
    const cashLimit =
      checkbox.checked && cashLimitInput.value
        ? parseFloat(cashLimitInput.value)
        : "";

    if (!name) {
      nameInput.classList.add("is-invalid");
      categoryError.textContent = "Please enter a name.";
      return;
    }

    nameInput.classList.remove("is-invalid");
    categoryError.textContent = "";

    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    let response;
    try {
      response = await fetch("/category-expense/edit-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: new URLSearchParams({
          id,
          user_id: userIdInput.value,
          name,
          is_limit_active: isLimitActive,
          cash_limit: cashLimit,
          csrf_token: csrfToken,
        }),
      });
    } catch (err) {
      showToast("Network error.", "error");
      resetButton(submitBtn, originalText);
      return;
    }

    if (response.status === 403) {
      showToast("Access denied. Please log in.", "error");
      return (window.location.href = "/login");
    }

    if (!response.ok) {
      showToast("Server error.", "error");
      resetButton(submitBtn, originalText);
      return;
    }

    const data = await response.json();

    if (!data.success) {
      nameInput.classList.add("is-invalid");
      categoryError.textContent = data.message;
      resetButton(submitBtn, originalText);
      return;
    }

    updateListElement(data.category);
    showToast("Category updated!", "success");
    modal.hide();
    form.reset();
    resetButton(submitBtn, originalText);
  });

  // ===============================================================
  // 5️⃣ FUNKCJA AKTUALIZUJĄCA LI BEZ USUWANIA LISTENERÓW
  // ===============================================================
  function updateListElement(category) {
    const li = list.querySelector(`[data-id="${category.id}"]`).closest("li");

    li.querySelector("span.fw-bold").textContent = category.name;

    const limitInfo = li.querySelector(".category-limit-info");
    if (category.is_limit_active && category.cash_limit) {
      if (!limitInfo) {
        const small = document.createElement("small");
        small.className = "text-info category-limit-info";
        small.textContent = `Limited: ${category.cash_limit} PLN`;
        li.querySelector(".d-flex.flex-column").appendChild(small);
      } else {
        limitInfo.textContent = `Limited: ${category.cash_limit} PLN`;
      }
    } else {
      if (limitInfo) limitInfo.remove();
    }

    // Aktualizacja datasetów w przycisku edycji
    const btn = li.querySelector(".open-edit-expense-category-modal");
    btn.dataset.name = category.name;
    btn.dataset.cash_limit = category.cash_limit ?? "";
    btn.dataset.is_limit_active = category.is_limit_active;
  }

  function resetButton(btn, text) {
    btn.disabled = false;
    btn.textContent = text;
  }
});
