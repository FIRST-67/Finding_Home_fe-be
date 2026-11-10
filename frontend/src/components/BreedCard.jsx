export default function BreedCard({ breed }) {
  return (
    <article className="card">
      <img src={breed.image_url || undefined} alt={breed.name} loading="lazy" />
      <div>
        <h3>{breed.name}</h3>
        <p>{breed.temperament || 'ยังไม่มีข้อมูลนิสัย'}</p>
        <p>อายุขัย: {breed.life_span || '-'}</p>
      </div>
    </article>
  )
}
