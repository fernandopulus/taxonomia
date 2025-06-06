import React, { useState, useEffect, useCallback } from 'react';
import { Subject, GradeLevel, InstrumentAnalysisData, AnalysisItem } from './types';
import { analyzeInstrumentText, generateTextualSummary } from './services/geminiService';
import { fetchAllAnalyses, saveAnalysis, removeAnalysis } from './firebase/firebase';
import InstrumentForm from './components/InstrumentForm';
import AnalysisView from './components/AnalysisView';
import HistoryView from './components/HistoryView';
import { AlertTriangleIcon, AnalyzeIcon, HistoryIcon, PlusCircleIcon, SpinnerIcon as LoadingSpinnerIcon } from './components/icons';

type AppView = 'form' | 'analysis_detail' | 'history';

// IMPORTANT SECURITY NOTE FOR GEMINI API KEY:
// This application uses `process.env.API_KEY` in `services/geminiService.ts`.
// If running this application directly in a browser without a build system that
// injects environment variables (like Vite or Create React App), `process.env.API_KEY`
// will be `undefined`. This will cause Gemini API calls to fail.
// FOR PRODUCTION: It is critical *NOT* to expose your Gemini API key in client-side
// code. Use a secure backend (e.g., Firebase Functions) to make calls to the Gemini API.
// The Firebase API key (in firebaseConfig) is for Firebase client services and is safe.

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('form');
  const [isLoading, setIsLoading] = useState<boolean>(false); // For Gemini & Firebase operations
  const [isFetchingAnalyses, setIsFetchingAnalyses] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [allAnalyses, setAllAnalyses] = useState<InstrumentAnalysisData[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<InstrumentAnalysisData | null>(null);

  const API_KEY_MISSING = !process.env.API_KEY; // This check is for Gemini API Key

  const loadAnalyses = useCallback(async () => {
    setIsFetchingAnalyses(true);
    setError(null);
    try {
      const analysesFromDb = await fetchAllAnalyses();
      setAllAnalyses(analysesFromDb);
    } catch (err: any) {
      console.error("Failed to load analyses:", err);
      setError(err.message || "Error al cargar análisis previos desde la base de datos.");
      setAllAnalyses([]); // Ensure empty array on error
    } finally {
      setIsFetchingAnalyses(false);
    }
  }, []); // Empty dependency array: loadAnalyses is stable

  useEffect(() => {
    if (!API_KEY_MISSING) {
        loadAnalyses();
    } else {
        setIsFetchingAnalyses(false);
        setAllAnalyses([]); // Clear analyses if API key is missing
    }
  }, [API_KEY_MISSING, loadAnalyses]);


  useEffect(() => {
    if (isFetchingAnalyses) return; // Wait until fetching is complete

    if (allAnalyses.length === 0) {
      if (currentView !== 'form') setCurrentView('form');
    } else if (currentAnalysis === null && currentView === 'analysis_detail') {
      setCurrentView('history');
    } else if (currentView === 'form' && !isLoading) { 
      // If on form, but analyses exist, and not in middle of another AI operation
      setCurrentView('history');
    }
  }, [allAnalyses, currentAnalysis, currentView, isFetchingAnalyses, isLoading]);


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
         setIsLoading(false);
         return;
      }
      const textualSummary = await generateTextualSummary(analyzedItems);

      const analysisDataToSave: Omit<InstrumentAnalysisData, 'id' | 'analysisDate'> = {
        instrumentTitle: title,
        subject,
        gradeLevel: grade,
        items: analyzedItems,
        textualSummary,
        originalDocumentText: text,
      };
      
      const newAnalysis = await saveAnalysis(analysisDataToSave);

      setCurrentAnalysis(newAnalysis);
      setAllAnalyses(prevAnalyses => [newAnalysis, ...prevAnalyses].sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()));
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

  const handleDeleteAnalysis = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este análisis? Esta acción no se puede deshacer y los datos se borrarán de la base de datos.")) {
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        await removeAnalysis(id);
        setAllAnalyses(prev => prev.filter(a => a.id !== id));
        if (currentAnalysis && currentAnalysis.id === id) {
          setCurrentAnalysis(null);
          setCurrentView('history'); 
        }
    } catch (err: any) {
        console.error("Error deleting analysis:", err);
        setError(err.message || "Error al eliminar el análisis.");
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Analizador de Instrumentos (Taxonomía de Bloom)</h1>
          <p className="text-sm text-blue-200 mt-1 sm:mt-0">Liceo Industrial de Recoleta</p>
        </div>
      </header>

      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center space-x-2 sm:space-x-4 py-3">
          <button
            onClick={() => { setCurrentView('form'); setCurrentAnalysis(null); setError(null); }}
            disabled={API_KEY_MISSING || isLoading}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md flex items-center gap-2 transition-colors
                        ${currentView === 'form' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-100 hover:text-blue-700'}
                        ${(API_KEY_MISSING || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <PlusCircleIcon className="w-5 h-5"/> Nuevo Análisis
          </button>
          <button
            onClick={() => setCurrentView('history')}
            disabled={API_KEY_MISSING || isLoading || (allAnalyses.length === 0 && !isFetchingAnalyses)}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md flex items-center gap-2 transition-colors
                        ${currentView === 'history' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-100 hover:text-blue-700'}
                        ${(API_KEY_MISSING || isLoading || (allAnalyses.length === 0 && !isFetchingAnalyses)) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <HistoryIcon className="w-5 h-5"/> Historial y Consolidados
          </button>
          {currentAnalysis && currentView !== 'analysis_detail' && (
            <button
              onClick={() => setCurrentView('analysis_detail')}
              disabled={API_KEY_MISSING || isLoading}
              className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md flex items-center gap-2 transition-colors
                          text-slate-600 hover:bg-blue-100 hover:text-blue-700
                          ${(API_KEY_MISSING || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <div>
                    <span className="font-semibold">Configuración Requerida para Gemini API:</span> La clave API para el servicio de IA (Gemini) no está configurada (<code>process.env.API_KEY</code> es probablemente undefined). La aplicación no funcionará correctamente.
                    <p className="text-xs mt-1">Consulte las notas en <code>index.html</code> o <code>App.tsx</code> sobre cómo manejar las claves API de forma segura para producción.</p>
                </div>
            </div>
        </div>
      )}

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !API_KEY_MISSING && (
          <div role="alert" className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-start">
            <AlertTriangleIcon className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
             <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-2xl leading-none">&times;</button>
          </div>
        )}

        {isFetchingAnalyses && !API_KEY_MISSING && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                <LoadingSpinnerIcon className="w-12 h-12 mb-4 animate-spin text-blue-600" />
                <p className="text-lg">Cargando análisis previos...</p>
            </div>
        )}

        {!API_KEY_MISSING && !isFetchingAnalyses && currentView === 'form' && (
          <InstrumentForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        )}
        {!API_KEY_MISSING && !isFetchingAnalyses && currentView === 'analysis_detail' && currentAnalysis && (
          <AnalysisView analysis={currentAnalysis} onDelete={handleDeleteAnalysis} />
        )}
        {!API_KEY_MISSING && !isFetchingAnalyses && currentView === 'history' && (
          <HistoryView 
            analyses={allAnalyses} 
            onSelectAnalysis={selectAnalysisFromHistory} 
            onDeleteAnalysis={handleDeleteAnalysis}
          />
        )}
        {!API_KEY_MISSING && !isFetchingAnalyses && currentView === 'history' && allAnalyses.length === 0 && (
             <div className="text-center py-10">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-slate-800">No hay análisis guardados</h3>
                <p className="mt-1 text-sm text-slate-500">
                    Comience creando un nuevo análisis.
                </p>
            </div>
        )}
      </main>

      <footer className="bg-slate-800 text-slate-300 text-center py-6 mt-12">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Liceo Industrial de Recoleta. Herramienta de análisis pedagógico.</p>
          <p className="text-xs mt-1">Datos almacenados en Firebase. Creado para apoyar la mejora continua de la enseñanza.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
