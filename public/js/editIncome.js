document.addEventListener('DOMContentLoaded', () => {
    const editModalEl = document.getElementById('editExpenseCategoryModal');
    const editModal = new bootstrap.Modal(editModalEl);

    const formError = document.getElementById('editCategoryFormError') || createEditFormError();

    // 🔹 Obsługa kliknięcia na ikonę edycji
    document.querySelectorAll('.edit-income-category').forEach(icon => {
        icon.addEventListener('click', () => {
            const id = icon.dataset.id;
            const name = icon.dataset.name;
            //const cashLimit = icon.dataset.cash_limit || '';

            console.log(`📝 Editing category: ID=${id}, Name=${name}, Limit=`);

            // Reset komunikatu błędu
            formError.textContent = '';

            // Ustaw dane w modalu
            //document.getElementById('editCategoryId').value = id;
            //document.getElementById('editCategoryName').value = name;
            // document.getElementById('editCategoryLimit').value = cashLimit;

            // Pokaż modal
            editModal.show();
        });
    });
    // 🔹 Funkcja do tworzenia elementu błędu w modalu
    function createEditFormError() {
        const modalBody = document.querySelector('#editExpenseCategoryModal .modal-body');
        const p = document.createElement('p');
        p.id = 'editCategoryFormError';
        p.className = 'text-danger mt-2';
        modalBody.appendChild(p);
        return p;
    }
})