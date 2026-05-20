#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/data/.openclaw/workspace/coding-system/repos/osion-load-pilot"
LOG_DIR="/data/.openclaw/workspace/logs/loadpilot"
LOG_FILE="$LOG_DIR/bridge.log"
PID_FILE="$LOG_DIR/bridge.pid"
LOCK_FILE="$LOG_DIR/bridge.lock"
BRIDGE_URL="http://127.0.0.1:8788/bridge/analyze-project"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "[$(date -Is)] Another instance is running" >> "$LOG_FILE"
  exit 0
fi

is_bridge_running() {
  pgrep -f "openclaw-bridge/server.mjs" > /dev/null 2>&1
}

get_bridge_pids() {
  pgrep -f "openclaw-bridge/server.mjs" 2>/dev/null || true
}

bridge_responds() {
  curl -sS --max-time 5 \
    -o /dev/null \
    -w "%{http_code}" \
    "$BRIDGE_URL" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${OPENCLAW_BRIDGE_SECRET:-}" \
    --data-binary '{"jobType":"loadpilot_project_twin_analysis","promptVersion":"loadpilot_v2","input":"ping","outputFormat":"project_twin_json"}' 2>/dev/null | grep -q '^200$'
}

kill_all_bridges() {
  local pids=$(get_bridge_pids)
  if [ -n "$pids" ]; then
    echo "$pids" | while read -r pid; do
      kill "$pid" 2>/dev/null || true
    done
    sleep 2
    echo "$pids" | while read -r pid; do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
}

if bridge_responds; then
  echo "[$(date -Is)] Bridge healthy, nothing to do" >> "$LOG_FILE"
  exit 0
fi

echo "[$(date -Is)] Bridge not responding, restarting..." >> "$LOG_FILE"

kill_all_bridges
rm -f "$PID_FILE"

cd "$REPO_DIR"
export OPENCLAW_BRIDGE_HOST=0.0.0.0
export OPENCLAW_BRIDGE_PORT=8788

nohup node openclaw-bridge/server.mjs >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

echo "[$(date -Is)] Started bridge with PID $NEW_PID" >> "$LOG_FILE"

sleep 5

if bridge_responds; then
  echo "[$(date -Is)] Bridge healthy after restart" >> "$LOG_FILE"
  exit 0
else
  echo "[$(date -Is)] Bridge still not responding after restart" >> "$LOG_FILE"
  exit 1
fi
