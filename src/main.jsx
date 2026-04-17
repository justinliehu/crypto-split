// Polyfill Node globals (Buffer/process/global) for @solana/spl-token in the browser
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  window.global = window.global || window;
  window.process = window.process || { env: {} };
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { LocaleProvider } from './contexts/LocaleContext';
import { WalletProvider } from './contexts/WalletContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </StrictMode>
);
