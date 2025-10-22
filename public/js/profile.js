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
    const toggleBtn = document.getElementById("toggleProfileBtn");
    const profileData = document.getElementById("profileData");

    toggleBtn.addEventListener("click", function () {
        if (profileData.classList.contains("show")) {
            profileData.classList.remove("show");
            toggleBtn.innerHTML = '<i class="fas fa-user me-1"></i> Show profile details';
        } else {
            profileData.classList.add("show");
            toggleBtn.innerHTML = '<i class="fas fa-user me-1"></i> Hide profile details';
        }
    });

    // Ustawienie początkowego stanu z ikoną
    toggleBtn.innerHTML = '<i class="fas fa-user me-1"></i> Show profile details';
});

