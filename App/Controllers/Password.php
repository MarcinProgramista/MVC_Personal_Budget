<?php

namespace App\Controllers;

use App\Models\User;
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

    /**
     * Send the password rest link to the supplied email
     *
     * @return void
     */
    public function requestResetAction()
    {
        User::sendPasswordReset($_POST['email']);
        View::renderTemplate('Password/reset_requested.html');
    }
    /**
         * Show the reset password form
         *
         * @return void
         */
    public function resetAction()
    {
        $token = $this->route_params['token'];

        $user = User::findByPasswordReset($token);

        if ($user) {
            View::renderTemplate('Password/reset.html');
        } else {
            echo 'password reset token invalid';
        }

    }
}
