import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, User, Store, Briefcase, ShieldCheck, ArrowRight, ArrowLeft, Check, Landmark, CreditCard, AlertCircle, CheckCircle2, Loader2, Upload, Image, Clock, Euro, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Card } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { Location } from '../types';

// ============================================================
// CONFIGURATIE: Zet op 'true' om betaalmodule te activeren
// ============================================================
const PAYMENT_REQUIRED = false; // Zet op true wanneer Stripe klaar is
// ============================================================

// Salon categories - matches ServiceCategory enum
const SALON_CATEGORIES = [
    { value: 'Kapper', label: 'Kapsalon', icon: '💇' },
    { value: 'Nagels', label: 'Nagelsalon', icon: '💅' },
    { value: 'Wimpers', label: 'Wimper & Brow Studio', icon: '👁️' },
    { value: 'Massage', label: 'Massagesalon', icon: '💆' },
    { value: 'Gezichtsbehandeling', label: 'Gezichtssalon', icon: '✨' },
    { value: 'Huidverzorging', label: 'Huidverzorging', icon: '🧴' },
    { value: 'Make-up', label: 'Make-up Salon', icon: '💄' },
    { value: 'Overig', label: 'Overig', icon: '🏪' },
];

// Geocode function
const geocodeAddress = async (address: string) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Netherlands')}`);
        const data = await response.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (err) {
        console.error('Geocoding error:', err);
    }
    return null;
};

// Service duration options (30-min blocks)
const DURATION_OPTIONS = [
    { value: 30, label: '30 minuten' },
    { value: 60, label: '1 uur' },
    { value: 90, label: '1,5 uur' },
    { value: 120, label: '2 uur' },
    { value: 150, label: '2,5 uur' },
    { value: 180, label: '3 uur' },
];

interface InitialService {
    name: string;
    price: number;
    duration: number;
    category: string;
}

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({ initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [role, setRole] = useState<'consumer' | 'salon'>('consumer');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const navigate = useNavigate();

    // Salon Registration Wizard State
    const [salonStep, setSalonStep] = useState(1); 
    
    // Registration Form States
    const [regName, setRegName] = useState('');
    const [regSalonName, setRegSalonName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    // Consumer-specific registration fields
    const [regUserPhone, setRegUserPhone] = useState('');
    const [regAllowContact, setRegAllowContact] = useState(false);
    
    // Subdomain Logic
    const [regSubdomain, setRegSubdomain] = useState('');
    const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'available' | 'taken'>('idle');

    // Step 2: Address fields
    const [regStreet, setRegStreet] = useState('');
    const [regHouseNumber, setRegHouseNumber] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [regPhone, setRegPhone] = useState('');
    
    const [paymentMethod, setPaymentMethod] = useState<'ideal' | 'creditcard' | null>(null);
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [discountCode, setDiscountCode] = useState('');
    const [discountCodeValid, setDiscountCodeValid] = useState<boolean | null>(null);

    // Step 3: Salon Profile (NEW)
    const [salonCategories, setSalonCategories] = useState<string[]>([]);
    const [salonDescription, setSalonDescription] = useState('');
    const [salonImageUrl, setSalonImageUrl] = useState('');
    const [imageUploading, setImageUploading] = useState(false);

    // Step 4: Initial Service (NEW)
    const [initialServices, setInitialServices] = useState<InitialService[]>([
        { name: '', price: 0, duration: 30, category: 'Overig' }
    ]);

    // Valid discount codes (case-insensitive)
    const VALID_DISCOUNT_CODES = ['gratistest'];

    // Fetch locations for the select
    useEffect(() => {
        const fetchLocations = async () => {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('city', { ascending: true });
            if (error) {
                console.error('Error fetching locations:', error);
            } else {
                setLocations(data || []);
            }
        };
        fetchLocations();
    }, []);

    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

    const checkDiscountCode = (code: string) => {
        const normalizedCode = code.toLowerCase().trim();
        const isValid = VALID_DISCOUNT_CODES.includes(normalizedCode);
        setDiscountCodeValid(isValid);
        return isValid;
    };

    // Helper to slugify text
    const createSlug = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')           
            .replace(/[^\w\-]+/g, '')       
            .replace(/\-\-+/g, '-')        
            .replace(/^-+/, '')             
            .replace(/-+$/, '');           
    };

    // Auto-generate subdomain when salon name changes
    useEffect(() => {
        if (regSalonName) {
            const slug = createSlug(regSalonName);
            setRegSubdomain(slug);
            checkAvailability(slug);
        } else {
            setRegSubdomain('');
            setSubdomainStatus('idle');
        }
    }, [regSalonName]);

    const checkAvailability = async (slug: string) => {
        if (!slug) {
            setSubdomainStatus('idle');
            return;
        }
        
        try {
            // Check real Supabase database for existing subdomain
            const { data, error } = await supabase
                .from('salons')
                .select('subdomain')
                .eq('subdomain', slug)
                .maybeSingle();
            
            if (error) {
                console.error('Error checking subdomain:', error);
                // Fallback to available if we can't check
                setSubdomainStatus('available');
                return;
            }
            
            setSubdomainStatus(data ? 'taken' : 'available');
        } catch (err) {
            console.error('Error checking subdomain:', err);
            setSubdomainStatus('available');
        }
    };

    const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = createSlug(e.target.value);
        setRegSubdomain(val);
        checkAvailability(val);
    };

    // --- REAL AUTH LOGIC ---

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;

            // Check if there's a pending salon to create (from registration without session)
            const pendingSalonData = localStorage.getItem('pendingSalon');
            if (pendingSalonData && data.user) {
                try {
                    const pendingSalon = JSON.parse(pendingSalonData);
                    
                    // Only create if this is the same user who registered
                    if (pendingSalon.userId === data.user.id) {
                        // First ensure profile exists with correct role
                        await supabase
                            .from('profiles')
                            .upsert(
                                { 
                                    id: data.user.id, 
                                    email: loginEmail, 
                                    full_name: pendingSalon.ownerName, 
                                    role: 'salon', 
                                    phone: pendingSalon.phone 
                                },
                                { onConflict: 'id' }
                            );
                        
                        // Wait for profile to be committed
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Check if salon already exists for this user
                        const { data: existingSalon } = await supabase
                            .from('salons')
                            .select('id')
                            .eq('owner_id', data.user.id)
                            .maybeSingle();
                        
                        if (!existingSalon) {
                            // Create the salon
                            console.log('Creating pending salon for user:', data.user.id);
                            const { data: newSalon, error: salonError } = await supabase
                                .from('salons')
                                .insert({
                                    owner_id: data.user.id,
                                    name: pendingSalon.salonName,
                                    slug: pendingSalon.subdomain,
                                    subdomain: pendingSalon.subdomain,
                                    status: 'pending',
                                    city: pendingSalon.city,
                                    zipCode: pendingSalon.zipCode,
                                    address: pendingSalon.address,
                                    location_id: pendingSalon.location_id,
                                    phone: pendingSalon.phone
                                })
                                .select()
                                .single();
                            
                            if (salonError) {
                                console.error('Pending salon creation error:', salonError);
                                console.error('Error details:', JSON.stringify(salonError, null, 2));
                                alert('Let op: Je salon kon niet worden aangemaakt. Neem contact op met support. Error: ' + salonError.message);
                            } else {
                                console.log('Pending salon created successfully:', newSalon);
                                alert('Je salon is aangemaakt en wacht op goedkeuring van de admin.');
                            }
                        }
                        
                        // Clear the pending salon data
                        localStorage.removeItem('pendingSalon');
                    }
                } catch (pendingErr) {
                    console.error('Error processing pending salon:', pendingErr);
                    localStorage.removeItem('pendingSalon');
                }
            }

            // Redirect based on profile role in AuthContext
            navigate('/dashboard');
            
        } catch (err: any) {
            setErrorMsg(err.message || 'Inloggen mislukt');
        } finally {
            setLoading(false);
        }
    };

    const handleConsumerRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        // Require phone number
        if (!regUserPhone || regUserPhone.trim().length === 0) {
            setErrorMsg('Vul je telefoonnummer in');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: regEmail,
                password: regPassword,
                options: {
                    data: {
                        full_name: regName,
                        role: 'consumer',
                        phone: regUserPhone,
                        allow_contact_email: regAllowContact
                    }
                }
            });

            if (error) throw error;
            // Ensure a profile row exists regardless of DB hooks
            // Upsert profile only if we have a session (auth.uid available under RLS)
            if (data.user && data.session) {
                try {
                    await supabase
                        .from('profiles')
                        .upsert(
                            { id: data.user.id, email: regEmail, full_name: regName, role: 'consumer', phone: regUserPhone, allow_contact_email: regAllowContact },
                            { onConflict: 'id' }
                        );
                } catch (err) {
                    // If DB schema doesn't include allow_contact_email yet, don't block registration
                    console.warn('Profile upsert warning:', err);
                }
            }
            
            if (data.session) {
                navigate('/dashboard');
            } else {
                setMode('login'); // Require email confirmation flow usually
            }

        } catch (err: any) {
            setErrorMsg(err.message || 'Registratie mislukt');
        } finally {
            setLoading(false);
        }
    };

    const handleSalonNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (salonStep === 1) {
            if (subdomainStatus === 'taken') {
                alert("Kies een unieke URL voor je salon.");
                return;
            }
            if (!regName || !regSalonName || !regEmail || !regPassword) {
                alert("Vul alle velden in.");
                return;
            }
        }
        if (salonStep === 2) {
            // Validate step 2 fields
            if (!regStreet || !regHouseNumber || !selectedLocationId || !regPhone) {
                alert("Vul alle adresgegevens in.");
                return;
            }
        }
        if (salonStep === 3) {
            // Validate salon profile
            if (salonCategories.length === 0) {
                alert("Selecteer een categorie voor je salon.");
                return;
            }
            if (!salonDescription || salonDescription.length < 20) {
                alert("Voeg een beschrijving toe (minimaal 20 karakters).");
                return;
            }
        }
        if (salonStep === 4) {
            // Validate at least one service
            const validServices = initialServices.filter(s => s.name && s.price > 0);
            if (validServices.length === 0) {
                alert("Voeg minimaal 1 dienst toe met naam en prijs.");
                return;
            }
        }
        setSalonStep(prev => prev + 1);
    };

    // Handle image upload to Supabase Storage
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Selecteer een afbeelding (JPG, PNG, etc.)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Afbeelding mag maximaal 5MB zijn');
            return;
        }

        setImageUploading(true);
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `salon-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `salon-images/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file);

            if (uploadError) {
                // If bucket doesn't exist, use a placeholder
                console.error('Upload error:', uploadError);
                // Use a default image URL instead
                setSalonImageUrl(`https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800`);
                return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setSalonImageUrl(publicUrl);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Upload mislukt. Probeer het opnieuw.');
        } finally {
            setImageUploading(false);
        }
    };

    // Add a new service to the list
    const addService = () => {
        if (initialServices.length >= 5) {
            alert('Je kunt maximaal 5 diensten toevoegen tijdens registratie. Meer diensten kun je later toevoegen.');
            return;
        }
        setInitialServices([...initialServices, { name: '', price: 0, duration: 30, category: 'Overig' }]);
    };

    // Remove a service from the list
    const removeService = (index: number) => {
        if (initialServices.length <= 1) {
            alert('Je moet minimaal 1 dienst toevoegen.');
            return;
        }
        setInitialServices(initialServices.filter((_, i) => i !== index));
    };

    // Update a service in the list
    const updateService = (index: number, field: keyof InitialService, value: string | number) => {
        const updated = [...initialServices];
        updated[index] = { ...updated[index], [field]: value };
        setInitialServices(updated);
    };

    const handleSalonFinalSubmit = async () => {
        // Check if payment is required and valid
        const hasValidDiscount = discountCode && checkDiscountCode(discountCode);
        
        // Only require payment if PAYMENT_REQUIRED is true
        if (PAYMENT_REQUIRED && !hasValidDiscount && !paymentMethod) {
            setErrorMsg('Selecteer een betaalmethode of voer een geldige kortingscode in.');
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            // 1. Create Auth User
            const { data, error } = await supabase.auth.signUp({
                email: regEmail,
                password: regPassword,
                options: {
                    data: {
                        full_name: regName,
                        role: 'salon',
                        phone: regPhone
                    }
                }
            });

            if (error) {
                console.error('Auth signup error:', error);
                // Better error message for duplicate email
                if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
                    throw new Error('Dit e-mailadres is al in gebruik. Probeer in te loggen of gebruik een ander e-mailadres.');
                }
                throw error;
            }

            if (!data.user) {
                throw new Error('Gebruiker kon niet worden aangemaakt');
            }

            // Get selected location details
            const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
            if (!selectedLocation) {
                throw new Error('Selecteer een geldige locatie');
            }

            // Build full address from form fields
            const fullAddress = `${regStreet} ${regHouseNumber}, ${selectedLocation.postcode} ${selectedLocation.city}`;
            
            // 2. Wait for the database trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 3. Check if session exists (email confirmation disabled) or not
            if (data.session) {
                // Session exists - we can create salon directly
                
                // Upsert profile to ensure it has correct data
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert(
                        { 
                            id: data.user.id, 
                            email: regEmail, 
                            full_name: regName, 
                            role: 'salon', 
                            phone: regPhone 
                        },
                        { onConflict: 'id' }
                    );
                
                if (profileError) {
                    console.error('Profile upsert error:', profileError);
                }

                // Wait a bit more to ensure profile is committed
                await new Promise(resolve => setTimeout(resolve, 500));

                // Create salon entry with pending status (needs admin approval)
                const { data: salonData, error: salonError } = await supabase
                    .from('salons')
                    .insert({
                        owner_id: data.user.id,
                        name: regSalonName,
                        slug: regSubdomain,
                        subdomain: regSubdomain,
                        status: 'pending',
                        city: selectedLocation.city,
                        zipCode: selectedLocation.postcode,
                        address: fullAddress,
                        location_id: selectedLocation.id,
                        phone: regPhone,
                        description: salonDescription,
                        categories: salonCategories,
                        image_url: salonImageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
                    })
                    .select()
                    .single();
                
                if (salonError) {
                    console.error('Salon creation error:', salonError);
                    
                    if (salonError.code === '23503') {
                        throw new Error('Er ging iets mis met het aanmaken van je profiel. Probeer opnieuw in te loggen.');
                    }
                    
                    throw new Error('Salon aanmaken mislukt: ' + salonError.message);
                }

                console.log('Salon created successfully:', salonData);

                // Create initial services
                const validServices = initialServices.filter(s => s.name && s.price > 0);
                if (validServices.length > 0 && salonData?.id) {
                    const servicesToInsert = validServices.map(s => ({
                        salon_id: salonData.id,
                        name: s.name,
                        price: s.price,
                        duration_minutes: s.duration,
                        category: s.category || salonCategories[0] || 'Overig',
                        active: true
                    }));

                    const { error: servicesError } = await supabase
                        .from('services')
                        .insert(servicesToInsert);

                    if (servicesError) {
                        console.error('Services creation error:', servicesError);
                        // Don't fail the whole registration, just log it
                    } else {
                        console.log('Services created successfully');
                    }
                }

                alert('Salon account aangemaakt! Je salon wordt gecontroleerd door de admin en is daarna zichtbaar.');
                navigate('/dashboard');
            } else {
                // No session - email confirmation required
                // Store salon data in localStorage for later creation after email confirmation
                localStorage.setItem('pendingSalon', JSON.stringify({
                    userId: data.user.id,
                    salonName: regSalonName,
                    subdomain: regSubdomain,
                    city: selectedLocation.city,
                    zipCode: selectedLocation.postcode,
                    address: fullAddress,
                    location_id: selectedLocation.id,
                    phone: regPhone,
                    ownerName: regName,
                    description: salonDescription,
                    categories: salonCategories,
                    imageUrl: salonImageUrl,
                    services: initialServices.filter(s => s.name && s.price > 0)
                }));
                
                alert('Check je email om je account te bevestigen. Daarna kun je inloggen en wordt je salon automatisch aangemaakt.');
                setMode('login');
            }

        } catch (err: any) {
            console.error('Registration error:', err);
            setErrorMsg(err.message || 'Registratie mislukt');
        } finally {
            setLoading(false);
        }
    };

    // Helper to render the step indicator for salons (5 steps now)
    const TOTAL_STEPS = 5;
    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-8 space-x-1">
            {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full transition-colors ${salonStep >= step ? 'bg-brand-400' : 'bg-stone-200'}`} />
                    {step < TOTAL_STEPS && <div className={`h-0.5 w-6 mx-0.5 ${salonStep > step ? 'bg-brand-400' : 'bg-stone-200'}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 w-full">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center">
                     <div className="h-12 w-12 bg-brand-400 rounded-xl flex items-center justify-center text-white">
                        <Scissors size={28} />
                     </div>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-stone-900">
                    {mode === 'login' ? 'Welkom terug' : role === 'salon' ? 'Partner worden' : 'Maak een account aan'}
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                    {mode === 'login' ? 'Nog geen account?' : 'Heb je al een account?'} {' '}
                    <button 
                        onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login');
                            setSalonStep(1);
                            setErrorMsg(null);
                        }}
                        className="font-medium text-brand-600 hover:text-brand-500"
                    >
                        {mode === 'login' ? 'Registreer hier' : 'Log hier in'}
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="py-8 px-4 shadow sm:rounded-3xl sm:px-10">
                    
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center">
                            <AlertCircle size={16} className="mr-2 shrink-0"/>
                            {errorMsg}
                        </div>
                    )}

                    {/* --- LOGIN FORM --- */}
                    {mode === 'login' && (
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <Input 
                                label="E-mailadres" 
                                type="email" 
                                placeholder="naam@voorbeeld.nl" 
                                required 
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                            />
                            <Input 
                                label="Wachtwoord" 
                                type="password" 
                                required 
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                            />
                            
                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-brand-600 hover:text-brand-500">
                                        Wachtwoord vergeten?
                                    </a>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" isLoading={loading}>
                                Inloggen
                            </Button>
                        </form>
                    )}

                    {/* --- REGISTER FORM --- */}
                    {mode === 'register' && (
                        <>
                             {salonStep === 1 && (
                                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setRole('consumer')}
                                        className={`py-2 text-sm font-medium rounded-lg transition-all ${role === 'consumer' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                                    >
                                        Consument
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('salon')}
                                        className={`py-2 text-sm font-medium rounded-lg transition-all ${role === 'salon' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                                    >
                                        Salon Eigenaar
                                    </button>
                                </div>
                            )}

                            {/* CONSUMER REGISTRATION */}
                            {role === 'consumer' && (
                                <form className="space-y-6" onSubmit={handleConsumerRegister}>
                                    <Input 
                                        label="Volledige naam" 
                                        placeholder="Jan Jansen" 
                                        required 
                                        value={regName}
                                        onChange={e => setRegName(e.target.value)}
                                    />
                                    <Input 
                                        label="E-mailadres" 
                                        type="email" 
                                        placeholder="naam@voorbeeld.nl" 
                                        required 
                                        value={regEmail}
                                        onChange={e => setRegEmail(e.target.value)}
                                    />
                                    <Input 
                                        label="Telefoonnummer" 
                                        type="tel" 
                                        placeholder="06 1234 5678" 
                                        required 
                                        value={regUserPhone}
                                        onChange={e => setRegUserPhone(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <input id="allow-contact" type="checkbox" checked={regAllowContact} onChange={e => setRegAllowContact(e.target.checked)} className="w-4 h-4 rounded border-stone-200" />
                                        <label htmlFor="allow-contact" className="text-sm text-stone-600">Ik geef toestemming dat salons mij per e-mail mogen contacteren (aanbiedingen / afspraakherinneringen)</label>
                                    </div>
                                    <Input 
                                        label="Wachtwoord" 
                                        type="password" 
                                        required 
                                        value={regPassword}
                                        onChange={e => setRegPassword(e.target.value)}
                                    />
                                    
                                    <Button type="submit" className="w-full" isLoading={loading}>
                                        Registreren
                                    </Button>
                                </form>
                            )}

                            {/* SALON WIZARD */}
                            {role === 'salon' && (
                                <div>
                                    <StepIndicator />
                                    <form onSubmit={salonStep === 5 ? (e) => { e.preventDefault(); handleSalonFinalSubmit(); } : handleSalonNextStep}>
                                        
                                        {/* STEP 1: Account */}
                                        {salonStep === 1 && (
                                            <div className="space-y-5 animate-fadeIn">
                                                <div className="text-center mb-4">
                                                    <h3 className="text-lg font-bold text-stone-900">Maak je account</h3>
                                                    <p className="text-sm text-stone-500">Stap 1 van 5</p>
                                                </div>
                                                <Input 
                                                    label="Jouw Naam" 
                                                    placeholder="Eigenaar naam" 
                                                    required 
                                                    value={regName}
                                                    onChange={e => setRegName(e.target.value)}
                                                />
                                                <Input 
                                                    label="Salon Naam" 
                                                    placeholder="Naam van je salon" 
                                                    required 
                                                    value={regSalonName}
                                                    onChange={e => setRegSalonName(e.target.value)}
                                                />
                                                
                                                <div className="w-full">
                                                    <label className="mb-2 block text-sm font-medium text-stone-700">Jouw Salon URL</label>
                                                    <div className="relative">
                                                        <div className="flex rounded-xl shadow-sm ring-1 ring-inset ring-stone-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-400">
                                                            <input
                                                                type="text"
                                                                className="block flex-1 border-0 bg-transparent py-2.5 pl-3 pr-2 text-stone-900 placeholder:text-stone-400 focus:ring-0 sm:text-sm sm:leading-6 font-medium"
                                                                placeholder="salon-naam"
                                                                value={regSubdomain}
                                                                onChange={handleSubdomainChange}
                                                                required
                                                            />
                                                            <span className="flex select-none items-center pr-3 text-stone-400 sm:text-sm bg-stone-50 border-l border-stone-200 rounded-r-xl">
                                                                .mijnbeautyafspraken.nl
                                                            </span>
                                                        </div>
                                                        {subdomainStatus === 'available' && regSubdomain && (
                                                            <div className="absolute right-[190px] top-3 text-green-500 pointer-events-none">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Input 
                                                    label="E-mailadres" 
                                                    type="email" 
                                                    required 
                                                    value={regEmail}
                                                    onChange={e => setRegEmail(e.target.value)}
                                                />
                                                <Input 
                                                    label="Wachtwoord" 
                                                    type="password" 
                                                    required 
                                                    value={regPassword}
                                                    onChange={e => setRegPassword(e.target.value)}
                                                />
                                                <Button 
                                                    type="submit" 
                                                    className="w-full mt-4"
                                                    disabled={subdomainStatus === 'taken' || !regSubdomain}
                                                >
                                                    Volgende <ArrowRight size={16} className="ml-2" />
                                                </Button>
                                            </div>
                                        )}

                                        {/* STEP 2: Address */}
                                        {salonStep === 2 && (
                                            <div className="space-y-5 animate-fadeIn">
                                                 <div className="text-center mb-4">
                                                    <h3 className="text-lg font-bold text-stone-900">Salon Locatie</h3>
                                                    <p className="text-sm text-stone-500">Stap 2 van 5 - Waar kunnen klanten je vinden?</p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="col-span-2">
                                                        <Input 
                                                            label="Straat" 
                                                            placeholder="Kerkstraat" 
                                                            required 
                                                            value={regStreet}
                                                            onChange={e => setRegStreet(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input 
                                                            label="Nr" 
                                                            placeholder="12" 
                                                            required 
                                                            value={regHouseNumber}
                                                            onChange={e => setRegHouseNumber(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Locatie (Postcode + Plaats) *
                                                    </label>
                                                    <select
                                                        value={selectedLocationId || ''}
                                                        onChange={e => setSelectedLocationId(e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    >
                                                        <option value="">Selecteer een locatie</option>
                                                        {locations.map(location => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.postcode} - {location.city} ({location.province})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <Input 
                                                    label="Telefoonnummer (Zakelijk)" 
                                                    placeholder="020 - 123 45 67" 
                                                    required 
                                                    value={regPhone}
                                                    onChange={e => setRegPhone(e.target.value)}
                                                />
                                                
                                                <div className="flex gap-3 mt-6">
                                                    <Button type="button" variant="outline" onClick={() => setSalonStep(1)}>
                                                        <ArrowLeft size={16} />
                                                    </Button>
                                                    <Button type="submit" className="flex-1">
                                                        Volgende <ArrowRight size={16} className="ml-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3: Salon Profile (NEW) */}
                                        {salonStep === 3 && (
                                            <div className="space-y-5 animate-fadeIn">
                                                <div className="text-center mb-4">
                                                    <h3 className="text-lg font-bold text-stone-900">Salon Profiel</h3>
                                                    <p className="text-sm text-stone-500">Stap 3 van 5 - Laat je salon zien!</p>
                                                </div>

                                                {/* Category Selection */}
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 mb-2">Type Salon * (meerdere mogelijk)</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {SALON_CATEGORIES.map(cat => (
                                                            <label
                                                                key={cat.value}
                                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center ${
                                                                    salonCategories.includes(cat.value) 
                                                                        ? 'border-brand-400 bg-brand-50 text-brand-700' 
                                                                        : 'border-stone-200 hover:border-brand-200 text-stone-600'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={salonCategories.includes(cat.value)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSalonCategories(prev => [...prev, cat.value]);
                                                                        } else {
                                                                            setSalonCategories(prev => prev.filter(c => c !== cat.value));
                                                                        }
                                                                    }}
                                                                    className="mr-2"
                                                                />
                                                                <span className="text-lg mr-2">{cat.icon}</span>
                                                                <span className="text-sm font-medium">{cat.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 mb-2">Beschrijving *</label>
                                                    <textarea
                                                        placeholder="Vertel iets over je salon... Wat maakt jouw salon uniek? Welke sfeer kunnen klanten verwachten?"
                                                        value={salonDescription}
                                                        onChange={e => setSalonDescription(e.target.value)}
                                                        rows={4}
                                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                                                    />
                                                    <p className="text-xs text-stone-400 mt-1">{salonDescription.length}/500 karakters (min. 20)</p>
                                                </div>

                                                {/* Image Upload */}
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 mb-2">Salon Afbeelding</label>
                                                    <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center hover:border-brand-300 transition-colors">
                                                        {salonImageUrl ? (
                                                            <div className="relative">
                                                                <img 
                                                                    src={salonImageUrl} 
                                                                    alt="Salon preview" 
                                                                    className="w-full h-32 object-cover rounded-lg"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSalonImageUrl('')}
                                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer block">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleImageUpload}
                                                                    className="hidden"
                                                                    disabled={imageUploading}
                                                                />
                                                                {imageUploading ? (
                                                                    <div className="py-4">
                                                                        <Loader2 className="mx-auto animate-spin text-brand-400" size={32} />
                                                                        <p className="text-sm text-stone-500 mt-2">Uploaden...</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="py-4">
                                                                        <Image className="mx-auto text-stone-300" size={40} />
                                                                        <p className="text-sm text-stone-500 mt-2">Klik om een afbeelding te uploaden</p>
                                                                        <p className="text-xs text-stone-400">JPG, PNG (max 5MB)</p>
                                                                    </div>
                                                                )}
                                                            </label>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-stone-400 mt-1">Optioneel - Je kunt dit later toevoegen</p>
                                                </div>

                                                <div className="flex gap-3 mt-6">
                                                    <Button type="button" variant="outline" onClick={() => setSalonStep(2)}>
                                                        <ArrowLeft size={16} />
                                                    </Button>
                                                    <Button type="submit" className="flex-1">
                                                        Volgende <ArrowRight size={16} className="ml-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 4: Initial Services (NEW) */}
                                        {salonStep === 4 && (
                                            <div className="space-y-5 animate-fadeIn">
                                                <div className="text-center mb-4">
                                                    <h3 className="text-lg font-bold text-stone-900">Je Diensten</h3>
                                                    <p className="text-sm text-stone-500">Stap 4 van 5 - Voeg minimaal 1 dienst toe</p>
                                                </div>

                                                <div className="space-y-4">
                                                    {initialServices.map((service, index) => (
                                                        <div key={index} className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-sm font-medium text-stone-700">Dienst {index + 1}</span>
                                                                {initialServices.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeService(index)}
                                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="space-y-3">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Naam van dienst (bv. Knippen)"
                                                                    value={service.name}
                                                                    onChange={e => updateService(index, 'name', e.target.value)}
                                                                    className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                                                                />
                                                                
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="relative">
                                                                        <Euro size={14} className="absolute left-3 top-3 text-stone-400" />
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Prijs"
                                                                            value={service.price || ''}
                                                                            onChange={e => updateService(index, 'price', Number(e.target.value))}
                                                                            className="w-full h-10 pl-8 pr-3 rounded-lg border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                                                                        />
                                                                    </div>
                                                                    <div className="relative">
                                                                        <Clock size={14} className="absolute left-3 top-3 text-stone-400" />
                                                                        <select
                                                                            value={service.duration}
                                                                            onChange={e => updateService(index, 'duration', Number(e.target.value))}
                                                                            className="w-full h-10 pl-8 pr-3 rounded-lg border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                                                                        >
                                                                            {DURATION_OPTIONS.map(opt => (
                                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {initialServices.length < 5 && (
                                                    <button
                                                        type="button"
                                                        onClick={addService}
                                                        className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-500 hover:border-brand-300 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={18} /> Nog een dienst toevoegen
                                                    </button>
                                                )}

                                                <p className="text-xs text-stone-400 text-center">
                                                    Je kunt later meer diensten toevoegen in je dashboard
                                                </p>

                                                <div className="flex gap-3 mt-6">
                                                    <Button type="button" variant="outline" onClick={() => setSalonStep(3)}>
                                                        <ArrowLeft size={16} />
                                                    </Button>
                                                    <Button type="submit" className="flex-1">
                                                        Volgende <ArrowRight size={16} className="ml-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 5: Confirmation */}
                                        {salonStep === 5 && (
                                            <div className="space-y-6 animate-fadeIn">
                                                 <div className="text-center mb-2">
                                                    <h3 className="text-lg font-bold text-stone-900">
                                                        {PAYMENT_REQUIRED ? 'Activeer Abonnement' : 'Bevestig Registratie'}
                                                    </h3>
                                                    <p className="text-sm text-stone-500">Stap 5 van 5 - Controleer je gegevens</p>
                                                </div>

                                                {/* Summary Card */}
                                                <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                                                    <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
                                                        {salonImageUrl ? (
                                                            <img src={salonImageUrl} alt="Salon" className="w-12 h-12 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center text-2xl">
                                                                {SALON_CATEGORIES.filter(c => salonCategories.includes(c.value)).map(c => c.icon).join(' ') || '✨'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-stone-900">{regSalonName}</p>
                                                            <p className="text-xs text-stone-500">{SALON_CATEGORIES.filter(c => salonCategories.includes(c.value)).map(c => c.label).join(', ')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-stone-600 space-y-1">
                                                        <p>📍 {regStreet} {regHouseNumber}, {selectedLocation ? `${selectedLocation.postcode} ${selectedLocation.city}` : ''}</p>
                                                        <p>📧 {regEmail}</p>
                                                        <p>📞 {regPhone}</p>
                                                        <p>🌐 {regSubdomain}.mijnbeautyafspraken.nl</p>
                                                    </div>
                                                    <div className="pt-2 border-t border-stone-200">
                                                        <p className="text-xs font-medium text-stone-500 mb-1">{initialServices.length} dienst{initialServices.length !== 1 ? 'en' : ''} toegevoegd:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {initialServices.map((s, i) => (
                                                                <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-stone-200">
                                                                    {s.name} • €{s.price}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Only show pricing when payment is required */}
                                                {PAYMENT_REQUIRED ? (
                                                    <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center">
                                                        <div className="text-sm font-semibold text-brand-600 mb-1">PRO SALON ABONNEMENT</div>
                                                        <div className="text-3xl font-bold text-stone-900 mb-1">€10<span className="text-sm text-stone-500 font-normal">/maand</span></div>
                                                        <div className="inline-block bg-white text-brand-600 text-xs font-bold px-2 py-1 rounded shadow-sm mb-3">
                                                            EERSTE 2 MAANDEN GRATIS
                                                        </div>
                                                        <ul className="text-sm text-stone-600 space-y-1 text-left px-4">
                                                            <li className="flex items-center"><Check size={14} className="text-green-500 mr-2" /> Maandelijks opzegbaar</li>
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                                                        <div className="text-sm font-semibold text-green-600 mb-1">🎉 GRATIS REGISTRATIE</div>
                                                        <div className="text-xl font-bold text-stone-900 mb-2">Je salon is bijna klaar!</div>
                                                        <ul className="text-sm text-stone-600 space-y-1 text-left px-4">
                                                            <li className="flex items-center"><Check size={14} className="text-green-500 mr-2" /> Volledig gratis tijdens de lanceringsperiode</li>
                                                            <li className="flex items-center"><Check size={14} className="text-green-500 mr-2" /> Je salon wordt zichtbaar na goedkeuring</li>
                                                            <li className="flex items-center"><Check size={14} className="text-green-500 mr-2" /> Direct toegang tot je dashboard</li>
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Discount Code Section - only when payment required */}
                                                {PAYMENT_REQUIRED && (
                                                <div className="border-b border-stone-200 pb-4">
                                                    <label className="text-sm font-medium text-stone-700 mb-2 block">Heb je een kortingscode?</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Voer kortingscode in"
                                                            value={discountCode}
                                                            onChange={(e) => {
                                                                setDiscountCode(e.target.value);
                                                                if (e.target.value) {
                                                                    checkDiscountCode(e.target.value);
                                                                } else {
                                                                    setDiscountCodeValid(null);
                                                                }
                                                            }}
                                                            className={`w-full h-11 px-4 pr-10 rounded-xl border text-sm outline-none transition-colors ${
                                                                discountCodeValid === true 
                                                                    ? 'border-green-400 bg-green-50 focus:ring-green-400' 
                                                                    : discountCodeValid === false 
                                                                        ? 'border-red-300 bg-red-50' 
                                                                        : 'border-stone-200 focus:ring-brand-400'
                                                            } focus:ring-2`}
                                                        />
                                                        {discountCodeValid === true && (
                                                            <div className="absolute right-3 top-3 text-green-500">
                                                                <CheckCircle2 size={18} />
                                                            </div>
                                                        )}
                                                        {discountCodeValid === false && discountCode && (
                                                            <div className="absolute right-3 top-3 text-red-500">
                                                                <AlertCircle size={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {discountCodeValid === true && (
                                                        <p className="text-green-600 text-xs mt-1.5 flex items-center">
                                                            <CheckCircle2 size={12} className="mr-1" /> Kortingscode geaccepteerd! Je kunt gratis starten.
                                                        </p>
                                                    )}
                                                    {discountCodeValid === false && discountCode && (
                                                        <p className="text-red-500 text-xs mt-1.5">Ongeldige kortingscode</p>
                                                    )}
                                                </div>
                                                )}

                                                {/* Payment Method - Only show if payment is required and no valid discount code */}
                                                {PAYMENT_REQUIRED && !discountCodeValid && (
                                                <div>
                                                    <label className="text-sm font-medium text-stone-700 mb-2 block">Betaalmethode voor verificatie</label>
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setPaymentMethod('ideal')}
                                                            className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl font-medium text-sm transition-all ${paymentMethod === 'ideal' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-stone-100 bg-white text-stone-500 hover:border-brand-200'}`}
                                                        >
                                                            <Landmark size={24} className="mb-1" /> 
                                                            iDEAL
                                                        </button>
                                                         <button 
                                                            type="button" 
                                                            onClick={() => setPaymentMethod('creditcard')}
                                                            className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl font-medium text-sm transition-all ${paymentMethod === 'creditcard' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-stone-100 bg-white text-stone-500 hover:border-brand-200'}`}
                                                        >
                                                            <CreditCard size={24} className="mb-1" /> 
                                                            Creditcard
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-stone-400 text-center">Stripe integratie komt binnenkort</p>
                                                </div>
                                                )}
                                                
                                                <div className="flex gap-3">
                                                    <Button type="button" variant="outline" onClick={() => setSalonStep(4)}>
                                                        <ArrowLeft size={16} />
                                                    </Button>
                                                    <Button 
                                                        type="submit" 
                                                        className="flex-1"
                                                        isLoading={loading}
                                                        disabled={PAYMENT_REQUIRED && !discountCodeValid && !paymentMethod}
                                                    >
                                                        {!PAYMENT_REQUIRED ? 'Gratis Registreren' : (discountCodeValid ? 'Gratis Starten' : 'Registreren & Starten')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};