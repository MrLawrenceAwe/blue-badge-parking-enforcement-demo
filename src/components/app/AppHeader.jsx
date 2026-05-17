import { LayoutDashboard, ShieldCheck, UserRound, UsersRound } from 'lucide-react';

const roleOptions = [
  ['holder', UserRound, 'Badge holder'],
  ['carer', UsersRound, 'Delegated carer'],
  ['officer', ShieldCheck, 'Enforcement officer'],
  ['admin', LayoutDashboard, 'Council admin'],
];

const roleHeroNotes = {
  holder: 'Show your badge, manage parking sessions, and report problems quickly.',
  carer: 'Manage badges and parking sessions for the people you support.',
  officer: 'Verify badges, check vehicle matches, and record enforcement evidence.',
  admin: 'Review priority, manage cases, and monitor badge activity across the service.',
};

export function AppHeader({ role, availableRoles, roleUsers, setRole, selectRoleUser }) {
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
        <span className="switcher-caption">Choose role</span>
        <div className="role-switcher" aria-label="Choose role">
          {roleOptions.map(([value, Icon, label]) => {
            const roleUser = roleUsers.find((user) => user.role === value);
            const canAccess = availableRoles.includes(value);
            const buttonTitle = canAccess
              ? `Show the ${label.toLowerCase()} view`
              : `Sign in as the ${label.toLowerCase()}`;
            return (
              <button
                key={value}
                className={role === value ? 'active' : ''}
                onClick={() => (canAccess ? setRole(value) : selectRoleUser(roleUser))}
                aria-pressed={role === value}
                aria-label={canAccess ? `Show ${label} role` : `Sign in as ${label}`}
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
