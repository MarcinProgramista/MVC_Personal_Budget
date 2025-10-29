<?php

namespace App\Models;

use App\Models\User;

use PDO;

/**
 * Example user model
 *
 * PHP version 7.0
 */
class PaymentMethod extends \Core\Model
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
     * Get all Payment methods assigned to user as an associative array
     *
     * @return array
     */
    public static function getAllPaymentMethodAssignedToUser($id)
    {
        $sql = 'SELECT * FROM payment_methods_assigned_to_users WHERE user_id = :id';
        $db = static::getDB();

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $results;
    }

    /**
     * Add new method payment category for a user
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
            'INSERT INTO payment_methods_assigned_to_users (user_id, name, cash_limit, is_limit_active) 
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
     * Find a user model by name address
     *
     * @param string $name name address to search for
     *
     * @return mixed Category object if found, false otherwise
     */
    public static function existMethodPaymentName($name, $userId)
    {
        $sql = 'SELECT * FROM payment_methods_assigned_to_users WHERE name = :name AND user_id = :user_id LIMIT 1';


        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->setFetchMode(PDO::FETCH_CLASS, get_called_class());
        $stmt->execute();

        return $stmt->fetch();
    }
    /**
     * Delete an method payment by ID for a specific user
     *
     * @param int $id Category ID
     * @param int $userId User ID
     * @return bool True on success, false on failure
     */
    public static function deleteCategoryById(int $id, int $userId): bool
    {
        $db = static::getDB();
        $stmt = $db->prepare(
            'DELETE FROM payment_methods_assigned_to_users WHERE id = :id AND user_id = :user_id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Update method payment by ID for a specific user
     */
    public static function updateCategory(int $userId, int $id, string $name, ?string $cashLimit, $is_limit_active): bool
    {
        $db = static::getDB();

        $stmt = $db->prepare(
            'UPDATE payment_methods_assigned_to_users 
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
}
