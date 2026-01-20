
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, DashboardLayout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider
import { ErrorBoundaryRoot } from './components/ErrorBoundary';

// Lazy load all page components for better performance
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const SearchPage = lazy(() => import('./pages/Search').then(module => ({ default: module.SearchPage })));
const SalonDetailPage = lazy(() => import('./pages/SalonDetailPage').then(module => ({ default: module.SalonDetailPage })));
const ForPartners = lazy(() => import('./pages/ForPartners').then(module => ({ default: module.ForPartners })));
const SalonTest = lazy(() => import('./pages/SalonTest').then(module => ({ default: module.SalonTest })));
const UserTest = lazy(() => import('./pages/UserTest').then(module => ({ default: module.UserTest })));
const AdminTest = lazy(() => import('./pages/AdminTest').then(module => ({ default: module.AdminTest })));
const Salonpaginatest = lazy(() => import('./pages/Salonpaginatest').then(module => ({ default: module.Salonpaginatest })));
const AuthPage = lazy(() => import('./pages/Auth').then(module => ({ default: module.AuthPage })));

// Dashboard components - grouped for better chunking
const UserDashboard = lazy(() => import('./pages/dashboards/UserDashboard').then(module => ({ default: module.UserDashboard })));
const UserProfile = lazy(() => import('./pages/dashboards/UserProfile').then(module => ({ default: module.UserProfile })));
const UserFavorites = lazy(() => import('./pages/dashboards/UserFavorites').then(module => ({ default: module.UserFavorites })));
const SalonDashboard = lazy(() => import('./pages/dashboards/SalonDashboard').then(module => ({ default: module.SalonDashboard })));
const SalonSchedule = lazy(() => import('./pages/dashboards/SalonSchedule').then(module => ({ default: module.SalonSchedule })));
const SalonServices = lazy(() => import('./pages/dashboards/SalonServices').then(module => ({ default: module.SalonServices })));
const SalonClients = lazy(() => import('./pages/dashboards/SalonClients').then(module => ({ default: module.SalonClients })));
const SalonSettings = lazy(() => import('./pages/dashboards/SalonSettings').then(module => ({ default: module.SalonSettings })));
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminSalons = lazy(() => import('./pages/dashboards/AdminSalons').then(module => ({ default: module.AdminSalons })));
const AdminUsers = lazy(() => import('./pages/dashboards/AdminUsers').then(module => ({ default: module.AdminUsers })));

const AboutPage = lazy(() => import('./pages/StaticPages').then(module => ({ default: module.AboutPage })));
const HelpPage = lazy(() => import('./pages/StaticPages').then(module => ({ default: module.HelpPage })));
const PrivacyPage = lazy(() => import('./pages/StaticPages').then(module => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/StaticPages').then(module => ({ default: module.TermsPage })));

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
    return <Navigate to="/dashboard/user" replace />;
};

const RequireRole: React.FC<{ role: 'user' | 'salon' | 'admin'; children: React.ReactNode }> = ({ role, children }) => {
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
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                        <p className="text-stone-500">Laden...</p>
                    </div>
                </div>
            }>
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
                                <Route path="/settings" element={<SalonSettings />} />
                                <Route path="/clients" element={<SalonClients />} />
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
            </Suspense>
        </Router>
    </AuthProvider>
  );
};

export default App;