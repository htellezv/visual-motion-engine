import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * Punto de arranque exclusivo del entorno Vite para validar la integración React.
 */
const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('VME could not find the root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
