#!/usr/bin/env bash
# Builds ScaleScape and uploads it (static app + PHP catalog API) to an FTP host over explicit TLS (FTPS).
# Usage: FTP_USER=... FTP_PASSWORD=... scripts/deploy-ftp.sh [--with-migration]
#   --with-migration also uploads server/migrate/run.php with database/schema.sql and seed.sql.
#   Delete the remote migrate/ folder after running it once.
set -euo pipefail

FTP_HOST="${FTP_HOST:-ftpupload.net}"
FTP_PORT="${FTP_PORT:-21}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-htdocs}"
FTP_USER="${FTP_USER:?Set FTP_USER}"
FTP_PASSWORD="${FTP_PASSWORD:-${SCALESCAPE_FTP_PASSWORD:-}}"
: "${FTP_PASSWORD:?Set FTP_PASSWORD or SCALESCAPE_FTP_PASSWORD}"

cd "$(dirname "$0")/.."

upload() {
  local local_path="$1" remote_path="$2"
  # InfinityFree's FTPS rejects some uploads (451) over TLS 1.3, so cap at TLS 1.2.
  curl --silent --show-error --fail --ssl-reqd --tls-max 1.2 --ftp-create-dirs --netrc-file <(printf 'machine %s login %s password %s\n' "$FTP_HOST" "$FTP_USER" "$FTP_PASSWORD") \
    -T "$local_path" "ftp://${FTP_HOST}:${FTP_PORT}/${FTP_REMOTE_DIR}/${remote_path}"
  echo "uploaded ${remote_path}"
}

npm run build

(cd dist && find . -type f | sed 's|^\./||') | while read -r file; do
  upload "dist/${file}" "${file}"
done

for file in catalog.php catalog-repository.php .htaccess; do
  upload "server/api/${file}" "api/${file}"
done

if [[ -f server/api/config.php ]]; then
  upload server/api/config.php api/config.php
else
  echo "server/api/config.php not found: the API will answer 503 and the app will use catalog.json" >&2
fi

if [[ "${1:-}" == "--with-migration" ]]; then
  upload server/migrate/run.php migrate/run.php
  upload database/schema.sql migrate/schema.sql
  upload database/seed.sql migrate/seed.sql
fi
