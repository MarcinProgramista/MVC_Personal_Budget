<?php

namespace App;

use PHPMailer\PHPMailer\PHPMailer;

class Config
{
    const SHOW_ERRORS = true;
    public static function getDbHost(): string
    {
        return $_ENV['DB_HOST'] ?? 'localhost';
    }

    public static function getDbName(): string
    {
        return $_ENV['DB_NAME'] ?? 'mvclogin';
    }

    public static function getDbUser(): string
    {
        return $_ENV['DB_USER'] ?? 'root';
    }

    public static function getDbPassword(): string
    {
        return $_ENV['DB_PASSWORD'] ?? '';
    }

    public static function getSecretKey(): string
    {
        return $_ENV['SECRET_KEY'] ?? 'secret';
    }

    public static function getSmtpHost(): string
    {
        return $_ENV['SMTP_HOST'];
    }

    public static function getSmtpUser(): string
    {
        return $_ENV['SMTP_USER'];
    }

    public static function getSmtpPass(): string
    {
        return $_ENV['SMTP_PASS'];
    }

    public static function getSmtpPort(): int
    {
        return (int) $_ENV['SMTP_PORT'];
    }

    public static function getSmtpFrom(): string
    {
        return $_ENV['SMTP_FROM'];
    }

    public static function getSmtpFromName(): string
    {
        return $_ENV['SMTP_FROM_NAME'];
    }

    public static function getGeminiApiKey(): string
    {
        return $_ENV['GEMINI_API_KEY'];
    }
    public static function getSmtpSecure(): string
    {
        return $_ENV['SMTP_SECURE'] ?? 'tls';
    }
}
