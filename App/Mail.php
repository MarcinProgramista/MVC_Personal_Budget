<?php

namespace App;

use Mailgun\Mailgun;
use App\Config;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


/**
 * Mail class for sending emails via Mailgun
 */
class Mail
{
    /**
     * Send an email via Mailgun
     *
     * @param string $to Recipient email
     * @param string $subject Email subject
     * @param string $text Plain text body
     * @param string|null $html HTML body (optional)
     *
     * @return bool True if sent successfully, false otherwise
     */
    // public static function send(string $to, string $subject, ?string $text  = null, ?string $html = null): bool
    // {
    //     try {
    //         // Create Mailgun client
    //         $mg = Mailgun::create(
    //             getenv('MAILGUN_API_KEY') ?: Config::MAILGUN_API_KEY
    //         );

    //         // Message data
    //         $data = [
    //             'from'    => 'Your App <postmaster@' . Config::MAILGUN_DOMAIN . '>',
    //             'to'      => $to,
    //             'subject' => $subject,
    //             'text'    => $text,
    //         ];

    //         // Add HTML content if provided
    //         if ($html !== null) {
    //             $data['html'] = $html;
    //         }

    //         // Send the message
    //         $mg->messages()->send(Config::MAILGUN_DOMAIN, $data);

    //         return true;
    //     } catch (\Exception $e) {
    //         error_log('Mailgun send failed: ' . $e->getMessage());
    //         return false;
    //     }
    // }
    /**
     * Send an email using PHPMailer via SMTP
     */
    public static function send(string $to, string $subject, ?string $text = null, ?string $html = null): bool
    {
        $mail = new PHPMailer(true);

        try {
            // SERVER SETTINGS
            $mail->isSMTP();
            $mail->Host       = Config::getSmtpHost();
            $mail->SMTPAuth   = true;
            $mail->Username   = Config::getSmtpUser();
            $mail->Password   = Config::getSmtpPass();
            $mail->SMTPSecure = Config::getSmtpSecure();  // <-- poprawione
            $mail->Port       = Config::getSmtpPort();

            // SENDER & RECEIVER
            $mail->setFrom(Config::getSmtpFrom(), Config::getSmtpFromName());
            $mail->addAddress($to);

            // CONTENT
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $html ?: nl2br($text);
            $mail->AltBody = $text;

            // SEND
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("PHPMailer error: " . $mail->ErrorInfo);
            return false;
        }
    }
}
