import React, { useState, useEffect } from 'react';
import { Save, Store, MapPin, Clock, Image as ImageIcon, Upload, Trash2, Check, X, CreditCard } from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SalonSettings: React.FC = () => {
    const { user } = useAuth();
    const [salonId, setSalonId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'general' | 'portfolio' | 'payments'>('general');

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
            ma: { start: '09:00', end: '18:00', closed: false },
            di: { start: '09:00', end: '18:00', closed: false },
            wo: { start: '09:00', end: '18:00', closed: false },
            do: { start: '09:00', end: '18:00', closed: false },
            vr: { start: '09:00', end: '18:00', closed: false },
            za: { start: '10:00', end: '17:00', closed: false },
            zo: { start: '00:00', end: '00:00', closed: true }
        },
        portfolio: [] as string[],
        paymentMethods: {
            cash: true,
            online: false
        },
        stripeAccountId: '',
        stripePublishableKey: ''
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
                        portfolio: salon.image_url ? [salon.image_url] : [],
                        openings: salon.opening_hours || prev.openings,
                        paymentMethods: salon.payment_methods || { cash: true, online: false },
                        stripeAccountId: salon.stripe_account_id || '',
                        stripePublishableKey: salon.stripe_publishable_key || ''
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
                    image_url: settings.portfolio[0] || null,
                    opening_hours: settings.openings,
                    payment_methods: settings.paymentMethods,
                    stripe_account_id: settings.stripeAccountId,
                    stripe_publishable_key: settings.stripePublishableKey
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

    const handleClosedChange = (day: string, closed: boolean) => {
        setSettings({
            ...settings,
            openings: {
                ...settings.openings,
                [day]: { ...settings.openings[day], closed }
            }
        });
    };

    // --- Portfolio Logic ---
    const [newImageUrl, setNewImageUrl] = useState('');

    const handleAddImage = () => {
        if (!newImageUrl.trim()) {
            alert('Voer een afbeelding URL in');
            return;
        }

        // Basic URL validation
        try {
            new URL(newImageUrl);
        } catch {
            alert('Voer een geldige URL in');
            return;
        }

        setSettings({ ...settings, portfolio: [...(settings.portfolio || []), newImageUrl] });
        setNewImageUrl('');
    };

    const handleDeleteImage = (index: number) => {
        const newPortfolio = settings.portfolio.filter((_: any, i: number) => i !== index);
        setSettings({ ...settings, portfolio: newPortfolio });
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
                    onClick={() => setActiveTab('payments')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'border-brand-500 text-brand-600' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                >
                    Betalingen
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
                            {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map(day => (
                                <div key={day} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                                    <span className="font-medium text-stone-700 w-24 capitalize">{day === 'ma' ? 'maandag' : day === 'di' ? 'dinsdag' : day === 'wo' ? 'woensdag' : day === 'do' ? 'donderdag' : day === 'vr' ? 'vrijdag' : day === 'za' ? 'zaterdag' : 'zondag'}</span>
                                    <div className="flex gap-3 items-center">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={settings.openings[day]?.closed || false}
                                                onChange={(e) => handleClosedChange(day, e.target.checked)}
                                                className="rounded border-stone-300 text-brand-500 focus:ring-brand-400"
                                            />
                                            Gesloten
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="time"
                                                className="border rounded px-2 py-1 text-sm disabled:bg-stone-100 disabled:text-stone-400"
                                                value={settings.openings[day]?.start || '09:00'}
                                                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                                disabled={settings.openings[day]?.closed}
                                            />
                                            <span className="text-stone-400">-</span>
                                            <input
                                                type="time"
                                                className="border rounded px-2 py-1 text-sm disabled:bg-stone-100 disabled:text-stone-400"
                                                value={settings.openings[day]?.end || '18:00'}
                                                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                                disabled={settings.openings[day]?.closed}
                                            />
                                        </div>
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
                        <div className="mb-6">
                            <h2 className="text-lg font-bold flex items-center text-stone-800">
                                <ImageIcon size={20} className="mr-2 text-brand-500"/> Portfolio
                            </h2>
                            <p className="text-sm text-stone-500">Foto's worden getoond op je publieke salonpagina.</p>
                        </div>

                        {/* Add Image URL */}
                        <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
                            <div className="flex gap-3">
                                <Input
                                    type="url"
                                    placeholder="https://example.com/afbeelding.jpg"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={handleAddImage}>
                                    <Upload size={18} className="mr-2" /> Toevoegen
                                </Button>
                            </div>
                            <p className="text-xs text-stone-400 mt-2">Plak een link naar je foto (bijv. van Instagram, je website, of een foto service)</p>
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
                             <div className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400">
                                 <ImageIcon size={32} className="mb-2" />
                                 <p className="text-xs text-center">Geen foto's toegevoegd</p>
                             </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB: PAYMENTS */}
            {activeTab === 'payments' && (
                <div className="space-y-6 animate-fadeIn">
                    <Card className="p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center text-stone-800">
                            <CreditCard size={20} className="mr-2 text-brand-500"/> Betalingsmethoden
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-stone-700 mb-3">Beschikbare betalingsmethoden</h3>
                                <p className="text-sm text-stone-500 mb-4">Kies welke betalingsmethoden je wilt aanbieden aan je klanten.</p>
                                
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={settings.paymentMethods.cash}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                paymentMethods: {
                                                    ...settings.paymentMethods,
                                                    cash: e.target.checked
                                                }
                                            })}
                                            className="w-4 h-4 text-brand-600 bg-stone-100 border-stone-300 rounded focus:ring-brand-500"
                                        />
                                        <div>
                                            <div className="font-medium text-stone-900">Contant betalen</div>
                                            <div className="text-sm text-stone-500">Klanten betalen ter plekke bij aankomst</div>
                                        </div>
                                    </label>
                                    
                                    <label className="flex items-center space-x-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={settings.paymentMethods.online}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                paymentMethods: {
                                                    ...settings.paymentMethods,
                                                    online: e.target.checked
                                                }
                                            })}
                                            className="w-4 h-4 text-brand-600 bg-stone-100 border-stone-300 rounded focus:ring-brand-500"
                                        />
                                        <div>
                                            <div className="font-medium text-stone-900">Online betalen</div>
                                            <div className="text-sm text-stone-500">Klanten betalen direct tijdens het boeken met creditcard</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {settings.paymentMethods.online && (
                                <div className="border-t border-stone-200 pt-6">
                                    <h3 className="text-sm font-medium text-stone-700 mb-3">Stripe Instellingen</h3>
                                    <p className="text-sm text-stone-500 mb-4">Configureer je Stripe account voor online betalingen.</p>
                                    
                                    <div className="space-y-4">
                                        <Input 
                                            label="Stripe Account ID" 
                                            value={settings.stripeAccountId} 
                                            onChange={(e) => handleChange('stripeAccountId', e.target.value)}
                                            placeholder="acct_..."
                                        />
                                        <Input 
                                            label="Stripe Publishable Key" 
                                            value={settings.stripePublishableKey} 
                                            onChange={(e) => handleChange('stripePublishableKey', e.target.value)}
                                            placeholder="pk_..."
                                        />
                                        <p className="text-xs text-stone-400">
                                            Je Stripe keys vind je in je Stripe Dashboard onder Developers &gt; API keys.
                                            Gebruik de test keys tijdens ontwikkeling.
                                        </p>
                                    </div>
                                </div>
                            )}
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

        </div>
    );
};