<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\Income;
use App\Models\IncomeCategory;
use \App\Models\PaymentMethod;
use \App\Flash;
use \App\Controllers\Authenticated;
use App\Models\Expense;

/**
 * Balances
 */
class Balances extends Authenticated
{
    protected $controller; // 👈 dodaj to
    protected $action; // 👈 dodaj to
    public string $dateFirst;
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
        $month = (int)date('m');
        $balanceService = new \App\Services\BalanceService();
        $balance = true;
        try {
            $balanceData = $balanceService->getBalanceData($this->user->id, $month);

            View::renderTemplate('Balances/index.html', array_merge($balanceData, [
                'nameMonth' => $this->getMonthName($month),
                'incomeCategories' => IncomeCategory::getAllIncomesAssignedToUser($this->user->id),
                'expenseCategories' => Expense::getCategories($this->user->id),
                'expensePayments' => PaymentMethod::getPayments($this->user->id),
                'balance' => $balance,

                // 👇 DODAJ TO!
                'sum' => $balanceData['sum'],
                'sumAllIncomes' => $balanceData['sumAllIncomes'],
                'sumAllExpenses' => $balanceData['sumAllExpenses'],
            ]));
        } catch (\Exception $e) {
            error_log('Balance error: ' . $e->getMessage());
            // Flash::addMessage('Failed to load balance data', Flash::WARNING);
            //$this->redirect('/');
            throw $e;
        }
    }

    public function showLastMonthAction()
    {
        $month = date('m') - 1;
        $this->sendDetailsToPage($month);
    }

    /**
     * Send detail incomes and expenses to page 
     *
     * @return page
     */
    public function sendDetailsToPage($month)
    {
        $balanceService = new \App\Services\BalanceService();
        $balance = true;
        try {
            $balanceData = $balanceService->getBalanceData($this->user->id, $month);

            View::renderTemplate('Balances/index.html', array_merge($balanceData, [
                'nameMonth' => $this->getMonthName($month),
                'incomeCategories' => IncomeCategory::getAllIncomesAssignedToUser($this->user->id),
                'expenseCategories' => Expense::getCategories($this->user->id),
                'expensePayments' => PaymentMethod::getPayments($this->user->id),
                'balance' => $balance,

                // 👇 DODAJ TO!
                'sum' => $balanceData['sum'],
                'sumAllIncomes' => $balanceData['sumAllIncomes'],
                'sumAllExpenses' => $balanceData['sumAllExpenses'],
            ]));
        } catch (\Exception $e) {
            error_log('Balance error: ' . $e->getMessage());
            Flash::addMessage('Failed to load balance data', Flash::WARNING);
            $this->redirect('/');
        }
    }

    private function getMonthName(int $month): string
    {
        $months = [
            1 => 'January',
            2 => 'February',
            3 => 'March',
            4 => 'April',
            5 => 'May',
            6 => 'June',
            7 => 'July',
            8 => 'August',
            9 => 'September',
            10 => 'October',
            11 => 'November',
            12 => 'December'
        ];

        return $months[$month] ?? 'Unknown';
    }

    public function sendChosenDatesAction()
    {
        $this->user = Auth::getUser();

        // Z FORMULARZA (POST)
        $dateFirst = $_POST['dateFirst'] ?? null;
        $dateSecond = $_POST['dateSecond'] ?? null;

        if (!$this->isValidDate($dateFirst) || !$this->isValidDate($dateSecond)) {
            Flash::addMessage('Invalid date format', Flash::WARNING);
            $this->redirect('/balances/index');
            return;
        }

        if (strtotime($dateFirst) > strtotime($dateSecond)) {
            Flash::addMessage('Start date must be before end date', Flash::WARNING);
            $this->redirect('/balances/index');
            return;
        }

        $this->showChoosenDatesAction($dateFirst, $dateSecond);
    }

    private function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
    /**
     * Show details from income and expenseDetails
     *
     * @return void
     */
    public  function showChoosenDatesAction($dateFirst, $dateSeond)
    {
        $balanceService = new \App\Services\BalanceService();
        $balance = true;
        try {
            $balanceData = $balanceService->getBalanceData(
                $this->user->id,
                null,              // miesiąc pomijamy
                $dateFirst,        // początek zakresu
                $dateSeond         // koniec zakresu
            );

            View::renderTemplate('Balances/index.html', array_merge($balanceData, [
                'dateFirst' => $dateFirst,
                'dateSecond' => $dateSeond,
                'incomeCategories' => IncomeCategory::getAllIncomesAssignedToUser($this->user->id),
                'expenseCategories' => Expense::getCategories($this->user->id),
                'expensePayments' => PaymentMethod::getPayments($this->user->id),
                'balance' => $balance,
                // 👇 DODAJ TO!
                'sum' => $balanceData['sum'],
                'sumAllIncomes' => $balanceData['sumAllIncomes'],
                'sumAllExpenses' => $balanceData['sumAllExpenses'],
            ]));
        } catch (\Exception $e) {
            error_log('Balance error: ' . $e->getMessage());
            Flash::addMessage('Failed to load balance data', Flash::WARNING);
            $this->redirect('/');
        }
    }

    public function deleteIncomeAction()
    {
        $this->handleDeleteTransaction('income');
    }

    public function deleteExpenseAction()
    {
        $this->handleDeleteTransaction('expense');
    }

    private function handleDeleteTransaction(string $type)
    {
        header('Content-Type: application/json');

        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        // Walidacja
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
            return;
        }

        $requiredFields = ['id', 'dateFirst', 'dateSecond', 'date'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "Missing field: $field"]);
                return;
            }
        }

        // 🔥 CSRF CHECK — MUSI BYĆ TUTAJ
        if (!isset($data['csrf_token']) || !hash_equals($_SESSION['csrf_token'] ?? '', $data['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Invalid CSRF token']);
            return;
        }

        // Wywołanie odpowiedniej metody usuwania
        $success = match ($type) {
            'income' => Income::deleteIncome((int)$data['id'], (int)$this->user->id),
            'expense' => Expense::deleteExpense((int)$data['id'], (int)$this->user->id),
            default => false
        };

        $financialData = $this->getFinancialData(
            $this->user->id,
            $data['dateFirst'],
            $data['dateSecond'],
            $data['date']
        );

        $sum = $financialData['sumAllIncomes'] - $financialData['sumAllExpenses'];

        echo json_encode([
            'status' => $success ? 'success' : 'error',
            'user_id' => $this->user->id,
            'month' => $financialData['month'],
            'sumAllIncomes' => $financialData['sumAllIncomes'],
            'sumAllExpenses' => $financialData['sumAllExpenses'],
            'incomes' => $financialData['incomes'],
            'expenses' => $financialData['expenses'],
            'sum' => $sum
        ]);
    }

    private function getFinancialData(int $user_id, ?string $dateFirst, ?string $dateSecond, string $date): array
    {
        if (empty($dateFirst) && empty($dateSecond)) {
            $month = date('m', strtotime($date));

            return [
                'expenses' => Expense::getAllExpenses($user_id, $month),
                'incomes' => Income::getAllIncomes($user_id,  $month),
                'sumAllIncomes' => Income::getSumOfIncomes($user_id, $month),
                'sumAllExpenses' => Expense::getSumOfExpenses($user_id, $month),
                'month' => $month
            ];
        } else {
            return [
                'expenses' => Expense::getAllExpensesFromChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'incomes' => Income::getAllIncomesFromChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'sumAllIncomes' => Income::getSumOfIncomesForChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'sumAllExpenses' => Expense::getSumOfExpensesForChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'month' => null
            ];
        }
    }

    public function updateExpenseAction()
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        header('Content-Type: application/json');

        // ✅ Sprawdź dane wejściowe
        if (
            !isset(
                $data['id'],
                $data['category_id'],
                $data['payment_id'],
                $data['amount'],
                $data['info'],
                $data['date']
            )
        ) {
            echo json_encode(['status' => 'error', 'message' => 'Missing data']);
            exit;
        }

        // 🔎 Pobierz istniejący rekord
        $oldExpense = Expense::getExpenseById((int)$data['id']);
        if (!$oldExpense) {
            echo json_encode(['status' => 'error', 'message' => 'Expense not found']);
            exit;
        }

        // 🛠️ Aktualizuj dane
        $success = Expense::updateExpense(
            (int)$data['id'],
            (int)$data['category_id'],
            (int)$data['payment_id'],
            (float)$data['amount'],
            $data['info'],
            $data['date']
        );

        // 🔹 Ustal dane do ponownego przeliczenia
        $dateFirst = $data['dateFirst'] ?? null;
        $dateSecond = $data['dateSecond'] ?? null;

        $financialData = $this->getFinancialData($this->user->id, $dateFirst, $dateSecond, $data['date']);
        $sum = $financialData['sumAllIncomes'] - $financialData['sumAllExpenses'];

        echo json_encode([
            'status' => $success ? 'success' : 'error',
            'message' => $success ? 'Expense updated successfully' : 'Failed to update expense',
            'updatedExpense' => [
                'id' => $data['id'],
                'amount' => $data['amount'],
                'category_id' => $data['category_id'],
                'payment_id' => $data['payment_id'],
                'info' => $data['info'],
                'date' => $data['date'],
                'name' => $data['name'] ?? null,
                'name_payment' => $data['name_payment'] ?? null,
            ],
            'totals' => [
                'sumAllIncomes' => $financialData['sumAllIncomes'],
                'sumAllExpenses' => $financialData['sumAllExpenses'],
                'sum' => $sum
            ],
            'expenses' => $financialData['expenses'] ?? [] // jeśli chcesz odświeżyć listę
        ]);
        exit;
    }


    public function updateIncomeAction()
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        header('Content-Type: application/json');

        if (!isset($data['id'], $data['category_id'], $data['amount'], $data['info'], $data['date'], $data['csrf_token'])) {
            echo json_encode(['status' => 'error', 'message' => 'Missing data']);
            exit;
        }

        $oldIncome = Income::getIncomeById((int)$data['id']);
        if (!$oldIncome) {
            echo json_encode(['status' => 'error', 'message' => 'Income not found']);
            exit;
        }

        $success = Income::updateIncome(
            (int)$data['id'],
            (int)$data['category_id'],
            (float)$data['amount'],
            $data['info'],
            $data['date']
        );
        // 🔹 Ustal dane do ponownego przeliczenia
        $dateFirst = $data['dateFirst'] ?? null;
        $dateSecond = $data['dateSecond'] ?? null;

        $financialData = $this->getFinancialData($this->user->id, $dateFirst, $dateSecond, $data['date']);
        $newSum = $financialData['sumAllIncomes'] - $financialData['sumAllExpenses'];

        echo json_encode([
            'status' => $success ? 'success' : 'error',
            'received' => [
                'id' => $data['id'],
                'oldAmount' => $oldIncome->amount,
                'newAmount' => $data['amount'],
                'sumAllIncomes' => $financialData['sumAllIncomes'],
                'sumAllExpenses' => $financialData['sumAllExpenses'],
                'balanceSum' => $newSum,          // nowa suma balansu
                'name' => $data['name'] ?? null,
                'info' => $data['info'],
                'date' => $data['date'],
                'incomes' => $financialData['incomes'],
            ]
        ]);

        exit;
    }

    public function getIncomesAction()
    {
        header('Content-Type: application/json');

        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $month = $_GET['month'] ?? null;
        $dateFirst = $_GET['dateFirst'] ?? null;
        $dateSecond = $_GET['dateSecond'] ?? null;

        if ($dateFirst && $dateSecond) {
            // 🔹 Okres niestandardowy
            $incomes = Income::getAllIncomesFromChoosenPeriod($user_id, $dateFirst, $dateSecond);
        } else {
            // 🔹 Standardowy miesiąc
            $incomes = Income::getAllIncomes($user_id, $month);
        }

        echo json_encode([
            'status' => 'success',
            'incomes' => $incomes
        ]);
        exit;
    }
}
