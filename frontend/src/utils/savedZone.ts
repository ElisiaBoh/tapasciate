// Zona scelta dall'utente nel selettore, ricordata nel browser come URL della lista (es. "/lombardia/bergamo").
// localStorage può mancare o lanciare eccezioni (navigazione privata, cookie bloccati): in quel caso
// semplicemente non si ricorda nulla.
const KEY = 'tapasciate:zona'

export function getSavedZonePath(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveZonePath(path: string): void {
  try {
    window.localStorage.setItem(KEY, path)
  } catch {
    // ignora
  }
}

export function clearSavedZonePath(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignora
  }
}
