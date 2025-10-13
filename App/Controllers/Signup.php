<?php

namespace App\Controllers;

use \Core\View;
use \App\Models\User;

/**
 * Signup controller
 */
class Signup extends \Core\Controller
{
    /**
     * Show the signup page
     * 
     * @return void
     *  
     */
    public function newAction(){
        View::renderTemplate('Signup/new.html');
    }
    
    /**
     * Sing up a new user
     * 
     * @return void
     */
    public function createAction(){
        $user = new User($_POST);
        if($user->save()){
           header('Location: http://' . $_SERVER['HTTP_HOST'] . '/signup/success', true, 303);
        } else {
            View::renderTemplate('Signup/new.html',[
                'user' => $user
            ]);
        }
    }

    /**
     * Show the signup success page
     *
     * @return void
     */
    public function successAction()
    {
        View::renderTemplate('Signup/success.html');
    }
    
}
