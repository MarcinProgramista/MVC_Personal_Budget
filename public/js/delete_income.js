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
            const amount = button.dataset.amount_expense;
            nameCategoryIncome = button.dataset.namecategoryexpense || '';

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
});