import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, User, Euro, Star, Plus, Edit2, Trash2, Check, X, Users, Settings, Tag, TrendingUp, CalendarDays, ChevronLeft, ChevronRight, Filter, Coffee } from 'lucide-react';
import { DashboardLayout } from '../components/Layout';
import { Card, Badge, Button } from '../components/UIComponents';

// ===========================================
// MOCK DATA - Fake salon data
// ===========================================

const MOCK_SALON = {
    name: 'Kapsalon De Knip',
    rating: 4.8,
    reviewCount: 156,
    todayBookings: 8,
    weekRevenue: 2450,
    monthRevenue: 9800
};

const MOCK_TODAY_APPOINTMENTS = [
    { id: '1', time: '09:00', client: 'Anna de Vries', service: 'Knippen + Föhnen', duration: 60, price: 45, status: 'confirmed' },
    { id: '2', time: '10:00', client: 'Lisa Bakker', service: 'Kleuren', duration: 90, price: 85, status: 'confirmed' },
    { id: '3', time: '11:30', client: 'Sophie Smit', service: 'Knippen', duration: 30, price: 25, status: 'confirmed' },
    { id: '4', time: '13:00', client: 'Emma Visser', service: 'Highlights', duration: 120, price: 120, status: 'pending' },
    { id: '5', time: '15:00', client: 'Tom Peters', service: 'Knippen Heren', duration: 30, price: 22, status: 'confirmed' },
    { id: '6', time: '15:30', client: 'Jan de Boer', service: 'Baard Trimmen', duration: 30, price: 15, status: 'confirmed' },
    { id: '7', time: '16:00', client: 'Max Jansen', service: 'Knippen + Styling', duration: 45, price: 35, status: 'confirmed' },
    { id: '8', time: '17:00', client: 'Eva Mulder', service: 'Föhnen', duration: 30, price: 20, status: 'pending' },
];

const MOCK_WEEK_DATA = [
    { day: 'Ma', bookings: 6, revenue: 280 },
    { day: 'Di', bookings: 8, revenue: 420 },
    { day: 'Wo', bookings: 5, revenue: 310 },
    { day: 'Do', bookings: 9, revenue: 520 },
    { day: 'Vr', bookings: 12, revenue: 680 },
    { day: 'Za', bookings: 15, revenue: 890 },
    { day: 'Zo', bookings: 0, revenue: 0 },
];

const MOCK_SERVICES = [
    { id: '1', name: 'Knippen Dames', price: 35, duration: 45, category: 'Knippen', active: true },
    { id: '2', name: 'Knippen Heren', price: 22, duration: 30, category: 'Knippen', active: true },
    { id: '3', name: 'Knippen Kinderen', price: 18, duration: 30, category: 'Knippen', active: true },
    { id: '4', name: 'Föhnen', price: 20, duration: 30, category: 'Styling', active: true },
    { id: '5', name: 'Kleuren', price: 85, duration: 90, category: 'Kleuren', active: true },
    { id: '6', name: 'Highlights', price: 120, duration: 120, category: 'Kleuren', active: true },
    { id: '7', name: 'Balayage', price: 150, duration: 150, category: 'Kleuren', active: true },
    { id: '8', name: 'Permanenten', price: 95, duration: 120, category: 'Behandelingen', active: false },
];

const MOCK_STAFF = [
    { id: '1', name: 'Sarah de Vries', role: 'Eigenaar / Stylist', email: 'sarah@deknip.nl', avatar: '👩‍🦰', active: true },
    { id: '2', name: 'Kim Jansen', role: 'Senior Stylist', email: 'kim@deknip.nl', avatar: '👩', active: true },
    { id: '3', name: 'Mark Peters', role: 'Junior Stylist', email: 'mark@deknip.nl', avatar: '👨', active: true },
    { id: '4', name: 'Lisa Bakker', role: 'Stagiaire', email: 'lisa@deknip.nl', avatar: '👩‍🦱', active: false },
];

const MOCK_CLIENTS = [
    { id: '1', name: 'Anna de Vries', email: 'anna@email.nl', phone: '06-12345678', visits: 12, lastVisit: '14-01-2026', totalSpent: 540 },
    { id: '2', name: 'Lisa Bakker', email: 'lisa@email.nl', phone: '06-23456789', visits: 8, lastVisit: '10-01-2026', totalSpent: 380 },
    { id: '3', name: 'Sophie Smit', email: 'sophie@email.nl', phone: '06-34567890', visits: 24, lastVisit: '12-01-2026', totalSpent: 1250 },
    { id: '4', name: 'Emma Visser', email: 'emma@email.nl', phone: '06-45678901', visits: 5, lastVisit: '08-01-2026', totalSpent: 420 },
    { id: '5', name: 'Tom Peters', email: 'tom@email.nl', phone: '06-56789012', visits: 15, lastVisit: '13-01-2026', totalSpent: 330 },
];

const MOCK_DEALS = [
    { id: '1', name: 'Januari Korting', discount: 20, type: 'percentage', validUntil: '31-01-2026', usedCount: 15, active: true },
    { id: '2', name: 'Eerste Bezoek', discount: 10, type: 'fixed', validUntil: '31-12-2026', usedCount: 8, active: true },
    { id: '3', name: 'Kerst Special', discount: 25, type: 'percentage', validUntil: '26-12-2025', usedCount: 45, active: false },
];

// ===========================================
// MOCK SALON DASHBOARD
// ===========================================
const MockSalonDashboard: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-stone-900">Welkom terug! 👋</h1>
                        <Badge variant="warning">TEST DATA</Badge>
                    </div>
                    <p className="text-stone-500">{MOCK_SALON.name}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Star className="text-yellow-400 fill-yellow-400" size={16} />
                    <span className="font-medium">{MOCK_SALON.rating}</span>
                    <span className="text-stone-400">({MOCK_SALON.reviewCount} reviews)</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-100 rounded-lg">
                            <CalendarDays size={20} className="text-brand-600" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-500">Vandaag</p>
                            <p className="text-xl font-bold">{MOCK_SALON.todayBookings} afspraken</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Euro size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-500">Deze week</p>
                            <p className="text-xl font-bold">€{MOCK_SALON.weekRevenue}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-500">Deze maand</p>
                            <p className="text-xl font-bold">€{MOCK_SALON.monthRevenue}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-500">Klanten</p>
                            <p className="text-xl font-bold">{MOCK_CLIENTS.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Chart */}
            <Card className="p-5">
                <h2 className="font-semibold text-stone-800 mb-4">Omzet deze week</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_WEEK_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                            <XAxis dataKey="day" tick={{ fill: '#78716c', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#78716c', fontSize: 12 }} />
                            <Tooltip formatter={(value) => [`€${value}`, 'Omzet']} />
                            <Bar dataKey="revenue" fill="#D4A574" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Today's Appointments */}
            <Card className="p-5">
                <h2 className="font-semibold text-stone-800 mb-4">Afspraken vandaag</h2>
                <div className="space-y-3">
                    {MOCK_TODAY_APPOINTMENTS.slice(0, 5).map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <p className="text-sm font-bold text-brand-600">{apt.time}</p>
                                    <p className="text-xs text-stone-400">{apt.duration} min</p>
                                </div>
                                <div>
                                    <p className="font-medium text-stone-900">{apt.client}</p>
                                    <p className="text-sm text-stone-500">{apt.service}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-stone-700">€{apt.price}</span>
                                <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                                    {apt.status === 'confirmed' ? 'Bevestigd' : 'Wachtend'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// ===========================================
// MOCK SALON SCHEDULE
// ===========================================
const MockSalonSchedule: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [staffFilter, setStaffFilter] = useState('all');

    const changeDate = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const getPosition = (time: string, duration: number) => {
        const [hours, minutes] = time.split(':').map(Number);
        const startMinutes = (hours - 8) * 60 + minutes; 
        const top = startMinutes * 2; 
        const height = duration * 2;
        return { top: `${top}px`, height: `${height}px` };
    };

    const timeSlots = [];
    for (let i = 8; i < 18; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }

    const uniqueStaff = ['Sarah', 'Kim', 'Mark'];

    // Mock appointments with colors
    const mockAppointments = MOCK_TODAY_APPOINTMENTS.map((apt, i) => ({
        ...apt,
        staff: i % 2 === 0 ? 'Sarah' : 'Kim',
        color: apt.status === 'pending' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-brand-50 border-brand-300 text-brand-800'
    }));

    // Add a break block
    const appointmentsWithBreak = [
        ...mockAppointments,
        { id: 'break', time: '12:00', duration: 60, client: 'Lunch Pauze', service: '', price: 0, status: 'block', staff: 'Sarah', color: 'bg-stone-200 border-stone-300 text-stone-600' }
    ];

    const filteredAppointments = appointmentsWithBreak.filter(a => 
        staffFilter === 'all' || a.staff === staffFilter
    );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Agenda</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
                     <div className="relative w-full sm:w-auto">
                        <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                        <select 
                            className="h-10 w-full pl-9 pr-4 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer hover:bg-stone-50"
                            value={staffFilter}
                            onChange={(e) => setStaffFilter(e.target.value)}
                        >
                            <option value="all">Alle medewerkers</option>
                            {uniqueStaff.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                     </div>

                     <div className="flex gap-2 w-full sm:w-auto justify-between">
                         <div className="flex items-center bg-white rounded-xl shadow-sm border border-stone-200 p-1 flex-1 sm:flex-none justify-between">
                            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center px-4 font-semibold text-stone-800 text-sm md:text-base whitespace-nowrap">
                                <Calendar size={18} className="mr-2 text-stone-400 hidden sm:inline" />
                                {currentDate.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
                            </div>
                            <button onClick={() => changeDate(1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        
                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} disabled={isToday(currentDate)} className="h-full">
                            Vandaag
                        </Button>
                     </div>

                    <Button onClick={() => alert('Demo: Nieuwe afspraak')}>
                        <Plus size={18} className="md:mr-2" /> <span className="inline">Afspraak</span>
                    </Button>
                </div>
            </div>

            <Card className="flex-1 flex overflow-hidden border-stone-200 shadow-sm relative bg-white rounded-2xl">
                {/* Time column */}
                <div className="w-16 flex-shrink-0 border-r border-stone-100 bg-stone-50 overflow-y-hidden text-xs text-stone-400 font-medium select-none">
                    {timeSlots.map((time, i) => (
                        <div key={i} className="h-[60px] flex items-start justify-center pt-2 relative">
                           <span className={time.endsWith('00') ? 'font-bold text-stone-600' : ''}>{time}</span>
                        </div>
                    ))}
                </div>

                {/* Main schedule area */}
                <div className="flex-1 relative overflow-y-auto">
                    {/* Grid lines */}
                    {timeSlots.map((time, i) => (
                        <div key={i} className={`h-[60px] w-full border-b ${time.endsWith('30') ? 'border-stone-100 border-dashed' : 'border-stone-200'}`} />
                    ))}

                    {/* Current time indicator */}
                    {isToday(currentDate) && (
                         <div className="absolute left-0 right-0 border-t-2 border-brand-400 z-10 pointer-events-none opacity-50" style={{ top: '300px' }}>
                            <div className="absolute -top-1.5 -left-1 w-3 h-3 rounded-full bg-brand-400"></div>
                         </div>
                    )}

                    {/* Appointments */}
                    <div className="absolute inset-0 w-full">
                        {filteredAppointments.map(apt => {
                            const style = getPosition(apt.time, apt.duration);
                            const isBlock = apt.status === 'block';
                            return (
                                <div 
                                    key={apt.id}
                                    className={`absolute left-2 right-2 md:left-4 md:right-4 md:w-[95%] rounded-lg border-l-4 p-2 md:p-3 text-xs cursor-pointer shadow-sm hover:shadow-md transition-all group overflow-hidden ${apt.color}`}
                                    style={style}
                                    onClick={() => alert(`Demo: ${isBlock ? 'Pauze' : apt.client} bewerken`)}
                                >
                                    {isBlock ? (
                                        <div className="flex items-center h-full text-stone-500">
                                            <Coffee size={16} className="mr-2 opacity-70" />
                                            <span className="font-bold italic uppercase tracking-wider">{apt.client}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-sm mb-0.5">{apt.client}</div>
                                                    <div className="opacity-90 font-medium mb-1 truncate">{apt.service}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 opacity-75 mt-1">
                                                <span className="flex items-center"><Clock size={12} className="mr-1"/> {apt.time} ({apt.duration} min)</span>
                                                <span className="flex items-center hidden sm:flex"><User size={12} className="mr-1"/> {apt.staff}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ===========================================
// MOCK SALON SERVICES
// ===========================================
const MockSalonServices: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Diensten</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                <Button onClick={() => alert('Demo: Nieuwe dienst')}>
                    <Plus size={16} className="mr-2" /> Nieuwe Dienst
                </Button>
            </div>

            <Card className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                        <tr className="text-left text-stone-500">
                            <th className="p-4">Dienst</th>
                            <th className="p-4">Categorie</th>
                            <th className="p-4">Duur</th>
                            <th className="p-4">Prijs</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_SERVICES.map((service) => (
                            <tr key={service.id} className="border-t border-stone-100 hover:bg-stone-50">
                                <td className="p-4 font-medium text-stone-900">{service.name}</td>
                                <td className="p-4 text-stone-600">{service.category}</td>
                                <td className="p-4 text-stone-600">{service.duration} min</td>
                                <td className="p-4 font-medium">€{service.price}</td>
                                <td className="p-4">
                                    <Badge variant={service.active ? 'success' : 'default'}>
                                        {service.active ? 'Actief' : 'Inactief'}
                                    </Badge>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => alert('Demo: Bewerken')}>
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => alert('Demo: Verwijderen')}>
                                            <Trash2 size={14} />
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
// MOCK SALON STAFF
// ===========================================
const MockSalonStaff: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Medewerkers</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                <Button onClick={() => alert('Demo: Medewerker toevoegen')}>
                    <Plus size={16} className="mr-2" /> Medewerker Toevoegen
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {MOCK_STAFF.map((staff) => (
                    <Card key={staff.id} className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-2xl">
                                {staff.avatar}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-stone-900">{staff.name}</p>
                                <p className="text-sm text-stone-500">{staff.role}</p>
                                <p className="text-xs text-stone-400">{staff.email}</p>
                            </div>
                            <Badge variant={staff.active ? 'success' : 'default'}>
                                {staff.active ? 'Actief' : 'Inactief'}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// ===========================================
// MOCK SALON CLIENTS
// ===========================================
const MockSalonClients: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Klanten</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
            </div>

            <Card className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                        <tr className="text-left text-stone-500">
                            <th className="p-4">Klant</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Bezoeken</th>
                            <th className="p-4">Laatste bezoek</th>
                            <th className="p-4">Totaal besteed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_CLIENTS.map((client) => (
                            <tr key={client.id} className="border-t border-stone-100 hover:bg-stone-50">
                                <td className="p-4 font-medium text-stone-900">{client.name}</td>
                                <td className="p-4">
                                    <p className="text-stone-600">{client.email}</p>
                                    <p className="text-xs text-stone-400">{client.phone}</p>
                                </td>
                                <td className="p-4 text-stone-600">{client.visits}x</td>
                                <td className="p-4 text-stone-500">{client.lastVisit}</td>
                                <td className="p-4 font-medium text-green-600">€{client.totalSpent}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

// ===========================================
// MOCK SALON DEALS
// ===========================================
const MockSalonDeals: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Aanbiedingen</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                <Button onClick={() => alert('Demo: Nieuwe aanbieding')}>
                    <Plus size={16} className="mr-2" /> Nieuwe Aanbieding
                </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_DEALS.map((deal) => (
                    <Card key={deal.id} className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-brand-100 rounded-lg">
                                <Tag size={20} className="text-brand-600" />
                            </div>
                            <Badge variant={deal.active ? 'success' : 'default'}>
                                {deal.active ? 'Actief' : 'Verlopen'}
                            </Badge>
                        </div>
                        <h3 className="font-semibold text-stone-900 mb-1">{deal.name}</h3>
                        <p className="text-2xl font-bold text-brand-600 mb-2">
                            {deal.type === 'percentage' ? `${deal.discount}%` : `€${deal.discount}`} korting
                        </p>
                        <div className="text-sm text-stone-500 space-y-1">
                            <p>Geldig t/m: {deal.validUntil}</p>
                            <p>{deal.usedCount}x gebruikt</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// ===========================================
// MOCK SALON SETTINGS
// ===========================================
const MockSalonSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Instellingen</h1>
                <Badge variant="warning">TEST DATA</Badge>
            </div>

            <div className="grid gap-6">
                <Card className="p-5">
                    <h2 className="font-semibold text-stone-800 mb-4">Salon Gegevens</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Salon Naam</label>
                            <input type="text" value={MOCK_SALON.name} readOnly className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200" />
                        </div>
                        <div>
                            <label className="block text-sm text-stone-500 mb-1">Telefoon</label>
                            <input type="text" value="020 - 123 45 67" readOnly className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-stone-500 mb-1">Adres</label>
                            <input type="text" value="Kerkstraat 123, 1012 AB Amsterdam" readOnly className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5">
                    <h2 className="font-semibold text-stone-800 mb-4">Openingstijden</h2>
                    <div className="space-y-2">
                        {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'].map((day, i) => (
                            <div key={day} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                <span className="font-medium">{day}</span>
                                <span className="text-stone-600">{i < 6 ? '09:00 - 18:00' : 'Gesloten'}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ===========================================
// MAIN SALON TEST COMPONENT
// ===========================================
export const SalonTest: React.FC = () => {
    return (
        <DashboardLayout role="salon" basePath="/salontest">
            <Routes>
                <Route path="/" element={<MockSalonDashboard />} />
                <Route path="/schedule" element={<MockSalonSchedule />} />
                <Route path="/services" element={<MockSalonServices />} />
                <Route path="/staff" element={<MockSalonStaff />} />
                <Route path="/settings" element={<MockSalonSettings />} />
                <Route path="/deals" element={<MockSalonDeals />} />
                <Route path="/clients" element={<MockSalonClients />} />
                <Route path="*" element={<Navigate to="/salontest" replace />} />
            </Routes>
        </DashboardLayout>
    );
};
