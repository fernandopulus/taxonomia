import React, { useState, useMemo } from 'react';
import { InstrumentAnalysisData, Subject, GradeLevel, BloomLevel, AnalysisItem } from '../types';
import { SUBJECTS_LIST, GRADE_LEVELS_LIST } from '../constants';
import BloomChart from './BloomChart';
import { DocumentTextIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface HistoryViewProps {
  analyses: InstrumentAnalysisData[];
  onSelectAnalysis: (analysis: InstrumentAnalysisData) => void;
  onDeleteAnalysis: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ analyses, onSelectAnalysis, onDeleteAnalysis }) => {
  const [filterSubject, setFilterSubject] = useState<Subject | ''>('');
  const [filterGrade, setFilterGrade] = useState<GradeLevel | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showConsolidatedStats, setShowConsolidatedStats] = useState<boolean>(true);

  const filteredAnalyses = useMemo(() => {
    return analyses
      .filter(analysis => 
        (!filterSubject || analysis.subject === filterSubject) &&
        (!filterGrade || analysis.gradeLevel === filterGrade) &&
        (analysis.instrumentTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
         analysis.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
         analysis.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());
  }, [analyses, filterSubject, filterGrade, searchTerm]);

  const consolidatedItems: AnalysisItem[] = useMemo(() => {
    return filteredAnalyses.flatMap(analysis => analysis.items);
  }, [filteredAnalyses]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering onSelectAnalysis when clicking delete
    // Confirmation is handled in App.tsx before calling onDeleteAnalysis
    onDeleteAnalysis(id);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white shadow-xl rounded-lg">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Historial de Análisis y Consolidados</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-md shadow-sm">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-slate-700 mb-1">Buscar por Título/Asignatura/Nivel</label>
          <input
            type="text"
            id="searchTerm"
            placeholder="Escriba para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label htmlFor="filterSubject" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Asignatura</label>
          <select
            id="filterSubject"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value as Subject | '')}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="">Todas las Asignaturas</option>
            {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterGrade" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Nivel</label>
          <select
            id="filterGrade"
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value as GradeLevel | '')}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="">Todos los Niveles</option>
            {GRADE_LEVELS_LIST.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Consolidated Statistics */}
      <div className="mb-6">
        <button 
          onClick={() => setShowConsolidatedStats(!showConsolidatedStats)}
          className="flex items-center justify-between w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 font-semibold"
        >
          Estadísticas Consolidadas (Según Filtros Aplicados)
          {showConsolidatedStats ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
        {showConsolidatedStats && (
          <div className="mt-2 p-4 border border-blue-100 rounded-b-md">
            {consolidatedItems.length > 0 ? (
              <BloomChart items={consolidatedItems} title={`Distribución Global (${consolidatedItems.length} ítems)`} />
            ) : (
              <p className="text-slate-500 text-center py-4">No hay datos para mostrar estadísticas consolidadas con los filtros actuales.</p>
            )}
          </div>
        )}
      </div>
      
      {/* List of Analyses */}
      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">Instrumentos Analizados ({filteredAnalyses.length})</h3>
        {filteredAnalyses.length > 0 ? (
          <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {filteredAnalyses.map(analysis => (
              <li 
                key={analysis.id} 
                onClick={() => onSelectAnalysis(analysis)}
                className="p-4 bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold text-blue-600">{analysis.instrumentTitle}</h4>
                  <p className="text-xs text-slate-500">
                    {analysis.subject} - {analysis.gradeLevel} | {new Date(analysis.analysisDate).toLocaleDateString('es-CL')} | {analysis.items.length} ítems
                  </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => handleDelete(e, analysis.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md"
                        title="Eliminar análisis"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                    <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-center py-4">No se encontraron análisis que coincidan con los filtros.</p>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Nota: Los datos se guardan en la nube (Firebase). 
        Para exportar reportes en PDF/Excel, actualmente puede descargar el JSON de cada análisis individual y procesarlo con herramientas externas.
      </p>
    </div>
  );
};

export default HistoryView;