import { Clock3, Gauge, QrCode, ShieldAlert, Siren } from 'lucide-react';
import { riskLevelLabel } from '../../domain/risk';
import { formatTime } from '../../utils/date';
import { SessionCard } from '../common/SessionCard';
import { StatusPill } from '../common/StatusPill';

export function AdminOverviewTab({
  filteredBadges,
  visibleActiveSessions,
  visibleScans,
  suspiciousCases,
  stolenOrSuspendedBadges,
  riskByBadge,
  selectBadge
}) {
  return (
    <>
      <div className="panel risk-panel">
        <div className="panel-heading"><h2>Fraud risk scores</h2><Gauge aria-hidden="true" /></div>
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
                  <td data-label="Risk"><strong>{riskByBadge[badge.id].score}</strong><br /><small>{riskLevelLabel[riskByBadge[badge.id].level]}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel active-sessions-panel">
        <div className="panel-heading"><h2>Active sessions</h2><Clock3 aria-hidden="true" /></div>
        <div className="list compact">{visibleActiveSessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>
      </div>

      <div className="panel recent-scans-panel">
        <div className="panel-heading"><h2>Recent scans</h2><QrCode aria-hidden="true" /></div>
        <div className="list compact">
          {visibleScans.map((scan) => (
            <article key={scan.id} className="scan-card">
              <strong>{scan.badgeId}</strong>
              <span>{scan.vehicle} - {scan.location}</span>
              <small>{scan.officer} - {formatTime(scan.time)} - {scan.outcome}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="panel suspicious-cases-panel">
        <div className="panel-heading"><h2>Suspicious cases</h2><ShieldAlert aria-hidden="true" /></div>
        <div className="list compact">
          {suspiciousCases.map((caseRecord) => (
            <article key={caseRecord.id} className="case-card">
              <strong>{caseRecord.id}</strong>
              <span>{caseRecord.badgeId} - {caseRecord.status}</span>
              <small>{caseRecord.assignedTo}</small>
            </article>
          ))}
          {!suspiciousCases.length && <p className="plain-text">No suspicious cases match the current filters.</p>}
        </div>
      </div>

      <div className="panel badge-status-panel">
        <div className="panel-heading"><h2>Stolen or suspended badges</h2><Siren aria-hidden="true" /></div>
        <div className="list compact">
          {stolenOrSuspendedBadges.map((badge) => (
            <button key={badge.id} type="button" className="badge-record-button" onClick={() => selectBadge(badge.id)}>
              <span><strong>{badge.id}</strong><small>{badge.holder} - {badge.vehicle}</small></span>
              <StatusPill status={badge.status} />
            </button>
          ))}
          {!stolenOrSuspendedBadges.length && <p className="plain-text">No stolen or suspended badges match the filters.</p>}
        </div>
      </div>
    </>
  );
}
