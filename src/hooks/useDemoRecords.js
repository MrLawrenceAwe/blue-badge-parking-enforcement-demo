import { useEffect, useMemo, useState } from 'react';
import {
  initialAuditEvents,
  initialScans,
  initialSessions
} from '../data/demoActivity';
import { initialBadges } from '../data/demoBadges';
import {
  initialCases,
  initialNotifications,
  initialReplacementRequests
} from '../data/demoCases';
import { evaluateBadgeRisk } from '../domain/risk';
import { createDemoAttestedSession } from '../domain/sessionProofs';
import { isCaseOpen } from '../domain/cases';
import { isSessionActive } from '../domain/sessions';
import { defaultRiskRules } from '../domain/risk';
import { formatRecordId } from '../domain/ids';
import { timestampNow } from '../utils/date';

export function useDemoRecords(currentActor = 'System') {
  const [badges, setBadges] = useState(initialBadges);
  const [sessions, setSessions] = useState(() => initialSessions.map((session) => ({ ...session, locked: true })));
  const [scans, setScans] = useState(initialScans);
  const [cases, setCases] = useState(initialCases);
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [replacementRequests, setReplacementRequests] = useState(initialReplacementRequests);
  const [riskRules, setRiskRules] = useState(defaultRiskRules);

  useEffect(() => {
    let cancelled = false;
    Promise.all(initialSessions.map((session) => createDemoAttestedSession({ ...session, locked: true }))).then((signedSessions) => {
      if (cancelled) return;
      setSessions((current) => {
        const signedById = new Map(signedSessions.map((session) => [session.id, session]));
        const currentIds = new Set(current.map((session) => session.id));
        return [
          ...current.map((session) => signedById.get(session.id) ?? session),
          ...signedSessions.filter((session) => !currentIds.has(session.id))
        ];
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSessions = sessions.filter((session) => isSessionActive(session));
  const openCases = cases.filter(isCaseOpen);
  const riskByBadge = useMemo(() => {
    return Object.fromEntries(badges.map((badge) => [badge.id, evaluateBadgeRisk(badge, sessions, scans, {}, riskRules)]));
  }, [badges, sessions, scans, riskRules]);

  function appendAuditEvent({ badgeId, type, actor = currentActor, detail }) {
    setAuditEvents((current) => [
      {
        id: formatRecordId('AUD-', 1000 + current.length + 1),
        badgeId,
        type,
        actor,
        time: timestampNow(),
        detail
      },
      ...current
    ]);
  }

  function queueNotification({ badgeId, recipient, channel = 'Email', message }) {
    setNotifications((current) => [
      {
        id: formatRecordId('NOT-', 1000 + current.length + 1),
        badgeId,
        recipient,
        channel,
        time: timestampNow(),
        message
      },
      ...current
    ]);
  }

  return {
    badges,
    setBadges,
    sessions,
    setSessions,
    activeSessions,
    scans,
    setScans,
    cases,
    setCases,
    openCases,
    auditEvents,
    notifications,
    queueNotification,
    replacementRequests,
    setReplacementRequests,
    riskRules,
    setRiskRules,
    riskByBadge,
    appendAuditEvent
  };
}
