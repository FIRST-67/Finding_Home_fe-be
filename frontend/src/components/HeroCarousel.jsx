import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DogImage from './DogImage'

const SLIDE_INTERVAL = 4500
const FADE_DURATION = 300

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function getAgeLabel(age) {
  if (age == null) return 'ไม่ทราบอายุ'
  if (Number(age) < 1) return `${Math.round(Number(age) * 12)} เดือน`
  return `${age} ปี`
}

function getSlideAlt(dog) {
  return `${dog.name} สุนัข${dog.breed_name ? ` ${dog.breed_name}` : ''}`
}

export default function HeroCarousel({ dogs, loading = false }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(() => !prefersReducedMotion())
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [manualChange, setManualChange] = useState(false)
  const fadeTimeout = useRef(null)
  const touchStartX = useRef(null)
  const isHovered = useRef(false)
  const isFocused = useRef(false)
  const hasMultipleSlides = dogs.length > 1

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return undefined

    const updatePreference = (event) => {
      setReducedMotion(event.matches)
      setIsPlaying(!event.matches)
    }

    mediaQuery.addEventListener?.('change', updatePreference)
    return () => mediaQuery.removeEventListener?.('change', updatePreference)
  }, [])

  useEffect(() => () => {
    if (fadeTimeout.current) window.clearTimeout(fadeTimeout.current)
  }, [])

  const changeSlide = useCallback((nextIndex, isManual) => {
    if (nextIndex === activeIndex) return
    if (fadeTimeout.current) window.clearTimeout(fadeTimeout.current)

    setPreviousIndex(activeIndex)
    setActiveIndex(nextIndex)
    setManualChange(isManual)
    fadeTimeout.current = window.setTimeout(() => setPreviousIndex(null), FADE_DURATION)
  }, [activeIndex])

  useEffect(() => {
    if (!hasMultipleSlides || !isPlaying || interactionPaused || reducedMotion) return undefined

    const timer = window.setInterval(() => {
      changeSlide((activeIndex + 1) % dogs.length, false)
    }, SLIDE_INTERVAL)
    return () => window.clearInterval(timer)
  }, [activeIndex, changeSlide, dogs.length, hasMultipleSlides, interactionPaused, isPlaying, reducedMotion])

  useEffect(() => {
    if (!hasMultipleSlides) return undefined
    const nextDog = dogs[(activeIndex + 1) % dogs.length]
    if (!nextDog?.image_url) return undefined

    const image = new window.Image()
    image.src = nextDog.image_url
    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [activeIndex, dogs, hasMultipleSlides])

  const pause = useCallback(() => setInteractionPaused(true), [])

  function handleKeyDown(event) {
    if (!hasMultipleSlides) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      changeSlide((activeIndex + 1) % dogs.length, true)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      changeSlide((activeIndex - 1 + dogs.length) % dogs.length, true)
    }
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      isFocused.current = false
      setInteractionPaused(isHovered.current)
    }
  }

  function handleMouseLeave() {
    isHovered.current = false
    setInteractionPaused(isFocused.current)
  }

  function handleTouchEnd(event) {
    if (touchStartX.current == null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (hasMultipleSlides && Math.abs(delta) > 40) {
      const direction = delta < 0 ? 1 : -1
      changeSlide((activeIndex + direction + dogs.length) % dogs.length, true)
    }
    touchStartX.current = null
    setInteractionPaused(isHovered.current || isFocused.current)
  }

  function handleTouchStart(event) {
    if (!hasMultipleSlides) return
    touchStartX.current = event.touches[0].clientX
    pause()
  }

  if (loading) {
    return <div className="home-intro__skeleton" role="status" aria-label="กำลังโหลดรูปน้องหมา" />
  }
  if (!dogs.length) return null

  const activeDog = dogs[activeIndex]
  const previousDog = previousIndex == null ? null : dogs[previousIndex]

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-label="น้องหมาที่พร้อมหาบ้าน"
      aria-live={manualChange ? 'polite' : 'off'}
      onMouseEnter={() => {
        isHovered.current = true
        pause()
      }}
      onMouseLeave={handleMouseLeave}
      onFocus={() => {
        isFocused.current = true
        pause()
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="home-intro__photo">
        {previousDog && (
          <Link
            className="hero-carousel__slide hero-carousel__slide--previous"
            to={`/dogs/${previousDog.id}`}
            aria-hidden="true"
            tabIndex={-1}
          >
            <DogImage
              src={previousDog.image_url}
              alt={getSlideAlt(previousDog)}
              placeholderAlt={getSlideAlt(previousDog)}
              breed={previousDog.breed_name}
              loading="eager"
            />
            <span className="home-intro__photo-label">
              <strong>{previousDog.name}</strong>
              <span>{previousDog.breed_name || 'ไม่ทราบสายพันธุ์'} · {getAgeLabel(previousDog.age_years)}</span>
              <span className="hero-carousel__status">พร้อมหาบ้าน</span>
            </span>
          </Link>
        )}

        <Link
          className={`hero-carousel__slide hero-carousel__slide--active${previousDog ? ' is-fading-in' : ''}`}
          to={`/dogs/${activeDog.id}`}
          aria-label={`ดูข้อมูล${activeDog.name}`}
          key={activeDog.id}
        >
          <DogImage
            src={activeDog.image_url}
            alt={getSlideAlt(activeDog)}
            placeholderAlt={getSlideAlt(activeDog)}
            breed={activeDog.breed_name}
            loading="eager"
          />
          <span className="home-intro__photo-label">
            <strong>{activeDog.name}</strong>
            <span>{activeDog.breed_name || 'ไม่ทราบสายพันธุ์'} · {getAgeLabel(activeDog.age_years)}</span>
            <span className="hero-carousel__status">พร้อมหาบ้าน</span>
          </span>
        </Link>

        {hasMultipleSlides && (
          <>
            <button
              className="hero-carousel__arrow hero-carousel__arrow--previous"
              type="button"
              aria-label="น้องหมาก่อนหน้า"
              onClick={() => changeSlide((activeIndex - 1 + dogs.length) % dogs.length, true)}
            >
              ‹
            </button>
            <button
              className="hero-carousel__arrow hero-carousel__arrow--next"
              type="button"
              aria-label="น้องหมาถัดไป"
              onClick={() => changeSlide((activeIndex + 1) % dogs.length, true)}
            >
              ›
            </button>
          </>
        )}
      </div>

      {hasMultipleSlides && (
        <div className="hero-carousel__controls">
          <div className="hero-carousel__dots" role="group" aria-label="เลือกสไลด์">
            {dogs.map((dog, index) => (
              <button
                className={`hero-carousel__dot${index === activeIndex ? ' is-active' : ''}`}
                key={dog.id}
                type="button"
                aria-label={`แสดงสไลด์ ${index + 1}: ${dog.name}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => changeSlide(index, true)}
              />
            ))}
          </div>
          <button
            className="hero-carousel__play"
            type="button"
            disabled={reducedMotion}
            aria-label={isPlaying ? 'หยุดเล่นสไลด์อัตโนมัติ' : 'เล่นสไลด์อัตโนมัติ'}
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isPlaying ? 'หยุด' : 'เล่น'}
          </button>
        </div>
      )}
    </div>
  )
}
