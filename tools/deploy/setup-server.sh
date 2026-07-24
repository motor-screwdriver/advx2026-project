#!/usr/bin/env bash
# Idempotent provisioning for the 8bit Sleep oracle server (Ubuntu/Debian, root).
# Installs Caddy (TLS via Let's Encrypt), creates the service user, the systemd
# unit and the Caddy site. Safe to re-run on every deploy.
#
#   setup-server.sh <domain> [port]
set -euo pipefail

DOMAIN="${1:?usage: setup-server.sh <domain> [port]}"
PORT="${2:-8091}"
APP_DIR=/opt/8bit-sleep
SERVICE_USER=8bitsleep

export DEBIAN_FRONTEND=noninteractive

if ! command -v caddy >/dev/null 2>&1; then
  apt-get update
  apt-get install -y curl debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

if ! id -u "$SERVICE_USER" >/dev/null 2>&1; then
  useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"
fi
mkdir -p "$APP_DIR/client"

# The unit tolerates a missing server.env (- prefix) so provisioning can run
# before the first env file is written; the app then reports itself unavailable.
cat > /etc/systemd/system/8bit-sleep.service <<EOF
[Unit]
Description=8bit Sleep oracle backend (Go)
After=network-online.target
Wants=network-online.target

[Service]
User=$SERVICE_USER
EnvironmentFile=-$APP_DIR/server.env
ExecStart=$APP_DIR/server
Restart=always
RestartSec=2
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

MARKER='# 8bit-sleep'
if ! grep -q "$MARKER" /etc/caddy/Caddyfile 2>/dev/null; then
  cat >> /etc/caddy/Caddyfile <<EOF

$MARKER
$DOMAIN {
	root * $APP_DIR/client
	encode zstd gzip
	handle /api/* {
		reverse_proxy 127.0.0.1:$PORT
	}
	handle {
		try_files {path} {path}.html /index.html
		file_server
	}
}
EOF
fi

systemctl daemon-reload
systemctl enable --now caddy >/dev/null
systemctl reload caddy 2>/dev/null || systemctl restart caddy
systemctl enable 8bit-sleep >/dev/null

echo "setup-server: $DOMAIN ready (caddy + systemd unit installed)"
