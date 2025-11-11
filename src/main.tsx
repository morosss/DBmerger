import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Error handler to show what's breaking
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error)
  const root = document.getElementById('root')
  if (root && root.innerHTML.includes('Loading DBmerger')) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fee; font-family: Inter, system-ui, sans-serif; padding: 20px;">
        <div style="max-width: 600px; text-align: left;">
          <h1 style="color: #c00; margin: 0 0 16px;">⚠️ Error Loading Application</h1>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 2px solid #c00;">
            <pre style="margin: 0; overflow-x: auto; font-size: 12px;">${event.error?.stack || event.error?.message || 'Unknown error'}</pre>
          </div>
          <p style="margin: 16px 0 0; font-size: 14px; color: #666;">
            Press F12 to see full console output. Try clearing cache (Ctrl+Shift+R) or contact support.
          </p>
        </div>
      </div>
    `
  }
})

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Failed to mount React:', error)
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fee; font-family: Inter, system-ui, sans-serif; padding: 20px;">
        <div style="max-width: 600px; text-align: left;">
          <h1 style="color: #c00; margin: 0 0 16px;">⚠️ Failed to Initialize</h1>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 2px solid #c00;">
            <pre style="margin: 0; overflow-x: auto; font-size: 12px;">${error instanceof Error ? error.stack : String(error)}</pre>
          </div>
          <p style="margin: 16px 0 0; font-size: 14px; color: #666;">
            Press F12 to see full console output. Try clearing cache completely.
          </p>
        </div>
      </div>
    `
  }
}
