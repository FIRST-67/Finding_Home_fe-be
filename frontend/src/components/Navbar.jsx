import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <header className="site-header">
      <Link className="brand" to="/">Finding Home <span>บ้านที่อบอุ่นรอคุณอยู่</span></Link>
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
