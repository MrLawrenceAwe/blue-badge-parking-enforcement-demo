import { isCaseOpen } from './cases';
import { assessBadgeVerificationRisk } from './verification';
import { isSessionActive } from './sessions';

export function selectActiveSessions(sessions) {
  return sessions.filter((session) => isSessionActive(session));
}

export function selectOpenCases(cases) {
  return cases.filter(isCaseOpen);
}

export function buildVerificationByBadge({ badges, sessions, scans, verificationRules }) {
  return Object.fromEntries(
    badges.map((badge) => [badge.id, assessBadgeVerificationRisk(badge, sessions, scans, {}, verificationRules)]),
  );
}
