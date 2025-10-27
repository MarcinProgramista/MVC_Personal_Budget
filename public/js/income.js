document.addEventListener('DOMContentLoaded', () => {
    const deleteModalEl = document.getElementById('deleteIncomeCategoryModal');
    const deleteModal = deleteModalEl ? new bootstrap.Modal(deleteModalEl) : null;
    let selectedCategoryId = null;
    let selectedCategoryName = null;

    // 🗑️ Kliknięcie ikony kosza
    document.getElementById('incomeCategoriesList')?.addEventListener('click', (e) => {
        const icon = e.target.closest('.delete-income-category');
        if (!icon) return;

        selectedCategoryId = icon.dataset.id;
        selectedCategoryName = icon.dataset.name;

        console.log("🧠 Wybrana kategoria:", selectedCategoryId, selectedCategoryName);

        document.getElementById('deleteIncomeCategoryName').textContent = `"${selectedCategoryName}"`;
        document.getElementById('deleteCategoryId').value = selectedCategoryId;

        if (deleteModal) deleteModal.show();
    });

    // ✅ "Globalny" nasłuchiwacz dla przycisku Delete
    document.body.addEventListener('click', async (e) => {
        const btn = e.target.closest('#confirmDeleteCategoryBtn');
        if (!btn) return;

        console.log("🧨 Kliknięto DELETE w modalu!", selectedCategoryId, selectedCategoryName);

        try {
            const res = await fetch(`/category-income/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedCategoryId,
                    name: selectedCategoryName
                })
            });

            console.log("📡 Fetch wysłany...");
            const data = await res.json();
            console.log("✅ Odpowiedź serwera:", data);

            if (data.success) {
                const li = document.querySelector(`.delete-income-category[data-id="${selectedCategoryId}"]`)?.closest('li');
                if (li) {
                    li.classList.add('fade-out');
                    setTimeout(() => li.remove(), 400); // ⏳ poczekaj na zakończenie animacji
                }

                // 🧹 Zamknij modal poprawnie
                deleteModal.hide();
                document.body.classList.remove('modal-open');
                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());

                console.log("🧹 Modal zamknięty i element usunięty z animacją.");
            } else {
                alert(data.message || data.error || 'Failed to delete category.');
            }



        } catch (err) {
            console.error("💥 Błąd fetch:", err);
            alert('Server error.');
        }
    });
});
