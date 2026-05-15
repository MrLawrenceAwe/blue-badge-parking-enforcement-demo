export function buildSessionPayload({ badgeId, vehicle, location, gps, startedAt, durationMins }) {
  return {
    badgeId,
    vehicle,
    location,
    gps,
    startedAt,
    durationMins
  };
}

export function isSessionActive(session, now = new Date()) {
  if (!session.locked) return false;
  const startedAt = new Date(session.startedAt);
  const endsAt = new Date(startedAt.getTime() + session.durationMins * 60000);
  return endsAt > now;
}
