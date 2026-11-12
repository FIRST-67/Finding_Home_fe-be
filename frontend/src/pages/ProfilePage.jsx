import { useCallback, useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { changePassword, getProfile, updateProfile } from '../services/auth'
import EmptyState from '../components/EmptyState'
import { validatePassword, validatePasswordConfirmation } from '../utils/validators'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const [profile, setProfile] = useState(user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordValues, setPasswordValues] = useState({ current_password: '', new_password: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const current = await getProfile()
      setProfile(current)
      updateUser(current)
    } catch (loadError) {
      setError(loadError.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [updateUser])

  useEffect(() => { load() }, [load])

  async function saveProfile(event) {
    event.preventDefault()
    setProfileBusy(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateProfile({ name: profile.name, phone: profile.phone || '' })
      setProfile(updated)
      updateUser(updated)
      setMessage('บันทึกข้อมูลโปรไฟล์แล้ว')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setProfileBusy(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    const validation = validatePassword(passwordValues.new_password)
      || validatePasswordConfirmation(passwordValues.new_password, passwordValues.confirmPassword)
    if (validation) {
      setPasswordError(validation)
      return
    }
    setPasswordBusy(true)
    setPasswordError('')
    setMessage('')
    try {
      await changePassword({
        current_password: passwordValues.current_password,
        new_password: passwordValues.new_password,
      })
      setPasswordValues({ current_password: '', new_password: '', confirmPassword: '' })
      setMessage('เปลี่ยนรหัสผ่านสำเร็จ')
    } catch (changeError) {
      setPasswordError(changeError.message)
    } finally {
      setPasswordBusy(false)
    }
  }

  if (loading) return <Loading>กำลังโหลดโปรไฟล์...</Loading>
  if (error && !profile) return <ErrorMessage message={error} onRetry={load} />
  if (!profile) return <EmptyState>ไม่พบข้อมูลโปรไฟล์</EmptyState>

  return (
    <section className="profile-page">
      <header className="page-intro">
        <p className="eyebrow">พื้นที่ของคุณ</p>
        <h1>โปรไฟล์ของฉัน</h1>
        <p>จัดการข้อมูลส่วนตัวและติดตามการเดินทางสู่บ้านหลังใหม่</p>
      </header>
      {error && <ErrorMessage message={error} onRetry={load} />}
      {message && <p className="success-message" role="status">{message}</p>}
      <section className="profile-request-card">
        <div>
          <p className="eyebrow">การรับเลี้ยงของฉัน</p>
          <h2>ติดตามสถานะใบสมัคร</h2>
          <p>ดูประวัติคำขอและข่าวคราวจากผู้ดูแล</p>
        </div>
        <div className="profile-request-card__actions">
          <Link className="button-link button-link--secondary" to="/my-requests">ดูคำขอของฉัน <span aria-hidden="true">→</span></Link>
          <button className="profile-logout" type="button" onClick={logout}>ออกจากระบบ</button>
        </div>
      </section>
      <form className="form-stack form-panel" onSubmit={saveProfile} noValidate>
        <h2>ข้อมูลส่วนตัว</h2>
        <label>ชื่อ<input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></label>
        <label>เบอร์โทรศัพท์<input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
        <label>อีเมล<input type="email" value={profile.email || ''} readOnly /></label>
        <button type="submit" disabled={profileBusy}>{profileBusy ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}</button>
      </form>
      <form className="form-stack form-panel" onSubmit={savePassword}>
        <h2>เปลี่ยนรหัสผ่าน</h2>
        <label>รหัสผ่านเดิม<input type="password" autoComplete="current-password" value={passwordValues.current_password} onChange={(e) => setPasswordValues({ ...passwordValues, current_password: e.target.value })} required /></label>
        <label>รหัสผ่านใหม่<input type="password" autoComplete="new-password" value={passwordValues.new_password} onChange={(e) => setPasswordValues({ ...passwordValues, new_password: e.target.value })} required /></label>
        <label>ยืนยันรหัสผ่านใหม่<input type="password" autoComplete="new-password" value={passwordValues.confirmPassword} onChange={(e) => setPasswordValues({ ...passwordValues, confirmPassword: e.target.value })} required /></label>
        {passwordError && <p className="field-error" role="alert">{passwordError}</p>}
        <button type="submit" disabled={passwordBusy}>{passwordBusy ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}</button>
      </form>
    </section>
  )
}
