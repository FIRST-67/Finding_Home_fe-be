import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorMessage from '../../components/ErrorMessage'
import { createAdoptionRequest } from '../../services/requests'

export default function AdoptionFormPage() {
  const { dogId } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState({ message: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!values.message.trim() || !values.phone.trim() || !values.address.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createAdoptionRequest({ dogId, ...values })
      navigate('/my-requests', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="form-page">
      <p className="eyebrow">เริ่มต้นการรับเลี้ยง</p>
      <h1>ส่งคำขอรับเลี้ยง</h1>
      <p>เล่าให้เราฟังว่าคุณพร้อมดูแลน้องอย่างไร</p>
      {error && <ErrorMessage message={error} />}
      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          ข้อความถึงผู้ดูแล
          <textarea rows="4" value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} />
        </label>
        <label>
          เบอร์โทรศัพท์
          <input type="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
        </label>
        <label>
          ที่อยู่
          <textarea rows="3" value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอ'}</button>
      </form>
      <p className="form-footnote"><Link to={`/dogs/${dogId}`}>กลับไปดูข้อมูลน้องหมา</Link></p>
    </section>
  )
}
