<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\PaymentMethod;
use \App\Models\Expense;
use \App\Flash;
use \App\Controllers\Authenticated;
use \App\Models\ExpenseCategory;

/**
 * Incomes controller (example)
 *
 * PHP version 7.0
 */
class Expenses extends Authenticated
{


    /**
     * Before filter - called before each action method
     *
     * @return void
     */
    protected function before()
    {
        $this->user = Auth::getUser();
    }

    /**
     * Items index
     *
     * @return void
     */
    public function indexAction()
    {
        $expenseCategories = Expense::getCategories($this->user->id);
        $expensePayments = PaymentMethod::getPayments($this->user->id);
        $dateExpense =  date('Y-m-d');
        View::renderTemplate('Expenses/index.html', [
            'dateExpense' => $dateExpense,
            'expenseCategories' => $expenseCategories,
            'expensePayments' => $expensePayments
        ]);
    }
    /**
     * Add a new expense
     *
     * @return void
     */
    public function newAction()
    {
        header('Content-Type: text/plain; charset=utf-8');

        // symulacja: np. ID zalogowanego użytkownika
        $userId = $_SESSION['user_id'] ?? 1; // <- albo metoda Auth::getUser()->id
        $data = $_POST;
    }

    public function checkAmountForMonthAction()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        $categoryId = $input['id'] ?? null;
        $month = $input['month'] ?? null;
        $userId = $_SESSION['user_id']; // zakładam, że masz sesję użytkownika
        $limitCategory = ExpenseCategory::findLimitExpenseCategory($userId, $categoryId);
        $sum = Expense::getSumForCategoryAndMonth($userId, $categoryId, $month);
        $sumForAllCategires = Expense::getSumForAllCategoryAndMonth($userId, $month);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'ok',
            'sum' => $sum,
            'id' => $categoryId,
            'month' => $month,
            'sumAllCategories' => $sumForAllCategires,
            'limitCategory' => $limitCategory
        ]);
        exit;
    }
}
