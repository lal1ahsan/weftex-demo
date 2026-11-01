import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppStateProvider } from './context/AppState'
import { AccountProvider } from './context/Account'
import { ToastProvider } from './components/ui/Toast'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AccountProvider>
          <AppStateProvider>
            <App />
          </AppStateProvider>
        </AccountProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
