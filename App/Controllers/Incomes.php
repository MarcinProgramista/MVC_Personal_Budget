<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\User;
use \App\Models\Income;
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
        //$incomeCategories = Income::getAllIncomesAssignedToUser($this->user->id);
        $dateIncome =  date('Y-m-d');
        $nameCategory =  'Allegro';
        $active = true;
        View::renderTemplate('Incomes/index.html', [
            //'incomeCategories' => $incomeCategories,
            'dateIncome' => $dateIncome,
            'nameCategory' => $nameCategory,
            'active' => $active
        ]);
    }
}
