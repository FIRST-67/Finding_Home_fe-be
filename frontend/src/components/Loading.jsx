export default function Loading({ children = 'กำลังโหลดข้อมูล...' }) {
  return <div className="status" role="status" aria-live="polite">{children}</div>
}
