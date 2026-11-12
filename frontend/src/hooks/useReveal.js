import { useEffect, useRef, useState } from 'react'

export default function useReveal() {
  const ref = useRef(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    if (typeof window.IntersectionObserver !== 'function') {
      setIsRevealed(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsRevealed(true)
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.15 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isRevealed }
}
