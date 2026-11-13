import CornerPuppy from './components/CornerPuppy'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page-container">
        <AppRoutes />
      </main>
      <Footer />
      <CornerPuppy />
    </>
  )
}
