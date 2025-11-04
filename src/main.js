/**
 * Main Entry Point
 * Bootstraps the Mercury Terminator application
 */

import { Application } from './Application.js';

/**
 * Initialize application when DOM is ready
 */
function initializeApp() {
  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.error('Three.js library not loaded');
    return;
  }

  // Create and initialize application
  const app = new Application();

  app.initialize()
    .catch(error => {
      console.error('Failed to initialize application:', error);
    });

  // Expose app to window for debugging
  if (window) {
    window.mercuryApp = app;
  }
}

// Wait for DOM and Three.js to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
