import { BadgeCheck, Clock3, FileText, ShieldAlert } from 'lucide-react';
import { SummaryMetric } from '../ui/SummaryMetric';

export function SummaryStrip({
  role,
  badgeCount,
  activeSessionCount,
  roleBadgeCount,
  roleActiveSessionCount,
  highRiskCount,
  openCaseCount,
}) {
  if (role === 'holder' || role === 'carer') {
    return (
      <section className="summary-strip summary-strip-personal" aria-label="Your badge summary">
        <SummaryMetric
          icon={BadgeCheck}
          label={role === 'holder' ? 'Your badges' : 'Managed badges'}
          value={roleBadgeCount}
        />
        <SummaryMetric icon={Clock3} label="Active sessions" value={roleActiveSessionCount} />
      </section>
    );
  }

  return (
    <section className="summary-strip" aria-label="System summary">
      <SummaryMetric icon={BadgeCheck} label="Badges" value={badgeCount} />
      <SummaryMetric icon={Clock3} label="Sessions" value={activeSessionCount} />
      <SummaryMetric icon={ShieldAlert} label="High risk" value={highRiskCount} />
      <SummaryMetric icon={FileText} label="Open cases" value={openCaseCount} />
    </section>
  );
}
