<?php

namespace App;

/**
 * Application configuration
 *
 * PHP version 7.0
 */
class Config
{
    /**
     * Database host
     * @var string
     */
    public const DB_HOST = 'localhost';

    /**
     * Database name
     * @var string
     */
    public const DB_NAME = 'mvclogin';

    /**
     * Database user
     * @var string
     */
    public const DB_USER = 'marcin';

    /**
     * Database password
     * @var string
     */
    public const DB_PASSWORD = '';

    /**
     * Show or hide error messages on screen
     * @var boolean
     */
    public const SHOW_ERRORS = true;
    /**
     * Secret key for hashing
     * @var boolean
     */
    public const SECRET_KEY = '';
}
