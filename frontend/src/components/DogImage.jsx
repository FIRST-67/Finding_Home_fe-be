import { useEffect, useState } from 'react'

export default function DogImage({ src, alt, className = '', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return (
      <div className={`dog-image-placeholder ${className}`} role="img" aria-label="ไม่มีรูปสุนัข">
        🐶
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
    />
  )
}
