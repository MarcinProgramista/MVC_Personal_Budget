<?php

namespace App\Controllers;

use App\Auth;
use App\Flash;
use Core\View;
use App\Models\User;

class Profile extends Authenticated
{
    public function showAction()
    {
        $user = Auth::getUser();
        // Pobranie pełnego obiektu użytkownika z bazy, żeby mieć ID i wszystkie pola
        $user = User::findByID($user->id);

        View::renderTemplate('Profile/show.html', [
            'user' => $user
        ]);
    }

    /**
     * Show the form for editing the profile
     *
     * @return void
     */
    public function editAction()
    {
        View::renderTemplate('Profile/edit.html', [
            'user' => Auth::getUser()
        ]);
    }

    public function updateAction()
    {
        $user = Auth::getUser();

        if ($user->updateProfile($_POST)) {
            Flash::addMessage('Changes saved');
            $this->redirect('profile/show');
        }

    }



}
