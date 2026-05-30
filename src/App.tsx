import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '@/modules/identity/pages/LoginPage'
import { ForgotPasswordPage } from '@/modules/identity/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/modules/identity/pages/ResetPasswordPage'
import { RegisterPage } from '@/modules/identity/pages/RegisterPage'
import { RegistrationPage } from '@/modules/identity/pages/RegistrationPage'
import { ProfilePage } from '@/modules/identity/pages/ProfilePage'
import { DashboardPage } from '@/modules/core/pages/DashboardPage'
import { Layout } from '@/modules/core/components/Layout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { MyInvoicesPage } from '@/modules/billing/pages/MyInvoicesPage'
import { InvoiceDetailPage } from '@/modules/billing/pages/InvoiceDetailPage'
import { StatementPage } from '@/modules/billing/pages/StatementPage'
import { AdminInvoicesPage } from '@/modules/billing/pages/AdminInvoicesPage'
import { AdminPaymentsPage } from '@/modules/billing/pages/AdminPaymentsPage'
import { ContributionsPage } from '@/modules/contribution/pages/ContributionsPage'
import { AdminContributionsPage } from '@/modules/contribution/pages/AdminContributionsPage'
import { EventsPage } from '@/modules/communication/pages/EventsPage'
import { AnnouncementsPage } from '@/modules/communication/pages/AnnouncementsPage'
import { SuggestionsPage } from '@/modules/communication/pages/SuggestionsPage'
import { AdminAnnouncementsPage } from '@/modules/communication/pages/AdminAnnouncementsPage'
import { AdminCalendarPage } from '@/modules/communication/pages/AdminCalendarPage'
import { AdminSuggestionsPage } from '@/modules/communication/pages/AdminSuggestionsPage'
import { AdminSmsPage } from '@/modules/communication/pages/AdminSmsPage'
import { ReconciliationPage } from '@/modules/finance/pages/ReconciliationPage'
import { AdminUsersPage } from '@/modules/identity/pages/AdminUsersPage'
import { AdminRegistrationsPage } from '@/modules/identity/pages/AdminRegistrationsPage'
import { SettingsPage } from '@/modules/core/pages/SettingsPage'
import { ReportPage } from '@/modules/core/pages/ReportPage'
import { AuditLogPage } from '@/modules/core/pages/AuditLogPage'
import { LandingPage } from '@/modules/core/pages/LandingPage'

const queryClient = new QueryClient()

const ADMIN_ROLES = ['super_admin', 'treasurer', 'secretary', 'chairperson'] as const

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/registration" element={<ProtectedRoute><RegistrationPage /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="invoices" element={<MyInvoicesPage />} />
            <Route path="invoices/:reference" element={<InvoiceDetailPage />} />
            <Route path="statement" element={<StatementPage />} />
            <Route path="contributions" element={<ContributionsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="suggestions" element={<SuggestionsPage />} />

            <Route path="admin/users" element={<ProtectedRoute requiredRole={ADMIN_ROLES}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="admin/registrations" element={<ProtectedRoute requiredRole={['super_admin', 'chairperson']}><AdminRegistrationsPage /></ProtectedRoute>} />
            <Route path="admin/invoices" element={<ProtectedRoute requiredRole={ADMIN_ROLES}><AdminInvoicesPage /></ProtectedRoute>} />
            <Route path="admin/payments" element={<ProtectedRoute requiredRole={['super_admin', 'treasurer']}><AdminPaymentsPage /></ProtectedRoute>} />
            <Route path="admin/contributions" element={<ProtectedRoute requiredRole={ADMIN_ROLES}><AdminContributionsPage /></ProtectedRoute>} />
            <Route path="admin/events" element={<ProtectedRoute requiredRole={ADMIN_ROLES}><AdminCalendarPage /></ProtectedRoute>} />
            <Route path="admin/announcements" element={<ProtectedRoute requiredRole={ADMIN_ROLES}><AdminAnnouncementsPage /></ProtectedRoute>} />
            <Route path="admin/suggestions" element={<ProtectedRoute requiredRole={ADMIN_ROLES}><AdminSuggestionsPage /></ProtectedRoute>} />
            <Route path="admin/sms" element={<ProtectedRoute requiredRole={['super_admin', 'secretary']}><AdminSmsPage /></ProtectedRoute>} />
            <Route path="admin/reconciliation" element={<ProtectedRoute requiredRole={['super_admin', 'treasurer']}><ReconciliationPage /></ProtectedRoute>} />
            <Route path="admin/reports" element={<ProtectedRoute requiredRole={ADMIN_ROLES}><ReportPage /></ProtectedRoute>} />
            <Route path="admin/settings" element={<ProtectedRoute requiredRole={['super_admin']}><SettingsPage /></ProtectedRoute>} />
            <Route path="admin/audit-log" element={<ProtectedRoute requiredRole={['super_admin']}><AuditLogPage /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
