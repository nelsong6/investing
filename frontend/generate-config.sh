#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

: "${API_URL:?ERROR: API_URL is not set}"
: "${MICROSOFT_CLIENT_ID:?ERROR: MICROSOFT_CLIENT_ID is not set}"

cat <<EOF > "$SCRIPT_DIR/config.js"
export const CONFIG = {
  apiUrl: "${API_URL}",
  microsoftClientId: "${MICROSOFT_CLIENT_ID}",
};
EOF

echo "Successfully generated $SCRIPT_DIR/config.js"
