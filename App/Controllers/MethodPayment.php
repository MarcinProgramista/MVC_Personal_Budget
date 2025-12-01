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
    /**
     * Add new payment method (AJAX)
     */
    public function addPaymentMethodAction()
    {
        header('Content-Type: application/json');

        try {
            // 🔒 Pobierz token CSRF (POST lub nagłówek X-CSRF-Token)
            $token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

            if (!\App\Csrf::validateToken($token)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid CSRF token'
                ]);
                return;
            }

            // 🔒 Użytkownik
            $userId = $_SESSION['user_id'] ?? null;
            if (!$userId) {
                echo json_encode(['success' => false, 'message' => 'User not logged in.']);
                return;
            }

            // 🔹 Dane z formularza
            $name = trim($_POST['name'] ?? '');
            $isLimitActive = isset($_POST['is_limit_active']) ? (int)$_POST['is_limit_active'] : 0;

            $cashLimit = $_POST['cash_limit'] ?? null;

            if ($cashLimit === '' || $cashLimit === null || $isLimitActive === 0) {
                $cashLimit = null;
            }


            // 🔍 Nazwa pusta?
            if ($name === '') {
                echo json_encode([
                    'success' => false,
                    'field' => 'name',
                    'message' => 'Category name is required.'
                ]);
                return;
            }

            // 🔍 Czy istnieje?
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

            // 🟢 Dodaj do bazy
            $newId = PaymentMethod::addCategory($userId, $name, $isLimitActive, $cashLimit);

            if (!$newId) {
                throw new \Exception("Failed to add category");
            }

            // 🟢 Sukces
            echo json_encode([
                'success' => true,
                'message' => 'Category added successfully!',
                'category' => [
                    'id' => $newId,
                    'user_id' => $userId,
                    'name' => $name,
                    'cash_limit' => $cashLimit,
                    'is_limit_active' => $isLimitActive
                ]
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log("💥 addPaymentMethodAction error: " . $e->getMessage());

            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
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

        // 🔐 CSRF token validation
        $token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

        if (!\App\Csrf::validateToken($token)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid CSRF token'
            ]);
            return;
        }

        $id = $_POST['id'] ?? null;
        $user_id = $_POST['user_id'] ?? null;

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


    /**
     * Edit an existing expense category (AJAX)
     */
    public function editAction()
    {
        header('Content-Type: application/json');
        // 🔐 CSRF validation
        $token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

        if (!\App\Csrf::validateToken($token)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid CSRF token'
            ]);
            return;
        }

        try {
            $userId = $_SESSION['user_id'] ?? null;
            $id = $_POST['id'] ?? null;
            $name = trim($_POST['name'] ?? '');
            $cashLimit = $_POST['cash_limit'] ?? null;
            $is_limit_active = $_POST['is_limit_active'] ?? null;

            if (!$userId) {
                throw new \Exception('User not logged in.');
            }

            if (!$id) {
                throw new \Exception('Category ID not provided.');
            }

            if ($name === '') {
                throw new \Exception('Category name cannot be empty.');
            }

            $existing = PaymentMethod::existCategoryName($name, $userId, $id);
            if ($existing) {
                echo json_encode(['success' => false, 'field' => 'name', 'message' => 'This category name already exists.']);
                return;
            }


            $updated = PaymentMethod::updateCategory($userId, $id, $name, $cashLimit, $is_limit_active);
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
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log("💥 Error editing expense category: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
