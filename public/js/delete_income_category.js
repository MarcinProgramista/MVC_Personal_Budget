document.addEventListener("DOMContentLoaded", () => {
  const deleteButtons = document.querySelectorAll(
    ".open-delete-income-category-modal"
  );
  const modalEl = document.getElementById("deleteIncomeCategoryModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  const form = document.getElementById("deleteIncomeCategoryForm");
  const idInput = document.getElementById("deleteIncomeCategoryId");
  const userIdInput = document.getElementById("deleteIncomeUserId");
  const csrfInput = document.getElementById("deleteIncomeCsrf");
  const namePlaceholder = document.getElementById("deleteIncomeCategoryName");

  // 🔥 Otwarcie modala
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const user_id = btn.dataset.user_id;

      idInput.value = id;
      userIdInput.value = user_id;
      namePlaceholder.textContent = name;

      modal.show();
    });
  });

  // 🔥 Wysłanie żądania DELETE
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const res = await fetch("/category-income/delete", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    console.log("DELETE RESPONSE:", data);

    if (!data.success) {
      showToast(data.message || "Failed to delete category", "error");
      return;
    }

    // 🔥 Usuń <li> z listy
    const li = document.querySelector(
      `li[data-category-id="${idInput.value}"]`
    );
    if (li) li.remove();

    showToast("Category deleted!", "success");

    modal.hide();
  });
});
