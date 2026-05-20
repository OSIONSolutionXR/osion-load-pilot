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
Der Gegenpart läuft als **kontrollierte OpenClaw/Kimi-Analyse-Bridge**.

- Input Intake + Validierung
- KI-gestützter Extraction Pass über `openclaw agent`
- Actionability Gate für unbrauchbare Inputs
- KI-gestützter Synthesis Pass für speicherfähige Project Twins
- Schema Guard + Quality Guard vor der Rückgabe

## Sicherheitsrahmen
- keine freien Shell-Kommandos aus Web-Requests
- nur ein fest verdrahteter Analysejob
- keine Dateioperationen
- keine E-Mails
- kein Fake-Projekt bei Modellfehlern
