import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './data/ui-extra.js';
import './data/i18n-ta.js';
import './styles.css';
import { LangProvider } from './lib/i18n.jsx';
import { LabProvider } from './lib/labStore.jsx';
import { CommunityProvider } from './lib/community.jsx';
import App from './App.jsx';
import { applyTheme, readTheme } from './lib/theme.js';

applyTheme(readTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <LabProvider>
        <CommunityProvider>
          <App />
        </CommunityProvider>
      </LabProvider>
    </LangProvider>
  </StrictMode>,
);
