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
