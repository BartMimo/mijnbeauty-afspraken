import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, User, MoreVertical, Trash2, Coffee, AlertCircle, Search } from 'lucide-react';
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
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<ScheduleAppointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    // Form state for creating/editing appointments
    const [formClient, setFormClient] = useState('');
    const [formServiceId, setFormServiceId] = useState<string | null>(null);
    const [formDate, setFormDate] = useState(() => toDateString(new Date()));
    const [formTime, setFormTime] = useState('09:00');
    const [formDuration, setFormDuration] = useState<number>(30);
    const [formPrice, setFormPrice] = useState<number>(0);

    // View mode state
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAppointments, setFilteredAppointments] = useState<ScheduleAppointment[]>([]);

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
                        services:service_id (name, duration_minutes),
                        staff:staff_id (name)
                    `)
                    .eq('salon_id', salon.id)
                    .neq('status', 'cancelled')
                    .order('date', { ascending: true })
                    .order('time', { ascending: true });

                if (error) {
                    console.error('Error fetching appointments:', error);
                }

                setAppointments(appointmentsData?.map(a => ({
                    id: a.id,
                    type: 'appointment' as const,
                    client: a.profiles?.full_name || a.customer_name || 'Onbekend',
                    service: a.services?.name || a.service_name || 'Dienst',
                    serviceId: a.service_id,
                    date: a.date,
                    time: a.time,
                    duration: a.duration_minutes || a.services?.duration_minutes || 30,
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

    // Initialize form when modal opens or editing appointment changes
    useEffect(() => {
        if (!isModalOpen) return;
        if (editingApt) {
            setFormClient(editingApt.client);
            setFormServiceId(editingApt.serviceId || null);
            setFormDate(editingApt.date);
            setFormTime(editingApt.time);
            setFormDuration(editingApt.duration || 30);
            setFormPrice(0);
        } else {
            setFormClient('');
            setFormServiceId(services.length > 0 ? services[0].id : null);
            setFormDate(toDateString(currentDate));
            setFormTime('09:00');
            setFormDuration(services.length > 0 ? services[0].duration : 30);
            setFormPrice(services.length > 0 ? services[0].price : 0);
        }
    }, [isModalOpen, editingApt, services, currentDate]);

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

    // Render functions for different views
    const renderDayView = () => {
        const SLOT_STEP = 5; // minutes per grid row
        const dayAppointments = displayAppointments.filter(a => a.date === toDateString(currentDate));
        const timeSlots: string[] = [];
        for (let hour = 9; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += SLOT_STEP) {
                timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        }

        return (
            <div className="h-full flex flex-col">
                <div className="p-4 border-b border-stone-100">
                    <h3 className="text-lg font-semibold text-stone-900">
                        {currentDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <p className="text-stone-500 text-sm">{dayAppointments.length} afspraak{dayAppointments.length !== 1 ? 'en' : ''}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div>
                        {timeSlots.map(timeSlot => {
                            const appointment = dayAppointments.find(a => a.time === timeSlot);
                            return (
                                <div key={timeSlot} className="flex items-center h-[10px] border-l-4 border-stone-200 pl-4">
                                    <span className="text-sm font-medium text-stone-600 w-16">{timeSlot.endsWith('00') ? timeSlot : ''}</span>
                                    {appointment ? (
                                        <div 
                                            className="flex-1 ml-4 p-3 bg-brand-50 border border-brand-200 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors"
                                            onClick={() => {
                                                setSelectedAppointment(appointment);
                                                setIsDetailsModalOpen(true);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-stone-900">{appointment.client}</p>
                                                    <p className="text-sm text-stone-600">{appointment.service}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-brand-100 text-brand-800 px-2 py-1 rounded">
                                                        {appointment.duration}min
                                                    </span>
                                                    <button className="text-stone-400 hover:text-stone-600">
                                                        <MoreVertical size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 ml-4 h-full border-2 border-dashed border-stone-200 rounded-lg opacity-50"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            weekDays.push(day);
        }

        return (
            <div className="h-full flex flex-col">
                <div className="p-4 border-b border-stone-100">
                    <h3 className="text-lg font-semibold text-stone-900">
                        Week van {weekStart.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 gap-1 p-4">
                        {weekDays.map(day => {
                            const dayAppointments = displayAppointments.filter(a => a.date === toDateString(day));
                            const isCurrentDay = isToday(day);

                            return (
                                <div key={day.toISOString()} className={`min-h-[120px] p-2 border rounded-lg ${isCurrentDay ? 'bg-brand-50 border-brand-300' : 'border-stone-200'}`}>
                                    <div className="text-center mb-2">
                                        <p className={`text-sm font-medium ${isCurrentDay ? 'text-brand-900' : 'text-stone-700'}`}>
                                            {day.toLocaleDateString('nl-NL', { weekday: 'short' })}
                                        </p>
                                        <p className={`text-lg font-bold ${isCurrentDay ? 'text-brand-900' : 'text-stone-900'}`}>
                                            {day.getDate()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        {dayAppointments.slice(0, 3).map(appointment => (
                                            <div key={appointment.id} className="text-xs p-1 bg-brand-100 text-brand-800 rounded truncate">
                                                {appointment.time} {appointment.client}
                                            </div>
                                        ))}
                                        {dayAppointments.length > 3 && (
                                            <div className="text-xs text-stone-500 text-center">
                                                +{dayAppointments.length - 3} meer
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Calculate start date (first Monday before or on monthStart)
        const startDate = new Date(monthStart);
        const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday = 1, so subtract 0 for Monday, 6 for Sunday
        startDate.setDate(startDate.getDate() - daysToSubtract);

        // Calculate end date (last Sunday after or on monthEnd)
        const endDate = new Date(monthEnd);
        const endDayOfWeek = endDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek; // Sunday = 0, so add 0 for Sunday, 6 for Monday
        endDate.setDate(endDate.getDate() + daysToAdd);

        const calendarDays = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            calendarDays.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return (
            <div className="h-full flex flex-col">
                <div className="p-4 border-b border-stone-100">
                    <h3 className="text-lg font-semibold text-stone-900">
                        {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-stone-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map(day => {
                            const dayAppointments = displayAppointments.filter(a => a.date === toDateString(day));
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                            const isCurrentDay = isToday(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`min-h-[80px] p-1 border rounded-lg ${
                                        isCurrentMonth
                                            ? isCurrentDay
                                                ? 'bg-brand-50 border-brand-300'
                                                : 'border-stone-200'
                                            : 'border-stone-100 bg-stone-50'
                                    }`}
                                >
                                    <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? (isCurrentDay ? 'text-brand-900' : 'text-stone-900') : 'text-stone-400'}`}>
                                        {day.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {dayAppointments.slice(0, 2).map(appointment => (
                                            <div key={appointment.id} className="text-xs p-1 bg-brand-100 text-brand-800 rounded truncate">
                                                {appointment.time}
                                            </div>
                                        ))}
                                        {dayAppointments.length > 2 && (
                                            <div className="text-xs text-stone-500">
                                                +{dayAppointments.length - 2}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

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

            {/* Date Navigation */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto mb-6">

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
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
            </Card>

            {/* Create / Edit Appointment Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingApt ? 'Afspraak Bewerken' : 'Nieuwe Afspraak'}>
                <div className="space-y-4">
                    <Input label="Klantnaam" value={formClient} onChange={e => setFormClient(e.target.value)} placeholder="Naam klant" />

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Dienst</label>
                        <select className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-400" value={formServiceId ?? ''} onChange={e => {
                            const id = e.target.value || null;
                            setFormServiceId(id);
                            const s = services.find(x => x.id === id);
                            if (s) { setFormDuration(s.duration); setFormPrice(s.price); }
                        }}>
                            <option value="">Selecteer dienst...</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name} — {s.duration}min</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Datum</label>
                            <input type="date" className="w-full h-11 px-4 rounded-xl border border-stone-200" value={formDate} onChange={e => setFormDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Tijd</label>
                            <input type="time" className="w-full h-11 px-4 rounded-xl border border-stone-200" value={formTime} onChange={e => setFormTime(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Duur (min)" type="number" value={formDuration} onChange={e => setFormDuration(Number(e.target.value))} />
                        <Input label="Prijs (€)" type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuleren</Button>
                        <Button onClick={async () => {
                            // Basic validation
                            if (!formClient || !formDate || !formTime) { alert('Vul klant, datum en tijd in'); return; }
                            if (!salonId) { alert('Geen salon gevonden'); return; }

                            try {
                                const insertData: any = {
                                    salon_id: salonId,
                                    service_id: formServiceId,
                                    service_name: services.find(s => s.id === formServiceId)?.name || null,
                                    date: formDate,
                                    time: formTime,
                                    duration_minutes: formDuration,
                                    price: formPrice || 0,
                                    customer_name: formClient,
                                    status: 'confirmed'
                                };

                                const { insertAppointmentSafe } = await import('../../lib/appointments');
                                const { error, data } = await insertAppointmentSafe(insertData) as any;
                                if (error) { console.error('Insert appointment error:', error); alert('Kon afspraak niet aanmaken'); return; }

                                // Update local appointments list (inserted row may be returned in data)
                                const created = Array.isArray(data) && data[0] ? data[0] : (data || null);
                                const newApt: ScheduleAppointment = {
                                    id: created?.id || (Math.random() + ''),
                                    type: 'appointment',
                                    client: insertData.customer_name,
                                    service: insertData.service_name || 'Dienst',
                                    serviceId: formServiceId || undefined,
                                    date: insertData.date,
                                    time: insertData.time,
                                    duration: insertData.duration_minutes || 30,
                                    color: 'bg-brand-50 border-brand-300 text-brand-800'
                                };

                                setAppointments(prev => [newApt, ...prev]);
                                setFilteredAppointments(prev => [newApt, ...prev]);
                                setIsModalOpen(false);
                                setEditingApt(null);
                            } catch (err) {
                                console.error('Error saving appointment:', err);
                                alert('Er ging iets mis bij opslaan');
                            }
                        }}>Opslaan</Button>
                    </div>
                </div>
            </Modal>

            {/* Appointment Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Afspraak Details">
                {selectedAppointment && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700">Klant</label>
                                <p className="text-stone-900">{selectedAppointment.client}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700">Dienst</label>
                                <p className="text-stone-900">{selectedAppointment.service}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700">Duur</label>
                                <p className="text-stone-900">{selectedAppointment.duration} minuten</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700">Datum</label>
                                <p className="text-stone-900">{new Date(selectedAppointment.date).toLocaleDateString('nl-NL')}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700">Tijd</label>
                                <p className="text-stone-900">{selectedAppointment.time}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};