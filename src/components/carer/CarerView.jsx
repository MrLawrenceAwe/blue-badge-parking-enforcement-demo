import { Clock3, FileText, UsersRound } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { SessionCard } from '../sessions/SessionCard';
import { BadgeStatusPill } from '../ui/BadgeStatusPill';
import { BadgeNotifications } from '../badges/BadgeNotifications';
import { BadgeActions } from '../badges/BadgeActions';

export function CarerView({
  badges,
  selectedBadge,
  setSelectedBadgeId,
  sessions,
  badgeActions,
  replacementForm,
  replacementRequests,
  notifications
}) {
  const activeSession = sessions.find((session) => session.badgeId === selectedBadge.id && isSessionActive(session));
  return (
    <div className="page-grid">
      <section className="app-panel">
        <div className="app-panel-heading">
          <h2>Managed badges</h2>
          <UsersRound aria-hidden="true" />
        </div>
        <div className="record-list">
          {badges.map((badge) => (
            <button key={badge.id} className={`badge-record-button ${badge.id === selectedBadge.id ? 'selected' : ''}`} onClick={() => setSelectedBadgeId(badge.id)}>
              <span><strong>{badge.holder}</strong><small>{badge.delegatedTo}</small></span>
              <BadgeStatusPill status={badge.status} />
            </button>
          ))}
        </div>
      </section>
      <section className="app-panel">
        <div className="app-panel-heading">
          <h2>Badge activity</h2>
          <FileText aria-hidden="true" />
        </div>
        {sessions.filter((session) => session.badgeId === selectedBadge.id).map((session) => <SessionCard key={session.id} session={session} />)}
        <BadgeNotifications notifications={notifications} />
      </section>
      <section className="app-panel">
        <div className="app-panel-heading">
          <h2>Parking session</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <div className="session-panel-stack">
          <BadgeActions
            badge={selectedBadge}
            activeSession={activeSession}
            sessionMessage={badgeActions.badgeNotice}
            badgeActions={badgeActions}
            replacementForm={replacementForm}
            replacementRequests={replacementRequests}
            notifications={notifications}
            showActiveSession={false}
            showNotifications={false}
            showTemporaryPermit={false}
          />
        </div>
      </section>
    </div>
  );
}
