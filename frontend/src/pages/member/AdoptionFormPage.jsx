import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorMessage from '../../components/ErrorMessage'
import { createAdoptionRequest } from '../../services/requests'

export default function AdoptionFormPage() {
  const { dogId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!message.trim()) {
      setError('กรุณากรอกข้อความถึงผู้ดูแล')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createAdoptionRequest({ dog_id: Number(dogId), message })
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
          <textarea rows="4" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอ'}</button>
      </form>
      <p className="form-footnote"><Link to={`/dogs/${dogId}`}>กลับไปดูข้อมูลน้องหมา</Link></p>
    </section>
  )
}
