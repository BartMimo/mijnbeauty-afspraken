import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, CreditCard, Calendar, ArrowUpRight, Tag, Plus, Clock, Trash2, Edit2 } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select } from '../../components/UIComponents';

export const SalonDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.startsWith('/salontest') ? '/salontest' : '/dashboard/salon';

    // --- STATE MANAGEMENT ---
    
    // Deals State (Read-only for dashboard widget now)
    const [deals, setDeals] = useState<any[]>(() => {
        const saved = localStorage.getItem('salon_deals');
        return saved ? JSON.parse(saved) : [
             { id: 1, service: 'Biab Nagels (Last-minute)', price: '30', original: '45', time: 'Vandaag, 15:30', status: 'active' },
             { id: 2, service: 'Wimperlift', price: '40', original: '55', time: 'Morgen, 09:00', status: 'active' }
        ];
    });

    // Appointments State (shared with Schedule page via localStorage key 'salon_appointments')
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        // Sync deals on mount in case they changed elsewhere
        const savedDeals = localStorage.getItem('salon_deals');
        if (savedDeals) setDeals(JSON.parse(savedDeals));

        // Load appointments
        const savedApts = localStorage.getItem('salon_appointments');
        if (savedApts) {
            setAppointments(JSON.parse(savedApts).slice(0, 3)); 
        } else {
             setAppointments([
                { id: 101, time: '09:00', client: 'Lisa M.', service: 'Knippen & Drogen', price: '45' },
                { id: 102, time: '10:30', client: 'Sophie de V.', service: 'Biab Nagels', price: '45' },
                { id: 103, time: '13:00', client: 'Eva K.', service: 'Wimperlift', price: '55' },
            ]);
        }
    }, []);

    // --- MODAL STATES ---
    const [isAptModalOpen, setIsAptModalOpen] = useState(false);
    const [aptForm, setAptForm] = useState({ client: '', service: '', time: '09:00', price: '' });

    // --- ACTIONS: APPOINTMENTS ---
    
    const handleSaveApt = () => {
        // Simple add to local state for dashboard view, 
        // ideally this writes to the main 'salon_appointments' key used by Schedule page.
        const newApt = { id: Date.now(), ...aptForm };
        
        // Update local view
        setAppointments(prev => [newApt, ...prev]);
        
        // Update persistent storage for Schedule page to pick up (simplified sync)
        const currentStored = JSON.parse(localStorage.getItem('salon_appointments') || '[]');
        localStorage.setItem('salon_appointments', JSON.stringify([...currentStored, {
            id: newApt.id,
            client: newApt.client,
            service: newApt.service,
            date: new Date().toISOString().split('T')[0], // Set to today
            time: newApt.time,
            duration: 60,
            staff: 'Sarah', // Default
            color: 'bg-stone-100 border-stone-200 text-stone-700'
        }]));

        setIsAptModalOpen(false);
        setAptForm({ client: '', service: '', time: '09:00', price: '' });
    };


    // Mock data for dashboard stats
    const stats = [
        { label: 'Totaal Boekingen', value: '124', trend: '+12%', icon: Calendar },
        { label: 'Omzet deze maand', value: '€4.250', trend: '+8%', icon: CreditCard },
        { label: 'Nieuwe Klanten', value: '28', trend: '+5%', icon: Users },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Salon Dashboard</h1>
                    <p className="text-stone-500">Welkom terug, Glow & Shine Studio</p>
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
                {stats.map((stat, idx) => (
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
                {/* Schedule Today */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="h-auto">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                            <h3 className="font-bold text-stone-900">Agenda Vandaag</h3>
                            <span className="text-sm text-stone-500">{new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="divide-y divide-stone-100">
                            {appointments.length > 0 ? appointments.map((apt, i) => (
                                <div key={i} className="p-4 md:p-6 hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="font-mono text-stone-500 font-medium">{apt.time}</div>
                                        <div>
                                            <p className="font-bold text-stone-900">{apt.client}</p>
                                            <p className="text-sm text-stone-500">{apt.service}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {apt.price && <span className="font-medium text-stone-900 block">€{apt.price}</span>}
                                        <Badge variant="default">Bevestigd</Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-6 text-center text-stone-500 italic">Geen afspraken vandaag.</div>
                            )}
                            <div className="p-4 text-center">
                                <Button 
                                    variant="ghost" 
                                    className="text-brand-500"
                                    onClick={() => navigate(`${basePath}/schedule`)}
                                >
                                    Bekijk volledige agenda
                                </Button>
                            </div>
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
                            label="Tijd" 
                            type="time"
                            value={aptForm.time}
                            onChange={e => setAptForm({...aptForm, time: e.target.value})}
                        />
                         <Input 
                            label="Prijs (€) (Optioneel)" 
                            type="number"
                            value={aptForm.price}
                            onChange={e => setAptForm({...aptForm, price: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="outline" onClick={() => setIsAptModalOpen(false)}>Annuleren</Button>
                        <Button onClick={handleSaveApt}>Toevoegen</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};