<?php
declare(strict_types=1);

// One-time migration runner: creates the catalog tables and loads the seed data.
// Upload together with schema.sql and seed.sql, open it, submit the migration_token, then delete this folder.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Content-Type: text/html; charset=utf-8');
    exit('<form method="post"><label>Migration token <input type="password" name="token" autocomplete="off" required></label> <button type="submit">Run migration</button></form>');
}

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/../api/catalog-repository.php';
$config = require __DIR__ . '/../api/config.php';

$token = (string) ($config['migration_token'] ?? '');
if ($token === '' || !hash_equals($token, (string) ($_POST['token'] ?? ''))) {
    http_response_code(403);
    exit("Forbidden\n");
}

function scalescape_run_sql_file(mysqli $db, string $path): void
{
    $sql = file_get_contents($path);
    if ($sql === false) {
        throw new RuntimeException("Cannot read {$path}");
    }
    $db->multi_query($sql);
    do {
        $result = $db->store_result();
        if ($result instanceof mysqli_result) {
            $result->free();
        }
    } while ($db->more_results() && $db->next_result());
}

try {
    $db = scalescape_connect($config);
    scalescape_run_sql_file($db, __DIR__ . '/schema.sql');
    echo "schema.sql OK\n";
    scalescape_run_sql_file($db, __DIR__ . '/seed.sql');
    echo "seed.sql OK\n";
    foreach (['scale_categories', 'scale_formulas', 'scale_formula_notes', 'scale_formula_translations', 'progressions', 'comparisons'] as $table) {
        $count = $db->query("SELECT COUNT(*) AS total FROM {$table}")->fetch_assoc()['total'];
        echo "{$table}: {$count}\n";
    }
    echo "DONE\n";
} catch (Throwable $error) {
    http_response_code(500);
    echo 'FAILED: ' . $error->getMessage() . "\n";
}
