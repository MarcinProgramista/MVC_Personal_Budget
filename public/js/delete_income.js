// delete_income.js — PART 1/4
document.addEventListener("DOMContentLoaded", function () {

    const deleteButtonsIncome = document.querySelectorAll(".open-delete-income-details-balance-modal");
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
        amount: 0
    };

    const safeToast = (msg, type = "info") => {
        if (typeof showToast === "function") showToast(msg, type);
        else console.log(msg);
    };

    if (!modalElementDelete || !form || !deleteIdInput || !deleteCsrfInput || !confirmButton) {
        console.warn("delete_income.js: Missing DOM elements!");
        return;
    }

    const modal = new bootstrap.Modal(modalElementDelete);

    deleteButtonsIncome.forEach(btn => {
        btn.addEventListener("click", () => {
            selected.id = btn.dataset.id;
            selected.date = btn.dataset.date || "";
            selected.name = btn.dataset.namecategoryincome || btn.dataset.name || "";
            selected.amount = btn.dataset.amount_income || 0;
            selected.dateFirst = btn.dataset.datefirst || "";
            selected.dateSecond = btn.dataset.datesecond || "";

            deleteIdInput.value = selected.id;

            const details = document.getElementById("deleteIncomeDetails");
            details.innerHTML = `
                <div>📅 <strong>Date:</strong> ${selected.date}</div>
                <div>📂 <strong>Category:</strong> ${selected.name}</div>
                <div>💰 <strong>Amount:</strong> ${parseFloat(selected.amount).toFixed(2)} PLN</div>
            `;

            modal.show();
        });
    });
    // delete_income.js — PART 2/4

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const csrf = deleteCsrfInput.value;

        const payload = {
            id: selected.id,
            date: selected.date,
            dateFirst: selected.dateFirst,
            dateSecond: selected.dateSecond,
            csrf_token: csrf
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
                    "X-CSRF-Token": csrf
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        } catch (err) {
            safeToast("Connection timeout", "error");
            confirmButton.disabled = false;
            confirmButton.textContent = "Delete";
            return;
        }

        clearTimeout(timeout);

        if (!res.ok) {
            safeToast("Server error", "error");
            confirmButton.disabled = false;
            confirmButton.textContent = "Delete";
            return;
        }

        const data = await res.json();
        if (data.status !== "success") {
            safeToast("Failed to delete income", "error");
            confirmButton.disabled = false;
            confirmButton.textContent = "Delete";
            return;
        }

        // remove li
        const li = document.querySelector(
            `#incomeBalanceCategoriesList li[data-id="${selected.id}"]`
        );
        if (li) li.remove();

        safeToast(`Deleted: ${selected.name}`, "success");
        // delete_income.js — PART 3/4

        // update sums
        if (document.getElementById("sumIncomes"))
            document.getElementById("sumIncomes").textContent =
                `${data.sumAllIncomes} PLN`;

        if (document.getElementById("sumIncomesDetails"))
            document.getElementById("sumIncomesDetails").textContent =
                `${data.sumAllIncomes} PLN`;

        if (document.getElementById("balanceSum"))
            document.getElementById("balanceSum").textContent =
                `${data.sum} PLN`;

        // refresh incomes
        if (Array.isArray(data.incomes)) {
            refreshIncomeList(data.incomes);

            // refresh chart
            if (typeof drawChart === "function") {
                incomesData = data.incomes.map(i => ({
                    id: i.id,
                    Category: i.Category,
                    Amount: parseFloat(i.Amount),
                    date: i.date,
                    info: i.info || ""
                }));

                if (incomesData.length > 0) drawChart();
                else {
                    const chart = document.getElementById("piechart1");
                    if (chart) chart.remove();
                }
            }
        }

        confirmButton.disabled = false;
        confirmButton.textContent = "Delete";
        modal.hide();
    });
    // delete_income.js — PART 4/4

    function refreshIncomeList(incomes) {
        const list = document.getElementById("incomeBalanceCategoriesList");
        if (!list) return;

        list.innerHTML = "";

        incomes.forEach(income => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between border border-warning align-items-center text-light";
            li.dataset.id = income.id;

            li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row align-items-center">
                        <i class="fas fa-circle me-2 text-success"></i>
                        <span class="fw-bold">${income.Category}</span>
                    </div>
                </div>
                <span class="d-flex flex-row">
                    <strong class="text-light text-center mx-2">${parseFloat(income.Amount).toFixed(2)} PLN</strong>
                </span>
            `;

            list.appendChild(li);
        });
    }

}); // END DOMContentLoaded
