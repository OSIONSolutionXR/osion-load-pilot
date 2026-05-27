# Phase 5: Frontend Umstellung

## Änderungen

### 1. Neue Datei: `src/lib/apiConfig.ts`
- Zentrale API-Konfiguration
- `VITE_LOADPILOT_API_BASE_URL` Unterstützung
- URL-Builder für alle Endpunkte

### 2. Geändert: `src/services/projectAnalysisApi.ts`
- Nutzt jetzt `getAnalyzeUrl()`
- Unterstützt `projectId` Parameter
- Verarbeitet neue API-Response-Format

### 3. Geändert: `src/services/projectTwinUpdateApi.ts`
- Nutzt jetzt `getUpdateTwinUrl()`
- Keine relativen URLs mehr

### 4. Geändert: `src/services/chatService.ts`
- Nutzt jetzt `getChatUrl()`
- `CHAT_API_URL` entfernt

## Vercel Deployment

1. Environment Variable setzen:
   ```
   VITE_LOADPILOT_API_BASE_URL=https://loadpilot-api.srv1550219.hstgr.cloud
   ```

2. Build & Deploy:
   ```bash
   git add .
   git commit -m "Phase 5: Switch to external Hostinger API"
   git push origin main
   ```

3. Test in Production:
   - Neue Analyse starten
   - Network Tab prüfen
   - Request sollte an `loadpilot-api.srv1550219.hstgr.cloud` gehen

## API-Endpunkte

| Funktion | URL |
|----------|-----|
| Health | `https://loadpilot-api.srv1550219.hstgr.cloud/health` |
| Analyse | `https://loadpilot-api.srv1550219.hstgr.cloud/api/analyze-project` |
| Update | `https://loadpilot-api.srv1550219.hstgr.cloud/api/update-project-twin` |
| Chat | `https://loadpilot-api.srv1550219.hstgr.cloud/api/osion-chat` |
