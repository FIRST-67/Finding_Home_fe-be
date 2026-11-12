import { useEffect, useState } from 'react'
import { PawPrint } from 'lucide-react'

const SHIBA_FALLBACK = 'https://images.dog.ceo/breeds/shiba/shiba-4.jpg'
const DOG_FALLBACK = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=85'

export default function DogImage({
  src,
  alt,
  placeholderAlt = 'ไม่มีรูปสุนัข',
  breed = '',
  className = '',
  loading = 'lazy',
}) {
  const [imageSrc, setImageSrc] = useState(src)
  const fallbackSrc = /shiba/i.test(breed) ? SHIBA_FALLBACK : DOG_FALLBACK

  useEffect(() => setImageSrc(src), [src])

  if (!src || !imageSrc) {
    return (
      <div className={`dog-image-placeholder ${className}`} role="img" aria-label={placeholderAlt}>
        <PawPrint aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      className={className}
      src={imageSrc}
      alt={alt}
      loading={loading}
      onError={() => setImageSrc((current) => current === fallbackSrc ? null : fallbackSrc)}
    />
  )
}
