import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <>
      <header>
        <Link to="/">Finding Home</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* TODO (แยก branch): /login /register /profile /dogs/:id /admin */}
        </Routes>
      </main>
    </>
  )
}
