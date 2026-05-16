import { isCaseOpen } from './cases';
import { evaluateBadgeRisk } from './risk';
import { isSessionActive } from './sessions';

export function selectActiveSessions(sessions) {
  return sessions.filter((session) => isSessionActive(session));
}

export function selectOpenCases(cases) {
  return cases.filter(isCaseOpen);
}

export function buildRiskByBadge({ badges, sessions, scans, riskRules }) {
  return Object.fromEntries(badges.map((badge) => [badge.id, evaluateBadgeRisk(badge, sessions, scans, {}, riskRules)]));
}
