document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("fromAddExpense");
    const amountInput = document.getElementById("amount");
    const dateInput = document.querySelector('input[name="dateExpense"]');
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

        // ❗ Zatrzymaj wysłanie formularza jeśli nieprawidłowy
        if (!valid) {
            event.preventDefault();
        }
    });
    // 🔸 Nasłuchiwanie na zmiany — usuwa komunikaty po poprawce
    amountInput.addEventListener("input", () => removeError(amountInput));

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
