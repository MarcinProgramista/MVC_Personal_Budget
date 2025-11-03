document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('incomeCategorySelect');
    const div = document.getElementById('selectedCategoryDiv');
    const p = document.getElementById('selectedCategoryH1');
    const h3 = document.getElementById('selectedCategoryH3');
    const dateInput = document.querySelector('input[name="dateIncome"]');
    const secondInfo = document.getElementById('secondInfoP');
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    select.addEventListener('change', async function () {
        const selectedOption = select.options[select.selectedIndex];
        const selectedId = selectedOption.dataset.id;
        const selectedName = selectedOption.value;
        const selectedDate = dateInput.value;

        if (!selectedId || !selectedDate) return;

        const monthNumber = new Date(selectedDate).getMonth() + 1;
        const monthName = monthNames[monthNumber - 1];

        try {
            const response = await fetch('/incomes/checkAmountForMonth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedId, month: monthNumber })
            });

            const data = await response.json();
            //console.log(data);

            if (data.status === 'ok') {
                const amount = parseFloat(data.sum);
                const amountAll = parseFloat(data.sumAllCategories);
                if (amount > 0) {
                    p.innerHTML = `
                        <span class="text-light">In <strong class="text-warning">${monthName}</strong>,</span><br>
                        <span class="text-success fw-bold">${amount.toFixed(2)} PLN</span> 
                        <span class="text-light">was received from</span> 
                        <strong class="text-warning">(${selectedName})</strong>.
                    `;
                    secondInfo.innerHTML = `
                            <span class="text-success fw-bold">${amountAll.toFixed(2)} PLN</span> 
                        `;
                } else {
                    p.innerHTML = `
                        <span class="text-light">In</span> 
                        <strong class="text-warning">${monthName}</strong>, 
                        <span class="text-light">you haven't received any money from</span> 
                        <strong class="text-warning">(${selectedName})</strong>.
                    `;
                    secondInfo.innerHTML = `
                            <span class="text-success fw-bold">${amountAll.toFixed(2)} PLN</span> 
                        `;
                }

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
    });
});