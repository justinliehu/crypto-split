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
