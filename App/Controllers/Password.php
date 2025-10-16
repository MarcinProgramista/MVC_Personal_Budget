<?php

namespace App\Controllers;

use Core\View;

/**
 * Passowrd controller
 */
class Password extends \Core\Controller
{
    /**
     * Show the forgotten passoword page
     *
     *@return void
     */
    public function forgotAction()
    {
        View::renderTemplate('Password/forgot.html');
    }
}
