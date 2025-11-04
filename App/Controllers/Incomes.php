<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\Income;
use App\Models\IncomeCategory;
use \App\Models\Balance;
use \App\Flash;

/**
 * Incomes controller (example)
 *
 * PHP version 7.0
 */
class Incomes extends Authenticated
{
    /**
     * Before filter - called before each action method
     *
     * @return void
     */
    protected function before()
    {
        $user = Auth::getUser();
    }

    /**
     * Icomes index
     *
     * @return void
     */
    public function indexAction()
    {
        $user = Auth::getUser();
        $incomeCategories = IncomeCategory::getAllIncomesAssignedToUser($user->id);
        $dateIncome =  date('Y-m-d');
        $nameCategory =  'Allegro';
        $active = true;
        View::renderTemplate('Incomes/index.html', [
            'incomeCategories' => $incomeCategories,
            'dateIncome' => $dateIncome,
            'nameCategory' => $nameCategory,
            'active' => $active
        ]);
    }

    /**
     * Add a new income
     *
     * @return void
     */
    public function newAction()
    {
        $income = new Income($_POST);
        var_dump($income);
    }

    public function checkAmountForMonthAction()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        $categoryId = $input['id'] ?? null;
        $month = $input['month'] ?? null;
        $userId = $_SESSION['user_id']; // zakładam, że masz sesję użytkownika

        $sum = Income::getSumForCategoryAndMonth($userId, $categoryId, $month);
        $sumForAllCategires = Income::getSumForAllCategoryAndMonth($userId, $month);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'ok',
            'sum' => $sum,
            'id' => $categoryId,
            'month' => $month,
            'sumAllCategories' => $sumForAllCategires
        ]);
        exit;
    }
}
