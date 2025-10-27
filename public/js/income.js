document.addEventListener('DOMContentLoaded', () => {
    const deleteModalEl = document.getElementById('deleteIncomeCategoryModal');
    const deleteModal = deleteModalEl ? new bootstrap.Modal(deleteModalEl) : null;

    document.getElementById('incomeCategoriesList')?.addEventListener('click', async (e) => {
        const icon = e.target.closest('.delete-income-category');
        if (!icon) return;

        const name = icon.dataset.name;

        try {
            const res = await fetch(`/category-income/get-category-id?name=${encodeURIComponent(name)}`);
            const data = await res.json();
            console.log("DATA:", data);

            if (data.success && deleteModalEl) {
                // Pokaż modal
                deleteModal.show();

                // Po pokazaniu modala ustaw teksty
                deleteModalEl.addEventListener('shown.bs.modal', () => {
                    const display = document.getElementById('incomeCategoryIdDisplay');
                    const nameEl = document.getElementById('deleteIncomeCategoryName');
                    if (display) {
                        display.textContent = `${data.category_id} - ${data.name} - Another ID: ${data.another_id}`;
                    }
                    if (nameEl) {
                        nameEl.textContent = `"${data.name}"`;
                    }
                }, { once: true });

            } else {
                console.error(data.message);
                alert('Failed to fetch category ID.');
            }
        } catch (err) {
            console.error(err);
            alert('Server error.');
        }
    });
});
