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

        $userId = $_SESSION['user_id'] ?? 1;
        // dodaj user_id do danych z formularza
        $data = $_POST;

        $data['user_id'] = $userId;
        $data['expense_category_assigned_to_user_id'] = ExpenseCategory::findIdExpenseCategory($userId, $data['expenseCategoryName']);
        $data['payment_method_assigned_to_user_id'] =  PaymentMethod::findIdPaymentMethod($userId, $data['namePayment']);
        $data['date_of_expense'] = $data['dateExpense'];
        $expense = new Expense($data);

        if ($expense->save()) {
            Flash::addMessage('Added expense');
            $this->redirect('/expenses/success');
        } else {
            $dateExpense =  date('Y-m-d');
            $expenseCategories = Expense::getCategories($this->user->id);
            $expensePayments = PaymentMethod::getPayments($this->user->id);
            View::renderTemplate('expenses/index.html', [
                'expense' => $expense,
                'expenseCategories' => $expenseCategories,
                'dateExpense' => $dateExpense,
                'expensePayments' => $expensePayments
            ]);
        }
    }


    /**
     * Show add success income
     *
     * @return void
     */
    public function successAction()
    {
        View::renderTemplate('Expenses/success.html');
    }


    public function checkAmountForMonthAction()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        $categoryId = $input['id'] ?? null;
        $month = $input['month'] ?? null;
        $userId = $_SESSION['user_id']; // zakładam, że masz sesję użytkownika
        $limitCategory = ExpenseCategory::findLimitExpenseCategory($userId, $categoryId);
        $sum = Expense::getSumForCategoryAndMonth($userId, $categoryId, $month);
        $sumForAllCategires = Expense::getSumForAllCategoryAndMonth($userId, $month);;
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'ok',
            'sum' => $sum,
            'id' => $categoryId,
            'month' => $month,
            'sumAllCategories' => $sumForAllCategires,
            'limitCategory' => $limitCategory,
        ]);
        exit;
    }

    public function checkPaymentLimitAction()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        $paymentId = $input['id'] ?? null;
        $month = $input['month'] ?? null;
        $userId = $_SESSION['user_id'];
        $sumPaymentMethodInMonth = Expense::getSumForPaymentMethodAndChoosenMonth($userId, $paymentId, $month);
        // Tu możesz zrobić swoje zapytanie:
        $limitPayment = PaymentMethod::findLimitPaymentMethod($userId, $paymentId);


        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'ok',
            'limitPayment' => $limitPayment,
            'sumPaymentMethodInMonth' => $sumPaymentMethodInMonth
        ]);
        exit;
    }
}
