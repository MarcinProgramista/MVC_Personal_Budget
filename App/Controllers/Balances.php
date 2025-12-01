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

use GeminiAPI\Client;
use GeminiAPI\Resources\Parts\TextPart;

use Google\GenerativeAI\GoogleAI;


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
                'incomeDetails' => $balanceData['incomeDetails'],
                'expenseCategories' => Expense::getCategories($this->user->id),
                'expenseDetails' => $balanceData['expenseDetails'],
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
                'incomeDetails' => $balanceData['incomeDetails'],
                'expenseCategories' => Expense::getCategories($this->user->id),
                'expensePayments' => PaymentMethod::getPayments($this->user->id),
                'expenseDetails' => $balanceData['expenseDetails'],
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

    private static array $adviceCache = [];

    private function getFinancialAdvice(array $balanceData): string
    {
        if (empty($balanceData['incomes']) && empty($balanceData['expenses'])) {
            return "No financial data available — please add incomes or expenses to receive AI guidance.";
        }

        try {
            $client = new \GeminiAPI\Client($_ENV['GEMINI_API_KEY']);

            $model = "gemini-2.5-flash";

            $prompt = "
You are an expert financial advisor. Your task is to analyze the user's incomes and expenses and generate a structured, professional financial summary.

IMPORTANT RULES:
- All values must remain in PLN.
- Be analytical but easy to understand.
- Write in clear, natural English.
- Follow EXACTLY the output structure below.
- Do NOT add any additional sections.

OUTPUT FORMAT (DO NOT MODIFY):

---
Hello,

Based on the financial data provided, here is your monthly financial analysis:

**Incomes:**
- List each income category with amount in PLN.
- Then provide: **Total incomes: X PLN**

**Expenses:**
- List each expense category with amount in PLN.
- Then provide: **Total expenses: X PLN**

**Net Balance:**
Calculate incomes - expenses and output:
**Net Balance: X PLN**

**Summary & Analysis:**
Write 3–5 sentences evaluating:
- The financial situation
- The biggest spending categories
- Strengths and weaknesses
- Savings opportunities

**Three practical recommendations to improve financial management:**
1. ...
2. ...
3. ...

---

Here is the financial data to analyze:

Incomes JSON:
" . json_encode($balanceData['incomes'], JSON_PRETTY_PRINT) . "

Expenses JSON:
" . json_encode($balanceData['expenses'], JSON_PRETTY_PRINT) . "
";


            $response = $client
                ->generativeModel($model)
                ->generateContent(
                    new \GeminiAPI\Resources\Parts\TextPart($prompt)
                );

            return $response->text() ?? "AI did not return any information.";
        } catch (\Exception $e) {
            error_log("AI ERROR: " . $e->getMessage());
            return "⚠️ The AI service is temporarily unavailable. Please try again later.";
        }
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
            'incomes' => $financialData['incomes'],
            'expenses' => $financialData['expenses'],
            'incomeDetails' => $financialData['incomeDetails'],
            'expenseDetails' => $financialData['expenseDetails'],
            'sumAllIncomes'  => $financialData['sumAllIncomes'],
            'sumAllExpenses' => $financialData['sumAllExpenses'],
            'sum'            => $sum,
            'totals' => [
                'sumAllIncomes'  => $financialData['sumAllIncomes'],
                'sumAllExpenses' => $financialData['sumAllExpenses'],
                'sum'            => $sum
            ],
        ]);
    }

    private function getFinancialData(int $user_id, ?string $dateFirst, ?string $dateSecond, string $date): array
    {
        if (empty($dateFirst) && empty($dateSecond)) {
            $month = date('m', strtotime($date));


            return [
                'expenses' => Expense::getAllExpenses($user_id, $month),

                'incomes' => Income::getAllIncomes($user_id, $month),
                'sumAllIncomes' => Income::getSumOfIncomes($user_id, $month),
                'sumAllExpenses' => Expense::getSumOfExpenses($user_id, $month),
                'incomeDetails' => Income::getAllDetailIncomes($user_id, $month),     // ✅ DODANE
                'expenseDetails' => Expense::getAllDetailExpenses($user_id, $month), // ✅ DODANE
                'month' => $month
            ];
        } else {

            return [
                'expenses' => Expense::getAllExpensesFromChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'incomes' => Income::getAllIncomesFromChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'sumAllIncomes' => Income::getSumOfIncomesForChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'sumAllExpenses' => Expense::getSumOfExpensesForChoosenPeriod($user_id, $dateFirst, $dateSecond),
                'incomeDetails' => Income::getAllDetailIncomesForChoosenPeriod($user_id, $dateFirst, $dateSecond), // ✅ DODANE
                'expenseDetails' => Expense::getAllDetailExpensesForChoosenPeriod($user_id, $dateFirst, $dateSecond), // ✅ DODANE
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
            'expenses' => $financialData['expenses'] ?? [], // jeśli chcesz odświeżyć listę
           
        ]);
        exit;
    }

public function getAdviceAction()
{
    header('Content-Type: application/json');

    try {
        $month = (int)date('m');

        $balanceService = new \App\Services\BalanceService();
        $balanceData = $balanceService->getBalanceData($this->user->id, $month);

        // tu AI dopiero działa
        $advice = $this->getFinancialAdvice($balanceData);

        echo json_encode([
            'status' => 'success',
            'advice' => $advice
        ]);
    } catch (\Exception $e) {
        error_log("ADVICE ERROR: " . $e->getMessage());

        echo json_encode([
            'status' => 'error',
            'advice' => 'AI service unavailable. Try again later.'
        ]);
    }

    exit;
}

    public function updateIncomeAction()
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        header('Content-Type: application/json');

        // 🔍 Walidacja
        if (!isset($data['id'], $data['category_id'], $data['amount'], $data['info'], $data['date'], $data['csrf_token'])) {
            echo json_encode(['status' => 'error', 'message' => 'Missing data']);
            exit;
        }

        // 🔍 Pobranie starego wpisu
        $oldIncome = Income::getIncomeById((int)$data['id']);
        if (!$oldIncome) {
            echo json_encode(['status' => 'error', 'message' => 'Income not found']);
            exit;
        }

        // 🛠️ Aktualizacja rekordu
        $success = Income::updateIncome(
            (int)$data['id'],
            (int)$data['category_id'],
            (float)$data['amount'],
            $data['info'],
            $data['date']
        );

        // 🔹 Zakres dat
        $dateFirst  = $data['dateFirst']  ?? null;
        $dateSecond = $data['dateSecond'] ?? null;

        // 🔢 Pobranie świeżych danych finansowych
        $financialData = $this->getFinancialData($this->user->id, $dateFirst, $dateSecond, $data['date']);

        $sum = $financialData['sumAllIncomes'] - $financialData['sumAllExpenses'];

        // 🔥 ZWRACAMY IDENTYCZNY FORMAT JAK updateExpenseAction()
        echo json_encode([
            'status'  => $success ? 'success' : 'error',
            'message' => $success ? 'Income updated successfully' : 'Failed to update income',

            'updatedIncome' => [
                'id'          => $data['id'],
                'amount'      => $data['amount'],
                'category_id' => $data['category_id'],
                'info'        => $data['info'],
                'date'        => $data['date'],
                'name'        => $data['name'] ?? null
            ],

            'totals' => [
                'sumAllIncomes'  => $financialData['sumAllIncomes'],
                'sumAllExpenses' => $financialData['sumAllExpenses'],
                'sum'            => $sum
            ],

            // 🔥 ZAWSZE dajemy to samo co w DELETE
            'incomes'        => $financialData['incomes'],
            'incomeDetails'  => $financialData['incomeDetails'],
            
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
