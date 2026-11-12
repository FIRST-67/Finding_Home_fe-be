import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorMessage from '../../components/ErrorMessage'
import { createAdoptionRequest } from '../../services/requests'

export default function AdoptionFormPage() {
  const { dogId } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    applicantName: '',
    phone: '',
    homeType: '',
    homeEnvironment: '',
    experience: '',
    reason: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!values.applicantName.trim() || !values.phone.trim() || !values.homeType || !values.reason.trim()) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const message = [
        `ชื่อผู้สมัคร: ${values.applicantName.trim()}`,
        `เบอร์โทรศัพท์: ${values.phone.trim()}`,
        `ที่พักอาศัย: ${values.homeType}`,
        `สภาพแวดล้อม: ${values.homeEnvironment.trim() || '-'}`,
        `ประสบการณ์เลี้ยงสุนัข: ${values.experience.trim() || '-'}`,
        `เหตุผลที่ต้องการรับเลี้ยง: ${values.reason.trim()}`,
      ].join('\n')
      await createAdoptionRequest({ dog_id: Number(dogId), message })
      navigate('/my-requests', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="form-page form-page--wide adoption-page">
      <p className="eyebrow">เริ่มต้นการรับเลี้ยง</p>
      <h1>แบบฟอร์มขอรับเลี้ยง</h1>
      <p>ช่วยให้เรารู้จักคุณและบ้านที่กำลังจะเป็นครอบครัวของน้อง</p>
      {error && <ErrorMessage message={error} />}
      <form className="form-stack" onSubmit={handleSubmit}>
        <fieldset className="application-section">
          <legend>ข้อมูลผู้สมัคร</legend>
          <div className="form-columns">
            <label>ชื่อ-นามสกุล *
              <input autoComplete="name" value={values.applicantName} onChange={(e) => setValues({ ...values, applicantName: e.target.value })} required />
            </label>
            <label>เบอร์โทรศัพท์ *
              <input type="tel" autoComplete="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} required />
            </label>
          </div>
        </fieldset>
        <fieldset className="application-section">
          <legend>สภาพแวดล้อมที่อยู่อาศัย</legend>
          <label>ลักษณะที่พัก *
            <select value={values.homeType} onChange={(e) => setValues({ ...values, homeType: e.target.value })} required>
              <option value="">เลือกที่พักอาศัย</option>
              <option value="บ้านมีพื้นที่">บ้านมีพื้นที่</option>
              <option value="บ้านไม่มีพื้นที่">บ้านไม่มีพื้นที่</option>
              <option value="อพาร์ตเมนต์หรือคอนโด">อพาร์ตเมนต์หรือคอนโด</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </label>
          <label>เล่าเกี่ยวกับพื้นที่และคนในบ้าน
            <textarea rows="3" value={values.homeEnvironment} onChange={(e) => setValues({ ...values, homeEnvironment: e.target.value })} placeholder="เช่น มีสวน มีเด็กเล็ก หรือมีสัตว์เลี้ยงอยู่แล้ว" />
          </label>
        </fieldset>
        <fieldset className="application-section">
          <legend>ประสบการณ์และเหตุผล</legend>
          <label>ประสบการณ์เลี้ยงสุนัข
            <textarea rows="3" value={values.experience} onChange={(e) => setValues({ ...values, experience: e.target.value })} placeholder="หากยังไม่เคยเลี้ยง สามารถเว้นว่างได้" />
          </label>
          <label>ทำไมคุณจึงอยากรับเลี้ยงน้อง *
            <textarea rows="4" value={values.reason} onChange={(e) => setValues({ ...values, reason: e.target.value })} required />
          </label>
        </fieldset>
        <button type="submit" disabled={submitting}>{submitting ? 'กำลังส่งคำขอ...' : 'ส่งใบสมัครรับเลี้ยง'}</button>
      </form>
      <p className="form-footnote"><Link to={`/dogs/${dogId}`}>กลับไปดูข้อมูลน้องหมา</Link></p>
    </section>
  )
}
