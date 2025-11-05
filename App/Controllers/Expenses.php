<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\PaymentMethod;
use \App\Models\Expense;
use \App\Flash;
use \App\Controllers\Authenticated;

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
            'dateExpense' => $dateExpense
        ]);
    }
}
