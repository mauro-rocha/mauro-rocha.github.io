import React from 'react';
import ReactDOM from 'react-dom/client';
import * as amplitude from '@amplitude/unified';
import '@fontsource/manrope/latin-200.css';
import '@fontsource/manrope/latin-300.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import '@fontsource/oswald/latin-200.css';
import '@fontsource/oswald/latin-300.css';
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/oswald/latin-700.css';
import App from './App';
import './index.css';

// Initialize Amplitude Analytics + Session Replay (client-side only, runs once)
const AMPLITUDE_API_KEY =
  process.env.AMPLITUDE_API_KEY;
const AMPLITUDE_SERVER_ZONE = (process.env.AMPLITUDE_SERVER_ZONE as 'US' | 'EU') || 'US';

if (AMPLITUDE_API_KEY) {
  amplitude.initAll(AMPLITUDE_API_KEY, {
    analytics: { autocapture: true, serverZone: AMPLITUDE_SERVER_ZONE },
    sessionReplay: { sampleRate: 1 },
  });
}

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
