import { useState } from 'react';
import { canStartSessionForBadge, normaliseVehicle, statusLabel } from '../domain/badges';
import { createStolenBadgeCase } from '../domain/cases';
import { demoGpsForLocation } from '../domain/locations';
import { createDemoAttestedSession, createSessionId } from '../domain/sessionProofs';
import { buildSessionPayload, isSessionActive } from '../domain/sessions';
import { formatRecordId } from '../domain/ids';
import { timestampNow } from '../utils/date';

export function useBadgeAccountActions({
  authUser,
  role,
  selectedBadge,
  sessions,
  setSessions,
  setBadges,
  setCases,
  setReplacementRequests,
  appendAuditEvent,
  queueNotification
}) {
  const [accountNotice, setAccountNotice] = useState('');
  const [replacementDraft, setReplacementDraft] = useState({ reference: '', temporaryPermit: 'Requested' });

  function userCanManageSelectedBadge() {
    return ['holder', 'carer'].includes(authUser.role) && authUser.role === role && authUser.badgeIds.includes(selectedBadge.id);
  }

  async function startSession(formData) {
    if (!userCanManageSelectedBadge()) {
      setAccountNotice('Only the holder or delegated carer for this badge can start a parking session in the demo.');
      return false;
    }
    if (!canStartSessionForBadge(selectedBadge.status)) {
      setAccountNotice(`Sessions cannot be started while this badge is ${statusLabel[selectedBadge.status].toLowerCase()}.`);
      return false;
    }
    if (sessions.some((session) => session.badgeId === selectedBadge.id && isSessionActive(session))) {
      setAccountNotice('A locked active session already exists for this badge. End-of-session handling would be added in the production workflow.');
      return false;
    }

    const location = formData.get('location').toString();
    const session = await createDemoAttestedSession({
      id: createSessionId(),
      ...buildSessionPayload({
        badgeId: selectedBadge.id,
        vehicle: normaliseVehicle(formData.get('vehicle').toString()),
        location,
        gps: demoGpsForLocation(location),
        startedAt: timestampNow(),
        durationMins: Number(formData.get('duration'))
      })
    });
    setSessions((current) => [session, ...current]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Session started',
      actor: authUser.name,
      detail: `Locked session ${session.id} started at ${location} for ${session.durationMins} minutes.`
    });
    setAccountNotice('Session started and locked. Arrival time, GPS, vehicle, and duration are bound to a signed demo attestation and will flag as tampered if changed.');
    return true;
  }

  async function extendSession(sessionId, extraMins) {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role) {
      setAccountNotice('Only the holder or delegated carer can extend a parking session in the demo.');
      return;
    }
    const session = sessions.find((sessionRecord) => sessionRecord.id === sessionId);
    if (!session || !authUser.badgeIds.includes(session.badgeId)) {
      setAccountNotice('This session is not available to the signed-in user.');
      return;
    }
    const updatedSession = await createDemoAttestedSession({
      ...session,
      durationMins: Math.min(session.durationMins + extraMins, 240)
    });
    setSessions((current) => current.map((sessionRecord) => (sessionRecord.id === sessionId ? updatedSession : sessionRecord)));
    appendAuditEvent({
      badgeId: session.badgeId,
      type: 'Session extended',
      actor: authUser.name,
      detail: `Session ${sessionId} extended to ${updatedSession.durationMins} minutes.`
    });
    setAccountNotice(updatedSession.durationMins === session.durationMins
      ? 'This session is already at the maximum 4 hour duration.'
      : 'Session extended and re-signed. The original arrival details remain locked.');
  }

  function endSession(sessionId) {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role) {
      setAccountNotice('Only the holder or delegated carer can end a parking session in the demo.');
      return;
    }
    const session = sessions.find((sessionRecord) => sessionRecord.id === sessionId);
    if (!session || !authUser.badgeIds.includes(session.badgeId)) {
      setAccountNotice('This session is not available to the signed-in user.');
      return;
    }
    setSessions((current) => current.map((sessionRecord) => (sessionRecord.id === sessionId ? { ...sessionRecord, endedAt: timestampNow() } : sessionRecord)));
    appendAuditEvent({
      badgeId: session.badgeId,
      type: 'Session ended',
      actor: authUser.name,
      detail: `Session ${sessionId} ended by ${authUser.name}.`
    });
    setAccountNotice('Session ended. The signed arrival record remains available for enforcement audit.');
  }

  function reportStolen(formData) {
    if (!userCanManageSelectedBadge()) {
      setAccountNotice('Only the holder or delegated carer for this badge can report it stolen in the demo.');
      return false;
    }
    const details = formData?.get('details')?.toString().trim();
    const contact = formData?.get('contact')?.toString().trim();
    const confirmed = formData?.get('confirmed') === 'yes';
    if (!details || !contact || !confirmed) {
      setAccountNotice('Confirm the deactivation and provide incident details before reporting the badge stolen.');
      return false;
    }
    setAccountNotice('Badge reported stolen. The badge is now deactivated for new parking sessions and will return a black high-risk result to officers.');
    setBadges((current) => current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'stolen' } : badge)));
    setCases((current) => [
      createStolenBadgeCase({
        id: formatRecordId('CASE-', 4200 + current.length),
        badge: selectedBadge,
        details,
        contact,
        addedBy: authUser.name,
        addedAt: timestampNow(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      }),
      ...current
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Badge deactivated',
      actor: authUser.name,
      detail: `Holder/carer stolen report confirmed. Contact: ${contact}.`
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: 'Your badge has been deactivated after a stolen badge report. A risk review case has been opened.'
    });
    return true;
  }

  function requestReplacementBadge(formData) {
    if (!userCanManageSelectedBadge()) {
      setAccountNotice('Only the holder or delegated carer for this badge can request a replacement in the demo.');
      return false;
    }
    if (selectedBadge.status !== 'stolen') {
      setAccountNotice('Replacement requests are available after a badge has been reported stolen.');
      return false;
    }
    const reference = formData.get('reference').toString().trim();
    const temporaryPermit = formData.get('temporaryPermit').toString();
    if (!reference) {
      setAccountNotice('Add a crime, loss, or council reference before requesting a replacement.');
      return false;
    }
    setReplacementRequests((current) => [
      {
        id: formatRecordId('REP-', 1000 + current.length + 1),
        badgeId: selectedBadge.id,
        status: 'Pending evidence review',
        requestedAt: timestampNow(),
        reference,
        temporaryPermit
      },
      ...current
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Replacement requested',
      actor: authUser.name,
      detail: `Replacement requested with reference ${reference}; temporary permit ${temporaryPermit.toLowerCase()}.`
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: `Replacement request received. Reference: ${reference}.`
    });
    setReplacementDraft({ reference: '', temporaryPermit: 'Requested' });
    setAccountNotice('Replacement request recorded and notification queued.');
    return true;
  }

  return {
    accountNotice,
    replacementDraft,
    setReplacementDraft,
    startSession,
    extendSession,
    endSession,
    reportStolen,
    requestReplacementBadge
  };
}
