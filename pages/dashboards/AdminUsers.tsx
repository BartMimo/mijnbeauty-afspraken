import React, { useEffect, useMemo, useState } from 'react';
import { Search, Mail, Shield, Edit2, Trash2, Download } from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ full_name: '', email: '', role: '' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, role, created_at, deleted_at')
                    .is('deleted_at', null)  // Only show non-deleted users
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const mapped = (data || []).map((u: any) => ({
                    id: u.id,
                    name: u.full_name || 'Onbekend',
                    email: u.email,
                    role: u.role || 'consumer',
                    status: 'Actief',
                    date: u.created_at ? new Date(u.created_at).toLocaleDateString('nl-NL') : '-'
                }));

                setUsers(mapped);
            } catch (err) {
                console.error('Error loading users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    // Actions
    const handleEdit = (user: any) => {
        setEditingUser(user);
        setEditForm({ 
            full_name: user.name, 
            email: user.email, 
            role: user.role 
        });
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingUser) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editForm.full_name,
                    role: editForm.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === editingUser.id ? {
                ...u,
                name: editForm.full_name,
                role: editForm.role
            } : u));
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (err: any) {
            console.error('Update failed:', err);
            alert('Opslaan mislukt: ' + err.message);
        }
    };

    const handleDelete = async (user: any) => {
        if (!window.confirm(`Weet je zeker dat je "${user.name}" wilt verwijderen? De gebruiker kan niet meer inloggen, maar het account blijft bestaan voor administratieve doeleinden.`)) {
            return;
        }

        try {
            // Soft delete: set deleted_at timestamp instead of hard delete
            const { error } = await supabase
                .from('profiles')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state to reflect the change
            setUsers(prev => prev.map(u => 
                u.id === user.id 
                    ? { ...u, status: 'Verwijderd' } 
                    : u
            ));
            
            alert('Gebruiker succesvol verwijderd. Het account kan niet meer worden gebruikt.');
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert('Verwijderen mislukt: ' + err.message);
        }
    };

    // Export to CSV
    const handleExport = () => {
        const headers = ['Naam', 'Email', 'Rol', 'Geregistreerd', 'Status'];
        const csvData = filteredUsers.map(u => [
            u.name,
            u.email,
            u.role,
            u.date,
            u.status
        ]);
        
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gebruikers-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-stone-900">Gebruikersbeheer</h1>
            
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex gap-4">
                     <div className="relative flex-1">
                         <Search className="absolute left-3 top-3 text-stone-400" size={18} />
                         <input 
                            type="text" 
                            placeholder="Zoek op naam of email..." 
                            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download size={16} className="mr-2" /> Exporteer
                    </Button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 border-b border-stone-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-stone-600">Naam</th>
                            <th className="px-6 py-4 font-medium text-stone-600">Rol</th>
                            <th className="px-6 py-4 font-medium text-stone-600">Geregistreerd</th>
                            <th className="px-6 py-4 font-medium text-stone-600">Status</th>
                            <th className="px-6 py-4 font-medium text-stone-600 text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-stone-500">Laden...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-stone-500">Geen gebruikers gevonden.</td></tr>
                        ) : filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-stone-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-stone-900">{user.name}</div>
                                    <div className="text-xs text-stone-500 flex items-center mt-0.5">
                                        <Mail size={10} className="mr-1" /> {user.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'salon' || user.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>
                                        {user.role === 'admin' && <Shield size={10} />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-stone-600">{user.date}</td>
                                <td className="px-6 py-4"><Badge variant="success">{user.status}</Badge></td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleEdit(user)}
                                            className="p-1.5 text-stone-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                                            title="Bewerken"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user)}
                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Verwijderen"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Gebruiker Bewerken"
            >
                <div className="space-y-4">
                    <Input 
                        label="Naam" 
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    />
                    <Input 
                        label="Email" 
                        value={editForm.email}
                        disabled
                        className="bg-stone-50"
                    />
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Rol</label>
                        <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                            className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                        >
                            <option value="consumer">Consument</option>
                            <option value="owner">Salon Eigenaar</option>
                            <option value="staff">Medewerker</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuleren</Button>
                        <Button onClick={handleSave}>Opslaan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};