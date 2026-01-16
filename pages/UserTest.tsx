import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Star, Heart, User, Mail, Phone, Edit2, ChevronRight, Bell, Download, X, RefreshCw } from 'lucide-react';
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
        priceRange: '€€',
        services: ['Knippen', 'Kleuren', 'Styling']
    },
    { 
        id: '2', 
        name: 'Beauty Queen', 
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
        rating: 4.5,
        reviewCount: 89,
        city: 'Den Haag',
        category: 'Schoonheidssalon',
        priceRange: '€€€',
        services: ['Gezichtsbehandeling', 'Massage', 'Waxen']
    },
    { 
        id: '3', 
        name: 'Nail Art Studio', 
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
        rating: 4.7,
        reviewCount: 64,
        city: 'Rotterdam',
        category: 'Nagelsalon',
        priceRange: '€€',
        services: ['Manicure', 'Pedicure', 'Nail Art']
    },
];

// ===========================================
// MOCK USER DASHBOARD
// ===========================================
const MockUserDashboard: React.FC = () => {
    const [showNotification, setShowNotification] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<typeof MOCK_UPCOMING_APPOINTMENTS[0] | null>(null);

    const nextAppointment = MOCK_UPCOMING_APPOINTMENTS[0];

    const handleDownloadICS = (apt: typeof MOCK_UPCOMING_APPOINTMENTS[0]) => {
        alert(`Demo: ICS bestand downloaden voor ${apt.salon} op ${apt.date}`);
    };

    const handleEditAppointment = (apt: typeof MOCK_UPCOMING_APPOINTMENTS[0]) => {
        setEditingAppointment(apt);
        setShowEditModal(true);
    };

    const handleCancelAppointment = (apt: typeof MOCK_UPCOMING_APPOINTMENTS[0]) => {
        if (confirm(`Weet je zeker dat je de afspraak bij ${apt.salon} op ${apt.date} wilt annuleren?`)) {
            alert('Demo: Afspraak geannuleerd');
        }
    };

    const handleRebook = (apt: typeof MOCK_PAST_APPOINTMENTS[0]) => {
        alert(`Demo: Opnieuw boeken bij ${apt.salon} voor ${apt.service}`);
    };

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

            {/* Notification Banner */}
            {showNotification && nextAppointment && (
                <div className="relative bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-brand-100 rounded-xl">
                        <Bell size={24} className="text-brand-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-stone-900">Reminder: Je hebt binnenkort een afspraak!</p>
                        <p className="text-sm text-stone-600">
                            {nextAppointment.service} bij {nextAppointment.salon} op {nextAppointment.date} om {nextAppointment.time}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadICS(nextAppointment)}>
                        <Download size={16} className="mr-2" /> Toevoegen aan agenda
                    </Button>
                    <button 
                        onClick={() => setShowNotification(false)}
                        className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

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
                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-3">
                                        <Button variant="outline" size="sm" onClick={() => handleDownloadICS(apt)}>
                                            <Download size={14} className="mr-1" /> ICS
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleEditAppointment(apt)}>
                                            <Edit2 size={14} className="mr-1" /> Wijzigen
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleCancelAppointment(apt)}>
                                            <X size={14} className="mr-1" /> Annuleren
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-stone-900">€{apt.price}</p>
                                    <p className="text-xs text-stone-400">{apt.duration} min</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {MOCK_UPCOMING_APPOINTMENTS.length === 0 && (
                        <Card className="p-8 text-center">
                            <p className="text-stone-500">Je hebt geen komende afspraken</p>
                            <Button className="mt-4" onClick={() => window.location.href = '/search'}>
                                Zoek een salon
                            </Button>
                        </Card>
                    )}
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
                                <th className="p-4">Acties</th>
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
                                    <td className="p-4">
                                        <Button variant="ghost" size="sm" onClick={() => handleRebook(apt)}>
                                            <RefreshCw size={14} className="mr-1" /> Opnieuw boeken
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* Edit Appointment Modal */}
            {showEditModal && editingAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-stone-900">Afspraak Wijzigen</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 bg-stone-50 rounded-xl">
                            <p className="font-medium text-stone-900">{editingAppointment.salon}</p>
                            <p className="text-sm text-stone-600">{editingAppointment.service}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Nieuwe datum</label>
                            <input
                                type="date"
                                defaultValue="2026-01-20"
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Nieuwe tijd</label>
                            <select className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400">
                                <option>09:00</option>
                                <option>09:30</option>
                                <option>10:00</option>
                                <option>10:30</option>
                                <option>11:00</option>
                                <option>11:30</option>
                                <option selected>14:00</option>
                                <option>14:30</option>
                                <option>15:00</option>
                                <option>15:30</option>
                                <option>16:00</option>
                            </select>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" onClick={() => setShowEditModal(false)}>Annuleren</Button>
                            <Button onClick={() => { alert('Demo: Afspraak gewijzigd'); setShowEditModal(false); }}>
                                Opslaan
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===========================================
// MOCK USER FAVORITES
// ===========================================
const MockUserFavorites: React.FC = () => {
    const [favorites, setFavorites] = useState(MOCK_FAVORITES);

    const removeFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Weet je zeker dat je deze salon wilt verwijderen uit je favorieten?')) {
            setFavorites(prev => prev.filter(f => f.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Favorieten</h1>
                <Badge variant="warning">TEST DATA</Badge>
                <span className="text-stone-500 text-sm">({favorites.length} salons)</span>
            </div>

            {favorites.length === 0 ? (
                <Card className="p-8 text-center">
                    <Heart size={48} className="mx-auto text-stone-300 mb-4" />
                    <p className="text-stone-500 mb-4">Je hebt nog geen favoriete salons</p>
                    <Button onClick={() => window.location.href = '/search'}>
                        Ontdek salons
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((salon) => (
                        <Card key={salon.id} className="overflow-hidden group cursor-pointer" onClick={() => alert(`Demo: Ga naar ${salon.name}`)}>
                            <div className="relative">
                                <img src={salon.image} alt={salon.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                                <button 
                                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                                    onClick={(e) => removeFavorite(salon.id, e)}
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
                                {/* Services badges */}
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {salon.services.slice(0, 3).map((service, i) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-full">
                                            {service}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

// ===========================================
// MOCK USER PROFILE
// ===========================================
const MockUserProfile: React.FC = () => {
    const [formData, setFormData] = useState({
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        phone: MOCK_USER.phone
    });
    const [notifications, setNotifications] = useState({
        emailReminders: true,
        smsReminders: false,
        marketingEmails: true,
        dealAlerts: true
    });

    const handleSave = () => {
        alert('Demo: Profiel opgeslagen');
    };

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
                        <h2 className="text-xl font-semibold text-stone-900">{formData.name}</h2>
                        <p className="text-stone-500">Lid sinds {MOCK_USER.memberSince}</p>
                    </div>
                    <Button variant="outline" className="ml-auto" onClick={() => alert('Demo: Foto wijzigen')}>
                        <Edit2 size={16} className="mr-2" /> Foto wijzigen
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Naam</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Telefoon</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                    </div>
                </div>
            </Card>

            {/* Notifications Section */}
            <Card className="p-6">
                <h3 className="font-semibold text-stone-800 mb-4">Notificatie-instellingen</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                        <div>
                            <p className="font-medium text-stone-900">E-mail herinneringen</p>
                            <p className="text-sm text-stone-500">Ontvang herinneringen voor afspraken via e-mail</p>
                        </div>
                        <button
                            onClick={() => setNotifications({ ...notifications, emailReminders: !notifications.emailReminders })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${notifications.emailReminders ? 'bg-brand-500' : 'bg-stone-300'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.emailReminders ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                        <div>
                            <p className="font-medium text-stone-900">SMS herinneringen</p>
                            <p className="text-sm text-stone-500">Ontvang herinneringen voor afspraken via SMS</p>
                        </div>
                        <button
                            onClick={() => setNotifications({ ...notifications, smsReminders: !notifications.smsReminders })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${notifications.smsReminders ? 'bg-brand-500' : 'bg-stone-300'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.smsReminders ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                        <div>
                            <p className="font-medium text-stone-900">Marketing e-mails</p>
                            <p className="text-sm text-stone-500">Ontvang nieuws en updates van Mijn Beauty Afspraken</p>
                        </div>
                        <button
                            onClick={() => setNotifications({ ...notifications, marketingEmails: !notifications.marketingEmails })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${notifications.marketingEmails ? 'bg-brand-500' : 'bg-stone-300'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.marketingEmails ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                        <div>
                            <p className="font-medium text-stone-900">Deal meldingen</p>
                            <p className="text-sm text-stone-500">Ontvang meldingen over aanbiedingen van favoriete salons</p>
                        </div>
                        <button
                            onClick={() => setNotifications({ ...notifications, dealAlerts: !notifications.dealAlerts })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${notifications.dealAlerts ? 'bg-brand-500' : 'bg-stone-300'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.dealAlerts ? 'left-7' : 'left-1'}`} />
                        </button>
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

            <div className="flex justify-end">
                <Button onClick={handleSave}>Opslaan</Button>
            </div>
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
