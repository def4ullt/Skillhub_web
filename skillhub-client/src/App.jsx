import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/NavBar'
import TasksPage from './pages/Tasks/TasksPage'
import TaskDetailPage from './pages/TaskDetail/TaskDetailPage'
import TaskCreatePage from './pages/Tasks/TaskCreatePage'
import SubmissionsPage from './pages/Submissions/SubmissionsPage'
import SubmissionDetailPage from './pages/Submissions/SubmissionDetailPage'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<TasksPage />} />
        <Route path="/tasks/create" element={<TaskCreatePage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </>
  )
}

export default App