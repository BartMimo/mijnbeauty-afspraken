import React, { useState, useEffect } from 'react';
import { User, Mail, Save, Clock } from 'lucide-react';
import { Button, Input, Card } from '../../components/UIComponents';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const StaffProfile: React.FC = () => {
    // Get current user from AuthContext
    const { user, profile } = useAuth();
    const userEmail = user?.email || profile?.email || '';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile state
    const [myProfile, setMyProfile] = useState<any>(null);

    // Default schedule
    const defaultSchedule = {
        ma: { active: true, start: '09:00', end: '17:00' },
        di: { active: true, start: '09:00', end: '17:00' },
        wo: { active: true, start: '09:00', end: '17:00' },
        do: { active: true, start: '09:00', end: '17:00' },
        vr: { active: true, start: '09:00', end: '17:00' },
        za: { active: false, start: '10:00', end: '16:00' },
        zo: { active: false, start: '10:00', end: '16:00' },
    };

    // Initial Load - get profile from Supabase
    useEffect(() => {
        const loadProfile = async () => {
            if (!user || !profile) {
                setLoading(false);
                return;
            }

            // Build profile from auth context
            setMyProfile({
                id: user.id,
                name: profile.full_name || '',
                role: profile.role === 'salon' ? 'Eigenaar' : 'Medewerker',
                email: user.email || '',
                schedule: defaultSchedule
            });
            setLoading(false);
        };

        loadProfile();
    }, [user, profile]);

    const handleSave = async () => {
        if (!myProfile || !user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: myProfile.name,
                    phone: myProfile.phone
                })
                .eq('id', user.id);

            if (error) throw error;
            alert('Wijzigingen opgeslagen!');
        } catch (err) {
            console.error('Error saving profile:', err);
            alert('Opslaan mislukt');
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleChange = (day: string, field: string, value: any) => {
        setMyProfile((prev: any) => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [day]: {
                    ...prev.schedule[day],
                    [field]: value
                }
            }
        }));
    };

    const days = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
    const dayLabels: {[key:string]: string} = { ma: 'Maandag', di: 'Dinsdag', wo: 'Woensdag', do: 'Donderdag', vr: 'Vrijdag', za: 'Zaterdag', zo: 'Zondag' };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (!myProfile) return <div className="p-8 text-center text-stone-500">Geen profiel gevonden</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-stone-900">Mijn Profiel & Werktijden</h1>
            
            <Card className="p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                    <User size={20} className="mr-2 text-brand-500"/> Persoonlijke Gegevens
                </h2>
                <div className="space-y-4">
                    <Input 
                        label="Volledige Naam" 
                        value={myProfile.name}
                        onChange={(e) => setMyProfile({...myProfile, name: e.target.value})}
                    />
                    <Input 
                        label="E-mailadres" 
                        value={myProfile.email}
                        onChange={(e) => setMyProfile({...myProfile, email: e.target.value})}
                    />
                    <div className="p-4 bg-brand-50 rounded-xl text-sm text-brand-700">
                        Je rol is ingesteld als: <strong>{myProfile.role}</strong>. Dit kan alleen door de eigenaar gewijzigd worden.
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                 <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                    <Clock size={20} className="mr-2 text-brand-500"/> Mijn Werktijden
                </h2>
                <p className="text-sm text-stone-500 mb-4">Beheer hier wanneer je beschikbaar bent voor afspraken.</p>
                
                <div className="space-y-2 bg-stone-50 p-4 rounded-xl">
                    {days.map(day => (
                        <div key={day} className="flex items-center gap-3 py-1">
                            <div className="w-8 pt-1">
                                <input 
                                    type="checkbox"
                                    checked={myProfile.schedule[day]?.active}
                                    onChange={(e) => handleScheduleChange(day, 'active', e.target.checked)}
                                    className="h-4 w-4 text-brand-500 rounded border-stone-300 focus:ring-brand-400 cursor-pointer"
                                />
                            </div>
                            <div className="w-24 text-sm font-medium text-stone-700">{dayLabels[day]}</div>
                            
                            <div className={`flex items-center gap-2 flex-1 transition-opacity ${myProfile.schedule[day]?.active ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <input 
                                    type="time" 
                                    value={myProfile.schedule[day]?.start}
                                    onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                                    className="h-8 w-full min-w-[80px] rounded-lg border border-stone-200 text-xs px-2 focus:outline-none focus:border-brand-400"
                                />
                                <span className="text-stone-400">-</span>
                                <input 
                                    type="time" 
                                    value={myProfile.schedule[day]?.end}
                                    onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                                    className="h-8 w-full min-w-[80px] rounded-lg border border-stone-200 text-xs px-2 focus:outline-none focus:border-brand-400"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave}>
                    <Save size={18} className="mr-2" /> Wijzigingen Opslaan
                </Button>
            </div>
        </div>
    );
};