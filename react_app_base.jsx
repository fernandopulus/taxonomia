// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// src/App.tsx
import React from 'react';

function App() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Analizador de Instrumentos</h1>
      <p className="text-gray-700">Bienvenido a la aplicación basada en la Taxonomía de Bloom.</p>
    </div>
  );
}

export default App;

// index.html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Analizador de Instrumentos</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

// tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}

// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});

// .gitignore
node_modules
/dist
.env

// package.json (actualizado)
{
  "name": "analizador-de-instrumentos-de-evaluacion-taxonomia-bloom",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "cross-env PORT=8080 serve -s dist -l $PORT"
  },
  "dependencies": {
    "@google/genai": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.15.3",
    "pdfjs-dist": "^4.5.136",
    "mammoth": "^1.8.0",
    "firebase": "10.12.4",
    "serve": "^14.2.1"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "typescript": "~5.7.2",
    "vite": "^6.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "cross-env": "^7.0.3"
  }
}
