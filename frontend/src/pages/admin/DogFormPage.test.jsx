import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import DogFormPage from './DogFormPage'
import { createDog } from '../../services/dogs'

vi.mock('../../services/dogs', () => ({
  createDog: vi.fn(),
  getDog: vi.fn(),
  updateDog: vi.fn(),
}))

describe('DogFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createDog.mockResolvedValue({ id: 4 })
  })

  it('accepts an image file and saves it in image_url', async () => {
    render(
      <MemoryRouter
        initialEntries={['/admin/dogs/new']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/admin/dogs/new" element={<DogFormPage />} />
          <Route path="/admin/dogs" element={<p>รายการสุนัข</p>} />
        </Routes>
      </MemoryRouter>,
    )

      fireEvent.change(screen.getByLabelText('ชื่อ'), { target: { value: 'Mochi' } })
    fireEvent.change(screen.getByLabelText('เพศ'), { target: { value: 'female' } })
    fireEvent.change(screen.getByLabelText(/เลือกรูป/), {
      target: { files: [new File(['dog image'], 'mochi.png', { type: 'image/png' })] },
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'บันทึกสุนัข' })).toBeEnabled()
    })
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกสุนัข' }))

    await waitFor(() => {
      expect(createDog).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Mochi',
        gender: 'female',
        image_url: expect.stringMatching(/^data:image\/png;base64,/),
      }))
    })
    expect(await screen.findByText('รายการสุนัข')).toBeInTheDocument()
  })
})
