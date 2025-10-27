<?php

namespace App\Models;

use App\Models\User;

use PDO;

/**
 * Example user model
 *
 * PHP version 7.0
 */
class IncomeCategory extends \Core\Model
{
    public int $id;
    public string $name;
    public int $user_id;

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
    public static function getAllIncomesAssignedToUser($id)
    {
        $sql = 'SELECT id,name FROM incomes_category_assigned_to_users WHERE user_id = :id';
        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Find a category by name 
     * 
     * @param string $name to search for 
     * 
     * @return mixed Category object if found, false otherwise
     */
    public static function existCategoryIncomeName($name, $userId)
    {
        $sql = 'SELECT * FROM incomes_category_assigned_to_users WHERE name = :name AND user_id = :user_id';
        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->setFetchMode(PDO::FETCH_CLASS, get_called_class());
        $stmt->execute();

        return $stmt->fetch();
    }


    /**
     * Add new income category for a user
     *
     * @param int $userId
     * @param string $name
     * @return bool|int Returns inserted ID on success, false on failure
     */
    public static function addIncomeCategory($userId, $name)
    {
        $db = static::getDB();
        $stmt = $db->prepare(
            'INSERT INTO incomes_category_assigned_to_users (user_id, name) 
         VALUES (:user_id, :name)'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);


        if ($stmt->execute()) {
            return (int)$db->lastInsertId();
        }
        return false;
    }

    /**
     * Get Id Category
     * 
     * @param int $userId
     * @param string $name
     * @return int return Id
     */
    public static function getCategoryIdByName($name, $userId)
    {
        $sql = 'SELECT id FROM incomes_category_assigned_to_users WHERE name = :name AND user_id = :user_id LIMIT 1';
        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);



        return $result ? (int)$result['id'] : null;
    }
}
