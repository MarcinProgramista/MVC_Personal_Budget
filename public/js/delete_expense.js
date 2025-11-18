// delete_expense.js — PART 1/4
document.addEventListener("DOMContentLoaded", function () {

    const deleteButtonsExpense = document.querySelectorAll(".open-delete-expense-details-balance-modal");
    const modalElementDelete = document.getElementById("deleteExpenseModal");
    const form = document.getElementById("deleteExpenseForm");
    const deleteIdInput = document.getElementById("deleteExpenseId");
    const deleteCsrfInput = document.getElementById("deleteExpenseCsrf");
    const confirmButton = document.getElementById("confirmDeleteExpenseButton");
    let selected = {
        id: "",
        date: "",
        dateFirst: "",
        dateSecond: "",
        name: "",
        payment: "",
        amount: 0
    };
    const safeToast = (msg, type = "info") => {
        if (typeof showToast === "function") showToast(msg, type);
        else console.log(msg);
    };

    if (!modalElementDelete || !form || !deleteIdInput || !deleteCsrfInput || !confirmButton) {
        console.warn("delete_expense.js: Missing DOM elements!");
        return;
    }

    const modal = new bootstrap.Modal(modalElementDelete);

    deleteButtonsExpense.forEach(btn => {
        btn.addEventListener("click", () => {
            selected.id = btn.dataset.id;
            selected.date = btn.dataset.date || "";
            selected.name = btn.dataset.namecategoryexpense || "";
            selected.payment = btn.dataset.namepaymentexpense || "";
            selected.amount = btn.dataset.amount_expense || 0;

            selected.dateFirst = btn.dataset.datefirst || "";
            selected.dateSecond = btn.dataset.datesecond || "";

            deleteIdInput.value = selected.id;
            const details = document.getElementById("deleteExpenseDetails");
            details.innerHTML = `
                <div>📅 <strong>Date:</strong> ${selected.date}</div>
                <div>📂 <strong>Category:</strong> ${selected.name}</div>
                <div>💳 <strong>Payment:</strong> ${selected.payment}</div>
                <div>💰 <strong>Amount:</strong> ${parseFloat(selected.amount).toFixed(2)} PLN</div>
            `;
            modal.show();
        });
    });
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
            res = await fetch("/balances/delete-expense", {
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
            safeToast("Failed to delete expense", "error");
            confirmButton.disabled = false;
            confirmButton.textContent = "Delete";
            return;
        }
        // ==========================
        //  🗑️ Usuń element z listy
        // ==========================
        const li = document.querySelector(
            `#expenseDetailsBalanceCategoriesList li[data-id="${selected.id}"]`
        );

        if (li) li.remove();

        safeToast(`Deleted: ${selected.name}`, "success");


        // ==========================
        //  🔄 Aktualizacja sum
        // ==========================
        if (document.getElementById("sumALlExpensesTop"))
            document.getElementById("sumALlExpensesTop").textContent =
                `${data.sumAllExpenses} PLN`;

        if (document.getElementById("sumDetailsExpense"))
            document.getElementById("sumDetailsExpense").textContent =
                `${data.sumAllExpenses} PLN`;

        if (document.getElementById("balanceSum"))
            document.getElementById("balanceSum").textContent =
                `${data.sum} PLN`;


        // ==========================
        //  🔄 Aktualizacja listy
        // ==========================
        if (Array.isArray(data.expenses)) {
            refreshExpenseList(data.expenses);

            // 🔄 Aktualizacja wykresu
            if (typeof drawExpenseChart === "function") {
                expensesData = data.expenses.map(e => ({
                    id: e.id,
                    Category: e.Category,
                    Amount: parseFloat(e.Amount),
                    date: e.date,
                    info: e.info || ""
                }));

                if (expensesData.length > 0) drawExpenseChart();
                else {
                    const chart = document.getElementById("piechartExpenses");
                    if (chart) chart.remove();
                }
            }
        }

        confirmButton.disabled = false;
        confirmButton.textContent = "Delete";
        modal.hide();
    });


    // =====================================================================
    //  🔁 Funkcja przebudowująca listę wydatków (jak w income)
    // =====================================================================
    function refreshExpenseList(expenses) {
        const list = document.getElementById("expenseDetailsBalanceCategoriesList");
        if (!list) return;

        list.innerHTML = "";

        expenses.forEach(exp => {
            const li = document.createElement("li");
            li.className =
                "list-group-item d-flex justify-content-between border border-warning align-items-center text-light";
            li.dataset.id = exp.id;

            li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row align-items-center">
                        <i class="fas fa-circle me-2 text-danger"></i>
                        <span class="fw-bold">${exp.Category}</span>
                    </div>
                </div>

                <span class="d-flex flex-row">
                    <strong class="text-light text-center mx-2">${parseFloat(exp.Amount).toFixed(2)} PLN</strong>
                </span>
            `;

            list.appendChild(li);
        });
    }

});
