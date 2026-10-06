import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import ZoneBar from '../components/ZoneBar/ZoneBar'
import type { Zone } from '../types'

const bergamo: Zone = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }

function renderBar(props: Partial<Parameters<typeof ZoneBar>[0]> = {}) {
  const onPeriodChange = jest.fn()
  const onOpenPicker = jest.fn()
  render(
    <ZoneBar loading={false} zone={bergamo} period="all" total={27} periodCount={4}
      onPeriodChange={onPeriodChange} onOpenPicker={onOpenPicker} {...props} />
  )
  return { onPeriodChange, onOpenPicker }
}

describe('ZoneBar', () => {
  it('mostra zona, titolo e totale in calendario', () => {
    renderBar()
    expect(screen.getByRole('button', { name: 'Cambia zona, attuale: Bergamo' })).toHaveTextContent('Bergamo')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tapasciate in provincia di Bergamo')
    expect(screen.getByText('27 in calendario')).toBeInTheDocument()
  })

  it('con un periodo mostra anche il conteggio del periodo', () => {
    renderBar({ period: 'this-week' })
    expect(screen.getByText('4 questa settimana · 27 in calendario')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Questa settimana' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tutte' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('cambia periodo e apre il selettore della zona', () => {
    const { onPeriodChange, onOpenPicker } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: 'Prossima settimana' }))
    expect(onPeriodChange).toHaveBeenCalledWith('next-week')
    fireEvent.click(screen.getByRole('button', { name: /Cambia zona/ }))
    expect(onOpenPicker).toHaveBeenCalled()
  })

  it('durante il caricamento mostra gli skeleton', () => {
    renderBar({ loading: true })
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('zona inesistente: niente periodo, invito a sceglierne una', () => {
    renderBar({ zone: null })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Zona non trovata')
    expect(screen.getByRole('button', { name: 'Scegli la zona' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Periodo' })).not.toBeInTheDocument()
  })
})
