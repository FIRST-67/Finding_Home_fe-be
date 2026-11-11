import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ImageUpload from '../../components/ImageUpload'
import Loading from '../../components/Loading'
import { createDog, getDog, updateDog, uploadDogImage } from '../../services/dogs'

const EMPTY_DOG = {
  name: '',
  breed: '',
  age: '',
  gender: '',
  size: '',
  description: '',
  status: 'available',
  image_url: null,
}

export default function DogFormPage() {
  const { dogId } = useParams()
  const isEditing = Boolean(dogId)
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_DOG)
  const [imageFile, setImageFile] = useState(null)
  const [savedDogId, setSavedDogId] = useState(dogId || '')
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    if (!dogId) return
    setLoading(true)
    setError('')
    try {
      const dog = await getDog(dogId)
      setValues({ ...EMPTY_DOG, ...dog })
      setSavedDogId(dog.id)
    } catch (loadError) {
      setError(loadError.message || 'โหลดข้อมูลสุนัขไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [dogId])

  useEffect(() => { load() }, [load])

  async function uploadImage(targetId = savedDogId, file = imageFile) {
    if (!targetId || !file) return false
    setUploading(true)
    setError('')
    try {
      const result = await uploadDogImage(targetId, file)
      setValues((current) => ({ ...current, image_url: result.image_url }))
      setImageFile(null)
      setSuccess('บันทึกข้อมูลและอัปโหลดรูปเรียบร้อยแล้ว')
      return true
    } catch (uploadError) {
      setError(`บันทึกข้อมูลสุนัขสำเร็จ แต่รูปไม่สำเร็จ: ${uploadError.message}`)
      return false
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      let savedDog
      if (savedDogId) {
        savedDog = await updateDog(savedDogId, values)
      } else {
        savedDog = await createDog(values)
        setSavedDogId(savedDog.id)
      }
      if (imageFile) {
        const uploaded = await uploadImage(savedDog.id || savedDogId, imageFile)
        if (!uploaded) return
      } else {
        setSuccess(isEditing ? 'บันทึกข้อมูลสุนัขแล้ว' : 'เพิ่มข้อมูลสุนัขแล้ว')
      }
      navigate('/admin/dogs', { replace: true })
    } catch (saveError) {
      setError(saveError.message || 'บันทึกข้อมูลสุนัขไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  async function retryImageUpload() {
    if (await uploadImage()) navigate('/admin/dogs', { replace: true })
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
      {error.startsWith('บันทึกข้อมูลสุนัขสำเร็จ แต่รูปไม่สำเร็จ:') && (
        <button type="button" disabled={uploading || submitting} onClick={retryImageUpload}>
          ลองอัปโหลดรูปอีกครั้ง
        </button>
      )}
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="form-columns">
          <label>ชื่อ<input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required /></label>
          <label>สายพันธุ์<input value={values.breed} onChange={(e) => setValues({ ...values, breed: e.target.value })} required /></label>
          <label>อายุ<input value={values.age} onChange={(e) => setValues({ ...values, age: e.target.value })} required /></label>
          <label>เพศ
            <select value={values.gender} onChange={(e) => setValues({ ...values, gender: e.target.value })} required>
              <option value="">เลือกเพศ</option><option value="male">เพศผู้</option><option value="female">เพศเมีย</option>
            </select>
          </label>
          <label>ขนาด
            <select value={values.size} onChange={(e) => setValues({ ...values, size: e.target.value })} required>
              <option value="">เลือกขนาด</option><option value="small">เล็ก</option><option value="medium">กลาง</option><option value="large">ใหญ่</option>
            </select>
          </label>
          <label>สถานะ
            <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })}>
              <option value="available">พร้อมหาบ้าน</option><option value="pending">มีผู้สนใจ</option><option value="adopted">ได้บ้านแล้ว</option>
            </select>
          </label>
        </div>
        <label>รายละเอียด<textarea rows="5" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></label>
        <ImageUpload
          currentImage={values.image_url}
          onFileChange={(file) => {
            setImageFile(file)
            if (file) setError('')
          }}
          uploading={uploading}
          error={error.startsWith('บันทึกข้อมูลสุนัขสำเร็จ แต่รูปไม่สำเร็จ:') ? error : ''}
        />
        <div className="button-row">
          <button type="submit" disabled={submitting || uploading}>{submitting || uploading ? 'กำลังบันทึก...' : 'บันทึกสุนัข'}</button>
          <Link className="button-link button-link--secondary" to="/admin/dogs">ยกเลิก</Link>
        </div>
      </form>
    </section>
  )
}
