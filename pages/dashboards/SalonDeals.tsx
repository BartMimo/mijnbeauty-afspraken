import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Tag } from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SalonDeals: React.FC = () => {
    const { user } = useAuth();
    const [salonId, setSalonId] = useState<string | null>(null);
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'claimed'>('active');

    // Fetch salon and deals on mount
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

                // Fetch deals for this salon (supports optional status filter)
                let q = supabase.from('deals').select('*').eq('salon_id', salon.id).order('date', { ascending: true });
                if (filterStatus && filterStatus !== 'all') {
                    q = q.eq('status', filterStatus);
                }
                const { data: dealsData, error } = await q;

                if (error) throw error;
                
                setDeals(dealsData?.map(d => ({
                    id: d.id,
                    service: d.service_name,
                    price: d.discount_price,
                    original: d.original_price,
                    time: d.time ? `${new Date(d.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${d.time}` : new Date(d.date).toLocaleDateString('nl-NL'),
                    date: d.date,
                    status: d.status || 'active'
                })) || []);

            } catch (err) {
                console.error('Error fetching deals:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, filterStatus]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState<any>(null);
    const [form, setForm] = useState({ service: '', price: '', original: '', time: '', date: '', status: 'active' });

    // Actions
    const handleEdit = (deal: any) => {
        setEditingDeal(deal);
        setForm({ ...deal, date: deal.date || new Date().toISOString().split('T')[0] });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingDeal(null);
        setForm({ service: '', price: '', original: '', time: '', date: new Date().toISOString().split('T')[0], status: 'active' });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Weet je zeker dat je deze deal wilt verwijderen?')) {
            const { error } = await supabase.from('deals').delete().eq('id', id);
            if (error) {
                console.error('Delete failed:', error);
                alert('Verwijderen mislukt');
                return;
            }
            setDeals(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleSave = async () => {
        if (!salonId) return;

        try {
            // Use form date or today
            const dealDate = form.date || new Date().toISOString().split('T')[0];
            
            if (editingDeal) {
                // Update existing deal
                const { error } = await supabase
                    .from('deals')
                    .update({
                        service_name: form.service,
                        original_price: parseFloat(form.original),
                        discount_price: parseFloat(form.price),
                        date: dealDate,
                        time: form.time,
                        status: form.status
                    })
                    .eq('id', editingDeal.id);

                if (error) throw error;
                setDeals(prev => prev.map(d => d.id === editingDeal.id ? { 
                    ...d, 
                    ...form,
                    time: `${new Date(dealDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${form.time}`
                } : d));
            } else {
                // Create new deal
                const { data, error } = await supabase
                    .from('deals')
                    .insert({
                        salon_id: salonId,
                        service_name: form.service,
                        original_price: parseFloat(form.original),
                        discount_price: parseFloat(form.price),
                        date: dealDate,
                        time: form.time,
                        status: form.status
                    })
                    .select()
                    .single();

                if (error) throw error;
                setDeals(prev => [...prev, { 
                    id: data.id, 
                    service: data.service_name,
                    price: data.discount_price,
                    original: data.original_price,
                    time: `${new Date(dealDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${form.time}`,
                    date: dealDate,
                    status: data.status
                }]);
            }
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('Save failed:', err);
            alert('Opslaan mislukt: ' + err.message);
        }
    };

    const toggleStatus = async (id: string) => {
        const deal = deals.find(d => d.id === id);
        if (!deal) return;

        const newStatus = deal.status === 'active' ? 'inactive' : 'active';
        const { error } = await supabase
            .from('deals')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Status toggle failed:', error);
            return;
        }

        setDeals(prev => prev.map(d => {
            if (d.id === id) {
                return { ...d, status: newStatus };
            }
            return d;
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Mijn Deals</h1>
                    <p className="text-stone-500">Beheer last-minute aanbiedingen en acties</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                        <option value="active">Actief</option>
                        <option value="claimed">Geclaimd</option>
                        <option value="all">Alles</option>
                    </select>
                    <Button onClick={handleCreate}>
                        <Plus size={18} className="mr-2" /> Nieuwe Deal
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-stone-600">Dienst / Titel</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Prijs</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Wanneer</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Korting</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Status</th>
                                <th className="px-6 py-4 font-medium text-stone-600 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {deals.map((deal) => {
                                const discount = deal.original ? Math.round(((deal.original - deal.price) / deal.original) * 100) : 0;
                                return (
                                    <tr key={deal.id} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-stone-900">{deal.service}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-brand-600">€{deal.price}</span>
                                                {deal.original && <span className="text-xs text-stone-400 line-through">€{deal.original}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-stone-600">
                                            <span className="flex items-center"><Clock size={14} className="mr-1 text-stone-400" /> {deal.time}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {discount > 0 && <Badge variant="warning">-{discount}%</Badge>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleStatus(deal.id)}
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${deal.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                                            >
                                                {deal.status === 'active' ? 'Actief' : 'Inactief'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-stone-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors" onClick={() => handleEdit(deal)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(deal.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {deals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-stone-500">
                                        <div className="flex flex-col items-center">
                                            <Tag size={32} className="mb-2 text-stone-300" />
                                            <p>Nog geen deals toegevoegd.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDeal ? "Deal Bewerken" : "Nieuwe Deal"}>
                <div className="space-y-4">
                    <Input 
                        label="Dienst / Titel" 
                        value={form.service}
                        onChange={e => setForm({...form, service: e.target.value})}
                        placeholder="bv. Last-minute Knippen"
                    />
                    <div className="grid grid-cols-2 gap-4">
                         <Input 
                            label="Oude Prijs (€)" 
                            type="number"
                            value={form.original}
                            onChange={e => setForm({...form, original: e.target.value})}
                        />
                         <Input 
                            label="Deal Prijs (€)" 
                            type="number"
                            value={form.price}
                            onChange={e => setForm({...form, price: e.target.value})}
                        />
                    </div>
                    
                    {/* Date picker */}
                    <Input 
                        label="Datum" 
                        type="date"
                        value={form.date || new Date().toISOString().split('T')[0]}
                        onChange={e => setForm({...form, date: e.target.value})}
                    />
                    
                    {/* Time picker with clickable buttons */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Tijdstip</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                              '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                              '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
                              '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map(time => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => setForm({...form, time})}
                                    className={`px-2 py-2 text-sm rounded-lg border transition-colors ${
                                        form.time === time 
                                            ? 'bg-brand-500 text-white border-brand-500' 
                                            : 'bg-white text-stone-700 border-stone-200 hover:border-brand-300 hover:bg-brand-50'
                                    }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                     <div className="flex items-center pt-2">
                        <input 
                            type="checkbox" 
                            id="active" 
                            className="mr-2 h-4 w-4 text-brand-600 rounded border-stone-300"
                            checked={form.status === 'active'}
                            onChange={e => setForm({...form, status: e.target.checked ? 'active' : 'inactive'})}
                        />
                        <label htmlFor="active" className="text-sm font-medium text-stone-700">Deal direct online zetten</label>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuleren</Button>
                        <Button 
                            onClick={handleSave}
                            disabled={!form.service || !form.price || !form.original || !form.time}
                        >
                            Opslaan
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};