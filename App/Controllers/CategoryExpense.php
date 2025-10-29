<?php

namespace App\Controllers;

use App\Models\ExpenseCategory;
use App\Models\Expense;
use App\Models\PaymentMethod;
use App\Models\IncomeCategory;

class CategoryExpense extends Authenticated
{
    /**
     * Add new expense category (AJAX)
     */
    public function addExpenseCategoryAction()
    {
        header('Content-Type: application/json');

        try {
            $userId = $_SESSION['user_id'] ?? null;
            if (!$userId) throw new \Exception('User not logged in');
            $name = trim($_POST['name'] ?? '');
            $cashLimit = $_POST['cash_limit'] ?? null;
            $isLimitActive = isset($_POST['is_limit_active']) ? (int)$_POST['is_limit_active'] : 0;

            if (!$userId) throw new \Exception('User not logged in');
            if ($name === '') throw new \Exception('Category name is required');

            $existing = ExpenseCategory::existCategoryName($name, $userId);
            if ($existing) {
                echo json_encode(['success' => false, 'field' => 'name', 'message' => 'This category already exists.']);
                exit;
                return;
            }

            $newId = ExpenseCategory::addCategory($userId, $name, $isLimitActive, $cashLimit);
            if (!$newId) throw new \Exception('Failed to add category');

            echo json_encode([
                'success' => true,
                'message' => 'Category added successfully!',
                'category' => [
                    'id' => $newId,
                    'name' => $name,
                    'cash_limit' => $cashLimit,
                    'is_limit_active' => $isLimitActive
                ]
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log("💥 Error adding expense category: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }



    /**
     * Delete expense category (AJAX)
     */
    public function deleteAction()
    {
        header('Content-Type: application/json');

        $input = json_decode(file_get_contents('php://input'), true);

        $id = $input['id'] ?? null;
        $user_id = $input['user_id'] ?? null;

        if (!$user_id) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'Category ID not provided.']);
            return;
        }

        $anotherId = ExpenseCategory::getCategoryIdByName('Another', $user_id);
        Expense::updateCategoryForAnother($id, $user_id, $anotherId);
        $deleted = ExpenseCategory::deleteCategoryById((int)$id, (int)$user_id);

        if ($deleted) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete category.']);
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
        $is_limit_active = $data['is_limit_active'] ?? null;

        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if (!$id || $name === '') {
            echo json_encode(['success' => false, 'message' => 'Invalid category data.']);
            return;
        }

        $updated = ExpenseCategory::updateCategory($userId, $id, $name, $cashLimit, $is_limit_active);
        if ($updated) {
            echo json_encode([
                'success' => true,
                'message' => 'Category updated successfully.',
                'category' => [
                    'id' => $id,
                    'name' => $name,
                    'cash_limit' => $cashLimit,
                    'is_limit_active' => (int)$is_limit_active
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update category.']);
        }
    }


    public function checkNameAction()
    {
        header('Content-Type: application/json');

        $userId = $_SESSION['user_id'] ?? null;
        $name = trim($_POST['name'] ?? '');

        if (!$userId || $name === '') {
            echo json_encode(['exists' => false]);
            return;
        }

        $exists = false;

        if ($this instanceof CategoryExpense) {
            $exists = ExpenseCategory::existCategoryName($name, $userId) ? true : false;
        } elseif ($this instanceof CategoryIncome) {
            $exists = IncomeCategory::existCategoryIncomeName($name, $userId) ? true : false;
        } elseif ($this instanceof MethodPayment) {
            $exists = PaymentMethod::existMethodPaymentName($name, $userId) ? true : false;
        }

        echo json_encode(['exists' => $exists]);
    }
}
