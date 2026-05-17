import { readStoredJson, removeStoredJson, writeStoredJson } from '../utils/storage';

export function createBrowserEnforcementRepository({
  storageKey,
  initialState,
  legacyStorageKeys = [],
  migrateState = (state) => state,
}) {
  return {
    load() {
      const fallbackState = initialState();
      const storedState = readStoredJson(storageKey, null);
      if (storedState) {
        return migrateState(storedState);
      }
      for (const legacyStorageKey of legacyStorageKeys) {
        const legacyState = readStoredJson(legacyStorageKey, null);
        if (!legacyState) continue;
        const migratedState = migrateState(legacyState);
        writeStoredJson(storageKey, migratedState);
        removeStoredJson(legacyStorageKey);
        return migratedState;
      }
      return fallbackState;
    },
    save(state) {
      writeStoredJson(storageKey, state);
    },
    reset() {
      removeStoredJson(storageKey);
      legacyStorageKeys.forEach((legacyStorageKey) => removeStoredJson(legacyStorageKey));
      return initialState();
    },
  };
}
