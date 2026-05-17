export function readStoredJson(key, fallbackValue) {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function writeStoredJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence should never block the main workflow.
  }
}

export function removeStoredJson(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore unavailable storage in private or restricted browsing modes.
  }
}
