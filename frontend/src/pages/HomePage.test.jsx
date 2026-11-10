import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import HomePage from './HomePage'
import * as api from '../services/api'

vi.mock('../services/api')

const sample = [
  { id: 1, name: 'Husky', temperament: 'Loyal', life_span: '12 years', image_url: '' },
]

describe('HomePage', () => {
  it('แสดง loading ก่อน แล้วแสดงรายการสายพันธุ์', async () => {
    api.getBreeds.mockResolvedValue(sample)
    render(<HomePage />)
    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument()
    expect(await screen.findByText('Husky')).toBeInTheDocument()
  })

  it('แสดง error เมื่อ API ล้มเหลว', async () => {
    api.getBreeds.mockRejectedValue(new Error('TheDogAPI unreachable'))
    render(<HomePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('TheDogAPI unreachable')
  })

  it('แสดง empty state เมื่อไม่มีข้อมูล', async () => {
    api.getBreeds.mockResolvedValue([])
    render(<HomePage />)
    expect(await screen.findByText(/ไม่พบสายพันธุ์/)).toBeInTheDocument()
  })
})
