
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, DashboardLayout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider
import { Home } from './pages/Home';
import { SearchPage } from './pages/Search';
import { SalonDetailPage } from './pages/SalonDetailPage';
import { ErrorBoundaryRoot } from './components/ErrorBoundary';
import { ForPartners } from './pages/ForPartners';
import { SalonTest } from './pages/SalonTest';
import { UserTest } from './pages/UserTest';
import { AdminTest } from './pages/AdminTest';
import { Salonpaginatest } from './pages/Salonpaginatest';
import { AuthPage } from './pages/Auth';
import { UserDashboard } from './pages/dashboards/UserDashboard';
import { UserProfile } from './pages/dashboards/UserProfile';
import { UserFavorites } from './pages/dashboards/UserFavorites';
import { SalonDashboard } from './pages/dashboards/SalonDashboard';
import { SalonSchedule } from './pages/dashboards/SalonSchedule';
import { SalonServices } from './pages/dashboards/SalonServices';
import { SalonStaff } from './pages/dashboards/SalonStaff';
import { SalonSettings } from './pages/dashboards/SalonSettings';
import { SalonDeals } from './pages/dashboards/SalonDeals'; 
import { SalonClients } from './pages/dashboards/SalonClients';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { AdminSalons } from './pages/dashboards/AdminSalons';
import { AdminUsers } from './pages/dashboards/AdminUsers';
import { StaffDashboard } from './pages/dashboards/StaffDashboard';
import { StaffProfile } from './pages/dashboards/StaffProfile';
import { AboutPage, HelpPage, PrivacyPage, TermsPage } from './pages/StaticPages';

// Helper to check for subdomain - supports multiple domain setups
const getSubdomain = () => {
    const host = window.location.hostname;
    const parts = host.split('.');
    
    let subdomain = '';
    
    // Development: localhost with subdomain (e.g., beauty-test.localhost)
    if (parts.length === 2 && host.includes('localhost') && parts[0] !== 'www') {
         subdomain = parts[0];
    } 
    // Production: mijnbeautyafspraken.nl with subdomain (e.g., beauty-test.mijnbeautyafspraken.nl)
    else if (host.includes('mijnbeautyafspraken.nl') && parts.length >= 3 && parts[0] !== 'www') {
        // beauty-test.mijnbeautyafspraken.nl → beauty-test
        subdomain = parts[0];
    }
    // Vercel preview domains: beauty-test.mijnbeauty-afspraken.vercel.app
    else if (host.includes('vercel.app') && parts.length >= 4 && parts[0] !== 'www') {
        // Only treat as subdomain if not the main vercel domain
        const mainDomain = parts.slice(-3).join('.');
        if (mainDomain !== 'mijnbeauty-afspraken.vercel.app') {
            subdomain = parts[0];
        }
    }
    
    return subdomain;
};

const normalizeRole = (rawRole: unknown) => {
    const role = (rawRole ?? 'user').toString().trim().toLowerCase();
    if (role.includes('admin')) return 'admin';
    if (role.includes('salon') || role.includes('owner')) return 'salon';
    if (role.includes('staff')) return 'staff';
    return 'user';
};

const DashboardRedirect: React.FC = () => {
    const { user, profile, isLoading } = useAuth();

    if (isLoading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (!profile) return null;

    // HARDCODED ADMIN CHECK - admin@bart.nl gaat ALTIJD naar admin dashboard
    const userEmail = user.email?.toLowerCase().trim();
    if (userEmail === 'admin@bart.nl') {
        return <Navigate to="/dashboard/admin" replace />;
    }

    const role = normalizeRole(profile?.role || (user as any)?.user_metadata?.role);
    if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (role === 'salon') return <Navigate to="/dashboard/salon" replace />;
    if (role === 'staff') return <Navigate to="/dashboard/staff" replace />;
    return <Navigate to="/dashboard/user" replace />;
};

const RequireRole: React.FC<{ role: 'user' | 'salon' | 'admin' | 'staff'; children: React.ReactNode }> = ({ role, children }) => {
    const { user, profile, isLoading } = useAuth();

    if (isLoading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (!profile) return null;

    const userEmail = user.email?.toLowerCase().trim();

    // HARDCODED ADMIN CHECK - admin@bart.nl heeft ALTIJD admin toegang
    if (userEmail === 'admin@bart.nl' && role === 'admin') {
        return <>{children}</>;
    }

    const userRole = normalizeRole(profile?.role || (user as any)?.user_metadata?.role);
    const roleMatch = userRole === role;

    if (!roleMatch) {
        return <DashboardRedirect />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
  const subdomain = getSubdomain();

  // NOTE: previously we returned early for subdomains which prevented client routes
  // like /zoeken from working on preview or custom domains. Instead, we'll keep
  // the full router and conditionally render the root route.

  // Standard Main Platform Routing
  return (
    <AuthProvider>
        <Router>
        <Routes>
                        {/* Public Routes */}
                        <Route
                            path="/"
                            element={
                                subdomain ? (
                                    <PublicLayout>
                                        <ErrorBoundaryRoot>
                                            <SalonDetailPage subdomain={subdomain} />
                                        </ErrorBoundaryRoot>
                                    </PublicLayout>
                                ) : (
                                    <PublicLayout>
                                        <Home />
                                    </PublicLayout>
                                )
                            }
                        />
            <Route path="/search" element={<PublicLayout><SearchPage /></PublicLayout>} />
            <Route path="/zoeken" element={<PublicLayout><SearchPage /></PublicLayout>} />
            <Route path="/salon/:id" element={<PublicLayout><SalonDetailPage /></PublicLayout>} />
            <Route path="/for-partners" element={<PublicLayout><ForPartners /></PublicLayout>} />
            <Route path="/salontest/*" element={<SalonTest />} />
            <Route path="/usertest/*" element={<UserTest />} />
            <Route path="/admintest/*" element={<AdminTest />} />
            <Route path="/salonpaginatest" element={<PublicLayout><Salonpaginatest /></PublicLayout>} />
            
            {/* Footer Pages */}
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/help" element={<PublicLayout><HelpPage /></PublicLayout>} />
            <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
            <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<PublicLayout><AuthPage initialMode="login" /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><AuthPage initialMode="register" /></PublicLayout>} />
            {/* Redirect partner login to standard login, potentially could pass a query param to pre-select tab if extended */}
            <Route path="/partner-login" element={<PublicLayout><AuthPage initialMode="login" /></PublicLayout>} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route 
                path="/dashboard/user/*" 
                element={
                    <RequireRole role="user">
                        <DashboardLayout role="user">
                            <Routes>
                                <Route path="/" element={<UserDashboard />} />
                                <Route path="/appointments" element={<UserDashboard />} />
                                <Route path="/favorites" element={<UserFavorites />} />
                                <Route path="/profile" element={<UserProfile />} />
                            </Routes>
                        </DashboardLayout>
                    </RequireRole>
                } 
            />
            
            <Route 
                path="/dashboard/salon/*" 
                element={
                    <RequireRole role="salon">
                        <DashboardLayout role="salon">
                            <Routes>
                                <Route path="/" element={<SalonDashboard />} />
                                <Route path="/schedule" element={<SalonSchedule />} />
                                <Route path="/services" element={<SalonServices />} />
                                <Route path="/staff" element={<SalonStaff />} />
                                <Route path="/settings" element={<SalonSettings />} />
                                <Route path="/deals" element={<SalonDeals />} /> 
                                <Route path="/clients" element={<SalonClients />} />
                            </Routes>
                        </DashboardLayout>
                    </RequireRole>
                } 
            />
            
            <Route 
                path="/dashboard/staff/*" 
                element={
                    <RequireRole role="staff">
                        <DashboardLayout role="staff">
                            <Routes>
                                <Route path="/" element={<StaffDashboard />} />
                                <Route path="/profile" element={<StaffProfile />} />
                            </Routes>
                        </DashboardLayout>
                    </RequireRole>
                } 
            />
            
            <Route 
                path="/dashboard/admin/*" 
                element={
                    <RequireRole role="admin">
                        <DashboardLayout role="admin">
                            <Routes>
                                <Route path="/" element={<AdminDashboard />} />
                                <Route path="/salons" element={<AdminSalons />} />
                                <Route path="/users" element={<AdminUsers />} />
                            </Routes>
                        </DashboardLayout>
                    </RequireRole>
                } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;