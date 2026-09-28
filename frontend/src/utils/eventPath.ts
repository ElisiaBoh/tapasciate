function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function eventPath(event: { id: number; title: string }): string {
  const slug = slugify(event.title)
  return slug ? `/evento/${event.id}-${slug}` : `/evento/${event.id}`
}

export function parseEventId(pathname: string): number | null {
  const match = pathname.match(/^\/evento\/(\d+)(?:-[^/]*)?\/?$/)
  return match ? Number(match[1]) : null
}
