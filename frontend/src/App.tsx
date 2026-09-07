import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { MainLayout } from "./layouts/MainLayout"
import { LandingPage } from "./pages/LandingPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage"
import { DashboardPage } from "./pages/DashboardPage"
import { CoverLetterPage } from "./pages/CoverLetterPage"
import { RoadmapPage } from "./pages/RoadmapPage"
import { ProjectsPage } from "./pages/ProjectsPage"
import { ApplicationsPage } from "./pages/ApplicationsPage"
import { AnalyticsPage } from "./pages/AnalyticsPage"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/cover-letter" element={
              <ProtectedRoute>
                <CoverLetterPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/roadmap" element={
              <ProtectedRoute>
                <RoadmapPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/projects" element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/applications" element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/analytics" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
          </Route>
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
