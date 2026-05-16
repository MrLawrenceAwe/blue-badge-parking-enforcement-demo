import { LayoutDashboard, ShieldCheck, UserRound, UsersRound } from 'lucide-react';

const roleOptions = [
  ['holder', UserRound, 'Holder'],
  ['carer', UsersRound, 'Carer'],
  ['officer', ShieldCheck, 'Officer'],
  ['admin', LayoutDashboard, 'Admin']
];

export function AppHeader({ role, currentDemoRoles, demoUsers, setRole, selectDemoUser }) {
  return (
    <header className="app-header">
      <div className="title-block">
        <div className="title-row">
          <p className="eyebrow">Digital Blue Badge</p>
          <span className="demo-pill">Prototype</span>
        </div>
        <h1>Blue Badge enforcement</h1>
        <p className="hero-note">Badge checks, sessions, and cases.</p>
      </div>
      <div className="role-switcher" aria-label="Choose role">
        {roleOptions.map(([value, Icon, label]) => {
          const demoUser = demoUsers.find((user) => user.role === value);
          const canAccess = currentDemoRoles.includes(value);
          return (
            <button
              key={value}
              className={role === value ? 'active' : ''}
              onClick={() => (canAccess ? setRole(value) : selectDemoUser(demoUser))}
              aria-pressed={role === value}
              title={canAccess ? label : `Switch to ${label.toLowerCase()} demo`}
            >
              <Icon aria-hidden="true" size={19} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
