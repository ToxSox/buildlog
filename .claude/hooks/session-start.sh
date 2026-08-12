#!/bin/bash
# Richtet eine frische Claude-Code-Websession so ein, dass Linting, Tests und
# E2E sofort laufen. Lokal ist die Umgebung schon eingerichtet, dort tut das
# Script nichts.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# npm install statt npm ci: Der Container-Zustand wird nach dem Hook gecacht,
# ein unverändertes node_modules wird also wiederverwendet statt jedes Mal neu
# aufgebaut. Der Browser-Download im postinstall von Playwright bleibt aus –
# der Container bringt bereits einen Chromium mit (siehe unten).
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-audit --no-fund

# Die E2E-Suite braucht einen Chromium. Findet die installierte
# Playwright-Version ihren erwarteten Build nicht, zeigt CHROMIUM_PATH auf den
# vorinstallierten Browser des Containers – tests/e2e/run.mjs wertet die
# Variable aus (so auch in CLAUDE.md dokumentiert).
if ! node -e 'require("node:fs").accessSync(require("playwright").chromium.executablePath())' 2>/dev/null; then
  if [ -x /opt/pw-browsers/chromium ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo 'export CHROMIUM_PATH=/opt/pw-browsers/chromium' >>"$CLAUDE_ENV_FILE"
  fi
fi
