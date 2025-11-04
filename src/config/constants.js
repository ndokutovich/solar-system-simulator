/**
 * Application Configuration and Constants
 * All magic numbers and configuration values centralized here
 */

export const MERCURY_CONSTANTS = {
  // Physical dimensions (cosmetic, not to scale)
  RADIUS: 2,
  SUN_DISTANCE: 15,

  // Accurate orbital periods (in Earth days)
  SIDEREAL_DAY: 58.646,      // Rotation period
  ORBITAL_PERIOD: 87.969,     // Year length
  SOLAR_DAY: 175.938,         // Sunrise to sunrise

  // Orbital characteristics
  ECCENTRICITY: 0.206,
  RESONANCE_RATIO: 3 / 2,     // 3:2 spin-orbit resonance

  // Temperature range (Celsius)
  MIN_TEMP: -173,
  MAX_TEMP: 427,
  TEMP_RANGE: 600,

  // Terminator speed at equator (km/h)
  TERMINATOR_SPEED: 3.5
};

export const CAMERA_CONFIG = {
  ORBITAL: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 1000,
    INITIAL_POSITION: { x: 10, y: 8, z: 15 }
  },
  SURFACE: {
    FOV: 75,
    NEAR: 0.001,
    FAR: 1000,
    OBSERVER_HEIGHT: 0.002  // 2 meters in scale
  }
};

export const CONTROLS_CONFIG = {
  DAMPING_FACTOR: 0.05,
  MIN_DISTANCE: 3,
  MAX_DISTANCE: 50,
  ROTATE_SPEED: 1.0,
  ZOOM_SPEED: 1.05
};

export const RENDERING_CONFIG = {
  ANTIALIAS: true,
  LOGARITHMIC_DEPTH: true,
  SHADOW_MAP_SIZE: 2048,
  SHADOW_NEAR: 0.5,
  SHADOW_FAR: 50
};

export const SUN_CONFIG = {
  RADIUS: 2,
  GLOW_RADIUS: 2.5,
  COLOR: 0xffff00,
  EMISSIVE_INTENSITY: 2,
  GLOW_OPACITY: 0.3,
  GLOW_COLOR: 0xffaa00,
  LIGHT_INTENSITY: 1.5,
  POINT_LIGHT_INTENSITY: 2,
  POINT_LIGHT_DISTANCE: 100
};

export const AMBIENT_CONFIG = {
  COLOR: 0x202030,
  INTENSITY: 0.1
};

export const STARS_CONFIG = {
  COUNT: 20000,
  DISTANCE: 400,
  SIZE: 0.05,
  COLOR: 0xffffff
};

export const GRID_CONFIG = {
  SIZE: 40,
  DIVISIONS: 40,
  COLOR_CENTER: 0x444444,
  COLOR_GRID: 0x222222,
  Y_POSITION: -10
};

export const MERCURY_RENDERING = {
  SEGMENTS_WIDTH: 128,
  SEGMENTS_HEIGHT: 64,
  BUMP_SCALE: 0.05,
  SPECULAR_COLOR: 0x222222,
  SHININESS: 10,
  TEXTURE_WIDTH: 2048,
  TEXTURE_HEIGHT: 1024,
  CRATER_COUNT: 100,
  CRATER_MIN_RADIUS: 5,
  CRATER_MAX_RADIUS: 25
};

export const TERMINATOR_CONFIG = {
  SEGMENTS: 64,
  OFFSET_FACTOR: 1.01,  // Slightly above surface
  LINE_WIDTH: 3,
  OPACITY: 0.8,
  MORNING_COLOR: 0x00ffff,
  EVENING_COLOR: 0xff8800
};

export const POLE_MARKERS = {
  RADIUS: 0.1,
  HEIGHT: 0.3,
  SEGMENTS: 8,
  OFFSET: 0.15,
  NORTH_COLOR: 0x00ff00,
  SOUTH_COLOR: 0xff0000
};

export const ORBIT_CONFIG = {
  SEGMENTS: 100,
  COLOR: 0x444466,
  OPACITY: 0.5
};

export const UI_CONFIG = {
  TIME_SPEED_MIN: 0,
  TIME_SPEED_MAX: 1000,
  TIME_SPEED_STEP: 1,
  ECCENTRICITY_MIN: 0,
  ECCENTRICITY_MAX: 40,
  ECCENTRICITY_STEP: 0.1,
  MARKER_LIFETIME_MS: 5000,
  MARKER_RADIUS: 0.05,
  MARKER_COLOR: 0x00ff00,
  MARKER_EMISSIVE_INTENSITY: 2
};

export const SURFACE_NAVIGATION = {
  MOVE_SPEED_DEGREES: 5,
  LAT_MIN: -90,
  LAT_MAX: 90
};

export const TEMPERATURE_COLORS = {
  // Temperature thresholds (normalized 0-1)
  DEEP_COLD: 0.17,
  COLD_TO_MODERATE: 0.33,
  COMFORT_ZONE: 0.42,
  WARM: 0.67,

  // Base colors
  BASE_BLUE: 100,

  // Polar modification
  POLAR_FACTOR: 0.3
};

export const SCENE_CONFIG = {
  BACKGROUND_COLOR: 0x000005,
  FOG_COLOR: 0x000011,
  FOG_NEAR: 10,
  FOG_FAR: 100
};

export const DOM_IDS = {
  CANVAS_CONTAINER: 'canvas-container',
  LOADING: 'loading',
  INFO_PANEL: 'info-panel',
  CONTROLS: 'controls',
  SURFACE_PANEL: 'surface-view-panel',

  // Display elements
  MERCURY_DAY: 'mercury-day',
  MERCURY_YEAR: 'mercury-year',
  RESONANCE: 'resonance',
  LOCAL_TIME: 'local-time',
  TERMINATOR_SPEED: 'terminator-speed',
  POINT_TEMP: 'point-temp',
  POINT_COORDS: 'point-coords',
  SUN_HEIGHT: 'sun-height',
  OBSERVER_LAT: 'observer-lat',
  OBSERVER_LON: 'observer-lon',
  SPEED_VALUE: 'speed-value',
  ECCENTRICITY_VALUE: 'eccentricity-value',

  // Controls
  TIME_SPEED: 'time-speed',
  PAUSE_BTN: 'pause-btn',
  RESET_BTN: 'reset-btn',
  VIEW_ORBIT: 'view-orbit',
  VIEW_EQUATOR: 'view-equator',
  VIEW_POLE: 'view-pole',
  VIEW_SURFACE: 'view-surface',
  EXIT_SURFACE: 'exit-surface',

  // Checkboxes
  SHOW_GRID: 'show-grid',
  SHOW_TERMINATOR: 'show-terminator',
  SHOW_TEMP: 'show-temp',
  SHOW_ORBIT: 'show-orbit',
  SHOW_SUN_RAYS: 'show-sun-rays',
  SHOW_AXES: 'show-axes',
  SHOW_PERIHELION: 'show-perihelion',

  // Routes
  ROUTE_POLAR: 'route-polar',
  ROUTE_TERMINATOR: 'route-terminator',
  ROUTE_COMFORT: 'route-comfort',
  CLEAR_ROUTE: 'clear-route',

  // Special points
  GO_HOT: 'go-hot',
  GO_WARM: 'go-warm',

  // Orbital params
  ECCENTRICITY: 'eccentricity'
};

export const ERROR_MESSAGES = {
  THREE_NOT_LOADED: 'Three.js library failed to load',
  ELEMENT_NOT_FOUND: (id) => `Required DOM element not found: ${id}`,
  INVALID_TEMPERATURE: (temp) => `Invalid temperature value: ${temp}`,
  INVALID_COORDINATES: (lat, lon) => `Invalid coordinates: lat=${lat}, lon=${lon}`,
  INVALID_TIME_SPEED: (speed) => `Invalid time speed: ${speed}`,
  CANVAS_CREATION_FAILED: 'Failed to create canvas element',
  WEBGL_NOT_SUPPORTED: 'WebGL is not supported in this browser'
};

export const ANIMATION_CONFIG = {
  DELTA_TIME_MULTIPLIER: 0.0001,
  HOURS_PER_ROTATION: 15,
  HOURS_IN_DAY: 24
};
