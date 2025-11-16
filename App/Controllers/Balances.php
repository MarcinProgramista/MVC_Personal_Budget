<?php

namespace App\Controllers;

use \Core\View;
use \App\Auth;
use \App\Models\Income;
use App\Models\IncomeCategory;
use \App\Models\PaymentMethod;
use \App\Models\Balance;
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
        $month = date('m');
        $this->sentDetailsToPage($this->user->id, $month);
    }

    public function showLastMonthAction()
    {
        $month = date('m') - 1;
        $this->sentDetailsToPage($this->user->id, $month);
    }

    /**
     * Send detail incomes and expenses to page 
     *
     * @return page
     */
    public function sentDetailsToPage($user_id, $month)
    {
        $balance = true;
        $nameMonth = $this->getMonth($month);
        $incomes = Income::getAllIncomes($user_id, $month);
        $expenses = Expense::getAlExpenses($user_id, $month);
        $sumALlIncomes = Income::getSumOfIncomes($user_id, $month);
        $sumALlExpenses = Expense::getSumOfExpenses($user_id, $month);
        $incomeDetails = Income::getAllDetailIncomes($user_id, $month);
        $expenseDetails = Expense::getAllDetailExpenses($user_id, $month);
        $incomeDetails = Income::getAllDetailIncomes($user_id, $month);
        $incomeCategories = IncomeCategory::getAllIncomesAssignedToUser($user_id);
        $expenseCategories = Expense::getCategories($this->user->id);
        $expensePayments = PaymentMethod::getPayments($this->user->id);
        $sumALlIncomes = $sumALlIncomes ?? 0;
        $sumALlExpenses = $sumALlExpenses ?? 0;
        $dateFirst = null;
        $dateSecond = null;
        $sum = (float)$sumALlIncomes - (float)$sumALlExpenses;
        View::renderTemplate('Balances/index.html', [
            'balance' => $balance,
            'incomes' => $incomes,
            'nameMonth' => $nameMonth,
            'sumALlIncomes' => $sumALlIncomes,
            'expenses' => $expenses,
            'sumALlExpenses' => $sumALlExpenses,
            'sum' => $sum,
            'incomeDetails' => $incomeDetails,
            'expenseDetails' => $expenseDetails,
            'incomeCategories' => $incomeCategories,
            'expenseCategories' => $expenseCategories,
            'expensePayments' => $expensePayments,
            'dateFirst' => $dateFirst,
            'dateSecond' => $dateSecond
        ]);
    }

    /**
     * Get month
     *
     * @return string
     */
    public function getMonth($month)
    {
        if ($month == 1) return $month = 'Januray';
        if ($month == 2) return $month = 'February';
        if ($month == 3) return $month = 'March';
        if ($month == 4) return $month = 'April';
        if ($month == 5) return $month = 'May';
        if ($month == 6) return $month = 'June';
        if ($month == 7) return $month = 'July';
        if ($month == 8) return $month = 'August';
        if ($month == 9) return $month = 'Spetember';
        if ($month == 10) return $month = 'October';
        if ($month == 11) return $month = 'November';
        if ($month == 12) return $month = 'December';
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

        static::showChoosenDatesAction($this->user->id, $dateFirst, $dateSecond);
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
    public static function showChoosenDatesAction($user_id, $dateFirst, $dateSeond)
    {
        $incomes = Income::getAllIncomesFromChoosenPeriod($user_id, $dateFirst, $dateSeond);
        $expenses = Expense::getAllExpensesFromChoosenPeriod($user_id, $dateFirst, $dateSeond);
        $sumALlIncomes = Income::getSumOfIncomesForChoosenPeriod($user_id, $dateFirst, $dateSeond);
        $sumALlExpenses = Expense::getSumOfExpensesForChoosenPeriod($user_id, $dateFirst, $dateSeond);
        $incomeDetails = Income::getAllDetailIncomesForChoosenPeriod($user_id, $dateFirst, $dateSeond);
        $expenseDetails = Expense::getAllDetailExpensesForChoosenPeriod($user_id, $dateFirst, $dateSeond);
        $incomeCategories = IncomeCategory::getAllIncomesAssignedToUser($user_id);
        $expenseCategories = Expense::getCategories($user_id);
        $expensePayments = PaymentMethod::getPayments($user_id);
        $sumALlIncomes = $sumALlIncomes ?? 0;
        $sumALlExpenses = $sumALlExpenses ?? 0;
        $sum = (float)$sumALlIncomes - (float)$sumALlExpenses;
        $balance = true;
        View::renderTemplate('Balances/index.html', [
            'balance' => $balance,
            'dateFirst' => $dateFirst,
            'dateSecond' => $dateSeond,
            'incomes' => $incomes,
            'expenses' => $expenses,
            'sumALlIncomes' => $sumALlIncomes,
            'sumALlExpenses' => $sumALlExpenses,
            'incomeDetails' => $incomeDetails,
            'expenseDetails' => $expenseDetails,
            'incomeCategories' => $incomeCategories,
            'expenseCategories' => $expenseCategories,
            'expensePayments' => $expensePayments,
            'sum' => $sum
        ]);
    }

    public function deleteIncomeAction()
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        header('Content-Type: application/json');
        // ✅ Sprawdź dane wejściowe
        if (
            !isset(
                $data['id'],
                $data['dateFirst'],
                $data['dateSecond'],
                $data['date'],
            )
        ) {
            echo json_encode(['status' => 'error', 'message' => 'Missing data']);
            exit;
        }

        $success = Income::deleteIncome(
            (int)$data['id'],
            (int)$this->user->id
        );

        $dateFirst = $data['dateFirst'] ?? null;
        $dateSecond = $data['dateSecond'] ?? null;


        $financialData = $this->getFinancialData($this->user->id, $dateFirst, $dateSecond, $data['date']);
        $sum = $financialData['sumAllIncomes'] - $financialData['sumAllExpenses'];

        // 📤 Zwróć JSON z nowymi danymi
        echo json_encode([
            'status' => $success ? 'success' : 'error',
            'user_id' => $this->user->id,
            'month' => $financialData['month'],
            'expenses' => $financialData['expenses'],
            'incomes' => $financialData['incomes'],
            'sumAllIncomes' => $financialData['sumAllIncomes'],
            'sumAllExpenses' => $financialData['sumAllExpenses'],
            'sum' => $sum
        ]);
    }

    public function deleteExpenseAction()
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        header('Content-Type: application/json');
        // ✅ Sprawdź dane wejściowe
        if (
            !isset(
                $data['id'],
                $data['dateFirst'],
                $data['dateSecond'],
                $data['date'],
            )
        ) {
            echo json_encode(['status' => 'error', 'message' => 'Missing data']);
            exit;
        }

        $success = Expense::deleteExpense(
            (int)$data['id'],
            (int)$this->user->id
        );

        $dateFirst = $data['dateFirst'] ?? null;
        $dateSecond = $data['dateSecond'] ?? null;
        $financialData = $this->getFinancialData($this->user->id, $dateFirst, $dateSecond, $data['date']);
        $sum = $financialData['sumAllIncomes'] - $financialData['sumAllExpenses'];
        // 📤 Zwróć JSON z nowymi danymi
        echo json_encode([
            'status' => $success ? 'success' : 'error',
            'user_id' => $this->user->id,
            'month' => $financialData['month'],
            'expenses' => $financialData['expenses'],
            'sumAllIncomes' => $financialData['sumAllIncomes'],
            'sumAllExpenses' => $financialData['sumAllExpenses'],
            'sum' => $sum
        ]);
    }

    private function getFinancialData(int $user_id, ?string $dateFirst, ?string $dateSecond, string $date): array
    {
        if (empty($dateFirst) && empty($dateSecond)) {
            $month = date('m', strtotime($date));

            return [
                'expenses' => Expense::getAlExpenses($user_id, $month),
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

        if (!isset($data['id'], $data['category_id'], $data['amount'], $data['info'], $data['date'])) {
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
