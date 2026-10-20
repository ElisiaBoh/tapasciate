const KEY = 'tapasciate:zona'

// localStorage throws in private browsing or when storage is blocked: the zone is then simply not remembered
function withStorage<T>(action: (storage: Storage) => T, fallback: T): T {
  try {
    return action(window.localStorage)
  } catch {
    return fallback
  }
}

export function getSavedZonePath(): string | null {
  return withStorage(storage => storage.getItem(KEY), null)
}

export function saveZonePath(path: string): void {
  withStorage(storage => storage.setItem(KEY, path), undefined)
}

export function clearSavedZonePath(): void {
  withStorage(storage => storage.removeItem(KEY), undefined)
}
