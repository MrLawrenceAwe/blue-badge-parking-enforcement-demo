export function AuthStrip({ authUser }) {
  return (
    <section className="auth-strip" aria-label="Current account">
      <div className="auth-strip-copy">
        <strong>Signed in as {authUser.name}</strong>
        <span>
          {authUser.email} · {authUser.role}
        </span>
      </div>
    </section>
  );
}
