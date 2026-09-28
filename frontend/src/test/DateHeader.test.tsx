import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import DateHeader from '../components/DateHeader/DateHeader'

describe('DateHeader', () => {
  it('mostra titolo e conteggio', () => {
    render(<DateHeader title="Domenica 4 Ottobre" count="27 tapasciate" />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Domenica 4 Ottobre')
    expect(screen.getByText('27 tapasciate')).toBeInTheDocument()
  })

  it('con titleAs="span" non crea un heading', () => {
    render(<DateHeader title="Domenica 4 Ottobre" titleAs="span" />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Domenica 4 Ottobre')).toBeInTheDocument()
  })

  it('in caricamento mostra gli skeleton', () => {
    render(<DateHeader loading />)
    expect(document.querySelectorAll('.skeleton')).toHaveLength(2)
  })
})
