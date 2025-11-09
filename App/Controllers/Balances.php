<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\Income;
use App\Models\IncomeCategory;
use \App\Models\Balance;
use \App\Flash;
use \App\Controllers\Authenticated;
use App\Models\Expense;

/**
 * Balances
 */
class Balances extends Authenticated
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
        $month = date('m');
        $this->sentDetailsToPage($this->user->id, $month);
    }

    /**
     * Send detail incomes and expenses to page 
     *
     * @return page
     */
    public function sentDetailsToPage($user_id, $month)
    {
        $balance = true;
        $nameMonth = $this->getMonth($month);
        $incomes = Income::getAllIncomes($user_id, $month);
        $expenses = Expense::getAlExpenses($user_id, $month);
        $sumALlIncomes = Income::getSumOfIncomes($user_id, $month);
        $sumALlExpenses = Expense::getSumOfExpenses($user_id, $month);
        View::renderTemplate('Balances/index.html', [
            'balance' => $balance,
            'incomes' => $incomes,
            'nameMonth' => $nameMonth,
            'sumALlIncomes' => $sumALlIncomes,
            'expenses' => $expenses,
            'sumALlExpenses' => $sumALlExpenses
        ]);
    }

    /**
     * Get month
     *
     * @return string
     */
    public function getMonth($month)
    {
        if ($month == 1) return $month = 'Januray';
        if ($month == 2) return $month = 'February';
        if ($month == 3) return $month = 'March';
        if ($month == 4) return $month = 'April';
        if ($month == 5) return $month = 'May';
        if ($month == 6) return $month = 'June';
        if ($month == 7) return $month = 'July';
        if ($month == 8) return $month = 'August';
        if ($month == 9) return $month = 'Spetember';
        if ($month == 10) return $month = 'October';
        if ($month == 11) return $month = 'November';
        if ($month == 12) return $month = 'December';
    }
}
