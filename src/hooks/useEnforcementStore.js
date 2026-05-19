import { useEffect, useMemo, useState } from 'react';
import { initialAuditEvents, initialScans, initialSessions } from '../data/demoActivity';
import { initialBadges } from '../data/demoBadges';
import { initialCases, initialNotifications, initialReplacementRequests } from '../data/demoCases';
import { createSignedSessionRecord } from '../domain/sessionProofs';
import { defaultVerificationScoringRules } from '../domain/verification';
import { buildVerificationByBadge, selectActiveSessions, selectOpenCases } from '../domain/enforcementSelectors';
import { nextRecordId } from '../domain/ids';
import { createBrowserEnforcementRepository } from '../services/enforcementRepository';
import { timestampNow } from '../utils/date';

const STORE_KEY = 'blue-badge-enforcement-demo-state-v2';
const LEGACY_STORE_KEYS = ['blue-badge-enforcement-demo-state-v1'];

function initialEnforcementState() {
  return {
    badges: initialBadges,
    sessions: initialSessions.map((session) => ({ ...session, locked: true })),
    scans: initialScans,
    cases: initialCases,
    auditEvents: initialAuditEvents,
    notifications: initialNotifications,
    replacementRequests: initialReplacementRequests,
    verificationRules: defaultVerificationScoringRules,
  };
}

export function migratePersistedEnforcementState(storedState) {
  const initialState = initialEnforcementState();
  const nextState = {
    ...initialState,
    ...storedState,
    verificationRules: {
      ...initialState.verificationRules,
      ...(storedState?.riskRules ?? {}),
      ...(storedState?.verificationRules ?? {}),
    },
  };
  nextState.cases = (storedState?.cases ?? initialState.cases).map((caseRecord) => ({
    ...caseRecord,
    status: normaliseCaseStatus(caseRecord.status),
    assignedTeam: caseRecord.assignedTeam ?? caseRecord.assignedTo ?? caseRecord.assignee ?? 'Unassigned',
  }));
  delete nextState.riskRules;
  return nextState;
}

function normaliseCaseStatus(status) {
  if (status === 'Officer review') return 'Needs review';
  if (status === 'High priority') return 'High-priority';
  return status;
}

const enforcementRepository = createBrowserEnforcementRepository({
  storageKey: STORE_KEY,
  initialState: initialEnforcementState,
  legacyStorageKeys: LEGACY_STORE_KEYS,
  migrateState: migratePersistedEnforcementState,
});

export function useEnforcementStore(currentActor = 'System') {
  const storedState = useMemo(() => enforcementRepository.load(), []);
  const [badges, setBadges] = useState(storedState.badges);
  const [sessions, setSessions] = useState(storedState.sessions);
  const [scans, setScans] = useState(storedState.scans);
  const [cases, setCases] = useState(storedState.cases);
  const [auditEvents, setAuditEvents] = useState(storedState.auditEvents);
  const [notifications, setNotifications] = useState(storedState.notifications);
  const [replacementRequests, setReplacementRequests] = useState(storedState.replacementRequests);
  const [verificationRules, setVerificationRules] = useState(storedState.verificationRules);

  useEffect(() => {
    let cancelled = false;
    const unsignedSessions = sessions.filter((session) => !session.proof);
    Promise.all(unsignedSessions.map((session) => createSignedSessionRecord({ ...session, locked: true }))).then(
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
      verificationRules,
    });
  }, [badges, sessions, scans, cases, auditEvents, notifications, replacementRequests, verificationRules]);

  const activeSessions = selectActiveSessions(sessions);
  const openCases = selectOpenCases(cases);
  const verificationByBadge = useMemo(() => {
    return buildVerificationByBadge({ badges, sessions, scans, verificationRules });
  }, [badges, sessions, scans, verificationRules]);

  function appendAuditEvent({ badgeId, type, actor = currentActor, detail }) {
    setAuditEvents((current) => [
      {
        id: nextRecordId(current, 'AUD-', 1000),
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
        id: nextRecordId(current, 'NOT-', 1000),
        badgeId,
        recipient,
        channel,
        time: timestampNow(),
        message,
      },
      ...current,
    ]);
  }

  async function resetEnforcementState() {
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
    setVerificationRules(nextState.verificationRules);
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
    verificationRules,
    setVerificationRules,
    verificationByBadge,
    appendAuditEvent,
    resetEnforcementState,
  };
}
