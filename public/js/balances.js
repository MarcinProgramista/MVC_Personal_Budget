document.addEventListener("DOMContentLoaded", function () {
    const toggleListIncomesBalanceBtn = document.getElementById("toggleListIncomesBalanceBtn");
    const incomeBalanceListContainer = document.getElementById("incomeBalanceListContainer");
    const toggleIncomesBalanceArrow = document.getElementById("toggleIncomesBalanceArrow"); // <-- unikalne

    if (toggleListIncomesBalanceBtn && incomeBalanceListContainer && toggleIncomesBalanceArrow) {
        toggleListIncomesBalanceBtn.addEventListener("click", function () {
            incomeBalanceListContainer.classList.toggle("show");
            toggleIncomesBalanceArrow.innerHTML = incomeBalanceListContainer.classList.contains("show")
                ? '<i class="fas fa-arrow-up text-warning"></i>'
                : '<i class="fas fa-arrow-down text-warning"></i>';
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const toggleListExpensesBalanceBtn = document.getElementById("toggleListExpensesBalanceBtn");
    const expenseBalanceListContainer = document.getElementById("expenseBalanceListContainer");
    const toggleExpensesBalanceArrow = document.getElementById("toggleExpensesBalanceArrow"); // <-- unikalne

    if (toggleListExpensesBalanceBtn && expenseBalanceListContainer && toggleExpensesBalanceArrow) {
        toggleListExpensesBalanceBtn.addEventListener("click", function () {
            expenseBalanceListContainer.classList.toggle("show");
            toggleExpensesBalanceArrow.innerHTML = expenseBalanceListContainer.classList.contains("show")
                ? '<i class="fas fa-arrow-up text-warning"></i>'
                : '<i class="fas fa-arrow-down text-warning"></i>';
        });
    }
});