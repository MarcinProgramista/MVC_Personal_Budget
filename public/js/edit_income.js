document.addEventListener('DOMContentLoaded', function () {
    const editButtons = document.querySelectorAll('.open-edit-income-details-balance-modal');
    const modalElement = document.getElementById('editIncomeModal');
    const modal = new bootstrap.Modal(modalElement);
    let dateFirst = '';
    let dateSecond = '';
    const safeToast = (msg, type = "info") => {
        if (typeof showToast === "function") showToast(msg, type);
        else console.log(msg);
    };
    // Otwieranie modala i wypełnianie pól
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const categoryId = button.dataset.idcategory;
            const amount = button.dataset.amount;
            const info = button.dataset.info || '';
            const date = button.dataset.date || '';
            dateFirst = button.dataset.datefirst || '';
            dateSecond = button.dataset.datesecond || '';

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
            name: document.getElementById('editIncomeCategory').selectedOptions[0].text,
            dateFirst: dateFirst,
            dateSecond: dateSecond,
            csrf_token: document.getElementById('editIncomeCsrf').value,
        };

        // ⏳ Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const res = await fetch('/balances/update-income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            if (res.status === 403) {
                showToast("Access denied. Please log in again.", "error");
                setTimeout(() => (window.location.href = "/login"), 1500);
                return;
            }

            if (res.status >= 500) {
                showToast("Server error. Try again later.", "error");
                return;
            }

            let data = await res.json();

            if (!data.status) {
                showToast(data.message || "Failed to edit category.", "error");
                return;
            }
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




                updateBalanceUIForIncomes(
                    data.received.balanceSum,
                    data.received.incomes ? data.received.incomes.length : 0,
                    data.received.sumAllExpenses
                );


                drawChart(); // funkcja rysująca wykres Google Charts
            } else {
                alert('Update failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
        }
    });
});

function updateBalanceUIForIncomes(sum, incomesCount, expensesCount) {
    sum = parseFloat(sum);

    const balanceSumEl = document.getElementById('balanceSum');
    const balanceContainer = balanceSumEl ? balanceSumEl.closest('div') : null;

    // Usuń stary alert
    const oldAlert = document.getElementById('budgetAlert');
    if (oldAlert) oldAlert.remove();

    if (!balanceSumEl) return;

    // 🔹 Zaktualizuj wartość balansu
    balanceSumEl.textContent = `${sum.toFixed(2)} PLN`;

    // 🔹 Kolor kwoty
    if (balanceContainer) {
        balanceContainer.classList.remove('text-success', 'text-danger', 'text-warning');
        if (sum > 0) balanceContainer.classList.add('text-success');
        else if (sum < 0) balanceContainer.classList.add('text-danger');
        else balanceContainer.classList.add('text-warning');
    }

    // 🔹 Zbuduj alert
    const alert = document.createElement('div');
    alert.id = 'budgetAlert';
    alert.className = 'alert custom-alert d-flex flex-column justify-content-center align-items-center text-center';
    alert.setAttribute('role', 'alert');

    if ((incomesCount === 0 || !incomesCount) && (expensesCount === 0 || !expensesCount) && sum === 0) {
        alert.classList.add('alert-info');
        alert.innerHTML = `
            <i class="bi bi-credit-card mb-2 fs-3"></i>
            <div class="fst-italic">
                It looks like you haven’t added any incomes or expenses yet.
                Start adding your first transactions!
            </div>
        `;
    } else if (sum < 0) {
        alert.classList.add('alert-danger');
        alert.innerHTML = `
            <i class="bi bi-emoji-frown mb-2 fs-3"></i>
            <div class="fst-italic">
                You're spending more than you earn. Try to review your expenses!
            </div>
        `;
    } else if (sum > 0) {
        alert.classList.add('alert-success');
        alert.innerHTML = `
            <i class="bi bi-emoji-smile mb-2 fs-3"></i>
            <div class="fst-italic">
                Great! You're earning more than you spend. Keep it going!
            </div>
        `;
    } else {
        alert.classList.add('alert-warning');
        alert.innerHTML = `
            <i class="bi bi-emoji-neutral mb-2 fs-3"></i>
            <div class="fst-italic">
                Your budget is perfectly balanced.
            </div>
        `;
    }

    // Wstaw alert pod sekcją balansu
    const sumContainer = balanceSumEl.closest('.justify-content-center');
    if (sumContainer && sumContainer.parentNode) {
        sumContainer.parentNode.insertBefore(alert, sumContainer.nextSibling);
    }
}

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
