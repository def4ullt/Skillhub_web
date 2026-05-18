import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import keycloak, { getRole } from './auth/keycloak'
import Navbar from './components/layout/Navbar'
import LoginPage from './pages/Login/LoginPage'
import MainPage from './pages/Home/MainPage'
import TasksPage from './pages/Tasks/TasksPage'
import TaskDetailPage from './pages/TaskDetail/TaskDetailPage'
import TaskCreatePage from './pages/Tasks/TaskCreatePage'
import SubmissionsPage from './pages/Submissions/SubmissionsPage'
import SubmissionDetailPage from './pages/Submissions/SubmissionDetailPage'
import LeaderboardPage from './pages/Leaderboard/LeaderboardPage'
import ProfilePage from './pages/Profile/ProfilePage'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminTagsPage from './pages/Admin/Tags/AdminTagsPage'
import AdminTechnologiesPage from './pages/Admin/Technologies/AdminTechnologiesPage'
import AdminStatusesPage from './pages/Admin/Statuses/AdminStatusesPage'
import AdminDeliveryMethodsPage from './pages/Admin/DeliveryMethods/AdminDeliveryMethodsPage'
import RegisterPage from './pages/Register/RegisterPage'
import AdminTasksPage from './pages/Admin/Tasks/AdminTasksPage'
import AdminSubmissionsPage from './pages/Admin/Submissions/AdminSubmissionsPage'
import TaskAnalyticsPage from './pages/Admin/Analytics/TaskAnalyticsPage'
import AdminUsersPage from './pages/Admin/Users/AdminUsersPage'
import SearchPage from './pages/Search/SearchPage'


function App({ authenticated: initialAuth }) {
  const [authenticated, setAuthenticated] = useState(initialAuth)
  const [role, setRole] = useState(getRole())
  const location = useLocation()

  const handleLogin = (role) => {
    setAuthenticated(true)
    setRole(role)
  }

  if (!authenticated) {
    if (location.pathname === '/register') return <RegisterPage />
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <>
      <Navbar role={role} />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/create" element={<TaskCreatePage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/admin" element={role === 'admin' ? <Navigate to="/admin/tasks" /> : <Navigate to="/" />} />
        <Route path="/admin/tasks" element={role === 'admin' ? <AdminLayout><AdminTasksPage /></AdminLayout> : <Navigate to="/" />} />
        <Route path="/admin/tags" element={role === 'admin' ? <AdminLayout><AdminTagsPage /></AdminLayout> : <Navigate to="/" />} />
        <Route path="/admin/technologies" element={role === 'admin' ? <AdminLayout><AdminTechnologiesPage /></AdminLayout> : <Navigate to="/" />} />
        <Route path="/admin/submissions" element={role === 'admin' ? <AdminLayout><AdminSubmissionsPage /></AdminLayout> : <Navigate to="/" />} />
        <Route path="/admin/statuses" element={role === 'admin' ? <AdminLayout><AdminStatusesPage /></AdminLayout> : <Navigate to="/" />} />
        <Route path="/admin/delivery-methods" element={role === 'admin' ? <AdminLayout><AdminDeliveryMethodsPage /></AdminLayout> : <Navigate to="/" />} />
        <Route path="/admin/analytics" element={role === 'admin' ? <AdminLayout><TaskAnalyticsPage /></AdminLayout> : <Navigate to="/" />} />
        <Route path="/admin/users" element={role === 'admin' ? <AdminLayout><AdminUsersPage /></AdminLayout> : <Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
