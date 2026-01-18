import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, CreditCard, Calendar, ArrowUpRight, Tag, Plus, Clock, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SalonDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const basePath = location.pathname.startsWith('/salontest') ? '/salontest' : '/dashboard/salon';

    // --- STATE MANAGEMENT ---
    const [salonId, setSalonId] = useState<string | null>(null);
    const [salonName, setSalonName] = useState<string>('Mijn Salon');
    const [deals, setDeals] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalBookings: 0,
        revenue: 0,
        newClients: 0
    });
    const [loading, setLoading] = useState(true);

    // Agenda state
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);

    // Fetch salon data on mount
    useEffect(() => {
        const fetchSalonData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Get salon owned by this user
                const { data: salon, error: salonError } = await supabase
                    .from('salons')
                    .select('id, name')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (salonError) throw salonError;
                
                if (!salon) {
                    setLoading(false);
                    return;
                }

                setSalonId(salon.id);
                setSalonName(salon.name);

                // Fetch deals for this salon
                const { data: dealsData } = await supabase
                    .from('deals')
                    .select('*')
                    .eq('salon_id', salon.id)
                    .eq('status', 'active')
                    .order('date', { ascending: true });

                if (dealsData) {
                    setDeals(dealsData.map(d => ({
                        id: d.id,
                        service: d.service_name,
                        price: d.discount_price,
                        original: d.original_price,
                        time: `${new Date(d.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${d.time || ''}`,
                        status: d.status
                    })));
                }

                // Fetch appointments based on view mode
                let appointmentsQuery = supabase
                    .from('appointments')
                    .select(`
                        *,
                        profiles:user_id (full_name),
                        services:service_id (name, price)
                    `)
                    .eq('salon_id', salon.id);

                if (viewMode === 'day') {
                    // Only today's appointments
                    const todayStr = new Date().toISOString().split('T')[0];
                    appointmentsQuery = appointmentsQuery.eq('date', todayStr);
                } else {
                    // Week view: get appointments for the current week
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

                    appointmentsQuery = appointmentsQuery
                        .gte('date', startOfWeek.toISOString().split('T')[0])
                        .lte('date', endOfWeek.toISOString().split('T')[0]);
                }

                const { data: appointmentsData } = await appointmentsQuery
                    .order('date', { ascending: true })
                    .order('time', { ascending: true });

                if (appointmentsData) {
                    const formattedAppointments = appointmentsData.map(a => ({
                        id: a.id,
                        date: a.date,
                        time: a.time,
                        client: a.profiles?.full_name || a.customer_name || 'Onbekend',
                        service: a.services?.name || a.service_name || 'Dienst',
                        price: a.price || a.services?.price || 0,
                        status: a.status
                    }));

                    setAppointments(formattedAppointments);
                    setFilteredAppointments(formattedAppointments);
                }

                // Calculate stats - only count completed appointments and confirmed appointments that have already occurred
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { data: monthlyAppointments, count } = await supabase
                    .from('appointments')
                    .select('price, status, date', { count: 'exact' })
                    .eq('salon_id', salon.id)
                    .gte('date', startOfMonth.toISOString().split('T')[0])
                    .lte('date', today) // Only appointments up to today
                    .or('status.eq.confirmed,status.eq.completed'); // Only confirmed or completed appointments

                const revenue = monthlyAppointments?.reduce((sum, a) => sum + (a.price || 0), 0) || 0;
                
                setStats({
                    totalBookings: count || 0,
                    revenue: revenue,
                    newClients: Math.floor((count || 0) * 0.3) // Estimate 30% are new
                });

            } catch (err) {
                console.error('Error fetching salon data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSalonData();
    }, [user, viewMode, currentDate]);

    // Filter appointments based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredAppointments(appointments);
        } else {
            const filtered = appointments.filter(apt =>
                apt.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.time.includes(searchQuery)
            );
            setFilteredAppointments(filtered);
        }
    }, [appointments, searchQuery]);

    // Navigation functions
    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        } else {
            newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // --- MODAL STATES ---
    const [isAptModalOpen, setIsAptModalOpen] = useState(false);
    const [aptForm, setAptForm] = useState({ client: '', service: '', time: '09:00', date: '', price: '' });

    // --- ACTIONS: APPOINTMENTS ---
    
    const handleSaveApt = async () => {
        if (!salonId) return;

        // For now, just add to local state - full implementation would create in Supabase
        const appointmentDate = aptForm.date || new Date().toISOString().split('T')[0];
        const newApt = {
            id: Date.now().toString(),
            date: appointmentDate,
            time: aptForm.time,
            client: aptForm.client,
            service: aptForm.service,
            price: parseFloat(aptForm.price) || 0,
            status: 'confirmed'
        };

        setAppointments(prev => [newApt, ...prev]);
        setIsAptModalOpen(false);
        setAptForm({ client: '', service: '', time: '09:00', date: '', price: '' });
    };

    // Stats display data
    const statsDisplay = [
        { label: 'Totaal Boekingen', value: stats.totalBookings.toString(), trend: '+12%', icon: Calendar },
        { label: 'Omzet deze maand', value: `€${stats.revenue.toFixed(0)}`, trend: '+8%', icon: CreditCard },
        { label: 'Nieuwe Klanten', value: stats.newClients.toString(), trend: '+5%', icon: Users },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Salon Dashboard</h1>
                    <p className="text-stone-500">Welkom terug, {salonName}</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        className="hidden md:inline-flex"
                        onClick={() => navigate(`${basePath}/deals`)}
                    >
                        <Tag className="mr-2 h-4 w-4" /> Promotie maken
                    </Button>
                    <Button onClick={() => setIsAptModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nieuwe afspraak
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {statsDisplay.map((stat, idx) => (
                    <Card key={idx} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
                                <stat.icon size={24} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                {stat.trend} <ArrowUpRight size={12} className="ml-1" />
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-stone-900">{stat.value}</h3>
                        <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Schedule */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="h-auto">
                        {/* Header with controls */}
                        <div className="p-6 border-b border-stone-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-stone-900">Agenda</h3>
                                    <div className="flex bg-stone-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('day')}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                viewMode === 'day' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                        >
                                            Dag
                                        </button>
                                        <button
                                            onClick={() => setViewMode('week')}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                viewMode === 'week' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                        >
                                            Week
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={goToToday}>
                                        Vandaag
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Date display and search */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                                    <Input
                                        placeholder="Zoek op naam, dienst of tijd..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <span className="text-sm text-stone-500 font-medium">
                                    {viewMode === 'day'
                                        ? currentDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                        : `Week van ${new Date(currentDate.getTime() - currentDate.getDay() * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - ${new Date(currentDate.getTime() + (6 - currentDate.getDay()) * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Appointments list */}
                        <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
                            {filteredAppointments.length > 0 ? filteredAppointments.map((apt, i) => (
                                <div key={i} className="p-4 md:p-6 hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="font-mono text-stone-500 font-medium">{apt.time}</div>
                                        {viewMode === 'week' && (
                                            <div className="text-xs text-stone-400 font-medium">
                                                {new Date(apt.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-stone-900">{apt.client}</p>
                                            <p className="text-sm text-stone-500">{apt.service}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {apt.price && <span className="font-medium text-stone-900 block">€{apt.price}</span>}
                                        <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'completed' ? 'default' : 'warning'}>
                                            {apt.status === 'confirmed' ? 'Bevestigd' : apt.status === 'completed' ? 'Voltooid' : apt.status === 'cancelled' ? 'Geannuleerd' : 'In afwachting'}
                                        </Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-6 text-center text-stone-500 italic">
                                    {searchQuery ? 'Geen afspraken gevonden voor deze zoekopdracht.' : 'Geen afspraken gevonden.'}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 text-center border-t border-stone-100">
                            <Button
                                variant="ghost"
                                className="text-brand-500"
                                onClick={() => navigate(`${basePath}/schedule`)}
                            >
                                Bekijk volledige agenda
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Quick Actions & Deals */}
                <div className="space-y-8">
                     {/* Deals Widget */}
                     <Card className="p-6 border-brand-100 bg-gradient-to-br from-white to-brand-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-stone-900 flex items-center">
                                <Tag size={18} className="mr-2 text-brand-500" /> Mijn Deals
                            </h3>
                            <button 
                                onClick={() => navigate('/dashboard/salon/deals')}
                                className="text-xs font-bold text-brand-600 bg-white px-2 py-1 rounded shadow-sm hover:bg-brand-50 transition-colors"
                            >
                                + Nieuw
                            </button>
                        </div>
                        <p className="text-xs text-stone-500 mb-4">
                            Vul lege gaten in je agenda op door last-minute kortingen aan te bieden.
                        </p>
                        
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {deals.filter(d => d.status === 'active').length > 0 ? deals.filter(d => d.status === 'active').map(deal => (
                                <div key={deal.id} className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-brand-200 group relative">
                                    <div className="flex justify-between items-start" onClick={() => navigate(`${basePath}/deals`)}>
                                        <span className="font-semibold text-stone-800 text-sm truncate pr-6">{deal.service}</span>
                                        <Badge variant="success">Actief</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs" onClick={() => navigate(`${basePath}/deals`)}>
                                        <span className="text-stone-500 flex items-center"><Clock size={12} className="mr-1" /> {deal.time}</span>
                                        <div>
                                            {deal.original && <span className="line-through text-stone-400 mr-2">€{deal.original}</span>}
                                            <span className="font-bold text-brand-600">€{deal.price}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-stone-400 text-center py-4">Nog geen actieve deals.</p>
                            )}
                        </div>
                        <Button 
                            className="w-full mt-4" 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`${basePath}/deals`)}
                        >
                            Beheer alle deals
                        </Button>
                    </Card>

                    <Card className="p-6 bg-stone-900 text-white border-none shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Salon Tips</h3>
                        <p className="text-stone-300 text-sm mb-6">Voeg foto's van je werk toe om meer klanten aan te trekken.</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => alert("Foto upload dialoog...")}
                                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl text-sm font-medium text-left flex justify-between items-center transition-colors"
                            >
                                Foto's uploaden <span>→</span>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* APPOINTMENT MODAL (Simplified) */}
            <Modal
                isOpen={isAptModalOpen}
                onClose={() => setIsAptModalOpen(false)}
                title="Nieuwe Afspraak"
            >
                <div className="space-y-4">
                     <Input
                        label="Klant Naam"
                        value={aptForm.client}
                        onChange={e => setAptForm({...aptForm, client: e.target.value})}
                    />
                    <Input
                        label="Dienst"
                        value={aptForm.service}
                        onChange={e => setAptForm({...aptForm, service: e.target.value})}
                        placeholder="bv. Knippen"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Datum"
                            type="date"
                            value={aptForm.date || new Date().toISOString().split('T')[0]}
                            onChange={e => setAptForm({...aptForm, date: e.target.value})}
                        />
                        <Input
                            label="Tijd"
                            type="time"
                            value={aptForm.time}
                            onChange={e => setAptForm({...aptForm, time: e.target.value})}
                        />
                    </div>
                    <Input
                        label="Prijs (€) (Optioneel)"
                        type="number"
                        value={aptForm.price}
                        onChange={e => setAptForm({...aptForm, price: e.target.value})}
                    />
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="outline" onClick={() => setIsAptModalOpen(false)}>Annuleren</Button>
                        <Button onClick={handleSaveApt}>Toevoegen</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};