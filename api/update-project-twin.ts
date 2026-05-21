import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GLOBALER CATCH-ALL: Nie crashen, immer JSON zurückgeben
  try {
    res.setHeader('Content-Type', 'application/json')

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ 
        error: 'method_not_allowed',
        message: 'Nur POST ist erlaubt.' 
      })
    }

    const body = req.body as Record<string, unknown> | undefined

    // Debug-Info sammeln (keine Secrets)
    const debugInfo = {
      stage: 'initial',
      hasBridgeUrl: Boolean(process.env.OPENCLAW_BRIDGE_URL),
      hasSecret: Boolean(process.env.OPENCLAW_BRIDGE_SECRET),
      payloadKeys: body ? Object.keys(body) : [],
      hasExistingTwin: Boolean(body?.existingTwin),
      hasAdditionalInput: Boolean(body?.additionalInput),
      hasUpdateMode: Boolean(body?.updateMode),
      hasOriginalInput: Boolean(body?.originalInput)
    }

    // Validierung
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        error: 'invalid_body',
        message: 'Request body fehlt oder ist kein Objekt.',
        debug: debugInfo
      })
    }

    const { existingTwin, additionalInput, originalInput, updateMode, contextAnswers } = body

    if (!existingTwin || typeof existingTwin !== 'object') {
      return res.status(400).json({
        error: 'missing_existing_twin',
        message: 'existingTwin fehlt oder ist ungültig.',
        debug: { ...debugInfo, stage: 'validation' }
      })
    }

    if (!additionalInput || typeof additionalInput !== 'string') {
      return res.status(400).json({
        error: 'missing_additional_input',
        message: 'additionalInput fehlt oder ist kein String.',
        debug: { ...debugInfo, stage: 'validation' }
      })
    }

    if (additionalInput.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({
        error: 'input_too_long',
        message: `Input zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.`,
        debug: { ...debugInfo, stage: 'validation', inputLength: additionalInput.length }
      })
    }

    // Bridge-URL bauen
    const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
    const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

    if (!bridgeUrl || !bridgeSecret) {
      return res.status(500).json({
        error: 'bridge_not_configured',
        message: 'OpenClaw Bridge ist nicht konfiguriert.',
        debug: { ...debugInfo, stage: 'config_check' }
      })
    }

    // URL-Konstruktion: Extrahiere Base, baue Update-Endpoint
    // Eingabe: http://host:8788/bridge/analyze-project
    // Ziel:   http://host:8788/bridge/update-project-twin
    let baseUrl: string
    try {
      const urlObj = new URL(bridgeUrl)
      baseUrl = `${urlObj.protocol}//${urlObj.host}`
    } catch {
      // Fallback: String-Manipulation
      baseUrl = bridgeUrl
        .replace(/\/bridge\/.*$/, '')
        .replace(/\/+$/, '')
    }
    
    const updateUrl = `${baseUrl}/bridge/update-project-twin`

    debugInfo.stage = 'bridge_call'

    // Payload für Bridge
    const payload = {
      jobType: 'loadpilot_project_twin_update',
      promptVersion: 'loadpilot_v2',
      outputFormat: 'project_twin_json',
      updateMode: updateMode || 'refine_existing_twin',
      existingTwin,
      additionalInput,
      originalInput: originalInput || '',
      contextAnswers: contextAnswers || []
    }

    // Fetch zur Bridge
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let bridgeResponse: Response
    let bridgeStatus: number
    let bridgeBodyText: string
    let bridgeJson: Record<string, unknown> | null = null

    try {
      bridgeResponse = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bridgeSecret}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      bridgeStatus = bridgeResponse.status
      bridgeBodyText = await bridgeResponse.text()

      // Parse JSON wenn möglich
      try {
        bridgeJson = JSON.parse(bridgeBodyText) as Record<string, unknown>
      } catch {
        bridgeJson = null
      }

    } catch (fetchError) {
      clearTimeout(timeout)
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      
      return res.status(502).json({
        error: 'bridge_fetch_failed',
        message: `Bridge-Aufruf fehlgeschlagen: ${errorMsg}`,
        debug: {
          ...debugInfo,
          stage: 'bridge_fetch',
          updateUrl: updateUrl.replace(/:\/\/[^:]+:/, '://***:'), // URL ohne Credentials
          error: errorMsg
        }
      })
    } finally {
      clearTimeout(timeout)
    }

    // Bridge nicht OK?
    if (!bridgeResponse.ok) {
      return res.status(502).json({
        error: 'bridge_error',
        message: bridgeJson?.error || `Bridge gab Status ${bridgeStatus} zurück.`,
        debug: {
          ...debugInfo,
          stage: 'bridge_response',
          bridgeStatus,
          bridgeResponseKeys: bridgeJson ? Object.keys(bridgeJson) : [],
          bridgeBodyPreview: bridgeBodyText.substring(0, 200)
        }
      })
    }

    // Bridge OK, aber kein JSON?
    if (!bridgeJson) {
      return res.status(502).json({
        error: 'bridge_invalid_json',
        message: 'Bridge hat kein gültiges JSON zurückgegeben.',
        debug: {
          ...debugInfo,
          stage: 'bridge_parse',
          bridgeStatus,
          bridgeBodyPreview: bridgeBodyText.substring(0, 200)
        }
      })
    }

    debugInfo.stage = 'response_processing'

    // Extrahiere result aus Bridge-Response
    const bridgeResult = bridgeJson.result || bridgeJson

    if (!bridgeResult || typeof bridgeResult !== 'object') {
      return res.status(502).json({
        error: 'bridge_empty_result',
        message: 'Bridge-Result ist leer oder kein Objekt.',
        debug: {
          ...debugInfo,
          stage: 'result_extraction',
          bridgeTopLevelKeys: Object.keys(bridgeJson),
          resultType: typeof bridgeResult
        }
      })
    }

    // Merge: Bridge-Result + Existing Twin
    // Wenn Bridge nur partielle Daten liefert, ergänze aus existingTwin
    const result = bridgeResult as Record<string, unknown>
    const existing = existingTwin as Record<string, unknown>

    const mergedTwin = {
      project: result.project || existing.project,
      nextMove: result.nextMove || existing.nextMove,
      actors: result.actors || existing.actors || [],
      dependencies: result.dependencies || existing.dependencies || [],
      risks: result.risks || existing.risks || [],
      scenarios: result.scenarios || existing.scenarios || [],
      actions: result.actions || existing.actions || [],
      quality: result.quality || existing.quality,
      meta: {
        ...(typeof existing.meta === 'object' ? existing.meta : {}),
        ...(typeof result.meta === 'object' ? result.meta : {}),
        updatedAt: new Date().toISOString(),
        updateSource: 'loadpilot_update'
      }
    }

    // Validierung: Pflichtfelder prüfen
    const requiredFields = ['project', 'nextMove', 'quality']
    const missingFields = requiredFields.filter(f => !mergedTwin[f as keyof typeof mergedTwin])
    
    if (missingFields.length > 0) {
      return res.status(502).json({
        error: 'incomplete_response',
        message: `Merged Twin fehlt Pflichtfelder: ${missingFields.join(', ')}`,
        debug: {
          ...debugInfo,
          stage: 'merge_validation',
          missingFields,
          resultKeys: Object.keys(result),
          existingKeys: Object.keys(existing)
        }
      })
    }

    // Erfolgreiche Antwort
    return res.status(200).json({
      updatedTwin: mergedTwin,
      updateSummary: 'Project Twin erfolgreich aktualisiert.',
      changedFields: [],
      newProgress: {
        percent: 50,
        level: 2,
        stage: 'updated'
      },
      meta: {
        source: 'vercel-update-route',
        bridgeMode: 'openclaw-kimi',
        jobType: 'loadpilot_project_twin_update',
        processedAt: new Date().toISOString()
      }
    })

  } catch (globalError) {
    // ABSOLUTER CATCH-ALL: Nie crashen
    const errorMsg = globalError instanceof Error ? globalError.message : 'Unknown error'
    
    return res.status(500).json({
      error: 'unhandled_exception',
      message: errorMsg,
      stage: 'global_catch',
      debug: {
        hasBridgeUrl: Boolean(process.env.OPENCLAW_BRIDGE_URL),
        hasSecret: Boolean(process.env.OPENCLAW_BRIDGE_SECRET)
      }
    })
  }
}
