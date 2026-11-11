import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import Loading from '../../components/Loading'
import ImageUpload from '../../components/ImageUpload'
import { createDog, getDog, updateDog } from '../../services/dogs'

const EMPTY_DOG = {
  name: '',
  breed_id: '',
  breed_name: '',
  age_years: '0',
  gender: '',
  description: '',
  status: 'available',
  image_url: '',
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}

export default function DogFormPage() {
  const { dogId } = useParams()
  const isEditing = Boolean(dogId)
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_DOG)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [readingImage, setReadingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    if (!dogId) return
    setLoading(true)
    setError('')
    try {
      const dog = await getDog(dogId)
      setValues({ ...EMPTY_DOG, ...dog })
    } catch (loadError) {
      setError(loadError.message || 'โหลดข้อมูลสุนัขไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [dogId])

  useEffect(() => { load() }, [load])

  async function handleImageChange(file) {
    if (!file) return
    setReadingImage(true)
    setError('')
    try {
      const image_url = await readImageFile(file)
      setValues((current) => ({ ...current, image_url }))
    } catch (imageError) {
      setError(imageError.message)
    } finally {
      setReadingImage(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const dog = {
        name: values.name,
        breed_id: values.breed_id === '' ? null : Number(values.breed_id),
        breed_name: values.breed_name,
        age_years: Number(values.age_years),
        gender: values.gender,
        description: values.description,
        image_url: values.image_url,
      }
      if (isEditing) await updateDog(dogId, { ...dog, status: values.status })
      else await createDog(dog)
      setSuccess(isEditing ? 'บันทึกข้อมูลสุนัขแล้ว' : 'เพิ่มข้อมูลสุนัขแล้ว')
      navigate('/admin/dogs', { replace: true })
    } catch (saveError) {
      setError(saveError.message || 'บันทึกข้อมูลสุนัขไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading>กำลังโหลดข้อมูลสุนัข...</Loading>
  if (isEditing && error && !values.id) {
    return <ErrorMessage message={error} onRetry={load} />
  }
  if (isEditing && !values.id) return <EmptyState>ไม่พบข้อมูลสุนัข</EmptyState>

  return (
    <section className="form-page form-page--wide">
      <p className="eyebrow">จัดการข้อมูลสุนัข</p>
      <h1>{isEditing ? 'แก้ไขข้อมูลสุนัข' : 'เพิ่มสุนัขใหม่'}</h1>
      {error && <ErrorMessage message={error} />}
      {success && <p className="success-message" role="status">{success}</p>}
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="form-columns">
          <label>ชื่อ<input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required /></label>
          <label>รหัสสายพันธุ์<input type="number" min="1" value={values.breed_id ?? ''} onChange={(e) => setValues({ ...values, breed_id: e.target.value })} /></label>
          <label>สายพันธุ์<input value={values.breed_name} onChange={(e) => setValues({ ...values, breed_name: e.target.value })} /></label>
          <label>อายุ (ปี)<input type="number" min="0" step="0.1" value={values.age_years} onChange={(e) => setValues({ ...values, age_years: e.target.value })} required /></label>
          <label>เพศ
            <select value={values.gender} onChange={(e) => setValues({ ...values, gender: e.target.value })} required>
              <option value="">เลือกเพศ</option><option value="male">เพศผู้</option><option value="female">เพศเมีย</option>
            </select>
          </label>
          {isEditing && <label>สถานะ
            <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })}>
              <option value="available">พร้อมหาบ้าน</option><option value="adopted">ได้บ้านแล้ว</option>
            </select>
          </label>}
        </div>
        <label>รายละเอียด<textarea rows="5" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></label>
        <ImageUpload currentImage={values.image_url} onFileChange={handleImageChange} />
        <div className="button-row">
          <button type="submit" disabled={submitting || readingImage}>
            {readingImage ? 'กำลังอ่านรูป...' : submitting ? 'กำลังบันทึก...' : 'บันทึกสุนัข'}
          </button>
          <Link className="button-link button-link--secondary" to="/admin/dogs">ยกเลิก</Link>
        </div>
      </form>
    </section>
  )
}
