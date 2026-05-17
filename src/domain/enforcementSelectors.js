import { isCaseOpen } from './cases';
import { assessBadgeVerification } from './risk';
import { isSessionActive } from './sessions';

export function selectActiveSessions(sessions) {
  return sessions.filter((session) => isSessionActive(session));
}

export function selectOpenCases(cases) {
  return cases.filter(isCaseOpen);
}

export function buildVerificationByBadge({ badges, sessions, scans, riskRules }) {
  return Object.fromEntries(
    badges.map((badge) => [badge.id, assessBadgeVerification(badge, sessions, scans, {}, riskRules)]),
  );
}
