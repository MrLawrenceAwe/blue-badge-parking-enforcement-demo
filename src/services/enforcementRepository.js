import { readStoredJson, removeStoredJson, writeStoredJson } from '../utils/storage';

export function createBrowserEnforcementRepository({ storageKey, initialState }) {
  return {
    load() {
      return readStoredJson(storageKey, initialState());
    },
    save(state) {
      writeStoredJson(storageKey, state);
    },
    reset() {
      removeStoredJson(storageKey);
      return initialState();
    },
  };
}
