import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/ui';
import { AuthPage } from '@/pages/auth/AuthPage';
import { CompleteProfilePage } from '@/pages/auth/CompleteProfilePage';
import { SettingsPage } from '@/pages/shared/SettingsPage';

// Traveler pages
import { TravelerDashboard } from '@/pages/traveler/TravelerDashboard';
import { TravelerIdentity } from '@/pages/traveler/TravelerIdentity';
import { TravelerScan } from '@/pages/traveler/TravelerScan';
import { TravelerTrips } from '@/pages/traveler/TravelerTrips';
import { TravelerVerifications } from '@/pages/traveler/TravelerVerifications';

// Business pages
import { BusinessDashboard } from '@/pages/business/BusinessDashboard';
import { BusinessScan } from '@/pages/business/BusinessScan';
import { BusinessBookings } from '@/pages/business/BusinessBookings';
import { BusinessVerifications } from '@/pages/business/BusinessVerifications';
import { BusinessReports } from '@/pages/business/BusinessReports';
import { BusinessSettings } from '@/pages/business/BusinessSettings';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminBookings } from '@/pages/admin/AdminBookings';
import { AdminVerifications } from '@/pages/admin/AdminVerifications';
import { AdminReports } from '@/pages/admin/AdminReports';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { profile, loading, needsProfileCompletion } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (needsProfileCompletion) return <Navigate to="/complete-profile" replace />;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={`/${profile.role}`} replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { profile, loading, needsProfileCompletion } = useAuth();
  if (loading) return <LoadingScreen />;
  if (needsProfileCompletion) return <Navigate to="/complete-profile" replace />;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={`/${profile.role}`} replace />;
}

function LoginRoute() {
  const { profile, loading, needsProfileCompletion } = useAuth();
  if (loading) return <LoadingScreen />;
  if (needsProfileCompletion) return <Navigate to="/complete-profile" replace />;
  if (profile) return <Navigate to={`/${profile.role}`} replace />;
  return <AuthPage mode="login" />;
}

function RegisterRoute() {
  const { profile, loading, needsProfileCompletion } = useAuth();
  if (loading) return <LoadingScreen />;
  if (needsProfileCompletion) return <Navigate to="/complete-profile" replace />;
  if (profile) return <Navigate to={`/${profile.role}`} replace />;
  return <AuthPage mode="register" />;
}

function CompleteProfileRoute() {
  const { session, loading, needsProfileCompletion, profile } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile && !needsProfileCompletion) return <Navigate to={`/${profile.role}`} replace />;
  return <CompleteProfilePage />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/complete-profile" element={<CompleteProfileRoute />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Traveler routes */}
          <Route path="/traveler" element={<ProtectedRoute allowedRoles={['traveler']}><TravelerDashboard /></ProtectedRoute>} />
          <Route path="/traveler/identity" element={<ProtectedRoute allowedRoles={['traveler']}><TravelerIdentity /></ProtectedRoute>} />
          <Route path="/traveler/scan" element={<ProtectedRoute allowedRoles={['traveler']}><TravelerScan /></ProtectedRoute>} />
          <Route path="/traveler/trips" element={<ProtectedRoute allowedRoles={['traveler']}><TravelerTrips /></ProtectedRoute>} />
          <Route path="/traveler/verifications" element={<ProtectedRoute allowedRoles={['traveler']}><TravelerVerifications /></ProtectedRoute>} />
          <Route path="/traveler/settings" element={<ProtectedRoute allowedRoles={['traveler']}><SettingsPage role="traveler" /></ProtectedRoute>} />

          {/* Business routes */}
          <Route path="/business" element={<ProtectedRoute allowedRoles={['business']}><BusinessDashboard /></ProtectedRoute>} />
          <Route path="/business/scan" element={<ProtectedRoute allowedRoles={['business']}><BusinessScan /></ProtectedRoute>} />
          <Route path="/business/bookings" element={<ProtectedRoute allowedRoles={['business']}><BusinessBookings /></ProtectedRoute>} />
          <Route path="/business/verifications" element={<ProtectedRoute allowedRoles={['business']}><BusinessVerifications /></ProtectedRoute>} />
          <Route path="/business/reports" element={<ProtectedRoute allowedRoles={['business']}><BusinessReports /></ProtectedRoute>} />
          <Route path="/business/settings" element={<ProtectedRoute allowedRoles={['business']}><BusinessSettings /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminVerifications /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage role="admin" /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
