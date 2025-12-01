<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\Income;
use App\Models\IncomeCategory;
use \App\Models\Balance;
use \App\Flash;
use \App\Controllers\Authenticated;


/**
 * Incomes controller (example)
 *
 * PHP version 7.0
 */
class Incomes extends Authenticated
{
    protected $controller; // 👈 dodaj to
    protected $action; // 👈 dodaj to
    public function __construct($data = [])
    {
        foreach ($data as $key => $value) {
            $this->$key = $value;
        }
    }
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
     * Icomes index
     *
     * @return void
     */
    public function indexAction()
    {

        $incomeCategories = IncomeCategory::getAllIncomesAssignedToUser($this->user->id);
        $dateIncome =  date('Y-m-d');
        $active = true;
        View::renderTemplate('Incomes/index.html', [
            'incomeCategories' => $incomeCategories,
            'dateIncome' => $dateIncome,
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
        header('Content-Type: text/plain; charset=utf-8');

        // symulacja: np. ID zalogowanego użytkownika
        $userId = $_SESSION['user_id'] ?? 1; // <- albo metoda Auth::getUser()->id

        // połącz dane z formularza z user_id
        $data = $_POST;
        $data['user_id'] = $userId;
        $income = new Income($_POST);
        $income_category_assigned_to_user_id = Income::findIdIncomeCategory($userId, $data['incomeCategoryName']);

        if ($income->save($userId, $income_category_assigned_to_user_id)) {

            Flash::addMessage('Added Income');

            $this->redirect('/incomes/success');
        } else {
            $dateIncome =  date('Y-m-d');
            $incomeCategories = IncomeCategory::getAllIncomesAssignedToUser($userId);
            View::renderTemplate('Incomes/index.html', [
                'income' => $income,
                'incomeCategories' => $incomeCategories,
                'dateIncome' => $dateIncome
            ]);
        }
        // echo "✅ Form data received:\n\n";
        // print_r($income_category_assigned_to_user_id);

        // exit;
    }

    public function checkAmountForMonthAction()
    {

        $input = json_decode(file_get_contents('php://input'), true);

        $categoryId = $input['id'] ?? null;
        $month = $input['month'] ?? null;
        $userId = $_SESSION['user_id']; // zakładam, że masz sesję użytkownika

        $sum = Income::getSumForCategoryAndMonth($userId, $categoryId, $month);
        $sumForAllCategires = Income::getSumForAllCategoryAndMonth($userId, $month);
        $expectedMoney = IncomeCategory::findExpectedMonetForChosenCategory($userId, $categoryId);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'ok',
            'sum' => $sum,
            'id' => $categoryId,
            'month' => $month,
            'sumAllCategories' => $sumForAllCategires,
            'expectedMoney' => $expectedMoney
        ]);
        exit;
    }

    /**
     * Show add success income
     *
     * @return void
     */
    public function successAction()
    {
        View::renderTemplate('Incomes/success.html');
    }
}
