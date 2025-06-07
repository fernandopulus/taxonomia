import React, { useState, useEffect } from 'react';
import { Subject, GradeLevel, InstrumentAnalysisData, AnalysisItem } from './types';
import { analyzeInstrumentText, generateTextualSummary } from './services/geminiService';
import InstrumentForm from './components/InstrumentForm';
import AnalysisView from './components/AnalysisView';
import HistoryView from './components/HistoryView';
import useLocalStorage from './hooks/useLocalStorage';
import { AlertTriangleIcon, AnalyzeIcon, HistoryIcon, PlusCircleIcon } from './components/icons';
import { app as firebaseApp, analytics as firebaseAnalytics } from './firebase-config'; // Import to initialize Firebase

type AppView = 'form' | 'analysis_detail' | 'history';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('form');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [allAnalyses, setAllAnalyses] = useLocalStorage<InstrumentAnalysisData[]>('bloomAnalyses', []);
  const [currentAnalysis, setCurrentAnalysis] = useState<InstrumentAnalysisData | null>(null);

  // Effect to show form if no analyses exist or if explicitly navigated
  useEffect(() => {
    if (allAnalyses.length === 0) {
      setCurrentView('form');
    } else if (!currentAnalysis && currentView === 'analysis_detail') {
      // If trying to view details but no current analysis, switch to history or form
      setCurrentView('history');
    }
    // Log Firebase app and analytics instance to confirm initialization (optional)
    // console.log('Firebase App initialized:', firebaseApp);
    // console.log('Firebase Analytics instance:', firebaseAnalytics);
  }, [allAnalyses, currentAnalysis, currentView]);


  const handleFormSubmit = async (text: string, subject: Subject, grade: GradeLevel, title: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const analyzedItems: AnalysisItem[] = await analyzeInstrumentText(text);
      if (analyzedItems.length === 0 && !text.trim()) {
         setError("El texto del instrumento está vacío. No se pudo analizar.");
         setIsLoading(false);
         return;
      }
      if (analyzedItems.length === 0 && text.trim()) {
         setError("La IA no pudo identificar ítems evaluables en el texto proporcionado. Por favor, revise el formato o contenido del instrumento.");
         // We might still want to save it, or let the user decide. For now, we stop.
         // To allow saving "empty" analyses, one could remove this early return.
         setIsLoading(false);
         return;
      }
      const textualSummary = await generateTextualSummary(analyzedItems);

      const newAnalysis: InstrumentAnalysisData = {
        id: `analysis-${Date.now()}`,
        instrumentTitle: title,
        subject,
        gradeLevel: grade,
        items: analyzedItems,
        textualSummary,
        analysisDate: new Date().toISOString(),
        originalDocumentText: text,
      };

      setCurrentAnalysis(newAnalysis);
      setAllAnalyses(prevAnalyses => [newAnalysis, ...prevAnalyses]);
      setCurrentView('analysis_detail');

    } catch (err: any) {
      console.error("Error during analysis submission:", err);
      setError(err.message || 'Ocurrió un error desconocido durante el análisis.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnalysisFromHistory = (analysis: InstrumentAnalysisData) => {
    setCurrentAnalysis(analysis);
    setCurrentView('analysis_detail');
  };

  const handleDeleteAnalysis = (id: string) => {
    setAllAnalyses(prev => prev.filter(a => a.id !== id));
    if (currentAnalysis && currentAnalysis.id === id) {
      setCurrentAnalysis(null);
      setCurrentView('history'); // Or 'form' if history becomes empty
    }
  };
  
  // IMPORTANT: Gemini API key comes from process.env.API_KEY as per guidelines.
  // Your build system (e.g., Vite with `define` config) needs to handle this.
  const API_KEY_MISSING = !process.env.API_KEY;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Analizador de Instrumentos (Taxonomía de Bloom)</h1>
          <p className="text-sm text-indigo-200 mt-1 sm:mt-0">Liceo Industrial de Recoleta</p>
        </div>
      </header>

      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center space-x-2 sm:space-x-4 py-3">
          <button
            onClick={() => { setCurrentView('form'); setCurrentAnalysis(null); setError(null); }}
            disabled={API_KEY_MISSING}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md flex items-center gap-2 transition-colors
                        ${currentView === 'form' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'}
                        ${API_KEY_MISSING ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <PlusCircleIcon className="w-5 h-5"/> Nuevo Análisis
          </button>
          <button
            onClick={() => setCurrentView('history')}
            disabled={allAnalyses.length === 0 || API_KEY_MISSING}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md flex items-center gap-2 transition-colors
                        ${currentView === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'}
                        ${(allAnalyses.length === 0 || API_KEY_MISSING) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <HistoryIcon className="w-5 h-5"/> Historial y Consolidados
          </button>
          {currentAnalysis && currentView !== 'analysis_detail' && (
            <button
              onClick={() => setCurrentView('analysis_detail')}
              disabled={API_KEY_MISSING}
              className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md flex items-center gap-2 transition-colors
                          text-slate-600 hover:bg-indigo-100 hover:text-indigo-700
                          ${API_KEY_MISSING ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <AnalyzeIcon className="w-5 h-5"/> Ver Último Análisis
            </button>
          )}
        </div>
      </nav>
      
      {API_KEY_MISSING && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div role="alert" className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                <AlertTriangleIcon className="h-6 w-6 mr-3 text-red-600" />
                <span className="font-semibold">Configuración Requerida:</span> La clave API para el servicio de IA (Gemini) no está configurada. La aplicación no funcionará correctamente.
            </div>
        </div>
      )}

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !API_KEY_MISSING && (
          <div role="alert" className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-start">
            <AlertTriangleIcon className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error en el Análisis</p>
              <p className="text-sm">{error}</p>
            </div>
             <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-2xl leading-none">&times;</button>
          </div>
        )}

        {!API_KEY_MISSING && currentView === 'form' && (
          <InstrumentForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        )}
        {!API_KEY_MISSING && currentView === 'analysis_detail' && currentAnalysis && (
          <AnalysisView analysis={currentAnalysis} onDelete={handleDeleteAnalysis} />
        )}
        {!API_KEY_MISSING && currentView === 'history' && (
          <HistoryView 
            analyses={allAnalyses} 
            onSelectAnalysis={selectAnalysisFromHistory} 
            onDeleteAnalysis={handleDeleteAnalysis}
          />
        )}
      </main>

      <footer className="bg-slate-800 text-slate-300 text-center py-6 mt-12">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Liceo Industrial de Recoleta. Herramienta de análisis pedagógico.</p>
          <p className="text-xs mt-1">Desarrollado para apoyar la mejora continua de la enseñanza.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;