<?php

namespace App\Controllers;

use Core\View;
use App\Models\User;

/**
 * Login Controller
 */
class Login extends \Core\Controller
{
    /**
     * Show the login page
     *
     * @return void
     */
    public function newAction()
    {
        {
            View::renderTemplate('Login/new.html');
        }
    }
    /**
     * Log in a user
     *
     * @return void
     */
    public function createAction()
    {
        $user = User::authenticate($_POST['email'], $_POST['password']);

        if ($user) {


            $_SESSION['user_id'] = $user->id;
            $_SESSION['user_name'] = $user->name;

            $this->redirect('/');
        } else {
            View::renderTemplate('Login/new.html', [
                'email' => $_POST['email'],
            ]);
        }
    }
}
