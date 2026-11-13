import { useState } from 'react'
import { X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const storageKey = 'finding-home-puppy-dismissed'

export default function CornerPuppy() {
  const { pathname } = useLocation()
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

  if (dismissed || pathname !== '/') return null

  return (
    <div className="corner-puppy">
      <Link className="corner-puppy__link" to="/explore" aria-label="ค้นหาน้องหมา">
        <svg viewBox="0 0 128 72" aria-hidden="true">
          <path className="corner-puppy__tail" d="M26 49Q11 47 13 36q-11 6-2 17l15 4Z" fill="#fff4e9" />
          <path d="M13 59q9-17 28-20l23 2 19 20H13Z" fill="#fff4e9" />
          <path d="M30 43q12-5 21-3 2 10-9 12t-12-9Zm24-3 14 2 10 19H56q8-9-2-21Z" fill="#e88a60" />
          <path d="M57 58q10-8 23-6l24-1q14-1 14 5t-13 5H57Z" fill="#e88a60" />
          <path d="M65 53c-8-7-10-23 1-31 9-7 24-6 32 3 6 6 6 13 11 19 7 10-3 17-17 17H74q-10 0-9-8Z" fill="#fff4e9" />
          <path d="M96 25q15 1 17 13t-9 10q-6-7-8-23Z" fill="#e88a60" />
          <path className="corner-puppy__closed-eye" d="M79 40q4 5 8 0" fill="none" stroke="#583630" strokeWidth="2" strokeLinecap="round" />
          <circle className="corner-puppy__open-eye" cx="83" cy="40" r="2.5" fill="#583630" />
          <path d="M96 47q3-2 6 0l-3 4Z" fill="#583630" />
          <text className="corner-puppy__zzz" x="103" y="23" fill="#ffd0a4" fontSize="13" fontWeight="700">zZ</text>
        </svg>
      </Link>
      <button type="button" aria-label="ซ่อนน้องหมาที่มุมจอ" onClick={dismiss}>
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
