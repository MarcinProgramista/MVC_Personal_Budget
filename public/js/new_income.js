document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('incomeCategorySelect');
    const dateInput = document.querySelector('input[name="dateIncome"]');
    const amountInput = document.querySelector('input[name="amount"]');
    const div = document.getElementById('selectedCategoryDiv');
    const p = document.getElementById('selectedCategoryH1');
    const h3 = document.getElementById('selectedCategoryH3');
    const secondInfo = document.getElementById('secondInfoP');
    const expectedMoneyInCategory = document.getElementById('expectedMoneyInCategory');

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // 🔹 Funkcja do pobierania danych (używana przy zmianie kategorii lub daty)
    async function fetchIncomeData() {
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption || selectedOption.disabled) return;

        const selectedId = selectedOption.dataset.id;
        const selectedName = selectedOption.value;
        const selectedDate = dateInput.value;
        const selectedAmount = amountInput.value;

        if (!selectedId || selectedId === "undefined" || selectedId === null) {
            return;
        }
        if (!selectedDate) {
            return;
        }


        const monthNumber = new Date(selectedDate).getMonth() + 1;
        const monthName = monthNames[monthNumber - 1];

        try {
            const response = await fetch('/incomes/checkAmountForMonth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedId, month: monthNumber })
            });

            const data = await response.json();

            if (data.status === 'ok') {
                const amount = parseFloat(data.sum);
                const amountAll = parseFloat(data.sumAllCategories);
                const expectedMoney = parseFloat(data.expectedMoney);
                if (amount > 0) {
                    p.innerHTML = `
                        <span class="text-light">You received from category </span> 
                        <strong class="text-warning">${selectedName}</strong> 
                        <span class="text-success fw-bold">${amount.toFixed(2)} PLN</span> 
                        <span class="text-light">in <strong class="text-warning">${monthName}</strong>.</span>
                    `;
                } else {
                    p.innerHTML = `
                        <span class="text-light">In</span> 
                        <strong class="text-warning">${monthName}</strong>, 
                        <span class="text-light">you haven't received any money from category </span> 
                        <strong class="text-warning">(${selectedName})</strong>.
                    `;
                    secondInfo.innerHTML = `
                    <span class="text-success fw-bold">${amountAll.toFixed(2)} PLN</span>
                `;
                }

                // 🔸 Zawsze pokazuj łączną kwotę
                secondInfo.innerHTML = `
                    <span class="text-success fw-bold">${amountAll.toFixed(2)} PLN</span>
                `;
                if (expectedMoney > 0) {
                    expectedMoneyInCategory.innerHTML = `
                    <span class="text-light fw-bold">In this month you expecting  <span class="text-success fw-bold">${expectedMoney.toFixed(2)} PLN</span> PLN</span>
                `;
                } else {
                    expectedMoneyInCategory.innerHTML = `
                    <span class="text-light fw-bold"> Expexted money for this month wasn't set yet</span>
                `;
                }

                // 🔸 Pokaż kartę z wynikami
                div.classList.remove('hidden1');
                h3.classList.remove('hidden');
            } else {
                p.textContent = "Error fetching data.";
                div.classList.remove('hidden1');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            p.textContent = "Server error, please try again later.";
            div.classList.remove('hidden1');
        }
    }

    // 🔹 Nasłuchiwanie na zmianę kategorii i daty (obie wywołują async update)
    select.addEventListener('change', fetchIncomeData);
    dateInput.addEventListener('change', fetchIncomeData);
    amountInput.addEventListener('change', fetchIncomeData);
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("fromLogin");
    const amountInput = document.getElementById("amount");
    const dateInput = document.querySelector('input[name="dateIncome"]');
    const categorySelect = document.getElementById("incomeCategorySelect");

    form.addEventListener("submit", function (event) {
        let valid = true;

        // Usuń wszystkie stare komunikaty
        document.querySelectorAll(".custom-alert").forEach(el => el.remove());

        // --- 1️⃣ Walidacja kwoty ---
        const amountValue = parseFloat(amountInput.value);
        if (isNaN(amountValue) || amountValue <= 0) {
            showError(amountInput, "Please enter a valid amount greater than zero.");
            valid = false;
        }

        // --- 2️⃣ Walidacja daty ---
        if (!dateInput.value) {
            showError(dateInput, "Please select a valid date.");
            valid = false;
        }

        // --- 3️⃣ Walidacja kategorii ---
        if (!categorySelect.value || categorySelect.selectedIndex === 0) {
            showError(categorySelect, "Please choose a category.");
            valid = false;
        }

        if (!valid) {
            event.preventDefault();
        }
    });

    // 🔸 Nasłuchiwanie na zmiany — usuwa komunikaty po poprawce
    amountInput.addEventListener("input", () => removeError(amountInput));
    dateInput.addEventListener("input", () => removeError(dateInput));
    categorySelect.addEventListener("change", () => removeError(categorySelect));

    // 🔹 Funkcja do wyświetlania błędu
    function showError(element, message) {
        removeError(element); // usuń poprzedni komunikat jeśli istnieje

        const alert = document.createElement("div");
        alert.className = "custom-alert text-warning mt-2 p-2 rounded border border-warning";
        alert.style.backgroundColor = "rgba(255, 193, 7, 0.1)";
        alert.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i> ${message}`;

        // wstaw komunikat pod pole
        element.closest(".input-group")
            ? element.closest(".input-group").after(alert)
            : element.after(alert);

        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 400);
    }

    // 🔹 Funkcja do usuwania błędu
    function removeError(element) {
        const alert = element.closest(".input-group")
            ? element.closest(".input-group").nextElementSibling
            : element.nextElementSibling;

        if (alert && alert.classList.contains("custom-alert")) {
            alert.remove();
        }
    }
});
