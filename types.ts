
export enum BloomLevel {
  RECORDAR = "Recordar",
  COMPRENDER = "Comprender",
  APLICAR = "Aplicar",
  ANALIZAR = "Analizar",
  EVALUAR = "Evaluar",
  CREAR = "Crear",
}

export enum Subject {
  LENGUA_LITERATURA = "Lengua y Literatura",
  MATEMATICA = "Matemática",
  CIENCIAS = "Ciencias",
  CIENCIAS_CIUDADANIA = "Ciencias para la ciudadanía",
  HISTORIA = "Historia",
  EDUCACION_CIUDADANA = "Educación Ciudadana",
  FILOSOFIA = "Filosofía",
  INGLES = "Inglés",
  PENSAMIENTO_LOGICO = "Pensamiento Lógico",
  COMPETENCIA_LECTORA = "Competencia Lectora",
  ARTES = "Artes",
  MUSICA = "Música",
  EDUCACION_FISICA = "Educación Física",
  EMPRENDIMIENTO = "Emprendimiento",
  MECANICA_AUTOMOTRIZ = "Mecánica Automotriz",
  MECANICA_INDUSTRIAL = "Mecánica Industrial",
  TECNOLOGIA = "Tecnología",
}

export enum GradeLevel {
  PRIMERO_MEDIO = "1º MEDIO",
  SEGUNDO_MEDIO = "2º MEDIO",
  TERCERO_MEDIO = "3º MEDIO",
  CUARTO_MEDIO = "4º MEDIO",
}

export interface AnalysisItem {
  id: string;
  item_text: string;
  bloom_level: BloomLevel;
}

export interface InstrumentAnalysisData {
  id: string;
  instrumentTitle: string;
  subject: Subject;
  gradeLevel: GradeLevel;
  items: AnalysisItem[];
  textualSummary: string;
  analysisDate: string; // ISO date string
  originalDocumentText: string; 
}

// For API response parsing from Gemini
export interface RawAnalysisItem {
  item_text: string;
  bloom_level: string; // string initially, then validated into BloomLevel
}

export interface ChartDataPoint {
  name: BloomLevel;
  value: number;
  percentage: number;
}
