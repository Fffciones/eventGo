import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SiteApp from './SiteApp.tsx';
import './site.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteApp />
  </StrictMode>,
);
