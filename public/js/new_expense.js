document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("fromAddExpense");
    const amountInput = document.getElementById("amount");
    const dateInput = document.querySelector('input[name="dateExpense"]');
    const categorySelect = document.getElementById("expenseCategorySelect");
    const paymentSelect = document.getElementById("namePayment");
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
        // --- 3️⃣ Walidacja payment ---
        if (!paymentSelect.value || paymentSelect.selectedIndex === 0) {
            showError(paymentSelect, "Please choose a payment method.");
            valid = false;
        }

        // ❗ Zatrzymaj wysłanie formularza jeśli nieprawidłowy
        if (!valid) {
            event.preventDefault();
        }
    });
    // 🔸 Nasłuchiwanie na zmiany — usuwa komunikaty po poprawce
    amountInput.addEventListener("input", () => removeError(amountInput));
    dateInput.addEventListener("input", () => removeError(dateInput));
    categorySelect.addEventListener("change", () => removeError(categorySelect));
    paymentSelect.addEventListener("change", () => removeError(categorySelect));

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

    // 🔹 Funkcja pomocnicza do usuwania błędu (żeby nie dublowało)
    function removeError(element) {
        const nextEl = element.closest(".input-group")?.nextElementSibling;
        if (nextEl && nextEl.classList.contains("custom-alert")) {
            nextEl.remove();
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('expenseCategorySelect');
    const div = document.getElementById('selectedCategoryDiv');
    const p = document.getElementById('selectedCategoryH1');
    const h3 = document.getElementById('selectedCategoryH3');
    const limitExpenseH3 = document.getElementById('limitExpense');
    const dateInput = document.querySelector('input[name="dateExpense"]');
    const secondInfoP = document.getElementById('secondInfoP');
    const PaymentP = document.getElementById('selectedPaymentH1');
    const amountInput = document.getElementById('amount');

    let currentLimit = 0; // zapamiętuje limit kategorii
    let currentAmountSpent = 0; // zapamiętuje wydane środki

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // 🔹 Funkcja do pobrania danych (wywoływana przy zmianie kategorii lub daty)
    async function fetchExpenseData() {
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption || selectedOption.disabled) return;

        const selectedId = selectedOption.dataset.id;
        const selectedName = selectedOption.value;
        const selectedDate = dateInput.value;
        if (!selectedId || !selectedDate) return;

        const monthNumber = new Date(selectedDate).getMonth() + 1;
        const monthName = monthNames[monthNumber - 1];

        try {
            const response = await fetch('/expenses/checkAmountForMonth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedId, month: monthNumber })
            });

            const data = await response.json();

            if (data.status === 'ok') {
                const amount = parseFloat(data.sum);
                const limit = parseFloat(data.limitCategory);
                currentLimit = limit;
                currentAmountSpent = amount;

                if (amount > 0) {
                    p.innerHTML = `
                        <span class="text-success fw-bold">${amount.toFixed(2)} PLN</span> 
                        <span class="text-light">was spent for</span> 
                        <strong class="text-warning">${selectedName}</strong> 
                        <span class="text-light">in</span> 
                        <strong class="text-warning">${monthName}</strong>.
                    `;
                } else {
                    p.innerHTML = `
                        <span class="text-light">No expenses yet for</span> 
                        <strong class="text-warning">${selectedName}</strong> 
                        <span class="text-light">in</span> 
                        <strong class="text-warning">${monthName}</strong>.
                    `;
                }

                if (limit === 0) {
                    secondInfoP.innerHTML = `
                        <span class="text-light fw-bold">No limit set for 
                        <strong class="text-warning">${selectedName}</strong> 
                        in <strong class="text-warning">${monthName}</strong>.</span>
                    `;
                } else {
                    secondInfoP.innerHTML = `
                        <span class="text-light fw-bold">Limit: 
                        <span class="text-success fw-bold">${limit.toFixed(2)} PLN</span> 
                        for <strong class="text-warning">${selectedName}</strong> 
                        in <strong class="text-warning">${monthName}</strong>.</span>
                    `;
                }

                updateRemainingLimit();
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

    // 🔹 Funkcja obliczająca różnicę między limitem a wpisaną kwotą
    function updateRemainingLimit() {
        const enteredAmount = parseFloat(amountInput.value);
        if (isNaN(enteredAmount) || currentLimit === 0) {
            PaymentP.innerHTML = `<span class="text-light">No limit information yet.</span>`;
            return;
        }

        const remaining = currentLimit - (currentAmountSpent + enteredAmount);

        if (remaining >= 0) {
            PaymentP.innerHTML = `
                <span class="text-success fw-bold">${remaining.toFixed(2)} PLN</span> 
                <span class="text-light">left before reaching the limit.</span>
            `;
        } else {
            PaymentP.innerHTML = `
                <span class="text-danger fw-bold">${(remaining).toFixed(2)} PLN</span> 
                <span class="text-light">over the limit!</span>
            `;
        }
    }

    // 🔹 Nasłuchiwanie zdarzeń
    select.addEventListener('change', fetchExpenseData);
    dateInput.addEventListener('change', fetchExpenseData);
    amountInput.addEventListener('input', updateRemainingLimit);
});
