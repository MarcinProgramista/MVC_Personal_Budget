document.addEventListener('DOMContentLoaded', function () {
    const deleteButtonsExpense = document.querySelectorAll('.open-delete-expense-details-balance-modal');
    const modalElementDelete = document.getElementById('deleteExpenseModal');
    const modal = new bootstrap.Modal(modalElementDelete);

    // Otwieranie modala i wypełnianie pól
    deleteButtonsExpense.forEach(button => {
        button.addEventListener('click', () => {
            console.log(button.dataset);

            modal.show();
        });
    });
});