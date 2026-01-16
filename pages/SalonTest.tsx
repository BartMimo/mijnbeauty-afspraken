import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, User, Euro, Star, Plus, Edit2, Trash2, Check, X, Users, Settings, Tag, TrendingUp, CalendarDays, ChevronLeft, ChevronRight, Filter, Coffee, Search, Mail, ArrowUpDown, ArrowUp, ArrowDown, Image, Link2 } from 'lucide-react';
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
    { id: '1', name: 'Anna de Vries', email: 'anna@email.nl', phone: '06-12345678', visits: 12, lastVisit: '14-01-2026', totalSpent: 540, marketingOptIn: true },
    { id: '2', name: 'Lisa Bakker', email: 'lisa@email.nl', phone: '06-23456789', visits: 8, lastVisit: '10-01-2026', totalSpent: 380, marketingOptIn: true },
    { id: '3', name: 'Sophie Smit', email: 'sophie@email.nl', phone: '06-34567890', visits: 24, lastVisit: '12-01-2026', totalSpent: 1250, marketingOptIn: false },
    { id: '4', name: 'Emma Visser', email: 'emma@email.nl', phone: '06-45678901', visits: 5, lastVisit: '08-01-2026', totalSpent: 420, marketingOptIn: true },
    { id: '5', name: 'Tom Peters', email: 'tom@email.nl', phone: '06-56789012', visits: 15, lastVisit: '13-01-2026', totalSpent: 330, marketingOptIn: false },
];

const MOCK_DEALS = [
    { id: '1', name: 'Januari Korting', service: 'Knippen Dames', discount: 20, originalPrice: 35, type: 'percentage', date: '2026-01-31', time: '18:00', usedCount: 15, active: true },
    { id: '2', name: 'Eerste Bezoek', service: 'Alle diensten', discount: 10, originalPrice: 0, type: 'fixed', date: '2026-12-31', time: '23:59', usedCount: 8, active: true },
    { id: '3', name: 'Kerst Special', service: 'Highlights', discount: 25, originalPrice: 120, type: 'percentage', date: '2025-12-26', time: '18:00', usedCount: 45, active: false },
];

// ===========================================
// MOCK SALON DASHBOARD
// ===========================================
const MockSalonDashboard: React.FC = () => {
    const statsDisplay = [
        { label: 'Vandaag', value: `${MOCK_SALON.todayBookings} afspraken`, icon: CalendarDays, color: 'brand', trend: '+2 vs vorige week' },
        { label: 'Deze week', value: `€${MOCK_SALON.weekRevenue}`, icon: Euro, color: 'green', trend: '+12% vs vorige week' },
        { label: 'Deze maand', value: `€${MOCK_SALON.monthRevenue}`, icon: TrendingUp, color: 'blue', trend: '+8% vs vorige maand' },
        { label: 'Klanten', value: `${MOCK_CLIENTS.length}`, icon: Users, color: 'purple', trend: '+3 nieuwe deze maand' },
    ];

    const colorClasses: Record<string, string> = {
        brand: 'bg-brand-100 text-brand-600',
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
    };

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
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <span className="font-medium">{MOCK_SALON.rating}</span>
                        <span className="text-stone-400">({MOCK_SALON.reviewCount} reviews)</span>
                    </div>
                    <Button variant="outline" onClick={() => alert('Demo: Promotie maken')}>
                        <Tag size={16} className="mr-2" /> Promotie maken
                    </Button>
                    <Button onClick={() => alert('Demo: Nieuwe afspraak')}>
                        <Plus size={16} className="mr-2" /> Nieuwe afspraak
                    </Button>
                </div>
            </div>

            {/* Stats with trends */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsDisplay.map((stat, i) => {
                    const IconComponent = stat.icon;
                    return (
                        <Card key={i} className="p-5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                                    <IconComponent size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">{stat.label}</p>
                                    <p className="text-xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-green-600">{stat.trend}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
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

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Today's Appointments */}
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-stone-800">Afspraken vandaag</h2>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/salontest/schedule'}>
                            Bekijk alles →
                        </Button>
                    </div>
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

                {/* Active Deals */}
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-stone-800">Actieve Aanbiedingen</h2>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/salontest/deals'}>
                            Bekijk alles →
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {MOCK_DEALS.filter(d => d.active).map((deal) => (
                            <div key={deal.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-brand-100 rounded-lg">
                                        <Tag size={18} className="text-brand-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900">{deal.name}</p>
                                        <p className="text-sm text-stone-500">{deal.service}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-600">
                                        {deal.type === 'percentage' ? `${deal.discount}%` : `€${deal.discount}`} korting
                                    </p>
                                    <p className="text-xs text-stone-400">{deal.usedCount}x gebruikt</p>
                                </div>
                            </div>
                        ))}
                        {MOCK_DEALS.filter(d => d.active).length === 0 && (
                            <p className="text-sm text-stone-500 text-center py-4">Geen actieve aanbiedingen</p>
                        )}
                    </div>
                </Card>
            </div>
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
const CATEGORIES = ['Knippen', 'Styling', 'Kleuren', 'Behandelingen', 'Nagels', 'Make-up'];
const DURATIONS = [15, 30, 45, 60, 90, 120, 150, 180];

const MockSalonServices: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<typeof MOCK_SERVICES[0] | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        duration: 30,
        category: 'Knippen',
        active: true
    });

    const openNewModal = () => {
        setEditingService(null);
        setFormData({ name: '', price: 0, duration: 30, category: 'Knippen', active: true });
        setShowModal(true);
    };

    const openEditModal = (service: typeof MOCK_SERVICES[0]) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            price: service.price,
            duration: service.duration,
            category: service.category,
            active: service.active
        });
        setShowModal(true);
    };

    const handleSave = () => {
        alert(`Demo: ${editingService ? 'Dienst bijgewerkt' : 'Nieuwe dienst aangemaakt'}: ${formData.name}`);
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        alert('Demo: Dienst verwijderd');
    };

    const handleToggleActive = (service: typeof MOCK_SERVICES[0]) => {
        alert(`Demo: ${service.name} is nu ${service.active ? 'inactief' : 'actief'}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Diensten</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                <Button onClick={openNewModal}>
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
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-stone-100 rounded-lg text-stone-600 text-xs">
                                        {service.category}
                                    </span>
                                </td>
                                <td className="p-4 text-stone-600">{service.duration} min</td>
                                <td className="p-4 font-medium">€{service.price}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggleActive(service)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${service.active ? 'bg-brand-500' : 'bg-stone-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${service.active ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => openEditModal(service)}>
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(service.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Service Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-stone-900">
                                {editingService ? 'Dienst Bewerken' : 'Nieuwe Dienst'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Naam</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                placeholder="Naam van de dienst"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Categorie</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Duur (minuten)</label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                >
                                    {DURATIONS.map(dur => (
                                        <option key={dur} value={dur}>{dur} minuten</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Prijs (€)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                    min="0"
                                    step="0.50"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                            <span className="font-medium text-stone-700">Dienst actief</span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, active: !formData.active })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${formData.active ? 'bg-brand-500' : 'bg-stone-300'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.active ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" onClick={() => setShowModal(false)}>Annuleren</Button>
                            <Button onClick={handleSave}>
                                {editingService ? 'Opslaan' : 'Aanmaken'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===========================================
// MOCK SALON STAFF
// ===========================================
type WeeklySchedule = {
    monday: { active: boolean; start: string; end: string };
    tuesday: { active: boolean; start: string; end: string };
    wednesday: { active: boolean; start: string; end: string };
    thursday: { active: boolean; start: string; end: string };
    friday: { active: boolean; start: string; end: string };
    saturday: { active: boolean; start: string; end: string };
    sunday: { active: boolean; start: string; end: string };
};

type Permissions = {
    canManageSchedule: boolean;
    canSeeRevenue: boolean;
    canManageSettings: boolean;
};

const MOCK_STAFF_DETAILED = [
    { 
        id: '1', name: 'Sarah de Vries', role: 'Eigenaar / Stylist', email: 'sarah@deknip.nl', avatar: '👩‍🦰', active: true,
        schedule: {
            monday: { active: true, start: '09:00', end: '18:00' },
            tuesday: { active: true, start: '09:00', end: '18:00' },
            wednesday: { active: true, start: '09:00', end: '18:00' },
            thursday: { active: true, start: '09:00', end: '20:00' },
            friday: { active: true, start: '09:00', end: '18:00' },
            saturday: { active: true, start: '09:00', end: '17:00' },
            sunday: { active: false, start: '09:00', end: '18:00' },
        },
        permissions: { canManageSchedule: true, canSeeRevenue: true, canManageSettings: true }
    },
    { 
        id: '2', name: 'Kim Jansen', role: 'Senior Stylist', email: 'kim@deknip.nl', avatar: '👩', active: true,
        schedule: {
            monday: { active: true, start: '10:00', end: '18:00' },
            tuesday: { active: false, start: '09:00', end: '18:00' },
            wednesday: { active: true, start: '09:00', end: '18:00' },
            thursday: { active: true, start: '09:00', end: '18:00' },
            friday: { active: true, start: '09:00', end: '18:00' },
            saturday: { active: true, start: '09:00', end: '15:00' },
            sunday: { active: false, start: '09:00', end: '18:00' },
        },
        permissions: { canManageSchedule: true, canSeeRevenue: true, canManageSettings: false }
    },
    { 
        id: '3', name: 'Mark Peters', role: 'Junior Stylist', email: 'mark@deknip.nl', avatar: '👨', active: true,
        schedule: {
            monday: { active: false, start: '09:00', end: '18:00' },
            tuesday: { active: true, start: '09:00', end: '18:00' },
            wednesday: { active: true, start: '09:00', end: '18:00' },
            thursday: { active: true, start: '09:00', end: '18:00' },
            friday: { active: true, start: '09:00', end: '18:00' },
            saturday: { active: false, start: '09:00', end: '18:00' },
            sunday: { active: false, start: '09:00', end: '18:00' },
        },
        permissions: { canManageSchedule: false, canSeeRevenue: false, canManageSettings: false }
    },
    { 
        id: '4', name: 'Lisa Bakker', role: 'Stagiaire', email: 'lisa@deknip.nl', avatar: '👩‍🦱', active: false,
        schedule: {
            monday: { active: true, start: '09:00', end: '17:00' },
            tuesday: { active: true, start: '09:00', end: '17:00' },
            wednesday: { active: false, start: '09:00', end: '18:00' },
            thursday: { active: false, start: '09:00', end: '18:00' },
            friday: { active: true, start: '09:00', end: '17:00' },
            saturday: { active: false, start: '09:00', end: '18:00' },
            sunday: { active: false, start: '09:00', end: '18:00' },
        },
        permissions: { canManageSchedule: false, canSeeRevenue: false, canManageSettings: false }
    },
];

const dayLabels: { [key: string]: string } = {
    monday: 'Maandag',
    tuesday: 'Dinsdag',
    wednesday: 'Woensdag',
    thursday: 'Donderdag',
    friday: 'Vrijdag',
    saturday: 'Zaterdag',
    sunday: 'Zondag',
};

const MockSalonStaff: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<typeof MOCK_STAFF_DETAILED[0] | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        email: '',
        active: true,
        schedule: {
            monday: { active: true, start: '09:00', end: '18:00' },
            tuesday: { active: true, start: '09:00', end: '18:00' },
            wednesday: { active: true, start: '09:00', end: '18:00' },
            thursday: { active: true, start: '09:00', end: '18:00' },
            friday: { active: true, start: '09:00', end: '18:00' },
            saturday: { active: false, start: '09:00', end: '17:00' },
            sunday: { active: false, start: '09:00', end: '18:00' },
        } as WeeklySchedule,
        permissions: { canManageSchedule: false, canSeeRevenue: false, canManageSettings: false } as Permissions
    });

    const openNewModal = () => {
        setEditingStaff(null);
        setFormData({
            name: '',
            role: '',
            email: '',
            active: true,
            schedule: {
                monday: { active: true, start: '09:00', end: '18:00' },
                tuesday: { active: true, start: '09:00', end: '18:00' },
                wednesday: { active: true, start: '09:00', end: '18:00' },
                thursday: { active: true, start: '09:00', end: '18:00' },
                friday: { active: true, start: '09:00', end: '18:00' },
                saturday: { active: false, start: '09:00', end: '17:00' },
                sunday: { active: false, start: '09:00', end: '18:00' },
            },
            permissions: { canManageSchedule: false, canSeeRevenue: false, canManageSettings: false }
        });
        setShowModal(true);
    };

    const openEditModal = (staff: typeof MOCK_STAFF_DETAILED[0]) => {
        setEditingStaff(staff);
        setFormData({
            name: staff.name,
            role: staff.role,
            email: staff.email,
            active: staff.active,
            schedule: { ...staff.schedule },
            permissions: { ...staff.permissions }
        });
        setShowModal(true);
    };

    const handleSave = () => {
        alert(`Demo: ${editingStaff ? 'Medewerker bijgewerkt' : 'Nieuwe medewerker toegevoegd'}: ${formData.name}`);
        setShowModal(false);
    };

    const updateScheduleDay = (day: keyof WeeklySchedule, field: 'active' | 'start' | 'end', value: boolean | string) => {
        setFormData(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [day]: {
                    ...prev.schedule[day],
                    [field]: value
                }
            }
        }));
    };

    const updatePermission = (perm: keyof Permissions, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [perm]: value
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Medewerkers</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                <Button onClick={openNewModal}>
                    <Plus size={16} className="mr-2" /> Medewerker Toevoegen
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {MOCK_STAFF_DETAILED.map((staff) => (
                    <Card key={staff.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditModal(staff)}>
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
                        <div className="mt-4 pt-4 border-t border-stone-100">
                            <p className="text-xs text-stone-500 mb-2">Werkdagen:</p>
                            <div className="flex gap-1">
                                {Object.entries(staff.schedule).map(([day, schedule]) => (
                                    <span 
                                        key={day} 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${schedule.active ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-400'}`}
                                    >
                                        {day.charAt(0).toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-stone-900">
                                {editingStaff ? 'Medewerker Bewerken' : 'Nieuwe Medewerker'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
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
                                <label className="block text-sm font-medium text-stone-700 mb-1">Rol</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                />
                            </div>
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

                        {/* Weekly Schedule */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-3">Werkrooster</label>
                            <div className="space-y-2">
                                {(Object.keys(formData.schedule) as Array<keyof WeeklySchedule>).map(day => (
                                    <div key={day} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                                        <input
                                            type="checkbox"
                                            checked={formData.schedule[day].active}
                                            onChange={(e) => updateScheduleDay(day, 'active', e.target.checked)}
                                            className="rounded border-stone-300"
                                        />
                                        <span className="w-24 font-medium text-stone-700">{dayLabels[day]}</span>
                                        {formData.schedule[day].active ? (
                                            <>
                                                <input
                                                    type="time"
                                                    value={formData.schedule[day].start}
                                                    onChange={(e) => updateScheduleDay(day, 'start', e.target.value)}
                                                    className="p-2 rounded-lg border border-stone-200 text-sm"
                                                />
                                                <span className="text-stone-400">tot</span>
                                                <input
                                                    type="time"
                                                    value={formData.schedule[day].end}
                                                    onChange={(e) => updateScheduleDay(day, 'end', e.target.value)}
                                                    className="p-2 rounded-lg border border-stone-200 text-sm"
                                                />
                                            </>
                                        ) : (
                                            <span className="text-stone-400 italic">Vrij</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Permissions */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-3">Rechten</label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-stone-700">Agenda beheren</p>
                                        <p className="text-xs text-stone-500">Kan afspraken aanmaken en wijzigen</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updatePermission('canManageSchedule', !formData.permissions.canManageSchedule)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.permissions.canManageSchedule ? 'bg-brand-500' : 'bg-stone-300'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions.canManageSchedule ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-stone-700">Omzet inzien</p>
                                        <p className="text-xs text-stone-500">Kan omzet en financiële gegevens bekijken</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updatePermission('canSeeRevenue', !formData.permissions.canSeeRevenue)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.permissions.canSeeRevenue ? 'bg-brand-500' : 'bg-stone-300'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions.canSeeRevenue ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-stone-700">Instellingen beheren</p>
                                        <p className="text-xs text-stone-500">Kan saloninstellingen wijzigen</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updatePermission('canManageSettings', !formData.permissions.canManageSettings)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.permissions.canManageSettings ? 'bg-brand-500' : 'bg-stone-300'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.permissions.canManageSettings ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                            <span className="font-medium text-stone-700">Medewerker actief</span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, active: !formData.active })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${formData.active ? 'bg-brand-500' : 'bg-stone-300'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.active ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" onClick={() => setShowModal(false)}>Annuleren</Button>
                            <Button onClick={handleSave}>
                                {editingStaff ? 'Opslaan' : 'Toevoegen'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===========================================
// MOCK SALON CLIENTS
// ===========================================
type SortKey = 'name' | 'visits' | 'lastVisit' | 'totalSpent';
type SortDirection = 'asc' | 'desc';

const SortIcon: React.FC<{ active: boolean; direction: SortDirection }> = ({ active, direction }) => {
    if (!active) return <ArrowUpDown size={14} className="text-stone-300" />;
    return direction === 'asc' 
        ? <ArrowUp size={14} className="text-brand-600" />
        : <ArrowDown size={14} className="text-brand-600" />;
};

const MockSalonClients: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedClients = [...MOCK_CLIENTS]
        .filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'name') comparison = a.name.localeCompare(b.name);
            else if (sortKey === 'visits') comparison = a.visits - b.visits;
            else if (sortKey === 'totalSpent') comparison = a.totalSpent - b.totalSpent;
            else if (sortKey === 'lastVisit') comparison = new Date(a.lastVisit.split('-').reverse().join('-')).getTime() - new Date(b.lastVisit.split('-').reverse().join('-')).getTime();
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const toggleSelectAll = () => {
        if (selectedClients.length === filteredAndSortedClients.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(filteredAndSortedClients.map(c => c.id));
        }
    };

    const toggleSelectClient = (clientId: string) => {
        setSelectedClients(prev => 
            prev.includes(clientId) 
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSendEmail = () => {
        const recipients = selectedClients.length > 0 
            ? MOCK_CLIENTS.filter(c => selectedClients.includes(c.id) && c.marketingOptIn)
            : MOCK_CLIENTS.filter(c => c.marketingOptIn);
        alert(`Demo: E-mail verzonden naar ${recipients.length} klanten met onderwerp: ${emailSubject}`);
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
        setSelectedClients([]);
    };

    const marketingOptInClients = selectedClients.length > 0
        ? MOCK_CLIENTS.filter(c => selectedClients.includes(c.id) && c.marketingOptIn).length
        : MOCK_CLIENTS.filter(c => c.marketingOptIn).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Klanten</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                <Button onClick={() => setShowEmailModal(true)}>
                    <Mail size={16} className="mr-2" />
                    {selectedClients.length > 0 ? `Mail Selectie (${selectedClients.length})` : 'Stuur Totaalmail'}
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
                <input
                    type="text"
                    placeholder="Zoek op naam of e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
            </div>

            <Card className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                        <tr className="text-left text-stone-500">
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedClients.length === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-stone-300"
                                />
                            </th>
                            <th className="p-4 cursor-pointer hover:bg-stone-100" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Klant
                                    <SortIcon active={sortKey === 'name'} direction={sortDirection} />
                                </div>
                            </th>
                            <th className="p-4">Contact</th>
                            <th className="p-4 cursor-pointer hover:bg-stone-100" onClick={() => handleSort('visits')}>
                                <div className="flex items-center gap-2">
                                    Bezoeken
                                    <SortIcon active={sortKey === 'visits'} direction={sortDirection} />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer hover:bg-stone-100" onClick={() => handleSort('lastVisit')}>
                                <div className="flex items-center gap-2">
                                    Laatste bezoek
                                    <SortIcon active={sortKey === 'lastVisit'} direction={sortDirection} />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer hover:bg-stone-100" onClick={() => handleSort('totalSpent')}>
                                <div className="flex items-center gap-2">
                                    Totaal besteed
                                    <SortIcon active={sortKey === 'totalSpent'} direction={sortDirection} />
                                </div>
                            </th>
                            <th className="p-4">Marketing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedClients.map((client) => (
                            <tr key={client.id} className="border-t border-stone-100 hover:bg-stone-50">
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedClients.includes(client.id)}
                                        onChange={() => toggleSelectClient(client.id)}
                                        className="rounded border-stone-300"
                                    />
                                </td>
                                <td className="p-4 font-medium text-stone-900">{client.name}</td>
                                <td className="p-4">
                                    <p className="text-stone-600">{client.email}</p>
                                    <p className="text-xs text-stone-400">{client.phone}</p>
                                </td>
                                <td className="p-4 text-stone-600">{client.visits}x</td>
                                <td className="p-4 text-stone-500">{client.lastVisit}</td>
                                <td className="p-4 font-medium text-green-600">€{client.totalSpent}</td>
                                <td className="p-4">
                                    <Badge variant={client.marketingOptIn ? 'success' : 'default'}>
                                        {client.marketingOptIn ? 'Ja' : 'Nee'}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-stone-900">E-mail versturen</h2>
                            <button onClick={() => setShowEmailModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-sm text-stone-500">
                            E-mail wordt verzonden naar {marketingOptInClients} klant(en) met marketing opt-in.
                            {selectedClients.length > 0 && ` (${selectedClients.length} geselecteerd)`}
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Onderwerp</label>
                            <input
                                type="text"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                placeholder="Onderwerp van de e-mail..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Bericht</label>
                            <textarea
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                rows={6}
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                placeholder="Typ hier uw bericht..."
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowEmailModal(false)}>Annuleren</Button>
                            <Button onClick={handleSendEmail} disabled={!emailSubject || !emailBody}>
                                <Mail size={16} className="mr-2" /> Versturen
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===========================================
// MOCK SALON DEALS
// ===========================================
const MockSalonDeals: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingDeal, setEditingDeal] = useState<typeof MOCK_DEALS[0] | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        service: '',
        discount: 0,
        originalPrice: 0,
        type: 'percentage' as 'percentage' | 'fixed',
        date: '',
        time: '',
        active: true
    });

    const openNewModal = () => {
        setEditingDeal(null);
        setFormData({
            name: '',
            service: '',
            discount: 0,
            originalPrice: 0,
            type: 'percentage',
            date: '',
            time: '',
            active: true
        });
        setShowModal(true);
    };

    const openEditModal = (deal: typeof MOCK_DEALS[0]) => {
        setEditingDeal(deal);
        setFormData({
            name: deal.name,
            service: deal.service,
            discount: deal.discount,
            originalPrice: deal.originalPrice,
            type: deal.type as 'percentage' | 'fixed',
            date: deal.date,
            time: deal.time,
            active: deal.active
        });
        setShowModal(true);
    };

    const handleSave = () => {
        alert(`Demo: ${editingDeal ? 'Aanbieding bijgewerkt' : 'Nieuwe aanbieding aangemaakt'}: ${formData.name}`);
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        alert(`Demo: Aanbieding verwijderd`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-stone-900">Aanbiedingen</h1>
                    <Badge variant="warning">TEST DATA</Badge>
                </div>
                <Button onClick={openNewModal}>
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
                            <div className="flex items-center gap-2">
                                <Badge variant={deal.active ? 'success' : 'default'}>
                                    {deal.active ? 'Actief' : 'Verlopen'}
                                </Badge>
                            </div>
                        </div>
                        <h3 className="font-semibold text-stone-900 mb-1">{deal.name}</h3>
                        <p className="text-sm text-stone-500 mb-2">{deal.service}</p>
                        <p className="text-2xl font-bold text-brand-600 mb-2">
                            {deal.type === 'percentage' ? `${deal.discount}%` : `€${deal.discount}`} korting
                        </p>
                        {deal.originalPrice > 0 && (
                            <p className="text-sm text-stone-500 mb-2">
                                <span className="line-through">€{deal.originalPrice}</span> → €{(deal.originalPrice * (1 - deal.discount / 100)).toFixed(0)}
                            </p>
                        )}
                        <div className="text-sm text-stone-500 space-y-1">
                            <p>Geldig t/m: {new Date(deal.date).toLocaleDateString('nl-NL')} om {deal.time}</p>
                            <p>{deal.usedCount}x gebruikt</p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(deal)}>
                                <Edit2 size={14} className="mr-1" /> Bewerken
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(deal.id)}>
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Deal Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-stone-900">
                                {editingDeal ? 'Aanbieding Bewerken' : 'Nieuwe Aanbieding'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Naam</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                placeholder="Naam van de aanbieding"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Dienst</label>
                            <select
                                value={formData.service}
                                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                            >
                                <option value="">Selecteer een dienst</option>
                                {MOCK_SERVICES.map(s => (
                                    <option key={s.id} value={s.name}>{s.name} - €{s.price}</option>
                                ))}
                                <option value="Alle diensten">Alle diensten</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Korting Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Vast bedrag (€)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Korting {formData.type === 'percentage' ? '(%)' : '(€)'}
                                </label>
                                <input
                                    type="number"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Originele Prijs (€)</label>
                            <input
                                type="number"
                                value={formData.originalPrice}
                                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                placeholder="0 = niet tonen"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Geldig tot datum</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Geldig tot tijd</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                            <span className="font-medium text-stone-700">Aanbieding actief</span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, active: !formData.active })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${formData.active ? 'bg-brand-500' : 'bg-stone-300'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.active ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" onClick={() => setShowModal(false)}>Annuleren</Button>
                            <Button onClick={handleSave}>
                                {editingDeal ? 'Opslaan' : 'Aanmaken'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===========================================
// MOCK SALON SETTINGS
// ===========================================
type SettingsTab = 'general' | 'portfolio' | 'sync';

const MockSalonSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [openingHours, setOpeningHours] = useState({
        monday: { active: true, start: '09:00', end: '18:00' },
        tuesday: { active: true, start: '09:00', end: '18:00' },
        wednesday: { active: true, start: '09:00', end: '18:00' },
        thursday: { active: true, start: '09:00', end: '20:00' },
        friday: { active: true, start: '09:00', end: '18:00' },
        saturday: { active: true, start: '09:00', end: '17:00' },
        sunday: { active: false, start: '09:00', end: '18:00' },
    });
    const [portfolioImages] = useState([
        'https://picsum.photos/seed/salon1/400/300',
        'https://picsum.photos/seed/salon2/400/300',
        'https://picsum.photos/seed/salon3/400/300',
        'https://picsum.photos/seed/salon4/400/300',
    ]);

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'Algemeen', icon: <Settings size={18} /> },
        { id: 'portfolio', label: 'Portfolio', icon: <Image size={18} /> },
        { id: 'sync', label: 'Synchronisatie', icon: <Link2 size={18} /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Instellingen</h1>
                <Badge variant="warning">TEST DATA</Badge>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-stone-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-stone-500 hover:text-stone-700'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="grid gap-6">
                    <Card className="p-5">
                        <h2 className="font-semibold text-stone-800 mb-4">Salon Gegevens</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-stone-500 mb-1">Salon Naam</label>
                                <input type="text" defaultValue={MOCK_SALON.name} className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400" />
                            </div>
                            <div>
                                <label className="block text-sm text-stone-500 mb-1">Telefoon</label>
                                <input type="text" defaultValue="020 - 123 45 67" className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-stone-500 mb-1">Adres</label>
                                <input type="text" defaultValue="Kerkstraat 123, 1012 AB Amsterdam" className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-stone-500 mb-1">Beschrijving</label>
                                <textarea rows={3} defaultValue="Een gezellige kapsalon in het hart van Amsterdam." className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <h2 className="font-semibold text-stone-800 mb-4">Openingstijden</h2>
                        <div className="space-y-2">
                            {(Object.keys(openingHours) as Array<keyof typeof openingHours>).map((day) => (
                                <div key={day} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={openingHours[day].active}
                                            onChange={(e) => setOpeningHours(prev => ({
                                                ...prev,
                                                [day]: { ...prev[day], active: e.target.checked }
                                            }))}
                                            className="rounded border-stone-300"
                                        />
                                        <span className="font-medium w-24">{dayLabels[day]}</span>
                                    </div>
                                    {openingHours[day].active ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={openingHours[day].start}
                                                onChange={(e) => setOpeningHours(prev => ({
                                                    ...prev,
                                                    [day]: { ...prev[day], start: e.target.value }
                                                }))}
                                                className="p-2 rounded-lg border border-stone-200 text-sm"
                                            />
                                            <span className="text-stone-400">-</span>
                                            <input
                                                type="time"
                                                value={openingHours[day].end}
                                                onChange={(e) => setOpeningHours(prev => ({
                                                    ...prev,
                                                    [day]: { ...prev[day], end: e.target.value }
                                                }))}
                                                className="p-2 rounded-lg border border-stone-200 text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-stone-400 italic">Gesloten</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={() => alert('Demo: Instellingen opgeslagen')}>Opslaan</Button>
                    </div>
                </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
                <div className="space-y-6">
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-stone-800">Portfolio Foto's</h2>
                            <Button variant="outline" size="sm" onClick={() => alert('Demo: Foto uploaden')}>
                                <Plus size={16} className="mr-2" /> Foto Toevoegen
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {portfolioImages.map((img, i) => (
                                <div key={i} className="relative group aspect-[4/3] rounded-xl overflow-hidden">
                                    <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => alert('Demo: Foto verwijderen')}
                                            className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-stone-500 mt-4">
                            Upload maximaal 10 foto's. Aanbevolen formaat: 4:3, minimaal 800x600 pixels.
                        </p>
                    </Card>
                </div>
            )}

            {/* Sync Tab */}
            {activeTab === 'sync' && (
                <div className="space-y-6">
                    <Card className="p-5">
                        <h2 className="font-semibold text-stone-800 mb-4">Agenda Synchronisatie</h2>
                        <p className="text-sm text-stone-500 mb-6">
                            Synchroniseer uw salon agenda met externe kalenders om altijd up-to-date te blijven.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-stone-200 rounded-xl hover:border-brand-300 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">📅</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900">Google Agenda</p>
                                        <p className="text-sm text-stone-500">Synchroniseer met Google Calendar</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => alert('Demo: Google Agenda koppelen')}>
                                    Koppelen
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-stone-200 rounded-xl hover:border-brand-300 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">🍎</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900">Apple Calendar</p>
                                        <p className="text-sm text-stone-500">Synchroniseer met iCal</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => alert('Demo: Apple Calendar koppelen')}>
                                    Koppelen
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-stone-200 rounded-xl hover:border-brand-300 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">📆</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900">Outlook</p>
                                        <p className="text-sm text-stone-500">Synchroniseer met Microsoft Outlook</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => alert('Demo: Outlook koppelen')}>
                                    Koppelen
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <h2 className="font-semibold text-stone-800 mb-4">ICS Feed URL</h2>
                        <p className="text-sm text-stone-500 mb-4">
                            Gebruik deze URL om uw agenda te abonneren vanuit elke agenda-app.
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value="https://mijnbeautyafspraken.nl/ics/salon/demo-123" 
                                className="flex-1 p-3 bg-stone-50 rounded-lg border border-stone-200 text-sm text-stone-600"
                            />
                            <Button variant="outline" onClick={() => {
                                navigator.clipboard.writeText('https://mijnbeautyafspraken.nl/ics/salon/demo-123');
                                alert('URL gekopieerd!');
                            }}>
                                Kopiëren
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
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
