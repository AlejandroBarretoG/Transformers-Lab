import React, { useState } from 'react';
import TransformersService from '../services/transformersService';
import { DeviceType, BenchmarkResult } from '../types';

interface GpuTestModuleProps {
  isReady: boolean;
}

const GpuTestModule: React.FC<GpuTestModuleProps> = ({ isReady }) => {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('webgpu');

  const webGpuAvailable = TransformersService.isWebGpuSupported();
  const webGlAvailable = TransformersService.isWebGlSupported();

  const handleRunBenchmark = async () => {
    if (!isReady) return;
    setIsRunning(true);
    
    // We remove previous result for this device if exists
    setResults(prev => prev.filter(r => r.device !== selectedDevice));

    // Pass empty string so service uses default text
    const result = await TransformersService.runBenchmark("", selectedDevice);
    
    setResults(prev => {
        const newResults = [...prev, result];
        // Calculate relative speedup if we have both CPU and a GPU result
        const cpuRes = newResults.find(r => r.device === 'cpu');
        const gpuRes = newResults.find(r => r.device !== 'cpu');

        if (cpuRes && gpuRes && cpuRes.time > 0 && gpuRes.time > 0) {
            const speedup = (cpuRes.time / gpuRes.time).toFixed(2) + 'x';
            return newResults.map(r => 
                r.device !== 'cpu' ? { ...r, speedup } : r
            );
        }
        return newResults;
    });
    
    setIsRunning(false);
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg ${!isReady ? 'opacity-50 pointer-events-none' : ''}`}>
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Benchmark Aceleración Hardware
      </h2>
      
      <p className="text-sm text-slate-400 mb-6">
        Compara el rendimiento de inferencia entre CPU (WASM) y GPU (WebGPU/WebGL). 
        La prueba ejecuta un batch de texto largo para estresar el dispositivo.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className={`flex items-center space-x-2 p-3 rounded border ${selectedDevice === 'cpu' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/30'} cursor-pointer hover:bg-slate-700`}>
            <input 
                type="radio" 
                name="device" 
                value="cpu" 
                checked={selectedDevice === 'cpu'}
                onChange={() => setSelectedDevice('cpu')}
                className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-500"
            />
            <span className="text-slate-200 font-medium">CPU (WASM)</span>
        </label>

        <label className={`flex items-center space-x-2 p-3 rounded border ${
            !webGpuAvailable ? 'opacity-50 cursor-not-allowed border-slate-700' :
            selectedDevice === 'webgpu' ? 'border-pink-500 bg-pink-500/10' : 'border-slate-600 bg-slate-700/30'
            } ${webGpuAvailable ? 'cursor-pointer hover:bg-slate-700' : ''}`}>
            <input 
                type="radio" 
                name="device" 
                value="webgpu" 
                checked={selectedDevice === 'webgpu'}
                onChange={() => setSelectedDevice('webgpu')}
                disabled={!webGpuAvailable}
                className="text-pink-500 focus:ring-pink-500 bg-slate-900 border-slate-500"
            />
            <div>
                <span className="text-slate-200 font-medium block">WebGPU</span>
                {!webGpuAvailable && <span className="text-xs text-red-400">No disponible</span>}
            </div>
        </label>

        <label className={`flex items-center space-x-2 p-3 rounded border ${
            !webGlAvailable ? 'opacity-50 cursor-not-allowed border-slate-700' :
            selectedDevice === 'webgl' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 bg-slate-700/30'
            } ${webGlAvailable ? 'cursor-pointer hover:bg-slate-700' : ''}`}>
            <input 
                type="radio" 
                name="device" 
                value="webgl" 
                checked={selectedDevice === 'webgl'}
                onChange={() => setSelectedDevice('webgl')}
                disabled={!webGlAvailable}
                className="text-purple-500 focus:ring-purple-500 bg-slate-900 border-slate-500"
            />
            <div>
                <span className="text-slate-200 font-medium block">WebGL</span>
                {!webGlAvailable && <span className="text-xs text-red-400">No disponible</span>}
            </div>
        </label>
      </div>

      <button
        onClick={handleRunBenchmark}
        disabled={isRunning}
        className="w-full mb-6 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 border border-slate-600"
      >
        {isRunning ? (
            <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ejecutando Benchmark ({selectedDevice})...
            </>
        ) : (
            'Ejecutar Benchmark'
        )}
      </button>

      {results.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-700">
            <table className="min-w-full bg-slate-900/50">
                <thead>
                    <tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400">
                        <th className="px-4 py-3 text-left">Dispositivo</th>
                        <th className="px-4 py-3 text-right">Tiempo (ms)</th>
                        <th className="px-4 py-3 text-right">Speedup</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {results.map((res) => (
                        <tr key={res.device}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-200">
                                {res.device === 'cpu' ? 'CPU (WASM)' : res.device === 'webgpu' ? 'GPU (WebGPU)' : 'GPU (WebGL)'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-slate-300">
                                {res.status === 'success' ? res.time.toFixed(1) : 'Error'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-green-400 font-bold">
                                {res.speedup || '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default GpuTestModule;