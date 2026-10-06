import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import ZonePicker from '../components/ZonePicker/ZonePicker'
import type { RegionEntry, Zone } from '../types'

const catalog: RegionEntry[] = [
  { name: 'Lombardia', count: 3, provinces: [{ code: 'BG', name: 'Bergamo', count: 2 }, { code: 'CO', name: 'Como', count: 1 }] },
  { name: 'Veneto', count: 1, provinces: [{ code: 'VI', name: 'Vicenza', count: 1 }] },
]
const bergamo: Zone = { kind: 'province', region: 'Lombardia', province: 'BG', provinceName: 'Bergamo' }

function renderPicker(current: Zone | null = { kind: 'italy' }) {
  const onSelect = jest.fn()
  const onClose = jest.fn()
  render(<ZonePicker catalog={catalog} current={current} onSelect={onSelect} onClose={onClose} />)
  return { onSelect, onClose }
}

describe('ZonePicker', () => {
  it('è una finestra modale con il focus sul pulsante di chiusura', () => {
    renderPicker()
    expect(screen.getByRole('dialog', { name: 'Scegli la zona' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chiudi' })).toHaveFocus()
  })

  it('mostra Tutta Italia con il totale e le regioni con i conteggi', () => {
    renderPicker()
    expect(screen.getByRole('link', { name: /Tutta Italia/ })).toHaveTextContent('Tutta Italia4')
    expect(screen.getByRole('button', { name: /Lombardia/ })).toHaveTextContent('3')
    expect(screen.getByRole('button', { name: /Veneto/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('"Vicino a me" non è ancora disponibile', () => {
    renderPicker()
    expect(screen.getByText('Vicino a me').closest('[aria-disabled="true"]')).toBeInTheDocument()
    expect(screen.getByText('presto')).toBeInTheDocument()
  })

  it('apre la regione della zona attuale ed evidenzia la provincia scelta', () => {
    renderPicker(bergamo)
    expect(screen.getByRole('button', { name: /Lombardia/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /Bergamo/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: /Bergamo/ })).toHaveAttribute('href', '/lombardia/bergamo')
    expect(screen.getByRole('link', { name: /Tutta la Lombardia/ })).toHaveAttribute('href', '/lombardia')
  })

  it('apre una regione e seleziona una provincia', () => {
    const { onSelect } = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /Veneto/ }))
    fireEvent.click(screen.getByRole('link', { name: /Vicenza/ }))
    expect(onSelect).toHaveBeenCalledWith({ kind: 'province', region: 'Veneto', province: 'VI', provinceName: 'Vicenza' })
  })

  it('seleziona tutta la regione o tutta Italia', () => {
    const { onSelect } = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /Lombardia/ }))
    fireEvent.click(screen.getByRole('link', { name: /Tutta la Lombardia/ }))
    expect(onSelect).toHaveBeenLastCalledWith({ kind: 'region', region: 'Lombardia' })
    fireEvent.click(screen.getByRole('link', { name: /Tutta Italia/ }))
    expect(onSelect).toHaveBeenLastCalledWith({ kind: 'italy' })
  })

  it('si chiude con Esc, con il pulsante e cliccando fuori', () => {
    const { onClose } = renderPicker()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }))
    fireEvent.click(document.querySelector('.zp-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})
