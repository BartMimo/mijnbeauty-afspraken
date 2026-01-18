import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Edit2, Trash2, CheckCircle, XCircle, ShieldAlert, Check, CreditCard, AlertCircle } from 'lucide-react';
import { Button, Card, Input, Badge, Modal } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';

// Extended interface for Admin management including Subscription details
interface AdminSalon {
    id: string;
    name: string;
    city: string;
    address: string;
    status: 'active' | 'pending' | 'suspended';
    rating: number;
    kvk?: string;
    subscription: {
        plan: 'Pro' | 'Starter' | 'Gratis';
        status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
        renewsAt?: string;
    };
}

export const AdminSalons: React.FC = () => {
    // State - fetched from Supabase
    const [salons, setSalons] = useState<AdminSalon[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSalon, setEditingSalon] = useState<AdminSalon | null>(null);
    const [editForm, setEditForm] = useState({ name: '', city: '', address: '', kvk: '' });

    useEffect(() => {
        const fetchSalons = async () => {
            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Fetching salons...');
                }
                const { data, error, count } = await supabase
                    .from('salons')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false });

                if (process.env.NODE_ENV === 'development') {
                    console.log('Salons fetch result:', { data, error, count });
                }

                if (error) {
                    console.error('Supabase error details:', error);
                    throw error;
                }

                const mapped: AdminSalon[] = (data || []).map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    city: s.city || '',
                    address: s.address || '',
                    status: (s.status || 'active') as AdminSalon['status'],
                    rating: s.rating || 0,
                    subscription: { plan: 'Gratis', status: 'none' }
                }));

                if (process.env.NODE_ENV === 'development') {
                    console.log('Mapped salons:', mapped);
                }
                setSalons(mapped);
            } catch (err) {
                console.error('Error loading salons:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSalons();
    }, []);

    // --- ACTIONS ---

    const handleApprove = async (id: string) => {
        console.log('Approving salon:', id);
        try {
            const { data, error } = await supabase
                .from('salons')
                .update({ status: 'active' })
                .eq('id', id)
                .select();
            
            console.log('Approve result:', { data, error });
            
            if (error) {
                console.error('Approve failed:', error);
                alert('Goedkeuren mislukt: ' + error.message);
                return;
            }
            
            setSalons(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
            alert('Salon goedgekeurd!');
        } catch (err) {
            console.error('Approve error:', err);
            alert('Er ging iets mis bij het goedkeuren.');
        }
    };

    const handleReject = async (id: string) => {
        if(!window.confirm('Weet je zeker dat je deze aanmelding wilt afwijzen en verwijderen?')) {
            return;
        }
        
        console.log('Rejecting salon:', id);
        try {
            const { error } = await supabase
                .from('salons')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Reject failed:', error);
                alert('Afwijzen mislukt: ' + error.message);
                return;
            }
            
            setSalons(prev => prev.filter(s => s.id !== id));
            alert('Salon afgewezen en verwijderd.');
        } catch (err) {
            console.error('Reject error:', err);
            alert('Er ging iets mis bij het afwijzen.');
        }
    };

    const toggleSuspend = async (id: string) => {
        const salon = salons.find(s => s.id === id);
        if (!salon) return;
        const nextStatus = salon.status === 'suspended' ? 'active' : 'suspended';
        const { error } = await supabase.from('salons').update({ status: nextStatus }).eq('id', id);
        if (error) {
            console.error('Suspend toggle failed:', error);
            return;
        }
        setSalons(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Weet je zeker dat je deze salon definitief wilt verwijderen uit het systeem?')) {
            const { error } = await supabase.from('salons').delete().eq('id', id);
            if (error) {
                console.error('Delete failed:', error);
                return;
            }
            setSalons(prev => prev.filter(s => s.id !== id));
        }
    };

    const openEditModal = (salon: AdminSalon) => {
        setEditingSalon(salon);
        setEditForm({ 
            name: salon.name, 
            city: salon.city, 
            address: salon.address,
            kvk: salon.kvk || '' 
        });
        setIsEditModalOpen(true);
    };

    const saveEdit = async () => {
        if (editingSalon) {
            const { error } = await supabase
                .from('salons')
                .update({
                    name: editForm.name,
                    city: editForm.city,
                    address: editForm.address
                })
                .eq('id', editingSalon.id);

            if (error) {
                console.error('Update failed:', error);
                return;
            }

            setSalons(prev => prev.map(s => s.id === editingSalon.id ? {
                ...s,
                name: editForm.name,
                city: editForm.city,
                address: editForm.address
            } : s));
            setIsEditModalOpen(false);
            setEditingSalon(null);
        }
    };

    // Filter
    const filteredSalons = salons.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper for Subscription Badge
    const renderSubBadge = (sub: AdminSalon['subscription']) => {
        switch(sub.status) {
            case 'active':
                return (
                    <div className="flex flex-col items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                             {sub.plan} Actief
                        </span>
                        <span className="text-[10px] text-stone-400 mt-0.5 whitespace-nowrap">Verlengt: {sub.renewsAt}</span>
                    </div>
                );
            case 'trialing':
                return (
                     <div className="flex flex-col items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                            Proefperiode
                        </span>
                         <span className="text-[10px] text-stone-400 mt-0.5 whitespace-nowrap">Eindigt: {sub.renewsAt}</span>
                    </div>
                );
            case 'past_due':
                 return (
                    <div className="flex flex-col items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
                            <AlertCircle size={10} className="mr-1"/> Betaalprobleem
                        </span>
                    </div>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                        Gratis
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Salon Beheer</h1>
                    <p className="text-stone-500">Keur aanmeldingen goed en beheer aangesloten salons.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-3 top-3 text-stone-400" size={18} />
                         <input 
                            type="text" 
                            placeholder="Zoek salon of stad..." 
                            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-stone-50 border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-stone-600">Salon Naam</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Locatie</th>
                                <th className="px-6 py-4 font-medium text-stone-600">
                                    <div className="flex items-center gap-1">
                                        <ShieldAlert size={14} /> Account
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-medium text-stone-600">Status</th>
                                <th className="px-6 py-4 font-medium text-stone-600 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-stone-500">Laden...</td></tr>
                            ) : filteredSalons.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-stone-500">Geen salons gevonden.</td></tr>
                            ) : filteredSalons.map(salon => (
                                <tr key={salon.id} className={`hover:bg-stone-50/50 ${salon.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-stone-900">
                                            <button 
                                                onClick={() => window.open(`/${salon.id}`, '_blank')}
                                                className="text-brand-600 hover:text-brand-700 hover:underline"
                                            >
                                                {salon.name}
                                            </button>
                                        </div>
                                        <div className="text-xs text-stone-500">KVK: {salon.kvk || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600">
                                        {salon.address}, {salon.city}
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderSubBadge(salon.subscription)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {salon.status === 'active' && <Badge variant="success">Actief</Badge>}
                                        {salon.status === 'pending' && <Badge variant="warning">In Afwachting</Badge>}
                                        {salon.status === 'suspended' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Geblokkeerd</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                         <div className="flex items-center justify-end gap-2">
                                            {salon.status === 'pending' ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleApprove(salon.id)}
                                                        className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Goedkeuren"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReject(salon.id)}
                                                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Afwijzen"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => openEditModal(salon)}
                                                        className="p-1.5 text-stone-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                                                        title="Bewerken"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleSuspend(salon.id)}
                                                        className={`p-1.5 rounded-lg transition-colors ${salon.status === 'suspended' ? 'text-green-500 bg-green-50 hover:bg-green-100' : 'text-stone-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                                        title={salon.status === 'suspended' ? 'Deblokkeren' : 'Blokkeren'}
                                                    >
                                                        {salon.status === 'suspended' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(salon.id)}
                                                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Verwijderen"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredSalons.length === 0 && (
                    <div className="p-8 text-center text-stone-500">Geen salons gevonden die aan de zoekopdracht voldoen.</div>
                )}
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Salon Gegevens Bewerken"
            >
                <div className="space-y-4">
                    <Input 
                        label="Naam Salon" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Stad" 
                            value={editForm.city}
                            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                        />
                         <Input 
                            label="KVK Nummer" 
                            value={editForm.kvk}
                            onChange={(e) => setEditForm({...editForm, kvk: e.target.value})}
                        />
                    </div>
                     <Input 
                        label="Adres" 
                        value={editForm.address}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuleren</Button>
                        <Button onClick={saveEdit}>Opslaan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};