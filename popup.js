document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const darkModeToggle = document.getElementById('darkModeToggle');
  const darknessSlider = document.getElementById('darkness');
  const contrastSlider = document.getElementById('contrast');
  const themeSelect = document.getElementById('theme');
  const invertImagesCheckbox = document.getElementById('invertImages');
  const preserveColorsCheckbox = document.getElementById('preserveColors');
  const applyBtn = document.getElementById('applyBtn');
  const saveBtn = document.getElementById('saveBtn');
  const darknessValue = document.getElementById('darknessValue');
  const contrastValue = document.getElementById('contrastValue');

  // Load saved settings
  loadSettings();

  // Update slider value displays
  darknessSlider.addEventListener('input', function() {
    darknessValue.textContent = `${this.value}%`;
  });

  contrastSlider.addEventListener('input', function() {
    contrastValue.textContent = `${this.value}%`;
  });

  // Apply dark mode to current tab
  applyBtn.addEventListener('click', function() {
    const settings = getCurrentSettings();
    
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs.length === 0) return;
        
        const tab = tabs[0];
        
        // Send settings to content script
        browser.tabs.sendMessage(tab.id, {
          action: 'applyDarkMode',
          settings: settings,
          enabled: darkModeToggle.checked
        })
        .then(response => {
          console.log('Dark mode applied:', response);
          // Close popup after successful application
          setTimeout(() => window.close(), 500);
        })
        .catch(error => {
          console.error('Error applying dark mode:', error);
          
          // If content script isn't loaded, inject it first
          browser.tabs.executeScript(tab.id, { file: 'content.js' })
            .then(() => {
              // Try sending message again
              return browser.tabs.sendMessage(tab.id, {
                action: 'applyDarkMode',
                settings: settings,
                enabled: darkModeToggle.checked
              });
            })
            .then(() => {
              setTimeout(() => window.close(), 500);
            })
            .catch(injectError => {
              console.error('Failed to inject content script:', injectError);
            });
        });
      })
      .catch(error => {
        console.error('Error getting active tab:', error);
      });
  });

  // Save settings
  saveBtn.addEventListener('click', function() {
    const settings = getCurrentSettings();
    
    browser.storage.local.set({
      extensionSettings: settings,
      darkModeEnabled: darkModeToggle.checked
    })
    .then(() => {
      console.log('Settings saved');
      
      // Show confirmation
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      saveBtn.style.background = '#2E7D32';
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
      }, 1500);
    })
    .catch(error => {
      console.error('Error saving settings:', error);
    });
  });

  // Get current settings from UI
  function getCurrentSettings() {
    return {
      darknessLevel: parseInt(darknessSlider.value),
      contrast: parseInt(contrastSlider.value),
      themeStyle: themeSelect.value,
      invertImages: invertImagesCheckbox.checked,
      preserveColors: preserveColorsCheckbox.checked,
      timestamp: Date.now()
    };
  }

  // Load saved settings
  function loadSettings() {
    browser.storage.local.get(['extensionSettings', 'darkModeEnabled'])
      .then(result => {
        if (result.extensionSettings) {
          const settings = result.extensionSettings;
          
          darknessSlider.value = settings.darknessLevel || 50;
          contrastSlider.value = settings.contrast || 100;
          themeSelect.value = settings.themeStyle || 'gray-dark';
          invertImagesCheckbox.checked = settings.invertImages !== false;
          preserveColorsCheckbox.checked = settings.preserveColors || false;
          
          darknessValue.textContent = `${darknessSlider.value}%`;
          contrastValue.textContent = `${contrastSlider.value}%`;
        }
        
        if (result.darkModeEnabled !== undefined) {
          darkModeToggle.checked = result.darkModeEnabled;
        }
      })
      .catch(error => {
        console.error('Error loading settings:', error);
      });
  }
});