<?php

namespace App\Controllers;

use App\Auth;
use App\Flash;
use Core\View;
use App\Models\User;
use App\Models\ExpenseCategory;
use App\Models\IncomeCategory;
use App\Models\PaymentMethod;

class Profile extends Authenticated
{
    public function showAction()
    {
        $user = Auth::getUser();
        // Pobranie pełnego obiektu użytkownika z bazy, żeby mieć ID i wszystkie pola
        $user = User::findByID($user->id);
        $expenseCategories = ExpenseCategory::getAllExpenseAssignedToUser($user->id);
        $incomeCategories = IncomeCategory::getAllIncomesAssignedToUser($user->id);
        $paymentMethod = PaymentMethod::getAllPaymentMethodAssignedToUser($user->id);


        View::renderTemplate('Profile/show.html', [
            'user' => $user,
            'expenseCategories' => $expenseCategories,
            'incomeCategories' => $incomeCategories,
            'paymentMethods' => $paymentMethod,
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
            $this->redirect('/profile/show');
        } else {
            View::renderTemplate('Profile/edit.html', [
                'user' =>  $user
            ]);
        }
    }
    public function getUserDataAction()
    {
        try {
            $name = $_GET['name'] ?? '';

            header('Content-Type: application/json');

            if (!$name) {
                // brak nazwy
                echo json_encode(['nameError' => 'Name is required']);
                return;
            }


            $user = User::findByName($name); // <- metoda w modelu User

            if ($user) {
                echo json_encode([
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email
                ]);
            } else {
                echo json_encode(['error' => 'User not found']);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
            error_log($e->getMessage()); // <- zapisuje błąd w /opt/lampp/logs/error_log
        }
    }
}
