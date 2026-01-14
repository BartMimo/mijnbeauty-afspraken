import React, { useState, useEffect } from 'react';
import { User, Mail, Save, Clock } from 'lucide-react';
import { Button, Input, Card } from '../../components/UIComponents';

export const StaffProfile: React.FC = () => {
    // In a real app, we'd use an ID. Here we sync by email match.
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email || 'mike@salon.nl'; // Fallback for demo safety

    // Load full staff list to find and update "me"
    const [allStaff, setAllStaff] = useState<any[]>([]);
    const [myProfile, setMyProfile] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        const savedStaff = localStorage.getItem('salon_staff_v2');
        if (savedStaff) {
            const parsed = JSON.parse(savedStaff);
            setAllStaff(parsed);
            const me = parsed.find((s: any) => s.email === userEmail);
            if (me) setMyProfile(me);
        } else {
             // SEED DATA FOR DEMO IF EMPTY (So Mike can see his profile)
             const defaultSchedule = {
                ma: { active: true, start: '09:00', end: '17:00' },
                di: { active: true, start: '09:00', end: '17:00' },
                wo: { active: true, start: '09:00', end: '17:00' },
                do: { active: true, start: '09:00', end: '17:00' },
                vr: { active: true, start: '09:00', end: '17:00' },
                za: { active: false, start: '10:00', end: '16:00' },
                zo: { active: false, start: '10:00', end: '16:00' },
            };
            const demoStaff = [
                { 
                    id: 1, 
                    name: 'Sarah Janssen', 
                    role: 'Eigenaar / Stylist', 
                    email: 'sarah@salon.nl', 
                    schedule: { ...defaultSchedule } 
                },
                { 
                    id: 2, 
                    name: 'Mike de Boer', 
                    role: 'Stylist', 
                    email: 'mike@salon.nl', 
                    schedule: {
                        ...defaultSchedule,
                        ma: { active: false, start: '09:00', end: '17:00' },
                        za: { active: true, start: '10:00', end: '15:00' }
                    }
                },
            ];
            localStorage.setItem('salon_staff_v2', JSON.stringify(demoStaff));
            setAllStaff(demoStaff);
            const me = demoStaff.find((s: any) => s.email === userEmail);
            if (me) setMyProfile(me);
        }
    }, [userEmail]);

    const handleSave = () => {
        if (!myProfile) return;

        // Update the big list
        const updatedStaffList = allStaff.map(s => s.id === myProfile.id ? myProfile : s);
        
        // Save to storage (Syncs with Owner view)
        localStorage.setItem('salon_staff_v2', JSON.stringify(updatedStaffList));
        
        // Update current session name if changed
        const sessionUser = { ...currentUser, name: myProfile.name };
        localStorage.setItem('currentUser', JSON.stringify(sessionUser));

        alert('Wijzigingen opgeslagen!');
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

    if (!myProfile) return <div className="p-8 text-center text-stone-500">Profiel aan het laden...</div>;

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