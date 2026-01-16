import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Star, Heart, User, Mail, Phone, Edit2, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '../components/Layout';
import { Card, Badge, Button } from '../components/UIComponents';

// ===========================================
// MOCK DATA - Fake user data
// ===========================================

const MOCK_USER = {
    name: 'Lisa Bakker',
    email: 'lisa.bakker@email.nl',
    phone: '06-12345678',
    avatar: '👩',
    memberSince: 'maart 2025'
};

const MOCK_UPCOMING_APPOINTMENTS = [
    { 
        id: '1', 
        salon: 'Kapsalon De Knip', 
        salonImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200',
        service: 'Knippen + Föhnen', 
        date: '18-01-2026', 
        time: '14:00',
        duration: 60,
        price: 45,
        address: 'Kerkstraat 123, Amsterdam',
        status: 'confirmed'
    },
    { 
        id: '2', 
        salon: 'Beauty Queen', 
        salonImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200',
        service: 'Gezichtsbehandeling', 
        date: '25-01-2026', 
        time: '10:30',
        duration: 90,
        price: 75,
        address: 'Hoofdstraat 45, Den Haag',
        status: 'pending'
    },
];

const MOCK_PAST_APPOINTMENTS = [
    { 
        id: '3', 
        salon: 'Kapsalon De Knip', 
        service: 'Kleuren', 
        date: '05-01-2026', 
        price: 85,
        rating: 5
    },
    { 
        id: '4', 
        salon: 'Nail Art Studio', 
        service: 'Manicure', 
        date: '20-12-2025', 
        price: 35,
        rating: 4
    },
    { 
        id: '5', 
        salon: 'Kapsalon De Knip', 
        service: 'Knippen', 
        date: '01-12-2025', 
        price: 35,
        rating: 5
    },
    { 
        id: '6', 
        salon: 'Beauty Queen', 
        service: 'Wenkbrauwen', 
        date: '15-11-2025', 
        price: 25,
        rating: null
    },
];

const MOCK_FAVORITES = [
    { 
        id: '1', 
        name: 'Kapsalon De Knip', 
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
        rating: 4.8,
        reviewCount: 156,
        city: 'Amsterdam',
        category: 'Kapsalon',
        priceRange: '€€'
    },
    { 
        id: '2', 
        name: 'Beauty Queen', 
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
        rating: 4.5,
        reviewCount: 89,
        city: 'Den Haag',
        category: 'Schoonheidssalon',
        priceRange: '€€€'
    },
    { 
        id: '3', 
        name: 'Nail Art Studio', 
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
        rating: 4.7,
        reviewCount: 64,
        city: 'Rotterdam',
        category: 'Nagelsalon',
        priceRange: '€€'
    },
];

// ===========================================
// MOCK USER DASHBOARD
// ===========================================
const MockUserDashboard: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-stone-900">Hallo, {MOCK_USER.name.split(' ')[0]}! 👋</h1>
                        <Badge variant="warning">TEST DATA</Badge>
                    </div>
                    <p className="text-stone-500">Welkom terug bij Mijn Beauty Afspraken</p>
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 mb-4">Komende Afspraken</h2>
                <div className="space-y-4">
                    {MOCK_UPCOMING_APPOINTMENTS.map((apt) => (
                        <Card key={apt.id} className="p-5">
                            <div className="flex gap-4">
                                <img src={apt.salonImage} alt={apt.salon} className="w-20 h-20 rounded-xl object-cover" />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-stone-900">{apt.salon}</h3>
                                            <p className="text-brand-600 font-medium">{apt.service}</p>
                                        </div>
                                        <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                                            {apt.status === 'confirmed' ? 'Bevestigd' : 'Wachtend'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> {apt.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> {apt.time}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={14} /> {apt.address.split(',')[0]}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-stone-900">€{apt.price}</p>
                                    <p className="text-xs text-stone-400">{apt.duration} min</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Past Appointments */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 mb-4">Recente Afspraken</h2>
                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50">
                            <tr className="text-left text-stone-500">
                                <th className="p-4">Salon</th>
                                <th className="p-4">Dienst</th>
                                <th className="p-4">Datum</th>
                                <th className="p-4">Prijs</th>
                                <th className="p-4">Beoordeling</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_PAST_APPOINTMENTS.map((apt) => (
                                <tr key={apt.id} className="border-t border-stone-100 hover:bg-stone-50">
                                    <td className="p-4 font-medium text-stone-900">{apt.salon}</td>
                                    <td className="p-4 text-stone-600">{apt.service}</td>
                                    <td className="p-4 text-stone-500">{apt.date}</td>
                                    <td className="p-4 font-medium">€{apt.price}</td>
                                    <td className="p-4">
                                        {apt.rating ? (
                                            <div className="flex items-center gap-1">
                                                {[...Array(apt.rating)].map((_, i) => (
                                                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                                                ))}
                                            </div>
                                        ) : (
                                            <button className="text-brand-500 text-sm hover:underline" onClick={() => alert('Demo: Review schrijven')}>
                                                Review schrijven
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
};

// ===========================================
// MOCK USER FAVORITES
// ===========================================
const MockUserFavorites: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Favorieten</h1>
                <Badge variant="warning">TEST DATA</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_FAVORITES.map((salon) => (
                    <Card key={salon.id} className="overflow-hidden group cursor-pointer" onClick={() => alert('Demo: Ga naar salon')}>
                        <div className="relative">
                            <img src={salon.image} alt={salon.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                            <button 
                                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md"
                                onClick={(e) => { e.stopPropagation(); alert('Demo: Verwijderen uit favorieten'); }}
                            >
                                <Heart size={18} className="text-red-500 fill-red-500" />
                            </button>
                            <div className="absolute bottom-3 left-3">
                                <Badge variant="default" className="bg-white/90">{salon.category}</Badge>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-stone-900 group-hover:text-brand-600 transition-colors">{salon.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
                                <MapPin size={14} />
                                <span>{salon.city}</span>
                                <span>•</span>
                                <span>{salon.priceRange}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                <span className="font-medium text-stone-900">{salon.rating}</span>
                                <span className="text-stone-400 text-sm">({salon.reviewCount})</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// ===========================================
// MOCK USER PROFILE
// ===========================================
const MockUserProfile: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Mijn Profiel</h1>
                <Badge variant="warning">TEST DATA</Badge>
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-4xl">
                        {MOCK_USER.avatar}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-stone-900">{MOCK_USER.name}</h2>
                        <p className="text-stone-500">Lid sinds {MOCK_USER.memberSince}</p>
                    </div>
                    <Button variant="outline" className="ml-auto" onClick={() => alert('Demo: Foto wijzigen')}>
                        <Edit2 size={16} className="mr-2" /> Wijzigen
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <User size={20} className="text-stone-400" />
                            <div>
                                <p className="text-sm text-stone-500">Naam</p>
                                <p className="font-medium text-stone-900">{MOCK_USER.name}</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-stone-300" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Mail size={20} className="text-stone-400" />
                            <div>
                                <p className="text-sm text-stone-500">E-mail</p>
                                <p className="font-medium text-stone-900">{MOCK_USER.email}</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-stone-300" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Phone size={20} className="text-stone-400" />
                            <div>
                                <p className="text-sm text-stone-500">Telefoon</p>
                                <p className="font-medium text-stone-900">{MOCK_USER.phone}</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-stone-300" />
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="font-semibold text-stone-800 mb-4">Statistieken</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-stone-50 rounded-xl">
                        <p className="text-2xl font-bold text-brand-600">{MOCK_PAST_APPOINTMENTS.length + MOCK_UPCOMING_APPOINTMENTS.length}</p>
                        <p className="text-sm text-stone-500">Totaal afspraken</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl">
                        <p className="text-2xl font-bold text-brand-600">{MOCK_FAVORITES.length}</p>
                        <p className="text-sm text-stone-500">Favoriete salons</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl">
                        <p className="text-2xl font-bold text-brand-600">€{MOCK_PAST_APPOINTMENTS.reduce((sum, a) => sum + a.price, 0)}</p>
                        <p className="text-sm text-stone-500">Totaal besteed</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ===========================================
// MAIN USER TEST COMPONENT
// ===========================================
export const UserTest: React.FC = () => {
    return (
        <DashboardLayout role="user" basePath="/usertest">
            <Routes>
                <Route path="/" element={<MockUserDashboard />} />
                <Route path="/appointments" element={<MockUserDashboard />} />
                <Route path="/favorites" element={<MockUserFavorites />} />
                <Route path="/profile" element={<MockUserProfile />} />
                <Route path="*" element={<Navigate to="/usertest" replace />} />
            </Routes>
        </DashboardLayout>
    );
};
