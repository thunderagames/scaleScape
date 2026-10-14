# 19. MySQL Content Catalog

The musical content (curated scale formulas, scale categories, EN/ES scale and category names, EN/ES scale history/usage descriptions, progression genres, progressions, and Ear Gym comparisons) is no longer hard-coded in TypeScript. It lives in MySQL and is served as JSON by a small PHP API. UI strings stay in `src/settings/localization.ts`.

## Runtime Flow

1. `src/main.ts` calls `loadContentCatalog` (`src/integrations/content-catalog-source.ts`).
2. It tries `./api/catalog.php` first (MySQL), then `./catalog.json` (static backup used by GitHub Pages or when the API fails).
3. `parseContentCatalog` validates the payload and `installContentCatalog` (`src/application/content-catalog.ts`) installs formulas, descriptions, progressions, comparisons, and catalog translations.
4. The 432 "probable heptatonic" formulas are still generated at runtime from the curated formulas; they are not stored in the database.

Vitest installs `public/catalog.json` through `src/test-setup.ts`.

## Files

| Path | Purpose |
| --- | --- |
| `public/catalog.json` | Static backup and source of truth for the seed |
| `database/schema.sql` | Re-runnable MySQL/MariaDB schema (drops and recreates the tables) |
| `database/seed.sql` | Generated data; rebuild with `node scripts/db/build-seed-sql.mjs` |
| `server/api/catalog.php` | Public endpoint returning the catalog JSON (503 on failure) |
| `server/api/catalog-repository.php` | Queries that rebuild the catalog shape from the tables |
| `server/api/config.example.php` | Template for the git-ignored `server/api/config.php` credentials |
| `server/migrate/run.php` | One-time, token-protected runner for `schema.sql` + `seed.sql` |
| `scripts/deploy-ftp.sh` | Builds and uploads the app, API, and optionally the migration runner over FTPS (`--ssl-reqd`) |

## Editing Content

1. Edit `public/catalog.json`.
2. Run `node scripts/db/build-seed-sql.mjs` and `npm run check`.
3. Re-run the migration (it replaces the tables) and deploy.

## InfinityFree Setup

InfinityFree does not allow `CREATE DATABASE` over SQL nor remote MySQL connections, so:

1. In the control panel, open **MySQL Databases** and create a database (for example `if0_XXXXXXXX_scalescape`). Note the host, user, password, and database name.
2. Copy `server/api/config.example.php` to `server/api/config.php` and fill in those values plus a long random `migration_token`.
3. Deploy with the migration runner: `FTP_USER=... FTP_PASSWORD=... scripts/deploy-ftp.sh --with-migration`.
4. Open `https://<domain>/migrate/run.php`, submit the `migration_token` in the form (sent by POST, so it stays out of URLs and logs); it prints table counts and `DONE`.
5. Delete the remote `htdocs/migrate/` folder and remove `migration_token` from the server config.
6. Check `https://<domain>/api/catalog.php` returns JSON.

`server/api/.htaccess` denies direct access to `config.php`, its template, and the repository helper.
