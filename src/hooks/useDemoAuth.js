import { useState } from 'react';
import { accessibleBadgesFor, rolesForUser } from '../domain/badges';

export function useDemoAuth({ demoUsers, badges }) {
  const [role, setRole] = useState(demoUsers[0].role);
  const [authUser, setAuthUser] = useState(demoUsers[0]);
  const [selectedBadgeId, setSelectedBadgeId] = useState('BB-WCC-104928');

  const roleBadges = accessibleBadgesFor(authUser, badges);
  const selectedBadge = roleBadges.find((badge) => badge.id === selectedBadgeId) ?? roleBadges[0] ?? badges[0];

  function selectDemoUser(nextUser) {
    setAuthUser(nextUser);
    setRole(nextUser.role);
    setSelectedBadgeId(accessibleBadgesFor(nextUser, badges)[0]?.id ?? badges[0].id);
  }

  return {
    role,
    setRole,
    authUser,
    availableRoles: rolesForUser(authUser),
    roleBadges,
    selectedBadge,
    setSelectedBadgeId,
    selectDemoUser
  };
}
