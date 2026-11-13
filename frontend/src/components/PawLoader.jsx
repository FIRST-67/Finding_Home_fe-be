import { PawPrint } from 'lucide-react'

export default function PawLoader({ children = 'กำลังโหลดข้อมูล...', compact = false }) {
  return (
    <div className={compact ? 'paw-loader paw-loader--compact' : 'status paw-loader'} role="status">
      <span className="inline-flex items-center gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((step) => <PawPrint key={step} size={16} style={{ '--paw-step': step }} />)}
      </span>
      <span>{children}</span>
    </div>
  )
}
