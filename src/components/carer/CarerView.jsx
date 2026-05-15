import { Clock3, FileText, UsersRound } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { SessionCard } from '../common/SessionCard';
import { StatusPill } from '../common/StatusPill';
import { StolenReportForm } from '../common/StolenReportForm';
import { SessionStartForm } from '../sessions/SessionStartForm';

export function CarerView({ badges, selectedBadge, setSelectedBadgeId, sessions, startSession, extendSession, endSession, reportStolen, sessionMessage }) {
  const activeSession = sessions.find((session) => session.badgeId === selectedBadge.id && isSessionActive(session));
  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <h2>Delegated Access</h2>
          <UsersRound aria-hidden="true" />
        </div>
        <div className="list">
          {badges.map((badge) => (
            <button key={badge.id} className={`record-button ${badge.id === selectedBadge.id ? 'selected' : ''}`} onClick={() => setSelectedBadgeId(badge.id)}>
              <span><strong>{badge.holder}</strong><small>{badge.delegatedTo} can assist</small></span>
              <StatusPill status={badge.status} />
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Care Notes</h2>
          <FileText aria-hidden="true" />
        </div>
        <p className="plain-text">Carers can help manage delegated badge access, check the current badge state, and confirm the locked parking session details without changing arrival time after start.</p>
        {sessions.filter((session) => session.badgeId === selectedBadge.id).map((session) => <SessionCard key={session.id} session={session} />)}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Delegated Session</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <SessionStartForm badge={selectedBadge} activeSession={activeSession} startSession={startSession} extendSession={extendSession} endSession={endSession} />
        {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
        <StolenReportForm reportStolen={reportStolen} />
      </section>
    </div>
  );
}
