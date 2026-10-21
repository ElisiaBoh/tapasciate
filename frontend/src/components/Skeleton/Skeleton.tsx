import './Skeleton.css'

interface Props {
  // Size and colors come from the CSS of the component using the skeleton
  className?: string
}

export default function Skeleton({ className = '' }: Props) {
  return <div className={`skeleton ${className}`.trim()} data-testid="skeleton" />
}
