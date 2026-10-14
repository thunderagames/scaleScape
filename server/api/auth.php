<?php
declare(strict_types=1);

// Username/password accounts with PHP sessions and an encrypted per-user key/value store.
// GET  ?action=session            -> { user, csrf_token }
// POST ?action=register|login     { username, password } -> { user, csrf_token }
// POST ?action=logout             -> { user: null, csrf_token }
// GET  ?action=data               -> { data: { key: value } }
// POST ?action=data               { key, value } (value null deletes) -> { ok: true }
// Every POST needs the X-CSRF-Token header from the latest response.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

require __DIR__ . '/catalog-repository.php';

const USERNAME_PATTERN = '/^[A-Za-z0-9_.-]{3,32}$/';
const DATA_KEY_PATTERN = '/^[a-z0-9_.-]{1,64}$/';
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_DATA_BYTES = 65536;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MINUTES = 15;

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function run(mysqli $db, string $sql, string $types = '', array $params = []): mysqli_stmt
{
    $statement = $db->prepare($sql);
    if ($types !== '') {
        $statement->bind_param($types, ...$params);
    }
    $statement->execute();
    return $statement;
}

function start_session(): void
{
    $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    ini_set('session.use_strict_mode', '1');
    session_name('scalescape_session');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $is_https, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function session_payload(): array
{
    $user = isset($_SESSION['user_id']) ? ['username' => $_SESSION['username']] : null;
    return ['user' => $user, 'csrf_token' => $_SESSION['csrf_token']];
}

function reset_session(?int $user_id = null, ?string $username = null): void
{
    session_regenerate_id(true);
    $_SESSION = ['csrf_token' => bin2hex(random_bytes(32))];
    if ($user_id !== null) {
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
    }
}

function client_key(): string
{
    return hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? ''));
}

function is_rate_limited(mysqli $db): bool
{
    $key = client_key();
    $sql = 'SELECT COUNT(*) FROM auth_failures WHERE client_key = ? AND failed_at > NOW() - INTERVAL ' . FAILURE_WINDOW_MINUTES . ' MINUTE';
    return (int) run($db, $sql, 's', [$key])->get_result()->fetch_row()[0] >= MAX_FAILURES;
}

function record_failure(mysqli $db): void
{
    $key = client_key();
    run($db, 'INSERT INTO auth_failures (client_key) VALUES (?)', 's', [$key]);
    $db->query('DELETE FROM auth_failures WHERE failed_at < NOW() - INTERVAL 1 DAY');
}

function credentials(array $body): array
{
    $username = is_string($body['username'] ?? null) ? trim($body['username']) : '';
    $password = is_string($body['password'] ?? null) ? $body['password'] : '';
    return [$username, $password];
}

function encryption_key(array $config): string
{
    $key = base64_decode((string) ($config['data_encryption_key'] ?? ''), true);
    if ($key === false || strlen($key) !== 32) {
        throw new RuntimeException('data_encryption_key must be 32 random bytes encoded as base64');
    }
    return $key;
}

// Stored as base64(iv[12] . tag[16] . ciphertext); "user_id:key" is bound as associated data.
function encrypt_value(string $plain, string $key, string $context): string
{
    $iv = random_bytes(12);
    $cipher = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, $context);
    return base64_encode($iv . $tag . $cipher);
}

function decrypt_value(string $stored, string $key, string $context): ?string
{
    $raw = base64_decode($stored, true);
    if ($raw === false || strlen($raw) < 28) {
        return null;
    }
    $plain = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16), $context);
    return $plain === false ? null : $plain;
}

function current_user_id(): int
{
    if (!isset($_SESSION['user_id'])) {
        respond(401, ['error' => 'not_signed_in']);
    }
    return (int) $_SESSION['user_id'];
}

try {
    $config = require __DIR__ . '/config.php';
    $db = scalescape_connect($config);
    start_session();

    $action = (string) ($_GET['action'] ?? 'session');
    $is_post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
    if ($is_post && !hash_equals($_SESSION['csrf_token'], (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
        respond(403, ['error' => 'invalid_csrf']);
    }
    $body = $is_post ? json_decode((string) file_get_contents('php://input'), true) : [];
    $body = is_array($body) ? $body : [];

    if ($action === 'session' && !$is_post) {
        respond(200, session_payload());
    }

    if ($action === 'register' && $is_post) {
        [$username, $password] = credentials($body);
        if (!preg_match(USERNAME_PATTERN, $username)) {
            respond(422, ['error' => 'invalid_username']);
        }
        if (strlen($password) < MIN_PASSWORD_LENGTH || strlen($password) > MAX_PASSWORD_LENGTH) {
            respond(422, ['error' => 'invalid_password']);
        }
        if (is_rate_limited($db)) {
            respond(429, ['error' => 'too_many_attempts']);
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        try {
            run($db, 'INSERT INTO users (username, password_hash) VALUES (?, ?)', 'ss', [$username, $hash]);
        } catch (mysqli_sql_exception $error) {
            if ($error->getCode() === 1062) {
                respond(409, ['error' => 'username_taken']);
            }
            throw $error;
        }
        reset_session($db->insert_id, $username);
        respond(201, session_payload());
    }

    if ($action === 'login' && $is_post) {
        if (is_rate_limited($db)) {
            respond(429, ['error' => 'too_many_attempts']);
        }
        [$username, $password] = credentials($body);
        $row = run($db, 'SELECT id, username, password_hash FROM users WHERE username = ?', 's', [$username])->get_result()->fetch_assoc();
        // Hash even for unknown users so response time does not reveal which usernames exist.
        $hash = $row ? $row['password_hash'] : password_hash('unknown-user', PASSWORD_DEFAULT);
        if (!$row || !password_verify($password, $hash)) {
            record_failure($db);
            respond(401, ['error' => 'invalid_credentials']);
        }
        if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
            $new_hash = password_hash($password, PASSWORD_DEFAULT);
            run($db, 'UPDATE users SET password_hash = ? WHERE id = ?', 'si', [$new_hash, $row['id']]);
        }
        reset_session((int) $row['id'], $row['username']);
        respond(200, session_payload());
    }

    if ($action === 'logout' && $is_post) {
        reset_session();
        respond(200, session_payload());
    }

    if ($action === 'data') {
        $user_id = current_user_id();
        $key = encryption_key($config);
        if (!$is_post) {
            $data = [];
            foreach (run($db, 'SELECT data_key, data_value FROM user_data WHERE user_id = ?', 'i', [$user_id])->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
                $plain = decrypt_value($row['data_value'], $key, $user_id . ':' . $row['data_key']);
                if ($plain !== null) {
                    $data[$row['data_key']] = json_decode($plain, true);
                }
            }
            respond(200, ['data' => (object) $data]);
        }
        $data_key = is_string($body['key'] ?? null) ? $body['key'] : '';
        if (!preg_match(DATA_KEY_PATTERN, $data_key) || !array_key_exists('value', $body)) {
            respond(422, ['error' => 'invalid_data']);
        }
        if ($body['value'] === null) {
            run($db, 'DELETE FROM user_data WHERE user_id = ? AND data_key = ?', 'is', [$user_id, $data_key]);
            respond(200, ['ok' => true]);
        }
        $json = json_encode($body['value'], JSON_UNESCAPED_UNICODE);
        if ($json === false || strlen($json) > MAX_DATA_BYTES) {
            respond(413, ['error' => 'data_too_large']);
        }
        $stored = encrypt_value($json, $key, $user_id . ':' . $data_key);
        run($db, 'INSERT INTO user_data (user_id, data_key, data_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data_value = VALUES(data_value)', 'iss', [$user_id, $data_key, $stored]);
        respond(200, ['ok' => true]);
    }

    respond(404, ['error' => 'unknown_action']);
} catch (Throwable $error) {
    error_log('ScaleScape auth error: ' . $error->getMessage());
    respond(500, ['error' => 'server_error']);
}
