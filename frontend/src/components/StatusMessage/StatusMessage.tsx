import type { ReactNode } from 'react'
import './StatusMessage.css'

export default function StatusMessage({ children }: { children: ReactNode }) {
  return (
    <div className="status-message">
      <p>{children}</p>
    </div>
  )
}
