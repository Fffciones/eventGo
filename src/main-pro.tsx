import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ProfessionalApp from './ProfessionalApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProfessionalApp />
  </StrictMode>,
);
