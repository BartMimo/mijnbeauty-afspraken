import React, { useState, useEffect } from 'react';
import { Save, Store, MapPin, Clock, Image as ImageIcon, Upload, Trash2, Smartphone, Check, Calendar, Copy, Link as LinkIcon, RefreshCw, X } from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SalonSettings: React.FC = () => {
    const { user } = useAuth();
    const [salonId, setSalonId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'general' | 'portfolio' | 'sync'>('general');

    // State initialization
    const [settings, setSettings] = useState({
        name: '',
        description: '',
        address: '',
        zipCode: '',
        city: '',
        phone: '',
        email: '',
        openings: {
            ma: { start: '09:00', end: '18:00' },
            di: { start: '09:00', end: '18:00' },
            wo: { start: '09:00', end: '18:00' },
            do: { start: '09:00', end: '18:00' },
            vr: { start: '09:00', end: '18:00' },
            za: { start: '10:00', end: '17:00' }
        },
        portfolio: [] as string[],
        calendarSync: {
            google: { connected: false, email: '' },
            apple: { connected: false, url: '' }
        }
    });

    // Fetch salon data
    useEffect(() => {
        const fetchSalonData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data: salon, error } = await supabase
                    .from('salons')
                    .select('*')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (error) throw error;
                
                if (salon) {
                    setSalonId(salon.id);
                    
                    // Parse address into parts if possible
                    const addressParts = salon.address?.match(/^(.+?),\s*(\d{4}\s*\w{2})\s+(.+)$/);
                    
                    setSettings(prev => ({
                        ...prev,
                        name: salon.name || '',
                        description: salon.description || '',
                        address: addressParts ? addressParts[1] : salon.address || '',
                        zipCode: addressParts ? addressParts[2] : salon.zip_code || '',
                        city: addressParts ? addressParts[3] : salon.city || '',
                        phone: salon.phone || '',
                        email: salon.email || '',
                        portfolio: salon.image_url ? [salon.image_url] : []
                    }));
                }
            } catch (err) {
                console.error('Error fetching salon:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSalonData();
    }, [user]);

    const [isSaved, setIsSaved] = useState(false);
    
    // Sync UI States
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isICalModalOpen, setIsICalModalOpen] = useState(false);
    const [icalInput, setIcalInput] = useState('');

    const handleSave = async () => {
        if (!salonId) return;

        try {
            const fullAddress = `${settings.address}, ${settings.zipCode} ${settings.city}`;
            
            const { error } = await supabase
                .from('salons')
                .update({
                    name: settings.name,
                    description: settings.description,
                    address: fullAddress,
                    city: settings.city,
                    zip_code: settings.zipCode,
                    phone: settings.phone,
                    email: settings.email,
                    image_url: settings.portfolio[0] || null
                })
                .eq('id', salonId);

            if (error) throw error;
            
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Opslaan mislukt');
        }
    };

    const handleChange = (field: string, value: string) => {
        setSettings({ ...settings, [field]: value });
    };

    const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
        setSettings({
            ...settings,
            openings: {
                ...settings.openings,
                [day]: { ...settings.openings[day], [type]: value }
            }
        });
    };

    // --- Portfolio Logic ---
    const handleUpload = () => {
        // Simulating upload by adding a random unsplash image
        const newImage = `https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=400&random=${Date.now()}`;
        setSettings({ ...settings, portfolio: [...(settings.portfolio || []), newImage] });
    };

    const handleDeleteImage = (index: number) => {
        const newPortfolio = settings.portfolio.filter((_: any, i: number) => i !== index);
        setSettings({ ...settings, portfolio: newPortfolio });
    };

    // --- Sync Logic: Google ---
    const handleGoogleConnect = () => {
        if (settings.calendarSync?.google?.connected) {
            // Disconnect
            setSettings({
                ...settings,
                calendarSync: { ...settings.calendarSync, google: { connected: false, email: '' } }
            });
        } else {
            // Connect Simulation
            setIsGoogleLoading(true);
            setTimeout(() => {
                setSettings({
                    ...settings,
                    calendarSync: { ...settings.calendarSync, google: { connected: true, email: 'salon.eigenaar@gmail.com' } }
                });
                setIsGoogleLoading(false);
            }, 1500);
        }
    };

    // --- Sync Logic: Apple/iCal ---
    const handleAppleConnect = () => {
        if (settings.calendarSync?.apple?.connected) {
             setSettings({
                ...settings,
                calendarSync: { ...settings.calendarSync, apple: { connected: false, url: '' } }
            });
        } else {
            setIcalInput('');
            setIsICalModalOpen(true);
        }
    };

    const saveICal = () => {
        if(!icalInput) return;
        setSettings({
            ...settings,
            calendarSync: { ...settings.calendarSync, apple: { connected: true, url: icalInput } }
        });
        setIsICalModalOpen(false);
    };

    const copyExportUrl = () => {
        navigator.clipboard.writeText("https://api.mijnbeauty.nl/cal/837492.ics");
        alert("Link gekopieerd naar klembord!");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-stone-900">Salon Instellingen</h1>

            {/* Tabs */}
            <div className="flex border-b border-stone-200 gap-6 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-brand-500 text-brand-600' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                >
                    Algemeen & Openingstijden
                </button>
                <button 
                    onClick={() => setActiveTab('portfolio')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'portfolio' ? 'border-brand-500 text-brand-600' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                >
                    Portfolio & Foto's
                </button>
                 <button 
                    onClick={() => setActiveTab('sync')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'sync' ? 'border-brand-500 text-brand-600' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                >
                    Agenda Synchronisatie
                </button>
            </div>

            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                    <Card className="p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                            <Store size={20} className="mr-2 text-brand-500"/> Algemene Informatie
                        </h2>
                        <div className="space-y-4">
                            <Input 
                                label="Salon Naam" 
                                value={settings.name} 
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                            <div className="w-full">
                                <label className="mb-2 block text-sm font-medium text-stone-700">Beschrijving</label>
                                <textarea 
                                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none min-h-[100px]"
                                    value={settings.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                            <MapPin size={20} className="mr-2 text-brand-500"/> Locatie & Contact
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Input 
                                    label="Straat & Huisnummer" 
                                    value={settings.address} 
                                    onChange={(e) => handleChange('address', e.target.value)}
                                />
                            </div>
                            <Input 
                                label="Postcode" 
                                value={settings.zipCode}
                                onChange={(e) => handleChange('zipCode', e.target.value)}
                            />
                            <Input 
                                label="Stad" 
                                value={settings.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                            />
                            <Input 
                                label="Telefoonnummer" 
                                value={settings.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                            <Input 
                                label="E-mail (zakelijk)" 
                                value={settings.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                            <Clock size={20} className="mr-2 text-brand-500"/> Openingstijden
                        </h2>
                        <div className="space-y-2">
                            {['ma', 'di', 'wo', 'do', 'vr', 'za'].map(day => (
                                <div key={day} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                                    <span className="font-medium text-stone-700 w-24 capitalize">{day === 'ma' ? 'maandag' : day + 'terdag' && day + 'dag'}</span>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="time" 
                                            className="border rounded px-2 py-1 text-sm" 
                                            value={settings.openings[day]?.start || '09:00'}
                                            onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                        />
                                        <span className="text-stone-400">-</span>
                                        <input 
                                            type="time" 
                                            className="border rounded px-2 py-1 text-sm" 
                                            value={settings.openings[day]?.end || '18:00'}
                                            onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB: PORTFOLIO */}
            {activeTab === 'portfolio' && (
                <div className="space-y-6 animate-fadeIn">
                     <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold flex items-center text-stone-800">
                                    <ImageIcon size={20} className="mr-2 text-brand-500"/> Portfolio
                                </h2>
                                <p className="text-sm text-stone-500">Foto's worden getoond op je publieke salonpagina.</p>
                            </div>
                            <Button onClick={handleUpload}>
                                <Upload size={18} className="mr-2" /> Foto Uploaden
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {settings.portfolio && settings.portfolio.map((img: string, idx: number) => (
                                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                                    <img src={img} alt="Portfolio" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => handleDeleteImage(idx)}
                                        className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                             {/* Empty State placeholder */}
                             <div 
                                onClick={handleUpload}
                                className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 cursor-pointer transition-all"
                             >
                                 <Upload size={24} className="mb-2" />
                                 <span className="text-xs font-medium">Sleep foto hierheen</span>
                             </div>
                        </div>
                    </Card>
                </div>
            )}

             {/* TAB: SYNC */}
             {activeTab === 'sync' && (
                <div className="space-y-6 animate-fadeIn">
                     <Card className="p-6">
                         <div className="mb-6">
                            <h2 className="text-lg font-bold flex items-center text-stone-800">
                                <Calendar size={20} className="mr-2 text-brand-500"/> Agenda Koppeling (Import)
                            </h2>
                            <p className="text-sm text-stone-500">Haal afspraken uit je privé agenda (Google, iCloud) op zodat je niet dubbel geboekt wordt.</p>
                         </div>

                         <div className="space-y-4">
                             {/* Google */}
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-stone-100 rounded-xl bg-white shadow-sm gap-4">
                                 <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 bg-white border border-stone-200 rounded-full flex items-center justify-center shrink-0">
                                         <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-6 h-6" alt="Google" />
                                     </div>
                                     <div>
                                         <p className="font-bold text-stone-900">Google Calendar</p>
                                         <p className="text-xs text-stone-500">
                                             {settings.calendarSync?.google?.connected 
                                                ? `Verbonden met ${settings.calendarSync.google.email}` 
                                                : 'Real-time synchronisatie via OAuth'}
                                         </p>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={handleGoogleConnect}
                                    disabled={isGoogleLoading}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center justify-center ${settings.calendarSync?.google?.connected ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                                 >
                                     {isGoogleLoading ? (
                                         <><RefreshCw className="animate-spin mr-2 h-4 w-4"/> Verbinden...</>
                                     ) : settings.calendarSync?.google?.connected ? (
                                         <><Check className="mr-2 h-4 w-4"/> Verbonden</>
                                     ) : (
                                         'Verbinden'
                                     )}
                                 </button>
                             </div>

                             {/* Apple / iCal */}
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-stone-100 rounded-xl bg-white shadow-sm gap-4">
                                 <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 bg-stone-900 rounded-full flex items-center justify-center text-white shrink-0">
                                         <Smartphone size={20} />
                                     </div>
                                     <div className="overflow-hidden">
                                         <p className="font-bold text-stone-900">Apple / Outlook (iCal)</p>
                                         <p className="text-xs text-stone-500 truncate">
                                             {settings.calendarSync?.apple?.connected 
                                                ? `Importeert van URL` 
                                                : 'Importeer agenda via publieke iCal URL'}
                                         </p>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={handleAppleConnect}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center justify-center ${settings.calendarSync?.apple?.connected ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                                 >
                                     {settings.calendarSync?.apple?.connected ? (
                                         <><Check className="mr-2 h-4 w-4"/> Verbonden</>
                                     ) : (
                                         'Instellen'
                                     )}
                                 </button>
                             </div>
                         </div>
                     </Card>

                     <Card className="p-6">
                         <div className="mb-6">
                            <h2 className="text-lg font-bold flex items-center text-stone-800">
                                <LinkIcon size={20} className="mr-2 text-brand-500"/> Jouw Salon Agenda (Export)
                            </h2>
                            <p className="text-sm text-stone-500">
                                Wil je jouw werkafspraken op je eigen telefoon zien? Abonneer je dan op deze agenda link in je telefooninstellingen.
                            </p>
                         </div>
                         
                         <div className="flex gap-2">
                             <input 
                                readOnly
                                value="https://api.mijnbeauty.nl/cal/837492.ics"
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm text-stone-600"
                             />
                             <Button onClick={copyExportUrl} variant="outline">
                                 <Copy size={18} />
                             </Button>
                         </div>
                         <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-100">
                             <strong>Tip:</strong> Ga op je iPhone naar Instellingen &gt; Agenda &gt; Accounts &gt; Nieuwe agenda-abonnement en plak deze link.
                         </div>
                     </Card>
                </div>
             )}

            <div className="flex justify-end pt-4 pb-8 items-center gap-4">
                {isSaved && <span className="text-green-600 text-sm font-medium animate-fadeIn">Wijzigingen opgeslagen!</span>}
                <Button onClick={handleSave}>
                    <Save size={18} className="mr-2" /> Opslaan
                </Button>
            </div>

            {/* iCal Modal */}
            <Modal
                isOpen={isICalModalOpen}
                onClose={() => setIsICalModalOpen(false)}
                title="Verbinden met iCal"
            >
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">
                        Plak hier de publieke iCal (.ics) link van je externe agenda (bijv. iCloud, Outlook of een ander systeem). Wij halen elke 15 minuten nieuwe blokkades op.
                    </p>
                    <Input 
                        placeholder="https://p32-caldav.icloud.com/..."
                        value={icalInput}
                        onChange={(e) => setIcalInput(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end pt-2 gap-2">
                        <Button variant="outline" onClick={() => setIsICalModalOpen(false)}>Annuleren</Button>
                        <Button onClick={saveICal} disabled={!icalInput}>Verbinden</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};