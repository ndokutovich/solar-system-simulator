/**
 * UI Controller - Presentation Layer
 * Manages all DOM interactions and UI updates
 */

import { DOM_IDS } from '../../config/constants.js';
import { validateElement } from '../../infrastructure/utils/ValidationUtils.js';

export class UIController {
  constructor() {
    this.elements = {};
    this.eventHandlers = {};
  }

  /**
   * Initializes UI and caches DOM elements
   */
  initialize() {
    this.hideLoading();
    this.cacheElements();
  }

  /**
   * Hides loading indicator
   */
  hideLoading() {
    const loading = document.getElementById(DOM_IDS.LOADING);
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * Caches frequently accessed DOM elements
   */
  cacheElements() {
    // Display elements
    this.elements.mercuryDay = document.getElementById(DOM_IDS.MERCURY_DAY);
    this.elements.mercuryYear = document.getElementById(DOM_IDS.MERCURY_YEAR);
    this.elements.resonance = document.getElementById(DOM_IDS.RESONANCE);
    this.elements.localTime = document.getElementById(DOM_IDS.LOCAL_TIME);
    this.elements.terminatorSpeed = document.getElementById(DOM_IDS.TERMINATOR_SPEED);
    this.elements.pointTemp = document.getElementById(DOM_IDS.POINT_TEMP);
    this.elements.pointCoords = document.getElementById(DOM_IDS.POINT_COORDS);
    this.elements.sunHeight = document.getElementById(DOM_IDS.SUN_HEIGHT);
    this.elements.observerLat = document.getElementById(DOM_IDS.OBSERVER_LAT);
    this.elements.observerLon = document.getElementById(DOM_IDS.OBSERVER_LON);
    this.elements.speedValue = document.getElementById(DOM_IDS.SPEED_VALUE);
    this.elements.eccentricityValue = document.getElementById(DOM_IDS.ECCENTRICITY_VALUE);

    // Surface view panel
    this.elements.surfacePanel = document.getElementById(DOM_IDS.SURFACE_PANEL);
  }

  /**
   * Updates Mercury day display
   */
  updateMercuryDay(day) {
    if (this.elements.mercuryDay) {
      this.elements.mercuryDay.textContent = day;
    }
  }

  /**
   * Updates Mercury year display
   */
  updateMercuryYear(year) {
    if (this.elements.mercuryYear) {
      this.elements.mercuryYear.textContent = year;
    }
  }

  /**
   * Updates resonance display
   */
  updateResonance(rotations, orbits) {
    if (this.elements.resonance) {
      this.elements.resonance.textContent = `${rotations}/${orbits}`;
    }
  }

  /**
   * Updates local time display
   */
  updateLocalTime(time) {
    if (this.elements.localTime) {
      this.elements.localTime.textContent = time;
    }
  }

  /**
   * Updates terminator speed display
   */
  updateTerminatorSpeed(speed) {
    if (this.elements.terminatorSpeed) {
      this.elements.terminatorSpeed.textContent = `${speed.toFixed(1)} км/ч`;
    }
  }

  /**
   * Updates point temperature display
   */
  updatePointTemperature(temp) {
    if (this.elements.pointTemp) {
      this.elements.pointTemp.textContent = `${temp.toFixed(0)}°C`;
    }
  }

  /**
   * Updates point coordinates display
   */
  updatePointCoordinates(lat, lon) {
    if (this.elements.pointCoords) {
      this.elements.pointCoords.textContent =
        `${lat.toFixed(1)}° с.ш., ${lon.toFixed(1)}° в.д.`;
    }
  }

  /**
   * Updates sun height display
   */
  updateSunHeight(angle) {
    if (this.elements.sunHeight) {
      this.elements.sunHeight.textContent = `${angle.toFixed(1)}°`;
    }
  }

  /**
   * Updates observer position display
   */
  updateObserverPosition(lat, lon) {
    if (this.elements.observerLat) {
      this.elements.observerLat.textContent = `${lat.toFixed(1)}°`;
    }
    if (this.elements.observerLon) {
      this.elements.observerLon.textContent = `${lon.toFixed(1)}°`;
    }
  }

  /**
   * Updates time speed display
   */
  updateSpeedDisplay(speed) {
    if (this.elements.speedValue) {
      const displaySpeed = speed < 10 ? `${speed}x` :
                          speed < 100 ? `${Math.floor(speed/10)}0x` :
                          `${Math.floor(speed/10)}0x`;
      this.elements.speedValue.textContent = displaySpeed;
    }
  }

  /**
   * Updates eccentricity display
   */
  updateEccentricityDisplay(ecc) {
    if (this.elements.eccentricityValue) {
      this.elements.eccentricityValue.textContent = ecc.toFixed(3);
    }
  }

  /**
   * Updates pause button text
   */
  updatePauseButton(isAnimating) {
    const btn = document.getElementById(DOM_IDS.PAUSE_BTN);
    if (btn) {
      btn.textContent = isAnimating ? '⏸️ Пауза' : '▶️ Играть';
    }
  }

  /**
   * Shows surface view panel
   */
  showSurfacePanel() {
    if (this.elements.surfacePanel) {
      this.elements.surfacePanel.classList.add('active');
    }

    const btn = document.getElementById(DOM_IDS.VIEW_SURFACE);
    if (btn) {
      btn.classList.add('active');
    }
  }

  /**
   * Hides surface view panel
   */
  hideSurfacePanel() {
    if (this.elements.surfacePanel) {
      this.elements.surfacePanel.classList.remove('active');
    }

    const btn = document.getElementById(DOM_IDS.VIEW_SURFACE);
    if (btn) {
      btn.classList.remove('active');
    }
  }

  /**
   * Registers event handler
   */
  on(elementId, event, handler) {
    const element = validateElement(elementId);
    element.addEventListener(event, handler);

    // Store for cleanup
    if (!this.eventHandlers[elementId]) {
      this.eventHandlers[elementId] = [];
    }
    this.eventHandlers[elementId].push({ event, handler });
  }

  /**
   * Gets slider value
   */
  getSliderValue(elementId) {
    const element = validateElement(elementId);
    return parseFloat(element.value);
  }

  /**
   * Gets checkbox state
   */
  getCheckboxState(elementId) {
    const element = validateElement(elementId);
    return element.checked;
  }

  /**
   * Sets slider value
   */
  setSliderValue(elementId, value) {
    const element = validateElement(elementId);
    element.value = value;
  }

  /**
   * Cleanup event listeners
   */
  dispose() {
    Object.entries(this.eventHandlers).forEach(([elementId, handlers]) => {
      const element = document.getElementById(elementId);
      if (element) {
        handlers.forEach(({ event, handler }) => {
          element.removeEventListener(event, handler);
        });
      }
    });
    this.eventHandlers = {};
  }
}
