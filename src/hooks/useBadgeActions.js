import { useState } from 'react';
import { canStartSessionForBadge, normaliseVehicle, statusLabel } from '../domain/badges';
import { createStolenBadgeCase } from '../domain/cases';
import { gpsForKnownLocation } from '../domain/locations';
import { hasPermission, PERMISSIONS } from '../domain/permissions';
import { createSignedSessionRecord, createSessionId } from '../domain/sessionProofs';
import { buildSessionPayload, isSessionActive } from '../domain/sessions';
import { nextRecordId } from '../domain/ids';
import { timestampNow } from '../utils/date';

export function useBadgeActions({
  authUser,
  role,
  selectedBadge,
  sessions,
  setSessions,
  setBadges,
  setCases,
  setReplacementRequests,
  appendAuditEvent,
  queueNotification,
}) {
  const [badgeNotice, setBadgeNotice] = useState('');
  const [replacementDraft, setReplacementDraft] = useState({ reference: '', temporaryPermit: 'Requested' });

  function canManageSelectedBadge() {
    return hasPermission({
      authUser,
      activeRole: role,
      permission: PERMISSIONS.manageOwnBadge,
      badgeId: selectedBadge.id,
    });
  }

  async function startSession(formData) {
    if (!canManageSelectedBadge()) {
      setBadgeNotice('Only the holder or delegated carer for this badge can start a parking session.');
      return false;
    }
    if (!canStartSessionForBadge(selectedBadge.status)) {
      setBadgeNotice(
        `Sessions cannot be started while this badge is ${statusLabel[selectedBadge.status].toLowerCase()}.`,
      );
      return false;
    }
    if (sessions.some((session) => session.badgeId === selectedBadge.id && isSessionActive(session))) {
      setBadgeNotice('A locked active session already exists for this badge.');
      return false;
    }

    const location = formData.get('location').toString();
    const session = await createSignedSessionRecord({
      id: createSessionId(),
      ...buildSessionPayload({
        badgeId: selectedBadge.id,
        vehicle: normaliseVehicle(formData.get('vehicle').toString()),
        location,
        gps: gpsForKnownLocation(location),
        startedAt: timestampNow(),
        durationMins: Number(formData.get('duration')),
      }),
    });
    setSessions((current) => [session, ...current]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Session started',
      actor: authUser.name,
      detail: `Locked session ${session.id} started at ${location} for ${session.durationMins} minutes.`,
    });
    setBadgeNotice('Session started and locked. Arrival details are signed for enforcement audit.');
    return true;
  }

  async function extendSession(sessionId, extraMins) {
    if (
      !hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageOwnBadge, badgeId: selectedBadge.id })
    ) {
      setBadgeNotice('Only the holder or delegated carer can extend a parking session.');
      return;
    }
    const session = sessions.find((sessionRecord) => sessionRecord.id === sessionId);
    if (!session || !authUser.badgeIds.includes(session.badgeId)) {
      setBadgeNotice('This session is not available to the signed-in user.');
      return;
    }
    const updatedSession = await createSignedSessionRecord({
      ...session,
      durationMins: Math.min(session.durationMins + extraMins, 240),
    });
    setSessions((current) =>
      current.map((sessionRecord) => (sessionRecord.id === sessionId ? updatedSession : sessionRecord)),
    );
    appendAuditEvent({
      badgeId: session.badgeId,
      type: 'Session extended',
      actor: authUser.name,
      detail: `Session ${sessionId} extended to ${updatedSession.durationMins} minutes.`,
    });
    setBadgeNotice(
      updatedSession.durationMins === session.durationMins
        ? 'This session is already at the 4 hour maximum.'
        : 'Session extended and re-signed.',
    );
  }

  async function endSession(sessionId) {
    if (
      !hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageOwnBadge, badgeId: selectedBadge.id })
    ) {
      setBadgeNotice('Only the holder or delegated carer can end a parking session.');
      return;
    }
    const session = sessions.find((sessionRecord) => sessionRecord.id === sessionId);
    if (!session || !authUser.badgeIds.includes(session.badgeId)) {
      setBadgeNotice('This session is not available to the signed-in user.');
      return;
    }
    const endedSession = await createSignedSessionRecord({ ...session, endedAt: timestampNow() });
    setSessions((current) =>
      current.map((sessionRecord) => (sessionRecord.id === sessionId ? endedSession : sessionRecord)),
    );
    appendAuditEvent({
      badgeId: session.badgeId,
      type: 'Session ended',
      actor: authUser.name,
      detail: `Session ${sessionId} ended by ${authUser.name}.`,
    });
    setBadgeNotice('Session ended. The signed arrival record remains available for audit.');
  }

  function reportStolen(formData) {
    if (!canManageSelectedBadge()) {
      setBadgeNotice('Only the holder or delegated carer for this badge can report it stolen.');
      return false;
    }
    if (selectedBadge.status === 'stolen') {
      setBadgeNotice('This badge has already been reported stolen.');
      return false;
    }
    const details = formData?.get('details')?.toString().trim();
    const contact = formData?.get('contact')?.toString().trim();
    const confirmed = formData?.get('confirmed') === 'yes';
    if (!details || !contact || !confirmed) {
      setBadgeNotice('Confirm the deactivation and provide incident details before reporting the badge stolen.');
      return false;
    }
    setBadgeNotice(
      'Badge reported stolen. New sessions are blocked and officer scans will show a deactivated high-priority status.',
    );
    setBadges((current) =>
      current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'stolen' } : badge)),
    );
    setCases((current) => [
      createStolenBadgeCase({
        id: nextRecordId(current, 'CASE-', 4199),
        badge: selectedBadge,
        details,
        contact,
        addedBy: authUser.name,
        addedAt: timestampNow(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      }),
      ...current,
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Badge deactivated',
      actor: authUser.name,
      detail: `Holder/carer stolen report confirmed. Contact: ${contact}.`,
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: 'Your badge has been deactivated after a stolen badge report. A review case has been opened.',
    });
    return true;
  }

  function requestReplacementBadge(formData) {
    if (!canManageSelectedBadge()) {
      setBadgeNotice('Only the holder or delegated carer for this badge can request a replacement.');
      return false;
    }
    if (selectedBadge.status !== 'stolen') {
      setBadgeNotice('Replacement requests are available after a badge has been reported stolen.');
      return false;
    }
    const reference = formData.get('reference').toString().trim();
    const temporaryPermit = formData.get('temporaryPermit').toString();
    if (!reference) {
      setBadgeNotice('Add a crime, loss, or council reference before requesting a replacement.');
      return false;
    }
    setReplacementRequests((current) => [
      {
        id: nextRecordId(current, 'REP-', 1000),
        badgeId: selectedBadge.id,
        status: 'Pending evidence review',
        requestedAt: timestampNow(),
        reference,
        temporaryPermit,
      },
      ...current,
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Replacement requested',
      actor: authUser.name,
      detail: `Replacement requested with reference ${reference}; temporary permit ${temporaryPermit.toLowerCase()}.`,
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: `Replacement request received. Reference: ${reference}.`,
    });
    setReplacementDraft({ reference: '', temporaryPermit: 'Requested' });
    setBadgeNotice('Replacement request recorded and notification queued.');
    return true;
  }

  return {
    badgeNotice,
    replacementDraft,
    setReplacementDraft,
    startSession,
    extendSession,
    endSession,
    reportStolen,
    requestReplacementBadge,
  };
}
