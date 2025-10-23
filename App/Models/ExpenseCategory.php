<?php

namespace App\Models;

use App\Models\User;

use PDO;

/**
 * Example user model
 *
 * PHP version 7.0
 */
class ExpenseCategory extends \Core\Model
{
    public int $id;
    public string $name;
    public int $user_id;
    public string $cash_limit;
    public int $is_limit_active;

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
     * Get all categries incomes assigned to user as an associative array
     *
     * @return array
     */
    public static function getAllExpenseAssignedToUser($id)
    {
        $sql = 'SELECT id,name, cash_limit, is_limit_active FROM expenses_category_assigned_to_users WHERE user_id = :id';
        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Find a user model by name address
     *
     * @param string $email email address to search for
     *
     * @return mixed User object if found, false otherwise
     */
    public static function existCategoryName($name, $userId)
    {
        $sql = 'SELECT * FROM expenses_category_assigned_to_users WHERE name = :name AND user_id = :user_id';

        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->setFetchMode(PDO::FETCH_CLASS, get_called_class());
        $stmt->execute();

        return $stmt->fetch();
    }


    /**
     * Add new expense category for a user
     *
     * @param int $userId
     * @param string $name
     * @param string|null $cashLimit
     * @return bool|int Returns inserted ID on success, false on failure
     */
    public static function addCategory($userId, $name, $cashLimit = null)
    {
        $db = static::getDB();
        $stmt = $db->prepare(
            'INSERT INTO expenses_category_assigned_to_users (user_id, name, cash_limit, is_limit_active) 
         VALUES (:user_id, :name, :cash_limit, :is_limit_active)'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':cash_limit', $cashLimit ?: null, PDO::PARAM_STR);
        $stmt->bindValue(':is_limit_active', $cashLimit ? 1 : 0, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return (int)$db->lastInsertId();
        }
        return false;
    }
}
