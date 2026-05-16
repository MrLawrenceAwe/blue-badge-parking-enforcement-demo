export const statusLabel = {
  valid: 'Valid',
  expired: 'Expired',
  suspended: 'Suspended',
  stolen: 'Stolen',
  'under review': 'Under review'
};

export function normaliseVehicle(value) {
  return value.trim().toUpperCase();
}

export function vehicleSearchKey(value) {
  return normaliseVehicle(value).replace(/\s+/g, '');
}

export function canStartSessionForBadge(status) {
  return status === 'valid' || status === 'under review';
}

export function accessibleBadgesFor(user, badges) {
  if (user.role === 'admin' || user.role === 'officer') return badges;
  return badges.filter((badge) => user.badgeIds.includes(badge.id));
}

export function demoRolesForUser(user) {
  return [user.role];
}

export function labelForRole(role) {
  return {
    holder: 'Holder',
    carer: 'Carer',
    officer: 'Officer',
    admin: 'Admin'
  }[role] ?? role;
}
