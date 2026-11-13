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
      <span className="dog-card__ears" aria-hidden="true" />
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
