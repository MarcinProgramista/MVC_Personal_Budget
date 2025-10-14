<?php

namespace App\Controllers;

use \Core\View;
use \App\Models\User;

/**
 * Login Controller
 */
class Login extends \Core\Controller{
    /**
     * Show the login page
     * 
     * @return void
     */
    public function newAction(){{
        View::renderTemplate('Login/new.html');
    }}
}