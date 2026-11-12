import { Link } from 'react-router-dom'
import DogImage from './DogImage'

export default function DogCard({ dog, isFavorite = false, onFavoriteToggle, removing = false }) {
  const age = Number(dog.age_years) < 1
    ? `${Number(dog.age_years) * 12} เดือน`
    : `${dog.age_years} ปี`
  const location = dog.location || dog.province

  return (
    <article className="dog-card">
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
            {removing ? '…' : isFavorite ? '♥' : '♡'}
          </button>
        )}
        {dog.status === 'available' && <span className="dog-card__status">พร้อมหาบ้าน</span>}
      </div>
      <div className="dog-card__content">
        <div className="dog-card__title-row">
          <h3>{dog.name}</h3>
          {location && <span className="dog-card__location">{location}</span>}
        </div>
        <p>{dog.breed_name || 'ไม่ทราบสายพันธุ์'} · {dog.age_years == null ? 'ไม่ทราบอายุ' : age}</p>
        {dog.description && <p className="dog-card__description">{dog.description}</p>}
      </div>
    </article>
  )
}
