import { Link } from 'react-router-dom'
import { Calendar, Heart, MapPin } from 'lucide-react'
import DogImage from './DogImage'

export default function DogCard({
  dog,
  isFavorite = false,
  onFavoriteToggle,
  removing = false,
  style,
}) {
  const age = Number(dog.age_years) < 1
    ? `${Number(dog.age_years) * 12} เดือน`
    : `${dog.age_years} ปี`
  const location = dog.location || dog.province
  const gender = dog.gender === 'female' ? 'เพศเมีย' : dog.gender === 'male' ? 'เพศผู้' : 'ไม่ระบุเพศ'

  return (
    <article className="dog-card dog-card--enter" style={style}>
      <svg className="dog-card__peek" viewBox="0 0 80 52" aria-hidden="true">
        <path d="M22 23Q12 0 18 3l15 9h14l15-9q6-3-4 20Z" fill="#e89559" />
        <path d="m21 8 9 8-6 4Zm38 0-9 8 6 4Z" fill="#ffe5cc" />
        <ellipse cx="40" cy="29" rx="23" ry="19" fill="#e89559" />
        <path d="M38 14h4l3 15q10 1 10 8 0 7-15 7t-15-7q0-7 10-8Z" fill="#fff3e5" />
        <path d="M30 28h.1m19.9 0h.1" stroke="#59372d" strokeWidth="3" strokeLinecap="round" />
        <path d="M37 33q3-2 6 0l-3 3Z" fill="#59372d" />
        <ellipse cx="12" cy="46" rx="10" ry="5" fill="#e89559" />
        <ellipse cx="68" cy="46" rx="10" ry="5" fill="#e89559" />
      </svg>
      <div className="dog-card__photo">
        <Link className="dog-card__image-link" to={`/dogs/${dog.id}`} aria-label={`ดูข้อมูล${dog.name}`}>
          <DogImage src={dog.image_url} alt={dog.name} breed={dog.breed_name} />
        </Link>
        {onFavoriteToggle && (
          <button
            className={`dog-card__favorite${isFavorite ? ' is-favorite' : ''}`}
            type="button"
            disabled={removing}
            onClick={() => onFavoriteToggle(dog)}
            aria-label={isFavorite ? `นำ${dog.name}ออกจากรายการโปรด` : `เพิ่ม${dog.name}ในรายการโปรด`}
            aria-pressed={isFavorite}
          >
            {removing ? '…' : <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />}
          </button>
        )}
        {dog.status === 'available' && (
          <span className="dog-card__status dog-card__status--available">พร้อมหาบ้าน</span>
        )}
      </div>
      <div className="dog-card__content">
        <div className="dog-card__title-row">
          <h3>{dog.name}</h3>
        </div>
        <p>{dog.breed_name || 'ไม่ทราบสายพันธุ์'}</p>
        <div className="dog-card__facts">
          <span><Heart size={13} aria-hidden="true" />{gender}</span>
          <span><Calendar size={13} aria-hidden="true" />{dog.age_years == null ? 'ไม่ทราบอายุ' : age}</span>
          {location && <span><MapPin size={13} aria-hidden="true" />{location}</span>}
        </div>
        {dog.description && <p className="dog-card__description">{dog.description}</p>}
      </div>
    </article>
  )
}
