import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/auth'
import { validateLogin } from '../utils/validators'

function getReturnPath(from) {
  if (typeof from === 'string') return from.startsWith('/') ? from : '/'
  if (from?.pathname?.startsWith('/')) return `${from.pathname}${from.search || ''}`
  return '/'
}

export default function LoginPage() {
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { setSession } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateLogin(values)
    setErrors(validation)
    setServerError('')
    if (Object.keys(validation).length) return

    setSubmitting(true)
    try {
      const session = await login(values)
      setSession(session)
      navigate(getReturnPath(location.state?.from), { replace: true })
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
      <p className="eyebrow">ยินดีต้อนรับกลับบ้าน</p>
      <h1>เข้าสู่ระบบ</h1>
      <p>เข้าสู่ระบบเพื่อดูแลรายการโปรดและติดตามคำขอรับเลี้ยง</p>
      {serverError && <ErrorMessage message={serverError} />}
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <label>
          อีเมล
          <input
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>
          รหัสผ่าน
          <input
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <p className="form-footnote">ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link></p>
    </section>
  )
}
