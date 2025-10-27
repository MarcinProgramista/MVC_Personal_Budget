<?php

namespace App\Controllers;

use App\Models\IncomeCategory;
use App\Models\Income;

class CategoryIncome extends Authenticated
{
    /**
     * Add new income category (AJAX)
     */
    public function addIncomeCategoryAction()
    {
        header('Content-Type: application/json');

        $userId = $_SESSION['user_id'] ?? null;
        $name = trim($_POST['name'] ?? '');

        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Category name is required.']);
            return;
        }

        $existing = IncomeCategory::existCategoryIncomeName($name, $userId);
        if ($existing && isset($existing->user_id) && $existing->user_id == $userId) {
            echo json_encode(['success' => false, 'message' => 'This category already exists.']);
            return;
        }
        $newId = IncomeCategory::addIncomeCategory($userId, $name);

        if ($newId) {
            echo json_encode([
                'success' => true,
                'message' => 'Income category added successfully!',
                'category' => [
                    'name' => $name
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add category.']);
        }
    }

    public function deleteAction()
    {
        header('Content-Type: application/json');

        $userId = $_SESSION['user_id'] ?? null;
        $input = json_decode(file_get_contents('php://input'), true); // ← kluczowa linia

        $name = trim($input['name'] ?? '');
        $id = $input['id'] ?? null;

        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Category name is required.']);
            return;
        }

        if (!$id) {
            echo json_encode(['success' => false, 'error' => 'Category ID not provided.']);
            return;
        }

        $anotherId = IncomeCategory::getCategoryIdByName('Another', $userId);
        Income::updateCategoryForAnother($id, $userId, $anotherId);
        $deleted = IncomeCategory::deleteCategoryById((int)$id, $userId);

        echo json_encode(['success' => $deleted]);
    }
}
