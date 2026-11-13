import { useState } from 'react'
import { X } from 'lucide-react'
import PuppyFace from './PuppyFace'

const storageKey = 'finding-home-puppy-dismissed'

export default function CornerPuppy() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) === 'true'
    } catch {
      return false
    }
  })

  function dismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(storageKey, 'true')
    } catch {
      // The mounted component still remembers dismissal during navigation.
    }
  }

  if (dismissed) return null

  return (
    <div className="corner-puppy">
      <svg viewBox="0 24 80 54" aria-hidden="true"><PuppyFace /></svg>
      <button type="button" aria-label="ซ่อนน้องหมาที่มุมจอ" onClick={dismiss}>
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
