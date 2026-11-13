import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import PawLoader from '../../components/PawLoader'
import { cancelRequest, getMyRequests } from '../../services/requests'

function statusLabel(status) {
  if (status === 'approved') return 'อนุมัติแล้ว'
  if (status === 'rejected') return 'ไม่อนุมัติ'
  if (status === 'cancelled') return 'ยกเลิกแล้ว'
  return 'รอพิจารณา'
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

  return (
    <section>
      <h1>คำขอรับเลี้ยงของฉัน</h1>
      {loading && <PawLoader />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
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
                <span className={`request-status request-status--${request.status}`}>{statusLabel(request.status)}</span>
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
