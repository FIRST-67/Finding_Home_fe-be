import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import LoginPage from './LoginPage'
import { login } from '../services/auth'

vi.mock('../services/auth', () => ({ login: vi.fn() }))

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('validates email and minimum password length in Thai without sending a request', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider><LoginPage /></AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('อีเมล'), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByLabelText('รหัสผ่าน'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))

    expect(await screen.findByText('กรุณากรอกอีเมลให้ถูกต้อง')).toBeInTheDocument()
    expect(screen.getByText('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })
})
