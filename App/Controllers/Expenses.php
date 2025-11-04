<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\User;
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

        var_dump($this->user->id);
    }
}
