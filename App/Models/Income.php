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
    public static function getSumForCategoryAndMonth($userId, $categoryId, $monthNumber)
    {
        $sql = "SELECT SUM(amount) AS total
                FROM incomes
                WHERE user_id = :user_id
                AND income_category_assigned_to_user_id = :category_id
                AND MONTH(date_of_income) = :month";

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
}
