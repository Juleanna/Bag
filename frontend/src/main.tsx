/**
 * BugTracker Frontend — точка входу.
 * React + react-router-dom + контексти (Auth, Toast, Tweaks).
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import { App } from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { TweaksProvider } from './context/TweaksContext'
import { LandingProvider } from './context/LandingContext'
import { ConfirmProvider } from './context/ConfirmContext'

const root = document.getElementById('root')
if (!root) throw new Error('Не знайдено контейнер #root')

// PWA: реєстрація service worker (тільки в production, щоб не заважати dev-серверу)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW не критичний — мовчки */
    })
  })
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <TweaksProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <LandingProvider>
                <App />
              </LandingProvider>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </TweaksProvider>
  </React.StrictMode>
)
