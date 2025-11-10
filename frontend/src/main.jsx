import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/style.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

import './styles/style.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/bootstrap/main.scss';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
