import { LayoutDashboard, ShieldCheck, UserRound, UsersRound } from 'lucide-react';

const roleOptions = [
  ['holder', UserRound, 'Holder'],
  ['carer', UsersRound, 'Carer'],
  ['officer', ShieldCheck, 'Officer'],
  ['admin', LayoutDashboard, 'Admin'],
];

const roleHeroNotes = {
  holder: 'Show your badge, manage parking sessions, and report problems quickly.',
  carer: 'Manage badges and parking sessions for the people you support.',
  officer: 'Verify badges, check vehicle matches, and record enforcement evidence.',
  admin: 'Review risk, manage cases, and monitor badge activity across the demo.',
};

export function AppHeader({ role, availableRoles, demoUsers, setRole, selectDemoUser }) {
  return (
    <header className="app-header">
      <div className="title-block">
        <div className="title-row">
          <p className="eyebrow">Digital Blue Badge</p>
          <span className="demo-pill">Prototype</span>
        </div>
        <h1>Blue Badge enforcement</h1>
        <p className="hero-note">{roleHeroNotes[role]}</p>
      </div>
      <div className="role-switcher-wrap">
        <span className="switcher-caption">Choose demo account or role</span>
        <div className="role-switcher" aria-label="Choose demo account or role">
          {roleOptions.map(([value, Icon, label]) => {
            const demoUser = demoUsers.find((user) => user.role === value);
            const canAccess = availableRoles.includes(value);
            const buttonTitle = canAccess
              ? `Show the ${label.toLowerCase()} view for this demo account`
              : `Sign in as the ${label.toLowerCase()} demo account`;
            return (
              <button
                key={value}
                className={role === value ? 'active' : ''}
                onClick={() => (canAccess ? setRole(value) : selectDemoUser(demoUser))}
                aria-pressed={role === value}
                aria-label={canAccess ? `Show ${label} role` : `Sign in as ${label} demo account`}
                title={buttonTitle}
              >
                <Icon aria-hidden="true" size={19} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
