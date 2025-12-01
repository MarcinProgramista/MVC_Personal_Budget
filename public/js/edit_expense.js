// edit_expense.js (poprawione: zawiera updateBalanceUI jeśli nie istnieje)
document.addEventListener("DOMContentLoaded", function () {
  // ----------------------------
  // fallback: jeśli updateBalanceUI nie istnieje — zadeklarujmy ją
  // ----------------------------
  if (typeof window.updateBalanceUI !== "function") {
    window.updateBalanceUI = function (
      sum,
      incomesCount = 0,
      expensesCount = 0
    ) {
      sum = parseFloat(sum) || 0;

      const balanceSumEl = document.getElementById("balanceSum");
      const balanceContainer = balanceSumEl
        ? balanceSumEl.closest("div")
        : null;
      const oldAlert = document.getElementById("budgetAlert");

      if (!balanceSumEl) return;

      // aktualizacja wartości
      balanceSumEl.textContent = `${sum.toFixed(2)} PLN`;

      // kolory
      if (balanceContainer) {
        balanceContainer.classList.remove(
          "text-success",
          "text-danger",
          "text-warning"
        );
        if (sum > 0) balanceContainer.classList.add("text-success");
        else if (sum < 0) balanceContainer.classList.add("text-danger");
        else balanceContainer.classList.add("text-warning");
      }

      // usuń stary alert
      if (oldAlert && oldAlert.parentNode) oldAlert.remove();

      // nowy alert
      const newAlert = document.createElement("div");
      newAlert.id = "budgetAlert";
      newAlert.className =
        "alert custom-alert d-flex flex-column justify-content-center align-items-center text-center";
      newAlert.setAttribute("role", "alert");

      if (
        (incomesCount === 0 || !incomesCount) &&
        (expensesCount === 0 || !expensesCount) &&
        sum === 0
      ) {
        newAlert.classList.add("alert-info");
        newAlert.innerHTML = `
                    <i class="bi bi-credit-card mb-2 fs-3"></i>
                    <div class="fst-italic">
                        It looks like you haven’t added any incomes or expenses yet.
                        Start by entering your first transaction to see your budget in action!
                    </div>
                `;
      } else if (sum < 0) {
        newAlert.classList.add("alert-danger");
        newAlert.innerHTML = `
                    <i class="bi bi-emoji-frown mb-2 fs-3"></i>
                    <div class="fst-italic">
                        You’re spending more than you earn right now. Don’t worry — every step toward balance counts!
                        Review your budget and see where small changes can make a big difference.
                    </div>
                `;
      } else if (sum > 0) {
        newAlert.classList.add("alert-success");
        newAlert.innerHTML = `
                    <i class="bi bi-emoji-smile mb-2 fs-3"></i>
                    <div class="fst-italic">
                        Great job! You’re earning more than you spend. Keep up the good habits and consider setting some of that extra income aside for your goals.
                    </div>
                `;
      } else {
        newAlert.classList.add("alert-warning");
        newAlert.innerHTML = `
                    <i class="bi bi-emoji-neutral mb-2 fs-3"></i>
                    <div class="fst-italic">
                        Your budget is perfectly balanced.
                    </div>
                `;
      }

      const sumContainer = document
        .getElementById("balanceSum")
        ?.closest(".justify-content-center");
      if (sumContainer && sumContainer.parentNode) {
        sumContainer.parentNode.insertBefore(
          newAlert,
          sumContainer.nextSibling
        );
      }
    };
  }

  // ----------------------------
  // reszta Twojego wcześniej działającego kodu (edytowanie expense)
  // ----------------------------
  const editButtonsExpense = document.querySelectorAll(
    ".open-edit-expense-details-balance-modal"
  );
  const modalElement = document.getElementById("editExpenseModal");
  const modal = new bootstrap.Modal(modalElement);
  const form = document.getElementById("editExpenseForm");
  const submitBtn = form.querySelector("button[type='submit']");
  const csrfToken = document.getElementById("editExpenseCsrf")?.value;

  if (!csrfToken) {
    console.warn("⚠️ Missing CSRF token for expense edit (editExpenseCsrf).");
  }

  // Otwieranie modala
  editButtonsExpense.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const date = button.dataset.date || "";
      const amount = button.dataset.amount_expense;
      const categoryId = button.dataset.id_category_expense;
      const paymentId = button.dataset.id_payment_expense;
      const info = button.dataset.info_expense || "";
      const dateFirst = button.dataset.datefirst || "";
      const dateSecond = button.dataset.datesecond || "";

      document.getElementById("editExpeneId").value = id;
      document.getElementById("editExpeneDateFirst").value = dateFirst;
      document.getElementById("editExpeneDateSecond").value = dateSecond;
      document.getElementById("editExpenseDate").value = date;
      document.getElementById("editExpenseAmount").value = amount;
      document.getElementById("editExpenseInfo").value = info;

      if (document.getElementById("editExpenseCategory"))
        document.getElementById("editExpenseCategory").value = categoryId;
      if (document.getElementById("editExpensePayment"))
        document.getElementById("editExpensePayment").value = paymentId;

      modal.show();
    });
  });

  // ZAPIS ZMIAN
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      id: document.getElementById("editExpeneId").value,
      category_id: document.getElementById("editExpenseCategory").value,
      payment_id: document.getElementById("editExpensePayment").value,
      amount: parseFloat(
        document.getElementById("editExpenseAmount").value
      ).toFixed(2),
      info: document.getElementById("editExpenseInfo").value,
      date: document.getElementById("editExpenseDate").value,
      name: document.getElementById("editExpenseCategory").selectedOptions[0]
        .text,
      name_payment:
        document.getElementById("editExpensePayment").selectedOptions[0].text,
      dateFirst: document.getElementById("editExpeneDateFirst").value,
      dateSecond: document.getElementById("editExpeneDateSecond").value,
      csrf_token: csrfToken,
    };

    // zamykamy guzik i pokazujemy tekst
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";

    //  const controller = new AbortController();
    //  const timeout = setTimeout(() => controller.abort(), 3000);

    let res;
    try {
      res = await fetch("/balances/update-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(formData),
        //signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        showToast("Request timeout", "error");
      } else {
        showToast("Network error", "error");
      }
      resetButton();
      return;
    }

    //  clearTimeout(timeout);

    if (res.status === 403) {
      showToast("Access denied. Please log in again.", "error");
      setTimeout(() => (window.location.href = "/login"), 1500);
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

    if (data.status !== "success") {
      showToast(data.message || "Updating expense failed.", "error");
      resetButton();
      return;
    }

    // AKTUALIZACJA LISTY (jeśli element istnieje)
    const li = document.querySelector(`[data-expense-id="${formData.id}"]`);
    if (li) {
      const title = li.querySelector(".fw-bold");
      if (title) title.textContent = formData.name;

      let infoDiv = li.querySelector(".text-warning");
      if (infoDiv) {
        infoDiv.textContent = formData.info;
      } else if (formData.info) {
        infoDiv = document.createElement("div");
        infoDiv.classList.add("ms-4", "text-start");
        infoDiv.innerHTML = `<small class="text-warning"><i class="bi bi-journal-text me-1"></i>${formData.info}</small>`;
        li.querySelector(".d-flex.flex-column")?.appendChild(infoDiv);
      }

      const strong = li.querySelector("strong");
      if (strong) strong.textContent = `${formData.amount} PLN`;

      const dateDiv = li.querySelector(".text-info");
      if (dateDiv)
        dateDiv.innerHTML = `<i class="fas fa-calendar-alt me-1"></i>${new Date(
          formData.date
        ).toLocaleDateString("en-US")}`;

      const paymentDiv = li.querySelector(".text-primary");
      if (paymentDiv)
        paymentDiv.innerHTML = `<i class="bi bi-credit-card me-1"></i>${formData.name_payment}`;
    }

    // SUMY — używamy danych z serwera (totals)
    if (document.getElementById("sumDetailsExpense")) {
      document.getElementById(
        "sumDetailsExpense"
      ).textContent = `${data.totals.sumAllExpenses} PLN`;
    }
    if (document.getElementById("sumALlExpensesTop")) {
      document.getElementById(
        "sumALlExpensesTop"
      ).textContent = `${data.totals.sumAllExpenses} PLN`;
    }

    // aktualizacja balansu i alertu
    window.updateBalanceUI(
      data.totals.sum ?? 0,
      data.incomes?.length ?? 0,
      data.expenses?.length ?? 0
    );

    // odśwież listę/wykres jeśli zwrócone
    if (Array.isArray(data.expenses)) {
      refreshExpenseList(data.expenses);

      window.expensesData = data.expenses.map((e) => ({
        id: e.id,
        Category: e.Category,
        Amount: Number(e.Amount),
        date: e.date,
        info: e.info || "",
      }));

      if (typeof drawExpenseChart === "function") {
        drawExpenseChart();
      }
    }

    modal.hide();
    if (data.advice) {
      updateAIAdvice(data.advice);
    }
    resetButton();
    showToast("Expense updated successfully!", "success");
  });

  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Changes";
  }

  // pomocnicza funkcja do przebudowy listy (jeśli musisz odświeżyć całą listę)
  function refreshExpenseList(expenses) {
    const list =
      document.getElementById("expenseBalanceCategoriesList") ||
      document.getElementById("expenseDetailsBalanceCategoriesList");
    if (!list) return;
    list.innerHTML = "";

    // jeśli brak wydatków → pokaż komunikat
    if (!expenses || expenses.length === 0) {
      list.innerHTML = `
           <div class="d-flex flex-column align-items-center justify-content-center text-center p-4 my-3 fade-in">
              <div class="border border-warning rounded-3 bg-dark shadow-lg p-4" style="max-width: 500px;">
                  <i class="fas fa-shopping-basket me-1 fa-3x text-warning mb-3 pulse"></i>
                  <h3 class="text-light mb-2">No expenses found</h3>
                  <p class="text-secondary mb-3">There are no recorded expenses for this selected period.</p>
                  <a href="/expenses/index" class="btn btn-outline-warning">
                      <i class="fas fa-plus-circle me-1"></i> Add new expense
                  </a>
              </div>
           </div>
        `;
      return;
    }
    expenses.forEach((expense) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between border border-warning align-items-center text-light";
      li.dataset.id = expense.id;
      li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row align-items-center">
                        <i class="fas fa-circle me-2 text-success"></i>
                        <span class="fw-bold">${expense.Category}</span>
                    </div>
                </div>
                <span class="d-flex flex-row">
                    <span class="d-flex align-items-center">  
                        <strong class="text-light text-center mx-2">${parseFloat(
                          expense.Amount
                        ).toFixed(2)} PLN</strong>
                    </span>
                </span>
            `;
      list.appendChild(li);
    });
  }
}); // DOMContentLoaded end
