
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/analytics';
// import 'firebase/storage'; // Future consideration if Firebase Storage is used

import { InstrumentAnalysisData, Subject, GradeLevel, AnalysisItem, BloomLevel } from '../types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYmpdChFKqpGsTY2BRfvX5OuqyIE6oEgY",
  authDomain: "taxonomia-916be.firebaseapp.com",
  projectId: "taxonomia-916be",
  storageBucket: "taxonomia-916be.firebasestorage.app",
  messagingSenderId: "640289413497",
  appId: "1:640289413497:web:e38c4dba44eff308c2f7a8",
  measurementId: "G-8BL8LLTR13"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db: firebase.firestore.Firestore = firebase.firestore();
const analytics: firebase.analytics.Analytics = firebase.analytics();
// const storage: firebase.storage.Storage = firebase.storage(); // For Firebase Storage if used later

const analysesCollectionRef: firebase.firestore.CollectionReference<firebase.firestore.DocumentData> = db.collection("analyses");

// Interface for the data structure as stored in Firestore
// Notably, analysisDate is a Firestore Timestamp
interface FirestoreAnalysisDoc {
  instrumentTitle: string;
  subject: Subject;
  gradeLevel: GradeLevel;
  items: AnalysisItem[];
  textualSummary: string;
  analysisDate: firebase.firestore.Timestamp; // Changed to v8 Timestamp
  originalDocumentText: string;
}

export const fetchAllAnalyses = async (): Promise<InstrumentAnalysisData[]> => {
  try {
    const q = analysesCollectionRef.orderBy("analysisDate", "desc");
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as FirestoreAnalysisDoc;
      return {
        ...data,
        id: docSnap.id,
        analysisDate: data.analysisDate.toDate().toISOString(), // Convert Timestamp to ISO string
      };
    });
  } catch (error) {
    console.error("Error fetching analyses from Firestore:", error);
    throw new Error("Error al obtener los análisis de la base de datos.");
  }
};

// Data structure for creating a new analysis, omitting id and server-generated analysisDate
type AnalysisCreationData = Omit<InstrumentAnalysisData, 'id' | 'analysisDate'>;

export const saveAnalysis = async (analysisData: AnalysisCreationData): Promise<InstrumentAnalysisData> => {
  try {
    const docToSave = {
      ...analysisData,
      analysisDate: firebase.firestore.FieldValue.serverTimestamp(), // Use v8 server timestamp
    };
    const docRef = await analysesCollectionRef.add(docToSave);
    // Return the saved data with the new ID and an optimistic local date.
    // The actual server-generated date will be fetched on the next full load.
    return {
      ...analysisData,
      id: docRef.id,
      analysisDate: new Date().toISOString(), // Optimistic date for immediate UI update
    };
  } catch (error) {
    console.error("Error saving analysis to Firestore:", error);
    throw new Error("Error al guardar el análisis en la base de datos.");
  }
};

export const removeAnalysis = async (id: string): Promise<void> => {
  try {
    const docRef = analysesCollectionRef.doc(id);
    await docRef.delete();
  } catch (error) {
    console.error("Error deleting analysis from Firestore:", error);
    throw new Error("Error al eliminar el análisis de la base de datos.");
  }
};

// Security Note: The Gemini API key is handled via process.env.API_KEY in geminiService.ts.
// If this is not being replaced by a build process, it will be undefined when deployed.
// For production, it's STRONGLY recommended to call the Gemini API via a secure backend
// (e.g., Firebase Functions) rather than exposing an API key directly in client-side code.
// The Firebase API key in `firebaseConfig` above is for Firebase client services and is safe.
