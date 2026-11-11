import { Link } from 'react-router-dom'
import DogImage from './DogImage'

export default function DogCard({ dog }) {
  return (
    <article className="dog-card">
      <Link className="dog-card__image-link" to={`/dogs/${dog.id}`} aria-label={`ดูข้อมูล${dog.name}`}>
        <DogImage src={dog.image_url} alt={dog.name} />
      </Link>
      <div className="dog-card__content">
        <h3>{dog.name}</h3>
        <p>{dog.breed || 'ไม่ทราบสายพันธุ์'} · {dog.age || 'ไม่ทราบอายุ'}</p>
        {dog.description && <p className="dog-card__description">{dog.description}</p>}
      </div>
    </article>
  )
}
