import { isCaseOpen } from './cases';
import { isSessionActive } from './sessions';
import { riskBandLabels } from './risk';

export function filterAdminBadges({ badges, sessions, scans, filters, riskByBadge }) {
  return badges.filter((badge) => {
    const risk = riskByBadge[badge.id];
    const relatedSessions = sessions.filter((session) => session.badgeId === badge.id);
    const relatedScans = scans.filter((scan) => scan.badgeId === badge.id);
    const searchableText = [
      badge.id,
      badge.holder,
      badge.vehicle,
      badge.council,
      badge.status,
      riskBandLabels[risk.riskBand],
      risk.score,
      ...relatedSessions.flatMap((session) => [session.location, session.startedAt]),
      ...relatedScans.flatMap((scan) => [scan.location, scan.time, scan.scanOutcome])
    ].join(' ').toLowerCase();
    const activityRecords = [...relatedSessions, ...relatedScans];
    const matchesSearch = searchableText.includes(filters.search.toLowerCase());
    const matchesRisk = filters.risk === 'all' || risk.riskBand === filters.risk;
    const matchesLocation = !filters.location || activityRecords.some((activityRecord) => activityRecord.location?.toLowerCase().includes(filters.location.toLowerCase()));
    const matchesDate = !filters.date || activityRecords.some((activityRecord) => activityRecord.startedAt?.startsWith(filters.date) || activityRecord.time?.startsWith(filters.date));
    const matchesStatus = filters.badgeStatus === 'all' || badge.status === filters.badgeStatus;
    return matchesSearch && matchesRisk && matchesLocation && matchesDate && matchesStatus;
  });
}

export function buildAdminRecordView({ badges, sessions, scans, cases, filters, riskByBadge, selectedBadgeId }) {
  const filteredBadges = filterAdminBadges({ badges, sessions, scans, filters, riskByBadge });
  const filteredBadgeIds = new Set(filteredBadges.map((badge) => badge.id));
  const knownBadgeIds = new Set(badges.map((badge) => badge.id));
  const filteredCases = cases.filter((caseRecord) => filteredBadgeIds.has(caseRecord.badgeId) || !knownBadgeIds.has(caseRecord.badgeId));

  return {
    filteredBadges,
    filteredActiveSessions: sessions.filter((session) => isSessionActive(session) && filteredBadgeIds.has(session.badgeId)),
    filteredScans: scans.filter((scan) => filteredBadgeIds.has(scan.badgeId)),
    selectedBadgeCases: filteredCases.filter((caseRecord) => caseRecord.badgeId === selectedBadgeId),
    reviewQueueCases: filteredCases.filter((caseRecord) => {
      const risk = riskByBadge[caseRecord.badgeId];
      return isCaseOpen(caseRecord) && (risk?.score >= 31 || ['Officer review', 'High priority', 'Evidence requested'].includes(caseRecord.status));
    }),
    suspendedOrStolenBadges: filteredBadges.filter((badge) => ['stolen', 'suspended'].includes(badge.status))
  };
}
