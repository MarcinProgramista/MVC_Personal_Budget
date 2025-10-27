<?php

namespace App\Controllers;

use App\Models\ExpenseCategory;
use App\Models\Expense;

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

        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Category name is required.']);
            return;
        }

        $existing = ExpenseCategory::existCategoryName($name, $userId);

        if ($existing && isset($existing->user_id) && $existing->user_id == $userId) {
            echo json_encode(['success' => false, 'message' => 'This category already exists.']);
            return;
        }

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

    /**
     * Delete expense category (AJAX)
     */
    public function deleteAction()
    {
        header('Content-Type: application/json');

        $userId = $_SESSION['user_id'] ?? null;
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;

        if (!$userId) {
            echo json_encode(['success' => false, 'error' => 'User not logged in.']);
            return;
        }

        if (!$id) {
            echo json_encode(['success' => false, 'error' => 'Category ID not provided.']);
            return;
        }
        $anotherId = ExpenseCategory::getCategoryIdByName('Another', $userId);
        Expense::updateCategoryForAnother($id, $userId, $anotherId);
        $deleted = ExpenseCategory::deleteCategoryById((int)$id, $userId);

        if ($deleted) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete category.']);
        }
    }

    /**
     * Edit an existing expense category (AJAX)
     */
    public function editCategoryAction()
    {
        header('Content-Type: application/json');

        $data = json_decode(file_get_contents('php://input'), true);

        $userId = $_SESSION['user_id'] ?? null;
        $id = $data['id'] ?? null;
        $name = trim($data['name'] ?? '');
        $cashLimit = $data['cash_limit'] ?? null;

        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if (!$id || $name === '') {
            echo json_encode(['success' => false, 'message' => 'Invalid category data.']);
            return;
        }

        $updated = ExpenseCategory::updateCategory($userId, $id, $name, $cashLimit);

        if ($updated) {
            echo json_encode([
                'success' => true,
                'message' => 'Category updated successfully.',
                'category' => [
                    'id' => $id,
                    'name' => $name,
                    'cash_limit' => $cashLimit,
                    'is_limit_active' => $cashLimit ? 1 : 0
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update category.']);
        }
    }
}
