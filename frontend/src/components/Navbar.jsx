import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getBackTarget(pathname) {
  if (/^\/dogs\/[^/]+\/adoption$/.test(pathname)) {
    return pathname.replace(/\/adoption$/, '')
  }
  if (/^\/dogs\/[^/]+$/.test(pathname)) return '/'
  if (pathname === '/admin/dogs/new' || /^\/admin\/dogs\/\d+\/edit$/.test(pathname)) {
    return '/admin/dogs'
  }
  if (pathname === '/admin/dogs' || pathname === '/admin/requests') return '/admin'
  if (pathname === '/profile' || pathname === '/favorites' || pathname === '/my-requests') return '/'
  return null
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const backTarget = getBackTarget(location.pathname)

  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(backTarget)
  }

  return (
    <header className="site-header">
      <div className="brand-group">
        {backTarget && (
          <button className="nav-back" type="button" onClick={goBack}>← ย้อนกลับ</button>
        )}
        <Link className="brand" to="/">Finding Home <span>บ้านที่อบอุ่นรอคุณอยู่</span></Link>
      </div>
      <nav aria-label="เมนูหลัก">
        <NavLink to="/">หาบ้านให้น้อง</NavLink>
        {isAuthenticated && user?.role === 'member' && (
          <NavLink to="/favorites">รายการโปรด</NavLink>
        )}
        {isAuthenticated && user?.role === 'member' && (
          <NavLink to="/profile">โปรไฟล์</NavLink>
        )}
        {isAuthenticated && user?.role === 'member' && (
          <NavLink to="/my-requests">คำขอรับเลี้ยง</NavLink>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <NavLink to="/admin">จัดการระบบ</NavLink>
        )}
        {isAuthenticated ? (
          <button className="nav-button" type="button" onClick={logout}>ออกจากระบบ</button>
        ) : (
          <>
            <NavLink to="/login">เข้าสู่ระบบ</NavLink>
            <NavLink className="nav-register" to="/register">สมัครสมาชิก</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
