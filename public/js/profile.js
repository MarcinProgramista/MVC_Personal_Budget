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
    const form = document.getElementById('addExpenseCategoryForm');
    const inputName = document.getElementById('inputName');
    const inputCashLimit = document.getElementById('inputCashLimit');
    const categoryError = document.getElementById('categoryError');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Resetowanie błędu
        inputName.classList.remove('is-invalid');
        categoryError.textContent = '';

        const name = inputName.value.trim();
        const cashLimit = inputCashLimit.value;

        if (!name) {
            inputName.classList.add('is-invalid');
            categoryError.textContent = 'Category name is required.';
            return;
        }

        try {
            const res = await fetch('/category-expense/add-expense-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `name=${encodeURIComponent(name)}&cash_limit=${encodeURIComponent(cashLimit)}`
            });

            const data = await res.json();

            if (data.success) {
                // Sukces: można np. dodać kategorię do listy w UI i zamknąć modal
                const modalEl = document.getElementById('addExpenseCategoryModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();

                // Opcjonalnie: dodanie do listy kategorii dynamicznie
                const list = document.getElementById('expenseCategoriesList');
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center text-dark';
                li.innerHTML = `
                    <div class="d-flex flex-column">
                        <span class="fw-bold">${data.category.name}</span>
                        ${data.category.cash_limit ? `<small class="text-muted">Limited: ${data.category.cash_limit} PLN</small>` : ''}
                    </div>
                    <span>
                        <i class="fas fa-pencil-alt text-success me-2"></i>
                        <i class="fas fa-trash-alt text-danger"></i>
                    </span>
                `;
                list.appendChild(li);

                // Reset formularza
                form.reset();

            } else {
                // Wyświetlenie błędu walidacji z serwera
                inputName.classList.add('is-invalid');
                categoryError.textContent = data.message || 'Error occurred';
            }

        } catch (err) {
            console.error(err);
            inputName.classList.add('is-invalid');
            categoryError.textContent = 'Network error';
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const deleteModalEl = document.getElementById('deleteExpenseCategoryModal');
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

    // Obsługa przycisku potwierdzenia usunięcia
    document.getElementById('confirmDeleteCategoryBtn')?.addEventListener('click', async () => {
        const id = selectedCategoryId;
        if (!id) return;

        try {
            const res = await fetch('/category-expense/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            const data = await res.json();

            if (data.success) {
                // Znajdujemy ikonę kosza po id i usuwamy cały li
                const li = document.querySelector(`.delete-expense-category[data-id="${id}"]`)?.closest('li');
                if (li) li.remove();
                deleteModal.hide();
            } else {
                alert(data.error || 'Something went wrong.');
            }
        } catch (err) {
            console.error(err);
            alert('Server error.');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    console.log("🧩 Edit Expense Category JS loaded");

    const editModalEl = document.getElementById('editExpenseCategoryModal');
    const editModal = new bootstrap.Modal(editModalEl);

    // 🔹 Obsługa kliknięcia na ikonę edycji
    document.querySelectorAll('.edit-expense-category').forEach(icon => {
        icon.addEventListener('click', () => {
            const id = icon.dataset.id;
            const name = icon.dataset.name;
            const cashLimit = icon.dataset.cash_limit || '';

            console.log(`📝 Editing category: ID=${id}, Name=${name}, Limit=${cashLimit}`);

            // Ustaw dane w modalu
            document.getElementById('editCategoryId').value = id;
            document.getElementById('editCategoryName').value = name;
            document.getElementById('editCategoryLimit').value = cashLimit;

            // Pokaż modal
            editModal.show();
        });
    });

    // 🔹 Obsługa przycisku "Save Changes"
    document.getElementById('saveEditCategoryBtn')?.addEventListener('click', async () => {
        const id = document.getElementById('editCategoryId').value.trim();
        const name = document.getElementById('editCategoryName').value.trim();
        const cashLimit = document.getElementById('editCategoryLimit').value.trim();

        if (!id || !name) {
            alert("Category name cannot be empty.");
            return;
        }

        try {
            const res = await fetch('/category-expense/edit-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name,
                    cash_limit: cashLimit
                })
            });

            const data = await res.json();

            if (data.success) {
                // 🔹 Aktualizuj element listy bez przeładowania
                const li = document.querySelector(`.edit-expense-category[data-id="${id}"]`).closest('li');
                if (li) {
                    li.querySelector('.fw-bold').textContent = name;

                    const limitElem = li.querySelector('small.text-muted');
                    if (cashLimit) {
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

                    // 🔹 zaktualizuj dataset w ikonie
                    const icon = li.querySelector('.edit-expense-category');
                    icon.dataset.name = name;
                    icon.dataset.cash_limit = cashLimit;
                }

                // ✅ Zamknij modal
                editModal.hide();
            } else {
                alert(data.message || 'Update failed.');
            }

        } catch (err) {
            console.error(err);
            alert('Server error.');
        }
    });
});

