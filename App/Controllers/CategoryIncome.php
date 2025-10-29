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

        try {
            $userId = $_SESSION['user_id'] ?? null;
            $name = trim($_POST['name'] ?? '');
            $cashLimit = $_POST['cash_limit'] ?? null;
            $isLimitActive = isset($_POST['is_limit_active']) ? (int)$_POST['is_limit_active'] : 0;

            if (!$userId) {
                throw new \Exception('User not logged in');
            }

            if ($name === '') {
                throw new \Exception('Category name is required');
            }

            // Sprawdzenie czy kategoria już istnieje
            $existing = IncomeCategory::existCategoryIncomeName($name, $userId);
            if ($existing) {
                echo json_encode([
                    'success' => false,
                    'field' => 'name',
                    'message' => 'This category already exists.'
                ]);
                return;
            }

            // Obsługa pustego cashLimit
            if ($cashLimit === '') {
                $cashLimit = null;
            }

            $newId = IncomeCategory::addIncomeCategory($userId, $name, $isLimitActive, $cashLimit);

            if (!$newId) {
                $stmtError = error_get_last();
                throw new \Exception('Failed to add category: ' . ($stmtError['message'] ?? 'unknown'));
            }

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
            error_log("💥 addIncomeCategoryAction error: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
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



        $anotherId = IncomeCategory::getCategoryIdByName('Another', $user_id);
        Income::updateCategoryForAnother($id, $user_id, $anotherId);
        $deleted = IncomeCategory::deleteCategoryById((int)$id, (int)$user_id);

        echo json_encode(['success' => $deleted]);
    }
}
