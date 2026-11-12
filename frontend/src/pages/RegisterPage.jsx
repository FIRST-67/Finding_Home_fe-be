import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/auth'
import { validateRegistration } from '../utils/validators'

export default function RegisterPage() {
  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { setSession } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateRegistration(values)
    setErrors(validation)
    setServerError('')
    if (Object.keys(validation).length) return

    setSubmitting(true)
    try {
      const { confirmPassword, ...details } = values
      const session = await register(details)
      setSession(session)
      const from = location.state?.from
      const returnPath = typeof from === 'string' ? from : from?.pathname
      navigate(returnPath?.startsWith('/') ? returnPath : '/', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  return (
    <section className="form-page">
      <p className="eyebrow">เริ่มต้นครอบครัวใหม่</p>
      <h1>สมัครสมาชิก</h1>
      {serverError && <ErrorMessage message={serverError} />}
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <label>
          ชื่อ
          <input value={values.name} onChange={(event) => update('name', event.target.value)} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label>
          อีเมล
          <input
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>
          เบอร์โทรศัพท์ (ไม่บังคับ)
          <input type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
        </label>
        <label>
          รหัสผ่าน
          <input
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <label>
          ยืนยันรหัสผ่าน
          <input
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
          />
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
      </form>
      <p className="form-footnote">มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link></p>
    </section>
  )
}
