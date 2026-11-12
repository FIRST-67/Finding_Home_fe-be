import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'
import { getAllRequests, updateRequestStatus } from '../../services/requests'

const STATUS_LABEL = { pending: 'รอพิจารณา', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธแล้ว' }

export default function ManageRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRequests((await getAllRequests()).data)
    } catch (loadError) {
      setRequests([])
      setError(loadError.message || 'โหลดคำขอรับเลี้ยงไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function decide(requestId, status) {
    setUpdatingId(requestId)
    setError('')
    try {
      const updated = await updateRequestStatus(requestId, status)
      setRequests((current) => current.map((request) => request.id === requestId ? { ...request, ...updated } : request))
    } catch (updateError) {
      setError(updateError.message || 'อัปเดตสถานะไม่สำเร็จ')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <section>
      <p className="eyebrow">พื้นที่ผู้ดูแลระบบ</p>
      <h1>คำขอรับเลี้ยง</h1>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && !requests.length && <EmptyState>ยังไม่มีคำขอรับเลี้ยง</EmptyState>}
      {!loading && !error && Boolean(requests.length) && (
        <div className="request-list">
          {requests.map((request) => (
            <article className="request-card request-card--admin" key={request.id}>
              <div>
                <h2>{request.dog_name || 'คำขอรับเลี้ยง'}</h2>
                <p>{request.message}</p>
                <p>ผู้สมัคร: {request.user_name}</p>
                <span className={`request-status request-status--${request.status}`}>{STATUS_LABEL[request.status] || request.status}</span>
              </div>
              {request.status === 'pending' && (
                <div className="button-row">
                  <button type="button" disabled={updatingId === request.id} onClick={() => decide(request.id, 'approved')}>อนุมัติ</button>
                  <button className="button-danger" type="button" disabled={updatingId === request.id} onClick={() => decide(request.id, 'rejected')}>ปฏิเสธ</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
