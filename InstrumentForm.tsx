import React, { useState, useRef } from 'react';
import { Subject, GradeLevel } from '../types';
import { SUBJECTS_LIST, GRADE_LEVELS_LIST } from '../constants';
import { AnalyzeIcon, SpinnerIcon, UploadIcon, TrashIcon } from './icons';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';
}

interface InstrumentFormProps {
  onSubmit: (text: string, subject: Subject, grade: GradeLevel, title: string) => void;
  isLoading: boolean;
}

const InstrumentForm: React.FC<InstrumentFormProps> = ({ onSubmit, isLoading }) => {
  const [instrumentText, setInstrumentText] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | ''>('');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | ''>('');
  const [instrumentTitle, setInstrumentTitle] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string, type: string } | null>(null);
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tokenizedText = await page.getTextContent();
      textContent += tokenizedText.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return textContent;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileInfo({ name: file.name, type: file.type });
      setFormError(null);
      setFileMessage(null);
      setInstrumentText('');
      setIsFileProcessing(true);

      try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = await file.text();
          setInstrumentText(text);
          setFileMessage(`Contenido de '${file.name}' cargado.`);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const text = await extractTextFromPdf(file);
          setInstrumentText(text);
          setFileMessage(`Texto extraído de PDF '${file.name}'. Revise y edite si es necesario.`);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
          const text = await extractTextFromDocx(file);
          setInstrumentText(text);
          setFileMessage(`Texto extraído de DOCX '${file.name}'. Revise y edite si es necesario.`);
        } else if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
          setInstrumentText('');
          setFileMessage(`Archivo .doc seleccionado: '${file.name}'. La extracción automática de .doc no es compatible. Por favor, copie y pegue el contenido del documento en el área de texto.`);
          setFormError("Para archivos .doc, copie y pegue el contenido manualmente.");
        } else {
          setInstrumentText('');
          setFileMessage(`Archivo '${file.name}' seleccionado. Tipo de archivo no soportado para extracción automática. Por favor, use PDF, DOCX, TXT o copie y pegue el contenido.`);
          setFormError("Tipo de archivo no compatible para extracción directa. Considere convertir a PDF, DOCX, TXT o pegar el texto manualmente.");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setInstrumentText('');
        const errorMsg = error instanceof Error ? error.message : "Error desconocido";
        setFileMessage(`Error al procesar '${file.name}': ${errorMsg}. Intente copiar y pegar el contenido.`);
        setFormError(`No se pudo extraer texto del archivo. ${errorMsg}. Puede copiar y pegar el contenido manualmente.`);
      } finally {
        setIsFileProcessing(false);
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstrumentText(e.target.value);
  };

  const clearFileSelection = () => {
    setFileInfo(null);
    setFileMessage(null);
    setInstrumentText('');
    setFormError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!instrumentText.trim()) {
      setFormError("El texto del instrumento no puede estar vacío. Si subió un archivo, asegúrese de que se haya procesado correctamente o pegue el contenido manualmente.");
      return;
    }
    if (!instrumentTitle.trim()) {
      setFormError("El título del instrumento no puede estar vacío.");
      return;
    }
    if (!selectedSubject) {
      setFormError("Debe seleccionar una asignatura.");
      return;
    }
    if (!selectedGrade) {
      setFormError("Debe seleccionar un nivel.");
      return;
    }
    onSubmit(instrumentText, selectedSubject, selectedGrade, instrumentTitle);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white shadow-xl rounded-lg">
      <div>
        <label htmlFor="instrumentTitle" className="block text-sm font-medium text-slate-700 mb-1">
          Título del Instrumento
        </label>
        <input
          type="text"
          id="instrumentTitle"
          value={instrumentTitle}
          onChange={(e) => setInstrumentTitle(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Ej: Prueba de Matemática Unidad 1"
          maxLength={100}
          aria-required="true"
        />
      </div>

      {/* File Upload Section */}
      <div className="space-y-2">
        <label htmlFor="fileUpload" className="block text-sm font-medium text-slate-700">
          Cargar Archivo (Recomendado: PDF, DOCX, TXT)
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            id="fileUpload"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.txt,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
            disabled={isFileProcessing || isLoading}
            aria-describedby="fileProcessingMessage"
          />
        </div>
        {fileInfo && (
          <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-md flex justify-between items-center">
            <span>Archivo: <span className="font-semibold">{fileInfo.name}</span> ({fileInfo.type})</span>
            <button 
              type="button" 
              onClick={clearFileSelection} 
              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 disabled:opacity-50"
              title="Quitar archivo"
              disabled={isFileProcessing || isLoading}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        {isFileProcessing && (
          <div id="fileProcessingMessage" className="mt-1 text-sm text-indigo-600 flex items-center">
            <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" /> 
            Procesando archivo...
          </div>
        )}
        {fileMessage && !isFileProcessing && (
          <p 
            id="fileProcessingMessage"
            className={`mt-1 text-xs p-2 rounded-md ${
              fileMessage.includes("Error") || fileMessage.includes("no es compatible") || fileMessage.includes("copie y pegue") 
              ? "text-amber-700 bg-amber-50" 
              : "text-green-700 bg-green-50"
            }`}
            role="status"
          >
            {fileMessage}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="instrumentText" className="block text-sm font-medium text-slate-700 mb-1">
          Texto del Instrumento de Evaluación (Extraído del archivo o pegado manualmente)
        </label>
        <textarea
          id="instrumentText"
          rows={10}
          value={instrumentText}
          onChange={handleTextareaChange}
          className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-50"
          placeholder="El contenido del archivo procesado aparecerá aquí. También puede pegar texto directamente."
          disabled={isFileProcessing || isLoading}
          aria-required="true"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
            Asignatura
          </label>
          <select
            id="subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white disabled:bg-slate-50"
            disabled={isFileProcessing || isLoading}
            aria-required="true"
          >
            <option value="" disabled>Seleccione una asignatura</option>
            {SUBJECTS_LIST.map((subject: Subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-1">
            Nivel
          </label>
          <select
            id="grade"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white disabled:bg-slate-50"
            disabled={isFileProcessing || isLoading}
            aria-required="true"
          >
            <option value="" disabled>Seleccione un nivel</option>
            {GRADE_LEVELS_LIST.map((grade: GradeLevel) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
      </div>

      {formError && <p role="alert" className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading || isFileProcessing}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400"
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
            Analizando con IA...
          </>
        ) : isFileProcessing ? (
          <>
            <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
            Procesando archivo...
          </>
        ) : (
          <>
            <AnalyzeIcon className="w-5 h-5 mr-2" />
            Analizar Instrumento
          </>
        )}
      </button>
    </form>
  );
};

export default InstrumentForm;
