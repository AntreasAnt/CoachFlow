import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/bootstrap/main.scss';
import './styles/brand.css';
import './styles/style.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

import 'bootstrap-icons/font/bootstrap-icons.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
