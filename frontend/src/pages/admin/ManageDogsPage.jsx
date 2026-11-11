import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import ImageUpload from '../../components/ImageUpload'
import Loading from '../../components/Loading'
import DogImage from '../../components/DogImage'
import { deleteDog, getDogs, uploadDogImage } from '../../services/dogs'

export default function ManageDogsPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadErrors, setUploadErrors] = useState({})
  const [uploadingId, setUploadingId] = useState('')
  const [editingImageId, setEditingImageId] = useState('')
  const [selectedFiles, setSelectedFiles] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDogs(await getDogs())
    } catch (loadError) {
      setDogs([])
      setError(loadError.message || 'โหลดข้อมูลสุนัขไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function remove(dog) {
    if (!window.confirm(`ยืนยันลบข้อมูล${dog.name}?`)) return
    try {
      await deleteDog(dog.id)
      setDogs((current) => current.filter((entry) => entry.id !== dog.id))
    } catch (deleteError) {
      setError(deleteError.message || 'ลบข้อมูลไม่สำเร็จ')
    }
  }

  async function changeImage(dogId) {
    const file = selectedFiles[dogId]
    if (!file) return
    setUploadingId(dogId)
    setUploadErrors((current) => ({ ...current, [dogId]: '' }))
    try {
      await uploadDogImage(dogId, file)
      setSelectedFiles((current) => ({ ...current, [dogId]: null }))
      setEditingImageId('')
      await load()
    } catch (uploadError) {
      setUploadErrors((current) => ({ ...current, [dogId]: `อัปโหลดรูปไม่สำเร็จ: ${uploadError.message}` }))
    } finally {
      setUploadingId('')
    }
  }

  return (
    <section>
      <div className="section-heading">
        <div><p className="eyebrow">พื้นที่ผู้ดูแลระบบ</p><h1>จัดการสุนัข</h1></div>
        <Link className="button-link" to="/admin/dogs/new">เพิ่มสุนัข</Link>
      </div>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && !dogs.length && <EmptyState>ยังไม่มีข้อมูลสุนัข เพิ่มข้อมูลตัวแรกได้เลย</EmptyState>}
      {!loading && !error && Boolean(dogs.length) && (
        <div className="table-scroll">
          <table>
            <thead><tr><th>รูป</th><th>ชื่อ</th><th>สายพันธุ์</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
            <tbody>
              {dogs.map((dog) => (
                <tr key={dog.id}>
                  <td><DogImage className="admin-dog-image" src={dog.image_url} alt={dog.name} /></td>
                  <td>{dog.name}</td><td>{dog.breed}</td><td>{dog.status}</td>
                  <td>
                    <div className="button-row">
                      <Link className="button-link button-link--small" to={`/admin/dogs/${dog.id}/edit`}>แก้ไข</Link>
                      <button className="button-danger" type="button" onClick={() => remove(dog)}>ลบ</button>
                      <button className="button-link button-link--secondary button-link--small" type="button" onClick={() => setEditingImageId(editingImageId === dog.id ? '' : dog.id)}>เปลี่ยนรูป</button>
                    </div>
                    {editingImageId === dog.id && (
                      <div className="table-image-upload">
                        <ImageUpload
                          currentImage={dog.image_url}
                          onFileChange={(file) => setSelectedFiles((current) => ({ ...current, [dog.id]: file }))}
                          uploading={uploadingId === dog.id}
                          error={uploadErrors[dog.id]}
                          onUpload={() => changeImage(dog.id)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
