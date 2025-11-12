document.addEventListener('DOMContentLoaded', function () {
    const editButtonsExpense = document.querySelectorAll('.open-edit-expense-details-balance-modal');
    const modalElement = document.getElementById('editExpenseModal');
    const modal = new bootstrap.Modal(modalElement);

    // Otwieranie modala i wypełnianie pól
    editButtonsExpense.forEach(button => {
        button.addEventListener('click', () => {

            const id = button.dataset.id;
            const date = button.dataset.date || '';
            const amount = button.dataset.amount_expense;
            const categoryId = button.dataset.id_category_expense;
            const paymentId = button.dataset.id_payment_expense;
            const info = button.dataset.info_expense || '';

            document.getElementById('editExpeneId').value = id;
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
        };

        console.log(formData);


    });

});
