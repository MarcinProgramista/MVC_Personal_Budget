/**
 * FINALNY, STABILNY, DZIAŁAJĄCY PLIK edit_income.js
 * Obsługa UPDATE + DELETE dla incomes + incomeDetails
 */

document.addEventListener("DOMContentLoaded", function () {
  // ======================================================================
  // FALLBACK BALANCE
  // ======================================================================
  if (typeof window.updateBalanceUIForIncomes !== "function") {
    window.updateBalanceUIForIncomes = function (sum) {
      const el = document.getElementById("balanceSum");
      if (el) el.textContent = `${Number(sum).toFixed(2)} PLN`;
    };
  }

  // ======================================================================
  // DOM ELEMENTY
  // ======================================================================
  const editModal = new bootstrap.Modal(
    document.getElementById("editIncomeModal")
  );
  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteIncomeModal")
  );

  const editForm = document.getElementById("editIncomeForm");
  const deleteForm = document.getElementById("deleteIncomeForm");

  const csrfEdit = document.getElementById("editIncomeCsrf")?.value;
  const csrfDelete = document.getElementById("deleteIncomeCsrf")?.value;

  // ======================================================================
  // POBIERAMY DATE FIRST / DATE SECOND Z DATASET GŁÓWNEGO BLOKU
  // ======================================================================
  let dateFirst =
    document.getElementById("incomeDetailsBalanceCategoriesList")?.dataset
      .datefirst || "";
  let dateSecond =
    document.getElementById("incomeDetailsBalanceCategoriesList")?.dataset
      .datesecond || "";

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
  // LISTENERY EDYCJI
  // ======================================================================
  function attachEditIncomeListeners() {
    document
      .querySelectorAll(".open-edit-income-details-balance-modal")
      .forEach((icon) => {
        icon.onclick = () => {
          const d = icon.dataset;

          document.getElementById("editIncomeId").value = d.id;
          document.getElementById("editIncomeAmount").value = d.amount;
          document.getElementById("editIncomeInfo").value = d.info || "";
          document.getElementById("editIncomeDate").value = normalizeDate(
            d.date
          );
          document.getElementById("editIncomeCategory").value = d.idcategory;

          editModal.show();
        };
      });
  }

  attachEditIncomeListeners();

  // ======================================================================
  // ZAPIS EDYCJI
  // ======================================================================
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      id: document.getElementById("editIncomeId").value,
      category_id: document.getElementById("editIncomeCategory").value,
      amount: Number(document.getElementById("editIncomeAmount").value).toFixed(
        2
      ),
      info: document.getElementById("editIncomeInfo").value,
      date: document.getElementById("editIncomeDate").value,
      csrf_token: csrfEdit,
      dateFirst,
      dateSecond,
    };

    editModal.hide();

    let res = await fetch("/balances/update-income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.status !== "success") {
      showToast("Update failed", "error");
      return;
    }

    refreshIncomeDetailsList(data.incomeDetails);
    refreshIncomeList(data.incomes);

    window.incomesData = data.incomes;

    updateSums(data.totals.sumAllIncomes, data.totals.sumAllExpenses);

    if (typeof drawChart === "function") drawChart();
    showToast("Income updated", "success");
  });

  // ======================================================================
  // LISTENERY USUWANIA
  // ======================================================================
  function attachDeleteIncomeListeners() {
    document
      .querySelectorAll(".open-delete-income-details-balance-modal")
      .forEach((icon) => {
        icon.onclick = () => {
          const d = icon.dataset;

          document.getElementById("deleteIncomeId").value = d.id;

          document.getElementById("deleteIncomeDetails").innerHTML = `
          <div>Category: <span class="text-warning">${
            d.namecategoryincome
          }</span></div>
          <div>Amount: <span class="text-warning">${
            d.amount_income
          } PLN</span></div>
          <div>Date: <span class="text-warning">${normalizeDate(
            d.date
          )}</span></div>
          <div>Info: <span class="text-warning">${
            d.info_income || ""
          }</span></div>
        `;

          deleteModal.show();
        };
      });
  }

  attachDeleteIncomeListeners();

  // ======================================================================
  // POTWIERDZENIE USUWANIA
  // ======================================================================
  deleteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("deleteIncomeId").value;

    let res = await fetch("/balances/delete-income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        csrf_token: csrfDelete,
        dateFirst,
        dateSecond,
        date: new Date().toISOString().split("T")[0],
      }),
    });

    const data = await res.json();
    if (data.status !== "success") {
      showToast("Delete failed", "error");
      return;
    }

    deleteModal.hide();

    refreshIncomeDetailsList(data.incomeDetails);
    refreshIncomeList(data.incomes);

    window.incomesData = data.incomes;

    updateSums(data.totals.sumAllIncomes, data.totals.sumAllExpenses);

    if (typeof drawChart === "function") drawChart();

    showToast("Income deleted", "success");
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
    const div = document.getElementById("incomeBalanceListContainer");
    if (!ul) return;

    ul.innerHTML = "";

    if (!list || list.length === 0) {
      ul.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center text-center p-4 my-3 fade-in">
          <div class="border border-warning rounded-3 bg-dark shadow-lg p-4" style="max-width: 500px;">
            <i class="fas fa-shopping-basket me-1 fa-3x text-warning mb-3 pulse"></i>
            <h3 class="text-light mb-2">No incomes found</h3>
            <p class="text-secondary mb-3">There are no recorded incomes for this selected period.</p>
            <a href="/incomes/index" class="btn btn-outline-warning">
              <i class="fas fa-plus-circle me-1"></i> Add new income
            </a>
          </div>
        </div>
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

  // ======================================================================
  // RENDER LISTY SZCZEGÓŁOWEJ (incomeDetails)
  // ======================================================================
  function refreshIncomeDetailsList(list) {
    const ul = document.getElementById("incomeDetailsBalanceCategoriesList");
    const div = document.getElementById("incomeBalanceListContainer");
    if (!ul) return;

    ul.innerHTML = "";

    if (!list || list.length === 0) {
      ul.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center text-center p-4 my-3 fade-in">
          <div class="border border-warning rounded-3 bg-dark shadow-lg p-4" style="max-width: 500px;">
            <i class="fas fa-shopping-basket me-1 fa-3x text-warning mb-3 pulse"></i>
            <h3 class="text-light mb-2">No incomes found</h3>
            <p class="text-secondary mb-3">There are no recorded incomes for this selected period.</p>
            <a href="/incomes/index" class="btn btn-outline-warning">
              <i class="fas fa-plus-circle me-1"></i> Add new income
            </a>
          </div>
        </div>
      `;
      return;
    }

    list.forEach((i) => {
      const date = normalizeDate(i.Data);

      ul.innerHTML += `
        <li class="list-group-item d-flex justify-content-between border border-warning align-items-center text-light">
          <div>
            <strong>${i.Category}</strong>
            ${i.info ? `<div class="ms-4 text-warning">${i.info}</div>` : ""}
            <div class="ms-4 text-info"><i class="fas fa-calendar-alt me-1"></i>${date}</div>
          </div>

          <span class="d-flex flex-row">
            <strong class="mx-2">${Number(i.Amount).toFixed(2)} PLN</strong>

            <button class="btn btn-outline-warning m-1">
              <i class="fas fa-pencil-alt text-success open-edit-income-details-balance-modal"
                 data-id="${i.id}"
                 data-idcategory="${i.income_category_assigned_to_user_id}"
                 data-amount="${i.Amount}"
                 data-info="${i.info}"
                 data-date="${date}">
              </i>
            </button>

            <button class="btn btn-outline-warning m-1">
              <i class="fas fa-trash-alt text-danger open-delete-income-details-balance-modal"
                 data-id="${i.id}"
                 data-namecategoryincome="${i.Category}"
                 data-amount_income="${i.Amount}"
                 data-info_income="${i.info}"
                 data-date="${date}">
              </i>
            </button>
          </span>
        </li>
      `;
    });

    attachEditIncomeListeners();
    attachDeleteIncomeListeners();
  }
});
