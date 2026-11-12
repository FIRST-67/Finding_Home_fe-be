import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(() => ({ isAuthenticated: false, user: null, logout: vi.fn() })),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

describe('Navbar', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, logout: vi.fn() })
  })

  it('shows the back button before the brand and falls back home on dog details', () => {
    render(
      <MemoryRouter
        initialEntries={['/dogs/1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
        <Routes>
          <Route path="/" element={<p>หน้าแรก</p>} />
          <Route path="/dogs/:dogId" element={<p>รายละเอียดสุนัข</p>} />
        </Routes>
      </MemoryRouter>,
    )

    const header = screen.getByRole('banner')
    const backButton = screen.getByRole('button', { name: '← ย้อนกลับ' })
    const brand = screen.getByRole('link', { name: /Finding Home/ })
    expect(header.compareDocumentPosition(backButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(backButton.compareDocumentPosition(brand) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    fireEvent.click(backButton)
    expect(screen.getByText('หน้าแรก', { selector: 'p' })).toBeInTheDocument()
  })

  it('uses browser history when the current page has an in-app predecessor', () => {
    render(
      <MemoryRouter
        initialEntries={['/', '/dogs/1']}
        initialIndex={1}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
        <Routes>
          <Route path="/" element={<p>หน้าแรก</p>} />
          <Route path="/dogs/:dogId" element={<p>รายละเอียดสุนัข</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '← ย้อนกลับ' }))
    expect(screen.getByText('หน้าแรก', { selector: 'p' })).toBeInTheDocument()
  })

  it.each([
    ['/dogs/1/adoption', 'แบบฟอร์มขอรับเลี้ยง'],
    ['/admin/dogs/new', 'เพิ่มสุนัข'],
    ['/admin/dogs/5/edit', 'แก้ไขสุนัข'],
    ['/admin/dogs', 'จัดการสุนัข'],
    ['/admin/requests', 'คำขอรับเลี้ยง'],
    ['/profile', 'โปรไฟล์'],
    ['/favorites', 'รายการโปรด'],
    ['/my-requests', 'คำขอของฉัน'],
  ])('returns from a directly opened %s page to home', (path, currentText) => {
    render(
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
        <Routes>
          <Route path="/" element={<p>หน้าแรก</p>} />
          <Route path="/dogs/:dogId" element={<p>รายละเอียดสุนัข</p>} />
          <Route path="/dogs/:dogId/adoption" element={<p>แบบฟอร์มขอรับเลี้ยง</p>} />
          <Route path="/profile" element={<p>โปรไฟล์</p>} />
          <Route path="/favorites" element={<p>รายการโปรด</p>} />
          <Route path="/my-requests" element={<p>คำขอของฉัน</p>} />
          <Route path="/admin" element={<p>แดชบอร์ด</p>} />
          <Route path="/admin/dogs" element={<p>จัดการสุนัข</p>} />
          <Route path="/admin/dogs/new" element={<p>เพิ่มสุนัข</p>} />
          <Route path="/admin/dogs/:dogId/edit" element={<p>แก้ไขสุนัข</p>} />
          <Route path="/admin/requests" element={<p>คำขอรับเลี้ยง</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '← ย้อนกลับ' }))
    expect(screen.getByText('หน้าแรก', { selector: 'p' })).toBeInTheDocument()
    expect(screen.queryByText(currentText, { selector: 'p' })).not.toBeInTheDocument()
  })

  it.each([
    ['/', false],
    ['/admin', true],
    ['/login', true],
    ['/register', true],
  ])('shows the back button on %s according to the route requirement', (path, shouldShow) => {
    render(
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
      </MemoryRouter>,
    )

    if (shouldShow) {
      expect(screen.getByRole('button', { name: '← ย้อนกลับ' })).toBeInTheDocument()
    } else {
      expect(screen.queryByRole('button', { name: '← ย้อนกลับ' })).not.toBeInTheDocument()
    }
  })

  it('toggles the mobile navigation and theme', () => {
    document.documentElement.dataset.theme = 'light'
    render(
      <MemoryRouter
        initialEntries={['/']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
      </MemoryRouter>,
    )

    const menuToggle = screen.getByRole('button', { name: 'เปิดเมนู' })
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(menuToggle)
    expect(screen.getByRole('button', { name: 'ปิดเมนู' })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'เปลี่ยนเป็นโหมดมืด' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('finding-home-theme')).toBe('dark')
  })

  it('shows Favorites to signed-in members', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'member' },
      logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'รายการโปรด' })).toHaveAttribute('href', '/favorites')
  })

  it('keeps logout as a consistently styled navigation control in both themes', () => {
    document.documentElement.dataset.theme = 'light'
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'member' },
      logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    )

    const logoutButton = screen.getByRole('button', { name: 'ออกจากระบบ' })
    expect(logoutButton).toHaveClass('nav-button')
    fireEvent.click(screen.getByRole('button', { name: 'เปลี่ยนเป็นโหมดมืด' }))
    expect(logoutButton).toHaveClass('nav-button')
    fireEvent.click(screen.getByRole('button', { name: 'เปลี่ยนเป็นโหมดสว่าง' }))
    expect(logoutButton).toHaveClass('nav-button')
  })
})
