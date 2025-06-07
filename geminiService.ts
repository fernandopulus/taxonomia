
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RawAnalysisItem, AnalysisItem, BloomLevel } from '../types';
import { BLOOM_LEVELS_LIST } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please set the API_KEY environment variable.");
  // Potentially throw an error or handle this state in the UI
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion, assuming it's handled

const isValidBloomLevel = (level: string): level is BloomLevel => {
  return BLOOM_LEVELS_LIST.includes(level as BloomLevel);
};

export const analyzeInstrumentText = async (text: string): Promise<AnalysisItem[]> => {
  if (!API_KEY) throw new Error("API key is missing. Cannot call Gemini API.");
  
  const prompt = `
Eres un experto en pedagogía y la Taxonomía de Bloom. Tu tarea es analizar el siguiente instrumento de evaluación.
El instrumento puede contener múltiples preguntas, ítems, o actividades.
Debes identificar cada pregunta o ítem individualmente.
Para CADA pregunta o ítem identificado, clasifícalo según UNO de los siguientes niveles de la Taxonomía de Bloom: "${BloomLevel.RECORDAR}", "${BloomLevel.COMPRENDER}", "${BloomLevel.APLICAR}", "${BloomLevel.ANALIZAR}", "${BloomLevel.EVALUAR}", "${BloomLevel.CREAR}".
Es crucial que el valor de "bloom_level" sea EXACTAMENTE uno de esos seis términos.
Devuelve tus hallazgos como un array de objetos JSON. Cada objeto en el array debe representar un ítem analizado y debe tener las siguientes dos claves:
1. "item_text": una cadena de texto que contenga el texto completo de la pregunta o ítem. Trata de extraer el texto puro de la pregunta, omitiendo numeración o viñetas (ej. "1.", "a)") si es posible.
2. "bloom_level": una cadena de texto que indique el nivel de Bloom asignado (e.g., "${BloomLevel.RECORDAR}", "${BloomLevel.APLICAR}").

Si alguna parte del texto no constituye una pregunta o ítem evaluable claro (por ejemplo, instrucciones generales, encabezados que no son parte de una pregunta), omítela de tu análisis y no la incluyas en el array JSON de salida.

Instrumento de Evaluación:
---
${text}
---

Formato de Salida Esperado (Array JSON):
[
  { "item_text": "Define el concepto de democracia.", "bloom_level": "${BloomLevel.RECORDAR}" },
  { "item_text": "Compara y contrasta los sistemas presidencialista y parlamentario.", "bloom_level": "${BloomLevel.ANALIZAR}" },
  { "item_text": "Diseña una campaña para promover la participación ciudadana en tu comunidad.", "bloom_level": "${BloomLevel.CREAR}" }
]
Asegúrate de que la salida sea un JSON válido. Si no se encuentran ítems evaluables, devuelve un array vacío [].
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2, // Lower temperature for more deterministic classification
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^\`\`\`(\w*)?\s*\n?(.*?)\n?\s*\`\`\`$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const rawItems: RawAnalysisItem[] = JSON.parse(jsonStr);
    
    return rawItems
      .filter(item => item.item_text && item.bloom_level) // Ensure essential fields are present
      .map((item, index) => {
        if (isValidBloomLevel(item.bloom_level)) {
          return {
            id: `item-${Date.now()}-${index}`,
            item_text: item.item_text,
            bloom_level: item.bloom_level as BloomLevel,
          };
        }
        console.warn(`Invalid Bloom level received: ${item.bloom_level} for item: ${item.item_text}. Defaulting to Recordar.`);
        return { // Default or skip invalid items
            id: `item-${Date.now()}-${index}`,
            item_text: item.item_text,
            bloom_level: BloomLevel.RECORDAR, // Defaulting, or could be filtered out
          };
      })
      .filter(item => item !== null) as AnalysisItem[];

  } catch (error) {
    console.error("Error analyzing instrument text with Gemini:", error);
    let errorMessage = "Error al analizar el instrumento con IA.";
    if (error instanceof Error) {
        errorMessage += ` Detalles: ${error.message}`;
    }
    // Check if the error is from Gemini API about unsafe content
    if (error && typeof error === 'object' && 'message' in error && (error as any).message.includes('SAFETY')) {
        errorMessage = "El contenido del instrumento fue bloqueado por razones de seguridad por la IA. Por favor, revisa el texto e inténtalo de nuevo.";
    }
    throw new Error(errorMessage);
  }
};

export const generateTextualSummary = async (items: AnalysisItem[]): Promise<string> => {
  if (!API_KEY) throw new Error("API key is missing. Cannot call Gemini API.");
  if (items.length === 0) {
    return "No se encontraron ítems analizables para generar un resumen.";
  }
  
  const analysisDataSummary = items.map(item => ({
    item: item.item_text.substring(0, 50) + (item.item_text.length > 50 ? '...' : ''), // Truncate for prompt brevity
    level: item.bloom_level
  }));

  const prompt = `
Eres un experto en análisis pedagógico. Basado en el siguiente análisis de un instrumento de evaluación según la Taxonomía de Bloom, genera un resumen conciso en español (2-4 frases) sobre los hallazgos clave y el predominio de habilidades. Indica qué niveles son los más frecuentes y cuáles podrían necesitar más representación.

Análisis (resumen de ítems y niveles):
${JSON.stringify(analysisDataSummary, null, 2)}

Ejemplo de resumen:
"Este instrumento se centra principalmente en habilidades de '${BloomLevel.RECORDAR}' y '${BloomLevel.COMPRENDER}'. Se observa una oportunidad para incorporar más ítems que evalúen niveles superiores como '${BloomLevel.ANALIZAR}' y '${BloomLevel.CREAR}' para fomentar un pensamiento más complejo."

Por favor, genera el resumen para los datos proporcionados.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating textual summary with Gemini:", error);
    throw new Error("Error al generar el resumen textual con IA.");
  }
};
