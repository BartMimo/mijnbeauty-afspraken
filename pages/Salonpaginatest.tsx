import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Euro, Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag, Zap, Phone, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { Button, Card, Badge } from '../components/UIComponents';

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

interface Appointment {
    date: string;
    time: string;
    duration_minutes?: number | null;
}

// Mock salon data for testing
const MOCK_SALON = {
    id: 'test-salon',
    name: 'Beauty Studio Glow',
    city: 'Amsterdam',
    address: 'Damstraat 15, 1012 JS Amsterdam',
    description: 'Welkom bij Beauty Studio Glow! Wij zijn een moderne schoonheidssalon gespecialiseerd in kapsels, nagels, wimpers en huidverzorging. Ons ervaren team van stylisten en schoonheidsspecialisten zorgt ervoor dat u zich altijd op uw best voelt. Wij gebruiken alleen de hoogste kwaliteit producten en de nieuwste technieken om u de beste resultaten te geven.',
    categories: ['Kapper', 'Nagels', 'Wimpers', 'Huidverzorging'],
    rating: 4.8,
    reviewCount: 127,
    email: 'info@beautystudioglow.nl',
    phone: '+31 20 123 4567',
    services: [
        {
            id: '1',
            name: 'Knippen Dames',
            description: 'Professionele dames knipbeurt inclusief wasbeurt',
            price: 45,
            durationMinutes: 60,
            category: 'Kapper'
        },
        {
            id: '2',
            name: 'Knippen Heren',
            description: 'Stijlvolle heren knipbeurt',
            price: 28,
            durationMinutes: 30,
            category: 'Kapper'
        },
        {
            id: '3',
            name: 'Highlights',
            description: 'Complete highlights behandeling met professionele kleur',
            price: 95,
            durationMinutes: 120,
            category: 'Kapper'
        },
        {
            id: '4',
            name: 'French Manicure',
            description: 'Elegante French manicure met gel lak',
            price: 35,
            durationMinutes: 60,
            category: 'Nagels'
        },
        {
            id: '5',
            name: 'Wimperlifting',
            description: 'Natuurlijke wimperlifting voor een wakkere blik',
            price: 55,
            durationMinutes: 60,
            category: 'Wimpers'
        },
        {
            id: '6',
            name: 'Gezichtsbehandeling',
            description: 'Diepe reiniging en hydratatie voor een stralende huid',
            price: 65,
            durationMinutes: 75,
            category: 'Huidverzorging'
        },
        {
            id: '7',
            name: 'Brazilian Wax',
            description: 'Professionele ontharingsbehandeling',
            price: 40,
            durationMinutes: 45,
            category: 'Huidverzorging'
        },
        {
            id: '8',
            name: 'Bruids Make-up',
            description: 'Complete make-up voor uw speciale dag',
            price: 85,
            durationMinutes: 90,
            category: 'Make-up'
        }
    ],
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
};

const MOCK_DEALS = [
    {
        id: '1',
        salonId: 'test-salon',
        salonName: 'Beauty Studio Glow',
        salonCity: 'Amsterdam',
        serviceName: 'Knippen Dames',
        originalPrice: 45,
        discountPrice: 35,
        date: '2026-01-25',
        time: '14:00',
        description: 'Last-minute afspraak: Knippen Dames voor €35 i.p.v. €45!',
        status: 'active'
    },
    {
        id: '2',
        salonId: 'test-salon',
        salonName: 'Beauty Studio Glow',
        salonCity: 'Amsterdam',
        serviceName: 'French Manicure',
        originalPrice: 35,
        discountPrice: 25,
        date: '2026-01-26',
        time: '10:00',
        description: 'Vandaag nog: French Manicure voor €25 i.p.v. €35!',
        status: 'active'
    }
];

export const Salonpaginatest: React.FC = () => {
    const navigate = useNavigate();
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentService, setCurrentService] = useState<any>(null);
    const [showBookingWidget, setShowBookingWidget] = useState(false);

    // Mock existing appointments for the selected date
    const existingAppointments = [
        { date: '2026-01-20', time: '10:00', duration_minutes: 60 },
        { date: '2026-01-20', time: '14:00', duration_minutes: 30 },
        { date: '2026-01-20', time: '15:00', duration_minutes: 90 },
    ];

    // Generate time slots (9:00 to 17:00)
    const allTimeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 17 && minute > 0) break; // Stop at 17:00
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }
        return slots;
    }, []);

    const availableTimes = useMemo(() => {
        if (!selectedDate || !currentService) return allTimeSlots;

        const dateStr = toLocalDateString(selectedDate);
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

            // Don't allow booking if end time would be after 17:00
            if (startMinutes + serviceDuration > 17 * 60) return false;

            // Check if any needed slot is blocked
            return !isSlotBlocked(time, serviceDuration);
        });
    }, [selectedDate, currentService, existingAppointments, allTimeSlots]);

    const scrollToWidget = () => {
        setTimeout(() => {
             document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Calendar helpers
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => {
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(selectedDate.setMonth(selectedDate.getMonth() + offset));
        setSelectedDate(new Date(newDate));
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

    const toLocalDateString = (date: Date) => {
        return date.getFullYear() + '-' +
               (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
               date.getDate().toString().padStart(2, '0');
    };

    const handleServiceSelect = (service: any) => {
        setSelectedService(service.id);
        setCurrentService(service);
        setShowBookingWidget(true);
        scrollToWidget();
    };

    const handleBooking = (date: string, time: string) => {
        // Mock booking - in real app this would save to database
        alert(`Afspraak geboekt!\nDatum: ${date}\nTijd: ${time}\nBehandeling: ${currentService?.name}\nPrijs: €${currentService?.price}`);
    };

    return (
        <div className="bg-stone-50 min-h-screen pb-12">
            {/* Header Image */}
            <div className="h-64 md:h-80 w-full overflow-hidden relative">
                <img src={MOCK_SALON.image} alt={MOCK_SALON.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-12 text-white container mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold">{MOCK_SALON.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center text-sm md:text-base"><MapPin size={16} className="mr-1" /> {MOCK_SALON.city}</span>
                        <span className="flex items-center text-sm md:text-base"><Star size={16} className="mr-1 fill-yellow-400 text-yellow-400" /> {MOCK_SALON.rating} ({MOCK_SALON.reviewCount})</span>
                        {MOCK_SALON.categories && MOCK_SALON.categories.length > 0 && (
                            <div className="flex items-center gap-1 text-sm md:text-base">
                                {SALON_CATEGORIES.filter(c => MOCK_SALON.categories.includes(c.value)).map(c => (
                                    <span key={c.value} className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                                        <span className="mr-1">{c.icon}</span>
                                        {c.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-10 grid md:grid-cols-3 gap-8">
                {/* Left Column: Info & Services */}
                <div className="md:col-span-2 space-y-8">
                    {/* About Section */}
                    <Card className="p-8">
                        <h2 className="text-2xl font-bold text-stone-900 mb-4">Over {MOCK_SALON.name}</h2>
                        <p className="text-stone-600 leading-relaxed mb-6">{MOCK_SALON.description}</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-center text-stone-600">
                                <Phone size={20} className="mr-3 text-stone-400" />
                                <div>
                                    <div className="font-medium">Telefoon</div>
                                    <div>{MOCK_SALON.phone}</div>
                                </div>
                            </div>
                            <div className="flex items-center text-stone-600">
                                <Mail size={20} className="mr-3 text-stone-400" />
                                <div>
                                    <div className="font-medium">E-mail</div>
                                    <div>{MOCK_SALON.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center text-stone-600">
                                <MapPin size={20} className="mr-3 text-stone-400" />
                                <div>
                                    <div className="font-medium">Adres</div>
                                    <div>{MOCK_SALON.address}</div>
                                </div>
                            </div>
                            <div className="flex items-center text-stone-600">
                                <Star size={20} className="mr-3 text-stone-400" />
                                <div>
                                    <div className="font-medium">Beoordeling</div>
                                    <div>{MOCK_SALON.rating} sterren ({MOCK_SALON.reviewCount} reviews)</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Services Section */}
                    <Card className="p-8">
                        <h2 className="text-2xl font-bold text-stone-900 mb-6">Onze Behandelingen</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {MOCK_SALON.services.map((service) => (
                                <div key={service.id} className="border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-stone-900">{service.name}</h3>
                                        <div className="text-right">
                                            <div className="font-bold text-lg text-stone-900">€{service.price}</div>
                                            <div className="text-sm text-stone-500">{service.durationMinutes} min</div>
                                        </div>
                                    </div>
                                    <p className="text-stone-600 text-sm mb-3">{service.description}</p>
                                    <Badge className="text-xs">{service.category}</Badge>
                                    <Button
                                        onClick={() => handleServiceSelect(service)}
                                        className="w-full mt-3"
                                        size="sm"
                                    >
                                        Selecteer
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Deals Section */}
                    {MOCK_DEALS.length > 0 && (
                        <Card className="p-8">
                            <h2 className="text-2xl font-bold text-stone-900 mb-6">Speciale Aanbiedingen</h2>
                            <div className="space-y-4">
                                {MOCK_DEALS.map((deal) => (
                                    <div key={deal.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-red-900">{deal.serviceName}</h3>
                                            <div className="text-right">
                                                <div className="text-red-600 line-through">€{deal.originalPrice}</div>
                                                <div className="font-bold text-xl text-red-900">€{deal.discountPrice}</div>
                                            </div>
                                        </div>
                                        <p className="text-red-800 mb-2">{deal.description}</p>
                                        <div className="flex items-center text-sm text-red-700">
                                            <CalendarIcon size={14} className="mr-1" />
                                            {new Date(deal.date).toLocaleDateString('nl-NL')} om {deal.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column: Booking Widget */}
                <div className="md:col-span-1">
                    <div id="booking-widget" className="sticky top-6">
                        {showBookingWidget && currentService ? (
                            <Card className="p-6">
                                <h3 className="text-xl font-bold text-stone-900 mb-4">Afspraak Maken</h3>

                                {/* Selected Service */}
                                <div className="bg-stone-50 p-4 rounded-lg mb-6">
                                    <h4 className="font-bold text-stone-900 mb-1">{currentService.name}</h4>
                                    <p className="text-stone-600 text-sm mb-2">{currentService.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-500 text-sm">{currentService.durationMinutes} minuten</span>
                                        <span className="font-bold text-lg text-stone-900">€{currentService.price}</span>
                                    </div>
                                </div>

                                {/* Calendar */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-stone-100 rounded">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h4 className="font-bold text-stone-900">
                                            {new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(selectedDate)}
                                        </h4>
                                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-stone-100 rounded">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-1 mb-4">
                                        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                                            <div key={day} className="text-center text-sm font-medium text-stone-500 py-2">
                                                {day}
                                            </div>
                                        ))}

                                        {Array.from({ length: firstDayOfMonth(selectedDate) }, (_, i) => (
                                            <div key={`empty-${i}`} className="py-2"></div>
                                        ))}

                                        {Array.from({ length: daysInMonth(selectedDate) }, (_, i) => {
                                            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1);
                                            const isSelected = isSameDay(date, selectedDate);
                                            const isPastDate = isPast(date);

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedDate(date)}
                                                    disabled={isPastDate}
                                                    className={`py-2 text-sm rounded-lg transition-colors ${
                                                        isSelected
                                                            ? 'bg-stone-900 text-white'
                                                            : isPastDate
                                                            ? 'text-stone-300 cursor-not-allowed'
                                                            : 'hover:bg-stone-100 text-stone-900'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Time Slots */}
                                {availableTimes.length > 0 ? (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-stone-900 mb-3">Beschikbare Tijden</h4>
                                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                            {availableTimes.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleBooking(toLocalDateString(selectedDate), time)}
                                                    className="py-2 px-3 text-sm border border-stone-200 rounded hover:border-stone-300 hover:bg-stone-50 transition-colors"
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-stone-500 mb-6">
                                        Geen beschikbare tijden op deze datum.
                                    </div>
                                )}

                                <Button
                                    onClick={() => setShowBookingWidget(false)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Annuleren
                                </Button>
                            </Card>
                        ) : (
                            <Card className="p-6 text-center">
                                <CalendarIcon size={48} className="mx-auto text-stone-300 mb-4" />
                                <h3 className="text-xl font-bold text-stone-900 mb-2">Maak een Afspraak</h3>
                                <p className="text-stone-600 mb-4">Selecteer een behandeling om te beginnen met boeken.</p>
                                <Button onClick={() => document.querySelector('.grid.md\\:grid-cols-2')?.scrollIntoView({ behavior: 'smooth' })}>
                                    Bekijk Behandelingen
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};