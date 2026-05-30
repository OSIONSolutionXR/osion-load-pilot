# OSION Load Pilot v3 Deep Analysis Prompt

## Ziel
Erstelle einen hochwertigen, belastbaren Project Twin mit adaptiver Tiefe basierend auf der erkannten Projektkomplexität.

## Komplexitätsklassifizierung

Vor der Analyse muss die Komplexität bestimmt werden:

**SIMPLE (5-8 Prozessschritte, 5-12 Maßnahmen)**
- Kurze Inputs (< 100 Zeichen)
- Einzelthemen: Wohnwagen mieten, Auto kaufen, kleine Website
- Wenige Stakeholder (1-2)
- Keine regulatorischen Anforderungen

**MEDIUM (8-12 Prozessschritte, 12-25 Maßnahmen)**
- Moderate Inputs (100-300 Zeichen)
- Themen mit mehreren Aspekten: Ferienhausoptimierung, Funnel-Aufbau
- Mehrere Stakeholder (3-5)
- Klare Ziele, aber offene Details

**COMPLEX (12-18 Prozessschritte, 25-50 Maßnahmen)**
- Umfangreiche Inputs (> 300 Zeichen)
- Systeme mit Technik: Web-App, Backend, Datenbank, KI
- Viele Stakeholder (> 5)
- Regulatorische oder technische Komplexität

**HIGH-END (14-24 Prozessschritte, 35-80 Maßnahmen)**
- Sehr umfangreiche Inputs (> 500 Zeichen)
- Kritische Infrastruktur: Krisenversorgung, medizinische Systeme, Logistiknetzwerke
- Multi-Stakeholder, Multi-Standort
- Sicherheits- oder versorgungskritische Systeme

## Output-Struktur

```json
{
  "project": {
    "title": "string (max 60 Zeichen)",
    "description": "string (240-700 Zeichen)",
    "type": "domain_string",
    "status": "active|discovery",
    "complexity": "simple|medium|complex|high_end"
  },
  "nextMove": {
    "title": "string (max 90 Zeichen)",
    "reason": "string (180-320 Zeichen)",
    "effort": "low|medium|high",
    "impact": "low|medium|high",
    "deadline": "string|null"
  },
  "actors": [...],
  "dependencies": [...],
  "risks": [...],
  "scenarios": [...],
  "actions": [...],
  "processSteps": [...],
  "questions": [...],
  "options": [...],
  "quality": {
    "inputQuality": "insufficient|usable|strong",
    "isActionable": boolean,
    "confidence": "low|medium|high",
    "missingContext": [...],
    "reason": "string"
  },
  "meta": {
    "domain": "string",
    "analysisMode": "openclaw-kimi",
    "promptVersion": "loadpilot_v3_deep",
    "generatedAt": "ISO-Date"
  }
}
```

## Qualitätsregeln

### Prozessschritte
- NIEMALS generische Nummerierung ("Schritt 1", "Phase 2")
- Jeder Schritt muss fachlich konkret sein
- Titel: max 64 Zeichen
- Beschreibung: 140-260 Zeichen Ziel, max 300 Zeichen
- Status: done, active, blocked, next, pending, skipped
- Blocked-Schritte müssen blockerReason enthalten
- Genau ein active/next-Schritt

### Maßnahmen (actions)
- MÜSSEN konkrete Arbeitsschritte sein
- Schlecht: "Konzept prüfen"
- Gut: "Minimalmodul-Set für ersten Prototyp festlegen und entscheiden"
- Titel: max 90 Zeichen
- Beschreibung: 180-320 Zeichen Ziel, max 360 Zeichen
- Priorität: low, medium, high, critical
- Owner muss spezifisch sein

### Risiken
- MÜSSEN mögliche negative Entwicklungen sein
- Schlecht: "Budget könnte knapp werden"
- Gut: "Biologische Produktionsmodule liefern unter Realbedingungen zu geringe Erntestabilität"
- Titel: max 90 Zeichen
- Schwere: low, medium, high

### Blocker (dependencies mit isBlocker=true)
- MÜSSEN aktuelle Hindernisse sein
- Schlecht: "Es fehlt noch was"
- Gut: "Ohne Entscheidung über ersten Pilotstandort können technische Anforderungen nicht belastbar definiert werden"
- From/To: max 64 Zeichen

### Fragen (questions)
- MÜSSEN echte Entscheidungs- oder Informationslücken sein
- Schlecht: "Was soll ich machen?"
- Gut: "Welche Zielumgebung liefert den besten Pilotnutzen: Forschungsstation, Offshore-Plattform, Inselregion oder Krisenversorgung?"
- Max 180 Zeichen

### Optionen (options)
- MÜSSEN echte strategische Alternativen sein
- Schlecht: "Option A: Ja, Option B: Nein"
- Gut: "Option A: Einzelmodul-MVP für Pflanzenzucht; Option B: geschlossenes Mini-System; Option C: Forschungskooperation"
- Titel: max 90 Zeichen
- Beschreibung: 180-340 Zeichen

## Domain-Erkennung

**Krisen/Infrastruktur (höchste Priorität)**
- Keywords: Katastrophe, Krise, Notfall, Überschwemmung, Hochwasser, Deich, Stromausfall, Blackout, Hitze, Infrastrukturversagen, Versorgung, Trinkwasser, Sanitär, Kommunen, Hilfsorganisation, Einsatzort, Resilienz, Satelliteninternet, Shelter, Evakuierung

**Lebensmittel/Versorgungssysteme**
- Keywords: Lebensmittelversorgung, isolierte Umgebung, Forschungsstation, Offshore, Polarexpedition, vertikale Pflanzenzucht, Pilzzucht, Mikroalgen, Wasserrecycling, Nährstoffkreislauf, Sensorik, KI-Dashboard, Produktionsplanung, Versorgungssicherheit, geschlossenes System, Raumfahrt, Habitat

**Fahrzeug/Private Purchase**
- Keywords: Auto, Fahrzeug, PKW, Wohnwagen, Wohnmobil, Caravan, kaufen, mieten, Leasing, Finanzierung

**Hospitality/Immobilien**
- Keywords: Ferienhaus, Auslastung, Buchung, Gäste, Airbnb, Vermietung, Unterkunft

**Sales/Marketing**
- Keywords: Kunden, Verkauf, Leads, Angebot, Funnel, Conversion, Pipeline

**Technology/Software**
- Keywords: Website, Webseite, Webapp, App, Backend, Frontend, Datenbank, KI, AI, API, Integration

## Input-Bewertung

1. **INSUFFICIENT**: Müllinput ("ABC", "Test", "???", Einzelwörter ohne Kontext)
2. **USABLE**: Klarer Zielsatz vorhanden, aber Details fehlen
3. **STRONG**: Konkrete Lage mit Blockern, Akteuren, Fristen

## Wichtigste Regel

ADAPTIVE TIEFE - Kleine Projekte nicht aufblasen, große Projekte nicht unteranalysieren.
