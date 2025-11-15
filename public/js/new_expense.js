document.addEventListener("DOMContentLoaded", function () {
    // --- ELEMENTY FORMULARZA ---
    const form = document.getElementById("fromAddExpense");
    const amountInput = document.getElementById("amount");
    const dateInput = document.querySelector('input[name="dateExpense"]');
    const categorySelect = document.getElementById("expenseCategorySelect");
    const paymentSelect = document.getElementById("namePayment");

    // --- ELEMENTY WYNIKU / PRAWA KOLUMNA ---
    const div = document.getElementById('selectedCategoryDiv');
    const p = document.getElementById('selectedCategoryH1');
    const h3 = document.getElementById('selectedCategoryH3');
    const limitExpenseH3 = document.getElementById('limitExpense');
    const secondInfoP = document.getElementById('secondInfoP');
    const PaymentP = document.getElementById('selectedPaymentH1');
    const paymentLimitP = document.getElementById('selectedPaymentLimit');
    let currentLimit = 0;
    let currentAmountSpent = 0;
    let currentPayment = 0;
    let currentAmountSpentPaymentMethod = 0;

    // ---  WALIDACJA FORMULARZA ---
    form.addEventListener("submit", function (event) {
        let valid = true;
        document.querySelectorAll(".custom-alert").forEach(el => el.remove());

        const amountValue = parseFloat(amountInput.value);
        if (isNaN(amountValue) || amountValue <= 0) {
            showError(amountInput, "Please enter a valid amount greater than zero.");
            valid = false;
        }

        if (!dateInput.value) {
            showError(dateInput, "Please select a valid date.");
            valid = false;
        }

        if (!categorySelect.value || categorySelect.selectedIndex === 0) {
            showError(categorySelect, "Please choose a category.");
            valid = false;
        }

        if (!paymentSelect.value || paymentSelect.selectedIndex === 0) {
            showError(paymentSelect, "Please choose a payment method.");
            valid = false;
        }

        if (!valid) {
            event.preventDefault();
        }
    });

    amountInput.addEventListener("input", () => removeError(amountInput));
    dateInput.addEventListener("input", () => removeError(dateInput));
    categorySelect.addEventListener("change", () => removeError(categorySelect));
    paymentSelect.addEventListener("change", () => removeError(paymentSelect));

    function showError(element, message) {
        removeError(element);
        const alert = document.createElement("div");
        alert.className = "custom-alert text-warning mt-2 p-2 rounded border border-warning";
        alert.style.backgroundColor = "rgba(255, 193, 7, 0.1)";
        alert.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i> ${message}`;
        element.closest(".input-group")
            ? element.closest(".input-group").after(alert)
            : element.after(alert);
        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 400);
    }

    function removeError(element) {
        // usuń komunikaty błędów znajdujące się tuż po elemencie lub po grupie .input-group
        const possibleAlerts = [
            element.nextElementSibling,
            element.closest(".input-group")?.nextElementSibling
        ];

        possibleAlerts.forEach(alert => {
            if (alert && alert.classList && alert.classList.contains("custom-alert")) {
                alert.remove();
            }
        });
    }

    // --- LOGIKA LIMITÓW I WYSWIETLANIA ---
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    async function fetchExpenseData() {
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        if (!selectedOption || selectedOption.disabled) return;

        const selectedId = selectedOption.dataset.id;
        const selectedName = selectedOption.value;
        const selectedDate = dateInput.value;
        if (!selectedId || selectedId === "undefined" || selectedId === null) return;


        const monthNumber = new Date(selectedDate).getMonth() + 1;
        const monthName = monthNames[monthNumber - 1];

        try {
            const response = await fetch('/expenses/checkAmountForMonth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedId, month: monthNumber })
            });

            const data = await response.json();

            console.log('➡️ Full backend response:', data);
            console.log('🔹 limitPayment raw:', data.limitPayment);

            if (data.status === 'ok') {
                const amount = parseFloat(data.sum);
                const limit = parseFloat(data.limitCategory);
                const payment = parseFloat(data.limitPayment);
                currentLimit = limit;
                currentAmountSpent = amount;
                currentPayment = payment;
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
    async function fetchPaymentData() {
        const selectedPayment = paymentSelect.options[paymentSelect.selectedIndex];
        const paymentInfoDiv = document.getElementById('paymentInfoDiv');
        const paymentMethodInfoDiv = document.getElementById('paymentMethodInfoDiv');
        const paymentMethodInfoP = document.getElementById('selectedPaymentMethodInfo');

        if (!selectedPayment || selectedPayment.disabled) {
            paymentLimitP.innerHTML = `<span class="text-light">Please select a payment method.</span>`;
            paymentInfoDiv.classList.remove('hidden1');
            return;
        }

        const paymentId = selectedPayment.dataset.id;
        if (!paymentId) return;

        try {
            const selectedDate = dateInput.value;
            const monthNumber = selectedDate ? new Date(selectedDate).getMonth() + 1 : (new Date().getMonth() + 1);

            const response = await fetch('/expenses/checkPaymentLimit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: paymentId, month: monthNumber })
            });

            const data = await response.json();
            console.log('💳 Payment backend response:', data);

            if (data.status === 'ok') {
                currentPayment = data.limitPayment ? parseFloat(data.limitPayment) : 0;
                currentAmountSpentPaymentMethod = data.sumPaymentMethodInMonth ? parseFloat(data.sumPaymentMethodInMonth) : 0;


                paymentLimitP.innerHTML = `
                <span class="text-success fw-bold">${currentPayment.toFixed(2)} PLN</span> 
                <span class="text-light">is your payment method limit.</span>
            `;
                paymentInfoDiv.classList.remove('hidden1');

                if (!paymentMethodInfoP) {
                    console.warn("⚠️ Missing element #selectedPaymentMethodInfo in DOM");
                    return;
                }

                if (currentAmountSpentPaymentMethod > 0) {
                    paymentMethodInfoP.innerHTML = `
                    <span class="text-success fw-bold">${currentAmountSpentPaymentMethod.toFixed(2)} PLN</span>
                    <span class="text-light">was already spent using this payment method this month.</span>
                `;
                } else {
                    paymentMethodInfoP.innerHTML = `
                    <span class="text-light">You didn't pay by this payment method in this month.</span>
                `;
                }
                paymentMethodInfoDiv.classList.remove('hidden1');

            } else {
                paymentLimitP.innerHTML = `<span class="text-danger">Error fetching payment data.</span>`;
                paymentInfoDiv.classList.remove('hidden1');
            }
        } catch (error) {
            console.error('Fetch payment error:', error);
            paymentLimitP.innerHTML = `<span class="text-danger">Server error fetching payment data.</span>`;
            paymentInfoDiv.classList.remove('hidden1');
        }
    }


    function updateRemainingLimit() {
        const enteredAmount = parseFloat(amountInput.value);
        if (currentLimit === 0) {
            PaymentP.innerHTML = `<span class="text-warning">No limit set for this category.</span>`;
            return;
        }
        if (isNaN(enteredAmount)) {
            PaymentP.innerHTML = `<span class="text-light">Please enter an amount to see remaining balance.</span>`;
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

    function updatePaymentInfo() {
        const selectedPayment = paymentSelect.options[paymentSelect.selectedIndex];
        const paymentInfoDiv = document.getElementById('paymentInfoDiv');

        if (!selectedPayment || selectedPayment.disabled) {
            paymentLimitP.innerHTML = `<span class="text-light">Please select a payment method.</span>`;
            paymentInfoDiv.classList.remove('hidden1');
            return;
        }

        const paymentName = selectedPayment.textContent || selectedPayment.value;

        paymentLimitP.innerHTML = `
        <span class="text-success fw-bold">${currentPayment.toFixed(2)} PLN</span> 
        <span class="text-light">limit for payment method</span> 
        <strong class="text-warning">${paymentName}</strong>.
    `;
        paymentInfoDiv.classList.remove('hidden1');
    }
    function updateRemainingPaymentLimit() {
        const enteredAmount = parseFloat(amountInput.value);
        const paymentInfoP = document.getElementById('selectedPaymentCashLeft');
        const paymentCashLeftDiv = document.getElementById('paymentCashLeftDiv');

        // 🔸 pokaż sekcję dopiero, gdy użytkownik wybierze metodę płatności
        if (paymentSelect.selectedIndex <= 0 || paymentSelect.options[paymentSelect.selectedIndex].disabled) {
            paymentCashLeftDiv.classList.add('hidden1');
            return;
        } else {
            paymentCashLeftDiv.classList.remove('hidden1');
        }

        // 🔸 zabezpieczenie na brak limitu lub błąd danych
        if (!currentPayment || isNaN(currentPayment) || currentPayment === 0) {
            paymentInfoP.innerHTML = `<span class="text-warning">For this payment method is not set limit yet.</span>`;
            return;
        }

        if (isNaN(enteredAmount)) {
            paymentInfoP.innerHTML = `<span class="text-light">Please enter an amount to see remaining cash for this payment method.</span>`;
            return;
        }

        // 🔹 obliczenie z uwzględnieniem sumy wydatków w miesiącu:
        const remaining = currentPayment - (currentAmountSpentPaymentMethod + enteredAmount);

        if (remaining >= 0) {
            paymentInfoP.innerHTML = `
        <span class="text-success fw-bold">${remaining.toFixed(2)} PLN</span> 
        <span class="text-light">left before reaching the limit.</span>
    `;
        } else {
            paymentInfoP.innerHTML = `
        <span class="text-danger fw-bold">${Math.abs(remaining).toFixed(2)} PLN</span> 
        <span class="text-light">over the payment method limit this month!</span>
    `;
        }

    }



    // --- NASŁUCHIWANIE ZDARZEŃ ---
    categorySelect.addEventListener('change', fetchExpenseData);
    dateInput.addEventListener('change', fetchExpenseData);
    amountInput.addEventListener('input', updateRemainingLimit);
    amountInput.addEventListener('input', updateRemainingPaymentLimit);
    paymentSelect.addEventListener('change', async () => {
        await fetchPaymentData(); // czekaj, aż dane limitu się pobiorą
        updateRemainingPaymentLimit(); // dopiero potem przeliczaj resztę
    });


});
