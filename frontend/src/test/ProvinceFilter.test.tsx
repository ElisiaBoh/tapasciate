import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import ProvinceFilter from '../components/ProvinceFilter/ProvinceFilter'
import type { Province } from '../types'

const provinces: Province[] = [
  { code: 'BG', name: 'Bergamo' },
  { code: 'MI', name: 'Milano' },
]

describe('ProvinceFilter', () => {
  it('mostra lo skeleton durante il caricamento', () => {
    render(
      <ProvinceFilter status="loading" provinces={[]} selectedProvince="" onChange={() => {}} />
    )
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('non mostra il select durante il caricamento', () => {
    render(
      <ProvinceFilter status="loading" provinces={[]} selectedProvince="" onChange={() => {}} />
    )
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('mostra il select con le province quando non è in loading', () => {
    render(
      <ProvinceFilter status="success" provinces={provinces} selectedProvince="" onChange={() => {}} />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Bergamo')).toBeInTheDocument()
    expect(screen.getByText('Milano')).toBeInTheDocument()
  })

  it('la prima opzione è "Tutte le province"', () => {
    render(
      <ProvinceFilter status="success" provinces={provinces} selectedProvince="" onChange={() => {}} />
    )
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Tutte le province')
  })

  it('chiama onChange con il codice provincia alla selezione', () => {
    const onChange = jest.fn()
    render(
      <ProvinceFilter status="success" provinces={provinces} selectedProvince="" onChange={onChange} />
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'BG' } })
    expect(onChange).toHaveBeenCalledWith('BG')
  })

  it('riflette la provincia selezionata nel valore del select', () => {
    render(
      <ProvinceFilter status="success" provinces={provinces} selectedProvince="MI" onChange={() => {}} />
    )
    expect(screen.getByRole('combobox')).toHaveValue('MI')
  })

  it('mostra il numero corretto di opzioni (province + tutte)', () => {
    render(
      <ProvinceFilter status="success" provinces={provinces} selectedProvince="" onChange={() => {}} />
    )
    expect(screen.getAllByRole('option')).toHaveLength(provinces.length + 1)
  })
})
