import { ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PawIcon from './PawIcon'

const THEME_STORAGE_KEY = 'finding-home-theme'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => (
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  ))
  const showBackButton = location.pathname !== '/'

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function goBack() {
    if (location.key !== 'default') navigate(-1)
    else navigate('/')
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    setTheme(nextTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // Theme still changes for this page when storage is unavailable.
    }
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__start">
          {showBackButton && (
            <button className="nav-back" type="button" onClick={goBack}>← ย้อนกลับ</button>
          )}
          <Link className="brand" to="/">
            <PawIcon />
            <span className="brand__copy">
              <strong>Finding Home</strong>
              <span>บ้านที่อบอุ่นรอคุณอยู่</span>
            </span>
          </Link>
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id="primary-navigation"
          className={`primary-nav${menuOpen ? ' is-open' : ''}`}
          aria-label="เมนูหลัก"
        >
          <NavLink to="/" end>หน้าแรก</NavLink>
          <NavLink to="/explore">ค้นหาน้องหมา</NavLink>
          {isAuthenticated && user?.role === 'member' && (
            <NavLink to="/my-requests" end onClick={() => setMenuOpen(false)}>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <ClipboardList size={16} aria-hidden="true" />
                คำขอของฉัน
              </span>
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin">จัดการระบบ</NavLink>
          )}
          {isAuthenticated ? (
            <button className="nav-button" type="button" onClick={logout}>ออกจากระบบ</button>
          ) : (
            <NavLink to="/login">เข้าสู่ระบบ</NavLink>
          )}
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
          >
            {theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
          </button>
        </nav>
      </div>
    </header>
  )
}
