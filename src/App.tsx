import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ProtectedRoute, PublicOnlyRoute, RequireFullAccount } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/ui/States'

const Landing = lazy(() => import('@/pages/Landing'))
const About = lazy(() => import('@/pages/About'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Signup = lazy(() => import('@/pages/auth/Signup'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ChatAssistant = lazy(() => import('@/pages/ChatAssistant'))
const CropDoctor = lazy(() => import('@/pages/CropDoctor'))
const SoilHealth = lazy(() => import('@/pages/SoilHealth'))
const CropSuggestions = lazy(() => import('@/pages/CropSuggestions'))
const Irrigation = lazy(() => import('@/pages/Irrigation'))
const Weather = lazy(() => import('@/pages/Weather'))
const FieldView = lazy(() => import('@/pages/FieldView'))
const Market = lazy(() => import('@/pages/Market'))
const MyFarm = lazy(() => import('@/pages/MyFarm'))
const FarmProgress = lazy(() => import('@/pages/FarmProgress'))
const FarmRecord = lazy(() => import('@/pages/FarmRecord'))
const Tasks = lazy(() => import('@/pages/Tasks'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingState />
    </div>
  )
}

/** Guests land on Chat (their available home); everyone else lands on Dashboard. */
function IndexRedirect() {
  const { isGuest } = useAuth()
  return <Navigate to={isGuest ? '/chat' : '/dashboard'} replace />
}

/**
 * `/` is the marketing landing page for anyone signed out, and a shortcut into the
 * app for anyone signed in. Previously it redirected straight to /login, which meant
 * a first-time visitor — and Googlebot — met a password form instead of an
 * explanation of what AgroAI is.
 */
function RootRoute() {
  const { session, loading, configured, isGuest } = useAuth()
  if (!configured) return <Landing />
  // Render the landing page while auth resolves rather than flashing a spinner:
  // it is the correct destination for most first-time visitors anyway.
  if (loading) return <Landing />
  if (!session) return <Landing />
  return <Navigate to={isGuest ? '/chat' : '/dashboard'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Fully public — no auth gate at all, so search engines and first-time
                  visitors can read these without hitting the /login redirect. */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/about" element={<About />} />

              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/app" element={<IndexRedirect />} />
                  {/* Open to guests — stateless AI tools and reference data, no persistent farm needed */}
                  <Route path="/chat" element={<ChatAssistant />} />
                  <Route path="/crop-doctor" element={<CropDoctor />} />
                  <Route path="/soil-health" element={<SoilHealth />} />
                  <Route path="/crop-suggestions" element={<CropSuggestions />} />
                  <Route path="/irrigation" element={<Irrigation />} />
                  <Route path="/weather" element={<Weather />} />
                  <Route path="/field-view" element={<FieldView />} />
                  <Route path="/market" element={<Market />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Needs a real account — persistent per-farmer data */}
                  <Route element={<RequireFullAccount />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/my-farm" element={<MyFarm />} />
                    <Route path="/farm-progress" element={<FarmProgress />} />
                    <Route path="/farm-record/:cropId" element={<FarmRecord />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
