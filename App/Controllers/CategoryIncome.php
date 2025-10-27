<?php

namespace App\Controllers;

use App\Models\IncomeCategory;

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

    public function getCategoryIdAction()
    {
        header('Content-Type: application/json');

        $userId = $_SESSION['user_id'] ?? null; // <- odkomentuj prawdziwe ID użytkownika
        $name = trim($_GET['name'] ?? '');

        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User not logged in.']);
            return;
        }

        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Category name is required.']);
            return;
        }

        $id = IncomeCategory::getCategoryIdByName($name, $userId);
        $anotherId = IncomeCategory::getCategoryIdByName('Another', $userId);
        if ($id) {
            echo json_encode(['success' => true, 'category_id' => $id, 'name' => $name, 'another_id' => $anotherId]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Category not found.']);
        }
    }
}
