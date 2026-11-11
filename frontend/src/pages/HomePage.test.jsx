import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import HomePage from './HomePage'
import { getDogs } from '../services/dogs'

vi.mock('../services/dogs', () => ({ getDogs: vi.fn() }))

function renderHome() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('แสดง loading ก่อนแล้วแสดงรายการสุนัข', async () => {
    let resolveDogs
    getDogs.mockReturnValue(new Promise((resolve) => { resolveDogs = resolve }))
    renderHome()

    expect(screen.getByText('กำลังค้นหาน้องหมา...')).toBeInTheDocument()
    resolveDogs({ data: [{
      id: 1,
      name: 'มะลิ',
      breed_name: 'ไทยผสม',
      age_years: 2,
      description: 'ขี้เล่น',
      status: 'available',
    }], page: 1, limit: 12, total: 1 })
    expect(await screen.findByText('มะลิ')).toBeInTheDocument()
  })

  it('แสดง empty state เมื่อไม่มีสุนัขตรงกับตัวกรอง', async () => {
    getDogs.mockResolvedValue({ data: [], page: 1, limit: 12, total: 0 })
    renderHome()
    expect(await screen.findByText(/ยังไม่มีน้องหมา/)).toBeInTheDocument()
  })

  it('แสดง error และลองโหลดซ้ำได้', async () => {
    getDogs.mockRejectedValueOnce(new Error('เซิร์ฟเวอร์ไม่พร้อม'))
    getDogs.mockResolvedValueOnce({ data: [], page: 1, limit: 12, total: 0 })
    renderHome()

    expect(await screen.findByRole('alert')).toHaveTextContent('เซิร์ฟเวอร์ไม่พร้อม')
    fireEvent.click(screen.getByRole('button', { name: 'ลองอีกครั้ง' }))
    expect(await screen.findByText(/ยังไม่มีน้องหมา/)).toBeInTheDocument()
    await waitFor(() => expect(getDogs).toHaveBeenCalledTimes(2))
  })

  it('ส่งค่าค้นหาและตัวกรองไปยัง service', async () => {
    getDogs.mockResolvedValue({ data: [], page: 1, limit: 12, total: 0 })
    renderHome()
    await screen.findByText(/ยังไม่มีน้องหมา/)

    fireEvent.change(screen.getByLabelText('ค้นหาชื่อสุนัข'), { target: { value: 'มะลิ' } })
    fireEvent.change(screen.getByLabelText('เพศ'), { target: { value: 'female' } })
    fireEvent.click(screen.getByRole('button', { name: 'ค้นหา' }))

    await waitFor(() => expect(getDogs).toHaveBeenLastCalledWith({
      q: 'มะลิ',
      gender: 'female',
      status: 'available',
    }))
  })
})
