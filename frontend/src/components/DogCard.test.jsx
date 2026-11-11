import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DogCard from './DogCard'

describe('DogCard', () => {
  it('แสดงข้อมูลสุนัขและรูปสำรองเมื่อไม่มีรูป', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DogCard dog={{
          id: 'dog-1',
          name: 'มะลิ',
          breed: 'ไทยผสม',
          age: '2 ปี',
          description: 'เป็นมิตร',
          image_url: null,
        }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    expect(screen.getByText('ไทยผสม · 2 ปี')).toBeInTheDocument()
    expect(screen.getByText('เป็นมิตร')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'ไม่มีรูปสุนัข' })).toHaveTextContent('🐶')
  })

  it('แสดงรูปสุนัขแบบ lazy และ fallback เมื่อรูปโหลดไม่ได้', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DogCard dog={{ id: 'dog-2', name: 'ถุงทอง', image_url: '/broken.jpg' }} />
      </MemoryRouter>,
    )
    const image = screen.getByRole('img', { name: 'ถุงทอง' })
    expect(image).toHaveAttribute('loading', 'lazy')
    fireEvent.error(image)
    expect(screen.getByRole('img', { name: 'ไม่มีรูปสุนัข' })).toBeInTheDocument()
  })
})
