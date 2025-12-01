/**
 * FINALNY, STABILNY, NAPRAWIONY delete_expense.js
 * Obsługa: DELETE dla expenses + expenseDetails + aktualizacja wykresu
 */

document.addEventListener("DOMContentLoaded", function () {
  const modalElementDelete = document.getElementById("deleteExpenseModal");
  const deleteButtonsExpense = document.querySelectorAll(
    ".open-delete-expense-details-balance-modal"
  );
  const deleteIdInput = document.getElementById("deleteExpenseId");
  const deleteCsrfInput = document.getElementById("deleteExpenseCsrf");
  const confirmButton = document.getElementById("confirmDeleteExpenseButton");
  const form = document.getElementById("deleteExpenseForm");

  if (
    !modalElementDelete ||
    !deleteCsrfInput ||
    !deleteIdInput ||
    !confirmButton ||
    !form
  ) {
    console.warn("delete_expense.js: Missing DOM elements");
    return;
  }

  const modal = new bootstrap.Modal(modalElementDelete);

  // =====================================================
  //  🔹 Pomocniczy toast
  // =====================================================
  const safeToast = (msg, type = "info") => {
    if (typeof showToast === "function") showToast(msg, type);
    else console.log(`[${type}] ${msg}`);
  };

  // =====================================================
  //  🔹 Dane wybranego elementu
  // =====================================================
  let selected = {
    id: "",
    date: "",
    dateFirst: "",
    dateSecond: "",
    name: "",
    payment: "",
    amount: 0,
  };

  // =====================================================
  //  🔹 OTWARCIE MODALA
  // =====================================================
  deleteButtonsExpense.forEach((btn) => {
    btn.addEventListener("click", () => {
      selected.id = btn.dataset.id;
      selected.date = btn.dataset.date || "";
      selected.name = btn.dataset.namecategoryexpense || "";
      selected.payment = btn.dataset.namepaymentexpense || "";
      selected.amount = btn.dataset.amount_expense || 0;

      selected.dateFirst = btn.dataset.datefirst || "";
      selected.dateSecond = btn.dataset.datesecond || "";

      deleteIdInput.value = selected.id;

      document.getElementById("deleteExpenseDetails").innerHTML = `
        <div>📅 <strong>Date:</strong> ${selected.date}</div>
        <div>📂 <strong>Category:</strong> ${selected.name}</div>
        <div>💳 <strong>Payment:</strong> ${selected.payment}</div>
        <div>💰 <strong>Amount:</strong> ${parseFloat(selected.amount).toFixed(
          2
        )} PLN</div>
      `;

      modal.show();
    });
  });

  // =====================================================
  //  🔹 WYSLANIE DELETE
  // =====================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    confirmButton.disabled = true;
    confirmButton.textContent = "Deleting...";

    const payload = {
      id: selected.id,
      date: selected.date,
      dateFirst: selected.dateFirst,
      dateSecond: selected.dateSecond,
      csrf_token: deleteCsrfInput.value,
    };

    let res;
    try {
      res = await fetch("/balances/delete-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": deleteCsrfInput.value,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      safeToast("Connection error.", "error");
      return resetButton();
    }

    const data = await res.json();

    if (data.status !== "success") {
      safeToast(data.message || "Failed to delete expense.", "error");
      return resetButton();
    }

    modal.hide();
    safeToast(`Deleted: ${selected.name}`, "success");

    // =====================================================
    //  🔹 Aktualizacja sum
    // =====================================================
    updateExpenseSums(data);

    // =====================================================
    //  🔹 Aktualizacja list
    // =====================================================
    refreshExpenseList(data.expenses);
    refreshExpenseDetailsList(data.expenseDetails);

    // =====================================================
    //  🔹 Aktualizacja wykresu
    // =====================================================
    updateExpenseChart(data.expenses);

    resetButton();
  });

  // =====================================================
  //  🔹 Reset button helper
  // =====================================================
  function resetButton() {
    confirmButton.disabled = false;
    confirmButton.textContent = "Delete";
  }

  // =====================================================
  //  🔹 AKTUALIZACJA SUM
  // =====================================================
  function updateExpenseSums(data) {
    if (document.getElementById("sumALlExpensesTop"))
      document.getElementById("sumALlExpensesTop").textContent =
        Number(data.sumAllExpenses).toFixed(2) + " PLN";

    if (document.getElementById("sumDetailsExpense"))
      document.getElementById("sumDetailsExpense").textContent =
        Number(data.sumAllExpenses).toFixed(2) + " PLN";

    if (document.getElementById("balanceSum"))
      document.getElementById("balanceSum").textContent =
        Number(data.sum).toFixed(2) + " PLN";
  }

  // =====================================================
  //  🔹 REFRESH LISTA GŁÓWNA (expenseBalanceCategoriesList)
  // =====================================================
  function refreshExpenseList(expenses) {
    const list = document.getElementById("expenseBalanceCategoriesList");
    if (!list) return;

    list.innerHTML = "";

    if (!expenses || expenses.length === 0) {
      list.innerHTML = noExpensesHTML("No expenses found");
      return;
    }

    expenses.forEach((exp) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between border border-warning align-items-center text-light";

      li.innerHTML = `
        <div class="d-flex flex-row align-items-center">
            <i class="fas fa-circle me-2 text-danger"></i>
            <span class="fw-bold">${exp.Category}</span>
        </div>
        <strong>${Number(exp.Amount).toFixed(2)} PLN</strong>
      `;
      list.appendChild(li);
    });
  }

  // =====================================================
  //  🔹 REFRESH LISTA SZCZEGÓŁOWA (expenseDetails)
  // =====================================================
  function refreshExpenseDetailsList(details) {
    const list = document.getElementById("expenseDetailsBalanceCategoriesList");
    if (!list) return;

    list.innerHTML = "";

    if (!details || details.length === 0) {
      list.innerHTML = noExpensesHTML("No expense details found");
      return;
    }

    details.forEach((i) => {
      const date = i.Data ?? i.date;

      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between border border-warning align-items-center text-light";

      li.dataset.expenseId = i.id;

      li.innerHTML = `
        <div class="d-flex flex-column">
            <div class="d-flex flex-row align-items-center">
                <i class="fas fa-circle me-2 text-danger"></i>
                <span class="fw-bold">${i.Category}</span>
            </div>

            ${
              i.info
                ? `<div class="ms-4 text-warning"><i class="bi bi-journal-text me-1"></i>${i.info}</div>`
                : ""
            }

            <div class="ms-4 text-info">
                <i class="fas fa-calendar-alt me-1"></i>${date}
            </div>

            <div class="ms-4 text-primary">
                <i class="bi bi-credit-card me-1"></i>${i.Method_Payment}
            </div>
        </div>

        <strong class="mx-2">${Number(i.Amount).toFixed(2)} PLN</strong>
      `;

      list.appendChild(li);
    });
  }

  // =====================================================
  //  🔹 Aktualizacja wykresu
  // =====================================================
  function updateExpenseChart(expenses) {
    const chartDiv = document.getElementById("piechartExpenses");

    if (!chartDiv) return;

    if (!expenses || expenses.length === 0) {
      chartDiv.innerHTML =
        '<div class="text-center text-secondary p-3">No data</div>';
      window.expensesData = [];
      return;
    }

    window.expensesData = expenses.map((exp) => ({
      Category: exp.Category,
      Amount: Number(exp.Amount),
    }));

    if (typeof drawExpenseChart === "function") drawExpenseChart();
  }

  // =====================================================
  //  🔹 HTML dla pustych list
  // =====================================================
  function noExpensesHTML(title) {
    return `
      <div class="d-flex flex-column align-items-center justify-content-center text-center p-4 my-3 fade-in">
          <div class="border border-warning rounded-3 bg-dark shadow-lg p-4" style="max-width: 500px;">
              <i class="fas fa-folder-open me-1 fa-3x text-warning mb-3 pulse"></i>
              <h3 class="text-light mb-2">${title}</h3>
              <p class="text-secondary mb-3">You removed the last expense entry.</p>
              <a href="/expenses/index" class="btn btn-outline-warning">
                  <i class="fas fa-plus-circle me-1"></i> Add new expense
              </a>
          </div>
      </div>
    `;
  }
});
