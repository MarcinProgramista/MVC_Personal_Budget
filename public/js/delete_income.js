document.addEventListener('DOMContentLoaded', function () {
    const deleteButtonsIncome = document.querySelectorAll('.open-delete-income-details-balance-modal');
    const modalElementDelete = document.getElementById('deleteIncomeModal');
    let id = "";
    let dateFirst = '';
    let nameCategoryIncome = '';
    let dateSecond = '';
    let date = '';
    if (!modalElementDelete) {
        console.error('Brak elementu #deleteIncomeModal w DOM!');
        return;
    }

    const modal = new bootstrap.Modal(modalElementDelete);

    deleteButtonsIncome.forEach(button => {
        button.addEventListener('click', () => {
            console.log(button.dataset);


            id = button.dataset.id;
            date = button.dataset.date || '';
            const amount = button.dataset.amount_income;
            nameCategoryIncome = button.dataset.namecategoryincome || '';

            dateFirst = button.dataset.datefirst || '';
            dateSecond = button.dataset.datesecond || '';
            // ustaw ID do ukrytego pola, jeśli jest
            const hiddenInput = document.getElementById('deleteIncome');
            if (hiddenInput) hiddenInput.value = id;
            // 🧩 sformatuj szczegóły transakcji do wyświetlenia
            const detailsDiv = document.getElementById('deleteIncomeDetails');
            if (detailsDiv) {
                detailsDiv.innerHTML = `
                    <div>📅 <strong>Date:</strong> ${date}</div>
                    <div>📂 <strong>Category:</strong> ${nameCategoryIncome}</div>
                    <div>💰 <strong>Amount:</strong> ${parseFloat(amount).toFixed(2)} PLN</div>
                `;
            }
            modal.show();
        });
    });

    // Obsługa zapisu z modala
    document.getElementById('deleteIncomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            id: document.getElementById('deleteIncome').value,
            dateFirst: dateFirst,
            dateSecond: dateSecond,
            date: date
        }
        console.log(formData);

        try {
            const response = await fetch('/balances/delete-income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.status === 'success') {
                //console.log(data);
                // 🔹 Usuń element z listy bez odświeżania
                const liToRemove = document.querySelector(
                    `#incomeDetailsBalanceCategoriesList [data-id="${id}"]`
                );

                if (liToRemove) {
                    liToRemove.closest('li').remove();
                    showToast(`Income category "${nameCategoryIncome}" deleted successfully.`);
                } else {
                    console.warn('⚠️ Nie znaleziono elementu <li> do usunięcia.');
                }

                let sumEl = document.getElementById('balanceSum');
                if (sumEl && data.sum && data.sum !== undefined) {
                    sumEl.textContent = `${data.sum} PLN`;
                } else {
                    console.warn('Nie znaleziono elementu sumIncomesDetails lub brak danych w JSON:', data);
                }

                let sumEldetails = document.getElementById('sumIncomesDetails');
                if (sumEldetails && data.sum && data.sumAllIncomes !== undefined) {
                    sumEldetails.textContent = `${data.sumAllIncomes} PLN`;
                } else {
                    console.warn('Nie znaleziono elementu sumIncomesDetails lub brak danych w JSON:', data);
                }

                let sumElementTop = document.getElementById('sumIncomes');
                if (sumElementTop) {
                    sumElementTop.textContent = `${data.sumAllIncomes} PLN`;
                }

                if (data.incomes && data.incomes.length > 0) {
                    refreshIncomeList(data.incomes);
                    incomesData = data.incomes.map(i => ({
                        id: i.id,
                        Category: i.Category,
                        Amount: parseFloat(i.Amount),
                        date: i.date,
                        info: i.info || ''
                    }));

                    // 🔹 Ponowne narysowanie wykresu
                    drawChart();
                }
                modal.hide();
            }
        } catch (err) {
            console.error(err);
        };
    });
});

function refreshIncomeList(incomes) {
    const list = document.getElementById('incomeBalanceCategoriesList');
    if (!list) return;

    // 🔹 Wyczyść starą listę
    list.innerHTML = '';

    // 🔹 Przebuduj ją na podstawie danych z serwera
    incomes.forEach(income => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between border border-warning align-items-center text-light';

        li.innerHTML = `
            <div class="d-flex flex-column">
                <div class="d-flex flex-row align-items-center">
                    <i class="fas fa-circle me-2 text-success"></i>
                    <span class="fw-bold">${income.Category}</span>
                </div>
            </div>
            <span class="d-flex flex-row">
                <span class="d-flex align-items-center">
                    <strong class="text-light text-center mx-2">${parseFloat(income.Amount).toFixed(2)} PLN</strong>
                </span>
            </span>
        `;

        list.appendChild(li);
    });
}
