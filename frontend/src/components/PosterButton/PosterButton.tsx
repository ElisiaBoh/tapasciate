import './PosterButton.css'

interface Props {
  url: string
}

export default function PosterButton({ url }: Props) {
  return (
    <a className="poster-button" href={url} target="_blank" rel="noopener noreferrer">
      poster
    </a>
  )
}
