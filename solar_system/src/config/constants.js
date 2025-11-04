/**
 * Application Configuration and Constants
 * All magic numbers and configuration values centralized here
 */

// Physical constants
export const PHYSICS_CONSTANTS = {
  // Astronomical unit in km
  AU_IN_KM: 149597870.7,

  // Gravitational constant
  G: 6.67430e-11, // m³/kg/s²

  // Solar mass
  SOLAR_MASS: 1.989e30, // kg

  // Speed of light
  SPEED_OF_LIGHT: 299792458, // m/s
};

// Scene configuration
export const SCENE_CONFIG = {
  // Scene scale (1 AU = SCENE_SCALE units in Three.js)
  SCENE_SCALE: 100,

  // Background and fog
  BACKGROUND_COLOR: 0x000005,
  FOG_COLOR: 0x000011,
  FOG_NEAR: 100,
  FOG_FAR: 10000,

  // Renderer settings
  ANTIALIAS: true,
  LOGARITHMIC_DEPTH: true,
  SHADOW_MAP_SIZE: 2048,
  PIXEL_RATIO: typeof window !== 'undefined' ? window.devicePixelRatio : 1
};

// Camera configuration
export const CAMERA_CONFIG = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 100000,
  INITIAL_POSITION: { x: 150, y: 100, z: 200 },

  // Controls
  MIN_DISTANCE: 0.5,
  MAX_DISTANCE: 5000,
  ENABLE_DAMPING: true,
  DAMPING_FACTOR: 0.05,
  ROTATE_SPEED: 1.0,
  ZOOM_SPEED: 1.2,
  PAN_SPEED: 0.8
};

// Sun configuration
export const SUN_CONFIG = {
  // Visual properties
  COLOR: 0xFFFF00,
  EMISSIVE: 0xFFFF00,
  EMISSIVE_INTENSITY: 2.0,
  CORONA_SCALE: 1.2,
  RAYS_COUNT: 24,
  RAYS_LENGTH: 50,

  // Light properties
  LIGHT_COLOR: 0xFFFFFE,
  LIGHT_INTENSITY: 1.5,
  POINT_LIGHT_INTENSITY: 2.0,
  POINT_LIGHT_DISTANCE: 1000,

  // Physical properties
  RADIUS_KM: 695700,
  ROTATION_PERIOD_DAYS: 25.38,
  SURFACE_TEMP_K: 5778
};

// Ambient light
export const AMBIENT_CONFIG = {
  COLOR: 0x404050,
  INTENSITY: 0.15
};

// Orbit rendering
export const ORBIT_CONFIG = {
  SEGMENTS: 256,
  COLOR: 0x444466,
  OPACITY: 0.5,
  LINE_WIDTH: 1
};

// Temperature colors
export const TEMPERATURE_COLORS = {
  // Temperature thresholds (normalized 0-1)
  DEEP_COLD: 0.17,
  COLD_TO_MODERATE: 0.33,
  COMFORT_ZONE: 0.42,
  WARM: 0.67,

  // Color stops for gradient
  COLORS: {
    DEEP_COLD: 0x0000FF,
    COLD: 0x00FFFF,
    MODERATE: 0x00FF00,
    WARM: 0xFFFF00,
    HOT: 0xFF0000
  }
};

// Terminator rendering
export const TERMINATOR_CONFIG = {
  SEGMENTS: 64,
  OFFSET_FACTOR: 1.01,
  LINE_WIDTH: 2,
  OPACITY: 0.7,
  MORNING_COLOR: 0x00FFFF,
  EVENING_COLOR: 0xFF8800
};

// Labels configuration
export const LABEL_CONFIG = {
  FONT_SIZE: 14,
  FONT_COLOR: '#FFFFFF',
  BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.6)',
  PADDING: 5,
  BORDER_RADIUS: 3,
  MIN_DISTANCE: 10,
  MAX_DISTANCE: 1000
};

// Scale modes
export const SCALE_MODES = {
  REALISTIC: 'realistic',
  VISIBLE: 'visible',
  TRANSITION_DURATION: 2000 // milliseconds
};

// Realistic scale factors
export const REALISTIC_SCALE = {
  // Size scaling (1:1 realistic)
  SIZE_FACTOR: 1.0,

  // Distance scaling (1:1 realistic)
  DISTANCE_FACTOR: 1.0,

  // Minimum visible size
  MIN_SIZE: 0.001
};

// Visible scale factors (for better visualization)
export const VISIBLE_SCALE = {
  // Logarithmic size scaling
  SIZE_BASE: 0.5,
  SIZE_LOG_FACTOR: 0.15,
  MIN_SIZE: 0.5,

  // Square root distance scaling
  DISTANCE_POWER: 0.6,
  DISTANCE_FACTOR: 20,

  // Special scaling for moons
  MOON_DISTANCE_FACTOR: 5
};

// Galaxy motion configuration
export const GALAXY_CONFIG = {
  // Sun orbits galactic center every ~225-250 million years
  GALACTIC_YEAR_DAYS: 225000000 * 365.25,
  GALACTIC_RADIUS_PC: 8000, // parsecs from center
  ORBITAL_SPEED_KM_S: 220,

  // Vertical oscillation through galactic plane
  VERTICAL_PERIOD_DAYS: 70000000 * 365.25,
  VERTICAL_AMPLITUDE_PC: 230,

  // Visualization scale
  VISUALIZATION_SCALE: 0.00001,
  SHOW_TRAIL: true,
  TRAIL_LENGTH: 100,
  TRAIL_COLOR: 0x4444FF
};

// Star field configuration
export const STARFIELD_CONFIG = {
  // Number of stars to render (from catalog)
  MAX_STARS: 10000,

  // Magnitude limit (visible to naked eye)
  MAGNITUDE_LIMIT: 6.5,

  // Star rendering
  STAR_SIZE_MIN: 0.5,
  STAR_SIZE_MAX: 3.0,
  STAR_DISTANCE: 10000, // Fixed distance (stars at infinity)

  // Star colors by spectral class
  STAR_COLORS: {
    O: 0x9BB0FF, // Blue
    B: 0xAABFFF, // Blue-white
    A: 0xFFFFFF, // White
    F: 0xFFEECC, // Yellow-white
    G: 0xFFDD88, // Yellow
    K: 0xFFCC6F, // Orange
    M: 0xFF8C00  // Red
  }
};

// Animation configuration
export const ANIMATION_CONFIG = {
  // Default animation speed
  DEFAULT_SPEED: 1.0,

  // Speed limits
  MIN_SPEED: 0,
  MAX_SPEED: 10000,

  // Time step (in days per frame at speed 1x)
  TIME_STEP: 0.01,

  // Maximum delta time to prevent jumps
  MAX_DELTA_TIME: 1.0
};

// UI configuration
export const UI_CONFIG = {
  // Update rates (milliseconds)
  INFO_UPDATE_RATE: 100,
  STATS_UPDATE_RATE: 1000,

  // Decimal places for displays
  DECIMALS: {
    TEMPERATURE: 1,
    DISTANCE: 2,
    ANGLE: 1,
    TIME: 0
  }
};

// DOM element IDs
export const DOM_IDS = {
  // Main elements
  CANVAS_CONTAINER: 'canvas-container',
  LOADING: 'loading',
  CONTROLS: 'controls',
  INFO_PANEL: 'info-panel',
  PLANET_DETAILS: 'planet-details',

  // Time controls
  TIME_SPEED: 'time-speed',
  SPEED_VALUE: 'speed-value',
  PAUSE_BTN: 'pause-btn',
  RESET_BTN: 'reset-btn',
  REVERSE_BTN: 'reverse-btn',

  // Scale controls
  SCALE_REALISTIC: 'scale-realistic',
  SCALE_VISIBLE: 'scale-visible',
  SCALE_TRANSITION: 'scale-transition',

  // Camera views
  VIEW_SOLAR_SYSTEM: 'view-solar-system',
  VIEW_INNER: 'view-inner',
  VIEW_OUTER: 'view-outer',
  VIEW_EARTH_MOON: 'view-earth-moon',
  VIEW_JUPITER: 'view-jupiter',
  VIEW_SATURN: 'view-saturn',

  // Follow body
  FOLLOW_BODY: 'follow-body',

  // Display toggles
  SHOW_ORBITS: 'show-orbits',
  SHOW_LABELS: 'show-labels',
  SHOW_GRID: 'show-grid',
  SHOW_AXES: 'show-axes',
  SHOW_TEMPERATURE: 'show-temperature',
  SHOW_TERMINATORS: 'show-terminators',
  SHOW_SUN_RAYS: 'show-sun-rays',
  SHOW_GALAXY_MOTION: 'show-galaxy-motion',
  SHOW_TRAILS: 'show-trails',
  SHOW_REFLECTED: 'show-reflected',

  // Info displays
  SIM_DATE: 'sim-date',
  SIM_DAY: 'sim-day',
  SOLAR_TIME: 'solar-time',
  SELECTED_NAME: 'selected-name',
  SELECTED_TYPE: 'selected-type',
  SELECTED_PARENT: 'selected-parent',
  SELECTED_RADIUS: 'selected-radius',
  SELECTED_ORBITAL: 'selected-orbital',
  SELECTED_ROTATION: 'selected-rotation',
  SELECTED_DISTANCE: 'selected-distance',
  SURFACE_COORDS: 'surface-coords',
  SURFACE_TEMP: 'surface-temp',
  SUN_ANGLE: 'sun-angle',
  ILLUMINATION: 'illumination',
  FPS: 'fps',
  OBJECT_COUNT: 'object-count',
  POLYGON_COUNT: 'polygon-count',

  // Details popup
  DETAIL_NAME: 'detail-name',
  DETAIL_DIAMETER: 'detail-diameter',
  DETAIL_MASS: 'detail-mass',
  DETAIL_ORBIT: 'detail-orbit',
  DETAIL_ATMOSPHERE: 'detail-atmosphere',
  DETAIL_TEMPERATURE: 'detail-temperature',
  DETAIL_MOONS: 'detail-moons'
};

// Error messages
export const ERROR_MESSAGES = {
  THREE_NOT_LOADED: 'Three.js library failed to load',
  WEBGL_NOT_SUPPORTED: 'WebGL is not supported in this browser',
  DATA_LOAD_FAILED: 'Failed to load celestial bodies data',
  INVALID_BODY_ID: (id) => `Invalid celestial body ID: ${id}`,
  INVALID_COORDINATES: (lat, lon) => `Invalid coordinates: lat=${lat}, lon=${lon}`,
  INVALID_TIME: (time) => `Invalid time value: ${time}`,
  INVALID_SCALE_MODE: (mode) => `Invalid scale mode: ${mode}`,
  SHADER_COMPILE_ERROR: (error) => `Shader compilation failed: ${error}`,
  ELEMENT_NOT_FOUND: (id) => `Required DOM element not found: ${id}`
};

// Alias exports for backward compatibility
export const RENDERING = SCENE_CONFIG;
export const PHYSICS = PHYSICS_CONSTANTS;
export const UI = UI_CONFIG;