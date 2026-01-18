import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Euro } from 'lucide-react';
import { Button, Card, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SalonServices: React.FC = () => {
    const { user } = useAuth();
    const [salonId, setSalonId] = useState<string | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
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
                    .select(`
                        *,
                        service_staff(staff_id)
                    `)
                    .eq('salon_id', salon.id)
                    .order('name');

                if (error) throw error;
                
                setServices(servicesData?.map(s => ({
                    id: s.id,
                    name: s.name,
                    category: s.category || 'Overig',
                    duration: s.duration_minutes,
                    price: s.price,
                    active: s.active,
                    staffIds: s.service_staff?.map((ss: any) => ss.staff_id) || []
                })) || []);

                // Fetch categories for this salon
                const { data: categoriesData, error: catError } = await supabase
                    .from('service_categories')
                    .select('*')
                    .eq('salon_id', salon.id)
                    .order('name');

                if (catError) throw catError;

                setCategories(categoriesData || []);

                // Fetch staff for this salon
                const { data: staffData, error: staffError } = await supabase
                    .from('staff')
                    .select('id, name')
                    .eq('salon_id', salon.id)
                    .eq('is_active', true)
                    .order('name');

                if (staffError) throw staffError;

                setStaff(staffData || []);

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
    const [form, setForm] = useState({ name: '', category: '', duration: 30, price: 0, active: true, staffIds: [] as string[] });

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

    // Actions
    const handleEdit = (service: any) => {
        setEditingService(service);
        setForm({ ...service });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingService(null);
        setForm({ name: '', category: categories.length > 0 ? categories[0].name : '', duration: 30, price: 0, active: true, staffIds: [] });
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

    // Category Actions
    const handleCreateCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '' });
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: any) => {
        setEditingCategory(category);
        setCategoryForm({ name: category.name, description: category.description || '' });
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('Weet je zeker dat je deze categorie wilt verwijderen? Alle diensten in deze categorie worden naar "Overig" verplaatst.')) {
            const { error } = await supabase.from('service_categories').delete().eq('id', id);
            if (error) {
                console.error('Delete failed:', error);
                alert('Verwijderen mislukt');
                return;
            }
            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleSaveCategory = async () => {
        if (!salonId) return;

        try {
            if (editingCategory) {
                // Update existing category
                const { error } = await supabase
                    .from('service_categories')
                    .update({
                        name: categoryForm.name,
                        description: categoryForm.description
                    })
                    .eq('id', editingCategory.id);

                if (error) throw error;
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryForm } : c));
            } else {
                // Create new category
                const { data, error } = await supabase
                    .from('service_categories')
                    .insert({
                        salon_id: salonId,
                        name: categoryForm.name,
                        description: categoryForm.description
                    })
                    .select()
                    .single();

                if (error) throw error;
                setCategories(prev => [...prev, data]);
            }
            setIsCategoryModalOpen(false);
        } catch (err: any) {
            console.error('Save failed:', err);
            alert('Opslaan mislukt: ' + err.message);
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

                // Update service-staff assignments
                // First delete existing assignments
                await supabase
                    .from('service_staff')
                    .delete()
                    .eq('service_id', editingService.id);

                // Then insert new assignments
                if (form.staffIds.length > 0) {
                    const assignments = form.staffIds.map(staffId => ({
                        service_id: editingService.id,
                        staff_id: staffId
                    }));

                    const { error: assignError } = await supabase
                        .from('service_staff')
                        .insert(assignments);

                    if (assignError) throw assignError;
                }

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

                // Create service-staff assignments
                if (form.staffIds.length > 0) {
                    const assignments = form.staffIds.map(staffId => ({
                        service_id: data.id,
                        staff_id: staffId
                    }));

                    const { error: assignError } = await supabase
                        .from('service_staff')
                        .insert(assignments);

                    if (assignError) throw assignError;
                }

                setServices(prev => [...prev, { 
                    id: data.id, 
                    name: data.name,
                    category: data.category,
                    duration: data.duration_minutes,
                    price: data.price,
                    active: data.active,
                    staffIds: form.staffIds
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
                    <h1 className="text-2xl font-bold text-stone-900">Diensten & Categorieën</h1>
                    <p className="text-stone-500">Beheer je behandelingen, prijzen en categorieën</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCreateCategory}>
                        <Plus size={18} className="mr-2" /> Nieuwe Categorie
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus size={18} className="mr-2" /> Nieuwe Dienst
                    </Button>
                </div>
            </div>

            {/* Categories Section */}
            <Card className="overflow-hidden">
                <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-semibold text-stone-900">Dienst Categorieën</h2>
                    <p className="text-stone-500 text-sm mt-1">Organiseer je diensten in categorieën</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-stone-600">Categorienaam</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Beschrijving</th>
                                <th className="px-6 py-4 font-medium text-stone-600">Aantal Diensten</th>
                                <th className="px-6 py-4 font-medium text-stone-600 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {categories.map((category) => {
                                const serviceCount = services.filter(s => s.category === category.name).length;
                                return (
                                    <tr key={category.id} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-stone-900">{category.name}</td>
                                        <td className="px-6 py-4 text-stone-600">{category.description || '-'}</td>
                                        <td className="px-6 py-4 text-stone-600">{serviceCount} diensten</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-stone-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors" onClick={() => handleEditCategory(category)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDeleteCategory(category.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-stone-500">Nog geen categorieën aangemaakt.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Services Section */}
            <Card className="overflow-hidden">
                <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-semibold text-stone-900">Diensten</h2>
                    <p className="text-stone-500 text-sm mt-1">Beheer je behandelingen en prijzen</p>
                </div>
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
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Categorie</label>
                        <div className="flex gap-2">
                            <select 
                                className="flex-1 h-11 px-4 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-400"
                                value={form.category}
                                onChange={e => setForm({...form, category: e.target.value})}
                            >
                                <option value="">Selecteer categorie...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                                <option value="Overig">Overig</option>
                            </select>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setTimeout(() => handleCreateCategory(), 100);
                                }}
                                className="px-3"
                            >
                                <Plus size={16} />
                            </Button>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">Of maak een nieuwe categorie aan</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Duur</label>
                            <select 
                                className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-400"
                                value={form.duration} 
                                onChange={e => setForm({...form, duration: Number(e.target.value)})}
                            >
                                <option value={30}>30 minuten</option>
                                <option value={60}>1 uur</option>
                                <option value={90}>1,5 uur</option>
                                <option value={120}>2 uur</option>
                                <option value={150}>2,5 uur</option>
                                <option value={180}>3 uur</option>
                            </select>
                        </div>
                        <Input 
                            label="Prijs (€)" 
                            type="number" 
                            value={form.price} 
                            onChange={e => setForm({...form, price: Number(e.target.value)})} 
                        />
                    </div>

                    {/* Staff Assignment */}
                    <div className="border-t border-stone-100 pt-4">
                        <h3 className="font-bold text-stone-800 mb-3">Medewerkers</h3>
                        <p className="text-sm text-stone-600 mb-4">Selecteer welke medewerkers deze dienst kunnen uitvoeren.</p>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {staff.map(member => (
                                <label key={member.id} className="flex items-center space-x-2 p-2 hover:bg-stone-50 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.staffIds.includes(member.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setForm({...form, staffIds: [...form.staffIds, member.id]});
                                            } else {
                                                setForm({...form, staffIds: form.staffIds.filter(id => id !== member.id)});
                                            }
                                        }}
                                        className="h-4 w-4 text-brand-600 rounded border-stone-300 focus:ring-brand-500"
                                    />
                                    <span className="text-sm text-stone-700">{member.name}</span>
                                </label>
                            ))}
                        </div>
                        {staff.length === 0 && (
                            <p className="text-sm text-stone-500 italic">Geen medewerkers beschikbaar. Voeg eerst medewerkers toe.</p>
                        )}
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

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? "Categorie Bewerken" : "Nieuwe Categorie"}>
                <div className="space-y-4">
                    <Input 
                        label="Categorienaam" 
                        value={categoryForm.name} 
                        onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                        required
                        placeholder="bijv. Vrouwen knippen"
                    />
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Beschrijving (optioneel)</label>
                        <textarea 
                            className="w-full h-20 px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                            value={categoryForm.description} 
                            onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                            placeholder="Korte beschrijving van deze categorie..."
                        />
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Annuleren</Button>
                        <Button onClick={handleSaveCategory}>Opslaan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};