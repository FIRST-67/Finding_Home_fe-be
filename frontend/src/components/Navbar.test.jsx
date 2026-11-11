import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import Navbar from './Navbar'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, logout: vi.fn() }),
}))

describe('Navbar', () => {
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
    expect(screen.getByText('หน้าแรก')).toBeInTheDocument()
  })

  it.each([
    ['/dogs/1/adoption', '/dogs/1', 'รายละเอียดสุนัข'],
    ['/admin/dogs/new', '/admin/dogs', 'จัดการสุนัข'],
    ['/admin/dogs/5/edit', '/admin/dogs', 'จัดการสุนัข'],
    ['/admin/dogs', '/admin', 'แดชบอร์ด'],
    ['/admin/requests', '/admin', 'แดชบอร์ด'],
    ['/profile', '/', 'หน้าแรก'],
    ['/favorites', '/', 'หน้าแรก'],
    ['/my-requests', '/', 'หน้าแรก'],
  ])('returns from %s to its parent when directly opened', (path, target, targetText) => {
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
    expect(screen.getByText(targetText)).toBeInTheDocument()
  })

  it.each(['/', '/admin', '/login', '/register'])(
    'does not show a redundant back button on primary page %s',
    (path) => {
      render(
        <MemoryRouter
          initialEntries={[path]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Navbar />
        </MemoryRouter>,
      )

      expect(screen.queryByRole('button', { name: '← ย้อนกลับ' })).not.toBeInTheDocument()
    },
  )
})
