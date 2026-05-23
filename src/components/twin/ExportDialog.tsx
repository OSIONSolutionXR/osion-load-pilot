/**
 * OSION Load Pilot - Export Dialog
 * Export-Dialog mit Format-Auswahl, Vorschau und Download
 */

import { useState, useCallback } from 'react'
import { 
  Download, 
  FileText, 
  Code, 
  Share2, 
  Check, 
  X,
  Copy,
  FileDown,
  Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'
import { 
  type ExportOptions,
  generateProjectReport, 
  generateShareLink,
  downloadFile,
  copyToClipboard,
  generatePreview
} from '../../services/exportService'

// ============================================================================
// INTERFACE
// ============================================================================

interface ExportDialogProps {
  twin: StoredProjectTwinV2
  isOpen: boolean
  onClose: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExportDialog({ twin, isOpen, onClose }: ExportDialogProps) {
  // State
  const [format, setFormat] = useState<ExportOptions['format']>('pdf')
  const [sections, setSections] = useState<ExportOptions['sections']>([
    'summary', 
    'measures', 
    'risks'
  ])
  const [includeAIActions, setIncludeAIActions] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Format-Optionen
  const formatOptions: { id: ExportOptions['format']; label: string; icon: typeof FileText; description: string }[] = [
    { id: 'pdf', label: 'PDF', icon: FileText, description: 'Professioneller Bericht zum Drucken/Teilen' },
    { id: 'json', label: 'JSON', icon: Code, description: 'Vollständige Daten für Import/Backup' },
    { id: 'markdown', label: 'Markdown', icon: FileDown, description: 'Lesbarer Text für GitHub/Notion' }
  ]
  
  // Section-Optionen
  const sectionOptions: { id: ExportOptions['sections'][number]; label: string; description: string }[] = [
    { id: 'summary', label: 'Zusammenfassung', description: 'Projektstatus und Fortschritt' },
    { id: 'measures', label: 'Maßnahmen', description: 'Alle Maßnahmen mit Details' },
    { id: 'scenarios', label: 'Simulationen', description: 'Szenarien und Ergebnisse' },
    { id: 'risks', label: 'Risiken & Chancen', description: 'Identifizierte Risiken' },
    { id: 'activity', label: 'Aktivität', description: 'Projektaktivität und Historie' }
  ]
  
  // Handlers
  const toggleSection = useCallback((section: ExportOptions['sections'][number]) => {
    setSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }, [])
  
  const handleExport = async () => {
    if (sections.length === 0) {
      setError('Bitte mindestens einen Abschnitt auswählen')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const options: ExportOptions = {
        format,
        sections,
        includeAIActions
      }
      
      const result = await generateProjectReport(twin, options)
      downloadFile(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export fehlgeschlagen')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleGenerateShareLink = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const link = await generateShareLink(twin)
      setShareLink(link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link-Generierung fehlgeschlagen')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleCopyLink = async () => {
    if (!shareLink) return
    
    try {
      await copyToClipboard(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Konnte Link nicht kopieren')
    }
  }
  
  const previewText = generatePreview(twin, { format, sections, includeAIActions })
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-20 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Bericht erstellen
                  </h2>
                  <p className="text-sm text-slate-500">
                    {twin.title || 'Unbenanntes Projekt'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Format wählen
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {formatOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setFormat(option.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        format === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 mb-2 ${
                        format === option.id ? 'text-blue-600' : 'text-slate-500'
                      }`} />
                      <div className={`font-medium ${
                        format === option.id ? 'text-blue-900' : 'text-slate-900'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sections Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Abschnitte auswählen
                </label>
                <div className="space-y-2">
                  {sectionOptions.map(option => (
                    <label
                      key={option.id}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                        sections.includes(option.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                        sections.includes(option.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300'
                      }`}>
                        {sections.includes(option.id) && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={sections.includes(option.id)}
                        onChange={() => toggleSection(option.id)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-500">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* AI Actions Option */}
              <label className="flex items-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                  includeAIActions
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-slate-300'
                }`}>
                  {includeAIActions && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={includeAIActions}
                  onChange={(e) => setIncludeAIActions(e.target.checked)}
                  className="sr-only"
                />
                <div>
                  <div className="font-medium text-slate-900">
                    KI-Aktionen einbeziehen
                  </div>
                  <div className="text-xs text-slate-500">
                    Generierte Lösungen und Arbeitshilfen
                  </div>
                </div>
              </label>
              
              {/* Preview Section */}
              <div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
                </button>
                
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 bg-slate-100 rounded-xl font-mono text-sm text-slate-700 whitespace-pre-wrap overflow-auto max-h-60"
                  >
                    {previewText}
                  </motion.div>
                )}
              </div>
              
              {/* Share Link Section */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Share-Link
                  </span>
                </div>
                
                {!shareLink ? (
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? 'Generiere...' : 'Link generieren'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        copied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-2">
                  Der Link enthält alle Projektdaten im Hash (kein Backend nötig)
                </p>
              </div>
              
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                {sections.length} Abschnitt{sections.length !== 1 ? 'e' : ''} ausgewählt
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Abbrechen
                </button>
                
                <button
                  onClick={handleExport}
                  disabled={isGenerating || sections.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generiere...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Herunterladen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ExportDialog