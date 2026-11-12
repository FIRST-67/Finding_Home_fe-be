import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, vi } from 'vitest'
import HomePage from './HomePage'
import { getDogs } from '../services/dogs'

vi.mock('../services/dogs', () => ({ getDogs: vi.fn() }))

const availableDogs = [
  { id: 1, name: 'มะลิ', breed_name: 'ไทยผสม', age_years: 2, status: 'available' },
  { id: 2, name: 'ถุงทอง', breed_name: 'บางแก้ว', age_years: 1, status: 'available' },
  { id: 3, name: 'ข้าวปั้น', breed_name: 'ไทยผสม', age_years: 3, status: 'available' },
  { id: 4, name: 'โกโก้', breed_name: 'โกลเด้นรีทรีฟเวอร์', age_years: 4, status: 'available' },
  { id: 5, name: 'ลัคกี้', breed_name: 'บีเกิล', age_years: 2, status: 'available' },
]

function LocationDisplay() {
  const location = useLocation()
  return <output aria-label="current search">{location.search}</output>
}

function renderHome() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HomePage />
      <LocationDisplay />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows loading and then dog listings, hero, adoption steps, and only four cards', async () => {
    let resolveDogs
    getDogs.mockReturnValue(new Promise((resolve) => { resolveDogs = resolve }))
    renderHome()

    expect(screen.getByRole('status', { name: 'กำลังค้นหาน้องหมา...' })).toBeInTheDocument()
    resolveDogs({ data: availableDogs })

    expect(await screen.findByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    const heroLink = screen.getAllByRole('link', { name: 'ดูข้อมูลมะลิ' })[0]
    expect(within(heroLink).getByRole('img', { name: 'มะลิ สุนัข ไทยผสม' })).toBeInTheDocument()
    expect(within(heroLink).getByText('พร้อมหาบ้าน')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(8)
    expect(screen.getByRole('heading', { name: 'ขั้นตอนการรับเลี้ยง' })).toBeInTheDocument()
    expect(screen.getByText('ง่าย ๆ ใน 4 ขั้นตอน')).toBeInTheDocument()
    expect(screen.getByText('นัดวันรับและติดตามผลหลังรับเลี้ยง')).toBeInTheDocument()
    expect(getDogs).toHaveBeenCalledWith({ status: 'available', limit: 50 })
  })

  it('shows empty state when there are no available dogs', async () => {
    getDogs.mockResolvedValue({ data: [] })
    renderHome()
    expect(await screen.findByText('ยังไม่มีน้องหมาที่พร้อมหาบ้านในขณะนี้')).toBeInTheDocument()
  })

  it('limits randomized hero slides to six dogs', async () => {
    getDogs.mockResolvedValue({
      data: [...availableDogs, { id: 6, name: 'เจ้าเมฆ', breed_name: 'ลาบราดอร์', status: 'available' }],
    })
    renderHome()

    expect(await screen.findByRole('group', { name: 'เลือกสไลด์' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^แสดงสไลด์/ })).toHaveLength(6)
  })

  it('shows errors and retries loading', async () => {
    getDogs.mockRejectedValueOnce(new Error('เซิร์ฟเวอร์ไม่พร้อม'))
    getDogs.mockResolvedValueOnce({ data: availableDogs })
    renderHome()

    expect(await screen.findByRole('alert')).toHaveTextContent('เซิร์ฟเวอร์ไม่พร้อม')
    fireEvent.click(screen.getByRole('button', { name: 'ลองอีกครั้ง' }))
    expect(await screen.findByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    await waitFor(() => expect(getDogs).toHaveBeenCalledTimes(2))
  })

  it('navigates to Explore with search text and selected sex', async () => {
    getDogs.mockResolvedValue({ data: availableDogs })
    renderHome()

    await screen.findByRole('heading', { name: 'มะลิ' })
    fireEvent.change(screen.getByLabelText('ค้นหาตามชื่อหรือสายพันธุ์'), { target: { value: 'ไทยผสม' } })
    fireEvent.change(screen.getByLabelText('เพศ'), { target: { value: 'female' } })
    fireEvent.submit(screen.getByRole('button', { name: 'ค้นหา' }).closest('form'))

    const searchParams = new URLSearchParams(screen.getByLabelText('current search').textContent)
    expect(searchParams.get('q')).toBe('ไทยผสม')
    expect(searchParams.get('sex')).toBe('female')
  })

  it('links breed chips using data breeds and hides chips when there is one breed', async () => {
    getDogs.mockResolvedValue({ data: availableDogs })
    const { container } = renderHome()

    await screen.findByRole('heading', { name: 'มะลิ' })
    const thaiMixLink = screen.getByRole('link', { name: 'ไทยผสม' })
    const beagleLink = screen.getByRole('link', { name: 'บีเกิล' })
    expect(new URL(thaiMixLink.href).searchParams.get('breed')).toBe('ไทยผสม')
    expect(new URL(beagleLink.href).searchParams.get('breed')).toBe('บีเกิล')

    getDogs.mockResolvedValueOnce({ data: [availableDogs[0]] })
    const singleBreedView = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HomePage />
      </MemoryRouter>,
    )
    expect(await within(singleBreedView.container).findByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    expect(within(singleBreedView.container).queryByRole('region', { name: 'เลือกสายพันธุ์' })).not.toBeInTheDocument()
    expect(container).toBeInTheDocument()
  })
})
