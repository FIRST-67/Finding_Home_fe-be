import PuppyFace from './PuppyFace'

export default function EmptyState({ children = 'ยังไม่มีข้อมูล', illustrated = false, action }) {
  return (
    <div className="status empty-state">
      {illustrated && (
        <svg className="empty-state__house mx-auto mb-3" viewBox="0 0 144 104" aria-hidden="true">
          <path d="M27 46 72 10l45 36v47H27Z" fill="var(--peach)" stroke="var(--terracotta)" strokeWidth="2" />
          <path d="M18 49 72 6l54 43" fill="none" stroke="var(--button-color)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M49 93V65a23 23 0 0 1 46 0v28Z" fill="var(--button-color)" />
          <g transform="translate(37 29) scale(.87)"><PuppyFace /></g>
          <path d="M19 94h106" stroke="var(--terracotta)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <p role="status">{children}</p>
      {action}
    </div>
  )
}
