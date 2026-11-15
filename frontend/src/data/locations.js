const CITY = 'city';
const SITE = 'climate';

// id, name, country/territory, region, latitude, longitude, type, note, aliases
const rows = [
  // West & North Africa
  ['abuja', 'Abuja', 'Nigeria', 'West Africa', 9.0579, 7.4951, CITY, 'Challenge benchmark'],
  ['lagos', 'Lagos', 'Nigeria', 'West Africa', 6.5244, 3.3792, CITY, 'Coastal megacity'],
  ['kano', 'Kano', 'Nigeria', 'West Africa', 12.0022, 8.592, CITY, 'Sahel transition'],
  ['port-harcourt', 'Port Harcourt', 'Nigeria', 'West Africa', 4.8156, 7.0498, CITY, 'Niger Delta'],
  ['niamey', 'Niamey', 'Niger', 'West Africa', 13.5116, 2.1254, CITY, 'Sahel semi-arid'],
  ['bamako', 'Bamako', 'Mali', 'West Africa', 12.6392, -8.0029, CITY, 'Sahel'],
  ['ouagadougou', 'Ouagadougou', 'Burkina Faso', 'West Africa', 12.3714, -1.5197, CITY, 'Sahel'],
  ['dakar', 'Dakar', 'Senegal', 'West Africa', 14.7167, -17.4677, CITY, 'Atlantic coast'],
  ['accra', 'Accra', 'Ghana', 'West Africa', 5.6037, -0.187, CITY, 'Gulf of Guinea coast'],
  ['tamanrasset', 'Tamanrasset', 'Algeria', 'North Africa', 22.785, 5.5228, SITE, 'Central Sahara'],
  ['cairo', 'Cairo', 'Egypt', 'North Africa', 30.0444, 31.2357, CITY, 'Nile Delta'],
  ['alexandria', 'Alexandria', 'Egypt', 'North Africa', 31.2001, 29.9187, CITY, 'Mediterranean coast'],
  ['casablanca', 'Casablanca', 'Morocco', 'North Africa', 33.5731, -7.5898, CITY, 'Atlantic Morocco'],
  ['marrakesh', 'Marrakesh', 'Morocco', 'North Africa', 31.6295, -7.9811, CITY, 'Semi-arid interior'],
  ['khartoum', 'Khartoum', 'Sudan', 'North Africa', 15.5007, 32.5599, CITY, 'Nile confluence'],
  ['mogadishu', 'Mogadishu', 'Somalia', 'East Africa', 2.0469, 45.3182, CITY, 'Horn of Africa coast'],
  // East, Central & Southern Africa
  ['addis-ababa', 'Addis Ababa', 'Ethiopia', 'East Africa', 9.03, 38.74, CITY, 'Ethiopian highlands'],
  ['nairobi', 'Nairobi', 'Kenya', 'East Africa', -1.2921, 36.8219, CITY, 'Equatorial highlands'],
  ['mombasa', 'Mombasa', 'Kenya', 'East Africa', -4.0435, 39.6682, CITY, 'Indian Ocean coast'],
  ['kampala', 'Kampala', 'Uganda', 'East Africa', 0.3476, 32.5825, CITY, 'Lake Victoria basin'],
  ['kigali', 'Kigali', 'Rwanda', 'East Africa', -1.9441, 30.0619, CITY, 'Great Lakes region'],
  ['dar-es-salaam', 'Dar es Salaam', 'Tanzania', 'East Africa', -6.7924, 39.2083, CITY, 'Indian Ocean coast'],
  ['kinshasa', 'Kinshasa', 'DR Congo', 'Central Africa', -4.4419, 15.2663, CITY, 'Congo Basin'],
  ['luanda', 'Luanda', 'Angola', 'Central Africa', -8.839, 13.2894, CITY, 'Atlantic coast'],
  ['johannesburg', 'Johannesburg', 'South Africa', 'Southern Africa', -26.2041, 28.0473, CITY, 'Highveld'],
  ['cape-town', 'Cape Town', 'South Africa', 'Southern Africa', -33.9249, 18.4241, CITY, 'Mediterranean climate'],
  ['durban', 'Durban', 'South Africa', 'Southern Africa', -29.8587, 31.0218, CITY, 'Subtropical coast'],
  ['maputo', 'Maputo', 'Mozambique', 'Southern Africa', -25.9692, 32.5732, CITY, 'Indian Ocean coast'],
  ['antananarivo', 'Antananarivo', 'Madagascar', 'Southern Africa', -18.8792, 47.5079, CITY, 'Central highlands'],
  ['bol', 'Bol (Lake Chad)', 'Chad', 'West Africa', 13.459, 14.7147, SITE, 'Shrinking lake system'],

  // Europe
  ['london', 'London', 'United Kingdom', 'Europe', 51.5074, -0.1278, CITY, 'Temperate maritime'],
  ['paris', 'Paris', 'France', 'Europe', 48.8566, 2.3522, CITY, 'Western Europe'],
  ['berlin', 'Berlin', 'Germany', 'Europe', 52.52, 13.405, CITY, 'Continental Europe'],
  ['madrid', 'Madrid', 'Spain', 'Europe', 40.4168, -3.7038, CITY, 'Iberian interior'],
  ['rome', 'Rome', 'Italy', 'Europe', 41.9028, 12.4964, CITY, 'Mediterranean'],
  ['lisbon', 'Lisbon', 'Portugal', 'Europe', 38.7223, -9.1393, CITY, 'Atlantic Iberia'],
  ['amsterdam', 'Amsterdam', 'Netherlands', 'Europe', 52.3676, 4.9041, CITY, 'Low Countries'],
  ['stockholm', 'Stockholm', 'Sweden', 'Europe', 59.3293, 18.0686, CITY, 'Baltic coast'],
  ['oslo', 'Oslo', 'Norway', 'Europe', 59.9139, 10.7522, CITY, 'Nordic coast'],
  ['helsinki', 'Helsinki', 'Finland', 'Europe', 60.1699, 24.9384, CITY, 'Gulf of Finland'],
  ['copenhagen', 'Copenhagen', 'Denmark', 'Europe', 55.6761, 12.5683, CITY, 'Danish straits'],
  ['reykjavik', 'Reykjavik', 'Iceland', 'Europe', 64.1466, -21.9426, CITY, 'North Atlantic'],
  ['moscow', 'Moscow', 'Russia', 'Europe', 55.7558, 37.6173, CITY, 'Continental interior'],
  ['athens', 'Athens', 'Greece', 'Europe', 37.9838, 23.7275, CITY, 'Aegean'],
  ['istanbul', 'Istanbul', 'Türkiye', 'Europe', 41.0082, 28.9784, CITY, 'Bosphorus'],
  ['kyiv', 'Kyiv', 'Ukraine', 'Europe', 50.4501, 30.5234, CITY, 'East European plain'],
  ['warsaw', 'Warsaw', 'Poland', 'Europe', 52.2297, 21.0122, CITY, 'Central Europe'],
  ['zurich', 'Zurich', 'Switzerland', 'Europe', 47.3769, 8.5417, CITY, 'Alpine foreland'],
  ['vienna', 'Vienna', 'Austria', 'Europe', 48.2082, 16.3738, CITY, 'Danube basin'],
  ['dublin', 'Dublin', 'Ireland', 'Europe', 53.3498, -6.2603, CITY, 'Irish Sea'],
  ['longyearbyen', 'Longyearbyen', 'Svalbard, Norway', 'Polar', 78.2232, 15.6267, SITE, 'Arctic amplification testbed'],
  ['tromso', 'Tromsø', 'Norway', 'Polar', 69.6492, 18.9553, CITY, 'Arctic Circle'],
  ['murmansk', 'Murmansk', 'Russia', 'Polar', 68.9585, 33.0827, CITY, 'Kola Peninsula'],
  ['belgrade', 'Belgrade', 'Serbia', 'Europe', 44.7866, 20.4489, CITY, 'Balkan interior'],
  ['bucharest', 'Bucharest', 'Romania', 'Europe', 44.4268, 26.1025, CITY, 'Lower Danube'],

  // Middle East & Central Asia
  ['riyadh', 'Riyadh', 'Saudi Arabia', 'Middle East', 24.7136, 46.6753, CITY, 'Arabian interior'],
  ['jeddah', 'Jeddah', 'Saudi Arabia', 'Middle East', 21.4858, 39.1925, CITY, 'Red Sea coast'],
  ['tehran', 'Tehran', 'Iran', 'Middle East', 35.6892, 51.389, CITY, 'Iranian plateau'],
  ['baghdad', 'Baghdad', 'Iraq', 'Middle East', 33.3152, 44.3661, CITY, 'Mesopotamia'],
  ['dubai', 'Dubai', 'United Arab Emirates', 'Middle East', 25.2048, 55.2708, CITY, 'Gulf coast'],
  ['almaty', 'Almaty', 'Kazakhstan', 'Central Asia', 43.222, 76.8512, CITY, 'Tian Shan foothills'],
  ['tashkent', 'Tashkent', 'Uzbekistan', 'Central Asia', 41.2995, 69.2401, CITY, 'Aral Sea basin'],
  ['nukus', 'Nukus (Aral Sea)', 'Uzbekistan', 'Central Asia', 42.4531, 59.6103, SITE, 'Aral Sea desiccation'],
  ['yakutsk', 'Yakutsk', 'Russia', 'Polar', 62.0355, 129.6755, CITY, 'Siberian permafrost'],
  ['oymyakon', 'Oymyakon', 'Russia', 'Polar', 63.4641, 142.7737, SITE, 'Cold pole'],

  // South Asia
  ['mumbai', 'Mumbai', 'India', 'South Asia', 19.076, 72.8777, CITY, 'Arabian Sea monsoon'],
  ['delhi', 'Delhi', 'India', 'South Asia', 28.6139, 77.209, CITY, 'Indo-Gangetic plain'],
  ['kolkata', 'Kolkata', 'India', 'South Asia', 22.5726, 88.3639, CITY, 'Ganges delta'],
  ['chennai', 'Chennai', 'India', 'South Asia', 13.0827, 80.2707, CITY, 'Coromandel coast'],
  ['bengaluru', 'Bengaluru', 'India', 'South Asia', 12.9716, 77.5946, CITY, 'Deccan plateau'],
  ['karachi', 'Karachi', 'Pakistan', 'South Asia', 24.8607, 67.0011, CITY, 'Arabian Sea coast'],
  ['lahore', 'Lahore', 'Pakistan', 'South Asia', 31.5204, 74.3587, CITY, 'Punjab plain'],
  ['islamabad', 'Islamabad', 'Pakistan', 'South Asia', 33.6844, 73.0479, CITY, 'Margalla hills'],
  ['dhaka', 'Dhaka', 'Bangladesh', 'South Asia', 23.8103, 90.4125, CITY, 'Ganges-Brahmaputra delta'],
  ['kathmandu', 'Kathmandu', 'Nepal', 'South Asia', 27.7172, 85.324, CITY, 'Himalayan valley'],
  ['lhasa', 'Lhasa', 'China', 'Central Asia', 29.652, 91.1721, SITE, 'Tibetan Plateau'],

  // East & Southeast Asia
  ['tokyo', 'Tokyo', 'Japan', 'East Asia', 35.6762, 139.6503, CITY, 'Pacific megacity'],
  ['osaka', 'Osaka', 'Japan', 'East Asia', 34.6937, 135.5023, CITY, 'Seto Inland Sea'],
  ['seoul', 'Seoul', 'South Korea', 'East Asia', 37.5665, 126.978, CITY, 'Korean peninsula'],
  ['beijing', 'Beijing', 'China', 'East Asia', 39.9042, 116.4074, CITY, 'North China plain'],
  ['shanghai', 'Shanghai', 'China', 'East Asia', 31.2304, 121.4737, CITY, 'Yangtze delta'],
  ['guangzhou', 'Guangzhou', 'China', 'East Asia', 23.1291, 113.2644, CITY, 'Pearl River delta'],
  ['hong-kong', 'Hong Kong', 'China', 'East Asia', 22.3193, 114.1694, CITY, 'South China coast'],
  ['ulaanbaatar', 'Ulaanbaatar', 'Mongolia', 'East Asia', 47.8864, 106.9057, CITY, 'Mongolian steppe'],
  ['bangkok', 'Bangkok', 'Thailand', 'Southeast Asia', 13.7563, 100.5018, CITY, 'Chao Phraya delta'],
  ['hanoi', 'Hanoi', 'Vietnam', 'Southeast Asia', 21.0278, 105.8342, CITY, 'Red River delta'],
  ['ho-chi-minh-city', 'Ho Chi Minh City', 'Vietnam', 'Southeast Asia', 10.8231, 106.6297, CITY, 'Mekong periphery'],
  ['singapore', 'Singapore', 'Singapore', 'Southeast Asia', 1.3521, 103.8198, CITY, 'Equatorial maritime'],
  ['jakarta', 'Jakarta', 'Indonesia', 'Southeast Asia', -6.2088, 106.8456, CITY, 'Java coast'],
  ['manila', 'Manila', 'Philippines', 'Southeast Asia', 14.5995, 120.9842, CITY, 'West Pacific'],
  ['kuala-lumpur', 'Kuala Lumpur', 'Malaysia', 'Southeast Asia', 3.139, 101.6869, CITY, 'Malay Peninsula'],
  ['pontianak', 'Pontianak', 'Indonesia', 'Southeast Asia', -0.0263, 109.3425, SITE, 'Borneo equator'],
  ['port-moresby', 'Port Moresby', 'Papua New Guinea', 'Oceania', -9.4438, 147.1803, CITY, 'Papuan coast'],

  // North & Central America
  ['new-york', 'New York', 'United States', 'North America', 40.7128, -74.006, CITY, 'Atlantic seaboard', 'NYC'],
  ['los-angeles', 'Los Angeles', 'United States', 'North America', 34.0522, -118.2437, CITY, 'Pacific coast'],
  ['chicago', 'Chicago', 'United States', 'North America', 41.8781, -87.6298, CITY, 'Great Lakes'],
  ['houston', 'Houston', 'United States', 'North America', 29.7604, -95.3698, CITY, 'Gulf Coast'],
  ['miami', 'Miami', 'United States', 'North America', 25.7617, -80.1918, CITY, 'Subtropical Atlantic'],
  ['phoenix', 'Phoenix', 'United States', 'North America', 33.4484, -112.074, CITY, 'Sonoran Desert'],
  ['seattle', 'Seattle', 'United States', 'North America', 47.6062, -122.3321, CITY, 'Pacific Northwest'],
  ['san-francisco', 'San Francisco', 'United States', 'North America', 37.7749, -122.4194, CITY, 'California coast'],
  ['denver', 'Denver', 'United States', 'North America', 39.7392, -104.9903, CITY, 'Rocky Mountain front'],
  ['vancouver', 'Vancouver', 'Canada', 'North America', 49.2827, -123.1207, CITY, 'Salish Sea'],
  ['toronto', 'Toronto', 'Canada', 'North America', 43.6532, -79.3832, CITY, 'Lake Ontario'],
  ['montreal', 'Montreal', 'Canada', 'North America', 45.5017, -73.5673, CITY, 'St. Lawrence valley'],
  ['mexico-city', 'Mexico City', 'Mexico', 'North America', 19.4326, -99.1332, CITY, 'Mexican plateau'],
  ['anchorage', 'Anchorage', 'United States', 'Polar', 61.2181, -149.9003, CITY, 'Cook Inlet'],
  ['fairbanks', 'Fairbanks', 'United States', 'Polar', 64.8378, -147.7164, CITY, 'Interior Alaska'],
  ['honolulu', 'Honolulu', 'United States', 'Oceania', 21.3069, -157.8583, CITY, 'Hawaiian Islands'],
  ['death-valley', 'Death Valley', 'United States', 'North America', 36.5323, -116.9325, SITE, 'Extreme arid heat'],
  ['mauna-loa', 'Mauna Loa Observatory', 'United States', 'Oceania', 19.5362, -155.5763, SITE, 'Atmospheric baseline'],
  ['panama-city', 'Panama City', 'Panama', 'Central America & Caribbean', 8.9824, -79.5199, CITY, 'Isthmus of Panama'],
  ['san-juan', 'San Juan', 'Puerto Rico', 'Central America & Caribbean', 18.4655, -66.1057, CITY, 'Caribbean coast'],
  ['havana', 'Havana', 'Cuba', 'Central America & Caribbean', 23.1136, -82.3666, CITY, 'Cuban coast'],
  ['guatemala-city', 'Guatemala City', 'Guatemala', 'Central America & Caribbean', 14.6349, -90.5069, CITY, 'Central American highlands'],
  ['nuuk', 'Nuuk', 'Greenland', 'Polar', 64.1836, -51.7214, CITY, 'Greenland coast'],
  ['summit-station', 'Summit Station', 'Greenland', 'Polar', 72.5796, -38.4592, SITE, 'Ice sheet interior'],
  ['alert', 'Alert', 'Canada', 'Polar', 82.5018, -62.3481, SITE, 'High Arctic baseline'],

  // South America
  ['sao-paulo', 'São Paulo', 'Brazil', 'South America', -23.5505, -46.6333, CITY, 'Atlantic plateau'],
  ['rio-de-janeiro', 'Rio de Janeiro', 'Brazil', 'South America', -22.9068, -43.1729, CITY, 'Atlantic coast'],
  ['buenos-aires', 'Buenos Aires', 'Argentina', 'South America', -34.6037, -58.3816, CITY, 'Pampas coast'],
  ['santiago', 'Santiago', 'Chile', 'South America', -33.4489, -70.6693, CITY, 'Andean valley'],
  ['lima', 'Lima', 'Peru', 'South America', -12.0464, -77.0428, CITY, 'Pacific desert coast'],
  ['bogota', 'Bogotá', 'Colombia', 'South America', 4.711, -74.0721, CITY, 'Andean highlands'],
  ['quito', 'Quito', 'Ecuador', 'South America', -0.1807, -78.4678, CITY, 'Equatorial Andes'],
  ['caracas', 'Caracas', 'Venezuela', 'South America', 10.4806, -66.9036, CITY, 'Caribbean Andes'],
  ['manaus', 'Manaus', 'Brazil', 'South America', -3.119, -60.0217, CITY, 'Amazon rainforest'],
  ['belem', 'Belém', 'Brazil', 'South America', -1.4558, -48.5044, CITY, 'Amazon estuary'],
  ['brasilia', 'Brasília', 'Brazil', 'South America', -15.7975, -47.8919, CITY, 'Cerrado plateau'],
  ['la-paz', 'La Paz', 'Bolivia', 'South America', -16.4897, -68.1193, CITY, 'Altiplano'],
  ['ushuaia', 'Ushuaia', 'Argentina', 'South America', -54.8019, -68.303, CITY, 'Tierra del Fuego'],
  ['montevideo', 'Montevideo', 'Uruguay', 'South America', -34.9011, -56.1645, CITY, 'Río de la Plata'],
  ['asuncion', 'Asunción', 'Paraguay', 'South America', -25.2637, -57.5759, CITY, 'Paraguay River'],
  ['calama', 'Calama', 'Chile', 'South America', -22.4544, -68.9294, SITE, 'Atacama Desert'],
  ['atto', 'ATTO Tower', 'Brazil', 'South America', -2.1459, -59.003, SITE, 'Amazon tall tower'],

  // Oceania & Antarctica
  ['sydney', 'Sydney', 'Australia', 'Oceania', -33.8688, 151.2093, CITY, 'Tasman Sea'],
  ['melbourne', 'Melbourne', 'Australia', 'Oceania', -37.8136, 144.9631, CITY, 'Southern Australia'],
  ['brisbane', 'Brisbane', 'Australia', 'Oceania', -27.4698, 153.0251, CITY, 'Subtropical east coast'],
  ['perth', 'Perth', 'Australia', 'Oceania', -31.9523, 115.8613, CITY, 'Southwest Australia'],
  ['darwin', 'Darwin', 'Australia', 'Oceania', -12.4634, 130.8456, CITY, 'Tropical north'],
  ['cape-grim', 'Cape Grim', 'Australia', 'Oceania', -40.6828, 144.6897, SITE, 'Atmospheric baseline'],
  ['townsville', 'Townsville (Reef)', 'Australia', 'Oceania', -19.2589, 146.8169, SITE, 'Great Barrier Reef'],
  ['auckland', 'Auckland', 'New Zealand', 'Oceania', -36.8485, 174.7633, CITY, 'Hauraki Gulf'],
  ['wellington', 'Wellington', 'New Zealand', 'Oceania', -41.2865, 174.7762, CITY, 'Cook Strait'],
  ['suva', 'Suva', 'Fiji', 'Oceania', -18.1416, 178.4419, CITY, 'South Pacific'],
  ['south-pole', 'South Pole', 'Antarctica', 'Polar', -89.98, 0, SITE, 'Antarctic plateau'],
  ['rothera', 'Rothera', 'Antarctica', 'Polar', -67.5675, -68.127, SITE, 'Antarctic Peninsula'],
  ['mcMurdo', 'McMurdo Station', 'Antarctica', 'Polar', -77.8419, 166.6863, SITE, 'Ross Sea']
];

export const locations = rows.map(([id, name, admin, region, lat, lon, type, note, aliases]) => ({
  id,
  name,
  admin,
  region,
  lat,
  lon,
  type,
  note: note || null,
  aliases: aliases || null
}));

const SUGGESTED_IDS = [
  'abuja',
  'longyearbyen',
  'manaus',
  'mauna-loa',
  'london',
  'new-york',
  'tokyo',
  'south-pole'
];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function searchLocations(query, limit = 8) {
  const needle = normalize(query);
  if (!needle) {
    return SUGGESTED_IDS.map((id) => locations.find((location) => location.id === id)).filter(Boolean);
  }

  const scored = [];
  for (const location of locations) {
    const name = normalize(location.name);
    const admin = normalize(location.admin);
    const region = normalize(location.region);
    const aliases = normalize(location.aliases);
    let score = null;

    if (name.startsWith(needle)) score = 0;
    else if (name.includes(needle)) score = 1;
    else if (admin.startsWith(needle)) score = 2;
    else if (aliases.includes(needle)) score = 3;
    else if (region.includes(needle)) score = 4;
    else if (normalize(location.note).includes(needle)) score = 5;

    if (score !== null) scored.push({ location, score });
  }

  scored.sort((a, b) => a.score - b.score || a.location.name.localeCompare(b.location.name));
  return scored.slice(0, limit).map((entry) => entry.location);
}

export function findLocationForCoords(latitude, longitude, tolerance = 0.0002) {
  return (
    locations.find(
      (location) =>
        Math.abs(location.lat - Number(latitude)) <= tolerance &&
        Math.abs(location.lon - Number(longitude)) <= tolerance
    ) || null
  );
}
