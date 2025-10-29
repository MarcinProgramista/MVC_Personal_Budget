<?php

namespace App\Controllers;

use App\Models\PaymentMethod;
use App\Models\IncomeCategory;

use App\Models\ExpenseCategory;

class MethodPayment extends Authenticated
{
    /**
     * Add new method payment (AJAX)
     */
    public function addPaymentMethodAction()
    {
        header('Content-Type: application/json');

        $userId = $_SESSION['user_id'] ?? null;
        $name = trim($_POST['name'] ?? '');
        $cashLimit = $_POST['cash_limit'] ?? null;
        $isLimitActive = isset($_POST['is_limit_active']) ? (int)$_POST['is_limit_active'] : 0;

        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Category name is required.']);
            return;
        }

        $existing = PaymentMethod::existMethodPaymentName($name, $userId);


        if (!empty($existing)) {
            echo json_encode([
                'success' => false,
                'field' => 'name',
                'message' => 'This category already exists.'
            ]);
            return;
        }



        error_log("💡 Adding payment method: name=$name, limit=$cashLimit, active=$isLimitActive");

        // ✅ Przekazujemy is_limit_active do modelu
        $newId = PaymentMethod::addCategory($userId, $name, $isLimitActive, $cashLimit);

        if ($newId) {
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
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add category.']);
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

    /**
     * Delet method payment
     * 
     *
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
            echo json_encode(['success' => false, 'error' => 'Category ID not provided.']);
            return;
        }



        $deleted = PaymentMethod::deleteCategoryById((int)$id, (int)$user_id);

        if ($deleted) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete category.']);
        }
    }
}
