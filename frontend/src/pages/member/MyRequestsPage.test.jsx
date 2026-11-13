import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MyRequestsPage from './MyRequestsPage'
import { cancelRequest, getMyRequests } from '../../services/requests'

jest.mock('../../services/requests', () => ({
  cancelRequest: jest.fn(),
  getMyRequests: jest.fn(),
}))

function renderPage() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MyRequestsPage />
    </MemoryRouter>,
  )
}

it('summarizes loaded requests and updates the counts after cancellation', async () => {
  getMyRequests.mockResolvedValue([
    { id: 1, dog_name: 'มะลิ', status: 'pending' },
    { id: 2, dog_name: 'ถุงทอง', status: 'approved' },
    { id: 3, dog_name: 'ข้าวปั้น', status: 'rejected' },
    { id: 4, dog_name: 'โกโก้', status: 'cancelled' },
  ])
  cancelRequest.mockResolvedValue(null)
  renderPage()
  expect(screen.queryByRole('list', { name: 'สรุปสถานะคำขอ' })).not.toBeInTheDocument()

  const summary = within(await screen.findByRole('list', { name: 'สรุปสถานะคำขอ' }))
  expect(summary.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'รอพิจารณา 1', 'อนุมัติแล้ว 1', 'ไม่อนุมัติ 1', 'ยกเลิกแล้ว 1',
  ])
  fireEvent.click(screen.getByRole('button', { name: 'ยกเลิกคำขอ' }))
  expect(await summary.findByText('ยกเลิกแล้ว 2')).toBeInTheDocument()
  expect(summary.getByText('รอพิจารณา 0')).toBeInTheDocument()
  expect(cancelRequest).toHaveBeenCalledWith(1)
})

it('shows zero counts and the existing empty state when there are no requests', async () => {
  getMyRequests.mockResolvedValue([])
  renderPage()
  const summary = within(await screen.findByRole('list', { name: 'สรุปสถานะคำขอ' }))
  expect(summary.getAllByRole('listitem').every((item) => item.textContent.endsWith(' 0'))).toBe(true)
  expect(screen.getByText('ยังไม่มีคำขอรับเลี้ยง')).toBeInTheDocument()
})

it('does not show counts when requests fail to load', async () => {
  getMyRequests.mockRejectedValue(new Error('โหลดไม่สำเร็จ'))
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent('โหลดไม่สำเร็จ')
  expect(screen.queryByRole('list', { name: 'สรุปสถานะคำขอ' })).not.toBeInTheDocument()
})
