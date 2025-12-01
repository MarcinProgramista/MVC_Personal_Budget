<?php

namespace App\Models;

use App\Models\User;

use PDO;



/**
 * Example user model
 *
 * PHP version 7.0
 */
class Expense extends \Core\Model
{
    public int $id;
    public int $user_id;

    public float $amount;
    public array $errors = [];
    public string $dateExpense;
    public string $expenseCategoryName;
    public string $namePayment;
    public string $messageExpense;


    public int $expense_category_assigned_to_user_id = 0;
    public int $payment_method_assigned_to_user_id = 0;
    public ?string $date_of_expense = null;
    /**
     * Class constructor
     *
     * @param array $data  Initial property values
     *
     * @return void
     */
    public function __construct($data = [])
    {
        foreach ($data as $key => $value) {
            $this->$key = $value;
        };
    }

    /**
     * Update $income_category_assigned_to_user_id
     * 
     * @param $category_another_id
     * @param $user_id
     * 
     * return void
     */
    public static function updateCategoryForAnother(int $id, int $user_id, int $category_another_id): bool
    {
        // Walidacja parametrów
        if ($id <= 0 || $user_id <= 0 || $category_another_id <= 0) {
            throw new \InvalidArgumentException('All IDs must be positive integers');
        }

        $sql = 'UPDATE expenses
            SET expense_category_assigned_to_user_id = :expense_category_assigned_to_user_id 
            WHERE user_id = :user_id 
            AND expense_category_assigned_to_user_id = :id';

        try {
            $db = static::getDB();
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindValue(':expense_category_assigned_to_user_id', $category_another_id, PDO::PARAM_INT);

            $result = $stmt->execute();

            // Sprawdź czy cokolwiek zostało zaktualizowane
            return $result && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Failed to update category: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all the Categries from expense as an associative array
     *
     * @return array
     */
    public static function getCategories($id)
    {
        $sql = 'SELECT id,name FROM expenses_category_assigned_to_users WHERE user_id = :id';
        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Pobiera sumę amount dla danej kategorii i miesiąca (i użytkownika)
     *
     * @param int $userId
     * @param int $categoryId
     * @param int $monthNumber
     * @return float
     */
    public static function getSumForCategoryAndMonth($userId, $categoryId, $monthNumber)
    {
        $sql = "SELECT SUM(amount) AS total
                FROM expenses
                WHERE user_id = :user_id
                AND expense_category_assigned_to_user_id = :category_id
                AND MONTH(date_of_expense) = :month";

        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':month', $monthNumber, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchColumn() ?: 0;
    }

    /**
     * Take sum amount from all categries from month and loged user 
     *
     * @param int $userId
     * @param int $monthNumber
     * @return float
     */
    public static function getSumForAllCategoryAndMonth($userId, $monthNumber)
    {
        $sql = "SELECT SUM(amount) AS total FROM expenses
            WHERE user_id = :userId
            AND MONTH(date_of_expense) = :monthNumber";

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':userId', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':monthNumber', $monthNumber, PDO::PARAM_INT);

        $stmt->execute();

        return $stmt->fetchColumn() ?: 0;
    }

    /**
     * Pobiera sumę amount dla danej kategorii i miesiąca (i użytkownika)
     *
     * @param int $userId
     * @param int $categoryId
     * @param int $monthNumber
     * @return float
     */
    public static function getSumForPaymentMethodAndChoosenMonth($userId, $categoryId, $monthNumber)
    {
        $sql = "SELECT SUM(amount) AS total
                FROM expenses
                WHERE user_id = :user_id
                AND payment_method_assigned_to_user_id = :category_id
                AND MONTH(date_of_expense) = :month";

        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':month', $monthNumber, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchColumn() ?: 0;
    }

    /**
     * Validate current property values, adding valiation error messages to the errors array property
     *
     * @return void
     */
    public function validate()
    {
        $this->errors = [];

        if (empty($this->expense_category_assigned_to_user_id)) {
            $this->errors[] = 'Category is required';
        }

        if (empty($this->payment_method_assigned_to_user_id)) {
            $this->errors[] = 'Payment method is required';
        }

        if (empty($this->amount) || $this->amount <= 0) {
            $this->errors[] = 'Amount must be greater than zero';
        }

        if (empty($this->dateExpense)) {
            $this->errors[] = 'Date is required';
        }

        return empty($this->errors);
    }

    public function save()
    {
        $this->validate();
        if (empty($this->errors)) {


            $sql = 'INSERT INTO expenses (user_id, expense_category_assigned_to_user_id, payment_method_assigned_to_user_id, amount, date_of_expense, expense_comment) 
                    VALUES (:user_id, :idCategoryExpense, :idMethodPeyment, :amount, :dateExpense, :messageExpense)';

            $db = static::getDB();
            $stmt = $db->prepare($sql);

            $stmt->bindValue(':user_id', $this->user_id, PDO::PARAM_INT);
            $stmt->bindValue(':idCategoryExpense', $this->expense_category_assigned_to_user_id, PDO::PARAM_INT);
            $stmt->bindValue(':idMethodPeyment', $this->payment_method_assigned_to_user_id, PDO::PARAM_INT);
            $stmt->bindValue(':amount', $this->amount, PDO::PARAM_STR);
            $stmt->bindValue(':dateExpense', $this->dateExpense, PDO::PARAM_STR);
            $stmt->bindValue(':messageExpense', $this->messageExpense, PDO::PARAM_STR);

            $stmt->execute();

            return true;
        }
        return false;
    }

    /**
     * Find id category in incomes_category_assigned_to_users
     *
     * @return name category
     */
    public static function findIdExpenseCategory($user_id, $nameCategory)
    {
        $sql = 'SELECT id FROM incomes_category_assigned_to_users WHERE user_id = :user_id AND name=:nameCategory';
        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':nameCategory', $nameCategory, PDO::PARAM_STR);

        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['id'];
    }

    /**
     * Get all the expenses from current month
     *
     * @return array
     */
    public static function getAllExpenses($id, $month)
    {

        $sql = 'SELECT category_expenses.name as Category, 
        SUM(expenses.amount) as Amount 
        FROM expenses INNER JOIN expenses_category_assigned_to_users as category_expenses WHERE expenses.expense_category_assigned_to_user_id = category_expenses.id and expenses.user_id = :id AND Month(date_of_expense) = :month GROUP BY Category';

        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':month', $month, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Get Sum of Expense from month
     * @param int $id
     * @param int $month
     * @return float|null
     */
    public static function getSumOfExpenses($id, $month)
    {
        $sql = 'SELECT sum(amount) as Amount from expenses WHERE  expenses.user_id = :id AND Month(expenses.date_of_expense) = :month';

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':month', $month, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetch(PDO::FETCH_ASSOC);

        return (float) $results['Amount'];
    }

    /**
     * Get all the expenese from choosen period
     *
     * @return array
     */
    public static function getAllExpensesFromChoosenPeriod($id, $dateFirst, $dateSecond)
    {

        $sql = 'SELECT category_expenses.name as Category, SUM(expenses.amount) as Amount FROM expenses INNER JOIN expenses_category_assigned_to_users as category_expenses WHERE expenses.expense_category_assigned_to_user_id = category_expenses.id and expenses.user_id = :id AND date_of_expense >= :dateFirst AND date_of_expense <= :dateSecond GROUP BY Category';

        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':dateFirst', $dateFirst,  PDO::PARAM_STR);
        $stmt->bindValue(':dateSecond', $dateSecond, PDO::PARAM_STR);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Get Sum of Expenses for choosen period
     *
     * @param int $id
     * @param string $dateFirst
     * @param string $dateSecond
     * @return float
     */
    public static function getSumOfExpensesForChoosenPeriod($id, $dateFirst, $dateSecond)
    {
        $sql = 'SELECT sum(amount) as Amount from expenses WHERE  expenses.user_id = :id AND date_of_expense >= :dateFirst AND date_of_expense <= :dateSecond';

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':dateFirst', $dateFirst,  PDO::PARAM_STR);
        $stmt->bindValue(':dateSecond', $dateSecond, PDO::PARAM_STR);
        $stmt->execute();
        $results = $stmt->fetch(PDO::FETCH_ASSOC);

        return isset($results['Amount']) ? (float)$results['Amount'] : 0.0;
    }

    /**
     * Get all the expenses in detail from current month
     *
     * @return array
     */
    public static function getAllDetailExpenses($id, $month)
    {
        $sql = 'SELECT expenses.user_id, expenses.date_of_expense AS date, 
                        expenses.amount AS Amount, 
                        expenses_category_assigned_to_users.name As Category, 
                        payment_methods_assigned_to_users.name AS Method_Payment, 
                        expenses.expense_comment AS info,
                        expense_category_assigned_to_user_id,
                        payment_method_assigned_to_user_id, 
                        expenses.id
                FROM expenses 
                LEFT OUTER JOIN expenses_category_assigned_to_users 
                ON expenses.expense_category_assigned_to_user_id = expenses_category_assigned_to_users.id 
                LEFT OUTER JOIN payment_methods_assigned_to_users 
                ON expenses.payment_method_assigned_to_user_id = payment_methods_assigned_to_users.id 
                WHERE expenses.user_id = :id AND Month(date_of_expense) = :month';

        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':month', $month, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Get all detials the expenses for choosen period
     *
     * @return array
     */
    public static function getAllDetailExpensesForChoosenPeriod($id, $dateFirst, $dateSecond)
    {
        $sql = 'SElECT expenses.user_id, 
                        expenses.date_of_expense AS date, 
                        expenses.amount AS Amount, 
                        expenses_category_assigned_to_users.name As Category, 
                        payment_methods_assigned_to_users.name AS Method_Payment, 
                        expenses.expense_comment AS info,
                         expense_category_assigned_to_user_id,
                        payment_method_assigned_to_user_id, 
                        expenses.id 
                        FROM expenses 
                        LEFT OUTER JOIN expenses_category_assigned_to_users 
                        ON expenses.expense_category_assigned_to_user_id = expenses_category_assigned_to_users.id
                        LEFT OUTER JOIN payment_methods_assigned_to_users 
                        ON expenses.payment_method_assigned_to_user_id = payment_methods_assigned_to_users.id 
                        WHERE expenses.user_id = :id AND date_of_expense >= :dateFirst AND date_of_expense <= :dateSecond';

        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':dateFirst', $dateFirst,  PDO::PARAM_STR);
        $stmt->bindValue(':dateSecond', $dateSecond, PDO::PARAM_STR);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }
    public static function getExpenseById($id)
    {
        $db = static::getDB();
        $stmt = $db->prepare('SELECT * FROM expenses WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_OBJ);
    }

    public static function updateExpense($id, $categoryId, $paymentId, $amount, $info, $date)
    {
        $db = static::getDB();
        $stmt = $db->prepare('
        UPDATE expenses
        SET expense_category_assigned_to_user_id = :category_id,
            payment_method_assigned_to_user_id = :payment_id,
            amount = :amount,
            date_of_expense = :date,
            expense_comment = :info
        WHERE id = :id
    ');

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':payment_id', $paymentId, PDO::PARAM_INT);
        $stmt->bindValue(':amount', $amount);
        $stmt->bindValue(':date', $date);
        $stmt->bindValue(':info', $info);

        return $stmt->execute();
    }

    /**
     * Delete expense when you have id and user_id
     *
     * @param int $id
     * @param int $user_id
     * @return bool true jeśli usunięto, false jeśli nie znaleziono lub błąd
     */
    public static function deleteExpense($id, $user_id)
    {
        $db = static::getDB();

        $sql = 'DELETE FROM expenses 
                WHERE id = :id AND user_id = :user_id
                LIMIT 1';

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', (int)$user_id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
