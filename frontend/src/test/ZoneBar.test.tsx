import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import ZoneBar from '../components/ZoneBar/ZoneBar'
import type { Zone } from '../types'

const bergamo: Zone = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }

function renderBar(props: Partial<Parameters<typeof ZoneBar>[0]> = {}) {
  const onPeriodChange = jest.fn()
  const onOpenPicker = jest.fn()
  render(
    <ZoneBar loading={false} zone={bergamo} period="all"
      onPeriodChange={onPeriodChange} onOpenPicker={onOpenPicker} {...props} />
  )
  return { onPeriodChange, onOpenPicker }
}

describe('ZoneBar', () => {
  it('mostra la zona attuale e il periodo scelto', () => {
    renderBar({ period: 'this-week' })
    expect(screen.getByRole('button', { name: 'Cambia zona, attuale: Bergamo' })).toHaveTextContent('Bergamo')
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

  it('durante il caricamento mostra lo skeleton al posto del nome', () => {
    renderBar({ loading: true })
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cambia zona/ })).toBeDisabled()
  })

  it('zona inesistente: niente periodo, invito a sceglierne una', () => {
    renderBar({ zone: null })
    expect(screen.getByRole('button', { name: 'Scegli la zona' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Periodo' })).not.toBeInTheDocument()
  })
})
