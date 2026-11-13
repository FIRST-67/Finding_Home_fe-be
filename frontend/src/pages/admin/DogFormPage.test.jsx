import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DogFormPage from './DogFormPage'
import { createDog, getDog, updateDog, uploadDogImage } from '../../services/dogs'

jest.mock('../../services/dogs', () => ({
  createDog: jest.fn(),
  getDog: jest.fn(),
  updateDog: jest.fn(),
  uploadDogImage: jest.fn(),
}))

describe('DogFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createDog.mockResolvedValue({ id: 4 })
    uploadDogImage.mockResolvedValue('https://storage.example/dog.png')
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
        image_url: 'https://storage.example/dog.png',
      }))
    })
    expect(uploadDogImage).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('รายการสุนัข')).toBeInTheDocument()
  })

  it('retries a failed save without uploading the same file again', async () => {
    getDog.mockResolvedValue({
      id: 9, name: 'Example', gender: 'female', age_years: 2,
      status: 'adopted', image_url: 'https://storage.example/old.jpg',
    })
    updateDog.mockRejectedValueOnce(new Error('บันทึกไม่สำเร็จ')).mockResolvedValueOnce({ id: 9 })
    render(
      <MemoryRouter
        initialEntries={['/admin/dogs/9/edit']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/admin/dogs/:dogId/edit" element={<DogFormPage />} />
          <Route path="/admin/dogs" element={<p>รายการสุนัข</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByAltText('รูปสุนัขปัจจุบัน')).toHaveAttribute(
      'src', 'https://storage.example/old.jpg',
    )
    const file = new File(['dog image'], 'replacement.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/เลือกรูป/), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกสุนัข' }))
    expect(await screen.findByText('บันทึกไม่สำเร็จ')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกสุนัข' }))

    expect(await screen.findByText('รายการสุนัข')).toBeInTheDocument()
    expect(uploadDogImage).toHaveBeenCalledTimes(1)
    expect(uploadDogImage).toHaveBeenCalledWith(file)
    expect(updateDog).toHaveBeenLastCalledWith('9', expect.objectContaining({
      status: 'adopted',
      image_url: 'https://storage.example/dog.png',
    }))
  })

  it('blocks repeated saves while uploading and shows an error without creating a dog', async () => {
    let rejectUpload
    uploadDogImage.mockReturnValueOnce(new Promise((_, reject) => { rejectUpload = reject }))
    render(
      <MemoryRouter initialEntries={['/admin/dogs/new']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/admin/dogs/new" element={<DogFormPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('ชื่อ'), { target: { value: 'Example' } })
    fireEvent.change(screen.getByLabelText('เพศ'), { target: { value: 'female' } })
    fireEvent.change(screen.getByLabelText(/เลือกรูป/), {
      target: { files: [new File(['dog image'], 'dog.png', { type: 'image/png' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกสุนัข' }))
    const saving = screen.getByRole('button', { name: 'กำลังอัปโหลดรูป...' })
    expect(saving).toBeDisabled()
    fireEvent.submit(saving.closest('form'))
    expect(uploadDogImage).toHaveBeenCalledTimes(1)
    rejectUpload({ status: 415 })
    expect(await screen.findByRole('alert')).toHaveTextContent('ไฟล์รูปไม่ถูกต้อง')
    expect(createDog).not.toHaveBeenCalled()
  })
})
