document.addEventListener('DOMContentLoaded', function () {
    const modalElement = document.getElementById('deleteExpenseModal');
    if (!modalElement) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    const idField = document.getElementById('deleteExpenseId');
    const csrfField = document.getElementById('deleteExpenseCsrf');

    const deleteButtons = document.querySelectorAll('.open-delete-expense-details-balance-modal');

    let dateFirst = '';
    let dateSecond = '';
    let date = '';
    let nameCategoryExpense = '';
    let id = '';

    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {

            id = button.dataset.id;
            date = button.dataset.date || '';
            const amount = button.dataset.amount_expense || '0';
            nameCategoryExpense = button.dataset.namecategoryexpense || '';
            const namePaymentExpense = button.dataset.namepaymentexpense || '';

            dateFirst = button.dataset.datefirst || '';
            dateSecond = button.dataset.datesecond || '';

            idField.value = id;

            // Wyświetl szczegóły
            const details = document.getElementById('deleteExpenseDetails');
            details.innerHTML = `
                    <div>📅 <strong>Date:</strong> ${date}</div>
                    <div>📂 <strong>Category:</strong> ${nameCategoryExpense}</div>
                    <div>💳 <strong>Payment:</strong> ${namePaymentExpense}</div>
                    <div>💰 <strong>Amount:</strong> ${parseFloat(amount).toFixed(2)} PLN</div>
                `;

            modal.show();
        });
    });

    // =============================
    //   DELETE — pełny fetch
    // =============================
    const form = document.getElementById('deleteExpenseForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const csrfToken = csrfField.value;
        const idValue = idField.value;

        const payload = {
            id: idValue,
            dateFirst: dateFirst,
            dateSecond: dateSecond,
            date: date,
            csrf_token: csrfToken
        };

        // 🔒 Blokada przycisku
        const submitBtn = document.getElementById('confirmDeleteExpenseButton');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Deleting...";

        // Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch('/balances/delete-expense', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // 🔥 Obsługa HTTP errorów
            if (!res.ok) {
                if (res.status === 403) {
                    showToast("Access denied. Please log in again.", "error");
                    setTimeout(() => window.location.href = "/login", 2000);
                    return;
                }
                if (res.status >= 500) {
                    showToast("Server error. Try again later.", "error");
                    return;
                }
                showToast("Unexpected server error.", "error");
                return;
            }

            let data;
            try {
                data = await res.json();
            } catch {
                showToast("Invalid server response.", "error");
                return;
            }

            if (data.status !== 'success') {
                showToast(data.message || "Failed to delete expense.", "error");
                return;
            }

            // ==========================
            //  🗑️ Usuń element z listy
            // ==========================
            const liToRemove = document.querySelector(
                `#expenseDetailsBalanceCategoriesList [data-id="${idValue}"]`
            );

            if (liToRemove) {
                liToRemove.closest('li').remove();
            }

            showToast(`Expense "${nameCategoryExpense}" deleted.`);

            // ==========================
            //  🔄 Odśwież sumy
            // ==========================
            if (data.sum !== undefined) {
                const sumEl = document.getElementById('balanceSum');
                if (sumEl) sumEl.textContent = `${data.sum} PLN`;
            }

            const totalExpensesEl = document.getElementById('sumDetailsExpense');
            if (totalExpensesEl && data.sumAllExpenses !== undefined) {
                totalExpensesEl.textContent = `${data.sumAllExpenses} PLN`;
            }

            const topEl = document.getElementById('sumALlExpensesTop');
            if (topEl && data.sumAllExpenses !== undefined) {
                topEl.textContent = `${data.sumAllExpenses} PLN`;
            }
            console.log(data.expenses);

            // ==========================
            // 🔄 Odśwież wykres
            // ==========================
            if (data.expenses && data.expenses.length > 0) {
                expensesData = data.expenses.map(exp => ({
                    id: exp.id,
                    Category: exp.Category,
                    Amount: parseFloat(exp.Amount),
                    date: exp.date,
                    info: exp.info || ''
                }));
                drawExpenseChart();
            }

            if (data.incomes.length == 0) {
                document.getElementById('piechartExpenses').remove();
            }

            modal.hide();
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());

        } catch (error) {

            if (error.name === "AbortError") {
                showToast("Request timed out.", "error");
            } else {
                showToast("Network error.", "error");
            }

            console.error("❌ Error:", error);

        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

    });

});
