<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');
header('X-Content-Type-Options: nosniff');

require __DIR__ . '/catalog-repository.php';

try {
    $db = scalescape_connect(require __DIR__ . '/config.php');
    echo json_encode(scalescape_build_catalog($db), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    error_log('ScaleScape catalog error: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode(['error' => 'catalog_unavailable']);
}
