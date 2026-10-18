// Cities users can pick for their stay, as "City, ST". Add more here.
// Matching only works within the same city, so keep names exactly as written.
const CITY_LIST = [
  'Atlanta, GA',
  'Austin, TX',
  'Baltimore, MD',
  'Boston, MA',
  'Boulder, CO',
  'Charlotte, NC',
  'Chicago, IL',
  'Cincinnati, OH',
  'Cleveland, OH',
  'Columbus, OH',
  'Dallas, TX',
  'Denver, CO',
  'Detroit, MI',
  'Houston, TX',
  'Indianapolis, IN',
  'Irvine, CA',
  'Jacksonville, FL',
  'Kansas City, MO',
  'Las Vegas, NV',
  'Los Angeles, CA',
  'Madison, WI',
  'Miami, FL',
  'Milwaukee, WI',
  'Minneapolis, MN',
  'Mountain View, CA',
  'Nashville, TN',
  'New Orleans, LA',
  'New York, NY',
  'Newark, NJ',
  'Oakland, CA',
  'Omaha, NE',
  'Orlando, FL',
  'Palo Alto, CA',
  'Philadelphia, PA',
  'Phoenix, AZ',
  'Pittsburgh, PA',
  'Portland, OR',
  'Raleigh, NC',
  'Redmond, WA',
  'Richmond, VA',
  'Sacramento, CA',
  'Salt Lake City, UT',
  'San Antonio, TX',
  'San Diego, CA',
  'San Francisco, CA',
  'San Jose, CA',
  'Santa Clara, CA',
  'Seattle, WA',
  'St. Louis, MO',
  'Sunnyvale, CA',
  'Tampa, FL',
  'Washington, DC',
];

export const CITIES = [...CITY_LIST].sort((a, b) => a.localeCompare(b));

// Cities whose name starts with what was typed, A–Z. Empty input shows nothing.
export function searchCities(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CITIES.filter((c) => c.toLowerCase().startsWith(q));
}

export function isKnownCity(city: string | null | undefined): city is string {
  return !!city && CITIES.includes(city);
}
