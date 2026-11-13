import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

function renderHome() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<h1>Explore</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows loading and then dog listings, hero, adoption steps, and all five available dog cards', async () => {
    let resolveDogs
    getDogs.mockReturnValue(new Promise((resolve) => { resolveDogs = resolve }))
    renderHome()

    expect(screen.getByRole('status', { name: 'กำลังค้นหาน้องหมา...' })).toBeInTheDocument()
    resolveDogs({ data: availableDogs })

    expect(await screen.findByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    const heroLink = screen.getAllByRole('link', { name: 'ดูข้อมูลมะลิ' })[0]
    expect(within(heroLink).getByRole('img', { name: 'มะลิ สุนัข ไทยผสม' })).toBeInTheDocument()
    expect(within(heroLink).getByText('พร้อมหาบ้าน')).toBeInTheDocument()
    const featuredSection = screen.getByRole('heading', { name: 'น้องหมาที่กำลังหาบ้าน' }).closest('section')
    expect(within(featuredSection).getAllByRole('article')).toHaveLength(5)
    expect(screen.getByRole('heading', { name: 'ขั้นตอนการรับเลี้ยง' })).toBeInTheDocument()
    expect(screen.getByText('ง่าย ๆ ใน 4 ขั้นตอน')).toBeInTheDocument()
    expect(screen.getByText('นัดวันรับและติดตามผลหลังรับเลี้ยง')).toBeInTheDocument()
    expect(getDogs).toHaveBeenCalledWith({ status: 'available', limit: 50 })
  })

  it('shows at most eight unique available dogs with their own detail links', async () => {
    const dogs = [...availableDogs, ...availableDogs.slice(0, 4).map((dog) => ({
      ...dog, id: dog.id + 5,
    }))]
    getDogs.mockResolvedValue({
      data: [{ ...dogs[0], id: 10, status: 'adopted' }, dogs[0], ...dogs],
    })
    renderHome()

    const heading = await screen.findByRole('heading', { name: 'น้องหมาที่กำลังหาบ้าน' })
    const cards = within(heading.closest('section')).getAllByRole('article')
    expect(cards.map((card) => within(card).getByRole('link').getAttribute('href'))).toEqual(
      dogs.slice(0, 8).map((dog) => `/dogs/${dog.id}`),
    )
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

  it('omits search, sex filtering, and breed chips when multiple breeds are available', async () => {
    getDogs.mockResolvedValue({ data: availableDogs })
    renderHome()

    await screen.findByRole('heading', { name: 'มะลิ' })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'เพศ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'เลือกสายพันธุ์' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'บีเกิล' })).not.toBeInTheDocument()
  })

  it.each(['ค้นหาน้องหมา', 'ดูทั้งหมด'])('opens Explore from the %s link', async (label) => {
    getDogs.mockResolvedValue({ data: availableDogs })
    renderHome()

    const link = await screen.findByRole('link', { name: label })
    expect(link).toHaveAttribute('href', '/explore')
    fireEvent.click(link)
    expect(await screen.findByRole('heading', { name: 'Explore' })).toBeInTheDocument()
  })
})
