import { LayoutDashboard, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

const roleOptions = [
  ['holder', UserRound, 'Holder'],
  ['carer', UsersRound, 'Carer'],
  ['officer', ShieldCheck, 'Officer'],
  ['admin', LayoutDashboard, 'Admin']
];

export function AppHeader({
  role,
  availableRoles,
  demoUsers,
  setRole,
  selectDemoUser,
  themePreference,
  setThemePreference,
}) {
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
      <div className="role-switcher-wrap">
        <div className="header-controls">
          <ThemeSwitcher
            themePreference={themePreference}
            setThemePreference={setThemePreference}
          />
          <span className="switcher-caption">Switch demo account</span>
        </div>
        <div className="role-switcher" aria-label="Switch demo account by role">
          {roleOptions.map(([value, Icon, label]) => {
            const demoUser = demoUsers.find((user) => user.role === value);
            const canAccess = availableRoles.includes(value);
            const buttonTitle = canAccess
              ? `Show ${label.toLowerCase()} view for the current account`
              : `Switch account to ${label.toLowerCase()} demo user`;
            return (
              <button
                key={value}
                className={role === value ? 'active' : ''}
                onClick={() => (canAccess ? setRole(value) : selectDemoUser(demoUser))}
                aria-pressed={role === value}
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
