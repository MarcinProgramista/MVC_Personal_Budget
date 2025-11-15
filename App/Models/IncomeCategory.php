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
    public ?string $cash_limit = null;
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
    public static function getAllIncomesAssignedToUser($id)
    {
        $sql = 'SELECT * FROM incomes_category_assigned_to_users WHERE user_id = :id';
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
     * Sprawdza, czy kategoria wydatków o danej nazwie istnieje dla użytkownika,
     * z opcjonalnym pominięciem konkretnego ID (np. przy edycji).
     *
     * @param string $name Nazwa kategorii
     * @param int $userId ID użytkownika
     * @param int|null $excludeId ID kategorii, którą pomijamy (np. edytowana)
     * @return mixed Obiekt kategorii jeśli istnieje, false jeśli nie
     */
    public static function existCategoryName($name, $userId, $excludeId = null)
    {
        if (!$name || !$userId) {
            return false;
        }

        try {
            $sql = 'SELECT * FROM incomes_category_assigned_to_users 
                WHERE name = :name AND user_id = :user_id';

            // 🔹 Jeśli mamy excludeId, to pomijamy ten rekord
            if (!empty($excludeId)) {
                $sql .= ' AND id != :exclude_id';
            }

            $db = static::getDB();
            if (!$db) {
                return false;
            }

            $stmt = $db->prepare($sql);
            $stmt->bindValue(':name', $name, \PDO::PARAM_STR);
            $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);

            if (!empty($excludeId)) {
                $stmt->bindValue(':exclude_id', $excludeId, \PDO::PARAM_INT);
            }

            $stmt->setFetchMode(\PDO::FETCH_CLASS, get_called_class());
            $stmt->execute();

            $result = $stmt->fetch();

            return $result ?: false;
        } catch (\PDOException $e) {
            error_log("💥 existCategoryName error: " . $e->getMessage());
            return false;
        }
    }


    /**
     * Update income category by ID for a specific user
     */
    public static function updateCategory(int $userId, int $id, string $name, ?string $cashLimit, $is_limit_active): bool
    {
        $db = static::getDB();

        $stmt = $db->prepare(
            'UPDATE incomes_category_assigned_to_users 
         SET name = :name, cash_limit = :cash_limit, is_limit_active = :is_limit_active 
         WHERE id = :id AND user_id = :user_id'
        );

        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        if ($cashLimit === '' || $cashLimit === null) {
            $stmt->bindValue(':cash_limit', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':cash_limit', $cashLimit, PDO::PARAM_STR);
        }
        $stmt->bindValue(':is_limit_active', $is_limit_active ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Add new income category for a user
     *
     * @param int $userId
     * @param string $name
     * @return bool|int Returns inserted ID on success, false on failure
     */
    public static function addIncomeCategory($userId, $name, $is_limit_active, $cashLimit = null)
    {
        $db = static::getDB();

        $stmt = $db->prepare(
            'INSERT INTO incomes_category_assigned_to_users (user_id, name, cash_limit, is_limit_active) 
         VALUES (:user_id, :name, :cash_limit, :is_limit_active)'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':cash_limit', $cashLimit !== '' ? $cashLimit : null, PDO::PARAM_STR);

        $stmt->bindValue(':is_limit_active', $is_limit_active ? 1 : 0, PDO::PARAM_INT);


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

    /**
     * Delete an expense category by ID for a specific user
     *
     * @param int $id Category ID
     * @param int $userId User ID
     * @return bool True on success, false on failure
     */
    public static function deleteCategoryById(int $id, int $userId): bool
    {

        $db = static::getDB();
        $stmt = $db->prepare(
            'DELETE FROM incomes_category_assigned_to_users WHERE id = :id AND user_id = :user_id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }


    /**
     * Find expcted money in the money from category 
     *
     * @return limit @float
     */
    public static function findExpectedMonetForChosenCategory($user_id, $categoryId)
    {
        $sql = 'SELECT cash_limit 
            FROM incomes_category_assigned_to_users 
            WHERE user_id = :user_id AND id = :categoryId';

        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':categoryId', $categoryId, PDO::PARAM_INT);

        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result && isset($result['cash_limit']) ? (float)$result['cash_limit'] : 0;
    }

    /**
     * Find id category in incomes_category_assigned_to_users
     *
     * @return name category
     */
    public static function findNameIncomeCategory($user_id, $id)
    {
        $sql = 'SELECT name FROM incomes_category_assigned_to_users WHERE user_id = :user_id AND id=:id';
        $db = static::getDB();
        $stmt = $db->prepare($sql);

        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['name'];
    }
}
