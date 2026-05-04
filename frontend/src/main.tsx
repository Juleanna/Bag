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

const root = document.getElementById('root')
if (!root) throw new Error('Не знайдено контейнер #root')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <TweaksProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <LandingProvider>
              <App />
            </LandingProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </TweaksProvider>
  </React.StrictMode>
)
