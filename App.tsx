import React, { useState } from 'react';
import DiagnosticPanel from './components/DiagnosticPanel';
import PracticalDemo from './components/PracticalDemo';
import BenchmarkReport from './components/BenchmarkReport';

const App: React.FC = () => {
  const [isSystemReady, setIsSystemReady] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10 text-center md:text-left border-b border-slate-800 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          Transformers.js Lab
        </h1>
        <p className="text-slate-400 max-w-2xl text-lg">
          Entorno de pruebas y diagnóstico para Inteligencia Artificial en el navegador (Client-side Inference).
          Potenciado por <span className="text-yellow-400 font-mono">@xenova/transformers</span> y <span className="text-blue-400 font-mono">Gemini API</span>.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Diagnostics & System Info */}
        <div className="lg:col-span-5 space-y-6">
          <DiagnosticPanel onModelReady={() => setIsSystemReady(true)} />
          
          {/* Reemplazo del módulo anterior por el nuevo reporte comparativo */}
          <BenchmarkReport isReady={isSystemReady} />

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-3">Información Técnica</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex justify-between border-b border-slate-700 pb-1">
                <span>Biblioteca Core:</span>
                <span className="text-slate-200">Transformers.js v2.x</span>
              </li>
              <li className="flex justify-between border-b border-slate-700 pb-1">
                <span>Modelo Demo:</span>
                <span className="text-slate-200">DistilBERT (SST-2)</span>
              </li>
              <li className="flex justify-between border-b border-slate-700 pb-1">
                <span>Backend Actual:</span>
                {/* Se actualizará dinámicamente en futuros renders si conectamos estado, por ahora estático */}
                <span className="text-slate-200">ONNX Runtime Web</span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Estado API Gemini:</span>
                <span className={process.env.API_KEY ? "text-green-400" : "text-yellow-500"}>
                  {process.env.API_KEY ? "Conectado" : "Sin API Key"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Demo */}
        <div className="lg:col-span-7">
          <PracticalDemo isReady={isSystemReady} />
        </div>
      </main>
      
      <footer className="mt-20 text-center text-slate-600 text-sm">
        <p>Transformers.js Lab &copy; {new Date().getFullYear()} - Creado con React, Tailwind y AI.</p>
      </footer>
    </div>
  );
};

export default App;