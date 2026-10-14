<?php
// Copy to config.php (never commit it) and fill in the values from your hosting panel.
return [
    'host' => 'sqlXXX.infinityfree.com',
    'port' => 3306,
    'user' => 'if0_XXXXXXXX',
    'password' => 'your-mysql-password',
    'database' => 'if0_XXXXXXXX_scalescape',
    // Only needed while running server/migrate/run.php once; remove afterwards.
    'migration_token' => 'long-random-string',
];
