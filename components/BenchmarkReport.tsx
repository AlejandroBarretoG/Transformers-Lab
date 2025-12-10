import React, { useState } from 'react';
import TransformersService from '../services/transformersService';
import { DeviceType, BenchmarkResult } from '../types';

interface BenchmarkReportProps {
  isReady: boolean;
}

const BenchmarkReport: React.FC<BenchmarkReportProps> = ({ isReady }) => {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  const runFullBenchmark = async () => {
    if (!isReady) return;
    setIsRunning(true);
    setResults([]);

    const devices: DeviceType[] = ['cpu', 'webgl', 'webgpu'];
    const report: BenchmarkResult[] = [];

    // Payload pesado para notar diferencias
    const benchmarkText = "Benchmarking AI in the browser is fascinating. ".repeat(50);

    for (const device of devices) {
      // Verificar soporte antes de intentar para evitar crashes innecesarios
      if (device === 'webgpu' && !TransformersService.isWebGpuSupported()) {
         report.push({ device, time: 0, status: 'error' }); // O marcar como skipped
         continue;
      }
      if (device === 'webgl' && !TransformersService.isWebGlSupported()) {
         report.push({ device, time: 0, status: 'error' });
         continue;
      }

      const isGpu = device !== 'cpu';
      setCurrentStep(`Probando ${device.toUpperCase()}${isGpu ? ' (Descargando modelo FP32...)' : '...'}`);
      
      // Pequeño delay para permitir renderizado de UI
      await new Promise(r => setTimeout(r, 100));

      // Importante: Pasamos texto primero, luego dispositivo según la nueva firma
      const result = await TransformersService.runBenchmark(benchmarkText, device);
      report.push(result);
      setResults([...report]); // Actualización progresiva
    }

    // Restaurar a CPU (WASM) por defecto para uso normal de la app
    setCurrentStep('Restaurando entorno eficiente (CPU/Quantized)...');
    await TransformersService.loadModel({ device: 'cpu', force: true });
    
    setIsRunning(false);
    setCurrentStep('');
  };

  const getSpeedup = (res: BenchmarkResult) => {
    const cpuRes = results.find(r => r.device === 'cpu');
    if (!cpuRes || cpuRes.status === 'error' || res.status === 'error' || res.time === 0) return '-';
    if (res.device === 'cpu') return '1.0x (Ref)';
    
    const speedup = cpuRes.time / res.time;
    // Si el speedup es < 1 (más lento), mostrar en rojo/naranja
    return `${speedup.toFixed(2)}x`;
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg ${!isReady ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Reporte de Rendimiento
        </h2>
        {isRunning && <span className="text-xs text-yellow-400 animate-pulse font-mono">{currentStep}</span>}
      </div>

      <p className="text-sm text-slate-400 mb-6">
        Ejecuta una comparativa secuencial. <br/>
        <span className="text-xs text-slate-500 italic">Nota: Las pruebas de GPU descargarán la versión no cuantizada (FP32) del modelo para garantizar que se usen los shaders de hardware y evitar la emulación en CPU.</span>
      </p>

      <div className="overflow-hidden rounded-lg border border-slate-700 mb-6 bg-slate-900/50">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <th className="px-4 py-3 text-left">Tecnología</th>
              <th className="px-4 py-3 text-left">Modelo</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Tiempo</th>
              <th className="px-4 py-3 text-right">Aceleración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {['cpu', 'webgl', 'webgpu'].map((deviceStr) => {
              const device = deviceStr as DeviceType;
              const res = results.find(r => r.device === device);
              const label = device === 'cpu' ? 'CPU (WASM)' : device === 'webgpu' ? 'WebGPU' : 'WebGL';
              const modelType = device === 'cpu' ? 'Quantized (Int8)' : 'Full (FP32)';
              
              return (
                <tr key={device} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-200">{label}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{modelType}</td>
                  <td className="px-4 py-3 text-center">
                    {res ? (
                        res.status === 'success' ? 
                        <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">OK</span> : 
                        <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">Error/N/A</span>
                    ) : (
                        <span className="text-xs text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-slate-300">
                    {res && res.status === 'success' ? `${res.time.toFixed(1)} ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono font-bold">
                    {res ? (
                        <span className={getSpeedup(res).includes('1.0') ? 'text-slate-400' : 'text-blue-400'}>
                            {getSpeedup(res)}
                        </span>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={runFullBenchmark}
        disabled={isRunning}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex justify-center items-center gap-2"
      >
        {isRunning ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Corriendo Benchmark...
          </>
        ) : (
          'Iniciar Benchmark Completo'
        )}
      </button>
    </div>
  );
};

export default BenchmarkReport;