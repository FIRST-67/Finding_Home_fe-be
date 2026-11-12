import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import AdoptionFormPage from '../pages/member/AdoptionFormPage'
import FavoritesPage from '../pages/member/FavoritesPage'
import MyRequestsPage from '../pages/member/MyRequestsPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import DogFormPage from '../pages/admin/DogFormPage'
import ManageDogsPage from '../pages/admin/ManageDogsPage'
import ManageRequestsPage from '../pages/admin/ManageRequestsPage'
import DogDetailPage from '../pages/DogDetailPage'
import ExplorePage from '../pages/ExplorePage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/dogs/:dogId" element={<DogDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute requireRole="member" />}>
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/dogs/:dogId/adoption" element={<AdoptionFormPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute requireRole="admin" />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/dogs" element={<ManageDogsPage />} />
        <Route path="/admin/dogs/new" element={<DogFormPage />} />
        <Route path="/admin/dogs/:dogId/edit" element={<DogFormPage />} />
        <Route path="/admin/requests" element={<ManageRequestsPage />} />
      </Route>
      <Route path="*" element={<div className="route-not-found"><h1>ไม่พบหน้าที่ต้องการ</h1></div>} />
    </Routes>
  )
}
