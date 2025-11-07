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