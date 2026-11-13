export default function DogCardSkeletons({ count = 4, label = 'กำลังค้นหาน้องหมา...', loader }) {
  return (
    <div className="grid dog-skeleton-grid" role={loader ? undefined : 'status'} aria-label={loader ? undefined : label}>
      {loader}
      {Array.from({ length: count }, (_, index) => (
        <div className="dog-skeleton-card" key={index} aria-hidden="true">
          <div className="dog-skeleton-card__photo" />
          <div className="dog-skeleton-card__content">
            <span className="dog-skeleton-card__line dog-skeleton-card__line--title" />
            <span className="dog-skeleton-card__line" />
            <span className="dog-skeleton-card__line dog-skeleton-card__line--short" />
          </div>
        </div>
      ))}
    </div>
  )
}
