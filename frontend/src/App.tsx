import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppShell } from './layouts/AppShell'
import { LandingPage } from './pages/Landing'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { DashboardPage } from './pages/Dashboard'
import { BugListPage } from './pages/BugList'
import { BugDetailPage } from './pages/BugDetail'
import { InboxPage } from './pages/Inbox'
import { ProfilePage } from './pages/Profile'
import { NewBugPage } from './pages/NewBug'
import { NewProjectPage } from './pages/NewProject'
import { EditProjectPage } from './pages/EditProject'
import { ProjectArchivePage } from './pages/ProjectArchive'
import { NewWorkspacePage } from './pages/NewWorkspace'
import { EditWorkspacePage } from './pages/EditWorkspace'
import { TestsPage } from './pages/Tests'
import { TestRunsPage } from './pages/TestRuns'
import { TestRunDetailPage } from './pages/TestRunDetail'
import { ReportsPage } from './pages/Reports'
import { NewTestPage } from './pages/NewTest'
import { EditTestPage } from './pages/EditTest'
import { TestCaseDetailPage } from './pages/TestCaseDetail'
import { ChangelogPage } from './pages/ChangelogPage'
import { ChangelogSubscriptionsPage } from './pages/ChangelogSubscriptionsPage'
import { RoadmapPage } from './pages/RoadmapPage'
import { SupportPage } from './pages/SupportPage'
import { SupportSettingsPage } from './pages/SupportSettingsPage'
import { SprintsPage } from './pages/Sprints'
import { WebhooksPage } from './pages/Webhooks'
import { TemplatesPage } from './pages/Templates'
import { AdminLandingLayout } from './pages/admin/AdminLandingLayout'
import { AdminHero } from './pages/admin/AdminHero'
import { AdminSettings } from './pages/admin/AdminSettings'
import { AdminFeatures } from './pages/admin/AdminFeatures'
import { AdminUseCases } from './pages/admin/AdminUseCases'
import { AdminIntegrations } from './pages/admin/AdminIntegrations'
import { AdminMetrics } from './pages/admin/AdminMetrics'
import { AdminTestimonials } from './pages/admin/AdminTestimonials'
import { AdminFaq } from './pages/admin/AdminFaq'
import { AdminChangeLog } from './pages/admin/AdminChangeLog'
import { AdminRegionsPage } from './pages/AdminRegions'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Маршрут лише для адміністраторів (is_staff=true). */
function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_staff) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      {/* Публічні сторінки */}
      <Route
        path="/"
        element={
          <PublicOnly>
            <LandingPage />
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />

      {/* Приватний застосунок */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bugs" element={<BugListPage />} />
        <Route path="bugs/new" element={<NewBugPage />} />
        <Route path="bugs/:id" element={<BugDetailPage />} />
        <Route path="bugs/:id/edit" element={<NewBugPage mode="edit" />} />
        <Route path="projects/new" element={<NewProjectPage />} />
        <Route path="projects/archive" element={<ProjectArchivePage />} />
        <Route path="projects/:id/edit" element={<EditProjectPage />} />
        <Route path="workspaces/new" element={<NewWorkspacePage />} />
        <Route path="workspaces/:id/edit" element={<EditWorkspacePage />} />
        <Route path="tests" element={<TestsPage />} />
        <Route path="tests/new" element={<NewTestPage />} />
        <Route path="tests/:id" element={<TestCaseDetailPage />} />
        <Route path="tests/:id/edit" element={<EditTestPage />} />
        <Route path="runs" element={<TestRunsPage />} />
        <Route path="runs/:id" element={<TestRunDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="sprints" element={<SprintsPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="changelog" element={<ChangelogPage />} />
        <Route path="changelog/subscriptions" element={<ChangelogSubscriptionsPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="admin/support" element={<SupportSettingsPage />} />
      </Route>

      {/* Адмін-панель лендінгу — тільки для is_staff */}
      <Route
        element={
          <RequireStaff>
            <AppShell />
          </RequireStaff>
        }
      >
        <Route path="admin/regions" element={<AdminRegionsPage />} />
        <Route path="admin/landing" element={<AdminLandingLayout />}>
          <Route index element={<AdminHero />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="features" element={<AdminFeatures />} />
          <Route path="use-cases" element={<AdminUseCases />} />
          <Route path="integrations" element={<AdminIntegrations />} />
          <Route path="metrics" element={<AdminMetrics />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="faq" element={<AdminFaq />} />
          <Route path="changelog" element={<AdminChangeLog />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
