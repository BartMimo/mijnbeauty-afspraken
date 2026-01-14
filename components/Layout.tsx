import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Calendar, Settings, LogOut, Scissors, PieChart, Home, ChevronDown, Bell, Tag, Clock, Heart, Users, Mail } from 'lucide-react';
import { Button } from './UIComponents';
import { useAuth } from '../context/AuthContext';

// --- Shared Header Component ---
const HeaderLogo = () => (
    <Link to="/" className="flex items-center space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 text-white shrink-0">
            <Scissors size={20} />
        </div>
        <span className="text-lg md:text-xl font-bold text-stone-800 tracking-tight truncate">Mijn Beauty Afspraken</span>
    </Link>
);

const UserDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        setIsOpen(false);
        navigate('/');
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-1.5 md:p-2 hover:bg-stone-100 rounded-xl transition-colors focus:outline-none"
            >
                <div className="h-8 w-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center shrink-0">
                    <User size={18} />
                </div>
                {profile && <span className="hidden md:inline text-sm font-medium text-stone-700 max-w-[100px] truncate">{profile.full_name?.split(' ')[0] || 'User'}</span>}
                <ChevronDown size={16} className="text-stone-400 hidden md:block" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-50 animate-fadeIn origin-top-right">
                    <div className="px-4 py-2 border-b border-stone-50">
                        <p className="text-sm font-medium text-stone-900 truncate">{profile?.full_name || user?.email || 'Gast'}</p>
                        <p className="text-xs text-stone-500 capitalize">{profile?.role === 'staff' ? 'Medewerker' : profile?.role}</p>
                    </div>
                    {profile?.role === 'consumer' && (
                        <Link to="/dashboard/user" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setIsOpen(false)}>
                            Mijn Dashboard
                        </Link>
                    )}
                    {profile?.role === 'salon' && (
                         <Link to="/dashboard/salon" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setIsOpen(false)}>
                            Salon Dashboard
                        </Link>
                    )}
                    {profile?.role === 'staff' && (
                         <Link to="/dashboard/staff" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setIsOpen(false)}>
                            Mijn Agenda
                        </Link>
                    )}
                    <Link to={profile?.role === 'staff' ? "/dashboard/staff/profile" : "/dashboard/user/profile"} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setIsOpen(false)}>
                        Profiel
                    </Link>
                    <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        Uitloggen
                    </button>
                </div>
            )}
        </div>
    );
};

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, session } = useAuth();
  const isAuthenticated = !!user && !!session;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-100 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <HeaderLogo />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-sm font-medium text-stone-600 hover:text-brand-400">Salons zoeken</Link>
            <Link to="/for-partners" className="text-sm font-medium text-stone-600 hover:text-brand-400">Voor salons</Link>
            
            {isAuthenticated ? (
                <div className="pl-4 border-l border-stone-200">
                    <UserDropdown />
                </div>
            ) : (
                <div className="flex items-center space-x-4">
                <Link to="/login">
                    <Button variant="ghost" size="sm">Inloggen</Button>
                </Link>
                <Link to="/register">
                    <Button size="sm">Aanmelden</Button>
                </Link>
                </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-stone-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full border-b border-stone-100 bg-white px-4 py-6 space-y-4 shadow-lg animate-fadeIn z-40">
            <Link to="/search" className="block py-2 text-lg text-stone-700 font-medium border-b border-stone-50" onClick={() => setIsMenuOpen(false)}>Salons zoeken</Link>
            <Link to="/for-partners" className="block py-2 text-lg text-stone-700 font-medium border-b border-stone-50" onClick={() => setIsMenuOpen(false)}>Voor salons</Link>
            <div className="pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3 py-2">
                             <UserDropdown />
                             <span className="text-sm font-medium text-stone-500">Ingelogd</span>
                         </div>
                    </div>
                ) : (
                    <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-center h-12 text-base">Inloggen</Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full justify-center h-12 text-base">Aanmelden</Button>
                    </Link>
                    </>
                )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        {children}
      </main>

      <footer className="border-t border-stone-100 bg-white py-12">
        <div className="container mx-auto px-4 md:px-6 grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
                 <span className="text-lg font-bold text-stone-800">Mijn Beauty Afspraken</span>
                 <p className="mt-4 text-sm text-stone-500">
                    Het makkelijkste platform om jouw perfecte beauty match te vinden en te boeken.
                 </p>
            </div>
            <div>
                <h4 className="font-semibold text-stone-900 mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-stone-600">
                    <li><Link to="/search" className="hover:text-brand-500">Zoek salons</Link></li>
                    <li><Link to="/about" className="hover:text-brand-500">Over ons</Link></li>
                    <li><Link to="/help" className="hover:text-brand-500">Hulp & Contact</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-stone-900 mb-4">Partners</h4>
                <ul className="space-y-2 text-sm text-stone-600">
                    <li><Link to="/register?role=salon" className="hover:text-brand-500">Salon aanmelden</Link></li>
                    <li><Link to="/partner-login" className="hover:text-brand-500">Partner login</Link></li>
                </ul>
            </div>
             <div>
                <h4 className="font-semibold text-stone-900 mb-4">Juridisch</h4>
                <ul className="space-y-2 text-sm text-stone-600">
                    <li><Link to="/privacy" className="hover:text-brand-500">Privacy</Link></li>
                    <li><Link to="/terms" className="hover:text-brand-500">Voorwaarden</Link></li>
                </ul>
            </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-stone-100 text-center text-sm text-stone-400">
            &copy; 2026 Mijn Beauty Afspraken. Alle rechten voorbehouden.
        </div>
      </footer>
    </div>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode; role: 'user' | 'salon' | 'admin' | 'staff' }> = ({ children, role }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const menuItems = {
        user: [
            { icon: Home, label: 'Overzicht', path: '/dashboard/user' },
            { icon: Calendar, label: 'Mijn Afspraken', path: '/dashboard/user/appointments' },
            { icon: Heart, label: 'Favorieten', path: '/dashboard/user/favorites' },
            { icon: User, label: 'Profiel', path: '/dashboard/user/profile' },
        ],
        salon: [
            { icon: Home, label: 'Dashboard', path: '/dashboard/salon' },
            { icon: Calendar, label: 'Agenda', path: '/dashboard/salon/schedule' },
            { icon: Tag, label: 'Mijn Deals', path: '/dashboard/salon/deals' },
            { icon: Users, label: 'Klanten', path: '/dashboard/salon/clients' },
            { icon: Scissors, label: 'Diensten', path: '/dashboard/salon/services' },
            { icon: User, label: 'Medewerkers', path: '/dashboard/salon/staff' },
            { icon: Settings, label: 'Instellingen', path: '/dashboard/salon/settings' },
        ],
        staff: [
            { icon: Calendar, label: 'Mijn Agenda', path: '/dashboard/staff' },
            { icon: Clock, label: 'Mijn Werktijden', path: '/dashboard/staff/profile' },
        ],
        admin: [
            { icon: PieChart, label: 'Statistieken', path: '/dashboard/admin' },
            { icon: Scissors, label: 'Salons', path: '/dashboard/admin/salons' },
            { icon: User, label: 'Gebruikers', path: '/dashboard/admin/users' },
        ]
    };

    const currentMenu = menuItems[role];

    return (
        <div className="flex min-h-screen bg-stone-50 flex-col">
            {/* Top Bar (The "Balk") - Always visible */}
            <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white">
                <div className="flex h-16 items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center">
                        {/* Mobile Menu Trigger */}
                        <button className="lg:hidden mr-3 p-2 text-stone-600 hover:bg-stone-50 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <HeaderLogo />
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        <button className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="h-6 w-px bg-stone-200 hidden md:block"></div>
                        <UserDropdown />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 pt-0 relative">
                {/* Sidebar - Desktop */}
                <aside className="hidden lg:flex flex-col w-64 border-r border-stone-200 bg-white fixed h-[calc(100vh-64px)] top-16 left-0 overflow-y-auto">
                    <nav className="flex-1 space-y-1 px-3 py-6">
                        {currentMenu.map((item) => {
                             const isActive = location.pathname === item.path;
                             return (
                                <Link 
                                    key={item.path} 
                                    to={item.path}
                                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-500' : 'text-stone-400'}`} />
                                    {item.label}
                                </Link>
                             );
                        })}
                    </nav>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                        <div className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl p-4 flex flex-col transform transition-transform animate-slideRight">
                            <div className="flex justify-between items-center mb-6 px-2">
                                <span className="font-bold text-lg text-stone-800">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-stone-100 rounded-full text-stone-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <nav className="space-y-2 flex-1 overflow-y-auto">
                                {currentMenu.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link 
                                            key={item.path} 
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'text-stone-600 hover:bg-stone-50'}`}
                                        >
                                            <item.icon className={`mr-4 h-5 w-5 ${isActive ? 'text-brand-500' : 'text-stone-400'}`} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="pt-4 border-t border-stone-100">
                                <button 
                                    onClick={() => { 
                                        signOut();
                                        navigate('/'); 
                                    }} 
                                    className="flex w-full items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium"
                                >
                                    <LogOut className="mr-4 h-5 w-5" /> Uitloggen
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 lg:ml-64 w-full max-w-[100vw] overflow-x-hidden">
                    <div className="mx-auto max-w-6xl animate-fadeIn">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};