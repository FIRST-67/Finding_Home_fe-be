import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ExplorePage from './ExplorePage'
import { getDogs } from '../services/dogs'

jest.mock('../services/dogs', () => ({ getDogs: jest.fn() }))

describe('ExplorePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getDogs.mockResolvedValue({
      data: [
        { id: 1, name: 'มะลิ', breed_name: 'ไทยผสม', age_years: 2, gender: 'female', location: 'เชียงใหม่', status: 'available' },
        { id: 2, name: 'ถุงทอง', breed_name: 'บางแก้ว', age_years: 5, gender: 'male', location: 'กรุงเทพฯ', status: 'available' },
      ],
    })
  })

  it('โหลดสุนัขและกรองตามคำค้น สายพันธุ์ อายุ เพศ และพื้นที่', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ExplorePage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ถุงทอง' })).toBeInTheDocument()
    expect(getDogs).toHaveBeenCalledWith({ status: 'available', page: 1, limit: 50 })

    fireEvent.change(screen.getByLabelText('ค้นหาชื่อหรือสายพันธุ์'), { target: { value: 'ไทย' } })
    fireEvent.change(screen.getByLabelText('ช่วงอายุ'), { target: { value: 'young' } })
    fireEvent.change(screen.getByLabelText('เพศ'), { target: { value: 'female' } })
    fireEvent.change(screen.getByLabelText('พื้นที่'), { target: { value: 'เชียงใหม่' } })

    expect(screen.getByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'ถุงทอง' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'dog results' })).queryByText('ถุงทอง')).not.toBeInTheDocument()
  })

  it('shows paw loading, then allows clearing filters from the empty results', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ExplorePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('กำลังตามหาน้องหมา...')
    expect(screen.queryByText('ยังไม่พบน้องหมาที่ตรงกับการค้นหา')).not.toBeInTheDocument()
    await screen.findByRole('heading', { name: 'มะลิ' })
    expect(screen.queryByText('กำลังตามหาน้องหมา...')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('ค้นหาชื่อหรือสายพันธุ์'), { target: { value: 'ไม่มีผลลัพธ์' } })
    expect(screen.getByRole('status')).toHaveTextContent('ยังไม่พบน้องหมาที่ตรงกับการค้นหา')
    fireEvent.click(screen.getByRole('button', { name: 'ล้างตัวกรอง' }))
    expect(screen.getByRole('heading', { name: 'มะลิ' })).toBeVisible()
  })

  it('shows an API error without an empty state', async () => {
    getDogs.mockRejectedValueOnce(new Error('โหลดไม่สำเร็จ'))
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ExplorePage />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดไม่สำเร็จ')
    expect(screen.queryByText('ยังไม่พบน้องหมาที่ตรงกับการค้นหา')).not.toBeInTheDocument()
  })

  it('initializes filters from the q, sex, and breed query parameters', async () => {
    render(
      <MemoryRouter
        initialEntries={['/explore?q=มะลิ&sex=female&breed=ไทยผสม']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ExplorePage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'ถุงทอง' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('ค้นหาชื่อหรือสายพันธุ์')).toHaveValue('มะลิ')
    expect(screen.getByLabelText('สายพันธุ์')).toHaveValue('ไทยผสม')
    expect(screen.getByLabelText('เพศ')).toHaveValue('female')
  })
})
