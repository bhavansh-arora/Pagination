#!/usr/bin/env bash
# Sets up this app on a fresh Ubuntu/Debian VPS: Node, Python, the app's
# own dependencies, the Hindi Piper voice model, and systemd services for
# both the Node app and the Python speech microservice.
#
# Run from the repo root: bash deploy/setup.sh
#
# This does NOT install or configure Asterisk - that's a separate, optional
# step (see the main README) only needed once you're ready to take real
# phone calls. The browser dashboard works without Asterisk at all.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
SERVICE_USER="$(whoami)"

echo "==> Installing system packages"
sudo apt-get update
sudo apt-get install -y curl git python3 python3-venv python3-pip build-essential

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 22.x"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Installing Node dependencies and building"
npm install
npm run build

echo "==> Setting up tts-service (Python venv)"
cd "$REPO_DIR/tts-service"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt
./.venv/bin/pip install git+https://github.com/myshell-ai/MeloTTS.git
./.venv/bin/python -m unidic download

mkdir -p models
if [ ! -f models/hi_IN-pratham-medium.onnx ]; then
  echo "==> Downloading the Piper Hindi voice model"
  curl -L -o models/hi_IN-pratham-medium.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx
  curl -L -o models/hi_IN-pratham-medium.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx.json
fi
cd "$REPO_DIR"

if [ ! -f .env ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
  TOKEN="$(openssl rand -hex 24)"
  sed -i "s/^DASHBOARD_TOKEN=.*/DASHBOARD_TOKEN=${TOKEN}/" .env
  echo "    Generated a random DASHBOARD_TOKEN for you: ${TOKEN}"
fi

echo "==> Installing systemd services (voice-agent, voice-speech)"
sed -e "s#__REPO_DIR__#${REPO_DIR}#g" -e "s#__SERVICE_USER__#${SERVICE_USER}#g" \
  deploy/voice-agent.service | sudo tee /etc/systemd/system/voice-agent.service >/dev/null
sed -e "s#__REPO_DIR__#${REPO_DIR}#g" -e "s#__SERVICE_USER__#${SERVICE_USER}#g" \
  deploy/voice-speech.service | sudo tee /etc/systemd/system/voice-speech.service >/dev/null
sudo systemctl daemon-reload

echo
echo "Setup done. Still needed before starting:"
echo "  1. Edit .env and set ANTHROPIC_API_KEY (DASHBOARD_TOKEN was generated for you)."
echo "  2. sudo systemctl enable --now voice-speech"
echo "  3. sudo systemctl enable --now voice-agent"
echo "  4. Reach the dashboard via an SSH tunnel (recommended, see README) or"
echo "     open the firewall per the README if you want it directly reachable."
