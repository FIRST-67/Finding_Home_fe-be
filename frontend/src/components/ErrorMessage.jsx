export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="status error" role="alert">
      <p>{message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'}</p>
      {onRetry && <button type="button" onClick={onRetry}>ลองอีกครั้ง</button>}
    </div>
  )
}
