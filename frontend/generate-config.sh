#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

: "${MICROSOFT_CLIENT_ID:?ERROR: MICROSOFT_CLIENT_ID is not set}"

cat <<EOF > "$SCRIPT_DIR/config.js"
export const CONFIG = {
  microsoftClientId: "${MICROSOFT_CLIENT_ID}",
};
EOF

echo "Successfully generated $SCRIPT_DIR/config.js"
