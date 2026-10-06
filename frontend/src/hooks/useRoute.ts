import { useSyncExternalStore } from 'react'
import type { MouseEvent } from 'react'

export interface RouteState {
  fromList?: boolean
  // Lista da cui si è aperto il dettaglio (es. "/lombardia"): dà il contesto a frecce e "Torna a …"
  zonePath?: string
}

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname)
}

// Stato della voce di history corrente (impostato da navigate)
export function useHistoryState(): RouteState {
  return useSyncExternalStore(subscribe, () => window.history.state as RouteState | null) ?? {}
}

export function navigate(path: string, { replace = false, state = {} as RouteState } = {}) {
  if (replace) window.history.replaceState(state, '', path)
  else window.history.pushState(state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate', { state }))
}

// Intercetta il click su un <a> per navigare senza ricaricare la pagina,
// lasciando al browser ctrl/cmd+click, click centrale, ecc.
export function linkClickHandler(path: string, options?: Parameters<typeof navigate>[1]) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(path, options)
  }
}
