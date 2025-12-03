document.addEventListener("DOMContentLoaded", () => {
  // ================================================
  //  ELEMENTY DOM
  // ================================================
  const modalEl = document.getElementById("editCategoryMethodPyamentModal");
  if (!modalEl)
    return console.error("❌ Modal not found: #editCategoryMethodPyamentModal");

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const form = document.getElementById("editCategoryMethodPyamentForm");
  const nameInput = document.getElementById("categoryEditMethodPyamentName");
  const checkbox = document.getElementById(
    "categoryEditMethodPyamentLimitActive"
  );
  const cashLimitInput = document.getElementById(
    "categoryEditMethodPyamentCashLimit"
  );
  const categoryError = document.getElementById(
    "categoryEditMethodPyamentError"
  );
  const userIdInput = document.getElementById(
    "categoryEditMethodPyamentUserId"
  );
  const csrfToken = document.getElementById("editPaymentCsrf").value;
  const list = document.getElementById("paymentMethodList");

  const safeToast = (msg, type = "info") =>
    typeof showToast === "function" ? showToast(msg, type) : console.log(msg);

  // ================================================================
  // 1️⃣ Zamknij inne modale
  // ================================================================
  function closeAllOtherModals() {
    document.querySelectorAll(".modal.show").forEach((m) => {
      const instance = bootstrap.Modal.getInstance(m);
      if (instance) instance.hide();
    });
  }

  // ================================================================
  // 2️⃣ Checkbox logic — aktywacja limitu
  // ================================================================
  checkbox.addEventListener("change", () => {
    cashLimitInput.disabled = !checkbox.checked;

    if (checkbox.checked) {
      cashLimitInput.placeholder = "Enter limit or leave empty";
    } else {
      cashLimitInput.placeholder = "Limit is blocked now";
      cashLimitInput.value = "";
    }
  });

  // ================================================================
  // 3️⃣ EVENT DELEGATION → obsłuży także nowe elementy
  // ================================================================
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".edit-payment-method-category-modal");
    if (!btn) return;

    openModalWithData(btn.dataset);
  });

  // ================================================================
  // 4️⃣ Funkcja otwierająca modal z danymi
  // ================================================================
  function openModalWithData(data) {
    const { id, name, cash_limit, is_limit_active, user_id } = data;

    nameInput.value = name || "";
    checkbox.checked = Number(is_limit_active) === 1;

    if (checkbox.checked) {
      cashLimitInput.disabled = false;
      cashLimitInput.placeholder = "Enter limit or leave empty";
      cashLimitInput.value = cash_limit || "";
    } else {
      cashLimitInput.disabled = true;
      cashLimitInput.placeholder = "Limit is blocked now";
      cashLimitInput.value = "";
    }

    form.dataset.id = id;
    userIdInput.value = user_id;

    nameInput.classList.remove("is-invalid");
    categoryError.textContent = "";

    closeAllOtherModals();
    modal.show();
  }

  // ================================================================
  // 5️⃣ SUBMIT — wysyłanie formularza (async + timeout)
  // ================================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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
    const originalBtnText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    let res;
    try {
      res = await fetch("/method-payment/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        signal: controller.signal,
        body: new URLSearchParams({
          id: form.dataset.id,
          user_id: userIdInput.value,
          name,
          is_limit_active: isLimitActive,
          cash_limit: cashLimit,
          csrf_token: csrfToken,
        }),
      });
    } catch (err) {
      if (err.name === "AbortError") {
        safeToast("⏳ Request timed out. Try again.", "error");
      } else {
        safeToast("Network error.", "error");
      }
      resetBtn(submitBtn, originalBtnText);
      return;
    }

    clearTimeout(timeout);

    if (res.status === 403) {
      safeToast("Access denied. Please log in again.", "error");
      setTimeout(() => (window.location.href = "/login"), 1500);
      return;
    }

    if (!res.ok) {
      safeToast("Server error. Try later.", "error");
      resetBtn(submitBtn, originalBtnText);
      return;
    }

    const data = await res.json();

    if (!data.success) {
      categoryError.textContent = data.message || "Error updating category.";
      resetBtn(submitBtn, originalBtnText);
      return;
    }

    updateListItem(data.category);

    safeToast("Payment method updated!", "success");
    modal.hide();
    form.reset();

    resetBtn(submitBtn, originalBtnText);
  });

  // ================================================================
  // 6️⃣ Aktualizacja <li> BEZ niszczenia eventów
  // ================================================================
  function updateListItem(category) {
    const item = list.querySelector(`[data-id="${category.id}"]`);
    if (!item) return;

    const li = item.closest("li");
    const col = li.querySelector(".d-flex.flex-column");

    // 💥 Usuń WSZYSTKIE elementy, które mają tekst "Limited:"
    col.querySelectorAll("small").forEach((el) => {
      if (el.textContent.trim().startsWith("Limited:")) {
        el.remove();
      }
    });

    // 🟢 Zaktualizuj nazwę
    li.querySelector(".fw-bold").textContent = category.name;

    // 🟢 Dodaj jeden właściwy limit
    if (category.is_limit_active && category.cash_limit) {
      const small = document.createElement("small");
      small.className = "text-info category-limit-info";
      small.textContent = `Limited: ${category.cash_limit} PLN`;
      col.appendChild(small);
    }

    // 🟢 Zaktualizuj dataset ikony edycji
    const editBtn = li.querySelector(".edit-payment-method-category-modal");
    editBtn.dataset.name = category.name;
    editBtn.dataset.cash_limit = category.cash_limit ?? "";
    editBtn.dataset.is_limit_active = category.is_limit_active;
    editBtn.dataset.user_id = category.user_id;
  }

  function resetBtn(btn, text) {
    btn.disabled = false;
    btn.textContent = text;
  }
});
