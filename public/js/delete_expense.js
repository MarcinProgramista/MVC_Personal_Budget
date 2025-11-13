document.addEventListener('DOMContentLoaded', function () {
    const deleteButtonsExpense = document.querySelectorAll('.open-delete-expense-details-balance-modal');
    const modalElementDelete = document.getElementById('deleteExpenseModal');
    const modal = new bootstrap.Modal(modalElementDelete);

    // Otwieranie modala i wypełnianie pól
    deleteButtonsExpense.forEach(button => {
        button.addEventListener('click', () => {
            console.log(button.dataset);

            const id = button.dataset.id;
            const date = button.dataset.date || '';
            const amount = button.dataset.amount_expense;
            const nameCategoryExpense = button.dataset.namecategoryexpense || '';
            const namePaymentExpense = button.dataset.namepaymentexpense || '';

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
});