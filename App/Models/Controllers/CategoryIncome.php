<?php

namespace App\Controllers;

use App\Models\IncomeCategory;
use App\Models\Income;
use App\Models\PaymentMethod;
use App\Models\ExpenseCategory;

class CategoryIncome extends Authenticated
{
    /**
     * Add new expense category (AJAX) – debugowany
     */
    public function addIncomeCategoryAction()
    {
        header('Content-Type: application/json');

        try {
            // 🔒 Pobierz token CSRF (POST lub nagłówek)
            $token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

            if (!\App\Csrf::validateToken($token)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid CSRF token'
                ]);
                return;
            }

            // 🔒 Pobierz ID użytkownika
            $userId = $_SESSION['user_id'] ?? null;
            if (!$userId) {
                throw new \Exception('User not logged in');
            }

            // 🔹 Pobranie danych z formularza
            $name = trim($_POST['name'] ?? '');
            $isLimitActive = isset($_POST['is_limit_active']) ? (int)$_POST['is_limit_active'] : 0;

            // cash_limit może być '' → null
            $cashLimit = $_POST['cash_limit'] ?? null;
            if ($cashLimit === '' || strtolower($cashLimit) === 'null' || $isLimitActive === 0) {
                $cashLimit = null;
            }

            // 🔍 Walidacja
            if ($name === '') {
                echo json_encode([
                    'success' => false,
                    'field'   => 'name',
                    'message' => 'Category name is required'
                ]);
                return;
            }

            // 🔍 Czy kategoria już istnieje?
            if (IncomeCategory::existCategoryName($name, $userId)) {
                echo json_encode([
                    'success' => false,
                    'field'   => 'name',
                    'message' => 'This category already exists.'
                ]);
                return;
            }


            // 🟢 Dodanie kategorii
            $newId = IncomeCategory::addIncomeCategory($userId, $name, $isLimitActive, $cashLimit);

            if (!$newId) {
                throw new \Exception('Failed to add income category');
            }

            echo json_encode([
                'success' => true,
                'message' => 'Income category added successfully!',
                'category' => [
                    'id'              => $newId,
                    'user_id'         => $userId,
                    'name'            => $name,
                    'cash_limit'      => $cashLimit,
                    'is_limit_active' => $isLimitActive
                ]
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log("💥 addIncomeCategoryAction error: " . $e->getMessage());

            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Edit an existing expense category (AJAX)
     */
    public function editCategoryAction()
    {
        header('Content-Type: application/json');
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

            $existing = IncomeCategory::existCategoryName($name, $userId, $id);
            if ($existing) {
                echo json_encode(['success' => false, 'field' => 'name', 'message' => 'This category name already exists.']);
                return;
            }


            $updated = IncomeCategory::updateCategory($userId, $id, $name, $cashLimit, $is_limit_active);
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
            error_log("💥 Error editing income category: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Check category name uniqueness (AJAX)
     */
    public function checkNameAction()
    {
        header('Content-Type: application/json');
        error_reporting(E_ALL);
        ini_set('display_errors', 1);

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        try {
            $userId = $_SESSION['user_id'] ?? null;
            $name = trim($_POST['name'] ?? '');

            if (!$userId || $name === '') {
                echo json_encode(['exists' => false]);
                return;
            }

            $exists = IncomeCategory::existCategoryIncomeName($name, $userId) ? true : false;

            echo json_encode(['exists' => $exists]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log("💥 checkNameAction error: " . $e->getMessage());
            echo json_encode([
                'exists' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
    }
    public function deleteAction()
    {
        header('Content-Type: application/json');

        // 🔐 CSRF
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

        $idAnotherCategory = IncomeCategory::getCategoryIdByName("Another", (int)$user_id);
        Income::updateCategoryForAnother($id, $user_id, $idAnotherCategory);

        $deleted = IncomeCategory::deleteCategoryById((int)$id, (int)$user_id);

        if ($deleted) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete category.']);
        }
    }
}
