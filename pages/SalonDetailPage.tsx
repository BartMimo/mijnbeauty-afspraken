import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Euro, Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag, Zap, Phone, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { Button, Card, Badge } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Service, Deal } from '../types';

class ErrorBoundary extends React.Component<{children?: React.ReactNode}, {error?: any}> {
    constructor(props: any) {
        super(props);
        this.state = { error: undefined };
    }

    componentDidCatch(error: any, info: any) {
        console.error('ErrorBoundary caught:', error, info);
        this.setState({ error });
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen flex items-center justify-center p-8 bg-red-50 text-red-800">
                    <div>
                        <h2 className="font-bold mb-2">Er is iets misgegaan</h2>
                        <pre className="text-xs whitespace-pre-wrap">{this.state.error?.message || String(this.state.error)}</pre>
                    </div>
                </div>
            );
        }
        return this.props.children as React.ReactElement;
    }
}

interface Appointment {
    date: string;
    time: string;
    duration_minutes: number;
}

interface SalonDetailPageProps {
    subdomain?: string;
}

export const SalonDetailPage: React.FC<SalonDetailPageProps> = ({ subdomain }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const salonId = subdomain || id;
    
    console.log('=== SalonDetailPage Mounted ===');
    console.log('Subdomain prop:', subdomain);
    console.log('URL param id:', id);
    console.log('Final salonId:', salonId);

    const [debug] = React.useState(() => {
        try {
            return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';
        } catch {
            return false;
        }
    });
    
    const [salon, setSalon] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [bookingStep, setBookingStep] = useState<'service' | 'time' | 'confirm'>('service');
    const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date()); 
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Derived current service (always compute, even if null)
    const currentService = salon?.services?.find((s: any) => s.id === selectedService) || null;

    // Generate all possible time slots (30-min intervals from 09:00 to 17:30)
    const allTimeSlots = useMemo(() => {
        const slots: string[] = [];
        for (let hour = 9; hour < 18; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 17 || (hour === 17 && false)) { // Don't add 17:30 if closing at 18:00
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        return slots;
    }, []);

    // Calculate available times based on existing appointments and selected service duration
    const availableTimes = useMemo(() => {
        if (!selectedDate || !currentService) return allTimeSlots;

        const dateStr = selectedDate.toISOString().split('T')[0];
        const serviceDuration = (currentService?.durationMinutes ?? 30);
        const slotsNeeded = Math.ceil(serviceDuration / 30);

        // Get all appointments for the selected date
        const dayAppointments = existingAppointments.filter(apt => apt.date === dateStr);

        // Helper to convert time string to minutes from midnight
        const timeToMinutes = (time?: string) => {
            if (!time || typeof time !== 'string') return -1;
            const parts = time.split(':').map(Number);
            if (parts.length < 2 || parts.some(isNaN)) return -1;
            const [hours, mins] = parts;
            return hours * 60 + mins;
        };

        // Helper to check if a slot overlaps with an appointment
        const isSlotBlocked = (slotTime: string, duration: number) => {
            const slotStart = timeToMinutes(slotTime);
            if (slotStart < 0) return true; // if slot time invalid, consider blocked
            const slotEnd = slotStart + duration;

            return dayAppointments.some(apt => {
                const aptStart = timeToMinutes(apt.time);
                if (aptStart < 0) return false; // ignore appointments with invalid time
                const aptEnd = aptStart + (apt.duration_minutes || 30);

                // Check for any overlap
                return (slotStart < aptEnd && slotEnd > aptStart);
            });
        };

        // Filter available slots
        return allTimeSlots.filter(time => {
            // Check if this slot and all needed subsequent slots are available
            const startMinutes = timeToMinutes(time);
            if (startMinutes < 0) return false;

            // Don't allow booking if end time would be after 18:00
            if (startMinutes + serviceDuration > 18 * 60) return false;

            // Check if any needed slot is blocked
            return !isSlotBlocked(time, serviceDuration);
        });
    }, [selectedDate, currentService, existingAppointments, allTimeSlots]);

    // Fetch salon data from Supabase
    useEffect(() => {
        const fetchSalon = async () => {
            if (!salonId) {
                console.error('No salonId provided');
                setLoading(false);
                return;
            }

            console.log('=== Fetching salon:', salonId);

            try {
                setLoading(true);
                
                // Try slug first (for /salon/beauty-test-studio), then fallback to UUID
                let { data, error } = await supabase
                    .from('salons')
                    .select(`
                        *,
                        services(*)
                    `)
                    .eq('slug', salonId)
                    .maybeSingle();

                if (!data && !error) {
                    const result = await supabase
                        .from('salons')
                        .select(`
                            *,
                            services(*)
                        `)
                        .eq('id', salonId)
                        .maybeSingle();
                    data = result.data;
                    error = result.error;
                }

                console.log('Query result:', { data, error });

                if (error || !data) {
                    console.error('No salon found', error);
                    setLoading(false);
                    return;
                }

                console.log('Found salon:', data.name);

                setSalon({
                    id: data.slug || data.id,
                    supabaseId: data.id,
                    name: data.name,
                    city: data.city || '',
                    address: data.address || '',
                    description: data.description || 'Welkom bij onze salon!',
                    rating: 4.5,
                    reviewCount: 0,
                    email: data.email,
                    phone: data.phone,
                    services: (data.services || []).map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        description: s.description || '',
                        price: s.price,
                        durationMinutes: s.duration_minutes,
                        category: 'Nails'
                    })),
                    image: data.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
                });

                // Fetch deals separately
                const { data: dealsData } = await supabase
                    .from('deals')
                    .select('*')
                    .eq('salon_id', data.id);

                if (dealsData) {
                    setActiveDeals(dealsData.map((d: any) => ({
                        id: d.id,
                        salonId: data.slug || data.id,
                        salonName: data.name,
                        salonCity: data.city,
                        serviceName: d.service_name,
                        originalPrice: d.original_price,
                        discountPrice: d.discount_price,
                        date: d.date,
                        time: d.time,
                        description: d.description || ''
                    })));
                }

                // Fetch existing appointments for this salon
                const { data: appointmentsData } = await supabase
                    .from('appointments')
                    .select('date, time, duration_minutes')
                    .eq('salon_id', data.id)
                    .neq('status', 'cancelled');

                if (appointmentsData) {
                    setExistingAppointments(appointmentsData.map(a => ({
                        date: a.date,
                        time: a.time,
                        duration_minutes: a.duration_minutes || 30
                    })));
                }
            } catch (err) {
                console.error('Error in fetchSalon:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSalon();
    }, [salonId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-500" size={32} />
            </div>
        );
    }

    if (!salon) return <div className="p-8 text-center">Salon niet gevonden</div>;

    // --- Helpers for contact links ---
    const getWhatsAppLink = (phone?: string) => {
        if (!phone) return '#';
        // Cleanup phone number: remove spaces, dashes, replace leading 0 with 31
        let clean = phone.replace(/\D/g, '');
        if (clean.startsWith('0')) clean = '31' + clean.substring(1);
        return `https://wa.me/${clean}`;
    };

    // --- Actions ---

    const handleBookService = (serviceId: string) => {
        setSelectedService(serviceId);
        setSelectedDeal(null); // Clear deal selection
        setBookingStep('time');
        scrollToWidget();
    };

    const handleBookDeal = (deal: Deal) => {
        setSelectedDeal(deal);
        setSelectedService(null); // Clear service selection
        
        // For deals, we often skip date selection if it's fixed, 
        // but for this demo we'll jump straight to confirm to show the deal price logic
        setBookingStep('confirm'); 
        scrollToWidget();
    };

    const scrollToWidget = () => {
        setTimeout(() => {
             document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Calendar helpers (kept here but defined before early returns to ensure stable hooks order)
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => {
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
        setCurrentDate(new Date(newDate));
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getFullYear() === d2.getFullYear();
    };

    const isPast = (d: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return d < today;
    };


    const formatDateDutch = (date: Date) => {
        return new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' }).format(date);
    };

    return (
        <ErrorBoundary>
        <div className="bg-stone-50 min-h-screen pb-12">
            {/* Header Image */}
            <div className="h-64 md:h-80 w-full overflow-hidden relative">
                <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-12 text-white container mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold">{salon.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center text-sm md:text-base"><MapPin size={16} className="mr-1" /> {salon.city}</span>
                        <span className="flex items-center text-sm md:text-base"><Star size={16} className="mr-1 fill-yellow-400 text-yellow-400" /> {salon.rating} ({salon.reviewCount})</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-10 grid md:grid-cols-3 gap-8">
                {/* Left Column: Info & Services */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">Over {salon.name}</h2>
                        </div>
                        <p className="text-stone-600 leading-relaxed mb-6">{salon.description}</p>
                        
                        {/* Contact Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                            {salon.phone && (
                                <a 
                                    href={`tel:${salon.phone}`} 
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 hover:text-stone-900 transition-colors"
                                >
                                    <Phone size={18} />
                                    Bellen
                                </a>
                            )}
                             {salon.phone && (
                                <a 
                                    href={getWhatsAppLink(salon.phone)} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 text-green-700 bg-green-50 font-medium hover:bg-green-100 transition-colors"
                                >
                                    <MessageCircle size={18} />
                                    WhatsApp
                                </a>
                            )}
                            {salon.email && (
                                <a 
                                    href={`mailto:${salon.email}`} 
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 hover:text-stone-900 transition-colors"
                                >
                                    <Mail size={18} />
                                    Mailen
                                </a>
                            )}
                        </div>

                        <div className="pt-6 border-t border-stone-100 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-semibold text-stone-900 mb-2">Adres</h4>
                                <p className="text-stone-500">{salon.address}<br/>{salon.zipCode} {salon.city}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-stone-900 mb-2">Openingstijden</h4>
                                <p className="text-stone-500">Ma - Vr: 09:00 - 18:00<br/>Za: 10:00 - 17:00</p>
                            </div>
                        </div>
                    </Card>

                    {/* DEALS SECTION */}
                    {activeDeals.length > 0 && (
                        <div id="deals-list">
                            <h2 className="text-xl font-bold mb-4 px-2 flex items-center">
                                <Zap className="text-brand-500 mr-2 fill-brand-500" size={20}/> Actieve Deals
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {activeDeals.map(deal => {
                                    const discount = Math.round(((deal.originalPrice - deal.discountPrice) / deal.originalPrice) * 100);
                                    return (
                                        <div key={deal.id} className="bg-white rounded-2xl p-4 border border-brand-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 bg-brand-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                                                -{discount}%
                                            </div>
                                            <div className="mb-3">
                                                <h3 className="font-bold text-stone-900 truncate pr-8">{deal.serviceName}</h3>
                                                <div className="flex items-center text-xs text-stone-500 mt-1">
                                                    <Clock size={12} className="mr-1" /> {deal.time}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end mt-4">
                                                <div>
                                                    <span className="text-xs text-stone-400 line-through block">€{deal.originalPrice}</span>
                                                    <span className="text-lg font-bold text-brand-600">€{deal.discountPrice}</span>
                                                </div>
                                                <Button size="sm" onClick={() => handleBookDeal(deal)}>
                                                    Boek Deal
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div id="services-list">
                        <h2 className="text-xl font-bold mb-4 px-2">Diensten</h2>
                        <div className="space-y-4">
                            {salon.services.map(service => (
                                <Card key={service.id} className="p-4 md:p-6 flex justify-between items-center hover:border-brand-200 transition-colors">
                                    <div>
                                        <h3 className="font-semibold text-stone-900 text-lg">{service.name}</h3>
                                        <p className="text-sm text-stone-500 mb-2">{service.description}</p>
                                        <div className="flex items-center gap-3 text-sm text-stone-500">
                                            <span className="flex items-center"><Clock size={14} className="mr-1" /> {service.durationMinutes} min</span>
                                            <span className="flex items-center font-medium text-stone-900"><Euro size={14} className="mr-1" /> {service.price}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleBookService(service.id)}
                                        variant={selectedService === service.id ? 'primary' : 'outline'}
                                    >
                                        Boeken
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Reviews */}
                     <Card className="p-8">
                        <h2 className="text-xl font-bold mb-6">Reviews</h2>
                        <div className="space-y-6">
                            {[].map((review: any) => (
                                <div key={review.id} className="border-b border-stone-100 last:border-0 pb-6 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold">{review.user}</span>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-stone-200"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-stone-600 text-sm">"{review.text}"</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Booking Widget */}
                <div className="relative">
                    <div className="sticky top-24" id="booking-widget">
                        <Card className="p-6 border-brand-100 shadow-lg transition-all duration-300">
                            <h3 className="text-lg font-bold mb-4 border-b border-stone-100 pb-2">Je afspraak</h3>
                            
                            {!selectedService && !selectedDeal ? (
                                <div className="text-center py-8 text-stone-500">
                                    <p>Selecteer een dienst of deal om te boeken.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    
                                    {/* SELECTION DISPLAY */}
                                    {selectedDeal ? (
                                        <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex justify-between items-start animate-fadeIn relative overflow-hidden">
                                            <div className="absolute -right-4 -top-4 bg-brand-200 w-12 h-12 rounded-full opacity-50"></div>
                                            <div>
                                                <div className="flex items-center gap-1 mb-1">
                                                     <Badge variant="warning">DEAL</Badge>
                                                </div>
                                                <h4 className="font-bold text-stone-900">{selectedDeal.serviceName}</h4>
                                                <p className="text-xs text-stone-600 mt-1 flex items-center">
                                                    <Clock size={12} className="mr-1"/> {selectedDeal.time}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-stone-400 line-through block">€{selectedDeal.originalPrice}</span>
                                                <span className="font-bold text-lg text-brand-600">€{selectedDeal.discountPrice}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex justify-between items-start animate-fadeIn">
                                            <div>
                                                <h4 className="font-medium text-stone-900">{currentService?.name}</h4>
                                                <p className="text-xs text-stone-500 mt-1">{currentService?.durationMinutes} min</p>
                                            </div>
                                            <span className="font-bold text-stone-700">€{currentService?.price}</span>
                                        </div>
                                    )}

                                    {/* CALENDAR (Only if standard service is selected) */}
                                    {selectedService && bookingStep === 'time' && (
                                        <div className="animate-fadeIn">
                                            {/* Month Navigation */}
                                            <div className="flex justify-between items-center mb-4">
                                                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-stone-100 rounded-full"><ChevronLeft size={20}/></button>
                                                <span className="font-semibold text-stone-800 capitalize">
                                                    {currentDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}
                                                </span>
                                                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-stone-100 rounded-full"><ChevronRight size={20}/></button>
                                            </div>

                                            {/* Days Grid */}
                                            <div className="grid grid-cols-7 text-center text-xs text-stone-400 font-medium mb-2">
                                                <div>Ma</div><div>Di</div><div>Wo</div><div>Do</div><div>Vr</div><div>Za</div><div>Zo</div>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 mb-6">
                                                {[...Array(firstDayOfMonth(currentDate))].map((_, i) => (
                                                    <div key={`empty-${i}`} className="h-9"></div>
                                                ))}
                                                {[...Array(daysInMonth(currentDate))].map((_, i) => {
                                                    const d = i + 1;
                                                    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                                                    const isSelected = selectedDate && isSameDay(selectedDate, dateObj);
                                                    const isPastDate = isPast(dateObj);
                                                    return (
                                                        <button 
                                                            key={d}
                                                            disabled={isPastDate}
                                                            onClick={() => { setSelectedDate(dateObj); setSelectedTime(null); }}
                                                            className={`h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all ${isSelected ? 'bg-brand-500 text-white font-bold shadow-md' : isPastDate ? 'text-stone-300 cursor-not-allowed' : 'text-stone-700 hover:bg-brand-50 hover:text-brand-600'}`}
                                                        >
                                                            {d}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Time Selection */}
                                            {selectedDate && (
                                                <div className="border-t border-stone-100 pt-4 animate-fadeIn">
                                                    <p className="text-sm font-medium text-stone-700 mb-3">Tijdstip:</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {availableTimes.map(time => (
                                                            <button 
                                                                key={time} 
                                                                onClick={() => setSelectedTime(time)}
                                                                className={`py-2 text-sm rounded-lg border transition-colors ${selectedTime === time ? 'bg-brand-400 text-white border-brand-400 font-medium' : 'border-stone-200 text-stone-600 hover:border-brand-300 hover:bg-brand-50'}`}
                                                            >
                                                                {time}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Button className="w-full mt-6" onClick={() => setBookingStep('confirm')} disabled={!selectedDate || !selectedTime}>
                                                Verder naar gegevens
                                            </Button>
                                        </div>
                                    )}

                                    {/* CONFIRMATION SCREEN */}
                                    {bookingStep === 'confirm' && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div className="p-4 bg-stone-50 rounded-xl space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-stone-500">Behandeling</span>
                                                    <span className="font-medium text-stone-900">{selectedDeal ? selectedDeal.serviceName : currentService?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-stone-500">Datum</span>
                                                    <span className="font-medium text-stone-900">
                                                        {selectedDeal ? 'Volgens afspraak (Deal)' : (selectedDate && formatDateDutch(selectedDate))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-stone-500">Tijd</span>
                                                    <span className="font-medium text-stone-900">
                                                        {selectedDeal ? selectedDeal.time : selectedTime}
                                                    </span>
                                                </div>
                                                <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-base">
                                                    <span>Totaal</span>
                                                    <span className={selectedDeal ? 'text-brand-600' : ''}>
                                                        €{selectedDeal ? selectedDeal.discountPrice : currentService?.price}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                className="w-full" 
                                                onClick={async () => {
                                                    if (!user) {
                                                        alert('Log eerst in om te boeken');
                                                        navigate('/login');
                                                        return;
                                                    }
                                                    
                                                    setBookingLoading(true);
                                                    try {
                                                        const serviceDuration = (currentService?.durationMinutes ?? 30);
                                                        const { error } = await supabase
                                                            .from('appointments')
                                                            .insert([{
                                                                user_id: user.id,
                                                                salon_id: salon.supabaseId,
                                                                service_id: selectedService,
                                                                service_name: currentService?.name,
                                                                date: selectedDate?.toISOString().split('T')[0],
                                                                time: selectedDeal ? selectedDeal.time : selectedTime,
                                                                duration_minutes: serviceDuration,
                                                                price: selectedDeal ? selectedDeal.discountPrice : currentService?.price,
                                                                status: 'confirmed'
                                                            }]);
                                                        
                                                        if (error) throw error;
                                                        
                                                        alert('Boeking succesvol!');
                                                        navigate('/dashboard/user');
                                                    } catch (err: any) {
                                                        console.error('Booking error:', err);
                                                        alert('Boeking mislukt: ' + (err.message || 'Onbekende fout'));
                                                    } finally {
                                                        setBookingLoading(false);
                                                    }
                                                }}
                                                isLoading={bookingLoading}
                                            >
                                                {selectedDeal ? 'Deal Claimen & Boeken' : 'Bevestig Boeking'}
                                            </Button>
                                            
                                            <button 
                                                className="w-full text-center text-xs text-stone-400 hover:text-stone-600 underline"
                                                onClick={() => {
                                                    if(selectedDeal) {
                                                        setSelectedDeal(null);
                                                    } else {
                                                        setBookingStep('time');
                                                    }
                                                }}
                                            >
                                                {selectedDeal ? 'Annuleren' : 'Wijzig datum of tijd'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                        
                        {/* Trust Badges */}
                        <div className="mt-4 flex justify-center gap-4 text-xs text-stone-400">
                             <span className="flex items-center"><Check size={12} className="mr-1" /> Gratis annuleren</span>
                             <span className="flex items-center"><Check size={12} className="mr-1" /> Betaal in salon</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </ErrorBoundary>
    );
};