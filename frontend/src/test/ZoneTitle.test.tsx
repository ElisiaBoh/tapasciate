import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import ZoneTitle from '../components/ZoneTitle/ZoneTitle'
import type { Zone } from '../types'

const bergamo: Zone = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }

function renderTitle(props: Partial<Parameters<typeof ZoneTitle>[0]> = {}) {
  render(<ZoneTitle loading={false} zone={bergamo} period="all" total={27} periodCount={4} {...props} />)
}

describe('ZoneTitle', () => {
  it('mostra titolo e totale in calendario', () => {
    renderTitle()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tapasciate in provincia di Bergamo')
    expect(screen.getByText('27 in calendario')).toBeInTheDocument()
  })

  it('con un periodo mostra anche il conteggio del periodo', () => {
    renderTitle({ period: 'this-week' })
    expect(screen.getByText('4 questa settimana · 27 in calendario')).toBeInTheDocument()
  })

  it('durante il caricamento mostra gli skeleton', () => {
    renderTitle({ loading: true })
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('zona inesistente', () => {
    renderTitle({ zone: null })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Zona non trovata')
  })
})
