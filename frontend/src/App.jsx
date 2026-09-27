import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import JobsPage from './pages/JobsPage'
import JobDetailsPage from './pages/JobDetailsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import RecruiterJobsPage from './pages/recruiter/RecruiterJobsPage'
import CreateJobPage from './pages/recruiter/CreateJobPage'
import EditJobPage from './pages/recruiter/EditJobPage'
import CompanyProfilePage from './pages/recruiter/CompanyProfilePage'
import JobApplicantsPage from './pages/recruiter/JobApplicantsPage'
import CandidateDashboardPage from './pages/candidate/CandidateDashboardPage'
import CandidateProfilePage from './pages/candidate/CandidateProfilePage'
import SavedJobsPage from './pages/candidate/SavedJobsPage'
import MyApplicationsPage from './pages/candidate/MyApplicationsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/jobs" replace />} />

        {/* Public */}
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailsPage />} />

        {/* Logged-out only */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Recruiter only */}
        <Route path="recruiter" element={<ProtectedRoute roles={['recruiter']} />}>
          <Route index element={<Navigate to="jobs" replace />} />
          <Route path="jobs" element={<RecruiterJobsPage />} />
          <Route path="jobs/new" element={<CreateJobPage />} />
          <Route path="jobs/:id/edit" element={<EditJobPage />} />
          <Route path="jobs/:id/applicants" element={<JobApplicantsPage />} />
          <Route path="company" element={<CompanyProfilePage />} />
        </Route>

        {/* Candidate only */}
        <Route path="candidate" element={<ProtectedRoute roles={['candidate']} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CandidateDashboardPage />} />
          <Route path="profile" element={<CandidateProfilePage />} />
          <Route path="saved-jobs" element={<SavedJobsPage />} />
          <Route path="applications" element={<MyApplicationsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
