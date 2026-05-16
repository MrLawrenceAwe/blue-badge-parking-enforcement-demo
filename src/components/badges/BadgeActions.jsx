import { BadgeNotifications } from './BadgeNotifications';
import { StolenReportForm } from './StolenReportForm';
import { ReplacementRequestForm } from '../replacements/ReplacementRequestForm';
import { SessionCard } from '../sessions/SessionCard';
import { SessionStartForm } from '../sessions/SessionStartForm';

export function BadgeActions({
  badge,
  activeSession,
  sessionMessage,
  badgeActions,
  replacementForm,
  replacementRequests,
  notifications,
  showActiveSession = true,
  showNotifications = true,
  showTemporaryPermit = true
}) {
  return (
    <>
      <SessionStartForm
        badge={badge}
        activeSession={activeSession}
        startSession={badgeActions.startSession}
        extendSession={badgeActions.extendSession}
        endSession={badgeActions.endSession}
      />
      {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
      {showActiveSession && activeSession && <SessionCard session={activeSession} />}
      <StolenReportForm reportStolen={badgeActions.reportStolen} />
      {badge.status === 'stolen' && (
        <ReplacementRequestForm
          replacementForm={replacementForm}
          replacementRequests={replacementRequests}
          requestReplacementBadge={badgeActions.requestReplacementBadge}
          showTemporaryPermit={showTemporaryPermit}
        />
      )}
      {showNotifications && <BadgeNotifications notifications={notifications} />}
    </>
  );
}
