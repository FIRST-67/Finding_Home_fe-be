import '@testing-library/jest-dom'

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => 'blob:mock-image')
  URL.revokeObjectURL = jest.fn()
})
