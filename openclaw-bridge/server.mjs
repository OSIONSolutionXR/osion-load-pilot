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

function fallbackHeuristicAnalysis(input) {
  const text = input.toLowerCase()

  if (text.includes('bwa') && text.includes('bank')) {
    return {
      project: {
        title: 'Finanzierung / Bankprüfung',
        description: 'Die Finanzierung hängt aktuell an einer fehlenden BWA und blockiert die Bankprüfung.',
        type: 'financing',
        status: 'blocked'
      },
      nextMove: {
        title: 'Steuerberater Müller heute mit Frist zur BWA anschreiben',
        reason: 'Die fehlende BWA ist der direkte Blocker für die Bankprüfung und beeinflusst die Verkäufer-Rückmeldung.',
        effort: 'low',
        impact: 'high',
        deadline: 'Freitag'
      },
      actors: [
        { name: 'Steuerberater Müller', role: 'Dokumentenlieferant', influence: 'high', waitingFor: 'BWA-Anforderung mit Frist' },
        { name: 'Bank', role: 'Prüfende Institution', influence: 'high', waitingFor: 'BWA' },
        { name: 'Verkäufer', role: 'Entscheidungspartner', influence: 'medium', waitingFor: 'Rückmeldung bis Freitag' }
      ],
      dependencies: [
        { from: 'Steuerberater Müller', to: 'BWA', status: 'blocked', isBlocker: true, explanation: 'Die BWA wurde noch nicht geliefert.' },
        { from: 'BWA', to: 'Bankprüfung', status: 'required', isBlocker: true, explanation: 'Ohne BWA startet die Bankprüfung nicht.' },
        { from: 'Bankprüfung', to: 'Finanzierungszusage', status: 'waiting', isBlocker: false, explanation: 'Nach Prüfung kann die Zusage erfolgen.' },
        { from: 'Finanzierungszusage', to: 'Verkäuferentscheidung', status: 'waiting', isBlocker: false, explanation: 'Die Rückmeldung an den Verkäufer hängt an der Finanzierung.' }
      ],
      risks: [
        { title: 'Verkäufer verliert Vertrauen', severity: 'high', explanation: 'Ohne Rückmeldung bis Freitag steigt das Absprungrisiko.' },
        { title: 'Bankprüfung verzögert sich', severity: 'high', explanation: 'Die fehlende BWA stoppt den Prozess vollständig.' }
      ],
      scenarios: [
        { title: 'BWA kommt heute', outcome: 'Die Bankprüfung kann unmittelbar starten.', riskLevel: 'low', recommendation: 'Sofort an Bank weiterleiten und Verkäufer aktiv updaten.' },
        { title: 'BWA kommt nicht heute', outcome: 'Die Finanzierung bleibt blockiert und die Verkäuferfrist wird kritisch.', riskLevel: 'high', recommendation: 'Eskalation an Steuerberater und Zwischenstand an Verkäufer senden.' }
      ],
      actions: [
        { title: 'Steuerberater Müller kontaktieren', owner: 'Marcel', priority: 'high', messageDraft: 'Hallo Herr Müller, die Bank wartet dringend auf die BWA. Bitte senden Sie sie mir heute, spätestens vor Freitag, damit die Prüfung starten kann.' },
        { title: 'Verkäufer proaktiv informieren', owner: 'Marcel', priority: 'medium', messageDraft: 'Kurzer Zwischenstand: Die Finanzierung ist in Prüfungsvorbereitung, ich warte aktuell noch auf eine letzte Unterlage und melde mich bis Freitag verbindlich zurück.' }
      ]
    }
  }

  if (text.includes('angebot') && text.includes('kunde')) {
    return {
      project: {
        title: 'Kundenangebot',
        description: 'Ein potenziell umsatzrelevantes Angebot wartet auf Versand oder Zwischenstand.',
        type: 'sales',
        status: 'active'
      },
      nextMove: {
        title: 'Heute ein kurzes Angebots- oder Zwischenstands-Update an Kunde Müller senden',
        reason: 'Der Kunde wartet bereits, und Schweigen wirkt unprofessionell bei gleichzeitigem Umsatzpotenzial.',
        effort: 'low',
        impact: 'high',
        deadline: 'Heute'
      },
      actors: [
        { name: 'Kunde Müller', role: 'Interessent', influence: 'high', waitingFor: 'Angebot oder Zwischenstand' }
      ],
      dependencies: [
        { from: 'Angebot', to: 'Kundenentscheidung', status: 'required', isBlocker: false, explanation: 'Ohne Angebot kann der Kunde nicht entscheiden.' }
      ],
      risks: [
        { title: 'Abschlusschance sinkt', severity: 'high', explanation: 'Wenn heute nichts rausgeht, wirkt der Prozess unprofessionell und kalt.' }
      ],
      scenarios: [
        { title: 'Heute Zwischenstand senden', outcome: 'Kunde bleibt warm und die Professionalität bleibt erhalten.', riskLevel: 'low', recommendation: 'Kurzes Update noch heute schicken.' },
        { title: 'Heute nichts senden', outcome: 'Interesse und Vertrauen können sinken.', riskLevel: 'high', recommendation: 'Mindestens kurze Rückmeldung senden.' }
      ],
      actions: [
        { title: 'Kundenupdate senden', owner: 'Marcel', priority: 'high', messageDraft: 'Hallo Herr Müller, ich bin an Ihrem Angebot dran und sende Ihnen heute noch den Zwischenstand bzw. die finale Fassung.' }
      ]
    }
  }

  return {
    project: {
      title: 'Projektlage mit mehreren offenen Punkten',
      description: 'Es wurden mehrere Aufgaben, Wartesituationen und Prioritäten erkannt.',
      type: 'mixed',
      status: 'active'
    },
    nextMove: {
      title: 'Den unmittelbarsten Geld- oder Blockerhebel zuerst bewegen',
      reason: 'Ohne Priorisierung bleibt die Lage diffus und erzeugt unnötige kognitive Last.',
      effort: 'medium',
      impact: 'high',
      deadline: null
    },
    actors: [],
    dependencies: [],
    risks: [
      { title: 'Verzettelung', severity: 'medium', explanation: 'Mehrere offene Themen ohne klare Reihenfolge binden Fokus.' }
    ],
    scenarios: [
      { title: 'Aktiv priorisieren', outcome: 'Mehr Klarheit und schnellere Entlastung.', riskLevel: 'low', recommendation: 'Erst Geldhebel und wartende Personen bedienen.' }
    ],
    actions: [
      { title: 'Top-1-Hebel festlegen', owner: 'Marcel', priority: 'high', messageDraft: null }
    ]
  }
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
      return sendJson(res, 200, { result, meta: { source: 'openclaw-bridge-local', mode: 'heuristic-v1' } })
    } catch (error) {
      return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Bridge error' })
    }
  })
})

server.listen(PORT, HOST, () => {
  console.log(`OpenClaw bridge listening on http://${HOST}:${PORT}/bridge/analyze-project`)
})
