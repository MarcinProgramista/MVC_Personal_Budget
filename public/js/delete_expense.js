document.addEventListener('DOMContentLoaded', function () {
    const deleteButtonsExpense = document.querySelectorAll('.open-delete-expense-details-balance-modal');
    const modalElementDelete = document.getElementById('deleteExpenseModal');
    let dateFirst = '';
    let dateSecond = '';
    if (!modalElementDelete) {
        console.error('Brak elementu #deleteExpenseModal w DOM!');
        return;
    }

    const modal = new bootstrap.Modal(modalElementDelete);

    deleteButtonsExpense.forEach(button => {
        button.addEventListener('click', () => {
            console.log(button.dataset);

            const id = button.dataset.id;
            const date = button.dataset.date || '';
            const amount = button.dataset.amount_expense;
            const nameCategoryExpense = button.dataset.namecategoryexpense || '';
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


    });
});
