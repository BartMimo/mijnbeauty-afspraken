import React, { useState } from 'react';
import { User, Mail, Lock, Bell, Save, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../../components/UIComponents';
import { useAuth } from '../../context/AuthContext';

export const UserProfile: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    
    // Use profile data or fallback to empty
    const [formData, setFormData] = useState({
        name: profile?.full_name || '',
        email: user?.email || '',
        phone: profile?.phone || ''
    });

    const handleSave = async () => {
        setSaving(true);
        setMessage('Wijzigingen opgeslagen!');
        setTimeout(() => setMessage(null), 3000);
        setSaving(false);
    };

    if (!user) {
        return (
            <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500">Je bent niet ingelogd</p>
            </div>
        );
    }
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-stone-900">Mijn Profiel</h1>
            
            {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {message}
                </div>
            )}
            
            <Card className="p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                    <User size={20} className="mr-2 text-brand-500"/> Persoonlijke Gegevens
                </h2>
                <div className="space-y-4">
                    <Input 
                        label="Naam" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <Input 
                        label="E-mailadres" 
                        type="email" 
                        value={formData.email}
                        disabled
                    />
                    <Input 
                        label="Telefoonnummer" 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                    <Button onClick={handleSave} isLoading={saving}>
                        <Save size={16} className="mr-2" /> Opslaan
                    </Button>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                    <Bell size={20} className="mr-2 text-brand-500"/> Notificaties
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-stone-900">Nieuwsbrief & Deals</p>
                            <p className="text-sm text-stone-500">Ontvang updates over kortingen bij jouw favoriete salons</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5 text-brand-500 rounded border-stone-300 focus:ring-brand-400" />
                    </div>
                </div>
            </Card>

            <div className="flex justify-end pt-4">
                <Button onClick={() => alert('Gegevens opgeslagen!')}>
                    <Save size={18} className="mr-2" /> Wijzigingen Opslaan
                </Button>
            </div>
        </div>
    );
};