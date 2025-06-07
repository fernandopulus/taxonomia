
import React, { useState } from 'react';
import { InstrumentAnalysisData, BloomLevel } from '../types';
import BloomChart from './BloomChart';
import { BLOOM_LEVEL_COLORS } from '../constants';
import { DocumentTextIcon, ChartBarIcon, ChevronDownIcon, ChevronUpIcon, DownloadIcon, TrashIcon } from './icons';

interface AnalysisViewProps {
  analysis: InstrumentAnalysisData;
  onDelete?: (id: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onDelete }) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleDownloadJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(analysis, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${analysis.instrumentTitle.replace(/\s+/g, '_')}_analisis.json`;
    link.click();
  };
  
  const countPerLevel: Record<BloomLevel, number> = analysis.items.reduce((acc, item) => {
    acc[item.bloom_level] = (acc[item.bloom_level] || 0) + 1;
    return acc;
  }, {} as Record<BloomLevel, number>);


  return (
    <div className="bg-white shadow-xl rounded-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 mb-4">
        <div>
            <h2 className="text-2xl font-bold text-indigo-700">{analysis.instrumentTitle}</h2>
            <p className="text-sm text-slate-600">
            Asignatura: <span className="font-semibold">{analysis.subject}</span> | 
            Nivel: <span className="font-semibold">{analysis.gradeLevel}</span>
            </p>
            <p className="text-xs text-slate-500">Analizado el: {new Date(analysis.analysisDate).toLocaleDateString('es-CL')}</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={handleDownloadJson}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-md shadow-sm flex items-center gap-2"
                title="Descargar datos del análisis en formato JSON"
            >
                <DownloadIcon className="w-4 h-4" /> JSON
            </button>
            {onDelete && (
                 <button
                    onClick={() => onDelete(analysis.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-md shadow-sm flex items-center gap-1"
                    title="Eliminar este análisis"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-slate-50 rounded-md shadow">
            <h3 className="text-lg font-semibold text-slate-700 mb-2 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Resumen Textual del Análisis
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{analysis.textualSummary}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-md shadow">
             <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Distribución de Habilidades (Taxonomía de Bloom)
            </h3>
            <BloomChart items={analysis.items} />
          </div>
        </div>

        <div className="lg:col-span-1 p-4 bg-slate-50 rounded-md shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Ítems Analizados ({analysis.items.length})</h3>
          {analysis.items.length > 0 ? (
            <ul className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {analysis.items.map((item) => (
                <li key={item.id} className="p-3 bg-white border border-slate-200 rounded-md shadow-sm">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleItemExpansion(item.id)}>
                    <p className="text-sm font-medium text-slate-700 flex-1 mr-2">
                      {expandedItems[item.id] || item.item_text.length <= 60 ? item.item_text : `${item.item_text.substring(0, 60)}...`}
                    </p>
                    {item.item_text.length > 60 && (
                        expandedItems[item.id] ? <ChevronUpIcon className="w-4 h-4 text-slate-500" /> : <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  { (expandedItems[item.id] && item.item_text.length > 60) && (
                    <p className="mt-1 text-sm text-slate-600">{item.item_text}</p>
                  )}
                  <span
                    style={{ backgroundColor: BLOOM_LEVEL_COLORS[item.bloom_level] }}
                    className="mt-1 inline-block px-2 py-0.5 text-xs font-semibold text-white rounded-full"
                  >
                    {item.bloom_level}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No se identificaron ítems en este instrumento.</p>
          )}
        </div>
      </div>
      
      <details className="mt-4 bg-slate-50 p-3 rounded shadow">
        <summary className="text-sm font-medium text-slate-600 cursor-pointer hover:text-indigo-600">Ver texto original del instrumento</summary>
        <div className="mt-2 p-2 border border-slate-200 bg-white rounded max-h-60 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-xs text-slate-700">{analysis.originalDocumentText}</pre>
        </div>
      </details>

    </div>
  );
};

export default AnalysisView;
