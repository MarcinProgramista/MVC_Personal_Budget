<?php

namespace App\Controllers;

use App\Models\ExpenseCategory;

class CategoryExpense extends Authenticated
{
    /**
     * Add new expense category (AJAX)
     */
    public function addExpenseCategoryAction()
    {
        header('Content-Type: application/json');

        $userId = $_SESSION['user_id'] ?? null;
        $name = trim($_POST['name'] ?? '');
        $cashLimit = $_POST['cash_limit'] ?? null;

        // 🔹 Walidacja podstawowa
        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Category name is required.']);
            return;
        }

        // 🔹 Sprawdzenie, czy kategoria już istnieje dla użytkownika
        $existing = ExpenseCategory::existCategoryName($name, $userId);

        if ($existing && isset($existing->user_id) && $existing->user_id == $userId) {
            echo json_encode(['success' => false, 'message' => 'This category already exists.']);
            return;
        }

        // 🔹 Próba dodania nowej kategorii
        $newId = ExpenseCategory::addCategory($userId, $name, $cashLimit);

        if ($newId) {
            echo json_encode([
                'success' => true,
                'message' => 'Category added successfully!',
                'category' => [
                    'id' => $newId,
                    'name' => $name,
                    'cash_limit' => $cashLimit,
                    'is_limit_active' => $cashLimit ? 1 : 0
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add category.']);
        }
    }
}
