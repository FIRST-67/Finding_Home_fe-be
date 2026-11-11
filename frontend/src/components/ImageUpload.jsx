import { useEffect, useState } from 'react'
import DogImage from './DogImage'
import { validateImageFile } from '../utils/validators'

export default function ImageUpload({
  onFileChange,
  onUpload,
  uploading = false,
  error = '',
  currentImage,
}) {
  const [file, setFile] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  // Release temporary preview URLs when the selected file changes or the component unmounts.
  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleChange(event) {
    const nextFile = event.target.files?.[0] || null
    const message = nextFile ? validateImageFile(nextFile) : ''
    setValidationError(message)
    const acceptedFile = message ? null : nextFile
    setFile(acceptedFile)
    onFileChange?.(acceptedFile)
  }

  return (
    <div className="image-upload">
      {previewUrl ? (
        <img className="image-upload__preview" src={previewUrl} alt="ตัวอย่างรูปสุนัข" />
      ) : currentImage ? (
        <DogImage src={currentImage} alt="รูปสุนัขปัจจุบัน" className="image-upload__preview" />
      ) : (
        <div className="image-upload__preview dog-image-placeholder" role="img" aria-label="ยังไม่มีรูปสุนัข">🐶</div>
      )}
      <label className="file-label">
        เลือกรูป JPG, PNG หรือ WEBP (ไม่เกิน 2MB)
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
      </label>
      {(validationError || error) && <p className="field-error" role="alert">{validationError || error}</p>}
      {onUpload && (
        <button
          type="button"
          disabled={!file || uploading || Boolean(validationError)}
          onClick={() => onUpload(file)}
        >
          {uploading ? 'กำลังอัปโหลดรูป...' : 'อัปโหลดรูป'}
        </button>
      )}
    </div>
  )
}
