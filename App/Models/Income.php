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
    public ?string $date_of_income;
    public string $income_comment;

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
}
