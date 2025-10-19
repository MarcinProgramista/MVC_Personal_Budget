<?php

namespace App\Controllers;

use App\Auth;
use Core\View;

/**
 * Profile controller
 */
class Profile extends Authenticated
{
    /**
     * Show the profile
     *
     * @return void
     */
    public function showAction()
    {
        View::renderTemplate('Profile/show.html', [
            'user' => Auth::getUser()
        ]);
    }
}
