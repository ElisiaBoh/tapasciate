import type { Event } from '../types'

export interface PosterSlide {
  src: string
  msrc: string
  width: number
  height: number
  alt: string
}

export function posterAlt(title: string, index: number, total: number): string {
  return total > 1 ? `Locandina ${title}, pagina ${index + 1} di ${total}` : `Locandina ${title}`
}

export function posterSlides(event: Event): PosterSlide[] {
  const total = event.posterPages.length
  return event.posterPages.map((page, i) => ({
    src: page.url,
    // Same file as the inline poster, already cached: the opening zoom starts from it without a blank frame
    msrc: page.url,
    width: page.width,
    height: page.height,
    alt: posterAlt(event.title, i, total),
  }))
}

export const VIEWER_HISTORY_KEY = 'posterViewer'

export function isViewerHistoryState(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as Record<string, unknown>)[VIEWER_HISTORY_KEY] === true
}

export function withViewerHistoryState(state: unknown): Record<string, unknown> {
  return { ...(typeof state === 'object' && state !== null ? state : {}), [VIEWER_HISTORY_KEY]: true }
}
