document.addEventListener('DOMContentLoaded', function () {
    const editButtons = document.querySelectorAll('.open-edit-income-details-balance-modal');
    const modalElement = document.getElementById('editIncomeModal');
    const modal = new bootstrap.Modal(modalElement);

    // Otwieranie modala i wypełnianie pól
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const categoryId = button.dataset.idcategory;
            const amount = button.dataset.amount;
            const info = button.dataset.info || '';
            const date = button.dataset.date || '';

            document.getElementById('editIncomeId').value = id;
            document.getElementById('editIncomeAmount').value = amount;
            document.getElementById('editIncomeInfo').value = info;
            document.getElementById('editIncomeDate').value = date;

            const select = document.getElementById('editIncomeCategory');
            if (select) select.value = categoryId;

            modal.show();
        });
    });

    // Obsługa zapisu z modala
    document.getElementById('editIncomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            id: document.getElementById('editIncomeId').value,
            category_id: document.getElementById('editIncomeCategory').value,
            amount: parseFloat(document.getElementById('editIncomeAmount').value).toFixed(2),
            info: document.getElementById('editIncomeInfo').value,
            date: document.getElementById('editIncomeDate').value,
            name: document.getElementById('editIncomeCategory').selectedOptions[0].text
        };

        try {
            const response = await fetch('/balances/update-income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (data.status === 'success') {
                // zamknij modal
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();

                // ---- 1. Nadpisanie tablicy incomesData nowymi danymi z serwera ----
                if (data.received.incomes && data.received.incomes.length > 0) {
                    refreshIncomeList(data.received.incomes);
                    incomesData = data.received.incomes.map(i => ({
                        id: i.id,
                        Category: i.Category,
                        Amount: parseFloat(i.Amount),
                        date: i.date,
                        info: i.info || ''
                    }));
                }

                // ---- 1. Aktualizacja listy przychodów ----
                const li = document.querySelector(`[data-income-id="${formData.id}"]`);
                if (li) {
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
                }

                // ---- 2. Aktualizacja sumy przychodów ----
                const sumDiv = document.getElementById('sumIncomes');
                if (sumDiv) {
                    sumDiv.textContent = parseFloat(data.received.sumAllIncomes) + ' PLN';
                }

                const sumDivDetails = document.getElementById('sumIncomesDetails');
                if (sumDivDetails) {
                    sumDivDetails.textContent = parseFloat(data.received.sumAllIncomes) + ' PLN';
                }

                // ---- 3. Aktualizacja górnego balansu ----
                const balanceSumDiv = document.getElementById('balanceSum');
                if (balanceSumDiv && data.received.balanceSum !== undefined) {
                    balanceSumDiv.textContent = parseFloat(data.received.balanceSum).toFixed(2) + ' PLN';

                    const parentDiv = balanceSumDiv.parentElement;
                    parentDiv.classList.remove('text-success', 'text-danger', 'text-warning');
                    if (data.received.balanceSum > 0) parentDiv.classList.add('text-success');
                    else if (data.received.balanceSum < 0) parentDiv.classList.add('text-danger');
                    else parentDiv.classList.add('text-warning');
                }


                drawChart(); // funkcja rysująca wykres Google Charts
            } else {
                alert('Update failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
        }
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
