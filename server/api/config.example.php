<?php
// Copy to config.php (never commit it) and fill in the values from your hosting panel.
return [
    'host' => 'sqlXXX.infinityfree.com',
    'port' => 3306,
    'user' => 'if0_XXXXXXXX',
    'password' => 'your-mysql-password',
    'database' => 'if0_XXXXXXXX_scalescape',
    // Encrypts user_data values. Generate once: php -r 'echo base64_encode(random_bytes(32));' and never change it.
    'data_encryption_key' => 'base64-encoded-32-random-bytes',
    // Only needed while running server/migrate/run.php once; remove afterwards.
    'migration_token' => 'long-random-string',
];
