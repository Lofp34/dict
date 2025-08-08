import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Service Worker: activé uniquement en production pour éviter les conflits HMR en dev
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  } else {
    // En dev: tenter de désinstaller d'éventuels SW existants
    navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(r => r.unregister()));
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("L'élément racine est introuvable pour monter l'application.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
