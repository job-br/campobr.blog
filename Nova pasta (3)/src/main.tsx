import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { initGoogleRenderAccelerator } from './utils/googleRenderAccelerator';

// Initialize Google Chrome Speculation Rules & Render Accelerator Plugin
initGoogleRenderAccelerator();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register High-Performance Fast Image Cache Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
