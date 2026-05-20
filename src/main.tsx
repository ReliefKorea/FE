import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function cleanupDevelopmentServiceWorkers() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        registrations.forEach(registration => {
          registration.unregister()
        })
      })
      .catch(error => {
        console.warn('Failed to unregister development service workers:', error)
      })
  }

  if ('caches' in window) {
    window.caches.keys()
      .then(keys => {
        keys.forEach(key => {
          window.caches.delete(key)
        })
      })
      .catch(error => {
        console.warn('Failed to clear development caches:', error)
      })
  }
}

cleanupDevelopmentServiceWorkers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
