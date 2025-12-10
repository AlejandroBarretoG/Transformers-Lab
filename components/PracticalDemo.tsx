import React, { useState } from 'react';
import TransformersService from '../services/transformersService';
import { generateTestCases } from '../services/geminiService';
import { SentimentResult, TestCase } from '../types';

interface PracticalDemoProps {
  isReady: boolean;
}

const PracticalDemo: React.FC<PracticalDemoProps> = ({ isReady }) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCases, setGeneratedCases] = useState<TestCase[]>([]);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = textToAnalyze || inputText;
    if (!text.trim() || !isReady) return;

    setIsAnalyzing(true);
    try {
      const results = await TransformersService.analyzeSentiment(text);
      if (results && results.length > 0) {
        setResult(results[0]);
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCases = async () => {
    setIsGenerating(true);
    try {
      const cases = await generateTestCases("Customer reviews for a tech gadget");
      setGeneratedCases(cases);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectCase = (testCase: TestCase) => {
    setInputText(testCase.text);
    handleAnalyze(testCase.text);
  };

  const getScoreColor = (label: string, score: number) => {
     if (label === 'POSITIVE') return 'text-green-400';
     return 'text-red-400';
  };

  const getBarColor = (label: string) => {
    if (label === 'POSITIVE') return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg transition-opacity duration-500 ${!isReady ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Análisis de Sentimiento
          </h2>
          <p className="text-sm text-slate-400 mt-1">Modelo: DistilBERT SST-2 (In-Browser Inference)</p>
        </div>
        
        {/* Gemini Integration Button */}
        <button
          onClick={handleGenerateCases}
          disabled={isGenerating || !isReady}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium transition-colors"
        >
          {isGenerating ? (
             <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          )}
          Generar Casos con Gemini
        </button>
      </div>

      {generatedCases.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-2">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Casos generados por IA:</p>
          {generatedCases.map((c, idx) => (
            <button
              key={idx}
              onClick={() => selectCase(c)}
              className="text-left text-sm bg-slate-700/50 hover:bg-slate-700 p-2 rounded border border-slate-600 transition-colors flex justify-between items-center group"
            >
              <span className="truncate text-slate-300">{c.text}</span>
              <span className="text-xs text-slate-500 group-hover:text-slate-300">Test: {c.expectedSentiment}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe algo en inglés para analizar..."
          className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
        />
        <button
          onClick={() => handleAnalyze()}
          disabled={isAnalyzing || !inputText.trim()}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isAnalyzing ? 'Analizando...' : 'Analizar'}
        </button>
      </div>

      {/* Results Section */}
      <div className="mt-6 border-t border-slate-700 pt-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-slate-400">Resultado del Modelo</span>
          {result && (
             <span className={`text-2xl font-bold ${getScoreColor(result.label, result.score)}`}>
               {result.label}
             </span>
          )}
        </div>
        
        {result ? (
          <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-700 ease-out ${getBarColor(result.label)}`}
              style={{ width: `${(result.score * 100).toFixed(1)}%` }}
            />
            <span className="absolute right-2 top-0 bottom-0 flex items-center text-[10px] text-white font-mono z-10 mix-blend-difference">
              {(result.score * 100).toFixed(2)}% Confianza
            </span>
          </div>
        ) : (
          <div className="w-full bg-slate-900 rounded-full h-4 animate-pulse opacity-50"></div>
        )}
        
        <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-500/20 text-xs text-blue-200">
           <strong>¿Cómo funciona?</strong> El texto se tokeniza y procesa localmente en tu navegador usando un modelo Transformer cuantizado. Ningún dato de texto sale de tu dispositivo durante el análisis.
        </div>
      </div>
    </div>
  );
};

export default PracticalDemo;