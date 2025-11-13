document.addEventListener('DOMContentLoaded', function () {
    const editButtonsExpense = document.querySelectorAll('.open-edit-expense-details-balance-modal');
    const modalElement = document.getElementById('editExpenseModal');
    const modal = new bootstrap.Modal(modalElement);

    // Otwieranie modala i wypełnianie pól
    editButtonsExpense.forEach(button => {
        button.addEventListener('click', () => {
            //console.log(button.dataset);

            const id = button.dataset.id;
            const date = button.dataset.date || '';
            const amount = button.dataset.amount_expense;
            const categoryId = button.dataset.id_category_expense;
            const paymentId = button.dataset.id_payment_expense;
            const info = button.dataset.info_expense || '';
            const dateFirst = button.dataset.datefirst || '';
            const dateSecond = button.dataset.datesecond || '';

            document.getElementById('editExpeneId').value = id;
            document.getElementById('editExpeneDateFirst').value = dateFirst;
            document.getElementById('editExpeneDateSecond').value = dateSecond;
            document.getElementById('editExpenseDate').value = date;
            document.getElementById('editExpenseAmount').value = amount;
            document.getElementById('editExpenseInfo').value = info;

            const select = document.getElementById('editExpenseCategory');
            if (select) select.value = categoryId;

            const selectPayment = document.getElementById('editExpensePayment');
            if (selectPayment) selectPayment.value = paymentId;

            modal.show();
        });
    });

    // Obsługa zapisu z modala
    document.getElementById('editExpenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            id: document.getElementById('editExpeneId').value,
            category_id: document.getElementById('editExpenseCategory').value,
            payment_id: document.getElementById('editExpensePayment').value,
            amount: parseFloat(document.getElementById('editExpenseAmount').value).toFixed(2),
            info: document.getElementById('editExpenseInfo').value,
            date: document.getElementById('editExpenseDate').value,
            name: document.getElementById('editExpenseCategory').selectedOptions[0].text,
            name_payment: document.getElementById('editExpensePayment').selectedOptions[0].text,
            dateFirst: document.getElementById('editExpeneDateFirst').value,
            dateSecond: document.getElementById('editExpeneDateSecond').value
        };

        console.log(formData);

        try {
            const response = await fetch('/balances/update-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.status === 'success') {
                console.log('Zaktualizowano:', data.updatedExpense);
                console.log('Nowy balans:', data.totals.balance);
                console.log('Nowy dane:', data);
                // zamknij modal
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
                // ---- 1. Aktualizacja listy przychodów ----
                const li = document.querySelector(`[data-expense-id="${formData.id}"]`);
                if (li) {
                    //CATEGORY NAME
                    li.querySelector('.fw-bold').textContent = formData.name;
                    // info
                    let infoDiv = li.querySelector('.text-warning');
                    if (infoDiv) {
                        infoDiv.textContent = formData.info;
                    } else if (formData.info) {
                        infoDiv = document.createElement('div');
                        infoDiv.classList.add('ms-4', 'text-start');
                        infoDiv.innerHTML = `<small class="text-warning"><i class="bi bi-journal-text me-1"></i>${formData.info}</small>`;
                        li.querySelector('.d-flex.flex-column').appendChild(infoDiv);
                    }
                    // kwota
                    li.querySelector('strong').textContent = formData.amount + ' PLN';
                    // data
                    const dateDiv = li.querySelector('.text-info');
                    if (dateDiv) {
                        const formattedDate = new Date(formData.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        dateDiv.innerHTML = `<i class="fas fa-calendar-alt me-1"></i>${formattedDate}`;
                    }
                    // payment
                    const paymentDiv = li.querySelector('.text-primary');
                    paymentDiv.innerHTML = `<i class="bi bi-credit-card me-1"></i>${formData.name_payment}`;
                }



                let sumEl = document.getElementById('sumDetailsExpense');
                if (sumEl && data.totals && data.totals.sumAllExpenses !== undefined) {
                    sumEl.textContent = `${data.totals.sumAllExpenses} PLN`;
                } else {
                    console.warn('Nie znaleziono elementu sumDetailsExpense lub brak danych w JSON:', data);
                }

                let sumElementTop = document.getElementById('sumALlExpensesTop');
                if (sumElementTop) {
                    sumElementTop.textContent = `${data.totals.sumAllExpenses} PLN`;
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

            }

        } catch (err) {
            console.error(err);
        }
    });

});
function refreshExpenseList(expenses) {
    const list = document.getElementById('expenseBalanceCategoriesList');
    if (!list) return;

    // wyczyść starą listę
    list.innerHTML = '';

    // zbuduj nową listę
    expenses.forEach(expense => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between border border-warning align-items-center text-light';
        li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex flex-row align-items-center">
                        <i class="fas fa-circle me-2 text-success"></i>
                        <span class="fw-bold">${expense.Category}</span>
                    </div>
                </div>
                <span class="d-flex flex-row">
                    <span class="d-flex align-items-center">
                        <strong class="text-light text-center mx-2">${parseFloat(expense.Amount).toFixed(2)} PLN</strong>
                    </span>
                </span>
            `;
        list.appendChild(li);
    });
}
