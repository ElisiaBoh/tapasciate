import Skeleton from '../Skeleton/Skeleton'
import './DateHeader.css'

type Props =
  | { loading: true; title?: never; count?: never; titleAs?: never }
  | {
      loading?: false
      title: string
      count?: string
      // h2 in the list (section heading); in the detail the h1 is the event title
      titleAs?: 'h2' | 'span'
    }

export default function DateHeader({ loading, title, count, titleAs: TitleTag = 'h2' }: Props) {
  return (
    <div className="date-header">
      <div className="date-header-content">
        {loading ? (
          <>
            <Skeleton className="skeleton-date-title" />
            <Skeleton className="skeleton-date-count" />
          </>
        ) : (
          <>
            <TitleTag className="date-title">{title}</TitleTag>
            {count && <span className="date-count">{count}</span>}
          </>
        )}
      </div>
    </div>
  )
}
