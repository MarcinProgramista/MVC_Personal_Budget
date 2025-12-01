// delete_income.js – FIXED VERSION
document.addEventListener("DOMContentLoaded", function () {
  // ======================================================================
  // NORMALIZACJA DATY
  // ======================================================================
  function normalizeDate(d) {
    if (!d) return "";
    if (d.includes("T")) return d.split("T")[0];
    if (d.includes(" ")) return d.split(" ")[0];
    return d;
  }

  // ======================================================================
  // FALLBACK BALANCE
  // ======================================================================
  if (typeof window.updateBalanceUIForIncomes !== "function") {
    window.updateBalanceUIForIncomes = function (sum) {
      const el = document.getElementById("balanceSum");
      if (el) el.textContent = `${Number(sum).toFixed(2)} PLN`;
    };
  }
  const deleteButtonsIncome = document.querySelectorAll(
    ".open-delete-income-details-balance-modal"
  );
  const modalElementDelete = document.getElementById("deleteIncomeModal");
  const form = document.getElementById("deleteIncomeForm");
  const deleteIdInput = document.getElementById("deleteIncomeId");
  const deleteCsrfInput = document.getElementById("deleteIncomeCsrf");
  const confirmButton = document.getElementById("confirmDeleteIncomeButton");

  let selected = {
    id: "",
    date: "",
    dateFirst: "",
    dateSecond: "",
    name: "",
    amount: 0,
  };

  const safeToast = (msg, type = "info") => {
    if (typeof showToast === "function") showToast(msg, type);
    else console.log(msg);
  };

  if (
    !modalElementDelete ||
    !form ||
    !deleteIdInput ||
    !deleteCsrfInput ||
    !confirmButton
  ) {
    console.warn("delete_income.js: Missing DOM elements!");
    return;
  }

  const modal = new bootstrap.Modal(modalElementDelete);

  // ================================
  // OPEN MODAL
  // ================================
  deleteButtonsIncome.forEach((btn) => {
    btn.addEventListener("click", () => {
      selected.id = btn.dataset.id;
      selected.date = normalizeDate(btn.dataset.date) || "";
      selected.name = btn.dataset.namecategoryincome || btn.dataset.name || "";
      selected.amount = btn.dataset.amount_income || 0;
      selected.dateFirst = btn.dataset.datefirst || "";
      selected.dateSecond = btn.dataset.datesecond || "";

      deleteIdInput.value = selected.id;

      document.getElementById("deleteIncomeDetails").innerHTML = `
                <div>📅 <strong>Date:</strong> ${selected.date}</div>
                <div>📂 <strong>Category:</strong> ${selected.name}</div>
                <div>💰 <strong>Amount:</strong> ${parseFloat(
                  selected.amount
                ).toFixed(2)} PLN</div>
            `;

      modal.show();
    });
  });

  // ================================
  // DELETE REQUEST
  // ================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const csrf = deleteCsrfInput.value;

    const payload = {
      id: selected.id,
      date: selected.date,
      dateFirst: selected.dateFirst,
      dateSecond: selected.dateSecond,
      csrf_token: csrf,
    };

    confirmButton.disabled = true;
    confirmButton.textContent = "Deleting...";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res;

    try {
      res = await fetch("/balances/delete-income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      safeToast("Connection timeout", "error");
      confirmButton.disabled = false;
      confirmButton.textContent = "Delete";
      return;
    }

    clearTimeout(timeout);

    // HTTP ERRORS
    if (res.status === 403) {
      showToast("Access denied. Please log in again.", "error");
      setTimeout(() => (window.location.href = "/login"), 1500);
      return;
    }

    if (res.status >= 500) {
      safeToast("Server error. Try again later.", "error");
      return;
    }

    if (!res.ok) {
      safeToast("Unexpected server error", "error");
      return;
    }

    // JSON PARSE
    const data = await res.json();
    console.log(data);

    if (data.status !== "success") {
      safeToast(data.message || "Failed to delete income", "error");
      confirmButton.disabled = false;
      confirmButton.textContent = "Delete";
      return;
    }

    // ================================
    // REMOVE LIST ITEM
    // ================================
    const li = document.querySelector(
      `#incomeDetailsBalanceCategoriesList li[data-income-id="${selected.id}"]`
    );

    if (li) li.remove();
    refreshIncomeDetailsList(data.incomeDetails);
    refreshIncomeList(data.incomes);

    // ⭐⭐ KLUCZOWA LINIA ⭐⭐
    window.incomesData = data.incomes;

    updateSums(data.totals.sumAllIncomes, data.totals.sumAllExpenses);
    if (typeof drawChart === "function") drawChart();

    showToast("Income deleted", "success");
    safeToast(`Deleted: ${selected.name}`, "success");

    // ================================
    // UPDATE SUMS
    // ================================
    if (document.getElementById("sumIncomes"))
      document.getElementById(
        "sumIncomes"
      ).textContent = `${data.sumAllIncomes} PLN`;

    if (document.getElementById("sumIncomesDetails"))
      document.getElementById(
        "sumIncomesDetails"
      ).textContent = `${data.sumAllIncomes} PLN`;

    if (document.getElementById("balanceSum"))
      document.getElementById("balanceSum").textContent = `${data.sum} PLN`;

    if (data.advice) {
      updateAIAdvice(data.advice);
    }
    confirmButton.disabled = false;
    confirmButton.textContent = "Delete";
    modal.hide();
  });

  // ======================================================================
  // SUMY
  // ======================================================================
  function updateSums(sumIncomes, sumExpenses) {
    document.getElementById("sumIncomes").textContent = `${Number(
      sumIncomes
    ).toFixed(2)} PLN`;

    const d2 = document.getElementById("sumIncomesDetails");
    if (d2) d2.textContent = `${Number(sumIncomes).toFixed(2)} PLN`;

    window.updateBalanceUIForIncomes(sumIncomes - sumExpenses);
  }
  // ======================================================================
  // RENDER LISTY GŁÓWNEJ (incomes)
  // ======================================================================
  function refreshIncomeList(list) {
    const ul = document.getElementById("incomeBalanceCategoriesList");
    if (!ul) return;

    ul.innerHTML = "";

    if (!list || list.length === 0) {
      ul.innerHTML = `
            <li class="list-group-item text-center text-warning border border-warning">
                No incomes found
            </li>
        `;
      return;
    }

    list.forEach((i) => {
      ul.innerHTML += `
        <li class="list-group-item d-flex justify-content-between border border-warning align-items-center text-light">
            <div class="d-flex flex-row align-items-center">
                <i class="fas fa-circle me-2 text-success"></i>
                <span class="fw-bold">${i.Category}</span>
            </div>
            <strong class="mx-2">${Number(i.Amount).toFixed(2)} PLN</strong>
        </li>
      `;
    });
  }
  function refreshIncomeDetailsList(list) {
    const ul = document.getElementById("incomeDetailsBalanceCategoriesList");
    if (!ul) return;

    ul.innerHTML = "";

    list.forEach((i) => {
      const date = normalizeDate(i.Data);

      ul.innerHTML += `
                <li class="list-group-item d-flex justify-content-between border border-warning align-items-center text-light">
                    <div>
                        <strong>${i.Category}</strong>
                        ${
                          i.info
                            ? `<div class="ms-4 text-warning">${i.info}</div>`
                            : ""
                        }
                        <div class="ms-4 text-info"><i class="fas fa-calendar-alt me-1"></i>${date}</div>
                    </div>

                    <span class="d-flex flex-row">
                        <strong class="mx-2">${Number(i.Amount).toFixed(
                          2
                        )} PLN</strong>

                        <button class="btn btn-outline-warning m-1">
                            <i class="fas fa-pencil-alt text-success open-edit-income-details-balance-modal"
                                data-id="${i.id}"
                                data-idcategory="${
                                  i.income_category_assigned_to_user_id
                                }"
                                data-amount="${i.Amount}"
                                data-info="${i.info}"
                                data-date="${date}"
                                data-datefirst="${dateFirst}"
                                data-datesecond="${dateSecond}">
                            </i>
                        </button>

                        <button class="btn btn-outline-warning m-1">
                            <i class="fas fa-trash-alt text-danger open-delete-income-details-balance-modal"
                                data-id="${i.id}"
                                data-id_category_income="${
                                  i.income_category_assigned_to_user_id
                                }"
                                data-namecategoryincome="${i.Category}"
                                data-amount_income="${i.Amount}"
                                data-info_income="${i.info}"
                                data-date="${date}"
                                data-datefirst="${dateFirst}"
                                data-datesecond="${dateSecond}">
                            </i>
                        </button>
                    </span>
                </li>
            `;
    });

    // Reattach listeners
  }
});
