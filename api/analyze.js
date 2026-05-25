/**
 * LoadPilot Analyze API - CommonJS
 * POST /api/analyze - Direct analysis using OpenClaw
 * 
 * Sprint 1: Backend Foundation includes analysis endpoint
 * This replaces the need for localhost bridge
 */

const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const REQUEST_TIMEOUT_MS = 180000;

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Analysis prompt template (simplified version)
const ANALYSIS_PROMPT = (input) => `
Du bist OSION Load Pilot, ein KI-Projektassistent.

Analysiere die folgende Eingabe und erkenne:
1. Ist es ein valides Projekt? (Budget, Zeitrahmen, Ziel)
2. Welcher Domain? (business, creative, personal, technical)
3. Wie hoch ist die Qualität der Eingabe?

Eingabe: "${input}"

Antworte NUR mit gültigem JSON in diesem Format:
{
  "quality": {
    "inputQuality": "usable" | "insufficient",
    "isActionable": true | false,
    "confidence": "high" | "medium" | "low",
    "missingContext": ["string"],
    "reason": "string"
  },
  "project": {
    "title": "string",
    "description": "string",
    "type": "business" | "creative" | "personal" | "technical",
    "status": "active"
  },
  "meta": {
    "domain": "business" | "creative" | "personal" | "technical",
    "analysisMode": "loadpilot_v2",
    "promptVersion": "loadpilot_v2"
  }
}`;

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, sessionId } = req.body || {};

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ 
      error: 'Missing required field',
      required: ['input']
    });
  }

  try {
    // Check if input is actionable (simple heuristic)
    const trimmed = input.trim();
    const wordCount = trimmed.split(/\s+/).length;
    
    // Very short or test inputs get minimal analysis
    if (wordCount < 3 || trimmed.length < 10 || 
        /^(test|abc|xxx|123)$/i.test(trimmed)) {
      return res.status(200).json({
        quality: {
          inputQuality: 'insufficient',
          isActionable: false,
          confidence: 'high',
          missingContext: ['Projektbeschreibung zu kurz oder Testeingabe'],
          reason: 'Eingabe erkannt als Test oder zu kurz für sinnvolle Analyse'
        },
        project: {
          title: 'Unvollständige Eingabe',
          description: trimmed,
          type: 'personal',
          status: 'draft'
        },
        nextMove: {
          title: 'Detaillierte Projektbeschreibung erfassen',
          reason: 'Für eine sinnvolle Analyse werden mehr Details benötigt: Ziel, aktuelle Lage, nächste Entscheidung',
          effort: 'low',
          impact: 'high',
          deadline: null
        },
        actions: [],
        actors: [],
        dependencies: [],
        risks: [],
        scenarios: [],
        meta: {
          domain: 'personal',
          analysisMode: 'loadpilot_v2',
          promptVersion: 'loadpilot_v2',
          generatedAt: new Date().toISOString()
        }
      });
    }

    // Call OpenClaw directly via CLI for real analysis
    const prompt = ANALYSIS_PROMPT(input);
    
    const { stdout } = await execFileAsync(
      'openclaw',
      [
        'infer', 'model', 'run',
        '--gateway',
        '--model', 'ollama/kimi-k2.5:cloud',
        '--prompt', prompt,
        '--thinking', 'off'
      ],
      { 
        timeout: REQUEST_TIMEOUT_MS, 
        maxBuffer: 1024 * 1024, 
        encoding: 'utf8' 
      }
    );

    // Parse response
    let analysis;
    try {
      const parsed = JSON.parse(stdout);
      
      // Handle envelope format if present
      if (parsed.content) {
        const contentMatch = parsed.content.match(/\{[\s\S]*\}/);
        if (contentMatch) {
          analysis = JSON.parse(contentMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } else {
        analysis = parsed;
      }
    } catch (parseErr) {
      // Fallback: Try to extract JSON from stdout directly
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error('Failed to parse analysis response');
        }
      } else {
        throw new Error('No JSON response from model');
      }
    }

    // Ensure required fields
    const result = {
      quality: analysis.quality || {
        inputQuality: 'usable',
        isActionable: true,
        confidence: 'medium',
        missingContext: [],
        reason: 'Analyse erfolgreich'
      },
      project: analysis.project || {
        title: input.slice(0, 50),
        description: input,
        type: 'business',
        status: 'active'
      },
      nextMove: analysis.nextMove || {
        title: 'Erste Maßnahme definieren',
        reason: 'Projekt analysiert – nächste Schritte ableiten',
        effort: 'medium',
        impact: 'high',
        deadline: null
      },
      actions: analysis.actions || [],
      actors: analysis.actors || [],
      dependencies: analysis.dependencies || [],
      risks: analysis.risks || [],
      scenarios: analysis.scenarios || [],
      meta: {
        domain: analysis.meta?.domain || 'business',
        analysisMode: 'loadpilot_v2',
        promptVersion: 'loadpilot_v2',
        generatedAt: new Date().toISOString()
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('[Analyze API] Error:', error.message);
    
    // Return fallback analysis on error
    return res.status(200).json({
      quality: {
        inputQuality: 'usable',
        isActionable: true,
        confidence: 'low',
        missingContext: ['KI-Analyse vorübergehend nicht verfügbar'],
        reason: 'Fallback-Modus aktiviert nach Analysefehler'
      },
      project: {
        title: input.slice(0, 50),
        description: input,
        type: 'business',
        status: 'active'
      },
      nextMove: {
        title: 'Projektdetails manuell erfassen',
        reason: 'KI-Analyse vorübergehend nicht verfügbar – bitte manuell fortfahren',
        effort: 'medium',
        impact: 'medium',
        deadline: null
      },
      actions: [],
      actors: [],
      dependencies: [],
      risks: [],
      scenarios: [],
      meta: {
        domain: 'business',
        analysisMode: 'loadpilot_v2',
        promptVersion: 'loadpilot_v2',
        generatedAt: new Date().toISOString(),
        fallback: true,
        error: error.message
      }
    });
  }
};
