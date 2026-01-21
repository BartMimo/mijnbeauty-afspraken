import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CheckCircle } from 'lucide-react';
import { Button, Card, Badge, Modal } from '../../components/UIComponents';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const StaffDashboard: React.FC = () => {
    // Get current user from AuthContext
    const { user, profile } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    // Helper to format date as YYYY-MM-DD
    const toDateString = (date: Date) => date.toISOString().split('T')[0];

    // Appointments state
    const [appointments, setAppointments] = useState<any[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [appointmentDetails, setAppointmentDetails] = useState<any>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // For staff, we'd ideally have a staff_id field on appointments
                // For now, fetch all appointments from salons where user works
                // This is simplified - a real app would have proper staff assignment
                
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        profiles:user_id (full_name),
                        services:service_id (name)
                    `)
                    .order('date', { ascending: true })
                    .order('time', { ascending: true });

                if (error) throw error;
                
                setAppointments(data?.map(a => ({
                    id: a.id,
                    client: a.profiles?.full_name || 'Klant',
                    service: a.services?.name || 'Dienst',
                    date: a.date,
                    time: a.time,
                    duration: 60,
                    staff: a.staff_name || profile?.full_name?.split(' ')[0] || 'Staff',
                    color: 'bg-stone-100 border-stone-200 text-stone-700'
                })) || []);

            } catch (err) {
                console.error('Error fetching appointments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [user, profile]);

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

    // Filter appointments: Date matches AND Staff name matches first name
    const firstName = profile?.full_name?.split(' ')[0] || 'Staff'; // Get name from profile
    
    const dailyAppointments = appointments.filter(a => {
        const matchesDate = a.date === toDateString(currentDate);
        // Simple string matching for demo purpose.
        const matchesStaff = a.staff === firstName; 
        return matchesDate && matchesStaff;
    });

    const handleViewAppointmentDetails = async (appointment: any) => {
        setSelectedAppointment(appointment);
        
        try {
            // Fetch detailed appointment info
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    profiles:user_id (full_name, email),
                    services:service_id (name, category),
                    salons:salon_id (name, address, city, phone, email)
                `)
                .eq('id', appointment.id)
                .single();

            if (error) throw error;
            setAppointmentDetails(data);
        } catch (err) {
            console.error('Error fetching appointment details:', err);
        }
    };

    // Time slots for grid (SLOT_STEP minutes)
    const SLOT_STEP = 5;
    const timeSlots: string[] = [];
    for (let i = 8; i < 18; i++) {
        for (let minute = 0; minute < 60; minute += SLOT_STEP) {
            timeSlots.push(`${i.toString().padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
    }

    const getPosition = (time: string, duration: number) => {
        const [hours, minutes] = time.split(':').map(Number);
        const startMinutes = (hours - 8) * 60 + minutes; 
        const top = startMinutes * 2; 
        const height = duration * 2;
        return { top: `${top}px`, height: `${height}px` };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Mijn Agenda</h1>
                    <p className="text-stone-500">Welkom, {profile?.full_name || 'Medewerker'}</p>
                </div>

                <div className="flex items-center gap-3">
                     <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} disabled={isToday(currentDate)}>
                        Vandaag
                     </Button>
                    <div className="flex items-center bg-white rounded-xl shadow-sm border border-stone-200 p-1">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center px-4 font-semibold text-stone-800 min-w-[140px] justify-center">
                            <CalendarIcon size={18} className="mr-2 text-stone-400 hidden sm:inline" />
                            {currentDate.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
                        </div>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="flex-1 flex overflow-hidden border-stone-200 shadow-sm relative bg-white rounded-2xl">
                {/* Time Axis */}
                <div className="w-16 flex-shrink-0 border-r border-stone-100 bg-stone-50 overflow-y-hidden text-xs text-stone-400 font-medium select-none">
                    {timeSlots.map((time, i) => (
                        <div key={i} className="h-[10px] flex items-start justify-center pt-2 relative">
                           <span className={time.endsWith('00') ? 'font-bold text-stone-600' : ''}>{time.endsWith('00') ? time : ''}</span>
                        </div>
                    ))}
                </div>

                {/* Day View */}
                <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                     {/* Grid Lines */}
                     {timeSlots.map((time, i) => (
                        <div key={i} className={`h-[10px] w-full border-b ${time.endsWith('30') ? 'border-stone-100 border-dashed' : 'border-stone-200'}`} />
                    ))}

                    {/* Appointments */}
                    <div className="absolute inset-0 w-full">
                        {dailyAppointments.map(apt => {
                            const style = getPosition(apt.time, apt.duration);
                            return (
                                <div 
                                    key={apt.id}
                                    className={`absolute left-2 right-2 md:left-4 md:right-4 md:w-[95%] rounded-lg border-l-4 p-3 shadow-sm hover:shadow-md transition-all ${apt.color} cursor-pointer`}
                                    style={style}
                                    onClick={() => handleViewAppointmentDetails(apt)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-sm text-stone-800">{apt.client}</div>
                                            <div className="text-xs font-medium opacity-80">{apt.service}</div>
                                        </div>
                                        <Badge variant="success">Confirmed</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-75 mt-1 text-xs">
                                        <span className="flex items-center"><Clock size={12} className="mr-1"/> {apt.time} - {apt.duration} min</span>
                                    </div>
                                </div>
                            )
                        })}
                        {dailyAppointments.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-stone-400 pointer-events-none">
                                <div className="text-center">
                                    <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Geen afspraken voor vandaag</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Appointment Details Modal */}
            <Modal 
                isOpen={!!appointmentDetails} 
                onClose={() => {
                    setAppointmentDetails(null);
                    setSelectedAppointment(null);
                }}
                title="Afspraak Details"
            >
                {appointmentDetails && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center pb-4 border-b border-stone-100">
                            <h3 className="text-xl font-bold text-stone-900">{appointmentDetails.services?.name || appointmentDetails.service_name}</h3>
                            <p className="text-stone-600">{appointmentDetails.services?.category || 'Dienst'}</p>
                        </div>

                        {/* Client Info */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                                <User className="mr-2" size={16} />
                                Klant Informatie
                            </h4>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-blue-800">{appointmentDetails.profiles?.full_name || appointmentDetails.customer_name || 'Onbekend'}</p>
                                {appointmentDetails.profiles?.email && <p className="text-blue-600">✉️ {appointmentDetails.profiles.email}</p>}
                            </div>
                        </div>

                        {/* Salon Info */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                                <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                                Salon Informatie
                            </h4>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-purple-800">{appointmentDetails.salons?.name}</p>
                                <p className="text-purple-600">{appointmentDetails.salons?.address}, {appointmentDetails.salons?.city}</p>
                                {appointmentDetails.salons?.phone && <p className="text-purple-600">📞 {appointmentDetails.salons.phone}</p>}
                                {appointmentDetails.salons?.email && <p className="text-purple-600">✉️ {appointmentDetails.salons.email}</p>}
                            </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="grid gap-4">
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                <CalendarIcon className="text-stone-400" size={20} />
                                <div>
                                    <p className="font-medium text-stone-900">{appointmentDetails.date}</p>
                                    <p className="text-sm text-stone-500">Datum</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                <Clock className="text-stone-400" size={20} />
                                <div>
                                    <p className="font-medium text-stone-900">{appointmentDetails.time}</p>
                                    <p className="text-sm text-stone-500">Tijd ({appointmentDetails.duration_minutes} minuten)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                <div className="w-5 h-5 bg-stone-300 rounded-full flex items-center justify-center text-xs font-medium text-stone-600">💰</div>
                                <div>
                                    <p className="font-medium text-stone-900">€{appointmentDetails.price}</p>
                                    <p className="text-sm text-stone-500">Prijs</p>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="pt-4 border-t border-stone-100">
                            <Badge variant={appointmentDetails.status === 'confirmed' ? 'success' : appointmentDetails.status === 'completed' ? 'default' : 'warning'}>
                                {appointmentDetails.status === 'confirmed' ? 'Bevestigd' : 
                                 appointmentDetails.status === 'completed' ? 'Voltooid' : 
                                 appointmentDetails.status === 'cancelled' ? 'Geannuleerd' : 'In afwachting'}
                            </Badge>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};