import { Link } from 'react-router-dom'
import DogImage from './DogImage'

export default function DogCard({ dog }) {
  const age = Number(dog.age_years) < 1
    ? `${Number(dog.age_years) * 12} เดือน`
    : `${dog.age_years} ปี`

  return (
    <article className="dog-card">
      <Link className="dog-card__image-link" to={`/dogs/${dog.id}`} aria-label={`ดูข้อมูล${dog.name}`}>
        <DogImage src={dog.image_url} alt={dog.name} />
      </Link>
      <div className="dog-card__content">
        <h3>{dog.name}</h3>
        <p>{dog.breed_name || 'ไม่ทราบสายพันธุ์'} · {dog.age_years == null ? 'ไม่ทราบอายุ' : age}</p>
        {dog.description && <p className="dog-card__description">{dog.description}</p>}
      </div>
    </article>
  )
}
