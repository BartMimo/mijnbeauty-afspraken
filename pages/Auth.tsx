import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, User, Store, Briefcase, ShieldCheck, ArrowRight, ArrowLeft, Check, Landmark, CreditCard, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../components/UIComponents';
import { MOCK_SALONS } from '../services/mockData';
import { supabase } from '../lib/supabase';

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
    
    // Subdomain Logic
    const [regSubdomain, setRegSubdomain] = useState('');
    const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'available' | 'taken'>('idle');

    const [paymentMethod, setPaymentMethod] = useState<'ideal' | 'creditcard' | null>(null);
    const [selectedBank, setSelectedBank] = useState<string>('');

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

    useEffect(() => {
        if (regSalonName && subdomainStatus === 'idle') {
            const slug = createSlug(regSalonName);
            setRegSubdomain(slug);
            checkAvailability(slug);
        }
    }, [regSalonName]);

    const checkAvailability = (slug: string) => {
        if (!slug) {
            setSubdomainStatus('idle');
            return;
        }
        // In real app: check Supabase 'salons' table for slug uniqueness
        const taken = MOCK_SALONS.some(s => s.subdomain === slug);
        setSubdomainStatus(taken ? 'taken' : 'available');
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

            // AuthContext will pick up the change and redirect
            // But we can force redirect based on metadata if needed
            // For now, let AuthContext handle the redirect based on role or simple navigation
            
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

        try {
            const { data, error } = await supabase.auth.signUp({
                email: regEmail,
                password: regPassword,
                options: {
                    data: {
                        full_name: regName,
                        role: 'consumer'
                    }
                }
            });

            if (error) throw error;
            // Ensure a profile row exists regardless of DB hooks
            // Upsert profile only if we have a session (auth.uid available under RLS)
            if (data.user && data.session) {
                await supabase
                    .from('profiles')
                    .upsert(
                        { id: data.user.id, email: regEmail, full_name: regName, role: 'consumer' },
                        { onConflict: 'id' }
                    );
            }
            
            alert('Account aangemaakt! Controleer je e-mail voor bevestiging (of log in als dit een testomgeving is).');
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
        setSalonStep(prev => prev + 1);
    };

    const handleSalonFinalSubmit = async () => {
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
                        role: 'salon'
                    }
                }
            });

            if (error) throw error;

            // 2. Create Salon Entry (If User creation successful)
            if (data.user && data.session) {
                // Upsert profile only if we have a session (auth.uid available under RLS)
                await supabase
                    .from('profiles')
                    .upsert(
                        { id: data.user.id, email: regEmail, full_name: regName, role: 'salon' },
                        { onConflict: 'id' }
                    );
                const { error: salonError } = await supabase
                    .from('salons')
                    .insert([
                        {
                            owner_id: data.user.id,
                            name: regSalonName,
                            slug: regSubdomain,
                            city: 'Amsterdam', // Default for now, usually form step 2
                            address: 'Kerkstraat 12' // Default
                        }
                    ]);
                
                if (salonError) console.error('Salon creation warning:', salonError);
            }

            alert('Salon account aangemaakt! Welkom.');
            if (data.session) {
                navigate('/dashboard');
            } else {
                setMode('login');
            }

        } catch (err: any) {
            setErrorMsg(err.message || 'Registratie mislukt');
        } finally {
            setLoading(false);
        }
    };

    // Helper to render the step indicator for salons
    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-8 space-x-2">
            {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full transition-colors ${salonStep >= step ? 'bg-brand-400' : 'bg-stone-200'}`} />
                    {step < 3 && <div className={`h-0.5 w-8 mx-1 ${salonStep > step ? 'bg-brand-400' : 'bg-stone-200'}`} />}
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
                                    <form onSubmit={salonStep === 3 ? (e) => { e.preventDefault(); handleSalonFinalSubmit(); } : handleSalonNextStep}>
                                        
                                        {/* STEP 1: Account */}
                                        {salonStep === 1 && (
                                            <div className="space-y-5 animate-fadeIn">
                                                <div className="text-center mb-4">
                                                    <h3 className="text-lg font-bold text-stone-900">Maak je account</h3>
                                                    <p className="text-sm text-stone-500">Stap 1 van 3</p>
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

                                        {/* STEP 2: Details */}
                                        {salonStep === 2 && (
                                            <div className="space-y-5 animate-fadeIn">
                                                 <div className="text-center mb-4">
                                                    <h3 className="text-lg font-bold text-stone-900">Salon Gegevens</h3>
                                                    <p className="text-sm text-stone-500">Waar kunnen klanten je vinden?</p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="col-span-2">
                                                        <Input label="Straat" placeholder="Kerkstraat" required />
                                                    </div>
                                                    <div>
                                                        <Input label="Nr" placeholder="12" required />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <Input label="Postcode" placeholder="1234 AB" required />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <Input label="Plaats" placeholder="Amsterdam" required />
                                                    </div>
                                                </div>
                                                <Input label="Telefoonnummer (Zakelijk)" placeholder="020 - 123 45 67" required />
                                                
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

                                        {/* STEP 3: Subscription */}
                                        {salonStep === 3 && (
                                            <div className="space-y-6 animate-fadeIn">
                                                 <div className="text-center mb-2">
                                                    <h3 className="text-lg font-bold text-stone-900">Activeer Abonnement</h3>
                                                </div>
                                                
                                                <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center">
                                                    <div className="text-sm font-semibold text-brand-600 mb-1">PRO SALON ABONNEMENT</div>
                                                    <div className="text-3xl font-bold text-stone-900 mb-1">€10<span className="text-sm text-stone-500 font-normal">/maand</span></div>
                                                    <div className="inline-block bg-white text-brand-600 text-xs font-bold px-2 py-1 rounded shadow-sm mb-3">
                                                        EERSTE MAAND GRATIS
                                                    </div>
                                                    <ul className="text-sm text-stone-600 space-y-1 text-left px-4">
                                                        <li className="flex items-center"><Check size={14} className="text-green-500 mr-2" /> Maandelijks opzegbaar</li>
                                                    </ul>
                                                </div>

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
                                                </div>
                                                
                                                <div className="flex gap-3">
                                                    <Button type="button" variant="outline" onClick={() => setSalonStep(2)}>
                                                        <ArrowLeft size={16} />
                                                    </Button>
                                                    <Button 
                                                        type="submit" 
                                                        className="flex-1"
                                                        isLoading={loading}
                                                        disabled={!paymentMethod}
                                                    >
                                                        Registreren & Starten
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