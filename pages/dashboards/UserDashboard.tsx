import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Download, Edit2, Trash2, RotateCcw, Bell } from 'lucide-react';
import { Card, Badge, Button, Modal, Input } from '../../components/UIComponents';
import { MOCK_APPOINTMENTS } from '../../services/mockData';

export const UserDashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // Initialize appointments from localStorage if available, else mock
    const [appointments, setAppointments] = useState(() => {
        const saved = localStorage.getItem('userAppointments');
        return saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
    });

    // Notification State
    const [notification, setNotification] = useState<string | null>(null);

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem('userAppointments', JSON.stringify(appointments));
        
        // Check for notifications (Simulation: If there's a confirmed appointment tomorrow or today)
        // In real app this comes from backend push
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const hasUpcoming = appointments.find((a: any) => a.date === tomorrowStr && a.status === 'confirmed');
        if (hasUpcoming) {
            setNotification(`Herinnering: Je hebt morgen om ${hasUpcoming.time} een afspraak bij ${hasUpcoming.salonName}!`);
        }
    }, [appointments]);
    
    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingApt, setEditingApt] = useState<any>(null);
    const [editForm, setEditForm] = useState({ date: '', time: '' });

    // --- Actions ---

    const handleDownloadICS = (apt: any) => {
        // Create ICS content
        const startDate = apt.date.replace(/-/g, '') + 'T' + apt.time.replace(':', '') + '00';
        // Simple end time assumption (+1 hour) for demo
        const endDate = apt.date.replace(/-/g, '') + 'T' + (parseInt(apt.time.split(':')[0]) + 1).toString().padStart(2, '0') + apt.time.split(':')[1] + '00';
        
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            `SUMMARY:Afspraak: ${apt.serviceName} bij ${apt.salonName}`,
            `DESCRIPTION:Beauty afspraak via Mijn Beauty Afspraken.`,
            `LOCATION:Amsterdam (Demo)`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `afspraak-${apt.date}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCancel = (id: string) => {
        if (window.confirm('Weet je zeker dat je deze afspraak wilt annuleren? Dit kan niet ongedaan gemaakt worden.')) {
            // Remove the appointment from the list
            setAppointments((prev: any[]) => prev.filter((a: any) => a.id !== id));
            setNotification(null); // Clear notification if cancelled
        }
    };

    const handleRebook = (salonId: string) => {
        navigate(`/salon/${salonId}`);
    };

    const openEditModal = (apt: any) => {
        setEditingApt(apt);
        setEditForm({ date: apt.date, time: apt.time });
        setIsEditModalOpen(true);
    };

    const saveEdit = () => {
        if (editingApt) {
            setAppointments((prev: any[]) => prev.map((a: any) => a.id === editingApt.id ? {
                ...a,
                date: editForm.date,
                time: editForm.time
            } : a));
            setIsEditModalOpen(false);
            setEditingApt(null);
        }
    };

    // Filter derived lists from state
    const upcoming = appointments.filter((a: any) => a.status === 'confirmed');
    const history = appointments.filter((a: any) => a.status === 'completed');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Mijn Afspraken</h1>
                <p className="text-stone-500">Beheer je komende en afgelopen beauty-afspraken.</p>
            </div>

            {/* Notification Banner */}
            {notification && (
                <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
                    <div className="p-2 bg-white rounded-full text-brand-500 shadow-sm">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-stone-900 text-sm">Vergeet je afspraak niet!</h4>
                        <p className="text-stone-600 text-sm">{notification}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-auto text-stone-400 hover:text-stone-600 text-xs">Sluiten</button>
                </div>
            )}

            {/* Upcoming Section */}
            <section>
                <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
                    <Calendar className="mr-2 text-brand-500" size={20} /> Binnenkort
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcoming.length > 0 ? upcoming.map((apt: any) => (
                        <Card key={apt.id} className="p-5 border-l-4 border-l-brand-400 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-stone-900">{apt.serviceName}</h3>
                                        <p className="text-sm text-brand-600 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/salon/${apt.salonId}`)}>
                                            {apt.salonName}
                                        </p>
                                    </div>
                                    <Badge variant="success">Bevestigd</Badge>
                                </div>
                                <div className="space-y-2 text-sm text-stone-600 mb-6">
                                    <div className="flex items-center">
                                        <Calendar size={16} className="mr-2 text-stone-400" />
                                        {apt.date}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock size={16} className="mr-2 text-stone-400" />
                                        {apt.time}
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin size={16} className="mr-2 text-stone-400" />
                                        Amsterdam (Demo)
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-stone-100">
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(apt)}>
                                        <Edit2 size={14} className="mr-2"/> Wijzigen
                                    </Button>
                                    <Button size="sm" variant="outline" title="Download voor agenda" onClick={() => handleDownloadICS(apt)}>
                                        <Download size={16} />
                                    </Button>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                                    onClick={() => handleCancel(apt.id)}
                                >
                                    <Trash2 size={12} className="mr-1"/> Afspraak annuleren
                                </Button>
                            </div>
                        </Card>
                    )) : (
                        <Card className="p-8 text-center md:col-span-2 bg-stone-50 border-dashed">
                            <p className="text-stone-500">Je hebt geen aankomende afspraken.</p>
                            <Button size="sm" className="mt-4" onClick={() => navigate('/search')}>Zoek een salon</Button>
                        </Card>
                    )}
                </div>
            </section>

            {/* History Section */}
            <section>
                 <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
                    <Clock className="mr-2 text-stone-400" size={20} /> Geschiedenis
                </h2>
                <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 border-b border-stone-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-stone-600">Datum</th>
                                    <th className="px-6 py-4 font-medium text-stone-600">Salon</th>
                                    <th className="px-6 py-4 font-medium text-stone-600">Behandeling</th>
                                    <th className="px-6 py-4 font-medium text-stone-600">Prijs</th>
                                    <th className="px-6 py-4 font-medium text-stone-600 text-right">Actie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {history.map((apt: any) => (
                                    <tr key={apt.id} className="hover:bg-stone-50/50">
                                        <td className="px-6 py-4 text-stone-500">{apt.date}</td>
                                        <td className="px-6 py-4 font-medium text-stone-900">{apt.salonName}</td>
                                        <td className="px-6 py-4 text-stone-600">{apt.serviceName}</td>
                                        <td className="px-6 py-4 text-stone-600">€{apt.price}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleRebook(apt.salonId)}
                                                className="inline-flex items-center text-brand-500 hover:text-brand-600 font-medium text-xs bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <RotateCcw size={12} className="mr-1" /> Opnieuw boeken
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Edit Modal */}
            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)}
                title="Afspraak Verplaatsen"
            >
                <div className="space-y-4">
                    <p className="text-sm text-stone-500">
                        Kies een nieuwe datum en tijd voor je afspraak bij <span className="font-semibold text-stone-900">{editingApt?.salonName}</span>.
                    </p>
                    <Input 
                        label="Datum" 
                        type="date" 
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />
                    <Input 
                        label="Tijd" 
                        type="time" 
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuleren</Button>
                        <Button onClick={saveEdit}>Bevestigen</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};