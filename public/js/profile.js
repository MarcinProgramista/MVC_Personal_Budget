const getDetailsUser = async (name) => {
    try {
        const res = await fetch(`/profile/get-user-data?name=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('ERROR', e);
        return {}; // zwracamy pusty obiekt w razie błędu
    }
};

// Nasłuchiwanie zmian w polu name
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('inputName');
    const userDataDiv = document.getElementById('userData');
    if (!input || !userDataDiv) return;

    input.addEventListener('input', async function () {
        const nameValue = this.value.trim();

        // Jeśli nazwa jest pusta lub za krótka, pozostaw pole puste
        if (nameValue.length < 3) {
            userDataDiv.innerHTML = '';
            return;
        }

        const data = await getDetailsUser(nameValue);

        // Jeśli nie ma danych lub name jest undefined, wyświetl komunikat
        if (!data || !data.name) {
            userDataDiv.innerHTML = `<p class="text-dark">Name is required</p>`;
        } else {
            userDataDiv.innerHTML = `
                <p>Name: ${data.name}</p>
                <p>Email: ${data.email || ''}</p>
            `;
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const toggleProfileBtn = document.getElementById("toggleProfileBtn");
    const profileData = document.getElementById("profileData");
    const toggleProfileArrow = document.getElementById("toggleProfileArrow");

    if (toggleProfileBtn && profileData && toggleProfileArrow) {
        toggleProfileBtn.addEventListener("click", function () {
            profileData.classList.toggle("show");
            toggleProfileArrow.innerHTML = profileData.classList.contains("show")
                ? '<i class="fas fa-arrow-up text-warning"></i>'
                : '<i class="fas fa-arrow-down text-warning"></i>';
        });
    }
});



document.addEventListener("DOMContentLoaded", function () {
    const toggleListBtn = document.getElementById("toggleListBtn");
    const expenseListContainer = document.getElementById("expenseListContainer");
    const toggleArrow = document.getElementById("toggleArrow");

    if (toggleListBtn && expenseListContainer) {
        toggleListBtn.addEventListener("click", function () {
            expenseListContainer.classList.toggle("show");
            // obrót strzałki w zależności od stanu
            toggleArrow.innerHTML = expenseListContainer.classList.contains("show")
                ? '<i class="fas fa-arrow-up text-warning"></i>'
                : '<i class="fas fa-arrow-down text-warning"></i>';
        });
    }

});

document.addEventListener("DOMContentLoaded", function () {
    const toggleListIncomesBtn = document.getElementById("toggleListIncomesBtn");
    const incomeListContainer = document.getElementById("incomeListContainer");
    const toggleArrow = document.getElementById("toggleIncomesArrow"); // <-- unikalne

    if (toggleListIncomesBtn && incomeListContainer && toggleArrow) {
        toggleListIncomesBtn.addEventListener("click", function () {
            incomeListContainer.classList.toggle("show");
            toggleArrow.innerHTML = incomeListContainer.classList.contains("show")
                ? '<i class="fas fa-arrow-up text-warning"></i>'
                : '<i class="fas fa-arrow-down text-warning"></i>';
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const toggleListPaymentMethodBtn = document.getElementById("toggleListPaymentMethodBtn");
    const paymentMethodListContainer = document.getElementById("paymentMethodListContainer");
    const togglePaymentArrow = document.getElementById("togglePaymentArrow");

    if (toggleListPaymentMethodBtn && paymentMethodListContainer && togglePaymentArrow) {
        toggleListPaymentMethodBtn.addEventListener("click", function () {


            const isVisible = paymentMethodListContainer.classList.toggle("show");
            paymentMethodListContainer.classList.toggle("hidden", !isVisible);

            togglePaymentArrow.innerHTML = isVisible
                ? '<i class="fas fa-arrow-up text-warning"></i>'
                : '<i class="fas fa-arrow-down text-warning"></i>';
        });
    } else {
        console.warn("❌ Nie znaleziono któregoś elementu!");
    }
});







document.addEventListener('DOMContentLoaded', () => {
    // Expense categories
    const deleteExpenseModalEl = document.getElementById('deleteExpenseCategoryModal');
    const deleteExpenseModal = deleteExpenseModalEl ? new bootstrap.Modal(deleteExpenseModalEl) : null;
    let selectedExpenseCategoryId = null;
    let selectedExpenseCategoryName = null;

    document.getElementById('expenseCategoriesList')?.addEventListener('click', (e) => {
        const icon = e.target.closest('.delete-expense-category');
        if (!icon) return;

        selectedExpenseCategoryId = icon.dataset.id;
        selectedExpenseCategoryName = icon.dataset.name;

        document.getElementById('deleteCategoryName').textContent = `"${selectedExpenseCategoryName}"`;
        document.getElementById('deleteCategoryId').value = selectedExpenseCategoryId;

        if (deleteExpenseModal) deleteExpenseModal.show();
    });

    document.getElementById('confirmDeleteCategoryBtn')?.addEventListener('click', async () => {
        if (!selectedExpenseCategoryId) return;

        try {
            const res = await fetch('/category-expense/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedExpenseCategoryId,
                    name: selectedExpenseCategoryName
                })
            });

            const data = await res.json();

            if (data.success) {
                const li = document.querySelector(`.delete-expense-category[data-id="${selectedExpenseCategoryId}"]`)?.closest('li');
                if (li) li.remove();

                deleteExpenseModal.hide();
                document.body.classList.remove('modal-open');
                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            } else {
                alert(data.message || 'Failed to delete category.');
            }
        } catch (err) {
            console.error(err);
            alert('Server error.');
        }
    });

});


document.addEventListener('DOMContentLoaded', () => {
    const editModalEl = document.getElementById('editExpenseCategoryModal');
    const editModal = new bootstrap.Modal(editModalEl);

    // Funkcja tworząca element do wyświetlania błędów
    function createEditFormError() {
        const modalBody = document.querySelector('#editExpenseCategoryModal .modal-body');
        const p = document.createElement('p');
        p.id = 'editCategoryFormError';
        p.className = 'text-danger mt-2';
        modalBody.appendChild(p);
        return p;
    }

    const formError = document.getElementById('editCategoryFormError') || createEditFormError();

    // 🔹 Obsługa kliknięcia na ikonę edycji
    document.querySelectorAll('.edit-expense-category').forEach(icon => {
        icon.addEventListener('click', () => {
            const id = icon.dataset.id;
            const name = icon.dataset.name;
            const cashLimit = icon.dataset.cash_limit || '';
            const isLimitActive = parseInt(icon.dataset.is_limit_active) === 1;

            console.log(`📝 Editing category: ID=${id}, Name=${name}, Limit=${cashLimit}, Active=${isLimitActive}`);

            // Reset błędu
            formError.textContent = '';

            // Ustaw dane w polach
            document.getElementById('editCategoryId').value = id;
            document.getElementById('editCategoryName').value = name;
            const limitInput = document.getElementById('editCategoryLimit');
            const checkbox = document.getElementById('editCategoryLimitActive');

            limitInput.value = cashLimit;
            checkbox.checked = isLimitActive;
            limitInput.disabled = !isLimitActive;
            limitInput.placeholder = isLimitActive ? "Enter limit or leave empty" : "Limit is blocked now";

            // 🔄 Obsługa zmiany checkboxa
            checkbox.onchange = () => {
                limitInput.disabled = !checkbox.checked;
                limitInput.placeholder = checkbox.checked ? "Enter limit or leave empty" : "Limit is blocked now";
                if (!checkbox.checked) limitInput.value = '';
            };

            // Pokaż modal
            editModal.show();
        });
    });

    // 🔹 Obsługa przycisku "Save Changes"
    document.getElementById('saveEditCategoryBtn')?.addEventListener('click', async () => {
        const id = document.getElementById('editCategoryId').value.trim();
        const name = document.getElementById('editCategoryName').value.trim();
        const cashLimit = document.getElementById('editCategoryLimit').value.trim();
        const isLimitActive = document.getElementById('editCategoryLimitActive').checked ? 1 : 0;

        if (!id || !name) {
            formError.textContent = "Category name cannot be empty.";
            return;
        } else {
            formError.textContent = '';
        }

        try {
            const res = await fetch('/category-expense/edit-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, cash_limit: cashLimit, is_limit_active: isLimitActive })
            });

            const data = await res.json();

            if (data.success) {
                // 🔹 Aktualizacja listy w UI
                const li = document.querySelector(`.edit-expense-category[data-id="${id}"]`).closest('li');
                if (li) {
                    // Zaktualizuj nazwę
                    li.querySelector('.fw-bold').textContent = name;

                    // Zaktualizuj limit
                    const limitElem = li.querySelector('small.text-muted');
                    if (isLimitActive && cashLimit) {
                        if (limitElem) {
                            limitElem.textContent = `Limited: ${cashLimit} PLN`;
                        } else {
                            const small = document.createElement('small');
                            small.className = 'text-muted';
                            small.textContent = `Limited: ${cashLimit} PLN`;
                            li.querySelector('.d-flex.flex-column').appendChild(small);
                        }
                    } else if (limitElem) {
                        limitElem.remove();
                    }

                    // Zaktualizuj dataset w ikonie
                    const icon = li.querySelector('.edit-expense-category');
                    icon.dataset.name = name;
                    icon.dataset.cash_limit = cashLimit;
                    icon.dataset.is_limit_active = isLimitActive;
                }

                // Zamknij modal
                editModal.hide();

                // Pokaż toast powiadomienie
                showToast(`Category "${name}" updated successfully!`);
            } else {
                formError.textContent = data.message || 'Update failed.';
            }
        } catch (err) {
            console.error(err);
            formError.textContent = 'Server error.';
        }
    });

    // 🔹 Funkcja toast powiadomień
    function showToast(message) {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.position = 'fixed';
            toastContainer.style.top = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = 1055;
            document.body.appendChild(toastContainer);
        }

        const toastEl = document.createElement('div');
        toastEl.className = 'toast align-items-center text-white bg-success border-0 show';
        toastEl.setAttribute('role', 'alert');
        toastEl.style.minWidth = '200px';
        toastEl.style.marginBottom = '10px';
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.remove()"></button>
            </div>
        `;
        toastContainer.appendChild(toastEl);

        setTimeout(() => toastEl.remove(), 3000);
    }
});

// profile.js
document.addEventListener('DOMContentLoaded', () => {
    const deleteModalEl = document.getElementById('deleteCategoryModal');
    const deleteModal = deleteModalEl ? new bootstrap.Modal(deleteModalEl) : null;
    let selectedCategoryId = null;

    // Delegacja zdarzeń: kliknięcia na ikony kosza
    document.getElementById('expenseCategoriesList')?.addEventListener('click', (e) => {
        const icon = e.target.closest('.delete-expense-category');
        if (!icon) return;

        const id = icon.dataset.id;
        const name = icon.dataset.name;

        selectedCategoryId = id;
        document.getElementById('deleteCategoryName').textContent = `"${name}"`;
        document.getElementById('deleteCategoryId').value = id;

        if (deleteModal) deleteModal.show();
    });
});




