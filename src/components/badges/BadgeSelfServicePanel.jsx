import { BadgeNotifications } from './BadgeNotifications';
import { ReplacementRequestForm } from '../replacements/ReplacementRequestForm';
import { SessionCard } from '../sessions/SessionCard';
import { SessionStartForm } from '../sessions/SessionStartForm';
import { StolenReportForm } from '../common/StolenReportForm';

export function BadgeSelfServicePanel({
  badge,
  activeSession,
  sessionMessage,
  startSession,
  extendSession,
  endSession,
  reportStolen,
  requestReplacementBadge,
  replacementForm,
  replacementRequests,
  notifications,
  showActiveSession = true,
  showNotifications = true,
  showTemporaryPermit = true
}) {
  return (
    <>
      <SessionStartForm badge={badge} activeSession={activeSession} startSession={startSession} extendSession={extendSession} endSession={endSession} />
      {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
      {showActiveSession && activeSession && <SessionCard session={activeSession} />}
      <StolenReportForm reportStolen={reportStolen} />
      {badge.status === 'stolen' && (
        <ReplacementRequestForm
          replacementForm={replacementForm}
          replacementRequests={replacementRequests}
          requestReplacementBadge={requestReplacementBadge}
          showTemporaryPermit={showTemporaryPermit}
        />
      )}
      {showNotifications && <BadgeNotifications notifications={notifications} />}
    </>
  );
}
