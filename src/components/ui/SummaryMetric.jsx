export function SummaryMetric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon aria-hidden="true" size={23} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
