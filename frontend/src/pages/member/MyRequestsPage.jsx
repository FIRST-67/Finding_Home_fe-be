import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'
import { getMyRequests } from '../../services/requests'

function statusLabel(status) {
  if (status === 'approved') return 'อนุมัติแล้ว'
  if (status === 'rejected') return 'ไม่อนุมัติ'
  return 'รอพิจารณา'
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRequests(await getMyRequests())
    } catch (loadError) {
      setRequests([])
      setError(loadError.message || 'โหลดสถานะคำขอไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <section>
      <h1>คำขอรับเลี้ยงของฉัน</h1>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && !requests.length && <EmptyState>คุณยังไม่มีคำขอรับเลี้ยง</EmptyState>}
      {!loading && !error && Boolean(requests.length) && (
        <div className="request-list">
          {requests.map((request) => (
            <article className="request-card" key={request.id}>
              <div>
                <h2>{request.dog?.name || request.dogName || 'คำขอรับเลี้ยง'}</h2>
                <p>{request.message}</p>
              </div>
              <span className={`request-status request-status--${request.status}`}>{statusLabel(request.status)}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
