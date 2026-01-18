import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Clock, Euro, Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, Mail, MessageCircle, Zap, Edit3, Heart } from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Service, Deal } from '../types';
import { insertAppointmentSafe } from '../lib/appointments';

interface SalonDetailPageProps {
    subdomain?: string; // Optional prop to support direct subdomain routing
}

export const SalonDetailPage: React.FC<SalonDetailPageProps> = ({ subdomain }) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const salonId = subdomain || id;
    
    console.log('=== SalonDetail.tsx Mounted ===');
    console.log('salonId:', salonId);
    
    // State
    const [salon, setSalon] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [bookingStep, setBookingStep] = useState<'service' | 'time' | 'confirm'>('service');
    
    // Review Modal State
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ name: '', rating: 0, text: '' });

    // Helper to get local date string (YYYY-MM-DD)
    const toLocalDateString = (date: Date) => {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    };

    // Helper to normalize time format for database (ensure HH:MM:SS format)
    const normalizeTimeForDB = (timeStr: string) => {
        if (!timeStr) return timeStr;
        // If already in HH:MM:SS format, return as is
        if (timeStr.length === 8 && timeStr.includes(':')) return timeStr;
        // If in HH:MM format, add :00 seconds
        if (timeStr.length === 5 && timeStr.includes(':')) return timeStr + ':00';
        // Return as is for other formats
        return timeStr;
    };

    // Helper to normalize time for comparison (remove seconds if present)
    const normalizeTimeForComparison = (timeStr: string) => {
        if (!timeStr) return timeStr;
        // If in HH:MM:SS format, return HH:MM
        if (timeStr.length === 8 && timeStr.includes(':')) return timeStr.substring(0, 5);
        // Return as is for other formats
        return timeStr;
    };

    // Fetch booked times for a date
    const fetchBookedTimes = async (date: Date) => {
        const dateStr = toLocalDateString(date);
        const { data } = await supabase
            .from('appointments')
            .select('time')
            .eq('salon_id', salon.supabaseId)
            .eq('date', dateStr);
        setBookedTimes(data?.map(a => normalizeTimeForComparison(a.time)) || []);
    };
    const [hoverRating, setHoverRating] = useState(0);

    // Favorite State
    const [isFavorite, setIsFavorite] = useState(false);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date()); 
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Fetch salon from Supabase
    useEffect(() => {
        const fetchSalon = async () => {
            if (!salonId) {
                setLoading(false);
                return;
            }

            console.log('Fetching salon:', salonId);

            try {
                // Try to find by slug first, then by UUID
                let { data, error } = await supabase
                    .from('salons')
                    .select(`
                        *,
                        services(*),
                        opening_hours
                    `)
                    .eq('slug', salonId)
                    .maybeSingle();

                // If not found by slug, try by UUID
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

                console.log('Supabase result:', { data, error });

                if (error || !data) {
                    console.error('Salon not found:', error);
                    setLoading(false);
                    return;
                }

                console.log('Found salon:', data.name);

                setSalon({
                    id: data.slug || data.id,
                    supabaseId: data.id,
                    name: data.name,
                    subdomain: data.subdomain,
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
                        duration: s.duration_minutes,
                        category: 'Nails'
                    })),
                    image: data.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
                    openingHours: data.opening_hours
                });

                // Fetch deals
                const { data: dealsData } = await supabase
                    .from('deals')
                    .select('*')
                    .eq('salon_id', data.id)
                    .eq('status', 'active');

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
                        time: d.time && d.date ? `${new Date(d.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${d.time}` : (d.date ? new Date(d.date).toLocaleDateString('nl-NL') : d.time || 'Geen tijd'),
                        rawTime: d.time || '',
                        durationMinutes: d.duration_minutes || 60,
                        description: d.description || '',
                        status: d.status
                    })));
                }

                // Fetch reviews from Supabase
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select(`
                        *,
                        profiles:user_id (full_name)
                    `)
                    .eq('salon_id', data.id)
                    .order('created_at', { ascending: false });

                if (reviewsData) {
                    setReviews(reviewsData.map((r: any) => ({
                        id: r.id,
                        name: r.profiles?.full_name || 'Anoniem',
                        rating: r.rating,
                        text: r.comment || '',
                        date: new Date(r.created_at).toLocaleDateString('nl-NL')
                    })));
                }

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

            } catch (err) {
                console.error('Error fetching salon:', err);
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
            setBookedTimes([]);
        }
    }, [salon?.openingHours, selectedDate]);

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
                    .eq('salon_id', salon.supabaseId);
            } else {
                // Add to favorites
                await supabase
                    .from('favorites')
                    .insert({
                        user_id: user.id,
                        salon_id: salon.supabaseId
                    });
            }
            setIsFavorite(!isFavorite);
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                    <p className="text-stone-500">Salon laden...</p>
                </div>
            </div>
        );
    }

    if (!salon) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-stone-50">
                <h1 className="text-2xl font-bold text-stone-900 mb-2">Salon niet gevonden</h1>
                <p className="text-stone-500 mb-6">De opgevraagde salon bestaat niet of de pagina is verplaatst.</p>
                {!subdomain && <Button onClick={() => window.location.href = '/'}>Terug naar home</Button>}
            </div>
        );
    }

    // --- Helpers for contact links ---
    const getWhatsAppLink = (phone?: string) => {
        if (!phone) return '#';
        let clean = phone.replace(/\D/g, '');
        if (clean.startsWith('0')) clean = '31' + clean.substring(1);
        return `https://wa.me/${clean}`;
    };

    // --- Review Logic ---
    const handleOpenReviewModal = () => {
        // Try to pre-fill name if logged in
        const userStr = localStorage.getItem('currentUser');
        const user = userStr ? JSON.parse(userStr) : null;
        
        setReviewForm({ 
            name: user?.name || '', 
            rating: 0, 
            text: '' 
        });
        setIsReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (reviewForm.rating === 0) {
            alert("Selecteer alstublieft een aantal sterren.");
            return;
        }
        if (!reviewForm.name || !reviewForm.text) {
            alert("Vul alstublieft alle velden in.");
            return;
        }

        if (!user) {
            alert("Log in om een review te plaatsen.");
            return;
        }

        try {
            // Save review to database
            const { data: newReviewData, error } = await supabase
                .from('reviews')
                .insert({
                    salon_id: salon.supabaseId,
                    user_id: user.id,
                    rating: reviewForm.rating,
                    comment: reviewForm.text
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving review:', error);
                alert('Er ging iets mis bij het opslaan van je review. Probeer het opnieuw.');
                return;
            }

            // Add to local state for immediate UI update
            const newReview = {
                id: newReviewData.id,
                user: reviewForm.name,
                text: reviewForm.text,
                rating: reviewForm.rating,
                created_at: newReviewData.created_at
            };

            setReviews([newReview, ...reviews]);
            setIsReviewModalOpen(false);
            setReviewForm({ name: '', rating: 0, text: '' });

            alert('Bedankt voor je review!');
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Er ging iets mis. Probeer het opnieuw.');
        }
    };

    // --- Actions ---
    const handleBookService = (serviceId: string) => {
        setSelectedService(serviceId);
        setSelectedDeal(null);
        setBookingStep('time');
        scrollToWidget();
    };

    const handleBookDeal = (deal: Deal) => {
        setSelectedDeal(deal);
        setSelectedService(null);
        setBookingStep('confirm'); 
        scrollToWidget();
    };

    const scrollToWidget = () => {
        setTimeout(() => {
             document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const currentService = salon.services.find(s => s.id === selectedService);

    // --- Calendar Logic ---
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

    // Function to get available times based on opening hours
    const getAvailableTimes = (date: Date) => {
        if (!salon?.openingHours) {
            // Fallback to default times if no opening hours
            return ['09:00', '09:30', '10:00', '11:15', '13:00', '14:30', '16:00', '16:45'];
        }

        // Get day of week in Dutch format (ma, di, wo, do, vr, za, zo)
        const days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
        const dayOfWeek = days[date.getDay()];

        const dayHours = salon.openingHours[dayOfWeek];
        if (!dayHours || dayHours.closed) {
            return []; // Salon is closed on this day
        }

        // Generate time slots every 30 minutes between start and end time
        const times = [];
        const [startHour, startMinute] = dayHours.start.split(':').map(Number);
        const [endHour, endMinute] = dayHours.end.split(':').map(Number);

        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            times.push(timeString);

            // Add 30 minutes
            currentMinute += 30;
            if (currentMinute >= 60) {
                currentHour += 1;
                currentMinute = 0;
            }
        }

        return times;
    };

    const formatDateDutch = (date: Date) => {
        return new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' }).format(date);
    };

    return (
        <div className="bg-stone-50 min-h-screen pb-12">
            {/* Header Image */}
            <div className="h-64 md:h-80 w-full overflow-hidden relative group">
                <img src={salon.image} alt={salon.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 md:p-12 text-white container mx-auto flex justify-between items-end">
                    <div className="max-w-[80%]">
                        <h1 className="text-2xl md:text-5xl font-bold leading-tight">{salon.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                            <span className="flex items-center text-xs md:text-base bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg"><MapPin size={16} className="mr-1" /> {salon.city}</span>
                            <span className="flex items-center text-xs md:text-base bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg"><Star size={16} className="mr-1 fill-yellow-400 text-yellow-400" /> {salon.rating} ({salon.reviewCount})</span>
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

            <div className="container mx-auto px-4 -mt-6 relative z-10 grid md:grid-cols-3 gap-8">
                {/* Left Column: Info & Services */}
                <div className="md:col-span-2 space-y-6 md:space-y-8">
                    <Card className="p-6 md:p-8">
                        <h2 className="text-xl font-bold mb-4">Over {salon.name}</h2>
                        <p className="text-stone-600 leading-relaxed mb-6 text-sm md:text-base">{salon.description}</p>
                        
                        {/* Contact Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
                            <button 
                                onClick={toggleFavorite}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-colors ${
                                    isFavorite 
                                        ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100' 
                                        : 'border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                                }`}
                                title={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
                            >
                                <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
                                {isFavorite ? 'Favoriet' : 'Toevoegen aan favorieten'}
                            </button>
                        </div>

                        <div className="pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-semibold text-stone-900 mb-2">Adres</h4>
                                <p className="text-stone-500">{salon.address}<br/>{salon.zipCode} {salon.city}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-stone-900 mb-2">Openingstijden</h4>
                                <div className="text-stone-500 text-sm space-y-1">
                                    {(() => {
                                        const hours = salon.opening_hours || {};
                                        const days = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
                                        const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

                                        return days.map((day, index) => {
                                            const dayData = hours[day];
                                            if (dayData?.closed) {
                                                return <div key={day}>{dayNames[index]}: Gesloten</div>;
                                            }
                                            return <div key={day}>{dayNames[index]}: {dayData?.start || '09:00'} - {dayData?.end || '18:00'}</div>;
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* DEALS SECTION */}
                    {activeDeals.length > 0 && (
                        <div id="deals-list">
                            <h2 className="text-xl font-bold mb-4 px-2 flex items-center">
                                <Zap className="text-brand-500 mr-2 fill-brand-500" size={20}/> Actieve Deals
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        {/* Group services by category */}
                        {(() => {
                            const servicesByCategory = salon.services.reduce((acc, service) => {
                                const category = service.category;
                                if (!acc[category]) {
                                    acc[category] = [];
                                }
                                acc[category].push(service);
                                return acc;
                            }, {} as Record<string, typeof salon.services>);

                            return Object.entries(servicesByCategory).map(([category, services]) => (
                                <div key={category} className="mb-8">
                                    <h2 className="text-xl font-bold mb-4 px-2">{category}</h2>
                                    <div className="space-y-4">
                                        {services.map(service => (
                                            <Card key={service.id} className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-200 transition-colors">
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
                                                    className="w-full sm:w-auto"
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
                     <Card className="p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
                            <Button variant="secondary" size="sm" onClick={handleOpenReviewModal}>
                                <Edit3 size={16} className="mr-2" /> <span className="hidden sm:inline">Schrijf een review</span><span className="sm:hidden">Schrijf</span>
                            </Button>
                        </div>
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <div key={review.id} className="border-b border-stone-100 last:border-0 pb-6 last:pb-0 animate-fadeIn">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-stone-900">{review.user}</span>
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
                                                    const isClosed = !isSalonOpen(dateObj);
                                                    const isDisabled = isPastDate || isClosed;
                                                    return (
                                                        <button 
                                                            key={d}
                                                            disabled={isDisabled}
                                                            onClick={() => { setSelectedDate(dateObj); setSelectedTime(null); fetchBookedTimes(dateObj); }}
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
                                                        {(selectedDate ? getAvailableTimes(selectedDate) : []).filter(time => !bookedTimes.includes(time)).map(time => (
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
                                            
                                            <Button className="w-full" onClick={async () => {
                                                try {
                                                    // If user is not logged in, we still allow demo booking but prefer to attach user if present
                                                    const { data: authUser } = await supabase.auth.getUser();
                                                    const user = authUser?.user || null;
                                                    if (selectedDeal) {
                                                        // First claim the deal atomically
                                                        const { data: claimResult, error: claimError } = await supabase
                                                            .from('deals')
                                                            .update({ status: 'claimed' })
                                                            .eq('id', selectedDeal.id)
                                                            .eq('status', 'active')
                                                            .select('id')
                                                            .maybeSingle();

                                                        if (claimError) throw claimError;
                                                        if (!claimResult) {
                                                            alert('Deze deal is helaas al geclaimd. Ververs de pagina en probeer een andere deal.');
                                                            setActiveDeals(prev => prev.filter(d => d.id !== selectedDeal.id));
                                                            setSelectedDeal(null);
                                                            return;
                                                        }

                                                        // Create appointment for the deal
                                                        const insertData: any = {
                                                            salon_id: salon.id,
                                                            salon_name: salon.name,
                                                            service_name: selectedDeal.serviceName,
                                                            date: selectedDeal.date,
                                                            time: normalizeTimeForDB(selectedDeal.rawTime),
                                                            duration_minutes: selectedDeal.durationMinutes || 60,
                                                            status: 'confirmed',
                                                            price: selectedDeal.discountPrice,
                                                            customer_name: user?.user_metadata?.full_name || (user?.email || 'Gast'),
                                                            user_id: user?.id || null,
                                                        };
                                                        const { insertAppointmentSafe } = await import('../lib/appointments');
                                                        const { error: insertErr } = await insertAppointmentSafe(insertData);
                                                        if (insertErr) throw insertErr;

                                                        // Success
                                                        setActiveDeals(prev => prev.filter(d => d.id !== selectedDeal.id));
                                                        setSelectedDeal(null);
                                                        alert('Boeking succesvol! De deal is geclaimd.');
                                                    } else {
                                                        // For regular service booking, insert a normal appointment
                                                        const insertData: any = {
                                                            salon_id: salon.id,
                                                            salon_name: salon.name,
                                                            service_id: currentService?.id || null,
                                                            service_name: currentService?.name || '',
                                                            date: selectedDate ? toLocalDateString(selectedDate) : null,
                                                            time: normalizeTimeForDB(selectedTime),
                                                            status: 'confirmed',
                                                            price: currentService?.price || 0,
                                                            customer_name: (await supabase.auth.getUser()).data?.user?.user_metadata?.full_name || 'Gast',
                                                            user_id: user?.id || null,  // Set to user.id if logged in
                                                        };
                                                        const { insertAppointmentSafe } = await import('../lib/appointments');
                                                        const { error: insertErr } = await insertAppointmentSafe(insertData);
                                                        if (insertErr) throw insertErr;

                                                        alert('Boeking succesvol!');
                                                        setBookedTimes(prev => [...prev, selectedTime]);
                                                    }
                                                } catch (err: any) {
                                                    console.error('Booking error:', err);
                                                    alert('Boeking mislukt: ' + (err.message || 'Onbekende fout'));
                                                }
                                            }}>
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

            {/* Review Modal */}
            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title="Schrijf een review"
            >
                <div className="space-y-4">
                    <p className="text-sm text-stone-500 mb-4">
                        Wat vond je van je ervaring bij <span className="font-semibold text-stone-900">{salon.name}</span>?
                    </p>
                    
                    {/* Star Rating Input */}
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                <Star 
                                    size={32} 
                                    className={`${
                                        star <= (hoverRating || reviewForm.rating) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-stone-300"
                                    } transition-colors`} 
                                />
                            </button>
                        ))}
                    </div>

                    <Input 
                        label="Jouw naam" 
                        value={reviewForm.name} 
                        onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                        placeholder="Naam"
                    />
                    
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
        </div>
    );
};