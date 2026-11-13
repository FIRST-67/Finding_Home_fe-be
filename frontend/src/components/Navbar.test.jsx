import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuth } from '../context/AuthContext'

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const guest = { isAuthenticated: false, user: null }
const member = { isAuthenticated: true, user: { role: 'member' } }

function navbarAt(path = '/') {
  return (
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<h1>หน้าหลัก</h1>} />
        <Route path="/my-requests" element={<h1>คำขอรับเลี้ยงของฉัน</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => useAuth.mockReturnValue(guest))

  it.each([
    [guest, false],
    [member, true],
    [{ isAuthenticated: true, user: { role: 'admin' } }, false],
    [{ isAuthenticated: false, user: { role: 'member' } }, false],
  ])('shows the requests link according to the current session (%#)', (session, visible) => {
    useAuth.mockReturnValue(session)
    render(navbarAt())
    const link = screen.queryByRole('link', { name: 'คำขอของฉัน' })
    if (visible) expect(link).toHaveAttribute('href', '/my-requests')
    else expect(link).not.toBeInTheDocument()
    if (session.user?.role === 'admin') {
      expect(screen.getByRole('link', { name: 'จัดการระบบ' })).toHaveAttribute('href', '/admin')
    }
  })

  it('navigates from the mobile menu, marks the link active, and closes the menu', () => {
    useAuth.mockReturnValue(member)
    render(navbarAt())
    fireEvent.click(screen.getByRole('button', { name: 'เปิดเมนู' }))
    const link = screen.getByRole('link', { name: 'คำขอของฉัน' })
    expect(link).not.toHaveAttribute('aria-current')
    fireEvent.click(link)
    expect(screen.getByRole('heading', { name: 'คำขอรับเลี้ยงของฉัน' })).toBeVisible()
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'เปิดเมนู' })).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'เปิดเมนู' }))
    fireEvent.click(link)
    expect(screen.getByRole('button', { name: 'เปิดเมนู' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('removes the requests link when logout clears the session', () => {
    const logout = jest.fn(() => useAuth.mockReturnValue(guest))
    useAuth.mockReturnValue({ ...member, logout })
    const view = render(navbarAt())

    fireEvent.click(screen.getByRole('button', { name: 'ออกจากระบบ' }))
    expect(logout).toHaveBeenCalledTimes(1)
    view.rerender(navbarAt())

    expect(screen.queryByRole('link', { name: 'คำขอของฉัน' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument()
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
})
