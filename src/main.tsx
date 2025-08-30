import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { scan } from 'react-scan';
import App from './app';

scan({
  enabled: false,
});

// biome-ignore lint/style/noNonNullAssertion: fine for this
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>
);
