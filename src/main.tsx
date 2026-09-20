import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { StoreProvider } from './hooks/useStore'
import { ThemeProvider } from './hooks/useTheme'
import { ToastProvider } from './hooks/useToast'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable')

// HashRouter : aucune configuration serveur nécessaire sur GitHub Pages.
createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
