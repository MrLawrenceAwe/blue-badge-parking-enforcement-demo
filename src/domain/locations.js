export function parseCoordinates(value) {
  const [lat, lon] = value.split(',').map((part) => Number(part.trim()));
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { lat, lon };
}

export function distanceInKm(firstCoordinates, secondCoordinates) {
  const firstPoint = parseCoordinates(firstCoordinates);
  const secondPoint = parseCoordinates(secondCoordinates);
  if (!firstPoint || !secondPoint) return 0;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(secondPoint.lat - firstPoint.lat);
  const deltaLon = toRadians(secondPoint.lon - firstPoint.lon);
  const lat1 = toRadians(firstPoint.lat);
  const lat2 = toRadians(secondPoint.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function gpsForKnownLocation(location) {
  const lookup = [
    ['Oxford Street', '51.5152, -0.1419'],
    ['Bermondsey Street', '51.5009, -0.0811'],
    ['Euston Road', '51.5286, -0.1339'],
    ['Charing Cross', '51.5080, -0.1247'],
    ['Heathrow', '51.4700, -0.4543']
  ];
  return lookup.find(([place]) => location.toLowerCase().includes(place.toLowerCase()))?.[1] ?? '51.5072, -0.1276';
}
