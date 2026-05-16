import { useEffect, useMemo, useState } from 'react';
import { initialAuditEvents, initialScans, initialSessions } from '../data/demoActivity';
import { initialBadges } from '../data/demoBadges';
import { initialCases, initialNotifications, initialReplacementRequests } from '../data/demoCases';
import { createSignedSessionRecord } from '../domain/sessionProofs';
import { defaultRiskRules } from '../domain/risk';
import { buildRiskByBadge, selectActiveSessions, selectOpenCases } from '../domain/enforcementSelectors';
import { formatRecordId } from '../domain/ids';
import { createBrowserEnforcementRepository } from '../services/enforcementRepository';
import { timestampNow } from '../utils/date';

const STORE_KEY = 'blue-badge-enforcement-demo-state-v1';

function initialDemoState() {
  return {
    badges: initialBadges,
    sessions: initialSessions.map((session) => ({ ...session, locked: true })),
    scans: initialScans,
    cases: initialCases,
    auditEvents: initialAuditEvents,
    notifications: initialNotifications,
    replacementRequests: initialReplacementRequests,
    riskRules: defaultRiskRules,
  };
}

const enforcementRepository = createBrowserEnforcementRepository({
  storageKey: STORE_KEY,
  initialState: initialDemoState,
});

export function useDemoEnforcementStore(currentActor = 'System') {
  const storedState = useMemo(() => enforcementRepository.load(), []);
  const [badges, setBadges] = useState(storedState.badges);
  const [sessions, setSessions] = useState(storedState.sessions);
  const [scans, setScans] = useState(storedState.scans);
  const [cases, setCases] = useState(storedState.cases);
  const [auditEvents, setAuditEvents] = useState(storedState.auditEvents);
  const [notifications, setNotifications] = useState(storedState.notifications);
  const [replacementRequests, setReplacementRequests] = useState(storedState.replacementRequests);
  const [riskRules, setRiskRules] = useState(storedState.riskRules);

  useEffect(() => {
    let cancelled = false;
    Promise.all(sessions.map((session) => createSignedSessionRecord({ ...session, locked: true }))).then(
      (signedSessions) => {
        if (cancelled) return;
        setSessions((current) => {
          const signedById = new Map(signedSessions.map((session) => [session.id, session]));
          const currentIds = new Set(current.map((session) => session.id));
          return [
            ...current.map((session) => signedById.get(session.id) ?? session),
            ...signedSessions.filter((session) => !currentIds.has(session.id)),
          ];
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    enforcementRepository.save({
      badges,
      sessions,
      scans,
      cases,
      auditEvents,
      notifications,
      replacementRequests,
      riskRules,
    });
  }, [badges, sessions, scans, cases, auditEvents, notifications, replacementRequests, riskRules]);

  const activeSessions = selectActiveSessions(sessions);
  const openCases = selectOpenCases(cases);
  const riskByBadge = useMemo(() => {
    return buildRiskByBadge({ badges, sessions, scans, riskRules });
  }, [badges, sessions, scans, riskRules]);

  function appendAuditEvent({ badgeId, type, actor = currentActor, detail }) {
    setAuditEvents((current) => [
      {
        id: formatRecordId('AUD-', 1000 + current.length + 1),
        badgeId,
        type,
        actor,
        time: timestampNow(),
        detail,
      },
      ...current,
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
        message,
      },
      ...current,
    ]);
  }

  async function resetDemoState() {
    const nextState = enforcementRepository.reset();
    const signedSessions = await Promise.all(
      nextState.sessions.map((session) => createSignedSessionRecord({ ...session, locked: true })),
    );
    setBadges(nextState.badges);
    setSessions(signedSessions);
    setScans(nextState.scans);
    setCases(nextState.cases);
    setAuditEvents(nextState.auditEvents);
    setNotifications(nextState.notifications);
    setReplacementRequests(nextState.replacementRequests);
    setRiskRules(nextState.riskRules);
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
    appendAuditEvent,
    resetDemoState,
  };
}
