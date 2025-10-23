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
}
