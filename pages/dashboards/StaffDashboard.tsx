import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CheckCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../components/UIComponents';

export const StaffDashboard: React.FC = () => {
    // Current Staff User
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
        }
    }, []);

    // Helper to format date as YYYY-MM-DD
    const toDateString = (date: Date) => date.toISOString().split('T')[0];

    // Appointments state
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        // Load shared appointments
        const savedApts = localStorage.getItem('salon_appointments');
        if (savedApts) {
            setAppointments(JSON.parse(savedApts));
        } else {
            // SEED DATA FOR DEMO IF EMPTY (So Mike sees something)
            const todayStr = toDateString(new Date());
            const demoAppointments = [
                { id: 1, client: 'Lisa M.', service: 'Knippen & Drogen', date: todayStr, time: '09:00', duration: 60, staff: 'Sarah', color: 'bg-rose-100 border-rose-200 text-rose-700' },
                { id: 3, client: 'Eva K.', service: 'Wimperlift', date: todayStr, time: '13:00', duration: 90, staff: 'Mike', color: 'bg-purple-100 border-purple-200 text-purple-700' },
                { id: 4, client: 'Anouk B.', service: 'Kleurbehandeling', date: todayStr, time: '15:30', duration: 120, staff: 'Mike', color: 'bg-amber-100 border-amber-200 text-amber-700' },
            ];
            setAppointments(demoAppointments);
            localStorage.setItem('salon_appointments', JSON.stringify(demoAppointments));
        }
    }, []);

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
    const firstName = currentUser?.name?.split(' ')[0] || 'Mike'; // Default to Mike if loading
    
    const dailyAppointments = appointments.filter(a => {
        const matchesDate = a.date === toDateString(currentDate);
        // Simple string matching for demo purpose.
        const matchesStaff = a.staff === firstName; 
        return matchesDate && matchesStaff;
    });

    // Time slots for grid
    const timeSlots = [];
    for (let i = 8; i < 18; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }

    const getPosition = (time: string, duration: number) => {
        const [hours, minutes] = time.split(':').map(Number);
        const startMinutes = (hours - 8) * 60 + minutes; 
        const top = startMinutes * 2; 
        const height = duration * 2;
        return { top: `${top}px`, height: `${height}px` };
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Mijn Agenda</h1>
                    <p className="text-stone-500">Welkom, {currentUser?.name || 'Medewerker'}</p>
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
                        <div key={i} className="h-[60px] flex items-start justify-center pt-2 relative">
                           <span className={time.endsWith('00') ? 'font-bold text-stone-600' : ''}>{time}</span>
                        </div>
                    ))}
                </div>

                {/* Day View */}
                <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                     {/* Grid Lines */}
                     {timeSlots.map((time, i) => (
                        <div key={i} className={`h-[60px] w-full border-b ${time.endsWith('30') ? 'border-stone-100 border-dashed' : 'border-stone-200'}`} />
                    ))}

                    {/* Appointments */}
                    <div className="absolute inset-0 w-full">
                        {dailyAppointments.map(apt => {
                            const style = getPosition(apt.time, apt.duration);
                            return (
                                <div 
                                    key={apt.id}
                                    className={`absolute left-2 right-2 md:left-4 md:right-4 md:w-[95%] rounded-lg border-l-4 p-3 shadow-sm hover:shadow-md transition-all ${apt.color} cursor-default`}
                                    style={style}
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
        </div>
    );
};