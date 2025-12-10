import React, { useState, useEffect } from 'react';
import TransformersService from '../services/transformersService';
import { DiagnosticResult, ModelStatus } from '../types';

interface DiagnosticPanelProps {
  onModelReady: () => void;
}

const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ onModelReady }) => {
  const [logs, setLogs] = useState<DiagnosticResult[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatus>(ModelStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);

  const addLog = (message: string, status: 'pending' | 'success' | 'error', step: string, duration?: number) => {
    setLogs(prev => [...prev, { message, status, step, duration }]);
  };

  const runDiagnostics = async () => {
    setLogs([]);
    setModelStatus(ModelStatus.LOADING);
    setProgress(0);

    // Step 1: Environment Check
    const startEnv = performance.now();
    addLog("Verificando entorno del navegador...", "pending", "env");
    
    const info = TransformersService.getEngineInfo();
    const hasWebAssembly = typeof WebAssembly === 'object';
    const threads = navigator.hardwareConcurrency;

    await new Promise(r => setTimeout(r, 600)); // Simulate check time for UX
    
    addLog(`Entorno verificado: ${threads} Cores, WASM: ${hasWebAssembly ? 'OK' : 'No detectado'}`, "success", "env", performance.now() - startEnv);

    // Step 2: Model Loading
    addLog("Cargando modelo (DistilBERT SST-2)...", "pending", "model");
    
    try {
      const startModel = performance.now();
      await TransformersService.loadModel((data: any) => {
        if (data.status === 'progress') {
           setProgress(data.progress || 0);
        }
      });
      
      const endModel = performance.now();
      addLog(`Modelo cargado y cacheado.`, "success", "model", endModel - startModel);
      setProgress(100);

      // Step 3: Inference Test
      addLog("Ejecutando prueba de inferencia (Warm-up)...", "pending", "inference");
      const startInf = performance.now();
      await TransformersService.analyzeSentiment("Diagnostic warm up");
      const endInf = performance.now();
      
      addLog("Inferencia exitosa.", "success", "inference", endInf - startInf);
      
      setModelStatus(ModelStatus.READY);
      onModelReady();

    } catch (error) {
      console.error(error);
      addLog("Fallo en la carga del modelo o inferencia.", "error", "error");
      setModelStatus(ModelStatus.ERROR);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Módulo de Diagnóstico
        </h2>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          modelStatus === ModelStatus.READY ? 'bg-green-500/20 text-green-400' :
          modelStatus === ModelStatus.ERROR ? 'bg-red-500/20 text-red-400' :
          modelStatus === ModelStatus.LOADING ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-slate-700 text-slate-400'
        }`}>
          {modelStatus}
        </span>
      </div>

      <div className="space-y-3 mb-6 min-h-[160px]">
        {logs.length === 0 && modelStatus === ModelStatus.IDLE && (
           <p className="text-slate-400 text-sm italic">Sistema en espera. Inicie el diagnóstico para cargar los modelos.</p>
        )}
        {logs.map((log, idx) => (
          <div key={idx} className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-3 ${
              log.status === 'success' ? 'bg-green-400' :
              log.status === 'error' ? 'bg-red-500' : 'bg-yellow-400 animate-pulse'
            }`} />
            <span className="text-slate-300 flex-1">{log.message}</span>
            {log.duration && <span className="text-slate-500 font-mono text-xs">{log.duration.toFixed(0)}ms</span>}
          </div>
        ))}
        {modelStatus === ModelStatus.LOADING && (
           <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
             <div 
               className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
               style={{ width: `${progress}%` }} 
             />
           </div>
        )}
      </div>

      <button
        onClick={runDiagnostics}
        disabled={modelStatus === ModelStatus.LOADING || modelStatus === ModelStatus.READY}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          modelStatus === ModelStatus.READY 
            ? 'bg-green-600 text-white cursor-default opacity-50' 
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {modelStatus === ModelStatus.READY ? 'Sistema Listo' : modelStatus === ModelStatus.LOADING ? 'Ejecutando...' : 'Iniciar Diagnóstico'}
      </button>
    </div>
  );
};

export default DiagnosticPanel;