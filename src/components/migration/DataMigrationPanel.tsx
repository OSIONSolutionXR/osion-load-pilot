/**
 * LoadPilot Data Migration Panel
 * 
 * Handles export from localStorage and import to Backend
 * Sprint 1: One-way migration localStorage → Neon Postgres
 */

import { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Save,
  RefreshCw
} from 'lucide-react';

interface MigrationStatus {
  hasLocalData: boolean;
  localProjectCount: number;
  serverProjectCount: number | null;
  migrationCompleted: boolean;
  lastExport: string | null;
}

interface ImportReport {
  success: boolean;
  summary: {
    projectsImported: number;
    measuresImported: number;
    stepsImported: number;
    eventsImported: number;
    totalProcessed: number;
  };
  details: {
    totalTwins: number;
    projectsImported: number;
    errors: string[];
    warnings: string[];
    projectMappings: { legacyId: string; newId: string; title: string }[];
  };
  importedAt: string;
}

export default function DataMigrationPanel() {
  const [status, setStatus] = useState<MigrationStatus>({
    hasLocalData: false,
    localProjectCount: 0,
    serverProjectCount: null,
    migrationCompleted: false,
    lastExport: null
  });
  
  const [exportData, setExportData] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'status'>('export');

  // Check localStorage on mount
  useEffect(() => {
    checkLocalStorage();
    checkServerStatus();
  }, []);

  const checkLocalStorage = () => {
    try {
      const twinsRaw = localStorage.getItem('osion-load-pilot.project-twins.v2');
      const migrationCompleted = localStorage.getItem('osion-load-pilot.migration.completed');
      
      let projectCount = 0;
      if (twinsRaw) {
        const twins = JSON.parse(twinsRaw);
        projectCount = Array.isArray(twins) ? twins.length : 0;
      }

      setStatus(prev => ({
        ...prev,
        hasLocalData: projectCount > 0,
        localProjectCount: projectCount,
        migrationCompleted: migrationCompleted === 'true'
      }));
    } catch (err) {
      console.error('Error checking localStorage:', err);
    }
  };

  const checkServerStatus = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          serverProjectCount: data.projects?.length || 0
        }));
      }
    } catch (err) {
      console.log('Server not ready yet:', err);
    }
  };

  const handleExport = () => {
    try {
      const twinsRaw = localStorage.getItem('osion-load-pilot.project-twins.v2');
      const chatRaw = localStorage.getItem('osion-chat-session.v1');
      
      if (!twinsRaw) {
        setError('Keine localStorage-Daten gefunden');
        return;
      }

      const exportPayload = {
        twins: JSON.parse(twinsRaw),
        chat: chatRaw ? JSON.parse(chatRaw) : null,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      setExportData(exportPayload);
      setStatus(prev => ({ ...prev, lastExport: new Date().toLocaleString('de-DE') }));
      setError(null);
    } catch (err) {
      setError('Fehler beim Export: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const handleImport = async () => {
    if (!exportData) {
      setError('Bitte zuerst Daten exportieren');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportReport(null);

    try {
      const response = await fetch('/api/migration/import-localstorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twins: exportData.twins,
          exportedAt: exportData.exportedAt
        })
      });

      const report = await response.json();
      
      if (!response.ok) {
        throw new Error(report.error || 'Import failed');
      }

      setImportReport(report);
      
      // Mark migration as completed in localStorage (but don't delete!)
      localStorage.setItem('osion-load-pilot.migration.completed', 'true');
      localStorage.setItem('osion-load-pilot.migration.backup', JSON.stringify(exportData));
      
      // Update status
      setStatus(prev => ({
        ...prev,
        migrationCompleted: true,
        serverProjectCount: report.summary.projectsImported
      }));

      // Refresh server status
      await checkServerStatus();

    } catch (err) {
      setError('Import fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsImporting(false);
    }
  };

  const downloadExportJson = () => {
    if (!exportData) return;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loadpilot-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-violet-500" />
            Daten-Migration
          </h1>
          <p className="text-slate-400">
            Sprint 1: localStorage → Neon Postgres Backend
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0B1020] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Save className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">localStorage</h3>
            </div>
            <p className="text-2xl font-bold">{status.localProjectCount}</p>
            <p className="text-sm text-slate-500">Projekte im Browser</p>
          </div>

          <div className="bg-[#0B1020] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-violet-500" />
              <h3 className="font-semibold">Neon Postgres</h3>
            </div>
            <p className="text-2xl font-bold">
              {status.serverProjectCount !== null ? status.serverProjectCount : '?'}
            </p>
            <p className="text-sm text-slate-500">Projekte auf Server</p>
          </div>

          <div className="bg-[#0B1020] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              {status.migrationCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <RefreshCw className="w-5 h-5 text-amber-500" />
              )}
              <h3 className="font-semibold">Status</h3>
            </div>
            <p className="text-lg font-medium">
              {status.migrationCompleted ? 'Abgeschlossen' : 'Ausstehend'}
            </p>
            <p className="text-sm text-slate-500">
              {status.lastExport || 'Noch kein Export'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['export', 'import', 'status'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#0B1020] text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'export' && '1. Export'}
              {tab === 'import' && '2. Import'}
              {tab === 'status' && '3. Status'}
            </button>
          ))}
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="bg-[#0B1020] border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Schritt 1: Daten aus localStorage exportieren
            </h2>
            
            {!status.hasLocalData ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400">
                  Keine localStorage-Daten gefunden. Entweder wurde bereits migriert oder es gibt keine Projekte.
                </p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 mb-4">
                  Exportiere {status.localProjectCount} Projekt(e) aus dem Browser-Speicher.
                  Die Daten werden NICHT gelöscht, sondern als Backup behalten.
                </p>
                
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Daten exportieren
                </button>

                {exportData && (
                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-400">Export erfolgreich</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      {exportData.twins.length} Projekt(e) exportiert
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadExportJson}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                      >
                        JSON herunterladen (Backup)
                      </button>
                      <button
                        onClick={() => setActiveTab('import')}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm"
                      >
                        Weiter zum Import
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="bg-[#0B1020] border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Schritt 2: In Backend importieren
            </h2>
            
            {!exportData ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400">
                  Bitte zuerst im "Export"-Tab die Daten exportieren.
                </p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 mb-4">
                  Importiere {exportData.twins.length} Projekt(e) in die Neon Postgres-Datenbank.
                  Die localStorage-Daten bleiben als Backup erhalten.
                </p>
                
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importiere...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      In Backend importieren
                    </>
                  )}
                </button>

                {importReport && (
                  <div className="mt-6 space-y-4">
                    <div className={`p-4 rounded-lg border ${
                      importReport.success 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        {importReport.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          importReport.success ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {importReport.success ? 'Import erfolgreich' : 'Import mit Fehlern'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-[#070A12] p-3 rounded-lg">
                          <p className="text-2xl font-bold text-violet-400">
                            {importReport.summary.projectsImported}
                          </p>
                          <p className="text-xs text-slate-500">Projekte</p>
                        </div>
                        <div className="bg-[#070A12] p-3 rounded-lg">
                          <p className="text-2xl font-bold text-blue-400">
                            {importReport.summary.measuresImported}
                          </p>
                          <p className="text-xs text-slate-500">Maßnahmen</p>
                        </div>
                        <div className="bg-[#070A12] p-3 rounded-lg">
                          <p className="text-2xl font-bold text-amber-400">
                            {importReport.summary.stepsImported}
                          </p>
                          <p className="text-xs text-slate-500">Prozessschritte</p>
                        </div>
                        <div className="bg-[#070A12] p-3 rounded-lg">
                          <p className="text-2xl font-bold text-emerald-400">
                            {importReport.summary.eventsImported}
                          </p>
                          <p className="text-xs text-slate-500">Events</p>
                        </div>
                      </div>

                      {importReport.details.projectMappings.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Projekt-Mappings</h4>
                          <div className="space-y-1 text-sm">
                            {importReport.details.projectMappings.slice(0, 5).map((m, i) => (
                              <div key={i} className="flex items-center gap-2 text-slate-400">
                                <span className="font-mono text-xs">{m.legacyId.slice(0, 8)}...</span>
                                <ArrowRight className="w-3 h-3" />
                                <span className="font-mono text-xs text-violet-400">{m.newId.slice(0, 8)}...</span>
                                <span className="truncate">{m.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {importReport.details.errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-500/10 rounded-lg">
                          <h4 className="font-medium text-red-400 mb-2">Fehler</h4>
                          <ul className="space-y-1 text-sm text-red-300">
                            {importReport.details.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {importReport.details.warnings.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                          <h4 className="font-medium text-amber-400 mb-2">Warnungen</h4>
                          <ul className="space-y-1 text-sm text-amber-300">
                            {importReport.details.warnings.slice(0, 5).map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveTab('status')}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Zum Status-Tab
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="bg-[#0B1020] border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Migrations-Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#070A12] rounded-lg">
                <span className="text-slate-400">localStorage-Backup</span>
                <span className="text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Erhalten
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#070A12] rounded-lg">
                <span className="text-slate-400">Server-Datenbank</span>
                <span className={status.serverProjectCount !== null && status.serverProjectCount > 0 
                  ? 'text-green-400' 
                  : 'text-slate-500'
                }>
                  {status.serverProjectCount !== null 
                    ? `${status.serverProjectCount} Projekte` 
                    : 'Nicht verbunden'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#070A12] rounded-lg">
                <span className="text-slate-400">Migration abgeschlossen</span>
                <span className={status.migrationCompleted ? 'text-green-400' : 'text-amber-400'}>
                  {status.migrationCompleted ? 'Ja' : 'Nein'}
                </span>
              </div>

              <button
                onClick={checkServerStatus}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Status aktualisieren
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="font-medium text-blue-400 mb-2">Nächste Schritte</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">1.</span>
                  <span>Sobald die Migration abgeschlossen ist, ist Neon Postgres die einzige Source of Truth</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">2.</span>
                  <span>Der KI-Chat und OpenClaw werden später über Context Packs auf die Server-Daten zugreifen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">3.</span>
                  <span>localStorage bleibt als Fallback/Backup erhalten</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
