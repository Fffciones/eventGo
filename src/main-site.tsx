import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SiteApp from './apps/site/SiteApp.tsx';
import './apps/site/site.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteApp />
  </StrictMode>,
);
