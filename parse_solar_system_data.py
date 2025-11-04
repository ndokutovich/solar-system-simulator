import pandas as pd
import json

# Read Excel
df = pd.read_excel('solar_system_data_updated.xlsx')

# Map Russian column names to English
column_mapping = {
    'Небесное тело': 'name',
    'Тип': 'type',
    'Диаметр (км)': 'diameter_km',
    'Атм. давление (бар)': 'atmosphere_pressure_bar',
    'Длина суток': 'rotation_period',
    'Орбитальный период': 'orbital_period',
    'Состав атмосферы': 'atmosphere_composition',
    'Состав тела': 'body_composition',
    'Мин. темп. (°C)': 'min_temp_c',
    'Макс. темп. (°C)': 'max_temp_c',
    'Темп. терминатора (°C)': 'terminator_temp_c',
    'Ширина терминатора (км)': 'terminator_width_km',
    'Условный терминатор': 'terminator_notes'
}

df.columns = [column_mapping.get(col, col) for col in df.columns]

# Parse parent relationships from type column
def get_parent(row):
    type_str = str(row['type'])
    if 'Спутник Земли' in type_str:
        return 'earth'
    elif 'Спутник Марса' in type_str:
        return 'mars'
    elif 'Спутник Юпитера' in type_str:
        return 'jupiter'
    elif 'Спутник Сатурна' in type_str:
        return 'saturn'
    elif 'Спутник Урана' in type_str:
        return 'uranus'
    elif 'Спутник Нептуна' in type_str:
        return 'neptune'
    elif 'Спутник Плутона' in type_str:
        return 'pluto'
    elif type_str in ['Планета', 'Карликовая планета']:
        return 'sun'
    return None

# Parse rotation and orbital periods
def parse_period(period_str):
    if pd.isna(period_str):
        return None
    period_str = str(period_str)

    # Extract numeric value
    import re
    numbers = re.findall(r'[\d.]+', period_str)
    if not numbers:
        return None

    value = float(numbers[0])

    # Convert to days based on unit
    if 'час' in period_str or 'ч' in period_str:
        return value / 24  # hours to days
    elif 'дней' in period_str or 'суток' in period_str or 'д' in period_str:
        return value
    elif 'лет' in period_str or 'год' in period_str:
        return value * 365.25
    elif 'месяц' in period_str:
        return value * 30.44

    return value

# Additional orbital parameters (from NASA data)
orbital_params = {
    'mercury': {'semi_major_axis': 0.387098, 'eccentricity': 0.205630, 'inclination': 7.005, 'axial_tilt': 0.034},
    'venus': {'semi_major_axis': 0.723332, 'eccentricity': 0.006772, 'inclination': 3.39458, 'axial_tilt': 177.36},
    'earth': {'semi_major_axis': 1.000001018, 'eccentricity': 0.0167086, 'inclination': 0.00005, 'axial_tilt': 23.4392811},
    'mars': {'semi_major_axis': 1.523679, 'eccentricity': 0.0934, 'inclination': 1.85, 'axial_tilt': 25.19},
    'jupiter': {'semi_major_axis': 5.2044, 'eccentricity': 0.0489, 'inclination': 1.303, 'axial_tilt': 3.13},
    'saturn': {'semi_major_axis': 9.5826, 'eccentricity': 0.0565, 'inclination': 2.485, 'axial_tilt': 26.73},
    'uranus': {'semi_major_axis': 19.2184, 'eccentricity': 0.046381, 'inclination': 0.773, 'axial_tilt': 97.77},
    'neptune': {'semi_major_axis': 30.07, 'eccentricity': 0.0113, 'inclination': 1.767975, 'axial_tilt': 28.32},
    'pluto': {'semi_major_axis': 39.482, 'eccentricity': 0.2488, 'inclination': 17.16, 'axial_tilt': 122.53},
    'moon': {'semi_major_axis': 384400, 'eccentricity': 0.0549, 'inclination': 5.145, 'axial_tilt': 1.5424, 'is_distance_km': True}
}

# Name translations
name_translations = {
    'Меркурий': 'mercury',
    'Венера': 'venus',
    'Земля': 'earth',
    'Луна': 'moon',
    'Марс': 'mars',
    'Фобос': 'phobos',
    'Деймос': 'deimos',
    'Юпитер': 'jupiter',
    'Ио': 'io',
    'Европа': 'europa',
    'Ганимед': 'ganymede',
    'Каллисто': 'callisto',
    'Сатурн': 'saturn',
    'Мимас': 'mimas',
    'Энцелад': 'enceladus',
    'Тефия': 'tethys',
    'Диона': 'dione',
    'Рея': 'rhea',
    'Титан': 'titan',
    'Япет': 'iapetus',
    'Уран': 'uranus',
    'Миранда': 'miranda',
    'Ариэль': 'ariel',
    'Умбриэль': 'umbriel',
    'Титания': 'titania',
    'Оберон': 'oberon',
    'Нептун': 'neptune',
    'Тритон': 'triton',
    'Плутон': 'pluto',
    'Харон': 'charon'
}

# Process celestial bodies
celestial_bodies = {}

for idx, row in df.iterrows():
    if pd.isna(row['name']) or 'Примечания' in str(row['name']):
        continue

    # Skip notes and non-body entries
    name_str = str(row['name'])
    if any(c in name_str for c in ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.']):
        continue

    name_ru = row['name']
    name_en = name_translations.get(name_ru, name_ru.lower())

    body = {
        'id': name_en,
        'name': name_ru,
        'name_en': name_en.title(),
        'type': 'star' if name_en == 'sun' else ('planet' if row['type'] == 'Планета' else ('dwarf_planet' if 'Карликовая' in str(row['type']) else 'moon')),
        'parent': get_parent(row),
        'radius_km': row['diameter_km'] / 2 if pd.notna(row['diameter_km']) else None,
        'diameter_km': row['diameter_km'] if pd.notna(row['diameter_km']) else None,
        'atmosphere_pressure_bar': row['atmosphere_pressure_bar'] if pd.notna(row['atmosphere_pressure_bar']) else 0,
        'rotation_period_days': parse_period(row['rotation_period']),
        'orbital_period_days': parse_period(row['orbital_period']),
        'min_temp_c': row['min_temp_c'] if pd.notna(row['min_temp_c']) else None,
        'max_temp_c': row['max_temp_c'] if pd.notna(row['max_temp_c']) else None,
        'terminator_temp_c': row['terminator_temp_c'] if pd.notna(row['terminator_temp_c']) else None,
        'terminator_width_km': row['terminator_width_km'] if pd.notna(row['terminator_width_km']) else None
    }

    # Add orbital parameters if available
    if name_en in orbital_params:
        body.update(orbital_params[name_en])

    # Store by English ID
    celestial_bodies[name_en.upper()] = body

# Add the Sun
celestial_bodies['SUN'] = {
    'id': 'sun',
    'name': 'Солнце',
    'name_en': 'Sun',
    'type': 'star',
    'parent': None,
    'radius_km': 695700,
    'diameter_km': 1391400,
    'rotation_period_days': 25.38,
    'axial_tilt': 7.25,
    'surface_temp_k': 5778,
    'min_temp_c': 5505,
    'max_temp_c': 5505
}

# Save as JSON for JavaScript use
with open('celestial_bodies.json', 'w', encoding='utf-8') as f:
    json.dump(celestial_bodies, f, ensure_ascii=False, indent=2)

print(f"Parsed {len(celestial_bodies)} celestial bodies")
print("Bodies:", list(celestial_bodies.keys()))