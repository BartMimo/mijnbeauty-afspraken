import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Euro, Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag, Zap, Phone, Mail, MessageCircle, Loader2, Heart } from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Service } from '../types';
import { insertAppointmentSafe } from '../lib/appointments';

// Salon categories - matches the categories used in registration
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

    const [salon, setSalon] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [bookingStep, setBookingStep] = useState<'service' | 'time' | 'payment' | 'confirm'>('service');
    const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
    // Reviews
    const [reviews, setReviews] = useState<any[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ name: '', rating: 0, text: '' });
    const [hoverRating, setHoverRating] = useState(0);
    
    // Favorite State
    const [isFavorite, setIsFavorite] = useState(false);
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date()); 
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'online' | null>(null);

    // Derived current service (always compute, even if null)
    const currentService = salon?.services?.find((s: any) => s.id === selectedService) || null;

    // Helper to get local date string (YYYY-MM-DD)
    const toLocalDateString = (date: Date) => {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    };

    // Minimum step for time slots (minutes). Using 5 minutes allows arbitrary service durations like 5, 12, 37.
    const SLOT_STEP = 5;

    // Generate all possible time slots (SLOT_STEP intervals from 09:00 to 17:55)
    const allTimeSlots = useMemo(() => {
        const slots: string[] = [];
        for (let hour = 9; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += SLOT_STEP) {
                // don't push times beyond 17:55 (last slot before 18:00)
                if (hour === 17 && minute > 55) continue;
                slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
            }
        }
        return slots;
    }, []);

    // Calculate available times based on opening hours, existing appointments and selected service duration
    const availableTimes = useMemo(() => {
        if (!selectedDate || !currentService) return [];

        // First, generate time slots based on opening hours
        let timeSlotsForDate: string[] = [];
        if (salon?.openingHours) {
            const days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
            const dayOfWeek = days[selectedDate.getDay()];
            const dayHours = salon.openingHours[dayOfWeek];

                if (dayHours && !dayHours.closed) {
                    // Generate time slots every SLOT_STEP minutes between start and end time
                    const times: string[] = [];
                    const [startHour, startMinute] = dayHours.start.split(':').map(Number);
                    const [endHour, endMinute] = dayHours.end.split(':').map(Number);

                    let currentHour = startHour;
                    let currentMinute = startMinute;

                    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
                        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
                        times.push(timeString);

                        // Add SLOT_STEP minutes
                        currentMinute += SLOT_STEP;
                        if (currentMinute >= 60) {
                            currentMinute = currentMinute % 60;
                            currentHour += 1;
                        }
                    }
                    timeSlotsForDate = times;
                }
        } else {
            // Fallback to default times if no opening hours
            timeSlotsForDate = allTimeSlots;
        }

        const dateStr = toLocalDateString(selectedDate);
        const serviceDuration = (currentService?.durationMinutes ?? 30);
        const slotsNeeded = Math.ceil(serviceDuration / SLOT_STEP);

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
        return timeSlotsForDate.filter(time => {
            // Check if this slot and all needed subsequent slots are available
            const startMinutes = timeToMinutes(time);
            if (startMinutes < 0) return false;

            // Don't allow booking if end time would be after salon closing time
            const maxEndTime = salon?.openingHours ? (() => {
                const days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
                const dayOfWeek = days[selectedDate.getDay()];
                const dayHours = salon.openingHours[dayOfWeek];
                if (dayHours && !dayHours.closed) {
                    const [endHour, endMinute] = dayHours.end.split(':').map(Number);
                    return endHour * 60 + endMinute;
                }
                return 18 * 60; // fallback
            })() : 18 * 60;

            if (startMinutes + serviceDuration > maxEndTime) return false;

            // Check if any needed slot is blocked
            return !isSlotBlocked(time, serviceDuration);
        });
    }, [selectedDate, currentService, existingAppointments, salon?.openingHours]);

    // Fetch salon data from Supabase
    useEffect(() => {
        const fetchSalon = async () => {
            if (!salonId) {
                console.error('No salonId provided');
                setLoading(false);
                return;
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('=== Fetching salon:', salonId);
            }

            try {
                setLoading(true);
                
                // Try slug first (for /salon/beauty-test-studio), then fallback to UUID
                let { data, error } = await supabase
                    .from('salons')
                    .select(`
                        *,
                        services(*),
                        opening_hours
                    `)
                    .eq('slug', salonId)
                    .maybeSingle();

                if (!data && !error) {
                    const result = await supabase
                        .from('salons')
                        .select(`
                            *,
                            services(*),
                            opening_hours
                        `)
                        .eq('id', salonId)
                        .maybeSingle();
                    data = result.data;
                    error = result.error;
                }

                if (process.env.NODE_ENV === 'development') {
                    console.log('Query result:', { data, error });
                }

                if (error || !data) {
                    console.error('No salon found', error);
                    setLoading(false);
                    return;
                }

                if (process.env.NODE_ENV === 'development') {
                    console.log('Found salon:', data.name);
                }

                setSalon({
                    id: data.slug || data.id,
                    supabaseId: data.id,
                    name: data.name,
                    zipCode: data.zip_code || data.zipCode || '',
                    city: data.city || '',
                    address: data.address || '',
                    description: data.description || 'Welkom bij onze salon!',
                    categories: data.categories || [],
                    rating: 4.5,
                    reviewCount: 0,
                    email: data.email,
                    phone: data.phone,
                    paymentMethods: data.payment_methods || { cash: true, online: false },
                    services: (data.services || []).map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        description: s.description || '',
                        price: s.price,
                        durationMinutes: s.duration_minutes,
                        category: s.category || 'Overig'
                    })),
                    image: data.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
                    openingHours: data.opening_hours
                });

                // Check if user has this salon as favorite
                if (user) {
                    const { data: favoriteData } = await supabase
                        .from('favorites')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('salon_id', data.id)
                        .maybeSingle();
                    setIsFavorite(!!favoriteData);
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

                // Fetch approved reviews
                try {
                    const { data: reviewsData } = await supabase
                        .from('reviews')
                        .select(`*, profiles:user_id (full_name)`)
                        .eq('salon_id', data.id)
                        .eq('is_approved', true)
                        .order('created_at', { ascending: false });

                    if (reviewsData) {
                        setReviews(reviewsData.map((r: any) => ({
                            id: r.id,
                            user: r.profiles?.full_name || 'Anoniem',
                            rating: r.rating,
                            text: r.comment || r.text || '',
                            date: new Date(r.created_at).toLocaleDateString('nl-NL')
                        })));
                    }
                } catch (e) {
                    console.error('Error fetching reviews:', e);
                }
            } catch (err) {
                console.error('Error in fetchSalon:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSalon();
    }, [salonId, user]);

    // Reset selected date/time if salon opening hours change and selected date is no longer available
    useEffect(() => {
        if (selectedDate && salon?.openingHours && !isDateAvailable(selectedDate)) {
            setSelectedDate(null);
            setSelectedTime(null);
        }
    }, [salon?.openingHours, selectedDate]);

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
        setBookingStep('time');
        scrollToWidget();
    };

    const scrollToWidget = () => {
        setTimeout(() => {
             document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const toggleFavorite = async () => {
        if (!salon || !user) {
            // Redirect to login or show message
            alert('Log in om salons toe te voegen aan je favorieten');
            return;
        }

        try {
            if (isFavorite) {
                // Remove from favorites
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('salon_id', salon.id);
            } else {
                // Add to favorites
                await supabase
                    .from('favorites')
                    .insert({
                        user_id: user.id,
                        salon_id: salon.id
                    });
            }
            setIsFavorite(!isFavorite);
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error toggling favorite:', err);
            }
        }
    };

    // --- Review Actions ---
    const handleOpenReviewModal = () => {
        const userStr = localStorage.getItem('currentUser');
        const localUser = userStr ? JSON.parse(userStr) : null;
        setReviewForm({ name: localUser?.name || '', rating: 0, text: '' });
        setIsReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (reviewForm.rating === 0) {
            alert('Selecteer alstublieft een aantal sterren.');
            return;
        }
        if (!reviewForm.name || !reviewForm.text) {
            alert('Vul alstublieft alle velden in.');
            return;
        }
        if (!user) {
            alert('Log in om een review te plaatsen.');
            return;
        }

        try {
            const { data: newReviewData, error } = await supabase
                .from('reviews')
                .insert({
                    salon_id: salon.supabaseId || salon.id,
                    user_id: user.id,
                    rating: reviewForm.rating,
                    comment: reviewForm.text,
                    is_approved: true
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving review:', error);
                alert('Er ging iets mis bij het opslaan van je review. Probeer het opnieuw.');
                return;
            }

            const newReview = {
                id: newReviewData.id,
                user: reviewForm.name,
                text: reviewForm.text,
                rating: reviewForm.rating,
                created_at: newReviewData.created_at
            };
            setReviews(prev => [newReview, ...prev]);
            setIsReviewModalOpen(false);
            setReviewForm({ name: '', rating: 0, text: '' });
            alert('Bedankt voor je review!');
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Er ging iets mis. Probeer het opnieuw.');
        }
    };

    const flagReview = async (reviewId: string) => {
        if (!user) {
            alert('Log in om een review te rapporteren.');
            return;
        }
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ is_flagged: true, flagged_reason: 'Gerapporteerd door gebruiker' })
                .eq('id', reviewId);
            if (error) throw error;
            alert('Review gerapporteerd. Een moderator zal deze beoordelen.');
        } catch (err) {
            console.error('Error flagging review:', err);
            alert('Er ging iets mis bij het rapporteren.');
        }
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

    // Function to check if salon is open on a given date
    const isSalonOpen = (date: Date) => {
        if (!salon?.openingHours) {
            return true; // Assume open if no opening hours data
        }

        const days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
        const dayOfWeek = days[date.getDay()];

        const dayHours = salon.openingHours[dayOfWeek];
        return dayHours && !dayHours.closed;
    };

    // Function to check if a date is available for booking
    const isDateAvailable = (date: Date) => {
        return !isPast(date) && isSalonOpen(date);
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
                <div className="absolute bottom-0 left-0 p-6 md:p-12 text-white container mx-auto flex justify-between items-end">
                    <div className="max-w-[80%]">
                        <h1 className="text-3xl md:text-5xl font-bold">{salon.name}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center text-sm md:text-base"><MapPin size={16} className="mr-1" /> {salon.city}</span>
                            <span className="flex items-center text-sm md:text-base"><Star size={16} className="mr-1 fill-yellow-400 text-yellow-400" /> {salon.rating} ({salon.reviewCount})</span>
                            {salon.categories && salon.categories.length > 0 && (
                                <div className="flex items-center gap-1 text-sm md:text-base">
                                    {SALON_CATEGORIES.filter(c => salon.categories.includes(c.value)).map(c => (
                                        <span key={c.value} className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                                            <span className="mr-1">{c.icon}</span>
                                            {c.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={toggleFavorite}
                        className={`p-3 rounded-full backdrop-blur-md transition-all hover:scale-105 shadow-lg ${isFavorite ? 'bg-white text-red-500' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        title={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
                    >
                        <Heart size={20} className={isFavorite ? "fill-red-500" : ""} />
                    </button>
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
                                <h4 className="font-semibold text-stone-900 mb-3 flex items-center">
                                    <Clock className="mr-2" size={16} />
                                    Openingstijden
                                </h4>
                                <div className="space-y-2">
                                    {(() => {
                                        const hours = salon.openingHours || {};
                                        const days = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
                                        const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

                                        return days.map((day, index) => {
                                            const dayData = hours[day];
                                            const isClosed = dayData?.closed;

                                            return (
                                                <div key={day} className="flex justify-between items-center py-1">
                                                    <span className={`text-sm font-medium ${isClosed ? 'text-stone-400' : 'text-stone-700'}`}>
                                                        {dayNames[index]}
                                                    </span>
                                                    <span className={`text-sm ${isClosed ? 'text-stone-400 italic' : 'text-stone-600'}`}>
                                                        {isClosed ? 'Gesloten' : `${dayData?.start || '09:00'} - ${dayData?.end || '18:00'}`}
                                                    </span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div id="services-list">
                        {/* Group services by category */}
                        {(() => {
                            const servicesByCategory = salon.services.reduce((acc, service) => {
                                const category = service.category;
                                if (!acc[category]) {
                                    acc[category] = [];
                                }
                                acc[category].push(service);
                                return acc;
                            }, {} as Record<string, Service[]>);

                            return Object.entries(servicesByCategory).map(([category, services]: [string, Service[]]) => (
                                <div key={category} className="mb-8">
                                    <h2 className="text-xl font-bold mb-4 px-2">{category}</h2>
                                    <div className="space-y-4">
                                        {services.map(service => (
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
                            ));
                        })()}
                    </div>

                    {/* Reviews */}
                     <Card className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
                            <Button variant="secondary" size="sm" onClick={handleOpenReviewModal}>
                                Schrijf een review
                            </Button>
                        </div>
                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <div className="text-stone-500 text-sm">Nog geen reviews. Wees de eerste!</div>
                            ) : reviews.map((review: any) => (
                                <div key={review.id} className="border-b border-stone-100 last:border-0 pb-6 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold">{review.user}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-stone-200"} />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => flagReview(review.id)}
                                                className="text-xs text-stone-400 hover:text-red-500 transition-colors"
                                                title="Review rapporteren"
                                            >
                                                🚩
                                            </button>
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
                            
                            {/* SERVICE SELECTION STEP */}
                            {bookingStep === 'service' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="text-center mb-4">
                                        <h4 className="font-semibold text-stone-900 mb-2">Kies een dienst</h4>
                                        <p className="text-sm text-stone-500">Alle beschikbare diensten</p>
                                    </div>

                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {salon?.services?.map((service: any) => (
                                            <button
                                                key={service.id}
                                                onClick={() => {
                                                    setSelectedService(service.id);
                                                    setBookingStep('time');
                                                    scrollToWidget();
                                                }}
                                                className="w-full p-4 border-2 border-stone-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-stone-900">{service.name}</h4>
                                                        <p className="text-sm text-stone-500 mt-1 flex items-center">
                                                            <Clock size={12} className="mr-1"/> {service.durationMinutes} min
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-stone-700">€{service.price}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TIME SELECTION STEP */}
                            {bookingStep === 'time' && selectedService && (
                                <div className="space-y-6 animate-fadeIn">
                                    
                                    {/* SELECTION DISPLAY */}
                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex justify-between items-start animate-fadeIn">
                                        <div>
                                            <h4 className="font-medium text-stone-900">{currentService?.name}</h4>
                                            <p className="text-xs text-stone-500 mt-1">{currentService?.durationMinutes} min</p>
                                        </div>
                                        <span className="font-bold text-stone-700">€{currentService?.price}</span>
                                    </div>

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
                                                    const isClosed = !isSalonOpen(dateObj);
                                                    const isDisabled = isPastDate || isClosed;
                                                    return (
                                                        <button 
                                                            key={d}
                                                            disabled={isDisabled}
                                                            onClick={() => { setSelectedDate(dateObj); setSelectedTime(null); }}
                                                            className={`h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all ${isSelected ? 'bg-brand-500 text-white font-bold shadow-md' : isDisabled ? 'text-stone-300 cursor-not-allowed' : 'text-stone-700 hover:bg-brand-50 hover:text-brand-600'}`}
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

                                            <Button className="w-full mt-6" onClick={() => setBookingStep('payment')} disabled={!selectedDate || !selectedTime}>
                                                Verder naar betaling
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </Card>

                        {/* PAYMENT METHOD SELECTION */}
                        {bookingStep === 'payment' && selectedService && (
                            <Card className="p-6 border-brand-100 shadow-lg transition-all duration-300 mt-4">
                                <h3 className="text-lg font-bold mb-4 border-b border-stone-100 pb-2">Betaalmethode kiezen</h3>
                                <div className="space-y-4 animate-fadeIn">
                                    <p className="text-stone-600 text-sm">Kies hoe je wilt betalen voor je afspraak.</p>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {salon?.paymentMethods?.cash && (
                                            <button
                                                onClick={() => setSelectedPaymentMethod('cash')}
                                                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                                                    selectedPaymentMethod === 'cash'
                                                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                        : 'border-stone-200 hover:border-stone-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                        selectedPaymentMethod === 'cash' ? 'border-brand-500' : 'border-stone-300'
                                                    }`}>
                                                        {selectedPaymentMethod === 'cash' && (
                                                            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Contant betalen</div>
                                                        <div className="text-sm text-stone-500">Betaal ter plekke bij aankomst</div>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                        
                                        {salon?.paymentMethods?.online && (
                                            <button
                                                onClick={() => setSelectedPaymentMethod('online')}
                                                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                                                    selectedPaymentMethod === 'online'
                                                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                        : 'border-stone-200 hover:border-stone-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                        selectedPaymentMethod === 'online' ? 'border-brand-500' : 'border-stone-300'
                                                    }`}>
                                                        {selectedPaymentMethod === 'online' && (
                                                            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Online betalen</div>
                                                        <div className="text-sm text-stone-500">Veilig betalen met creditcard</div>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setBookingStep('time')}
                                            className="flex-1"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Terug
                                        </Button>
                                        <Button 
                                            className="flex-1" 
                                            onClick={() => setBookingStep('confirm')} 
                                            disabled={!selectedPaymentMethod}
                                        >
                                            Verder naar bevestiging
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* CONFIRMATION SCREEN - Outside booking widget card */}
                        {bookingStep === 'confirm' && selectedService && (
                            <Card className="p-6 border-brand-100 shadow-lg transition-all duration-300 mt-4">
                                <h3 className="text-lg font-bold mb-4 border-b border-stone-100 pb-2">Bevestig je afspraak</h3>
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="p-4 bg-stone-50 rounded-xl space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Behandeling</span>
                                            <span className="font-medium text-stone-900">{currentService?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Datum</span>
                                            <span className="font-medium text-stone-900">
                                                {selectedDate && formatDateDutch(selectedDate)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Tijd</span>
                                            <span className="font-medium text-stone-900">
                                                {selectedTime}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Betaalmethode</span>
                                            <span className="font-medium text-stone-900">
                                                {selectedPaymentMethod === 'cash' ? 'Contant' : 'Online'}
                                            </span>
                                        </div>
                                        <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-base">
                                            <span>Totaal</span>
                                            <span>
                                                €{currentService?.price}
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
                                                // Use a resilient insert helper that can retry without missing columns (eg. service_name)
                                                const insertData: any = {
                                                    user_id: user?.id || null,  // Set to user.id if logged in
                                                    salon_id: salon.supabaseId,
                                                    service_id: selectedService,
                                                    service_name: currentService?.name,
                                                    date: selectedDate ? toLocalDateString(selectedDate) : null,
                                                    time: selectedTime,
                                                    duration_minutes: serviceDuration,
                                                    price: currentService?.price,
                                                    status: 'confirmed',
                                                    payment_method: selectedPaymentMethod,
                                                    payment_status: selectedPaymentMethod === 'online' ? 'pending' : 'pending'
                                                };

                                                // lazy import to avoid circular deps during module init
                                                const { insertAppointmentSafe } = await import('../lib/appointments');
                                                
                                                // Standard booking: use the resilient insert helper
                                                const { error } = await insertAppointmentSafe(insertData);
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
                                        Bevestig Boeking
                                    </Button>
                                    
                                    <button 
                                        className="w-full text-center text-xs text-stone-400 hover:text-stone-600 underline"
                                        onClick={() => {
                                            setBookingStep('time');
                                        }}
                                    >
                                        Wijzig datum of tijd
                                    </button>
                                </div>
                            </Card>
                        )}
                        
                        {/* Trust Badges */}
                        <div className="mt-4 flex justify-center gap-4 text-xs text-stone-400">
                             <span className="flex items-center"><Check size={12} className="mr-1" /> Gratis annuleren</span>
                             <span className="flex items-center"><Check size={12} className="mr-1" /> Betaal in salon</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            {/* Review Modal */}
            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title="Schrijf een review"
            >
                <div className="space-y-4">
                    <p className="text-sm text-stone-500 mb-4">
                        Wat vond je van je ervaring bij <span className="font-semibold text-stone-900">{salon?.name}</span>?
                    </p>

                    <div className="flex justify-center gap-2 mb-4">
                        {[1,2,3,4,5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                <Star size={32} className={`${star <= (hoverRating || reviewForm.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'} transition-colors`} />
                            </button>
                        ))}
                    </div>

                    <Input label="Jouw naam" value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} placeholder="Naam" />
                    <div className="w-full">
                        <label className="mb-2 block text-sm font-medium text-stone-700">Jouw ervaring</label>
                        <textarea
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none min-h-[100px]"
                            value={reviewForm.text}
                            onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                            placeholder="Vertel ons wat je ervan vond..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>Annuleren</Button>
                        <Button onClick={handleSubmitReview}>Plaats Review</Button>
                    </div>
                </div>
            </Modal>
        </ErrorBoundary>
    );
};