import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DogCard from './DogCard'

describe('DogCard', () => {
  it('แสดงข้อมูลสุนัขและรูปสำรองเมื่อไม่มีรูป', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DogCard dog={{
          id: 1,
          name: 'มะลิ',
          breed_name: 'ไทยผสม',
          age_years: 2,
          gender: 'male',
          province: 'เชียงใหม่',
          description: 'เป็นมิตร',
          image_url: '',
        }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'มะลิ' })).toBeInTheDocument()
    expect(screen.getByText('ไทยผสม')).toBeInTheDocument()
    expect(screen.getByText('เพศผู้')).toBeInTheDocument()
    expect(screen.getByText('2 ปี')).toBeInTheDocument()
    expect(screen.getByText('เชียงใหม่')).toBeInTheDocument()
    expect(screen.getByText('เป็นมิตร')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'ไม่มีรูปสุนัข' })).toBeInTheDocument()
    expect(container.querySelector('.lucide-paw-print')).toBeInTheDocument()
  })

  it('แสดงรูปสุนัขแบบ lazy และ fallback เมื่อรูปโหลดไม่ได้', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DogCard dog={{ id: 2, name: 'ถุงทอง', image_url: '/broken.jpg' }} />
      </MemoryRouter>,
    )
    const image = screen.getByRole('img', { name: 'ถุงทอง' })
    expect(image).toHaveAttribute('loading', 'lazy')
    fireEvent.error(image)
    expect(screen.getByRole('img', { name: 'ถุงทอง' })).toHaveAttribute(
      'src',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=85',
    )
    fireEvent.error(screen.getByRole('img', { name: 'ถุงทอง' }))
    expect(screen.getByRole('img', { name: 'ไม่มีรูปสุนัข' })).toBeInTheDocument()
  })

  it('uses a matching Shiba Inu photo when the backend photo cannot load', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DogCard dog={{ id: 3, name: 'Mochi', breed_name: 'Shiba Inu', image_url: '/broken.jpg' }} />
      </MemoryRouter>,
    )
    fireEvent.error(screen.getByRole('img', { name: 'Mochi' }))
    expect(screen.getByRole('img', { name: 'Mochi' })).toHaveAttribute(
      'src',
      'https://images.dog.ceo/breeds/shiba/shiba-4.jpg',
    )
  })
})
