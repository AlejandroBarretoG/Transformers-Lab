import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- PUNTOS DE INSPECCIÓN PARA DEPURACIÓN ---
console.group("Inspección de Entorno y Polyfills");

// 1. Verificar Buffer (Crítico para manipulación de tensores en ONNX)
if (typeof Buffer !== 'undefined') {
  console.log("%c✅ Inspección Buffer: Cargado OK", "color: green; font-weight: bold;");
} else {
  console.warn("%c⚠️ Inspección Buffer: NO DETECTADO (Podría fallar ONNX)", "color: orange; font-weight: bold;");
  // Opcional: Intentar asignar desde window si existe globalmente
  if ((window as any).Buffer) {
      console.log("Buffer encontrado en window, asignando global...");
      (globalThis as any).Buffer = (window as any).Buffer;
  }
}

// 2. Verificar Long (Dependencia común de protobuf)
// Utilizamos try/catch para evitar crash si 'require' no está definido en el entorno del navegador
try {
  if (typeof require !== 'undefined') {
    const Long = require('long');
    console.log("%c✅ Inspección Long: Cargado OK (via require)", "color: green; font-weight: bold;", Long);
  } else {
    // En entornos ESM puros (Vite/Browser), require no existe.
    console.log("Inspección Long: 'require' no disponible (Entorno ESM detectado).");
  }
} catch (e) {
  console.error("%c❌ Inspección Long: FALLO", "color: red; font-weight: bold;", e);
}

console.groupEnd();
// --------------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);