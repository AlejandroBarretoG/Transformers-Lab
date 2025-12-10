import { Buffer } from 'buffer';
// Polyfill Buffer globally for transformers.js/onnxruntime
(window as any).Buffer = (window as any).Buffer || Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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