import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, User, MoreVertical, Trash2, Filter, Coffee, AlertCircle, Search } from 'lucide-react';
import { Button, Card, Modal, Input, Select } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Types for local use
interface ScheduleAppointment {
    id: string;
    type: 'appointment' | 'block';
    client: string;
    service: string;
    serviceId?: string;
    date: string; // YYYY-MM-DD
    time: string;
    duration: number;
    staff: string;
    color: string;
}

interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
}

export const SalonSchedule: React.FC = () => {
    const { user } = useAuth();
    const [salonId, setSalonId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApt, setEditingApt] = useState<ScheduleAppointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);

    // View mode state
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAppointments, setFilteredAppointments] = useState<ScheduleAppointment[]>([]);

    // Filter State
    const [staffFilter, setStaffFilter] = useState<string>('all');

    // Helper to format date as YYYY-MM-DD
    const toDateString = (date: Date) => date.toISOString().split('T')[0];

    // State for appointments
    const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);

    // Fetch salon, services and appointments on mount
    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Get salon owned by this user
                const { data: salon } = await supabase
                    .from('salons')
                    .select('id')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (!salon) {
                    setLoading(false);
                    return;
                }

                setSalonId(salon.id);

                // Fetch services for this salon
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('id, name, duration_minutes, price')
                    .eq('salon_id', salon.id)
                    .eq('active', true)
                    .order('name');

                setServices(servicesData?.map(s => ({
                    id: s.id,
                    name: s.name,
                    duration: s.duration_minutes || 30,
                    price: s.price || 0
                })) || []);

                // Fetch appointments for this salon
                const { data: appointmentsData, error } = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        profiles:user_id (full_name),
                        services:service_id (name, duration_minutes)
                    `)
                    .eq('salon_id', salon.id)
                    .order('date', { ascending: true })
                    .order('time', { ascending: true });

                if (error) {
                    console.error('Error fetching appointments:', error);
                }

                setAppointments(appointmentsData?.map(a => ({
                    id: a.id,
                    type: 'appointment' as const,
                    client: a.profiles?.full_name || 'Onbekend',
                    service: a.services?.name || a.service_name || 'Dienst',
                    serviceId: a.service_id,
                    date: a.date,
                    time: a.time,
                    duration: a.duration_minutes || a.services?.duration_minutes || 30,
                    staff: a.staff_name || 'Medewerker',
                    color: 'bg-brand-50 border-brand-300 text-brand-800'
                })) || []);

                setFilteredAppointments(appointments);

            } catch (err) {
                console.error('Error fetching appointments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Filter appointments based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredAppointments(appointments);
        } else {
            const filtered = appointments.filter(apt =>
                apt.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.staff.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.time.includes(searchQuery)
            );
            setFilteredAppointments(filtered);
        }
    }, [appointments, searchQuery]);

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

    const getFilteredAppointments = () => {
        let filtered = filteredAppointments.filter(a => {
            const matchesStaff = staffFilter === 'all' || a.staff === staffFilter;
            if (!matchesStaff) return false;

            const aptDate = new Date(a.date);

            if (viewMode === 'day') {
                return a.date === toDateString(currentDate);
            } else if (viewMode === 'week') {
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return aptDate >= weekStart && aptDate <= weekEnd;
            } else if (viewMode === 'month') {
                return aptDate.getMonth() === currentDate.getMonth() && aptDate.getFullYear() === currentDate.getFullYear();
            }
            return false;
        });
        return filtered;
    };

    const displayAppointments = getFilteredAppointments();
    const uniqueStaff = Array.from(new Set([...displayAppointments.map(a => a.staff), 'Sarah', 'Mike']));

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Agenda</h1>
                    <p className="text-stone-500">Beheer je planning en afspraken</p>
                </div>

                {/* View Mode Toggle and Search */}
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-stone-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'day' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                            }`}
                        >
                            Dag
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'week' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                            }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'month' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                            }`}
                        >
                            Maand
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Zoek afspraken..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Date Navigation and Staff Filter */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto mb-6">
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
                        <button onClick={() => changeDate(viewMode === 'day' ? -1 : viewMode === 'week' ? -7 : -30)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center px-4 font-semibold text-stone-800 text-sm md:text-base whitespace-nowrap">
                            <CalendarIcon size={18} className="mr-2 text-stone-400 hidden sm:inline" />
                            {viewMode === 'day' && currentDate.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
                            {viewMode === 'week' && `Week ${Math.ceil((currentDate.getDate() - currentDate.getDay() + 1) / 7)} - ${currentDate.getFullYear()}`}
                            {viewMode === 'month' && currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={() => changeDate(viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} disabled={isToday(currentDate)} className="h-full">
                        Vandaag
                    </Button>
                </div>

                <Button onClick={() => { setEditingApt(null); setIsModalOpen(true); }} className="w-full sm:w-auto">
                    <Plus size={18} className="md:mr-2" /> <span className="inline">Afspraak</span>
                </Button>
            </div>

            <Card className="flex-1 overflow-hidden border-stone-200 shadow-sm relative bg-white rounded-2xl">
                <div className="h-full p-6 text-center text-stone-500">
                    <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Agenda</h3>
                    <p>De agenda functionaliteit wordt uitgebreid met dag-, week- en maandweergaven.</p>
                </div>
            </Card>
        </div>
    );
};