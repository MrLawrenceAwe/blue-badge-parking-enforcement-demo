const themeOptions = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
];

export function ThemeSwitcher({ themePreference, setThemePreference }) {
  return (
    <label className="theme-switcher" htmlFor="theme-preference">
      <span className="switcher-caption">Theme</span>
      <select
        id="theme-preference"
        value={themePreference}
        onChange={(event) => setThemePreference(event.target.value)}
        aria-label="Theme preference"
      >
        {themeOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
