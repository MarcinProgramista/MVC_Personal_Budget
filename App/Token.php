<?php

namespace App;

/**
 * Unique random tokens
 *
 * PHP version 7.0
 */
class Token
{
    /**
     * The token value
     * @var string
     */
    protected $token;
    public string $remember_token;

    /**
     * Class constructor. Create a new random token or assign an existing one if passed in.
     *
     * @param string|null $token_value (optional) A token value
     *
     * @return void
     */
    public function __construct($token_value = null)
    {
        if ($token_value) {
            $this->token = $token_value;
        } else {
            // 16 bytes = 128 bits = 32 hex characters
            $this->token = bin2hex(random_bytes(16));
        }
    }

    /**
     * Get the token value
     *
     * @return string The value
     */
    public function getValue()
    {
        return $this->token;
    }

    /**
     * Get the hashed token value
     *
     * @return string The hashed value
     */
    public function getHash()
    {
        return hash_hmac('sha256', $this->token, \App\Config::getSecretKey());
    }
}
