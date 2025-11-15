<?php

namespace Core;

use PDO;
use App\Config;

abstract class Model
{
    protected static function getDB()
    {
        static $db = null;

        if ($db === null) {
            $host = Config::getDbHost();
            $dbname = Config::getDbName();
            $user = Config::getDbUser();
            $pass = Config::getDbPassword();

            $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";

            $db = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
        }

        return $db;
    }
}
