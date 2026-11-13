import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DogDetailPage from './DogDetailPage'
import { getDog } from '../services/dogs'
import { addFavorite, getFavorites } from '../services/favorites'

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { role: 'member' } }),
}))
jest.mock('../services/dogs', () => ({ getDog: jest.fn() }))
jest.mock('../services/favorites', () => ({
  addFavorite: jest.fn(),
  getFavorites: jest.fn(),
  removeFavorite: jest.fn().mockResolvedValue(null),
}))

beforeEach(() => {
  getDog.mockResolvedValue({ id: 1, name: 'มะลิ', status: 'available' })
  getFavorites.mockResolvedValue([])
})

function renderDetail() {
  render(
    <MemoryRouter initialEntries={['/dogs/1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes><Route path="/dogs/:dogId" element={<DogDetailPage />} /></Routes>
    </MemoryRouter>,
  )
}

it('celebrates a successful addition only, then clears the animation', async () => {
  let complete
  addFavorite.mockReturnValueOnce(new Promise((resolve) => { complete = resolve }))
  renderDetail()
  expect(screen.getByRole('status')).toHaveTextContent('กำลังโหลดข้อมูลน้องหมา...')
  const button = await screen.findByRole('button', { name: 'เพิ่มในรายการโปรด' })
  fireEvent.click(button)
  expect(button).toBeDisabled()
  expect(button).not.toHaveClass('is-celebrating')
  await act(async () => complete())
  expect(button).toHaveAccessibleName('นำออกจากรายการโปรด')
  expect(button).toHaveClass('is-celebrating')
  fireEvent.animationEnd(button.querySelector('.favorite-action__paws'))
  expect(button).not.toHaveClass('is-celebrating')
  fireEvent.click(button)
  expect(await screen.findByRole('button', { name: 'เพิ่มในรายการโปรด' })).not.toHaveClass('is-celebrating')
})

it('keeps the unselected heart and shows the error when adding fails', async () => {
  addFavorite.mockRejectedValueOnce(new Error('บันทึกไม่สำเร็จ'))
  renderDetail()
  fireEvent.click(await screen.findByRole('button', { name: 'เพิ่มในรายการโปรด' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('บันทึกไม่สำเร็จ')
  expect(screen.getByRole('button', { name: 'เพิ่มในรายการโปรด' })).not.toHaveClass('is-celebrating')
})

it('does not celebrate an already saved favorite on load', async () => {
  getFavorites.mockResolvedValueOnce([{ id: 1 }])
  renderDetail()
  expect(await screen.findByRole('button', { name: 'นำออกจากรายการโปรด' })).not.toHaveClass('is-celebrating')
})
