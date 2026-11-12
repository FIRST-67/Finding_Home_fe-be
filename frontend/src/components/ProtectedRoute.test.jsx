import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../services/auth', () => ({
  getCurrentUser: vi.fn(() => new Promise(() => {})),
}))

function renderProtected(path, requireRole) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute requireRole={requireRole} />}>
            <Route path="/protected" element={<p>Protected content</p>} />
          </Route>
          <Route path="/login" element={<p>Login destination</p>} />
          <Route path="/" element={<p>Home destination</p>} />
          <Route path="/admin" element={<p>Admin destination</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => localStorage.clear())

  it('redirects guests to Login', () => {
    renderProtected('/protected', 'member')
    expect(screen.getByText('Login destination')).toBeInTheDocument()
  })

  it('redirects members away from Admin routes', () => {
    localStorage.setItem('token', 'member-token')
    localStorage.setItem('finding-home-user', JSON.stringify({ id: 'u1', role: 'member' }))
    renderProtected('/protected', 'admin')
    expect(screen.getByText('Home destination')).toBeInTheDocument()
  })

  it('renders the route for a user with the required role', () => {
    localStorage.setItem('token', 'member-token')
    localStorage.setItem('finding-home-user', JSON.stringify({ id: 'u1', role: 'member' }))
    renderProtected('/protected', 'member')
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
