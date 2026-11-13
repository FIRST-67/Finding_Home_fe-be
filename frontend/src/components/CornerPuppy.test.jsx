import { fireEvent, render, screen } from '@testing-library/react'
import CornerPuppy from './CornerPuppy'

afterEach(() => sessionStorage.clear())

it('stays dismissed when remounted during the same session', () => {
  const view = render(<CornerPuppy />)
  fireEvent.click(screen.getByRole('button', { name: 'ซ่อนน้องหมาที่มุมจอ' }))
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  view.unmount()
  render(<CornerPuppy />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
