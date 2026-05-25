import { useEffect, useState } from 'react';
import DataMigrationPanel from '../components/migration/DataMigrationPanel';
import { Database, ArrowLeft } from 'lucide-react';

/**
 * Migration Page
 * Standalone page for Sprint 1 data migration
 * Accessible at /migration or via settings
 */

export default function MigrationPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading check
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
        <div className="flex items-center gap-3 text-violet-400">
          <Database className="w-8 h-8 animate-pulse" />
          <span className="text-lg">Lade Migration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12]">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-[#0B1020]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-violet-500" />
            <div>
              <h1 className="font-semibold text-slate-100">LoadPilot Migration</h1>
              <p className="text-xs text-slate-500">Sprint 1: Backend Foundation</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        </div>
      </header>

      {/* Migration Panel */}
      <DataMigrationPanel />
    </div>
  );
}
