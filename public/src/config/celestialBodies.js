/**
 * Celestial Bodies Configuration
 * Data from solar_system_data.xlsx with additional orbital parameters
 */

// Import physics functions (to be implemented)
const orbitalMechanics = {
  calculateKeplerianOrbit: 'calculateKeplerianOrbit',
  calculate32Resonance: 'calculate32Resonance',
  calculateTidalLock: 'calculateTidalLock'
};

const rotationalMechanics = {
  calculateRotation: 'calculateRotation',
  calculateRetrograde: 'calculateRetrograde',
  calculateTidalLock: 'calculateTidalLock'
};

const temperatureCalculator = {
  calculateSolarTemp: 'calculateSolarTemp',
  calculateMercuryTemp: 'calculateMercuryTemp',
  calculateVenusTemp: 'calculateVenusTemp',
  calculateEarthTemp: 'calculateEarthTemp',
  calculateMarsTemp: 'calculateMarsTemp',
  calculateGasGiantTemp: 'calculateGasGiantTemp',
  calculateMoonTemp: 'calculateMoonTemp'
};

export const CELESTIAL_BODIES = {

  SUN: {
    id: 'sun',
    name: 'Солнце',
    name_en: 'Sun',
    type: 'star',
    parent: null,
    emoji: '☀️',

    // Physical properties
    radius_km: 695700,
    mass_kg: 1.989e30,

    // No orbital elements (sun moves with galaxy)
    orbital: null,

    // Rotation
    rotation: {
      period_days: 25.38,
      axial_tilt: 7.25,
      initial_rotation: 0,
      calculation_fn: rotationalMechanics.calculateRotation
    },

    // Temperature
    temperature: {
      surface_k: 5778,
      min_c: 5505,
      max_c: 5505,
      calculation_fn: temperatureCalculator.calculateSolarTemp
    },

    // Rendering
    rendering: {
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissive_intensity: 2.0,
      corona_scale: 1.2,
      rays_count: 24
    }
  },

  MERCURY: {
    id: 'mercury',
    name: 'Меркурий',
    name_en: 'Mercury',
    type: 'planet',
    parent: 'sun',
    emoji: '☿',

    // Physical properties
    radius_km: 2439.5,
    mass_kg: 3.3011e23,

    // Orbital parameters
    orbital: {
      semi_major_axis_au: 0.387098,
      eccentricity: 0.205630,
      inclination: 7.005,
      longitude_ascending_node: 48.331,
      argument_periapsis: 29.124,
      mean_anomaly_epoch: 174.796,
      period_days: 87.969,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    // Rotation (3:2 resonance)
    rotation: {
      period_days: 58.646,
      axial_tilt: 0.034,
      initial_rotation: Math.PI, // 180 degrees - hot side faces sun at start
      resonance: {
        rotations: 3,
        orbits: 2
      },
      calculation_fn: rotationalMechanics.calculate32Resonance
    },

    // Temperature
    temperature: {
      min_c: -173,
      max_c: 427,
      terminator_c: 100,
      terminator_width_km: 150,
      calculation_fn: temperatureCalculator.calculateMercuryTemp
    },

    // Rendering
    rendering: {
      color: 0x8C7853,
      albedo: 0.142,
      grid_color: 0x00FF00
    }
  },

  VENUS: {
    id: 'venus',
    name: 'Венера',
    name_en: 'Venus',
    type: 'planet',
    parent: 'sun',
    emoji: '♀',

    radius_km: 6051.8,
    mass_kg: 4.8675e24,

    orbital: {
      semi_major_axis_au: 0.723332,
      eccentricity: 0.006772,
      inclination: 3.39458,
      mean_anomaly_epoch: 50.115, // Mean anomaly at J2000.0 epoch
      period_days: 224.701,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: -243.025, // Negative = retrograde
      axial_tilt: 177.36,
      calculation_fn: rotationalMechanics.calculateRetrograde
    },

    temperature: {
      min_c: 462,
      max_c: 464,
      terminator_c: -30,
      terminator_altitude_km: 67.5,
      calculation_fn: temperatureCalculator.calculateVenusTemp
    },

    rendering: {
      color: 0xFFC649,
      albedo: 0.76,
      atmosphere_color: 0xFFE0B0,
      atmosphere_thickness_km: 100
    },

    // Reflected light (Venus has high albedo)
    reflectedLight: {
      enabled: true,
      intensity: 0.18,
      distance: 5,
      color: 0xffffee
    }
  },

  EARTH: {
    id: 'earth',
    name: 'Земля',
    name_en: 'Earth',
    type: 'planet',
    parent: 'sun',
    emoji: '🌍',

    radius_km: 6371,
    mass_kg: 5.97237e24,

    orbital: {
      semi_major_axis_au: 1.000001018,
      eccentricity: 0.0167086,
      inclination: 0.00005,
      mean_anomaly_epoch: 357.529, // Mean anomaly at J2000.0 epoch
      period_days: 365.256363004,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 0.99726968, // Sidereal day
      axial_tilt: 23.4392811,
      calculation_fn: rotationalMechanics.calculateRotation
    },

    temperature: {
      min_c: -89,
      max_c: 58,
      terminator_c: 15,
      calculation_fn: temperatureCalculator.calculateEarthTemp
    },

    rendering: {
      color: 0x2233FF,
      albedo: 0.306,
      atmosphere_color: 0x7FC8F8
    },

    // Reflected light (Earthshine)
    reflectedLight: {
      enabled: true,
      intensity: 0.15,
      distance: 10,
      color: 0x4488ff
    },

    // Camera preset for this body
    cameraPreset: {
      enabled: true,
      name: 'Earth-Moon',
      description: 'Close-up of Earth-Moon system',
      cameraOffset: { x: 5, y: 3, z: 5 }, // Camera position relative to body
      follow: true // Enable follow mode when this preset is activated
    }
  },

  MOON: {
    id: 'moon',
    name: 'Луна',
    name_en: 'Moon',
    type: 'moon',
    parent: 'earth',
    emoji: '🌙',

    radius_km: 1737.4,
    mass_kg: 7.342e22,

    orbital: {
      semi_major_axis_km: 384400, // Note: in km, not AU
      eccentricity: 0.0549,
      inclination: 5.145,
      period_days: 27.321661,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 27.321661, // Tidally locked
      axial_tilt: 1.5424,
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -173,
      max_c: 127,
      terminator_c: 0,
      terminator_width_km: 15,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xAAAAAA,
      albedo: 0.136,
      reflected_light: {
        enabled: true,
        reflect_from: 'earth',
        intensity: 0.1
      }
    }
  },

  MARS: {
    id: 'mars',
    name: 'Марс',
    name_en: 'Mars',
    type: 'planet',
    parent: 'sun',
    emoji: '♂',

    radius_km: 3389.5,
    mass_kg: 6.4171e23,

    orbital: {
      semi_major_axis_au: 1.523679,
      eccentricity: 0.0934,
      inclination: 1.85,
      mean_anomaly_epoch: 355.453, // Mean anomaly at J2000.0 epoch
      period_days: 686.98,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 1.025957, // Sol (Mars day)
      axial_tilt: 25.19,
      calculation_fn: rotationalMechanics.calculateRotation
    },

    temperature: {
      min_c: -125,
      max_c: 20,
      terminator_c: -50,
      calculation_fn: temperatureCalculator.calculateMarsTemp
    },

    rendering: {
      color: 0xCD5C5C,
      albedo: 0.15,
      atmosphere_color: 0xFFDDCC
    },

    // Reflected light (Mars)
    reflectedLight: {
      enabled: true,
      intensity: 0.08,
      distance: 8,
      color: 0xff8844
    }
  },

  PHOBOS: {
    id: 'phobos',
    name: 'Фобос',
    name_en: 'Phobos',
    type: 'moon',
    parent: 'mars',

    radius_km: 11.2667,

    orbital: {
      semi_major_axis_km: 9376,
      eccentricity: 0.0151,
      inclination: 1.093,
      period_days: 0.31891, // 7.6 hours
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 0.31891, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -112,
      max_c: -4,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0x888888,
      albedo: 0.071
    }
  },

  DEIMOS: {
    id: 'deimos',
    name: 'Деймос',
    name_en: 'Deimos',
    type: 'moon',
    parent: 'mars',

    radius_km: 6.2,

    orbital: {
      semi_major_axis_km: 23463,
      eccentricity: 0.00033,
      inclination: 0.93,
      period_days: 1.263, // 30.3 hours
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 1.263, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -143,
      max_c: -4,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0x999999,
      albedo: 0.068
    }
  },

  JUPITER: {
    id: 'jupiter',
    name: 'Юпитер',
    name_en: 'Jupiter',
    type: 'planet',
    parent: 'sun',
    emoji: '♃',

    radius_km: 69911,
    mass_kg: 1.8982e27,

    orbital: {
      semi_major_axis_au: 5.2044,
      eccentricity: 0.0489,
      inclination: 1.303,
      mean_anomaly_epoch: 34.404, // Mean anomaly at J2000.0 epoch
      period_days: 4332.59, // 11.86 years
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 0.41354, // 9.9 hours
      axial_tilt: 3.13,
      calculation_fn: rotationalMechanics.calculateRotation
    },

    temperature: {
      min_c: -145,
      max_c: -108,
      cloud_top_c: -108,
      calculation_fn: temperatureCalculator.calculateGasGiantTemp
    },

    rendering: {
      color: 0xC88B3A,
      albedo: 0.503,
      bands: true,
      great_red_spot: true
    },

    // Reflected light (Jupiter)
    reflectedLight: {
      enabled: true,
      intensity: 0.12,
      distance: 50,
      color: 0xffddaa
    },

    // Camera preset for Jupiter system
    cameraPreset: {
      enabled: true,
      name: 'Jupiter System',
      description: 'Jupiter and its Galilean moons',
      cameraOffset: { x: 20, y: 10, z: 20 },
      follow: true
    }
  },

  IO: {
    id: 'io',
    name: 'Ио',
    name_en: 'Io',
    type: 'moon',
    parent: 'jupiter',

    radius_km: 1821.6,

    orbital: {
      semi_major_axis_km: 421800,
      eccentricity: 0.0041,
      inclination: 0.05,
      period_days: 1.769, // 42.5 hours
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 1.769, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -183,
      max_c: -143,
      volcanic_c: 1327, // Volcanic hot spots
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xFFFF66,
      albedo: 0.63,
      volcanic_activity: true
    }
  },

  EUROPA: {
    id: 'europa',
    name: 'Европа',
    name_en: 'Europa',
    type: 'moon',
    parent: 'jupiter',

    radius_km: 1560.8,

    orbital: {
      semi_major_axis_km: 671100,
      eccentricity: 0.009,
      inclination: 0.47,
      period_days: 3.551, // 85 hours
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 3.551, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -223,
      max_c: -148,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xEEEEFF,
      albedo: 0.67,
      ice_surface: true
    }
  },

  GANYMEDE: {
    id: 'ganymede',
    name: 'Ганимед',
    name_en: 'Ganymede',
    type: 'moon',
    parent: 'jupiter',

    radius_km: 2634.1,

    orbital: {
      semi_major_axis_km: 1070400,
      eccentricity: 0.0013,
      inclination: 0.2,
      period_days: 7.155, // 172 hours
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 7.155, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -203,
      max_c: -121,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xAA9988,
      albedo: 0.43
    }
  },

  CALLISTO: {
    id: 'callisto',
    name: 'Каллисто',
    name_en: 'Callisto',
    type: 'moon',
    parent: 'jupiter',

    radius_km: 2410.3,

    orbital: {
      semi_major_axis_km: 1882700,
      eccentricity: 0.0074,
      inclination: 0.192,
      period_days: 16.689, // 400 hours
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 16.689, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -193,
      max_c: -108,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0x665544,
      albedo: 0.22,
      heavily_cratered: true
    }
  },

  SATURN: {
    id: 'saturn',
    name: 'Сатурн',
    name_en: 'Saturn',
    type: 'planet',
    parent: 'sun',
    emoji: '♄',

    radius_km: 58232,
    mass_kg: 5.6834e26,

    orbital: {
      semi_major_axis_au: 9.5826,
      eccentricity: 0.0565,
      inclination: 2.485,
      mean_anomaly_epoch: 50.078, // Mean anomaly at J2000.0 epoch
      period_days: 10759.22, // 29.5 years
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 0.444, // 10.7 hours
      axial_tilt: 26.73,
      calculation_fn: rotationalMechanics.calculateRotation
    },

    temperature: {
      min_c: -178,
      max_c: -139,
      cloud_top_c: -139,
      calculation_fn: temperatureCalculator.calculateGasGiantTemp
    },

    rendering: {
      color: 0xFAD5A5,
      albedo: 0.499,
      rings: {
        enabled: true,
        inner_radius: 92000,
        outer_radius: 282000,
        color: 0xBBBB99,
        opacity: 0.7
      }
    },

    // Reflected light (Saturn)
    reflectedLight: {
      enabled: true,
      intensity: 0.10,
      distance: 40,
      color: 0xffffcc
    },

    // Camera preset for Saturn system
    cameraPreset: {
      enabled: true,
      name: 'Saturn System',
      description: 'Saturn and its rings',
      cameraOffset: { x: 25, y: 15, z: 25 },
      follow: true
    }
  },

  MIMAS: {
    id: 'mimas',
    name: 'Мимас',
    name_en: 'Mimas',
    type: 'moon',
    parent: 'saturn',

    radius_km: 198.2,

    orbital: {
      semi_major_axis_km: 185539,
      eccentricity: 0.0196,
      inclination: 1.574,
      period_days: 0.942,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 0.942, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -209,
      max_c: -177,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xEEEEEE,
      albedo: 0.962
    }
  },

  ENCELADUS: {
    id: 'enceladus',
    name: 'Энцелад',
    name_en: 'Enceladus',
    type: 'moon',
    parent: 'saturn',

    radius_km: 252.1,

    orbital: {
      semi_major_axis_km: 238037,
      eccentricity: 0.0047,
      inclination: 0.009,
      period_days: 1.370,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 1.370, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -240,
      max_c: -128,
      south_pole_c: -93, // Geysers
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xFFFFFF,
      albedo: 1.375,
      geysers: true
    }
  },

  TITAN: {
    id: 'titan',
    name: 'Титан',
    name_en: 'Titan',
    type: 'moon',
    parent: 'saturn',

    radius_km: 2574.7,

    orbital: {
      semi_major_axis_km: 1221865,
      eccentricity: 0.0288,
      inclination: 0.312,
      period_days: 15.945,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 15.945, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -183,
      max_c: -179,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xD4A76A,
      albedo: 0.22,
      atmosphere_color: 0xFF9944,
      thick_atmosphere: true
    }
  },

  URANUS: {
    id: 'uranus',
    name: 'Уран',
    name_en: 'Uranus',
    type: 'planet',
    parent: 'sun',
    emoji: '♅',

    radius_km: 25362,
    mass_kg: 8.6810e25,

    orbital: {
      semi_major_axis_au: 19.2184,
      eccentricity: 0.046381,
      inclination: 0.773,
      mean_anomaly_epoch: 142.238, // Mean anomaly at J2000.0 epoch
      period_days: 30688.5, // 84 years
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: -0.718, // Retrograde, 17.2 hours
      axial_tilt: 97.77, // Nearly on its side!
      pole_direction: 90, // 90° makes pole point radially (toward/away from sun)
      calculation_fn: rotationalMechanics.calculateRetrograde
    },

    temperature: {
      min_c: -224,
      max_c: -197,
      cloud_top_c: -197,
      calculation_fn: temperatureCalculator.calculateGasGiantTemp
    },

    rendering: {
      color: 0x4FD0E0,
      albedo: 0.488,
      rings: {
        enabled: true,
        inner_radius: 41837,
        outer_radius: 51149,
        color: 0x666666,
        opacity: 0.3
      }
    },

    // Reflected light (Uranus)
    reflectedLight: {
      enabled: true,
      intensity: 0.09,
      distance: 30,
      color: 0x88ddff
    }
  },

  MIRANDA: {
    id: 'miranda',
    name: 'Миранда',
    name_en: 'Miranda',
    type: 'moon',
    parent: 'uranus',

    radius_km: 235.8,

    orbital: {
      semi_major_axis_km: 129900,
      eccentricity: 0.0013,
      inclination: 4.232,
      period_days: 1.413,
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 1.413, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -213,
      max_c: -187,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xCCCCCC,
      albedo: 0.32
    }
  },

  TRITON: {
    id: 'triton',
    name: 'Тритон',
    name_en: 'Triton',
    type: 'moon',
    parent: 'neptune',

    radius_km: 1353.4,

    orbital: {
      semi_major_axis_km: 354759,
      eccentricity: 0.000016,
      inclination: 156.885, // Retrograde orbit (inclination > 90)
      period_days: 5.877, // Orbital period (always positive, retrograde indicated by inclination)
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 5.877, // Tidally locked
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -235,
      max_c: -210,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xFFCCCC,
      albedo: 0.76,
      nitrogen_geysers: true
    }
  },

  NEPTUNE: {
    id: 'neptune',
    name: 'Нептун',
    name_en: 'Neptune',
    type: 'planet',
    parent: 'sun',
    emoji: '♆',

    radius_km: 24622,
    mass_kg: 1.02413e26,

    orbital: {
      semi_major_axis_au: 30.07,
      eccentricity: 0.0113,
      inclination: 1.767975,
      mean_anomaly_epoch: 267.767, // Mean anomaly at J2000.0 epoch
      period_days: 60182, // 164.8 years
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 0.671, // 16.1 hours
      axial_tilt: 28.32,
      calculation_fn: rotationalMechanics.calculateRotation
    },

    temperature: {
      min_c: -223,
      max_c: -200,
      cloud_top_c: -200,
      calculation_fn: temperatureCalculator.calculateGasGiantTemp
    },

    rendering: {
      color: 0x4B70DD,
      albedo: 0.442,
      dark_spots: true
    },

    // Reflected light (Neptune)
    reflectedLight: {
      enabled: true,
      intensity: 0.08,
      distance: 30,
      color: 0x4466ff
    }
  },

  PLUTO: {
    id: 'pluto',
    name: 'Плутон',
    name_en: 'Pluto',
    type: 'dwarf_planet',
    parent: 'sun',
    emoji: '♇',

    radius_km: 1188.3,

    orbital: {
      semi_major_axis_au: 39.482,
      eccentricity: 0.2488,
      inclination: 17.16,
      mean_anomaly_epoch: 14.882, // Mean anomaly at J2000.0 epoch
      period_days: 90560, // 247.9 years
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: -6.387, // Retrograde
      axial_tilt: 122.53,
      calculation_fn: rotationalMechanics.calculateRetrograde
    },

    temperature: {
      min_c: -233,
      max_c: -223,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0xCCAA88,
      albedo: 0.52
    }
  },

  CHARON: {
    id: 'charon',
    name: 'Харон',
    name_en: 'Charon',
    type: 'moon',
    parent: 'pluto',

    radius_km: 606,

    orbital: {
      semi_major_axis_km: 19591,
      eccentricity: 0.0022,
      inclination: 0.08,
      period_days: 6.387, // Same as Pluto's rotation
      calculation_fn: orbitalMechanics.calculateKeplerianOrbit
    },

    rotation: {
      period_days: 6.387, // Tidally locked to Pluto
      tidally_locked: true,
      calculation_fn: rotationalMechanics.calculateTidalLock
    },

    temperature: {
      min_c: -233,
      max_c: -223,
      calculation_fn: temperatureCalculator.calculateMoonTemp
    },

    rendering: {
      color: 0x999999,
      albedo: 0.35
    }
  }
};

/**
 * Helper functions for celestial body hierarchy
 */

export function getBodyById(id) {
  return CELESTIAL_BODIES[id.toUpperCase()];
}

export function getBodyHierarchy(bodyId) {
  const body = getBodyById(bodyId);
  if (!body) return [];

  const hierarchy = [body];
  let current = body;

  while (current.parent) {
    current = getBodyById(current.parent);
    if (!current) break;
    hierarchy.unshift(current);
  }

  return hierarchy;
}

export function getChildren(bodyId) {
  return Object.values(CELESTIAL_BODIES)
    .filter(body => body.parent === bodyId);
}

export function getAllBodies() {
  return Object.values(CELESTIAL_BODIES);
}

export function getPlanets() {
  return Object.values(CELESTIAL_BODIES)
    .filter(body => body.type === 'planet');
}

export function getMoons(planetId) {
  return Object.values(CELESTIAL_BODIES)
    .filter(body => body.parent === planetId);
}

export function getInnerPlanets() {
  return ['MERCURY', 'VENUS', 'EARTH', 'MARS']
    .map(id => CELESTIAL_BODIES[id]);
}

export function getOuterPlanets() {
  return ['JUPITER', 'SATURN', 'URANUS', 'NEPTUNE']
    .map(id => CELESTIAL_BODIES[id]);
}

export function getGasGiants() {
  return ['JUPITER', 'SATURN', 'URANUS', 'NEPTUNE']
    .map(id => CELESTIAL_BODIES[id]);
}

export function getTerrestrialPlanets() {
  return ['MERCURY', 'VENUS', 'EARTH', 'MARS']
    .map(id => CELESTIAL_BODIES[id]);
}

/**
 * System-wide camera presets (not tied to specific bodies)
 * These are absolute positions relative to the star
 */
export const SYSTEM_CAMERA_PRESETS = [
  {
    id: 'full-system',
    name: 'Full System',
    description: 'View entire solar system from above',
    cameraPosition: { x: 0, y: 500, z: 500 },
    targetPosition: { x: 0, y: 0, z: 0 },
    follow: null // Don't follow any body
  },
  {
    id: 'inner-planets',
    name: 'Inner Planets',
    description: 'Focus on Mercury, Venus, Earth, Mars',
    cameraPosition: { x: 0, y: 30, z: 30 },
    targetPosition: { x: 0, y: 0, z: 0 },
    follow: null
  },
  {
    id: 'outer-planets',
    name: 'Outer Planets',
    description: 'Focus on Jupiter, Saturn, Uranus, Neptune',
    cameraPosition: { x: 0, y: 400, z: 400 },
    targetPosition: { x: 0, y: 0, z: 0 },
    follow: null
  }
];