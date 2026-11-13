import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import PawLoader from '../../components/PawLoader'
import { cancelRequest, getMyRequests } from '../../services/requests'

const STATUS_LABELS = {
  pending: 'รอพิจารณา',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  cancelled: 'ยกเลิกแล้ว',
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
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

  async function cancel(id) {
    setCancellingId(id)
    setError('')
    try {
      await cancelRequest(id)
      setRequests((current) => current.map((request) =>
        request.id === id ? { ...request, status: 'cancelled' } : request))
    } catch (cancelError) {
      setError(cancelError.message || 'ยกเลิกคำขอไม่สำเร็จ')
    } finally {
      setCancellingId(null)
    }
  }

  const counts = { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
  for (const { status } of requests) {
    if (Object.hasOwn(counts, status)) counts[status] += 1
  }

  return (
    <section>
      <h1>คำขอรับเลี้ยงของฉัน</h1>
      {loading && <PawLoader />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && (
        <ul aria-label="สรุปสถานะคำขอ" className="my-4 flex list-none flex-wrap gap-2 p-0">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <li key={status} className={`request-status request-status--${status}`}>
              {label} {counts[status]}
            </li>
          ))}
        </ul>
      )}
      {!loading && !error && !requests.length && (
        <EmptyState illustrated action={<Link className="button-link" to="/explore">เลือกดูน้องหมา</Link>}>
          ยังไม่มีคำขอรับเลี้ยง
        </EmptyState>
      )}
      {!loading && !error && Boolean(requests.length) && (
        <div className="request-list">
          {requests.map((request) => (
            <article className="request-card" key={request.id}>
              <div>
                <h2>{request.dog_name || 'คำขอรับเลี้ยง'}</h2>
                <p>{request.message}</p>
              </div>
              <div>
                <span className={`request-status request-status--${request.status}`}>{STATUS_LABELS[request.status] ?? STATUS_LABELS.pending}</span>
                {request.status === 'pending' && (
                  <button type="button" disabled={cancellingId === request.id} onClick={() => cancel(request.id)}>
                    {cancellingId === request.id ? 'กำลังยกเลิก...' : 'ยกเลิกคำขอ'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
