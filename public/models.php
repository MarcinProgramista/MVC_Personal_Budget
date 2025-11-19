<?php
require __DIR__ . '/../vendor/autoload.php';

use GeminiAPI\Client;

$apiKey = $_ENV['GEMINI_API_KEY'] ?? null;

// Jeśli .env nie działa – wpisz ręcznie:
if (!$apiKey) {
    $apiKey = "";
}

try {
    $client = new Client($apiKey);
    $models = $client->listModels();

    echo "<h2 style='color: green'>✔ API KEY DZIAŁA!</h2><pre>";
    echo "Zwrócone modele:\n\n";
    foreach ($models->models as $m) {
        echo $m->name . "\n";
    }
    echo "</pre>";
} catch (Exception $e) {
    echo "<h2 style='color: red'>❌ API KEY NIE DZIAŁA</h2><pre>";
    echo $e->getMessage();
    echo "</pre>";
}
