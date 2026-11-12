import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import ImageUpload from './ImageUpload'

describe('ImageUpload', () => {
  it.each([
    ['image/gif', 100, 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น'],
    ['image/jpeg', 2 * 1024 * 1024 + 1, 'ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB'],
  ])('ปฏิเสธไฟล์ชนิด %s ขนาด %i และไม่เรียกอัปโหลด', async (type, size, message) => {
    const onUpload = vi.fn()
    const file = new File([new Uint8Array(size)], 'photo.bin', { type })
    render(<ImageUpload onUpload={onUpload} />)

    fireEvent.change(screen.getByLabelText(/เลือกรูป/), { target: { files: [file] } })

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: 'อัปโหลดรูป' })).toBeDisabled()
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('แสดง preview และเรียกอัปโหลดได้เมื่อไฟล์ถูกต้อง', () => {
    const onUpload = vi.fn()
    const file = new File(['image'], 'photo.webp', { type: 'image/webp' })
    render(<ImageUpload onUpload={onUpload} />)
    fireEvent.change(screen.getByLabelText(/เลือกรูป/), { target: { files: [file] } })

    expect(screen.getByRole('img', { name: 'ตัวอย่างรูปสุนัข' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'อัปโหลดรูป' }))
    expect(onUpload).toHaveBeenCalledWith(file)
  })
})
