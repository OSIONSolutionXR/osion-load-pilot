/**
 * OSION Load Pilot - Generalized Complexity Engine
 * Phase 3: Signal-basierte Komplexitätserkennung mit Score 0-100
 */

/**
 * Analysiert Input auf verschiedene Komplexitätssignale
 * Gibt Score (0-100) und Detected Signals zurück
 */
export function analyzeComplexity(input) {
  const normalized = input.toLowerCase()
  const signals = []
  let score = 0

  // ============================================
  // A) INPUT-STRUKTUR SIGNALE
  // ============================================

  // Länge des Inputs (stärker gewichtet)
  const inputLength = input.length
  if (inputLength > 1000) {
    score += 25
    signals.push('extensive_input_structure')
  } else if (inputLength > 500) {
    score += 18
    signals.push('detailed_input_structure')
  } else if (inputLength > 250) {
    score += 10
    signals.push('moderate_input_structure')
  } else if (inputLength > 100) {
    score += 5
    signals.push('basic_input_structure')
  }

  // Absätze (mehrere Gedankenblöcke)
  const paragraphCount = input.split(/\n\s*\n|\n/).filter(p => p.trim().length > 20).length
  if (paragraphCount >= 4) {
    score += 8
    signals.push('multi_paragraph_scope')
  } else if (paragraphCount >= 2) {
    score += 4
    signals.push('structured_scope')
  }

  // Sätze (komplexe Beschreibung)
  const sentenceCount = input.split(/[.!?]+/).filter(s => s.trim().length > 10).length
  if (sentenceCount >= 8) {
    score += 6
    signals.push('complex_description')
  }

  // ============================================
  // B) PROJEKTBREITE SIGNALE
  // ============================================

  // Technische Systeme (stärker gewichtet)
  const techSignals = [
    'modul', 'system', 'plattform', 'app', 'software', 'hardware',
    'datenbank', 'backend', 'frontend', 'api', 'integration',
    'automation', 'sensor', 'steuerung', 'prozess',
    'ki', 'ai', 'algorithmus', 'dashboard', 'monitoring',
    'cloud', 'server', 'infrastruktur', 'netzwerk'
  ]
  const techCount = techSignals.filter(s => normalized.includes(s)).length
  if (techCount >= 4) {
    score += 18
    signals.push('multi_technical_systems')
  } else if (techCount >= 2) {
    score += 10
    signals.push('technical_system')
  }

  // Simple Projekte erkennen (Kauf/Miete ohne technische Komplexität)
  const simplePurchaseSignals = [
    'wohnwagen mieten', 'wohnwagen kaufen', 'auto kaufen', 'auto mieten',
    'motorrad kaufen', 'fahrzeug kaufen', 'fahrzeug mieten'
  ]
  if (simplePurchaseSignals.some(s => normalized.includes(s)) && techCount === 0) {
    score = Math.min(score, 10) // Max 10 für simple purchases
    signals.push('simple_purchase_project')
  }

  // Betrieb/Operational
  const operationalSignals = [
    'betrieb', 'prozess', 'workflow', 'ablauf', 'logistik',
    'wartung', 'support', 'service', 'versorgung', 'versorgen',
    'produktion', 'produzieren', 'herstellen', 'fertigung'
  ]
  const opCount = operationalSignals.filter(s => normalized.includes(s)).length
  if (opCount >= 2) {
    score += 8
    signals.push('operational_model')
  }

  // Mehrere Module/Komponenten
  const moduleSignals = ['modul', 'komponente', 'baustein', 'einheit', 'systemteil', 'funktionseinheit']
  const moduleCount = moduleSignals.reduce((count, term) => {
    const matches = normalized.match(new RegExp(term, 'g'))
    return count + (matches ? matches.length : 0)
  }, 0)
  if (moduleCount >= 3) {
    score += 10
    signals.push('multi_module_architecture')
  } else if (moduleCount >= 1) {
    score += 4
    signals.push('modular_structure')
  }

  // Recht/Regulatorisch
  const legalSignals = [
    'recht', 'regulatorisch', 'genehmigung', 'zulassung', 'norm',
    'standard', 'vorschrift', 'gesetz', 'compliance', 'sicherheit'
  ]
  const legalCount = legalSignals.filter(s => normalized.includes(s)).length
  if (legalCount >= 2) {
    score += 10
    signals.push('regulatory_relevance')
  } else if (legalCount >= 1) {
    score += 5
    signals.push('legal_considerations')
  }

  // Finanzierung/Geschäftsmodell
  const financeSignals = [
    'finanzierung', 'budget', 'investition', 'kosten', 'wirtschaftlichkeit',
    'geschäftsmodell', 'revenue', 'umsatz', 'rentabilität', 'roi'
  ]
  const financeCount = financeSignals.filter(s => normalized.includes(s)).length
  if (financeCount >= 2) {
    score += 7
    signals.push('financial_model')
  }

  // ============================================
  // C) STAKEHOLDER/PARTNER SIGNALE
  // ============================================

  const stakeholderSignals = [
    'partner', 'lieferant', 'dienstleister', 'kunde', 'nutzer',
    'anwender', 'benutzer', ' stakeholder', 'akteur', 'betreiber',
    'betreiben', 'organisation', 'unternehmen', 'firma',
    'behörde', 'amt', 'institution', 'forschung', 'universität'
  ]
  const stakeholderCount = stakeholderSignals.filter(s => normalized.includes(s)).length
  if (stakeholderCount >= 3) {
    score += 10
    signals.push('multi_stakeholder_project')
  } else if (stakeholderCount >= 1) {
    score += 4
    signals.push('external_dependencies')
  }

  // Mehrere Standorte
  const locationSignals = [
    'standort', 'ort', 'region', 'gebiet', 'standorte',
    'mehrere', 'verschiedene', 'dezentral', 'verteilt'
  ]
  const locationCount = locationSignals.filter(s => normalized.includes(s)).length
  if (locationCount >= 2) {
    score += 6
    signals.push('multi_location_scope')
  }

  // ============================================
  // D) UMSETZUNGSREALITÄT
  // ============================================

  // Prototyp/MVP/Pilot
  const prototypeSignals = [
    'prototyp', 'mvp', 'pilot', 'test', 'proof of concept', 'poc',
    'minimal', 'erste version', 'proof-of-concept'
  ]
  if (prototypeSignals.some(s => normalized.includes(s))) {
    score += 8
    signals.push('prototype_required')
  }

  // Mehrere Phasen
  const phaseSignals = [
    'phase', 'stufe', 'etappe', 'mehrstufig', 'schrittweise',
    'iterativ', 'inkrementell', 'rollout', 'ausrollen'
  ]
  if (phaseSignals.some(s => normalized.includes(s))) {
    score += 6
    signals.push('phased_implementation')
  }

  // Skalierung
  const scaleSignals = [
    'skalierung', 'skalieren', 'wachstum', 'expandieren',
    'erweiterung', 'ausbau', 'mehrere standorte', 'rollout'
  ]
  if (scaleSignals.some(s => normalized.includes(s))) {
    score += 7
    signals.push('scaling_strategy')
  }

  // ============================================
  // E) KRITISCHE SYSTEME
  // ============================================

  // Krisen/Notfall/Versorgung
  const crisisSignals = [
    'krise', 'katastrophe', 'notfall', 'versorgung', 'sicherheit',
    'kritisch', 'lebenswichtig', 'infrastruktur', 'resilienz'
  ]
  const crisisCount = crisisSignals.filter(s => normalized.includes(s)).length
  if (crisisCount >= 2) {
    score += 15
    signals.push('critical_infrastructure')
  } else if (crisisCount >= 1) {
    score += 7
    signals.push('safety_relevance')
  }

  // Daten/KI/Automatisierung
  const dataSignals = [
    'daten', 'ki', 'ai', 'algorithmus', 'automatisch',
    'automation', 'selbst', 'intelligent', 'analyse'
  ]
  const dataCount = dataSignals.filter(s => normalized.includes(s)).length
  if (dataCount >= 2) {
    score += 6
    signals.push('data_driven_operations')
  }

  // ============================================
  // F) EINSATZUMFELD
  // ============================================

  // Spezifische Umgebungen
  const environmentSignals = [
    'forschungsstation', 'offshore', 'polar', 'expedition',
    'weltraum', 'raumfahrt', 'habitat', 'isoliert',
    'abgelegen', 'fern', 'remote', 'dezentral'
  ]
  if (environmentSignals.some(s => normalized.includes(s))) {
    score += 8
    signals.push('specialized_environment')
  }

  // ============================================
  // SCORE BEGRENZEN UND KLASSE BESTIMMEN
  // ============================================

  score = Math.min(100, Math.max(0, score))

  // Klassifizierung
  let complexity
  if (score >= 75) {
    complexity = 'high_end'
  } else if (score >= 50) {
    complexity = 'complex'
  } else if (score >= 25) {
    complexity = 'medium'
  } else {
    complexity = 'simple'
  }

  // Domain erkennen (generalisiert)
  const domain = detectGeneralDomain(normalized, signals)

  return {
    complexity,
    complexityScore: score,
    complexitySignals: signals.slice(0, 15), // Max 15 Signals
    domain
  }
}

/**
 * Generalisierte Domain-Erkennung ohne Hardcode auf Projektnamen
 */
function detectGeneralDomain(normalized, signals) {
  // Krisen/Infrastruktur
  if (signals.includes('critical_infrastructure') ||
      /(katastrophe|krise|notfall|versorgung|shelter|evakuierung)/.test(normalized)) {
    return 'crisis_infrastructure'
  }

  // Technologie-Plattform
  if (signals.includes('multi_technical_systems') ||
      (signals.includes('technical_system') && signals.includes('data_driven_operations'))) {
    return 'technology_platform'
  }

  // Operational/Prozess
  if (signals.includes('operational_model') ||
      (signals.includes('multi_module_architecture') && signals.includes('phased_implementation'))) {
    return 'operational_platform'
  }

  // Einfacher Kauf/Miete
  if (/^(ich möchte|ich will|ich muss).*(kaufen|mieten|leasing)/i.test(normalized) &&
      !signals.includes('multi_technical_systems')) {
    return 'simple_purchase'
  }

  // Marketing/Sales
  if (/(funnel|marketing|verkauf|kunden|conversion|leads)/.test(normalized)) {
    return 'sales_operations'
  }

  // Software/Web
  if (/(website|webapp|app|software|entwicklung)/.test(normalized) &&
      !signals.includes('multi_stakeholder_project')) {
    return 'software_project'
  }

  // Forschung/Spezialumfeld
  if (signals.includes('specialized_environment')) {
    return 'research_deployment'
  }

  return 'project'
}

/**
 * Gibt Richtwerte für Output-Tiefe basierend auf Komplexität
 */
export function getOutputDepthGuidelines(complexity) {
  const guidelines = {
    simple: {
      processSteps: { min: 5, max: 8, target: 6 },
      actions: { min: 5, max: 12, target: 8 },
      risks: { min: 2, max: 5, target: 3 },
      questions: { min: 2, max: 5, target: 3 },
      blockers: { min: 0, max: 3, target: 1 },
      options: { min: 1, max: 3, target: 2 },
      promptInstruction: 'Dies ist ein kleines, überschaubares Projekt. Erzeuge einen schlanken Project Twin mit konkreten, ausführbaren Schritten. Keine künstliche Aufblähung.'
    },
    medium: {
      processSteps: { min: 8, max: 12, target: 10 },
      actions: { min: 12, max: 25, target: 18 },
      risks: { min: 4, max: 8, target: 6 },
      questions: { min: 5, max: 10, target: 7 },
      blockers: { min: 2, max: 6, target: 4 },
      options: { min: 2, max: 5, target: 3 },
      promptInstruction: 'Dies ist ein mittleres Projekt mit mehreren Aspekten. Erzeuge einen strukturierten Project Twin mit guter Abdeckung aller relevanten Dimensionen.'
    },
    complex: {
      processSteps: { min: 12, max: 18, target: 15 },
      actions: { min: 25, max: 50, target: 35 },
      risks: { min: 8, max: 15, target: 12 },
      questions: { min: 8, max: 15, target: 12 },
      blockers: { min: 5, max: 10, target: 7 },
      options: { min: 4, max: 8, target: 6 },
      promptInstruction: 'Dies ist ein komplexes Projekt mit technischen Systemen, mehreren Stakeholdern und operationalen Anforderungen. Zerlege das Projekt in alle relevanten Dimensionen: Zielbild, Stakeholder, Architektur, Module, Betrieb, Recht, Finanzierung, Partner, Daten, Sicherheit, Risiken, Pilotierung. Erzeuge pro Dimension konkrete, operative Actions.'
    },
    high_end: {
      processSteps: { min: 14, max: 24, target: 18 },
      actions: { min: 35, max: 80, target: 50 },
      risks: { min: 12, max: 25, target: 18 },
      questions: { min: 12, max: 25, target: 18 },
      blockers: { min: 8, max: 15, target: 12 },
      options: { min: 5, max: 10, target: 7 },
      promptInstruction: 'Dies ist ein High-End-Projekt mit kritischer Infrastruktur, regulatorischen Anforderungen, Sicherheitsrelevanz oder komplexem Versorgungssystem. Analysiere das Projekt in ALLEN Dimensionen: Zielbild und Erfolgskriterien, Zielgruppen, Stakeholder, Systemarchitektur, Modulstruktur, Datenmodell, Betriebsmodell, technische Machbarkeit, rechtliche Anforderungen, Sicherheitsanforderungen, Partner, Kosten und Wirtschaftlichkeit, MVP/Prototyp, Pilotprojekt, Risiko- und Notfalllogik, Qualitätskriterien, Skalierung, Kommunikationsstruktur. Erzeuge für jede relevante Dimension mehrere konkrete, operative Actions mit klaren Verantwortlichkeiten und Abhängigkeiten.'
    }
  }

  return guidelines[complexity] || guidelines.medium
}
