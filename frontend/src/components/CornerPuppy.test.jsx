import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CornerPuppy from './CornerPuppy'

afterEach(() => sessionStorage.clear())

function renderPuppy() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CornerPuppy />
      <Routes><Route path="/explore" element={<h1>Explore</h1>} /></Routes>
    </MemoryRouter>,
  )
}

it('opens Explore from the puppy on the homepage', () => {
  renderPuppy()
  fireEvent.click(screen.getByRole('link', { name: 'ค้นหาน้องหมา' }))
  expect(screen.getByRole('heading', { name: 'Explore' })).toBeVisible()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

it('stays dismissed when remounted during the same session', () => {
  const view = renderPuppy()
  fireEvent.click(screen.getByRole('button', { name: 'ซ่อนน้องหมาที่มุมจอ' }))
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  view.unmount()
  renderPuppy()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
