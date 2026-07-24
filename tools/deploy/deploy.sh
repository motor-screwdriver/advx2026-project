#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?}" "${DEPLOY_USER:?}" "${DEPLOY_PASSWORD:?}" "${OPENROUTER_API_KEY:?}"
DOMAIN="${DEPLOY_DOMAIN:-${DEPLOY_HOST}.sslip.io}"
ORIGIN="https://${DOMAIN}"
APP_DIR=/opt/8bit-sleep
AI_MODEL="${AI_MODEL:-openrouter/free}"
AI_MAX_TOKENS="${AI_MAX_TOKENS:-600}"
PORT="${PORT:-8091}"

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
REMOTE="$DEPLOY_USER@$DEPLOY_HOST"

ssh_run() { sshpass -p "$DEPLOY_PASSWORD" ssh $SSH_OPTS "$REMOTE" "$@"; }

echo "==> Uploading binary, client and provisioning script to $REMOTE"
ssh_run "mkdir -p $APP_DIR/client"
sshpass -p "$DEPLOY_PASSWORD" rsync -az -e "ssh $SSH_OPTS" \
  server/8bit-sleep-server "$REMOTE:$APP_DIR/server.new"
sshpass -p "$DEPLOY_PASSWORD" rsync -az --delete -e "ssh $SSH_OPTS" \
  dist/ "$REMOTE:$APP_DIR/client/"
sshpass -p "$DEPLOY_PASSWORD" rsync -az -e "ssh $SSH_OPTS" \
  tools/deploy/setup-server.sh "$REMOTE:/tmp/setup-server.sh"

echo "==> Provisioning (caddy, systemd)"
ssh_run "bash /tmp/setup-server.sh '$DOMAIN' '$PORT'"

echo "==> Writing server environment"
ssh_run "cat > $APP_DIR/server.env && chmod 600 $APP_DIR/server.env && chown 8bitsleep:8bitsleep $APP_DIR/server.env" <<EOF
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=$OPENROUTER_API_KEY
AI_MODEL=$AI_MODEL
AI_MAX_TOKENS=$AI_MAX_TOKENS
PORT=$PORT
EOF

echo "==> Restarting service"
ssh_run "mv $APP_DIR/server.new $APP_DIR/server && chmod +x $APP_DIR/server && systemctl restart 8bit-sleep && systemctl reload caddy 2>/dev/null || true"
sleep 2
ssh_run "systemctl is-active --quiet 8bit-sleep && echo service:active"

echo "==> Health check: $ORIGIN"
curl -fsS -m 15 "$ORIGIN/healthz"
echo
curl -fsS -m 90 -X POST "$ORIGIN/api/oracle" \
  -H 'Content-Type: application/json' \
  -d '{"turns":[]}' \
  | python3 -c "import sys, json; r = json.load(sys.stdin)['reply']; assert r['message']; print('oracle says:', r['message'][:120])"

echo "==> Deploy OK: $ORIGIN"
