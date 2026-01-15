import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Euro } from 'lucide-react';
import { Button, Card, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SalonServices: React.FC = () => {
    const { user } = useAuth();
    const [salonId, setSalonId] = useState<string | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch salon and services on mount
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
                const { data: servicesData, error } = await supabase
                    .from('services')
                    .select('*')
                    .eq('salon_id', salon.id)
                    .order('name');

                if (error) throw error;
                
                setServices(servicesData?.map(s => ({
                    id: s.id,
                    name: s.name,
                    category: s.category || 'Overig',
                    duration: s.duration_minutes,
                    price: s.price,
                    active: s.active
                })) || []);

            } catch (err) {
                console.error('Error fetching services:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [form, setForm] = useState({ name: '', category: 'Nagels', duration: 30, price: 0, active: true });

    // Actions
    const handleEdit = (service: any) => {
        setEditingService(service);
        setForm({ ...service });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingService(null);
        setForm({ name: '', category: 'Nagels', duration: 30, price: 0, active: true });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Weet je zeker dat je deze dienst wilt verwijderen?')) {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) {
                console.error('Delete failed:', error);
                alert('Verwijderen mislukt');
                return;
            }
            setServices(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSave = async () => {
        if (!salonId) return;

        try {
            if (editingService) {
                // Update existing service
                const { error } = await supabase
                    .from('services')
                    .update({
                        name: form.name,
                        category: form.category,
                        duration_minutes: form.duration,
                        price: form.price,
                        active: form.active
                    })
                    .eq('id', editingService.id);

                if (error) throw error;
                setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...form } : s));
            } else {
                // Create new service
                const { data, error } = await supabase
                    .from('services')
                    .insert({
                        salon_id: salonId,
                        name: form.name,
                        category: form.category,
                        duration_minutes: form.duration,
                        price: form.price,
                        active: form.active
                    })
                    .select()
                    .single();

                if (error) throw error;
                setServices(prev => [...prev, { 
                    id: data.id, 
                    name: data.name,
                    category: data.category,
                    duration: data.duration_minutes,
                    price: data.price,
                    active: data.active
                }]);
            }
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('Save failed:', err);
            alert('Opslaan mislukt: ' + err.message);
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
                    <h1 className="text-2xl font-bold text-stone-900">Diensten</h1>
                    <p className="text-stone-500">Beheer je behandelingen en prijzen</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus size={18} className="mr-2" /> Nieuwe Dienst
                </Button>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-stone-600">Dienst Naam</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Categorie</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Duur</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Prijs</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Status</th>
                                <th className="px-6 py-4 font-medium text-stone-600 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {services.map((service) => (
                                <tr key={service.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-stone-900">{service.name}</td>
                                    <td className="px-6 py-4 text-stone-600">
                                        <Badge>{service.category}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600 flex items-center">
                                        <Clock size={14} className="mr-1 text-stone-400" /> {service.duration} min
                                    </td>
                                    <td className="px-6 py-4 font-medium text-stone-900">€{service.price}</td>
                                    <td className="px-6 py-4">
                                        {service.active ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Actief</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-500">Inactief</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-stone-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors" onClick={() => handleEdit(service)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(service.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-stone-500">Nog geen diensten toegevoegd.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Dienst Bewerken" : "Nieuwe Dienst"}>
                <div className="space-y-4">
                    <Input 
                        label="Naam Behandeling" 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})} 
                        required
                    />
                    <Select 
                        label="Categorie"
                        value={form.category}
                        onChange={e => setForm({...form, category: e.target.value})}
                    >
                        <option>Kapper</option>
                        <option>Nagels</option>
                        <option>Wimpers</option>
                        <option>Massage</option>
                        <option>Overig</option>
                    </Select>
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Duur (min)" 
                            type="number" 
                            value={form.duration} 
                            onChange={e => setForm({...form, duration: Number(e.target.value)})} 
                        />
                        <Input 
                            label="Prijs (€)" 
                            type="number" 
                            value={form.price} 
                            onChange={e => setForm({...form, price: Number(e.target.value)})} 
                        />
                    </div>
                    <div className="flex items-center pt-2">
                        <input 
                            type="checkbox" 
                            id="active" 
                            className="mr-2 h-4 w-4 text-brand-600 rounded border-stone-300"
                            checked={form.active}
                            onChange={e => setForm({...form, active: e.target.checked})}
                        />
                        <label htmlFor="active" className="text-sm font-medium text-stone-700">Dienst is actief en boekbaar</label>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuleren</Button>
                        <Button onClick={handleSave}>Opslaan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};