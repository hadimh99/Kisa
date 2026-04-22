import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import KisaCommandCenter from './components/KisaCommandCenter';

const currentPath = window.location.pathname;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {currentPath === '/kisacms99' ? <KisaCommandCenter /> : <App />}
  </StrictMode>,
)
