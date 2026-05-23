import { motion } from 'motion/react'
import { Lightbulb, HelpCircle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface ContextQuestionsPanelProps {
  missingContext: string[]
  confidence: 'low' | 'medium' | 'high'
  projectType: string
  onRefineClick: () => void
}

// Generiert domänenspezifische, unternehmerisch hochwertige Fragen
function generateContextQuestions(
  missingContext: string[],
  projectType: string
): string[] {
  // Mapping von generischen missingContext zu konkreten Fragen
  const questionMap: Record<string, string[]> = {
    'Budget': [
      'Welcher Budgetrahmen ist geplant?',
      'Soll es Barzahlung, Finanzierung oder Leasing werden?'
    ],
    'Nutzungsprofil': [
      'Wofür wird das Auto hauptsächlich genutzt?',
      'Welches Einsatzszenario hat Priorität: Stadt, Autobahn, Gelände?'
    ],
    'Fahrzeugtyp': [
      'Hast du Präferenzen für bestimmte Marken oder Modelle?',
      'Soll es ein Neuwagen oder Gebrauchter sein?'
    ],
    'Zahlungsweise': [
      'Bevorzugst du Barzahlung, Finanzierung oder Leasing?',
      'Wie flexibel bist du beim Preisverhandeln?'
    ],
    'Zeitrahmen': [
      'Bis wann soll die Entscheidung fallen?',
      'Gibt es einen dringenden Termin oder Frist?'
    ],
    'Zielmarkt': [
      'Was ist der gewünschte Zielmarkt?',
      'Welche geografische Reichweite ist relevant?'
    ],
    'Zielgruppe': [
      'Welche Zielgruppe soll zuerst validieren?',
      'Wer ist der ideale erste Nutzer/Kunde?'
    ],
    'Erfolgskriterien': [
      'Was gilt als Erfolg: Nutzerzahl, Umsatz, Kundenfeedback oder technischer Proof?',
      'Welche Metrik ist am wichtigsten in den ersten 90 Tagen?'
    ],
    'Ressourcen': [
      'Welche Ressourcen stehen für Entwicklung und Vertrieb bereit?',
      'Wie viel Zeit kannst du selbst investieren?'
    ],
    'Rahmenbedingungen': [
      'Gibt es harte Constraints (Fristen, Budgetlimits, Genehmigungen)?',
      'Welche Flexibilität hast du bei der Umsetzung?'
    ],
    'Erfolgskriterium': [
      'Woran erkennst du, dass das Projekt gelungen ist?',
      'Was ist das gewünschte Ergebnis aus deiner Sicht?'
    ],
    'beteiligte Personen': [
      'Wer ist an der Entscheidung beteiligt?',
      'Wer muss informiert oder eingebunden werden?'
    ],
    'Frist': [
      'Gibt es einen festen Termin oder eine Deadline?',
      'Wann muss das Ergebnis stehen?'
    ],
    'Ziel': [
      'Welches konkrete Ziel soll mit dem Projekt erreicht werden?',
      'Was ist das gewünschte Endresultat?'
    ],
    'gewünschtes Ergebnis': [
      'Was wäre ein gutes Ergebnis aus deiner Sicht?',
      'Wie misst du den Erfolg?'
    ],
    'offene Entscheidung': [
      'Welche Entscheidung steht aktuell aus?',
      'Was blockiert den nächsten Schritt?'
    ]
  }

  // Domänenspezifische Fragen basierend auf Projekttyp
  const domainQuestions: Record<string, string[]> = {
    'private_purchase': [
      'Welcher Budgetrahmen ist geplant?',
      'Soll es Barzahlung, Finanzierung oder Leasing werden?',
      'Wofür wird das Auto hauptsächlich genutzt?',
      'Bis wann soll die Entscheidung fallen?'
    ],
    'hospitality_growth': [
      'Welche Zielgruppe soll zuerst validieren?',
      'Was gilt als Erfolg: Buchungen, Bewertungen, Wiederkauf?',
      'Welche Saisonalität ist relevant?',
      'Welches Marketingbudget steht zur Verfügung?'
    ],
    'sales': [
      'Was ist die aktuelle Conversion-Rate?',
      'Welcher Deal-Stage braucht am meisten Unterstützung?',
      'Wie sieht der ideale Kunden-Profil aus?'
    ],
    'operations': [
      'Was ist der gewünschte Zielmarkt?',
      'Welche Zielgruppe soll zuerst validieren?',
      'Was gilt als Erfolg: Nutzerzahl, Umsatz, Kundenfeedback oder technischer Proof?',
      'Welche Ressourcen stehen für Entwicklung und Vertrieb bereit?'
    ],
    'internal_project': [
      'Wer ist an der Entscheidung beteiligt?',
      'Gibt es eine Frist oder einen gewünschten Zeitpunkt?',
      'Welcher Budgetrahmen oder Ressourcenrahmen ist relevant?'
    ]
  }

  // Kombiniere: Erst domänenspezifisch, dann aus missingContext
  const questions: string[] = []
  const seen = new Set<string>()

  // Domänenspezifische Fragen (wenn bekannt)
  if (domainQuestions[projectType]) {
    for (const q of domainQuestions[projectType]) {
      if (!seen.has(q)) {
        questions.push(q)
        seen.add(q)
      }
    }
  }

  // Aus dem mapping generierte Fragen
  for (const ctx of missingContext) {
    const mapped = questionMap[ctx]
    if (mapped) {
      for (const q of mapped) {
        if (!seen.has(q)) {
          questions.push(q)
          seen.add(q)
        }
      }
    } else {
      // Fallback: Generische Frage formulieren
      const generic = `Kannst du mehr zu "${ctx}" sagen?`
      if (!seen.has(generic)) {
        questions.push(generic)
        seen.add(generic)
      }
    }
  }

  // Begrenze auf 3-5 Fragen
  return questions.slice(0, 5)
}

export default function ContextQuestionsPanel({
  missingContext,
  confidence,
  projectType,
  onRefineClick
}: ContextQuestionsPanelProps) {
  const questions = generateContextQuestions(missingContext, projectType)
  const isLowConfidence = confidence === 'low'

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="panel-premium p-6 md:p-8 border-l-4 border-l-violet-500"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 flex items-center justify-center border border-violet-500/30 flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Diese Angaben würden die Analyse stärker machen
            </h3>
            <p className="text-zinc-400 text-sm">
              {isLowConfidence 
                ? 'Die Projektlage ist erkennbar. Für eine belastbare Entscheidungsvorlage fehlen noch ein paar Angaben.'
                : 'Die Projektlage ist bereits verwertbar. Für eine stärkere Steuerung könnten diese Punkte noch klären:'}
            </p>
          </div>
        </div>
        <Badge variant={isLowConfidence ? 'amber' : 'violet'}>
          {isLowConfidence ? 'Kontext ergänzbar' : 'Optimierbar'}
        </Badge>
      </div>

      {/* KI-generierte Kontextfragen */}
      <div className="space-y-3 mb-6">
        {questions.map((question, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="flex items-start gap-3 p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:border-violet-500/30 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <span className="text-zinc-200">{question}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-sm text-zinc-500">
          {missingContext.length} offene{missingContext.length === 1 ? 'r Punkt' : ' Punkte'}
        </span>
        <Button onClick={onRefineClick} variant="primary">
          <Lightbulb className="w-4 h-4" />
          Kontext ergänzen
        </Button>
      </div>
    </motion.section>
  )
}
