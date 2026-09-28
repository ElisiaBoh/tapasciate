import './Skeleton.css'

interface Props {
  // Classe che definisce dimensioni ed eventuali colori del blocco (nel CSS del componente che lo usa)
  className?: string
}

export default function Skeleton({ className = '' }: Props) {
  return <div className={`skeleton ${className}`.trim()} />
}
