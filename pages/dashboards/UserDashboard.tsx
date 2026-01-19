import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Download, Edit2, Trash2, RotateCcw, Bell, Loader2 } from 'lucide-react';
import { Card, Badge, Button, Modal, Input } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const UserDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<string | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [appointmentDetails, setAppointmentDetails] = useState<any>(null);

    // Fetch appointments from Supabase
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        service:services(name),
                        salon:salons(id, name, slug)
                    `)
                    .eq('user_id', user.id)
                    .order('date', { ascending: true });

                if (error) throw error;

                // Transform data to match component structure
                const transformed = (data || []).map((apt: any) => ({
                    id: apt.id,
                    date: apt.date,
                    time: apt.time,
                    status: apt.status,
                    price: apt.price,
                    serviceName: apt.service?.name || 'Service',
                    salonName: apt.salon?.name || 'Salon',
                    salonId: apt.salon?.slug || apt.salon?.id
                }));

                setAppointments(transformed);

                // Check for upcoming notifications
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                
                const hasUpcoming = transformed.find((a: any) => a.date === tomorrowStr && a.status === 'confirmed');
                if (hasUpcoming) {
                    setNotification(`Herinnering: Je hebt morgen om ${hasUpcoming.time} een afspraak bij ${hasUpcoming.salonName}!`);
                }
            } catch (err) {
                console.error('Error fetching appointments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [user]);
    
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

    const handleViewAppointmentDetails = async (appointment: any) => {
        setSelectedAppointment(appointment);
        
        try {
            // Fetch detailed appointment info including staff and salon details
            // First fetch appointment and only request staff id to avoid 400s on older DBs
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    service:services(name, category),
                    salon:salons(name, address, city, phone, email),
                    staff:staff_id(id, user_id)
                `)
                .eq('id', appointment.id)
                .single();

            if (error) throw error;

            // Try to enrich staff details (name/email/phone) from public.staff if available,
            // otherwise fall back to profiles (auth.profiles)
            let enrichedStaff = null;
            try {
                if (data?.staff?.id) {
                    const { data: s, error: sErr } = await supabase
                        .from('staff')
                        .select('id, name, email, phone, role, user_id')
                        .eq('id', data.staff.id)
                        .maybeSingle();

                    if (!sErr && s) enrichedStaff = s;
                    else if (data.staff.user_id) {
                        const { data: p, error: pErr } = await supabase
                            .from('profiles')
                            .select('id, full_name as name, email')
                            .eq('id', data.staff.user_id)
                            .maybeSingle();
                        if (!pErr && p) enrichedStaff = p;
                    }
                }
            } catch (err) {
                console.warn('Could not enrich staff details (older DB):', err);
            }

            setAppointmentDetails({ ...data, staff: enrichedStaff || data.staff });
        } catch (err) {
            console.error('Error fetching appointment details:', err);
        }
    };

    const handleCancel = async (id: string) => {
        if (!user) {
            alert('Je moet ingelogd zijn om een afspraak te annuleren.');
            return;
        }

        if (window.confirm('Weet je zeker dat je deze afspraak wilt annuleren? Dit kan niet ongedaan gemaakt worden.')) {
            try {
                // Ensure we only update the appointment that belongs to the current user
                const { data, error } = await supabase
                    .from('appointments')
                    .update({ status: 'cancelled' })
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .select('id');

                if (error) {
                    // Try to fetch the appointment for diagnostics
                    try {
                        const { data: appt, error: apptErr } = await supabase
                            .from('appointments')
                            .select('id, user_id, salon_id, status')
                            .eq('id', id)
                            .single();

                        console.error('Cancel error, appointment fetched for diagnostics:', appt, apptErr);
                    } catch (fetchErr) {
                        console.error('Error fetching appointment for diagnostics:', fetchErr);
                    }

                    throw error;
                }

                // If no rows were returned, the update didn't apply (not found / no permission)
                if (!data || data.length === 0) {
                    console.error('Cancel returned no rows for id:', id);

                    // Fetch appointment details to provide actionable feedback
                    try {
                        const { data: appt, error: apptErr } = await supabase
                            .from('appointments')
                            .select('id, user_id, salon_id, status')
                            .eq('id', id)
                            .single();

                        if (apptErr) {
                            console.error('Could not fetch appointment after empty update:', apptErr);
                            alert('Kon afspraak niet annuleren: afspraak niet gevonden of geen toestemming.');
                        } else if (!appt) {
                            alert('Kon afspraak niet annuleren: afspraak niet gevonden.');
                        } else {
                            alert(`Kon afspraak niet annuleren: afspraak gevonden met status=${appt.status}, eigenaar=${appt.user_id}.`);
                        }
                    } catch (fetchErr) {
                        console.error('Error fetching appointment after empty update:', fetchErr);
                        alert('Kon afspraak niet annuleren: afspraak niet gevonden of geen toestemming.');
                    }

                    return;
                }

                // Update local state
                setAppointments((prev: any[]) => prev.filter((a: any) => a.id !== id));
                setNotification(null);
            } catch (err: any) {
                console.error('Error cancelling appointment:', err);
                // If the Supabase error contains details, show them to the user for debugging
                const detail = err?.details || err?.message || JSON.stringify(err);
                alert('Kon afspraak niet annuleren: ' + (detail || 'Probeer opnieuw.'));
            }
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

    const saveEdit = async () => {
        if (editingApt) {
            try {
                const { error } = await supabase
                    .from('appointments')
                    .update({ date: editForm.date, time: editForm.time })
                    .eq('id', editingApt.id);

                if (error) throw error;

                // Update local state
                setAppointments((prev: any[]) => prev.map((a: any) => a.id === editingApt.id ? {
                    ...a,
                    date: editForm.date,
                    time: editForm.time
                } : a));
                setIsEditModalOpen(false);
                setEditingApt(null);
            } catch (err) {
                console.error('Error updating appointment:', err);
                alert('Kon afspraak niet wijzigen. Probeer opnieuw.');
            }
        }
    };

    // Filter derived lists from state
    const upcoming = appointments.filter((a: any) => a.status === 'confirmed');
    const history = appointments.filter((a: any) => a.status === 'completed');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-500" size={32} />
            </div>
        );
    }

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
                        <Card key={apt.id} className="p-5 border-l-4 border-l-brand-400 flex flex-col justify-between h-full cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewAppointmentDetails(apt)}>
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
                                    <tr key={apt.id} className="hover:bg-stone-50/50 cursor-pointer" onClick={() => handleViewAppointmentDetails(apt)}>
                                        <td className="px-6 py-4 text-stone-500">{apt.date}</td>
                                        <td className="px-6 py-4 font-medium text-stone-900">{apt.salonName}</td>
                                        <td className="px-6 py-4 text-stone-600">{apt.serviceName}</td>
                                        <td className="px-6 py-4 text-stone-600">€{apt.price}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click
                                                    handleRebook(apt.salonId);
                                                }}
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
                            <h3 className="text-xl font-bold text-stone-900">{appointmentDetails.service?.name}</h3>
                            <p className="text-brand-600 font-medium">{appointmentDetails.salon?.name}</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid gap-4">
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                <Calendar className="text-stone-400" size={20} />
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
                                <MapPin className="text-stone-400" size={20} />
                                <div>
                                    <p className="font-medium text-stone-900">{appointmentDetails.salon?.address}, {appointmentDetails.salon?.city}</p>
                                    <p className="text-sm text-stone-500">Locatie</p>
                                </div>
                            </div>

                            {appointmentDetails.staff && (
                                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                    <div className="w-5 h-5 bg-stone-300 rounded-full flex items-center justify-center text-xs font-medium text-stone-600">👤</div>
                                    <div>
                                        <p className="font-medium text-stone-900">{appointmentDetails.staff.name}</p>
                                        <p className="text-sm text-stone-500">Behandelaar</p>
                                    </div>
                                </div>
                            )}

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

                        {/* Contact Info */}
                        {appointmentDetails.salon && (
                            <div className="pt-4 border-t border-stone-100">
                                <h4 className="font-semibold text-stone-900 mb-2">Contactgegevens Salon</h4>
                                <div className="space-y-1 text-sm text-stone-600">
                                    {appointmentDetails.salon.phone && <p>📞 {appointmentDetails.salon.phone}</p>}
                                    {appointmentDetails.salon.email && <p>✉️ {appointmentDetails.salon.email}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};