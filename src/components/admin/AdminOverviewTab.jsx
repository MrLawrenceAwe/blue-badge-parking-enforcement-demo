import { Clock3, Gauge, QrCode, ShieldAlert, Siren } from 'lucide-react';
import { riskLevelLabels } from '../../domain/risk';
import { formatTime } from '../../utils/date';
import { SessionCard } from '../sessions/SessionCard';
import { StatusPill } from '../common/StatusPill';

export function AdminOverviewTab({
  filteredBadges,
  filteredActiveSessions,
  filteredScans,
  reviewQueueCases,
  restrictedBadges,
  riskByBadge,
  selectBadge
}) {
  return (
    <>
      <div className="app-panel suspicious-cases-panel operations-panel">
        <div className="app-panel-heading"><h2>Priority queue</h2><ShieldAlert aria-hidden="true" /></div>
        <div className="record-list constrained-list">
          {reviewQueueCases.map((caseRecord) => (
            <article key={caseRecord.id} className="case-card priority-card">
              <strong>{caseRecord.id}</strong>
              <span>{caseRecord.badgeId} - {caseRecord.status}</span>
              <small>{caseRecord.assignedTo}</small>
            </article>
          ))}
          {!reviewQueueCases.length && <p className="muted-text">No review cases match the current filters.</p>}
        </div>
      </div>

      <div className="app-panel badge-status-panel">
        <div className="app-panel-heading"><h2>Restricted badges</h2><Siren aria-hidden="true" /></div>
        <div className="record-list constrained-list">
          {restrictedBadges.map((badge) => (
            <button key={badge.id} type="button" className="badge-record-button" onClick={() => selectBadge(badge.id)}>
              <span><strong>{badge.id}</strong><small>{badge.holder} - {badge.vehicle}</small></span>
              <StatusPill status={badge.status} />
            </button>
          ))}
          {!restrictedBadges.length && <p className="muted-text">No restricted badges match the filters.</p>}
        </div>
      </div>

      <div className="app-panel risk-panel">
        <div className="app-panel-heading"><h2>Risk scores</h2><Gauge aria-hidden="true" /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Badge</th><th>Vehicle</th><th>Status</th><th>Risk</th></tr></thead>
            <tbody>
              {filteredBadges.map((badge) => (
                <tr
                  key={badge.id}
                  onClick={() => selectBadge(badge.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectBadge(badge.id);
                    }
                  }}
                  tabIndex="0"
                  role="button"
                  aria-label={`Select badge ${badge.id}`}
                >
                  <td data-label="Badge">{badge.id}<br /><small>{badge.holder}</small></td>
                  <td data-label="Vehicle">{badge.vehicle}</td>
                  <td data-label="Status"><StatusPill status={badge.status} /></td>
                  <td data-label="Risk"><strong>{riskByBadge[badge.id].score}</strong><br /><small>{riskLevelLabels[riskByBadge[badge.id].level]}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="app-panel active-sessions-panel">
        <div className="app-panel-heading"><h2>Active sessions</h2><Clock3 aria-hidden="true" /></div>
        <div className="record-list constrained-list">{filteredActiveSessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>
      </div>

      <div className="app-panel recent-scans-panel">
        <div className="app-panel-heading"><h2>Recent scans</h2><QrCode aria-hidden="true" /></div>
        <div className="record-list constrained-list">
          {filteredScans.map((scan) => (
            <article key={scan.id} className="scan-card">
              <strong>{scan.badgeId}</strong>
              <span>{scan.vehicle} - {scan.location}</span>
              <small>{scan.officer} - {formatTime(scan.time)} - {scan.outcome}</small>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
