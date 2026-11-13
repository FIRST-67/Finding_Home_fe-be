import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HeroCarousel from './HeroCarousel'

const dogs = [
  { id: 1, name: 'Mochi', breed_name: 'Shiba Inu', age_years: 2, status: 'available' },
  { id: 2, name: 'Mali', breed_name: 'Thai mix', age_years: 1, status: 'available' },
]

function renderCarousel(items = dogs) {
  return render(
    <MemoryRouter>
      <HeroCarousel dogs={items} />
    </MemoryRouter>,
  )
}

describe('HeroCarousel', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    delete window.matchMedia
  })

  it('changes to the next slide when its control is pressed', () => {
    renderCarousel()

    fireEvent.click(screen.getByRole('button', { name: 'น้องหมาถัดไป' }))

    expect(screen.getByRole('link', { name: 'ดูข้อมูลMali' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'น้องหมาที่พร้อมหาบ้าน' })).toHaveAttribute('aria-live', 'polite')
  })

  it('pauses while hovered and resumes autoplay after pointer leaves', () => {
    jest.useFakeTimers()
    renderCarousel()
    const carousel = screen.getByRole('region', { name: 'น้องหมาที่พร้อมหาบ้าน' })

    fireEvent.mouseEnter(carousel)
    act(() => jest.advanceTimersByTime(9000))
    expect(screen.getByRole('link', { name: 'ดูข้อมูลMochi' })).toBeInTheDocument()

    fireEvent.mouseLeave(carousel)
    act(() => jest.advanceTimersByTime(4500))
    expect(screen.getByRole('link', { name: 'ดูข้อมูลMali' })).toBeInTheDocument()
  })

  it('keeps autoplay stopped after the pointer leaves when manually paused', () => {
    jest.useFakeTimers()
    renderCarousel()
    const carousel = screen.getByRole('region', { name: 'น้องหมาที่พร้อมหาบ้าน' })

    fireEvent.click(screen.getByRole('button', { name: 'หยุดเล่นสไลด์อัตโนมัติ' }))
    fireEvent.mouseEnter(carousel)
    fireEvent.mouseLeave(carousel)
    act(() => jest.advanceTimersByTime(9000))

    expect(screen.getByRole('link', { name: 'ดูข้อมูลMochi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'เล่นสไลด์อัตโนมัติ' })).toBeInTheDocument()
  })

  it('disables autoplay when reduced motion is preferred', () => {
    jest.useFakeTimers()
    window.matchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))
    renderCarousel()

    expect(screen.getByRole('button', { name: 'เล่นสไลด์อัตโนมัติ' })).toBeDisabled()
    act(() => jest.advanceTimersByTime(9000))
    expect(screen.getByRole('link', { name: 'ดูข้อมูลMochi' })).toBeInTheDocument()
  })

  it('does not show carousel controls for a single dog', () => {
    renderCarousel([dogs[0]])

    expect(screen.getByRole('link', { name: 'ดูข้อมูลMochi' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'น้องหมาถัดไป' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'เลือกสไลด์' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /เล่นสไลด์|หยุดเล่นสไลด์/ })).not.toBeInTheDocument()
  })

  it('shows a fixed-size loading skeleton', () => {
    render(
      <MemoryRouter>
        <HeroCarousel dogs={[]} loading />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status', { name: 'กำลังโหลดรูปน้องหมา' })).toHaveClass('home-intro__skeleton')
  })
})
