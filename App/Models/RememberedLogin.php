<?php

namespace App\Models;

use PDO;
use App\Token;
use App\Models\User;

class RememberedLogin extends \Core\Model
{
    /** @var string */
    public string $token_hash;

    /** @var int */
    public int $user_id;

    /** @var string */
    public string $expires_at;

    /**
     * Find a remembered login model by the token
     */
    public static function findByToken($token)
    {
        $token = new Token($token);
        $token_hash = $token->getHash();

        $sql = 'SELECT * FROM remembered_logins WHERE token_hash = :token_hash';

        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':token_hash', $token_hash, PDO::PARAM_STR);

        $stmt->setFetchMode(PDO::FETCH_CLASS, get_called_class());
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get the user model associated with this remembered login
     */
    public function getUser()
    {
        return User::findByID($this->user_id);
    }

    /**
     * Check if the token has expired
     */
    public function hasExpired(): bool
    {
        return strtotime($this->expires_at) < time();
    }

    /**
     * Delete this model
     *
     * @return void
     */
    public function delete()
    {
        $sql = 'DELETE FROM remembered_logins
                WHERE token_hash = :token_hash';

        $db = static::getDB();
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':token_hash', $this->token_hash, PDO::PARAM_STR);

        $stmt->execute();
    }
}
