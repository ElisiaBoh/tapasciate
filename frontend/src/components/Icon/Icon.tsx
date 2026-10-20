const ICONS = {
  'chevron-down': { strokeWidth: 3.5, body: <path d="m6 9 6 6 6-6" /> },
  'chevron-up': { strokeWidth: 3.5, body: <path d="m6 15 6-6 6 6" /> },
  'chevron-left': { strokeWidth: 3.5, body: <path d="m15 6-6 6 6 6" /> },
  'chevron-right': { strokeWidth: 3.5, body: <path d="m9 6 6 6-6 6" /> },
  check: { strokeWidth: 3.5, body: <path d="m5 12 5 5 9-10" /> },
  close: { strokeWidth: 3.5, body: <path d="M6 6l12 12M18 6 6 18" /> },
  share: {
    strokeWidth: 2.5,
    body: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></>,
  },
}

export type IconName = keyof typeof ICONS

interface Props {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 22 }: Props) {
  const { strokeWidth, body } = ICONS[name]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {body}
    </svg>
  )
}
