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
    public static function getAllExpenseAssignedToUser($id)
    {
        $sql = 'SELECT * FROM expenses_category_assigned_to_users WHERE user_id = :id';
        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Sprawdza, czy kategoria wydatków o danej nazwie istnieje dla użytkownika
     *
     * @param string $name Nazwa kategorii
     * @param int $userId ID użytkownika
     * @return mixed Obiekt kategorii jeśli istnieje, false jeśli nie lub w przypadku błędu
     */
    public static function existCategoryName($name, $userId)
    {
        if (!$name || !$userId) {
            return false; // brak danych → od razu false
        }

        try {
            $sql = 'SELECT * FROM expenses_category_assigned_to_users WHERE name = :name AND user_id = :user_id';
            $db = static::getDB();
            if (!$db) {
                return false; // brak połączenia z DB
            }

            $stmt = $db->prepare($sql);
            $stmt->bindValue(':name', $name, \PDO::PARAM_STR);
            $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
            $stmt->setFetchMode(\PDO::FETCH_CLASS, get_called_class());
            $stmt->execute();

            $result = $stmt->fetch();

            return $result ?: false; // jeśli brak rekordu → false
        } catch (\PDOException $e) {
            error_log("💥 existCategoryName error: " . $e->getMessage());
            return false; // w przypadku błędu → false
        }
    }


    /**
     * Add new expense category for a user
     *
     * @param int $userId
     * @param string $name
     * @param string|null $cashLimit
     * @return bool|int Returns inserted ID on success, false on failure
     */
    public static function addCategory($userId, $name, $is_limit_active, $cashLimit = null)
    {
        $db = static::getDB();
        $stmt = $db->prepare(
            'INSERT INTO expenses_category_assigned_to_users (user_id, name, cash_limit, is_limit_active) 
         VALUES (:user_id, :name, :cash_limit, :is_limit_active)'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':cash_limit', $cashLimit ?: null, PDO::PARAM_STR);
        $stmt->bindValue(':is_limit_active', $is_limit_active ? 1 : 0, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return (int)$db->lastInsertId();
        }
        return false;
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
            'DELETE FROM expenses_category_assigned_to_users WHERE id = :id AND user_id = :user_id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Update expense category by ID for a specific user
     */
    public static function updateCategory(int $userId, int $id, string $name, ?string $cashLimit, $is_limit_active): bool
    {
        $db = static::getDB();

        $stmt = $db->prepare(
            'UPDATE expenses_category_assigned_to_users 
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
     * Get Id Category
     * 
     * @param int $userId
     * @param string $name
     * @return int return Id
     */
    public static function getCategoryIdByName($name, $userId)
    {
        $sql = 'SELECT id FROM expenses_category_assigned_to_users WHERE name = :name AND user_id = :user_id LIMIT 1';
        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);



        return $result ? (int)$result['id'] : null;
    }
}
