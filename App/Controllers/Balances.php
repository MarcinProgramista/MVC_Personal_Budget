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
        $dateIncome =  date('Y-m-d');
        $active = true;
        View::renderTemplate('Balances/index.html');
    }
}
