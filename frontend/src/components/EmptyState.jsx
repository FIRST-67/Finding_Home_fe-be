export default function EmptyState({ children = 'ยังไม่มีข้อมูล' }) {
  return <div className="status empty-state" role="status">{children}</div>
}
