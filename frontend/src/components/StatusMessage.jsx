// ใช้กับทุกหน้าที่เรียก API: loading / empty / error
export default function StatusMessage({ type, children }) {
  return (
    <div
      className={`status ${type === 'error' ? 'error' : ''}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
