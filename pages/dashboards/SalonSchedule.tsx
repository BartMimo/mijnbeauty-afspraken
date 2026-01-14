import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, User, MoreVertical, Trash2, Filter, Coffee } from 'lucide-react';
import { Button, Card, Modal, Input, Select } from '../../components/UIComponents';

// Types for local use
interface ScheduleAppointment {
    id: number;
    type: 'appointment' | 'block'; // Added type
    client: string; // Used as "Title" for blocks
    service: string;
    date: string; // YYYY-MM-DD
    time: string;
    duration: number;
    staff: string;
    color: string;
}

export const SalonSchedule: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApt, setEditingApt] = useState<ScheduleAppointment | null>(null);
    
    // Filter State
    const [staffFilter, setStaffFilter] = useState<string>('all');

    // Helper to format date as YYYY-MM-DD
    const toDateString = (date: Date) => date.toISOString().split('T')[0];

    // State for appointments
    const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);

    useEffect(() => {
        const savedApts = localStorage.getItem('salon_appointments');
        
        if (savedApts) {
            setAppointments(JSON.parse(savedApts));
        } else {
            const todayStr = toDateString(new Date());
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = toDateString(tomorrow);

            const initialData: ScheduleAppointment[] = [
                { id: 1, type: 'appointment', client: 'Lisa M.', service: 'Knippen & Drogen', date: todayStr, time: '09:00', duration: 60, staff: 'Sarah', color: 'bg-rose-100 border-rose-200 text-rose-700' },
                { id: 2, type: 'appointment', client: 'Sophie de V.', service: 'Biab Nagels', date: todayStr, time: '10:30', duration: 60, staff: 'Sarah', color: 'bg-sky-100 border-sky-200 text-sky-700' },
                { id: 99, type: 'block', client: 'Lunchpauze', service: '', date: todayStr, time: '12:00', duration: 30, staff: 'Sarah', color: 'bg-stone-200 border-stone-300 text-stone-600' },
                { id: 3, type: 'appointment', client: 'Eva K.', service: 'Wimperlift', date: todayStr, time: '13:00', duration: 90, staff: 'Mike', color: 'bg-purple-100 border-purple-200 text-purple-700' },
                { id: 4, type: 'appointment', client: 'Anouk B.', service: 'Kleurbehandeling', date: tomorrowStr, time: '10:00', duration: 120, staff: 'Sarah', color: 'bg-amber-100 border-amber-200 text-amber-700' },
            ];
            setAppointments(initialData);
            localStorage.setItem('salon_appointments', JSON.stringify(initialData));
        }
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        type: 'appointment' as 'appointment' | 'block',
        client: '',
        service: '',
        time: '09:00',
        duration: 60,
        staff: 'Sarah'
    });

    // Reset form when opening modal
    useEffect(() => {
        if (editingApt) {
            setFormData({
                type: editingApt.type,
                client: editingApt.client,
                service: editingApt.service,
                time: editingApt.time,
                duration: editingApt.duration,
                staff: editingApt.staff
            });
        } else {
            setFormData({
                type: 'appointment',
                client: '',
                service: 'Knippen & Drogen',
                time: '09:00',
                duration: 60,
                staff: 'Sarah'
            });
        }
    }, [editingApt, isModalOpen]);

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

    const handleSave = () => {
        let newAppointments;
        const isBlock = formData.type === 'block';
        
        const aptData = {
            client: isBlock ? (formData.client || 'Pauze') : formData.client,
            service: isBlock ? '' : formData.service,
            time: formData.time,
            duration: Number(formData.duration),
            staff: formData.staff,
            type: formData.type,
            color: isBlock ? 'bg-stone-200 border-stone-300 text-stone-600' : 'bg-stone-100 border-stone-200 text-stone-700' // Default fallback color
        };

        if (editingApt) {
            newAppointments = appointments.map(a => a.id === editingApt.id ? { ...a, ...aptData } : a);
        } else {
            const newApt: ScheduleAppointment = {
                id: Math.random(),
                date: toDateString(currentDate),
                ...aptData,
                color: isBlock ? 'bg-stone-200 border-stone-300 text-stone-600' : 'bg-stone-100 border-stone-200 text-stone-700'
            };
            newAppointments = [...appointments, newApt];
        }
        setAppointments(newAppointments);
        localStorage.setItem('salon_appointments', JSON.stringify(newAppointments));
        setIsModalOpen(false);
        setEditingApt(null);
    };

    const handleDelete = () => {
        if (editingApt) {
            const newAppointments = appointments.filter(a => a.id !== editingApt.id);
            setAppointments(newAppointments);
            localStorage.setItem('salon_appointments', JSON.stringify(newAppointments));
            setIsModalOpen(false);
            setEditingApt(null);
        }
    };

    const dailyAppointments = appointments.filter(a => {
        const matchesDate = a.date === toDateString(currentDate);
        const matchesStaff = staffFilter === 'all' || a.staff === staffFilter;
        return matchesDate && matchesStaff;
    });

    const uniqueStaff = Array.from(new Set([...appointments.map(a => a.staff), 'Sarah', 'Mike']));

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

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Agenda</h1>
                    <p className="text-stone-500">Beheer je planning en afspraken</p>
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
                                <CalendarIcon size={18} className="mr-2 text-stone-400 hidden sm:inline" />
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

                    <Button onClick={() => { setEditingApt(null); setIsModalOpen(true); }} className="w-full sm:w-auto">
                        <Plus size={18} className="md:mr-2" /> <span className="inline">Afspraak</span>
                    </Button>
                </div>
            </div>

            <Card className="flex-1 flex overflow-hidden border-stone-200 shadow-sm relative bg-white rounded-2xl">
                <div className="w-16 flex-shrink-0 border-r border-stone-100 bg-stone-50 overflow-y-hidden text-xs text-stone-400 font-medium select-none">
                    {timeSlots.map((time, i) => (
                        <div key={i} className="h-[60px] flex items-start justify-center pt-2 relative">
                           <span className={time.endsWith('00') ? 'font-bold text-stone-600' : ''}>{time}</span>
                        </div>
                    ))}
                </div>

                <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                    {timeSlots.map((time, i) => (
                        <div key={i} className={`h-[60px] w-full border-b ${time.endsWith('30') ? 'border-stone-100 border-dashed' : 'border-stone-200'}`} />
                    ))}

                    {isToday(currentDate) && (
                         <div className="absolute left-0 right-0 border-t-2 border-brand-400 z-10 pointer-events-none opacity-50" style={{ top: '300px' }}></div>
                    )}

                    <div className="absolute inset-0 w-full">
                        {dailyAppointments.map(apt => {
                            const style = getPosition(apt.time, apt.duration);
                            return (
                                <div 
                                    key={apt.id}
                                    className={`absolute left-2 right-2 md:left-4 md:right-4 md:w-[95%] rounded-lg border-l-4 p-2 md:p-3 text-xs cursor-pointer shadow-sm hover:shadow-md transition-all group overflow-hidden ${apt.color} animate-fadeIn`}
                                    style={style}
                                    onClick={() => { setEditingApt(apt); setIsModalOpen(true); }}
                                >
                                    {apt.type === 'block' ? (
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
                            )
                        })}
                    </div>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingApt ? (editingApt.type === 'block' ? 'Blokkade Bewerken' : 'Afspraak Bewerken') : 'Nieuwe Boeking'}
            >
                <div className="space-y-4">
                    {/* Type Selector */}
                    <div className="flex gap-2 p-1 bg-stone-100 rounded-lg mb-4">
                        <button 
                            type="button"
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.type === 'appointment' ? 'bg-white shadow text-brand-600' : 'text-stone-500'}`}
                            onClick={() => setFormData({...formData, type: 'appointment'})}
                        >
                            Klant Afspraak
                        </button>
                         <button 
                            type="button"
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.type === 'block' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}
                            onClick={() => setFormData({...formData, type: 'block', client: 'Pauze'})}
                        >
                            Pauze / Blok
                        </button>
                    </div>

                    {formData.type === 'appointment' ? (
                        <>
                            <Input 
                                label="Klant Naam" 
                                value={formData.client} 
                                onChange={e => setFormData({...formData, client: e.target.value})}
                            />
                            <Select 
                                label="Behandeling"
                                value={formData.service}
                                onChange={e => setFormData({...formData, service: e.target.value})}
                            >
                                <option>Knippen & Drogen</option>
                                <option>Biab Nagels</option>
                                <option>Wimperlift</option>
                                <option>Kleurbehandeling</option>
                                <option>Massage</option>
                            </Select>
                        </>
                    ) : (
                        <Input 
                            label="Reden (Titel)" 
                            value={formData.client} 
                            onChange={e => setFormData({...formData, client: e.target.value})}
                            placeholder="bv. Lunch, Administratie"
                        />
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Tijd" 
                            type="time" 
                            value={formData.time}
                            onChange={e => setFormData({...formData, time: e.target.value})}
                        />
                         <Select 
                            label="Duur"
                            value={formData.duration}
                            onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                        >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                        </Select>
                    </div>

                    <Select 
                        label="Medewerker"
                        value={formData.staff}
                        onChange={e => setFormData({...formData, staff: e.target.value})}
                    >
                        {uniqueStaff.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>

                    <div className="flex justify-between pt-4 gap-3">
                        {editingApt && (
                            <Button type="button" variant="danger" onClick={handleDelete}>
                                <Trash2 size={18} />
                            </Button>
                        )}
                        <div className="flex gap-2 flex-1 justify-end">
                             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Annuleren
                            </Button>
                            <Button type="button" onClick={handleSave}>
                                {editingApt ? 'Opslaan' : 'Toevoegen'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};