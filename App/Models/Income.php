<?php

namespace App\Models;

use App\Models\User;

use PDO;

/**
 * Example user model
 *
 * PHP version 7.0
 */
class Income extends \Core\Model
{
    public int $id;
    public int $user_id;
    public int $income_category_assigned_to_user_id;
    public float $amount;
    public string $date_of_income;
    public string $income_comment;
    public ?string $dateIncome;
    public string $messageIncome;
    public string $incomeCategoryName;

    public array $errors = [];
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
    public  static function updateCategoryForAnother($id, $user_id, $category_another_id)
    {
        $sql = 'UPDATE incomes
                SET income_category_assigned_to_user_id = :income_category_assigned_to_user_id 
                WHERE user_id = :user_id and income_category_assigned_to_user_id = :id';
        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':income_category_assigned_to_user_id', $category_another_id, PDO::PARAM_INT);

        $stmt->execute();

        return true;
    }

    /**
     * Pobiera sumę amount dla danej kategorii i miesiąca (i użytkownika)
     *
     * @param int $userId
     * @param int $categoryId
     * @param int $monthNumber
     * @return float
     */
    public static function getSumForCategoryAndMonth(
        int $userId,
        int $categoryId,
        int $monthNumber
    ): float {
        // Walidacja parametrów
        if ($userId <= 0 || $categoryId <= 0) {
            throw new \InvalidArgumentException('User ID and Category ID must be positive');
        }

        if ($monthNumber < 1 || $monthNumber > 12) {
            throw new \InvalidArgumentException('Month must be between 1 and 12');
        }

        $sql = "SELECT SUM(amount) AS total
            FROM incomes
            WHERE user_id = :user_id
            AND income_category_assigned_to_user_id = :category_id
            AND MONTH(date_of_income) = :month";

        try {
            $db = static::getDB();
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
            $stmt->bindValue(':month', $monthNumber, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetchColumn();
            return $result !== false ? (float)$result : 0.0;
        } catch (PDOException $e) {
            error_log('Database error in getSumForCategoryAndMonth: ' . $e->getMessage());
            throw new \RuntimeException('Failed to calculate sum for category');
        }
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
        $sql = "SELECT SUM(amount) AS total FROM incomes
            WHERE user_id = :userId
            AND MONTH(date_of_income) = :monthNumber";

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':userId', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':monthNumber', $monthNumber, PDO::PARAM_INT);

        $stmt->execute();

        return $stmt->fetchColumn() ?: 0;
    }

    /**
     * Save the income model with the current property values
     *
     * @return void
     */
    public function save($user_id, $income_category_assigned_to_user_id)
    {
        $this->validate();
        if (empty($this->errors)) {

            $sql = 'INSERT INTO incomes (user_id, income_category_assigned_to_user_id, amount, date_of_income, income_comment ) 
                    VALUES (:user_id, :idCategoryIncome, :amount, :dateIncome, :messageIncome)';

            $db = static::getDB();
            $stmt = $db->prepare($sql);

            $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindValue(':idCategoryIncome', $income_category_assigned_to_user_id, PDO::PARAM_INT);
            $stmt->bindValue(':amount', $this->amount, PDO::PARAM_STR);
            $stmt->bindValue(':dateIncome', $this->dateIncome, PDO::PARAM_STR);
            $stmt->bindValue(':messageIncome', $this->messageIncome, PDO::PARAM_STR);

            $stmt->execute();

            return true;
        }
        return false;
    }


    /**
     * Validate current property values, adding valiation error messages to the errors array property
     *
     * @return void
     */
    public function validate()
    {
        if (!is_numeric($_POST['amount'])) {
            $this->errors[] = 'Put amount of income';
        }

        if (!isset($_POST['amount'])) {
            $this->errors[] = 'You need put the amount of income';
        }
    }

    /**
     * Find id category in incomes_category_assigned_to_users
     *
     * @return name category
     */
    public static function findIdIncomeCategory($user_id, $nameCategory)
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
     * Get all the incomes from current month
     *
     * @return array
     */
    public static function getAllIncomes($id, $month)
    {
        $sql = '
        SELECT 
            category_incomes.name AS Category,
            SUM(incomes.amount) AS Amount
        FROM incomes  
        INNER JOIN incomes_category_assigned_to_users AS category_incomes
            ON incomes.income_category_assigned_to_user_id = category_incomes.id
        WHERE incomes.user_id = :id 
          AND MONTH(incomes.date_of_income) = :month
        GROUP BY category_incomes.name
        ORDER BY category_incomes.name
    ';

        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':month', $month, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }



    /**
     * Get Sum of Incomes from month
     *
     * @param int $id
     * @param int $month
     * @return float|null
     */
    public static function getSumOfIncomes($id, $month)
    {
        $sql = 'SELECT sum(amount) as Amount from incomes WHERE  incomes.user_id = :id AND Month(incomes.date_of_income) = :month';

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':month', $month, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetch(PDO::FETCH_ASSOC);

        return (float) $results['Amount'];
    }
    /**
     * Get all the incomes from choosen period
     *
     * @return array
     */
    public static function getAllIncomesFromChoosenPeriod($id, $dateFirst, $dateSecond)
    {

        $sql = 'SELECT category_incomes.name as Category, SUM(incomes.amount) as Amount 
                FROM incomes INNER JOIN incomes_category_assigned_to_users as category_incomes 
                WHERE incomes.income_category_assigned_to_user_id = category_incomes.id 
                AND incomes.user_id=:id 
                AND date_of_income >= :dateFirst 
                AND date_of_income <= :dateSecond 
                GROUP BY Category';

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
     * Get Sum of Incomes for chosen period
     *
     * @param int $id
     * @param string $dateFirst
     * @param string $dateSecond
     * @return float
     */
    public static function getSumOfIncomesForChoosenPeriod($id, $dateFirst, $dateSecond)
    {
        $sql = 'SELECT SUM(amount) AS Amount 
            FROM incomes 
            WHERE user_id = :id 
            AND date_of_income >= :dateFirst 
            AND date_of_income <= :dateSecond';

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':dateFirst', $dateFirst, PDO::PARAM_STR);
        $stmt->bindValue(':dateSecond', $dateSecond, PDO::PARAM_STR);

        $stmt->execute();
        $results = $stmt->fetch(PDO::FETCH_ASSOC);

        // Rzutowanie na float i obsługa NULL
        return isset($results['Amount']) ? (float)$results['Amount'] : 0.0;
    }



    /**
     * Get all the incomes in detail from current month
     *
     * @return array
     */
    public static function getAllDetailIncomes($id, $month)
    {
        $sql = 'SELECT incomes.user_id, incomes.id as id, 
                        date_of_income as Data,
                        amount as Amount,
                        category_incomes.name as Category, 
                        incomes.income_comment as info,
                        incomes.income_category_assigned_to_user_id 
                FROM incomes  
                INNER JOIN incomes_category_assigned_to_users as category_incomes 
                WHERE incomes.income_category_assigned_to_user_id = category_incomes.id 
                    and incomes.user_id = :id 
                    AND Month(date_of_income)=:month ORDER BY Data';

        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':month', $month, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Get all detials the incomes for choosen period
     *
     * @return array
     */
    public static function getAllDetailIncomesForChoosenPeriod($id, $dateFirst, $dateSecond)
    {
        $sql = 'SELECT incomes.id as id, 
                        incomes.date_of_income as Data, 
                        incomes.amount as Amount,
                        category_incomes.name as Category, 
                        incomes.income_comment as info,
                        incomes.income_category_assigned_to_user_id
                        FROM incomes  INNER JOIN incomes_category_assigned_to_users as category_incomes 
                        WHERE incomes.income_category_assigned_to_user_id = category_incomes.id 
                        AND incomes.user_id = :id 
                        AND date_of_income >= :dateFirst 
                        AND date_of_income <= :dateSecond';

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
     * Update income
     *
     * @param int $id
     * @param int $categoryId
     * @param float $amount
     * @param string $comment
     * @return bool
     */
    public static function updateIncome(int $id, int $categoryId, float $amount, string $comment, string $date): bool
    {
        $sql = 'UPDATE incomes 
            SET income_category_assigned_to_user_id = :categoryId, 
                amount = :amount, 
                income_comment = :comment,
                date_of_income = :date
            WHERE id = :id';

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':categoryId', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':amount', $amount);
        $stmt->bindValue(':comment', $comment, PDO::PARAM_STR);
        $stmt->bindValue(':date', $date, PDO::PARAM_STR);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Pobierz przychód po jego ID
     *
     * @param int $id
     * @return object|null Zwraca obiekt przychodu lub null jeśli nie istnieje
     */
    public static function getIncomeById(int $id)
    {
        $sql = 'SELECT * FROM incomes WHERE id = :id LIMIT 1';

        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_OBJ); // FETCH_OBJ daje dostęp przez $result->Amount itp.
        return $result ?: null;
    }

    /**
     * Usuwa przychód użytkownika.
     *
     * @param int $id ID przychodu
     * @param int $userId ID użytkownika
     * @return bool
     */
    public static function deleteIncome($id, $userId)
    {
        $sql = "DELETE FROM incomes 
                WHERE id = :id 
                AND user_id = :user_id
                LIMIT 1";

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
