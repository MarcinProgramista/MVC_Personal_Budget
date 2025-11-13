document.addEventListener('DOMContentLoaded', function () {
    const deleteButtonsExpense = document.querySelectorAll('.open-delete-expense-details-balance-modal');
    const modalElementDelete = document.getElementById('deleteExpenseModal');
    let id = "";
    let dateFirst = '';
    let nameCategoryExpense = '';
    let dateSecond = '';
    let date = '';
    if (!modalElementDelete) {
        console.error('Brak elementu #deleteExpenseModal w DOM!');
        return;
    }

    const modal = new bootstrap.Modal(modalElementDelete);

    deleteButtonsExpense.forEach(button => {
        button.addEventListener('click', () => {
            console.log(button.dataset);

            id = button.dataset.id;
            date = button.dataset.date || '';
            const amount = button.dataset.amount_expense;
            nameCategoryExpense = button.dataset.namecategoryexpense || '';
            const namePaymentExpense = button.dataset.namepaymentexpense || '';
            dateFirst = button.dataset.datefirst || '';
            dateSecond = button.dataset.datesecond || '';
            // ustaw ID do ukrytego pola, jeśli jest
            const hiddenInput = document.getElementById('deleteExpense');
            if (hiddenInput) hiddenInput.value = id;


            // 🧩 sformatuj szczegóły transakcji do wyświetlenia
            const detailsDiv = document.getElementById('deleteExpenseDetails');
            if (detailsDiv) {
                detailsDiv.innerHTML = `
                    <div>📅 <strong>Date:</strong> ${date}</div>
                    <div>📂 <strong>Category:</strong> ${nameCategoryExpense}</div>
                    <div>💳 <strong>Payment method:</strong> ${namePaymentExpense}</div>
                    <div>💰 <strong>Amount:</strong> ${parseFloat(amount).toFixed(2)} PLN</div>
                `;
            }

            modal.show();
        });

    });

    // Obsługa zapisu z modala
    document.getElementById('deleteExpenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();


        const formData = {
            id: document.getElementById('deleteExpense').value,
            dateFirst: dateFirst,
            dateSecond: dateSecond,
            date: date
        }
        console.log(formData);
        try {
            const response = await fetch('/balances/delete-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.status === 'success') {
                console.log('Nowy dane:', data);
                // 🔹 Usuń element z listy bez odświeżania
                const liToRemove = document.querySelector(
                    `#expenseDetailsBalanceCategoriesList [data-id="${id}"]`
                );

                if (liToRemove) {
                    liToRemove.closest('li').remove();
                    showToast(`Expense category "${nameCategoryExpense}" deleted successfully.`);
                } else {
                    console.warn('⚠️ Nie znaleziono elementu <li> do usunięcia.');
                }
                if (data.expenses && data.expenses.length > 0) {
                    refreshExpenseList(data.expenses);
                    expensesData = data.expenses.map(i => ({
                        id: i.id,
                        Category: i.Category,
                        Amount: parseFloat(i.Amount),
                        date: i.date,
                        info: i.info || ''
                    }));

                    // 🔹 Ponowne narysowanie wykresu
                    drawExpenseChart();
                }

                let sumEl = document.getElementById('balanceSum');
                if (sumEl && data.sum && data.sum !== undefined) {
                    sumEl.textContent = `${data.sum} PLN`;
                } else {
                    console.warn('Nie znaleziono elementu sumDetailsExpense lub brak danych w JSON:', data);
                }

                let sumEldetails = document.getElementById('sumDetailsExpense');
                if (sumEldetails && data.sum && data.sumAllExpenses !== undefined) {
                    sumEldetails.textContent = `${data.sumAllExpenses} PLN`;
                } else {
                    console.warn('Nie znaleziono elementu sumDetailsExpense lub brak danych w JSON:', data);
                }

                let sumElementTop = document.getElementById('sumALlExpensesTop');
                if (sumElementTop) {
                    sumElementTop.textContent = `${data.sumAllExpenses} PLN`;
                }
                modal.hide();
            }


        } catch (err) {
            console.error(err);
        };
    });
});
