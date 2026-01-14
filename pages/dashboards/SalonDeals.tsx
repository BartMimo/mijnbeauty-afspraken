import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Tag } from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../../components/UIComponents';

export const SalonDeals: React.FC = () => {
    // State
    const [deals, setDeals] = useState<any[]>(() => {
        const saved = localStorage.getItem('salon_deals');
        return saved ? JSON.parse(saved) : [
             { id: 1, service: 'Biab Nagels (Last-minute)', price: '30', original: '45', time: 'Vandaag, 15:30', status: 'active' },
             { id: 2, service: 'Wimperlift', price: '40', original: '55', time: 'Morgen, 09:00', status: 'active' }
        ];
    });

    useEffect(() => {
        localStorage.setItem('salon_deals', JSON.stringify(deals));
    }, [deals]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState<any>(null);
    const [form, setForm] = useState({ service: '', price: '', original: '', time: '', status: 'active' });

    // Actions
    const handleEdit = (deal: any) => {
        setEditingDeal(deal);
        setForm({ ...deal });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingDeal(null);
        setForm({ service: '', price: '', original: '', time: '', status: 'active' });
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Weet je zeker dat je deze deal wilt verwijderen?')) {
            setDeals(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleSave = () => {
        if (editingDeal) {
            setDeals(prev => prev.map(d => d.id === editingDeal.id ? { ...d, ...form } : d));
        } else {
            setDeals(prev => [...prev, { id: Date.now(), ...form }]);
        }
        setIsModalOpen(false);
    };

    const toggleStatus = (id: number) => {
        setDeals(prev => prev.map(d => {
            if (d.id === id) {
                return { ...d, status: d.status === 'active' ? 'inactive' : 'active' };
            }
            return d;
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Mijn Deals</h1>
                    <p className="text-stone-500">Beheer last-minute aanbiedingen en acties</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus size={18} className="mr-2" /> Nieuwe Deal
                </Button>
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
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                         <Input 
                            label="Oude Prijs (€)" 
                            type="number"
                            value={form.original}
                            onChange={e => setForm({...form, original: e.target.value})}
                            required
                        />
                         <Input 
                            label="Deal Prijs (€)" 
                            type="number"
                            value={form.price}
                            onChange={e => setForm({...form, price: e.target.value})}
                            required
                        />
                    </div>
                    <Input 
                        label="Tijdstip / Omschrijving" 
                        value={form.time}
                        onChange={e => setForm({...form, time: e.target.value})}
                        placeholder="bv. Vandaag, 14:00"
                        required
                    />
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
                        <Button onClick={handleSave}>Opslaan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};