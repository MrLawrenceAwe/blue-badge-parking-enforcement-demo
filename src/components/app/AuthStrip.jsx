import { ShieldCheck } from 'lucide-react';
import { labelForRole } from '../../domain/badges';

export function AuthStrip({
  authUser,
  demoAccountOrder,
  demoUsers,
  demoDrawerOpen,
  loginEmail,
  loginPassword,
  loginError,
  setDemoDrawerOpen,
  setLoginEmail,
  setLoginPassword,
  selectDemoUser,
  signIn,
  resetDemoState,
}) {
  return (
    <section className="auth-strip" aria-label="Demo sign in">
      <div className="auth-strip-copy">
        <strong>Signed in as {authUser.name}</strong>
        <span>
          {authUser.email} · {authUser.role}
        </span>
        <p className="demo-security-note">
          Demo only: authentication, role checks, audit writes, and storage run in this browser.
        </p>
      </div>
      <details className="auth-controls">
        <summary>Switch account</summary>
        <details
          className="demo-account-drawer"
          open={demoDrawerOpen}
          onToggle={(event) => setDemoDrawerOpen(event.currentTarget.open)}
        >
          <summary>Demo accounts</summary>
          <div className="demo-account-list" aria-label="Quick demo accounts">
            {demoAccountOrder.map((demoRole) => {
              const demoUser = demoUsers.find((user) => user.role === demoRole);
              const isActive = authUser.email === demoUser.email;
              return (
                <button
                  key={demoUser.email}
                  type="button"
                  className={`demo-account-button${isActive ? ' active' : ''}`}
                  onClick={() => selectDemoUser(demoUser)}
                  aria-pressed={isActive}
                >
                  <span>{labelForRole(demoUser.role)}</span>
                  <small>{demoUser.email}</small>
                </button>
              );
            })}
          </div>
        </details>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            signIn(new FormData(event.currentTarget));
          }}
        >
          <label>
            Email
            <input
              name="email"
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              aria-label="Email address"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              aria-label="Password"
            />
          </label>
          <button className="secondary-button" type="submit">
            <ShieldCheck aria-hidden="true" size={20} /> Sign in
          </button>
        </form>
        <button className="secondary-button reset-demo-button" type="button" onClick={resetDemoState}>
          Reset demo data
        </button>
        {loginError && (
          <p className="login-error" role="alert">
            {loginError}
          </p>
        )}
      </details>
    </section>
  );
}
