
import { initializeApp, FirebaseApp } from 'firebase/app'; 
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';

// Firebase configuration using environment variables
// These variables should be defined in your environment (e.g., .env file or CI/CD variables)
// and made available to process.env by your build system.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Analytics and export it
let analyticsInstance: Analytics | undefined;

if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((isSupported) => {
    if (isSupported) {
      analyticsInstance = getAnalytics(app);
      console.log("Firebase Analytics initialized successfully (v9+).");
    } else {
      console.log("Firebase Analytics is not supported in this environment (v9+).");
    }
  }).catch(error => {
    console.error("Error checking/initializing Firebase Analytics (v9+):", error);
  });
}

// App.tsx imports `app` and `analytics`.
// `analyticsInstance` is initialized asynchronously.
// The app currently only logs the analytics instance, so its potential initial undefined state is acceptable.
export { app, analyticsInstance as analytics };

// Ensure you have the following environment variables set in your Firebase/Cloud Build
// environment or your local .env file if using Vite (or other build tools):
// VITE_FIREBASE_API_KEY="YOUR_API_KEY"
// VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
// VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
// VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
// VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
// VITE_FIREBASE_APP_ID="YOUR_APP_ID"
// VITE_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
//
// The Gemini API key (process.env.API_KEY) must be used as specified.
// Your build tool (e.g., Vite, Webpack, Parcel) needs to be configured
// to replace process.env.VITE_FIREBASE_... with the actual values at build time.
// For Cloud Run, these (VITE_FIREBASE_... and API_KEY) should be set as environment variables
// in the Cloud Run service configuration.
