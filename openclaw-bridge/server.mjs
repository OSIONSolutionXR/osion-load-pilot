import http from 'node:http'

const HOST = process.env.OPENCLAW_BRIDGE_HOST || '127.0.0.1'
const PORT = Number(process.env.OPENCLAW_BRIDGE_PORT || 8787)
const SECRET = process.env.OPENCLAW_BRIDGE_SECRET
const MAX_INPUT_LENGTH = 4000
const ALLOWED_JOB_TYPE = 'loadpilot_project_twin_analysis'
const ALLOWED_PROMPT_VERSION = 'loadpilot_v1'

if (!SECRET) {
  console.error('Missing OPENCLAW_BRIDGE_SECRET')
  process.exit(1)
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function unauthorized(res) {
  return sendJson(res, 401, { error: 'Unauthorized' })
}

function badRequest(res, message) {
  return sendJson(res, 400, { error: message })
}

function methodNotAllowed(res) {
  res.setHeader('Allow', 'POST')
  return sendJson(res, 405, { error: 'Only POST is allowed' })
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toSentence(value) {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned.endsWith('.') ? cleaned : `${cleaned}.`
}

function buildLowConfidenceAnalysis(input) {
  return {
    project: {
      title: 'Unvollständige Projektlage',
      description: 'Der Input ist zu knapp. Bitte ergänze Ziel, gewünschtes Ergebnis, offene Entscheidung, beteiligte Personen und Frist.',
      type: 'clarification',
      status: 'waiting'
    },
    nextMove: {
      title: 'Projektlage genauer beschreiben',
      reason: 'Ohne Ziel, offenen Entscheidungsrahmen und Kontext kann kein belastbarer Project Twin abgeleitet werden.',
      effort: 'low',
      impact: 'high',
      deadline: null
    },
    actors: [
      { name: 'Marcel', role: 'Inputgeber', influence: 'high', waitingFor: 'Klarere Projektbeschreibung' }
    ],
    dependencies: [
      {
        from: 'Präziser Input',
        to: 'Project-Twin-Analyse',
        status: 'required',
        isBlocker: true,
        explanation: 'Die Projektlage ist noch nicht konkret genug, um sinnvolle Abhängigkeiten und Risiken abzuleiten.'
      }
    ],
    risks: [
      {
        title: 'Falsche Priorisierung durch fehlenden Kontext',
        severity: 'medium',
        explanation: 'Zu knapper Input erhöht das Risiko, dass der nächste Schritt am eigentlichen Ziel vorbeigeht.'
      }
    ],
    scenarios: [
      {
        title: 'Projektlage wird konkretisiert',
        outcome: 'Load Pilot kann Ziel, Beteiligte, Risiken und nächste Schritte präzise ableiten.',
        riskLevel: 'low',
        recommendation: 'Beschreibe Ziel, Frist, offene Entscheidung und beteiligte Personen in 2 bis 5 Sätzen.'
      }
    ],
    actions: [
      {
        title: 'Ziel, Entscheidung und Frist ergänzen',
        owner: 'Marcel',
        priority: 'high',
        messageDraft: null
      }
    ]
  }
}

function buildAutoPurchaseAnalysis(input) {
  return {
    project: {
      title: 'Autokauf vorbereiten',
      description: 'Es geht darum, den Kauf eines Autos strukturiert vorzubereiten, bevor eine Entscheidung getroffen wird.',
      type: 'private_purchase',
      status: 'active'
    },
    nextMove: {
      title: 'Budget, Fahrzeuganforderungen und Kaufrahmen festlegen',
      reason: 'Ohne Budget, Nutzungszweck und Mindestanforderungen können Angebote nicht sinnvoll verglichen werden.',
      effort: 'medium',
      impact: 'high',
      deadline: null
    },
    actors: [
      { name: 'Marcel', role: 'Käufer', influence: 'high', waitingFor: 'Budget und Muss-Kriterien definieren' },
      { name: 'Autohändler oder Privatverkäufer', role: 'Anbieter', influence: 'medium', waitingFor: 'Konkrete Anfrage oder Besichtigung' },
      { name: 'Versicherung', role: 'Kosten- und Policenpartner', influence: 'medium', waitingFor: 'Fahrzeugdaten zur Tarifprüfung' },
      { name: 'Bank oder Finanzierungspartner', role: 'Finanzierungspartner', influence: 'medium', waitingFor: 'Finanzierungsanfrage, falls Kauf nicht bar erfolgt' }
    ],
    dependencies: [
      { from: 'Budget', to: 'Fahrzeugauswahl', status: 'required', isBlocker: true, explanation: 'Ohne Preisrahmen ist keine sinnvolle Auswahl oder Verhandlung möglich.' },
      { from: 'Nutzungsprofil', to: 'Fahrzeugtyp', status: 'required', isBlocker: false, explanation: 'Der Einsatz bestimmt, ob eher Kleinwagen, Kombi, SUV oder Elektroauto sinnvoll ist.' },
      { from: 'Finanzierung', to: 'Kaufentscheidung', status: 'waiting', isBlocker: false, explanation: 'Wenn Finanzierung nötig ist, muss die monatliche Belastung vor dem Kauf geklärt werden.' },
      { from: 'Versicherungskosten', to: 'Gesamtkosten', status: 'required', isBlocker: false, explanation: 'Versicherung, Steuer und laufende Kosten beeinflussen den realen Kaufrahmen.' },
      { from: 'Probefahrt', to: 'Entscheidung', status: 'waiting', isBlocker: false, explanation: 'Eine Probefahrt reduziert das Risiko eines Fehlkaufs deutlich.' }
    ],
    risks: [
      { title: 'Zu schnelle Kaufentscheidung', severity: 'high', explanation: 'Ohne Kriterien und Vergleichsrahmen steigt die Wahrscheinlichkeit für spontane Fehlentscheidungen.' },
      { title: 'Versteckte Folgekosten', severity: 'medium', explanation: 'Versicherung, Reparaturen, Steuer und Verbrauch werden oft zu spät eingerechnet.' },
      { title: 'Unpassendes Fahrzeug für den tatsächlichen Bedarf', severity: 'medium', explanation: 'Wenn Nutzungsprofil und Anforderungen unklar bleiben, passt das Fahrzeug später oft nicht zum Alltag.' },
      { title: 'Finanzierung nicht geprüft', severity: 'medium', explanation: 'Ungeprüfte Finanzierung kann die Kaufentscheidung verzögern oder später verteuern.' },
      { title: 'Keine Vergleichsangebote', severity: 'medium', explanation: 'Ohne Marktvergleich ist schwer erkennbar, ob Preis und Zustand wirklich attraktiv sind.' }
    ],
    scenarios: [
      { title: 'Budget und Anforderungen werden festgelegt', outcome: 'Die Fahrzeugsuche wird fokussiert und vergleichbar.', riskLevel: 'low', recommendation: 'Preisrahmen, Fahrzeugtyp und Muss-Kriterien zuerst festziehen.' },
      { title: 'Budget bleibt offen', outcome: 'Das Risiko für Ablenkung, Fehlkauf und zu hohe Gesamtkosten steigt.', riskLevel: 'high', recommendation: 'Vor der Suche eine klare Preisobergrenze und laufende Kosten definieren.' },
      { title: 'Finanzierung wird benötigt', outcome: 'Die Kaufoptionen hängen an Rate, Laufzeit und Freigabe.', riskLevel: 'medium', recommendation: 'Finanzierungskonditionen parallel zur Fahrzeugsuche prüfen.' }
    ],
    actions: [
      { title: 'Budgetrahmen festlegen', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Muss-Kriterien definieren', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Drei Vergleichsangebote sammeln', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Versicherungskosten prüfen', owner: 'Marcel', priority: 'medium', messageDraft: null },
      { title: 'Probefahrt und technische Prüfung planen', owner: 'Marcel', priority: 'medium', messageDraft: null }
    ]
  }
}

function buildSalesAnalysis(input) {
  return {
    project: {
      title: 'Angebotsentscheidung vorbereiten',
      description: 'Es geht darum, ein laufendes Angebots- oder Kundenthema in eine klare nächste Entscheidung zu überführen.',
      type: 'sales',
      status: 'active'
    },
    nextMove: {
      title: 'Konkreten Angebotsstand und nächste Rückmeldung festziehen',
      reason: 'Ohne klare Rückmeldung oder Angebot bleibt der Kunde in Warteposition und das Momentum geht verloren.',
      effort: 'low',
      impact: 'high',
      deadline: 'Heute'
    },
    actors: [
      { name: 'Marcel', role: 'Angebotsverantwortlicher', influence: 'high', waitingFor: 'Entscheidung über Inhalt und Timing' },
      { name: 'Kunde', role: 'Entscheidungspartner', influence: 'high', waitingFor: 'Angebot oder klares Update' }
    ],
    dependencies: [
      { from: 'Angebotsinhalt', to: 'Kundenentscheidung', status: 'required', isBlocker: true, explanation: 'Ohne sauberen Angebotsinhalt kann der Kunde nicht belastbar entscheiden.' },
      { from: 'Rückmeldung', to: 'Vertrauen', status: 'waiting', isBlocker: false, explanation: 'Ausbleibende Kommunikation schwächt Momentum und Professionalität.' }
    ],
    risks: [
      { title: 'Abschlusschance sinkt', severity: 'high', explanation: 'Zu langes Schweigen kühlt den Kunden aus und erhöht die Absprungwahrscheinlichkeit.' },
      { title: 'Unklare Erwartungshaltung', severity: 'medium', explanation: 'Ohne Zwischenstand bleibt offen, was als Nächstes passiert.' }
    ],
    scenarios: [
      { title: 'Heute klares Update senden', outcome: 'Der Kunde bleibt orientiert und im Prozess.', riskLevel: 'low', recommendation: 'Konkreten Stand plus nächsten Termin kommunizieren.' },
      { title: 'Kein Update senden', outcome: 'Das Thema verliert Momentum und Vertrauen.', riskLevel: 'high', recommendation: 'Mindestens eine kurze, verbindliche Rückmeldung heute senden.' }
    ],
    actions: [
      { title: 'Angebotsstand verdichten', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Kundenupdate senden', owner: 'Marcel', priority: 'high', messageDraft: null }
    ]
  }
}

function buildFinancingBlockerAnalysis(input) {
  return {
    project: {
      title: 'Finanzierung / Unterlagenfreigabe klären',
      description: 'Die Finanzierung oder Prüfung hängt an einer fehlenden Unterlage und einer zeitkritischen Rückmeldung.',
      type: 'financing',
      status: 'blocked'
    },
    nextMove: {
      title: 'Fehlende Unterlage mit klarer Frist anfordern und alle wartenden Parteien aktiv updaten',
      reason: 'Die fehlende Unterlage blockiert die Prüfung direkt und erzeugt gleichzeitig Druck bei den wartenden Entscheidungspartnern.',
      effort: 'low',
      impact: 'high',
      deadline: 'Freitag'
    },
    actors: [
      { name: 'Marcel', role: 'Koordinator', influence: 'high', waitingFor: 'Lieferung der fehlenden Unterlage' },
      { name: 'Steuerberater Müller', role: 'Unterlagenlieferant', influence: 'high', waitingFor: 'Klare Frist und Priorisierung' },
      { name: 'Bank', role: 'Prüfende Stelle', influence: 'high', waitingFor: 'BWA oder fehlende Unterlage' },
      { name: 'Verkäufer', role: 'Wartender Entscheidungspartner', influence: 'medium', waitingFor: 'Rückmeldung bis Freitag' }
    ],
    dependencies: [
      { from: 'Steuerberater Müller', to: 'BWA', status: 'blocked', isBlocker: true, explanation: 'Die BWA oder vergleichbare Unterlage fehlt noch und blockiert die Prüfung.' },
      { from: 'BWA', to: 'Bankprüfung', status: 'required', isBlocker: true, explanation: 'Ohne die fehlende Unterlage startet oder endet die Prüfung nicht belastbar.' },
      { from: 'Bankprüfung', to: 'Rückmeldung an Verkäufer', status: 'waiting', isBlocker: false, explanation: 'Die Rückmeldung an den Verkäufer hängt an belastbarer Finanzierungsklarheit.' }
    ],
    risks: [
      { title: 'Verkäufervertrauen sinkt', severity: 'high', explanation: 'Wenn bis Freitag keine klare Rückmeldung kommt, steigt das Risiko für Unsicherheit oder Absprung.' },
      { title: 'Prüfung verzögert sich weiter', severity: 'high', explanation: 'Die fehlende Unterlage hält den Prozess künstlich offen und verschiebt jede Folgeentscheidung.' },
      { title: 'Kommunikationslücke zwischen Parteien', severity: 'medium', explanation: 'Wenn Bank, Lieferant und Verkäufer nicht aktiv gemanagt werden, eskaliert der Druck auf mehreren Seiten gleichzeitig.' }
    ],
    scenarios: [
      { title: 'Unterlage kommt rechtzeitig', outcome: 'Die Prüfung kann direkt weiterlaufen und die Verkäuferkommunikation wird belastbarer.', riskLevel: 'low', recommendation: 'Unterlage sofort weiterleiten und den neuen Stand aktiv an alle Beteiligten senden.' },
      { title: 'Unterlage bleibt offen', outcome: 'Der Finanzierungsprozess bleibt blockiert und die Frist beim Verkäufer wird kritisch.', riskLevel: 'high', recommendation: 'Heute eskalieren, Zwischenstand senden und Ersatzplan kommunizieren.' }
    ],
    actions: [
      { title: 'Steuerberater mit klarer Frist kontaktieren', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Bank über realistischen Status informieren', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Verkäufer aktiv updaten', owner: 'Marcel', priority: 'medium', messageDraft: null }
    ]
  }
}

function buildVacationRentalAnalysis(input) {
  return {
    project: {
      title: 'Ferienhaus-Auslastung verbessern',
      description: 'Es geht darum, die Auslastung des Ferienhauses gezielt über Angebot, Sichtbarkeit, Preislogik und Conversion zu verbessern.',
      type: 'hospitality_growth',
      status: 'active'
    },
    nextMove: {
      title: 'Angebot, Preisstrategie und Buchungskanäle zuerst strukturiert prüfen',
      reason: 'Ohne klares Bild zu Inserat, Preislogik, Sichtbarkeit und Bewertungsstand ist nicht erkennbar, welcher Hebel die Auslastung wirklich erhöht.',
      effort: 'medium',
      impact: 'high',
      deadline: null
    },
    actors: [
      { name: 'Marcel', role: 'Vermieter oder Betreiber', influence: 'high', waitingFor: 'Klaren Hebelplan für Auslastung' },
      { name: 'Buchungsplattformen', role: 'Reichweitenkanal', influence: 'high', waitingFor: 'Optimierte Inserate und Preislogik' },
      { name: 'Interessenten', role: 'Buchende', influence: 'medium', waitingFor: 'Attraktives Angebot, Vertrauen und passende Preise' }
    ],
    dependencies: [
      { from: 'Inseratsqualität', to: 'Sichtbarkeit', status: 'required', isBlocker: true, explanation: 'Schwache Texte, Bilder oder unklare Positionierung senken Reichweite und Conversion direkt.' },
      { from: 'Preisstrategie', to: 'Buchungsquote', status: 'required', isBlocker: false, explanation: 'Preisniveau, Saisonpreise und Mindestaufenthalte beeinflussen Nachfrage unmittelbar.' },
      { from: 'Buchungskanäle', to: 'Auslastung', status: 'waiting', isBlocker: false, explanation: 'Wenn nur wenige Kanäle aktiv sind, bleibt potenzielle Nachfrage ungenutzt.' },
      { from: 'Bewertungen', to: 'Vertrauen', status: 'waiting', isBlocker: false, explanation: 'Bewertungen und Social Proof beeinflussen die Buchungsentscheidung stark.' }
    ],
    risks: [
      { title: 'Zu geringe Sichtbarkeit', severity: 'high', explanation: 'Wenn das Objekt nicht stark genug ausgespielt wird, fehlt es an qualifizierten Anfragen.' },
      { title: 'Preis passt nicht zur Nachfrage', severity: 'medium', explanation: 'Ein unpassender Preis oder starre Saisonlogik reduziert Buchungen trotz Interesse.' },
      { title: 'Schwache Conversion im Inserat', severity: 'medium', explanation: 'Wenn Bilder, Beschreibung oder Vertrauen fehlen, springen Interessenten trotz Klicks ab.' }
    ],
    scenarios: [
      { title: 'Inserat und Preislogik werden optimiert', outcome: 'Mehr Sichtbarkeit und bessere Chancen auf direkte Buchungen.', riskLevel: 'low', recommendation: 'Bilder, Texte, Nutzenargumente und Saisonpreise als Erstes überarbeiten.' },
      { title: 'Nur am Kanal gedreht, aber Angebot bleibt schwach', outcome: 'Mehr Reichweite führt nicht automatisch zu mehr Buchungen.', riskLevel: 'medium', recommendation: 'Erst Angebotsstärke und Conversion verbessern, dann Reichweite skalieren.' }
    ],
    actions: [
      { title: 'Inserat und Bilder prüfen', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Preisstrategie und Saisonpreise vergleichen', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Buchungskanäle und Reichweite bewerten', owner: 'Marcel', priority: 'medium', messageDraft: null },
      { title: 'Bewertungen und Vertrauenselemente stärken', owner: 'Marcel', priority: 'medium', messageDraft: null }
    ]
  }
}

function inferProjectTitle(input) {
  const cleaned = input
    .replace(/^(ich|wir)\s+(will|wollen|möchte|moechte|muss|müssen)\s+/i, '')
    .replace(/[.!?]+$/g, '')
    .trim()

  if (!cleaned) return 'Projektlage strukturieren'

  return `${capitalize(cleaned)}`
}

function buildGenericAnalysis(input) {
  const title = inferProjectTitle(input)

  return {
    project: {
      title,
      description: `Es geht darum, ${toSentence(input).charAt(0).toLowerCase()}${toSentence(input).slice(1)} strukturiert in einen umsetzbaren nächsten Schritt zu überführen.`,
      type: 'decision',
      status: 'active'
    },
    nextMove: {
      title: 'Ziel, Entscheidung und nächste konkrete Aktion festlegen',
      reason: 'Der Input beschreibt ein reales Thema, aber noch keinen belastbaren Entscheidungsrahmen mit Priorität, Beteiligten und Frist.',
      effort: 'medium',
      impact: 'high',
      deadline: null
    },
    actors: [
      { name: 'Marcel', role: 'Verantwortlicher', influence: 'high', waitingFor: 'Konkrete Priorisierung und nächsten Schritt' }
    ],
    dependencies: [
      {
        from: 'Klares Zielbild',
        to: title,
        status: 'required',
        isBlocker: true,
        explanation: 'Ohne klares Ziel, Entscheidungskriterium und nächste Aktion bleibt das Thema offen und schwer steuerbar.'
      }
    ],
    risks: [
      {
        title: 'Thema bleibt diffus',
        severity: 'medium',
        explanation: 'Ohne konkreten Rahmen wird aus einem realen Vorhaben schnell eine lose Gedankenschleife statt eines steuerbaren Projekts.'
      }
    ],
    scenarios: [
      {
        title: 'Projektlage wird konkretisiert',
        outcome: 'Das Vorhaben lässt sich in Aktionen, Beteiligte und Abhängigkeiten übersetzen.',
        riskLevel: 'low',
        recommendation: 'Ziel, Frist, offene Entscheidung und beteiligte Parteien im nächsten Schritt explizit festhalten.'
      },
      {
        title: 'Thema bleibt nur grob beschrieben',
        outcome: 'Nächste Schritte bleiben unscharf und die Umsetzung verzögert sich.',
        riskLevel: 'medium',
        recommendation: 'Mindestens Ergebnis, Engpass und nächsten Termin konkretisieren.'
      }
    ],
    actions: [
      { title: 'Projektziel konkret formulieren', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Nächste Entscheidung benennen', owner: 'Marcel', priority: 'high', messageDraft: null },
      { title: 'Ersten realen Umsetzungsschritt terminieren', owner: 'Marcel', priority: 'medium', messageDraft: null }
    ]
  }
}

function fallbackHeuristicAnalysis(input) {
  const text = input.toLowerCase()
  const trimmed = input.trim()

  if (trimmed.length < 12 || trimmed.split(/\s+/).length < 3) {
    return buildLowConfidenceAnalysis(trimmed)
  }

  if (text.includes('auto') && (text.includes('kaufen') || text.includes('kauf'))) {
    return buildAutoPurchaseAnalysis(trimmed)
  }

  if (text.includes('bwa') || text.includes('bank') || text.includes('steuerberater') || text.includes('verkäufer')) {
    return buildFinancingBlockerAnalysis(trimmed)
  }

  if (text.includes('ferienhaus') || text.includes('auslast')) {
    return buildVacationRentalAnalysis(trimmed)
  }

  if ((text.includes('angebot') || text.includes('offerte')) && (text.includes('kunde') || text.includes('interessent'))) {
    return buildSalesAnalysis(trimmed)
  }

  return buildGenericAnalysis(trimmed)
}

const server = http.createServer(async (req, res) => {
  if (req.url !== '/bridge/analyze-project') {
    return sendJson(res, 404, { error: 'Not found' })
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  const auth = req.headers.authorization || ''
  if (auth !== `Bearer ${SECRET}`) {
    return unauthorized(res)
  }

  let raw = ''
  req.on('data', (chunk) => {
    raw += chunk
    if (raw.length > 100_000) {
      req.destroy()
    }
  })

  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}')

      if (body.jobType !== ALLOWED_JOB_TYPE) {
        return badRequest(res, 'Unsupported jobType')
      }

      if (body.promptVersion !== ALLOWED_PROMPT_VERSION) {
        return badRequest(res, 'Unsupported promptVersion')
      }

      if (typeof body.input !== 'string' || !body.input.trim()) {
        return badRequest(res, 'Input missing')
      }

      if (body.input.length > MAX_INPUT_LENGTH) {
        return badRequest(res, `Input too long. Max ${MAX_INPUT_LENGTH} chars.`)
      }

      if (body.outputFormat !== 'project_twin_json') {
        return badRequest(res, 'Unsupported outputFormat')
      }

      const result = fallbackHeuristicAnalysis(body.input.trim())
      return sendJson(res, 200, { result, meta: { source: 'openclaw-bridge-local', mode: 'heuristic-v2' } })
    } catch (error) {
      return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Bridge error' })
    }
  })
})

server.listen(PORT, HOST, () => {
  console.log(`OpenClaw bridge listening on http://${HOST}:${PORT}/bridge/analyze-project`)
})
