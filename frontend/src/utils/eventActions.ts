import { eventDescription, eventUrl } from './eventSeo'
import type { Event } from '../types'

export async function shareEvent(event: Event): Promise<'shared' | 'copied' | 'failed'> {
  const url = eventUrl(event)
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: event.title, text: eventDescription(event), url })
      return 'shared'
    } catch {
      return 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
