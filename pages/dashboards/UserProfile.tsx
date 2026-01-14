import React from 'react';
import { User, Mail, Lock, Bell, Save } from 'lucide-react';
import { Button, Input, Card } from '../../components/UIComponents';

export const UserProfile: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-stone-900">Mijn Profiel</h1>
            
            <Card className="p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                    <User size={20} className="mr-2 text-brand-500"/> Persoonlijke Gegevens
                </h2>
                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Voornaam" defaultValue="Sophie" />
                        <Input label="Achternaam" defaultValue="de Vries" />
                    </div>
                    <Input label="E-mailadres" type="email" defaultValue="sophie@example.com" />
                    <Input label="Telefoonnummer" type="tel" defaultValue="06 12345678" />
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                    <Lock size={20} className="mr-2 text-brand-500"/> Wachtwoord Wijzigen
                </h2>
                <div className="space-y-4">
                    <Input label="Huidig wachtwoord" type="password" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Nieuw wachtwoord" type="password" />
                        <Input label="Bevestig nieuw wachtwoord" type="password" />
                    </div>
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
                        <input type="checkbox" className="h-5 w-5 text-brand-500 rounded border-stone-300 focus:ring-brand-400" />
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