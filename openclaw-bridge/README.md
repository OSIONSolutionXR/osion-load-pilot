# OpenClaw Bridge Gegenpart

Dieser lokale Bridge-Service ist der sichere Gegenpart für `api/analyze-project`.

## Eigenschaften
- akzeptiert nur `POST /bridge/analyze-project`
- prüft `Authorization: Bearer <OPENCLAW_BRIDGE_SECRET>`
- akzeptiert nur `jobType=loadpilot_project_twin_analysis`
- begrenzt Input-Länge
- führt **keine** Shell-Befehle aus
- führt **keine** Dateioperationen aus
- sendet **keine** E-Mails
- erzeugt nur strukturiertes Project-Twin-JSON

## Start
```bash
cd /data/.openclaw/workspace/coding-system/repos/osion-load-pilot
export OPENCLAW_BRIDGE_SECRET='SET_A_REAL_SECRET'
export OPENCLAW_BRIDGE_HOST=0.0.0.0
export OPENCLAW_BRIDGE_PORT=8787
node openclaw-bridge/server.mjs
```

## Vercel Env
Setze in Vercel:
- `OPENCLAW_BRIDGE_URL=http://<dein-openclaw-host>:8787/bridge/analyze-project`
- `OPENCLAW_BRIDGE_SECRET=<gleiches-secret>`

## Aktueller Modus
Aktuell läuft der Gegenpart bewusst sicher als **heuristische Analyse-Bridge**.
Er erfüllt den Contract und liefert valides JSON zurück.

## Nächster Schritt
Wenn du willst, kann der heuristische Kern im nächsten Schritt durch einen echten isolierten OpenClaw-Agent-Run ersetzt werden – aber weiterhin unter denselben Sicherheitsregeln und ohne allgemeine Remote-Kommandos freizugeben.
