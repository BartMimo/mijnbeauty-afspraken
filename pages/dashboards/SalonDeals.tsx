import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Tag } from 'lucide-react';
import { Button, Card, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SalonDeals: React.FC = () => {
    const { user } = useAuth();
    const [salonId, setSalonId] = useState<string | null>(null);
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'claimed' | 'expired'>('active');
    const [staff, setStaff] = useState<any[]>([]);

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
                let q = supabase.from('deals').select(`
                    *,
                    staff:staff_id (id, name)
                `).eq('salon_id', salon.id).order('date', { ascending: true });
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
                    time: d.time && d.date ? `${new Date(d.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${d.time}` : (d.date ? new Date(d.date).toLocaleDateString('nl-NL') : 'Geen datum'),
                    rawTime: d.time || '',
                    date: d.date,
                    durationMinutes: d.duration_minutes || 60,
                    status: d.status || 'active',
                    staffId: d.staff_id || '',
                    staff: d.staff
                })) || []);

                // Fetch staff for this salon
                const { data: staffData } = await supabase
                    .from('staff')
                    .select('id, name')
                    .eq('salon_id', salon.id)
                    .eq('is_active', true)
                    .order('name');

                if (staffData) {
                    setStaff(staffData);
                }

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
    const [form, setForm] = useState({ service: '', price: '', original: '', time: '', date: '', status: 'active', durationMinutes: 60, staffId: '' });

    // Actions
    const handleEdit = (deal: any) => {
        setEditingDeal(deal);
        // Extract time from formatted string (e.g., "20 jan, 12:00" -> "12:00")
        const timeMatch = deal.time?.match(/, (\d{1,2}:\d{2})$/);
        const extractedTime = timeMatch ? timeMatch[1] : '';
        setForm({ 
            ...deal, 
            time: extractedTime,
            date: deal.date || new Date().toISOString().split('T')[0],
            durationMinutes: deal.durationMinutes || 60,
            staffId: deal.staffId || ''
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingDeal(null);
        setForm({ service: '', price: '', original: '', time: '', date: new Date().toISOString().split('T')[0], status: 'active', durationMinutes: 60, staffId: '' });
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
                        duration_minutes: form.durationMinutes,
                        status: form.status,
                        staff_id: form.staffId || null
                    })
                    .eq('id', editingDeal.id);

                if (error) throw error;
                setDeals(prev => prev.map(d => d.id === editingDeal.id ? { 
                    ...d, 
                    ...form,
                    time: `${new Date(dealDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${form.time}`,
                    rawTime: form.time
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
                        duration_minutes: form.durationMinutes,
                        status: form.status,
                        staff_id: form.staffId || null
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
                    rawTime: form.time,
                    date: dealDate,
                    durationMinutes: data.duration_minutes || 60,
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

        // Instead of toggling to 'inactive' (which may violate constraint),
        // ask user if they want to delete the deal
        if (deal.status === 'active') {
            if (window.confirm('Deze deal deactiveren? Dit verwijdert de deal permanent.')) {
                const { error } = await supabase
                    .from('deals')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Delete failed:', error);
                    alert('Verwijderen mislukt');
                    return;
                }

                setDeals(prev => prev.filter(d => d.id !== id));
            }
        } else {
            // If somehow a deal has a different status, toggle it back to active
            const { error } = await supabase
                .from('deals')
                .update({ status: 'active' })
                .eq('id', id);

            if (error) {
                console.error('Status update failed:', error);
                return;
            }

            setDeals(prev => prev.map(d => {
                if (d.id === id) {
                    return { ...d, status: 'active' };
                }
                return d;
            }));
        }
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
                        <option value="expired">Verlopen</option>
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
                                <th className="px-6 py-4 font-medium text-stone-600">Medewerker</th>
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
                                        <td className="px-6 py-4 text-stone-600">
                                            {deal.staff?.name || 'Alle medewerkers'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {discount > 0 && <Badge variant="warning">-{discount}%</Badge>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleStatus(deal.id)}
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                                    deal.status === 'active' 
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                        : deal.status === 'claimed'
                                                            ? 'bg-stone-100 text-stone-500 cursor-not-allowed'
                                                            : deal.status === 'expired'
                                                                ? 'bg-stone-100 text-stone-500 cursor-not-allowed'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                                disabled={deal.status === 'claimed' || deal.status === 'expired'}
                                            >
                                                {deal.status === 'active' ? 'Deactiveren' : deal.status === 'claimed' ? 'Geclaimd' : deal.status === 'expired' ? 'Verlopen' : 'Activeren'}
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
                                    <td colSpan={7} className="text-center py-12 text-stone-500">
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

                    {/* Duration input */}
                    <Input 
                        label="Duur (minuten)" 
                        type="number"
                        value={form.durationMinutes}
                        onChange={e => setForm({...form, durationMinutes: parseInt(e.target.value) || 60})}
                        placeholder="60"
                        min="15"
                        max="480"
                    />

                    {/* Staff selection */}
                    <Select
                        label="Medewerker (optioneel)"
                        value={form.staffId}
                        onChange={e => setForm({...form, staffId: e.target.value})}
                    >
                        <option value="">Alle medewerkers (standaard)</option>
                        {staff.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </Select>

                     <p className="text-sm text-stone-600 pt-2">
                        Deals zijn standaard actief en zichtbaar voor klanten. Gebruik de "Deactiveren" knop om een deal te verwijderen.
                     </p>
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