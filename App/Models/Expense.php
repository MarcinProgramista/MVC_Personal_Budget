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
    public int $income_category_assigned_to_user_id;
    public int $ayment_method_assigned_to_user_id;
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
        $sql = 'UPDATE  expenses
                SET 	expense_category_assigned_to_user_id = :expense_category_assigned_to_user_id 
                WHERE user_id = :user_id and expense_category_assigned_to_user_id = :id';
        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':expense_category_assigned_to_user_id', $category_another_id, PDO::PARAM_INT);

        $stmt->execute();

        return true;
    }
}
