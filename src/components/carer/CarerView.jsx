import { Clock3, FileText, UsersRound } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { SessionCard } from '../sessions/SessionCard';
import { StatusPill } from '../common/StatusPill';
import { StolenReportForm } from '../common/StolenReportForm';
import { BadgeNotifications } from '../badges/BadgeNotifications';
import { ReplacementRequestForm } from '../replacements/ReplacementRequestForm';
import { SessionStartForm } from '../sessions/SessionStartForm';

export function CarerView({
  badges,
  selectedBadge,
  setSelectedBadgeId,
  sessions,
  startSession,
  extendSession,
  endSession,
  reportStolen,
  requestReplacementBadge,
  replacementForm,
  replacementRequests,
  notifications,
  sessionMessage
}) {
  const activeSession = sessions.find((session) => session.badgeId === selectedBadge.id && isSessionActive(session));
  return (
    <div className="page-grid">
      <section className="app-panel">
        <div className="app-panel-heading">
          <h2>Delegated access</h2>
          <UsersRound aria-hidden="true" />
        </div>
        <div className="record-list">
          {badges.map((badge) => (
            <button key={badge.id} className={`badge-record-button ${badge.id === selectedBadge.id ? 'selected' : ''}`} onClick={() => setSelectedBadgeId(badge.id)}>
              <span><strong>{badge.holder}</strong><small>{badge.delegatedTo}</small></span>
              <StatusPill status={badge.status} />
            </button>
          ))}
        </div>
      </section>
      <section className="app-panel">
        <div className="app-panel-heading">
          <h2>Activity</h2>
          <FileText aria-hidden="true" />
        </div>
        <p className="muted-text">Delegated sessions and notices.</p>
        {sessions.filter((session) => session.badgeId === selectedBadge.id).map((session) => <SessionCard key={session.id} session={session} />)}
        <BadgeNotifications notifications={notifications} />
      </section>
      <section className="app-panel">
        <div className="app-panel-heading">
          <h2>Session</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <div className="session-panel-stack">
          <SessionStartForm badge={selectedBadge} activeSession={activeSession} startSession={startSession} extendSession={extendSession} endSession={endSession} />
          {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
          <StolenReportForm reportStolen={reportStolen} />
        </div>
        {selectedBadge.status === 'stolen' && (
          <ReplacementRequestForm
            replacementForm={replacementForm}
            replacementRequests={replacementRequests}
            requestReplacementBadge={requestReplacementBadge}
            showTemporaryPermit={false}
          />
        )}
      </section>
    </div>
  );
}
