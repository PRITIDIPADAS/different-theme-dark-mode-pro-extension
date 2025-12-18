// Content script for Dark Mode Pro

let darkModeEnabled = false;
let currentSettings = null;
let styleElement = null;

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applyDarkMode') {
    darkModeEnabled = request.enabled;
    currentSettings = request.settings;
    
    if (darkModeEnabled) {
      applyDarkMode();
    } else {
      removeDarkMode();
    }
    
    // Save state for this tab
    saveTabState();
    
    sendResponse({ success: true, enabled: darkModeEnabled });
    return true;
  }
  
  if (request.action === 'getState') {
    sendResponse({ enabled: darkModeEnabled, settings: currentSettings });
    return true;
  }
});

// Apply dark mode based on settings
function applyDarkMode() {
  // Remove any existing dark mode style
  removeDarkMode();
  
  if (!currentSettings) {
    loadSettings().then(settings => {
      currentSettings = settings;
      injectDarkModeCSS();
    });
  } else {
    injectDarkModeCSS();
  }
}

// Remove dark mode
function removeDarkMode() {
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
    styleElement = null;
  }
}

// Inject CSS based on settings
function injectDarkModeCSS() {
  const css = generateDarkModeCSS(currentSettings);
  
  styleElement = document.createElement('style');
  styleElement.id = 'dark-mode-pro-style';
  styleElement.textContent = css;
  
  document.head.appendChild(styleElement);
}

// Generate CSS based on settings
function generateDarkModeCSS(settings) {
  const darkness = settings.darknessLevel || 50;
  const contrast = settings.contrast || 100;
  const theme = settings.themeStyle || 'gray-dark';
  const invertImages = settings.invertImages !== false;
  const preserveColors = settings.preserveColors || false;
  
  let css = `
    /* Base dark mode styles */
    html {
      filter: contrast(${contrast}%) !important;
    }
    
    body {
      background-color: hsl(0, 0%, ${Math.max(5, Math.min(20, darkness / 5))}%) !important;
      color: hsl(0, 0%, ${Math.max(70, Math.min(95, 60 + darkness / 2))}%) !important;
    }
    
    /* Background colors */
    div, section, article, main, aside, header, footer, nav,
    form, fieldset, legend, details, summary, figure, figcaption {
      background-color: inherit !important;
    }
    
    /* Text colors */
    h1, h2, h3, h4, h5, h6, p, span, li, td, th, caption,
    label, input, textarea, select, button, a, em, strong, i, b,
    blockquote, cite, code, pre, mark, small, sub, sup {
      color: inherit !important;
    }
    
    /* Links */
    a, a:link, a:visited {
      color: hsl(210, 100%, 70%) !important;
    }
    
    a:hover, a:active, a:focus {
      color: hsl(210, 100%, 85%) !important;
    }
    
    /* Inputs */
    input, textarea, select {
      background-color: hsl(0, 0%, ${Math.max(15, Math.min(30, darkness / 3))}%) !important;
      border-color: hsl(0, 0%, ${Math.max(30, Math.min(50, darkness / 2))}%) !important;
    }
    
    /* Buttons */
    button, input[type="button"], input[type="submit"], input[type="reset"] {
      background-color: hsl(0, 0%, ${Math.max(20, Math.min(40, darkness / 2.5))}%) !important;
      border-color: hsl(0, 0%, ${Math.max(30, Math.min(60, darkness / 1.7))}%) !important;
    }
    
    /* Scrollbars */
    ::-webkit-scrollbar-track {
      background: hsl(0, 0%, ${Math.max(10, Math.min(25, darkness / 4))}%) !important;
    }
    
    ::-webkit-scrollbar-thumb {
      background: hsl(0, 0%, ${Math.max(30, Math.min(60, darkness / 1.7))}%) !important;
    }
  `;
  
  // Image inversion
  if (invertImages) {
    css += `
      img, video, canvas, svg {
        filter: invert(${darkness}%) hue-rotate(180deg) contrast(${contrast}%) !important;
      }
    `;
  }
  
  // Theme-specific styles
  switch(theme) {
    case 'true-dark':
      css += `
        body {
          background-color: #000 !important;
          color: #e0e0e0 !important;
        }
      `;
      break;
      
    case 'blue-dark':
      css += `
        body {
          background-color: hsl(220, 30%, ${Math.max(5, Math.min(15, darkness / 10))}%) !important;
          color: hsl(220, 20%, ${Math.max(75, Math.min(95, 65 + darkness / 3))}%) !important;
        }
        
        a, a:link, a:visited {
          color: hsl(200, 100%, 65%) !important;
        }
      `;
      break;
      
    case 'sepia':
      css += `
        html {
          filter: sepia(100%) contrast(${contrast}%) !important;
        }
        
        body {
          background-color: hsl(30, 30%, ${Math.max(10, Math.min(25, darkness / 4))}%) !important;
          color: hsl(30, 20%, ${Math.max(20, Math.min(40, darkness / 2.5))}%) !important;
        }
      `;
      break;
  }
  
  // Preserve colors for specific elements
  if (preserveColors) {
    css += `
      .logo, .brand, [class*="color-"], [class*="Color"],
      [style*="color:"], [style*="background-color:"] {
        filter: none !important;
      }
    `;
  }
  
  return css;
}

// Load saved settings
function loadSettings() {
  return browser.storage.local.get(['extensionSettings'])
    .then(result => {
      return result.extensionSettings || {
        darknessLevel: 50,
        contrast: 100,
        themeStyle: 'gray-dark',
        invertImages: true,
        preserveColors: false
      };
    })
    .catch(error => {
      console.error('Error loading settings:', error);
      return null;
    });
}

// Save state for current tab
function saveTabState() {
  const tabId = getTabId();
  if (!tabId) return;
  
  browser.storage.local.get(['darkModeStates'])
    .then(result => {
      const states = result.darkModeStates || {};
      states[tabId] = {
        enabled: darkModeEnabled,
        settings: currentSettings,
        url: window.location.href
      };
      
      return browser.storage.local.set({ darkModeStates: states });
    })
    .catch(error => {
      console.error('Error saving tab state:', error);
    });
}

// Get unique identifier for current tab
function getTabId() {
  return `${window.location.hostname}-${window.location.pathname}`;
}

// Initialize on page load
function initialize() {
  // Load saved state for this tab
  const tabId = getTabId();
  
  browser.storage.local.get(['darkModeStates', 'extensionSettings', 'darkModeEnabled'])
    .then(result => {
      // Check if dark mode was enabled for this tab
      const states = result.darkModeStates || {};
      const tabState = states[tabId];
      
      if (tabState && tabState.enabled) {
        darkModeEnabled = true;
        currentSettings = tabState.settings || result.extensionSettings;
        applyDarkMode();
      }
      // Check global setting
      else if (result.darkModeEnabled) {
        darkModeEnabled = true;
        currentSettings = result.extensionSettings;
        applyDarkMode();
      }
    })
    .catch(error => {
      console.error('Error initializing dark mode:', error);
    });
}

// Start initialization when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}