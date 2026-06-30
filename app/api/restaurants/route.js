import { NextResponse } from 'next/server';

function getDistance(lat1, lng1, lat2, lng2) {
  const R  = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lat    = searchParams.get('lat');
  const lng    = searchParams.get('lng');
  const radius = searchParams.get('radius') || '2000';

  if (!lat || !lng)
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:${radius},${lat},${lng});
      node["amenity"="cafe"](around:${radius},${lat},${lng});
      node["amenity"="fast_food"](around:${radius},${lat},${lng});
      node["amenity"="food_court"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok)
    return NextResponse.json({ error: 'Overpass API failed' }, { status: 502 });

  const data = await res.json();
  const restaurants = data.elements
    .map(el => ({
      id:           el.id,
      name:         el.tags?.name || el.tags?.['name:en'] || '',
      type:         el.tags?.amenity || 'restaurant',
      cuisine:      el.tags?.cuisine || '',
      address:      [el.tags?.['addr:street'], el.tags?.['addr:housenumber'], el.tags?.['addr:city']].filter(Boolean).join(', '),
      openingHours: el.tags?.opening_hours || '',
      lat:          el.lat,
      lng:          el.lon,
      distance:     getDistance(parseFloat(lat), parseFloat(lng), el.lat, el.lon),
    }))
    .filter(r => r.name)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 15);

  return NextResponse.json({ restaurants });
}
