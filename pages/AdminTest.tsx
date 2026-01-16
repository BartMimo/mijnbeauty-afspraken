import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Check, X, Eye, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/Layout';
import { Card, Badge, Button } from '../components/UIComponents';

// ===========================================
// MOCK DATA - Completely fake test data
// ===========================================

const MOCK_STATS = {
    revenue: 12450,
    salons: 47,
    bookings: 328,
    users: 1205
};

const MOCK_BOOKINGS_BY_DAY = [
    { name: 'Ma', bookings: 45 },
    { name: 'Di', bookings: 52 },
    { name: 'Wo', bookings: 38 },
    { name: 'Do', bookings: 61 },
    { name: 'Vr', bookings: 78 },
    { name: 'Za', bookings: 92 },
    { name: 'Zo', bookings: 12 }
];

const MOCK_SALON_GROWTH = [
    { m: 'aug', s: 3 },
    { m: 'sep', s: 7 },
    { m: 'okt', s: 12 },
    { m: 'nov', s: 8 },
    { m: 'dec', s: 15 },
    { m: 'jan', s: 22 }
];

const MOCK_NEW_SALONS = [
    { id: '1', name: 'Salon Bella', city: 'Amsterdam', date: '15-01-2026', status: 'pending' },
    { id: '2', name: 'Hair Studio Max', city: 'Rotterdam', date: '14-01-2026', status: 'pending' },
    { id: '3', name: 'Nails & More', city: 'Utrecht', date: '13-01-2026', status: 'active' },
    { id: '4', name: 'Beauty Queen', city: 'Den Haag', date: '12-01-2026', status: 'active' },
    { id: '5', name: 'The Barber Shop', city: 'Eindhoven', date: '11-01-2026', status: 'active' }
];

const MOCK_SALONS = [
    { id: '1', name: 'Salon Bella', owner: 'Anna de Vries', city: 'Amsterdam', status: 'pending', bookings: 0, rating: null, created_at: '15-01-2026' },
    { id: '2', name: 'Hair Studio Max', owner: 'Max Jansen', city: 'Rotterdam', status: 'pending', bookings: 0, rating: null, created_at: '14-01-2026' },
    { id: '3', name: 'Kapsalon De Knip', owner: 'Lisa Bakker', city: 'Utrecht', status: 'active', bookings: 156, rating: 4.8, created_at: '01-12-2025' },
    { id: '4', name: 'Beauty Queen', owner: 'Sophie Smit', city: 'Den Haag', status: 'active', bookings: 89, rating: 4.5, created_at: '15-11-2025' },
    { id: '5', name: 'The Barber Shop', owner: 'Tom Peters', city: 'Eindhoven', status: 'active', bookings: 234, rating: 4.9, created_at: '01-10-2025' },
    { id: '6', name: 'Nail Art Studio', owner: 'Emma Visser', city: 'Groningen', status: 'rejected', bookings: 0, rating: null, created_at: '10-01-2026' },
    { id: '7', name: 'Spa Wellness', owner: 'Jan de Boer', city: 'Maastricht', status: 'active', bookings: 67, rating: 4.2, created_at: '20-09-2025' },
];

const MOCK_USERS = [
    { id: '1', name: 'Anna de Vries', email: 'anna@salonbella.nl', role: 'salon', created_at: '15-01-2026', last_login: '16-01-2026' },
    { id: '2', name: 'Max Jansen', email: 'max@hairstudiomax.nl', role: 'salon', created_at: '14-01-2026', last_login: '15-01-2026' },
    { id: '3', name: 'Lisa Bakker', email: 'lisa@gmail.com', role: 'consumer', created_at: '01-12-2025', last_login: '16-01-2026' },
    { id: '4', name: 'Sophie Smit', email: 'sophie@beautyqueen.nl', role: 'salon', created_at: '15-11-2025', last_login: '16-01-2026' },
    { id: '5', name: 'Tom Peters', email: 'tom@barbershop.nl', role: 'salon', created_at: '01-10-2025', last_login: '14-01-2026' },
    { id: '6', name: 'Emma Visser', email: 'emma@hotmail.com', role: 'consumer', created_at: '05-01-2026', last_login: '16-01-2026' },
    { id: '7', name: 'Jan de Boer', email: 'jan@spawellness.nl', role: 'salon', created_at: '20-09-2025', last_login: '12-01-2026' },
    { id: '8', name: 'Bart Admin', email: 'admin@bart.nl', role: 'admin', created_at: '01-01-2025', last_login: '16-01-2026' },
];

// ===========================================
// MOCK ADMIN DASHBOARD
// ===========================================
const MockAdminDashboard: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Admin Overzicht</h1>
                <Badge variant="warning">TEST DATA</Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="text-center p-5">
                    <p className="text-sm text-stone-500">Omzet (MTD)</p>
                    <p className="text-2xl font-bold text-stone-900">€{MOCK_STATS.revenue.toLocaleString('nl-NL')}</p>
                </Card>
                <Card className="text-center p-5">
                    <p className="text-sm text-stone-500">Salons</p>
                    <p className="text-2xl font-bold text-stone-900">{MOCK_STATS.salons}</p>
                </Card>
                <Card className="text-center p-5">
                    <p className="text-sm text-stone-500">Boekingen (MTD)</p>
                    <p className="text-2xl font-bold text-stone-900">{MOCK_STATS.bookings}</p>
                </Card>
                <Card className="text-center p-5">
                    <p className="text-sm text-stone-500">Gebruikers</p>
                    <p className="text-2xl font-bold text-stone-900">{MOCK_STATS.users}</p>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-5">
                    <h2 className="font-semibold text-stone-800 mb-4">Boekingen per dag</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MOCK_BOOKINGS_BY_DAY}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                                <XAxis dataKey="name" tick={{ fill: '#78716c', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#78716c', fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="bookings" fill="#D4A574" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="p-5">
                    <h2 className="font-semibold text-stone-800 mb-4">Salon groei (laatste 6 maanden)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MOCK_SALON_GROWTH}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                                <XAxis dataKey="m" tick={{ fill: '#78716c', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#78716c', fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="s" stroke="#D4A574" strokeWidth={2} dot={{ fill: '#D4A574' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* New Salons */}
            <Card className="p-5">
                <h2 className="font-semibold text-stone-800 mb-4">Nieuwe Salons</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-stone-500 border-b border-stone-100">
                                <th className="pb-2">Naam</th>
                                <th className="pb-2">Stad</th>
                                <th className="pb-2">Datum</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_NEW_SALONS.map((salon) => (
                                <tr key={salon.id} className="border-b border-stone-50">
                                    <td className="py-3 font-medium text-stone-900">{salon.name}</td>
                                    <td className="py-3 text-stone-600">{salon.city}</td>
                                    <td className="py-3 text-stone-500">{salon.date}</td>
                                    <td className="py-3">
                                        <Badge variant={salon.status === 'pending' ? 'warning' : 'success'}>
                                            {salon.status === 'pending' ? 'Wacht op review' : 'Actief'}
                                        </Badge>
                                    </td>
                                    <td className="py-3 text-right">
                                        {salon.status === 'pending' && (
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" className="!p-2" onClick={() => alert('Demo: Salon goedgekeurd!')}>
                                                    <Check size={14} />
                                                </Button>
                                                <Button size="sm" variant="outline" className="!p-2 text-red-500" onClick={() => alert('Demo: Salon afgewezen!')}>
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// ===========================================
// MOCK ADMIN SALONS
// ===========================================
const MockAdminSalons: React.FC = () => {
    const [filter, setFilter] = React.useState<string>('all');

    const filteredSalons = MOCK_SALONS.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Salons Beheer</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'active', 'rejected'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === f
                                ? 'bg-brand-400 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                    >
                        {f === 'all' ? 'Alle' : f === 'pending' ? 'Wachtend' : f === 'active' ? 'Actief' : 'Afgewezen'}
                        {f === 'pending' && <span className="ml-1 bg-white/20 px-1.5 rounded-full">{MOCK_SALONS.filter(s => s.status === 'pending').length}</span>}
                    </button>
                ))}
            </div>

            {/* Salon List */}
            <Card className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                        <tr className="text-left text-stone-500">
                            <th className="p-4">Salon</th>
                            <th className="p-4">Eigenaar</th>
                            <th className="p-4">Stad</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Boekingen</th>
                            <th className="p-4">Rating</th>
                            <th className="p-4 text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSalons.map((salon) => (
                            <tr key={salon.id} className="border-t border-stone-100 hover:bg-stone-50">
                                <td className="p-4">
                                    <p className="font-medium text-stone-900">{salon.name}</p>
                                    <p className="text-xs text-stone-400">{salon.created_at}</p>
                                </td>
                                <td className="p-4 text-stone-600">{salon.owner}</td>
                                <td className="p-4 text-stone-600">{salon.city}</td>
                                <td className="p-4">
                                    <Badge variant={
                                        salon.status === 'pending' ? 'warning' : 
                                        salon.status === 'active' ? 'success' : 'error'
                                    }>
                                        {salon.status === 'pending' ? 'Wachtend' : 
                                         salon.status === 'active' ? 'Actief' : 'Afgewezen'}
                                    </Badge>
                                </td>
                                <td className="p-4 text-stone-600">{salon.bookings}</td>
                                <td className="p-4 text-stone-600">{salon.rating ? `⭐ ${salon.rating}` : '-'}</td>
                                <td className="p-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        {salon.status === 'pending' && (
                                            <>
                                                <Button size="sm" className="!p-2" onClick={() => alert('Demo: Goedgekeurd!')}>
                                                    <Check size={14} />
                                                </Button>
                                                <Button size="sm" variant="outline" className="!p-2 text-red-500" onClick={() => alert('Demo: Afgewezen!')}>
                                                    <X size={14} />
                                                </Button>
                                            </>
                                        )}
                                        <Button size="sm" variant="ghost" className="!p-2" onClick={() => alert('Demo: Bekijken')}>
                                            <Eye size={14} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

// ===========================================
// MOCK ADMIN USERS
// ===========================================
const MockAdminUsers: React.FC = () => {
    const [filter, setFilter] = React.useState<string>('all');

    const filteredUsers = MOCK_USERS.filter(u => {
        if (filter === 'all') return true;
        return u.role === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Gebruikers Beheer</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'consumer', 'salon', 'admin'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === f
                                ? 'bg-brand-400 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                    >
                        {f === 'all' ? 'Alle' : f === 'consumer' ? 'Klanten' : f === 'salon' ? 'Salons' : 'Admins'}
                    </button>
                ))}
            </div>

            {/* User List */}
            <Card className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                        <tr className="text-left text-stone-500">
                            <th className="p-4">Naam</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Aangemaakt</th>
                            <th className="p-4">Laatste login</th>
                            <th className="p-4 text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-t border-stone-100 hover:bg-stone-50">
                                <td className="p-4 font-medium text-stone-900">{user.name}</td>
                                <td className="p-4 text-stone-600">{user.email}</td>
                                <td className="p-4">
                                    <Badge variant={
                                        user.role === 'admin' ? 'error' : 
                                        user.role === 'salon' ? 'success' : 'default'
                                    }>
                                        {user.role === 'consumer' ? 'Klant' : 
                                         user.role === 'salon' ? 'Salon' : 'Admin'}
                                    </Badge>
                                </td>
                                <td className="p-4 text-stone-500">{user.created_at}</td>
                                <td className="p-4 text-stone-500">{user.last_login}</td>
                                <td className="p-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" className="!p-2" onClick={() => alert('Demo: Bekijken')}>
                                            <Eye size={14} />
                                        </Button>
                                        {user.role !== 'admin' && (
                                            <Button size="sm" variant="ghost" className="!p-2 text-red-500" onClick={() => alert('Demo: Verwijderen')}>
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

// ===========================================
// MAIN ADMIN TEST COMPONENT
// ===========================================
export const AdminTest: React.FC = () => {
    return (
        <DashboardLayout role="admin" basePath="/admintest">
            <Routes>
                <Route path="/" element={<MockAdminDashboard />} />
                <Route path="/salons" element={<MockAdminSalons />} />
                <Route path="/users" element={<MockAdminUsers />} />
                <Route path="*" element={<Navigate to="/admintest" replace />} />
            </Routes>
        </DashboardLayout>
    );
};
