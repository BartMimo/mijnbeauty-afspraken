import React from 'react';
import { Search, MoreHorizontal, Mail, Shield } from 'lucide-react';
import { Button, Card, Badge } from '../../components/UIComponents';

export const AdminUsers: React.FC = () => {
    const users = [
        { id: 1, name: 'Jan Jansen', email: 'jan@test.nl', role: 'Consument', status: 'Actief', date: '12-10-2023' },
        { id: 2, name: 'Sophie de Vries', email: 'sophie@test.nl', role: 'Consument', status: 'Actief', date: '15-10-2023' },
        { id: 3, name: 'Sarah (Glow Salon)', email: 'sarah@salon.nl', role: 'Salon Eigenaar', status: 'Actief', date: '01-11-2023' },
        { id: 4, name: 'Admin User', email: 'admin@beauty.nl', role: 'Admin', status: 'Actief', date: '01-01-2023' },
    ];

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
                        />
                    </div>
                    <Button variant="outline">Exporteer</Button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 border-b border-stone-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-stone-600">Naam</th>
                            <th className="px-6 py-4 font-medium text-stone-600">Rol</th>
                            <th className="px-6 py-4 font-medium text-stone-600">Geregistreerd</th>
                            <th className="px-6 py-4 font-medium text-stone-600">Status</th>
                            <th className="px-6 py-4 font-medium text-stone-600 text-right">Actie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-stone-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-stone-900">{user.name}</div>
                                    <div className="text-xs text-stone-500 flex items-center mt-0.5">
                                        <Mail size={10} className="mr-1" /> {user.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role.includes('Admin') ? 'bg-purple-100 text-purple-700' : user.role.includes('Salon') ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>
                                        {user.role.includes('Admin') && <Shield size={10} />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-stone-600">{user.date}</td>
                                <td className="px-6 py-4"><Badge variant="success">{user.status}</Badge></td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-stone-400 hover:text-stone-600">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};