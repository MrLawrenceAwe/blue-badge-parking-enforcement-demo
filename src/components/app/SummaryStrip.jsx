import { BadgeCheck, Clock3, FileText, ShieldAlert } from 'lucide-react';
import { Metric } from '../common/Metric';

export function SummaryStrip({ role, badgeCount, activeSessionCount, highRiskCount, openCaseCount }) {
  const personalLabels = role === 'holder' || role === 'carer';
  const caseLabel = personalLabels ? 'My cases' : 'Open cases';
  const riskLabel = personalLabels ? 'Reviews' : 'High risk';

  return (
    <section className="summary-strip" aria-label="System summary">
      <Metric icon={BadgeCheck} label="Badges" value={badgeCount} />
      <Metric icon={Clock3} label="Active" value={activeSessionCount} />
      <Metric icon={ShieldAlert} label={riskLabel} value={highRiskCount} />
      <Metric icon={FileText} label={caseLabel} value={openCaseCount} />
    </section>
  );
}
