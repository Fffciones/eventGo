import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ProfessionalApp from './apps/profissional/ProfessionalApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProfessionalApp />
  </StrictMode>,
);
