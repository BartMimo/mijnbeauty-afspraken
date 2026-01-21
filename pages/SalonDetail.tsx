import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  Euro,
  Check,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  Edit3,
  Heart,
} from "lucide-react";
import { Button, Card, Modal, Input } from "../components/UIComponents";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Service } from "../types";
import { insertReviewSafe, isNotAuthenticatedError } from "../lib/reviews";
import { insertAppointmentSafe } from "../lib/appointments";

interface SalonDetailPageProps {
  subdomain?: string;
}

type BookingStep = "service" | "time" | "confirm";

type ReviewVM = {
  id: string;
  user: string;
  rating: number;
  text: string;
  date?: string;
  created_at?: string;
};

type SalonVM = {
  id: string; // slug or id for routing
  supabaseId: string; // uuid in db
  name: string;
  city: string;
  address: string;
  zipCode: string;
  description: string;
  email?: string;
  phone?: string;
  image: string;
  leadTimeHours: number;
  openingHours?: any;
  services: Array<
    Service & {
      durationMinutes?: number;
      duration?: number;
      category?: string;
    }
  >;
  rating: number;
  reviewCount: number;
};

export const SalonDetailPage: React.FC<SalonDetailPageProps> = ({ subdomain }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const salonId = subdomain || id;

  // Core state
  const [salon, setSalon] = useState<SalonVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewVM[]>([]);

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false);

  // Booking
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>("service");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 0, text: "" });

  // ------------------------
  // Helpers
  // ------------------------
  const toLocalDateString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const normalizeTimeForDB = (timeStr: string | null) => {
    if (!timeStr) return timeStr;
    if (timeStr.length === 8 && timeStr.includes(":")) return timeStr; // HH:MM:SS
    if (timeStr.length === 5 && timeStr.includes(":")) return `${timeStr}:00`; // HH:MM
    return timeStr;
  };

  const normalizeTimeForComparison = (timeStr: string) =>
    timeStr?.length === 8 && timeStr.includes(":") ? timeStr.substring(0, 5) : timeStr;

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return "#";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "31" + clean.substring(1);
    return `https://wa.me/${clean}`;
  };

  const formatDateDutch = (date: Date) =>
    new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "long" }).format(
      date
    );

  const scrollToWidget = () => {
    setTimeout(() => {
      document.getElementById("booking-widget")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ------------------------
  // Fetch salon + reviews + favorite
  // ------------------------
  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (!salonId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1) fetch salon (by slug first, then uuid)
        let { data, error } = await supabase
          .from("salons")
          .select(
            `
            *,
            services(*),
            opening_hours
          `
          )
          .eq("slug", salonId)
          .maybeSingle();

        if (!data && !error) {
          const res2 = await supabase
            .from("salons")
            .select(
              `
              *,
              services(*),
              opening_hours
            `
            )
            .eq("id", salonId)
            .maybeSingle();
          data = res2.data;
          error = res2.error;
        }

        if (error || !data) {
          if (!isCancelled) setSalon(null);
          return;
        }

        const vm: SalonVM = {
          id: data.slug || data.id,
          supabaseId: data.id,
          zipCode: data.zip_code || data.zipCode || "",
          name: data.name,
          city: data.city || "",
          address: data.address || "",
          description: data.description || "Welkom bij onze salon!",
          rating: 4.5,
          reviewCount: 0,
          email: data.email,
          phone: data.phone,
          leadTimeHours: Number(data.lead_time_hours || 0),
          services: (data.services || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description || "",
            price: s.price,
            durationMinutes: s.duration_minutes, // jouw service schema
            duration: s.duration_minutes,
            category: s.category || "Overig",
          })),
          image:
            data.image_url ||
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
          openingHours: data.opening_hours,
        };

        if (!isCancelled) setSalon(vm);

        // 2) fetch reviews (geen is_approved; join via FK-hint)
        const reviewsRes = await supabase
          .from("reviews")
          .select("*,profiles!reviews_user_id_fkey(full_name)")
          .eq("salon_id", data.id)
          .order("created_at", { ascending: false });

        if (!isCancelled) {
          const list = (reviewsRes.data ?? []).map((r: any) => ({
            id: r.id,
            user: r?.profiles?.full_name || "Anoniem",
            rating: Number(r.rating || 0),
            text: r.comment || r.text || "",
            date: r.created_at ? new Date(r.created_at).toLocaleDateString("nl-NL") : undefined,
            created_at: r.created_at,
          }));
          setReviews(list);
        }

        // 3) favorites (alleen als ingelogd)
        if (user) {
          const favRes = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("salon_id", data.id)
            .maybeSingle();

          if (!isCancelled) setIsFavorite(!!favRes.data);
        } else {
          if (!isCancelled) setIsFavorite(false);
        }
      } catch (e) {
        console.error("Error fetching salon detail:", e);
        if (!isCancelled) setSalon(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [salonId, user]);

  // ------------------------
  // Booking helpers
  // ------------------------
  const currentService = useMemo(() => {
    if (!salon || !selectedService) return null;
    return salon.services.find((s) => s.id === selectedService) || null;
  }, [salon, selectedService]);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => {
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const changeMonth = (offset: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const isPast = (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isSalonOpen = (date: Date) => {
    if (!salon?.openingHours) return true;

    const days = ["zo", "ma", "di", "wo", "do", "vr", "za"];
    const dayOfWeek = days[date.getDay()];
    const dayHours = salon.openingHours?.[dayOfWeek];
    return dayHours && !dayHours.closed;
  };

  const isDateAvailable = (date: Date) => !isPast(date) && isSalonOpen(date);

  const SLOT_STEP = 5;

  const getAvailableTimes = (date: Date) => {
    if (!salon?.openingHours) {
      return ["09:00", "09:30", "10:00", "11:15", "13:00", "14:30", "16:00", "16:45"];
    }

    const days = ["zo", "ma", "di", "wo", "do", "vr", "za"];
    const dayOfWeek = days[date.getDay()];
    const dayHours = salon.openingHours?.[dayOfWeek];

    if (!dayHours || dayHours.closed) return [];

    const times: string[] = [];
    const [startHour, startMinute] = String(dayHours.start || "09:00").split(":").map(Number);
    const [endHour, endMinute] = String(dayHours.end || "18:00").split(":").map(Number);

    let h = startHour;
    let m = startMinute;

    while (h < endHour || (h === endHour && m < endMinute)) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += SLOT_STEP;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
    }

    return times;
  };

  const filterByLeadTime = (date: Date, times: string[]) => {
    const leadHours = Number(salon?.leadTimeHours || 0);
    if (!leadHours) return times;

    const now = new Date();
    const cutoff = new Date(now.getTime() + leadHours * 60 * 60 * 1000);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const cutoffDateOnly = new Date(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate());

    if (dateOnly < cutoffDateOnly) return [];

    const sameDay = dateOnly.getTime() === cutoffDateOnly.getTime();
    if (!sameDay) return times;

    const cutoffMinutes = cutoff.getHours() * 60 + cutoff.getMinutes();
    return times.filter((t) => {
      const [hh, mm] = t.split(":").map(Number);
      return hh * 60 + (mm || 0) >= cutoffMinutes;
    });
  };

  const fetchBookedTimes = async (date: Date) => {
    if (!salon?.supabaseId) return;
    const dateStr = toLocalDateString(date);

    const { data } = await supabase
      .from("appointments")
      .select("time")
      .eq("salon_id", salon.supabaseId)
      .eq("date", dateStr);

    setBookedTimes((data ?? []).map((a: any) => normalizeTimeForComparison(a.time)));
  };

  // Reset invalid date/time if opening hours change
  useEffect(() => {
    if (!selectedDate || !salon?.openingHours) return;
    if (!isDateAvailable(selectedDate)) {
      setSelectedDate(null);
      setSelectedTime(null);
      setBookedTimes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon?.openingHours]);

  // Reset selected date/time if lead time makes it invalid
  useEffect(() => {
    if (!selectedDate || !salon) return;
    const leadHours = Number(salon.leadTimeHours || 0);
    if (!leadHours) return;

    const now = new Date();
    const cutoff = new Date(now.getTime() + leadHours * 60 * 60 * 1000);

    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const cutoffDateOnly = new Date(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate());

    if (selectedDateOnly < cutoffDateOnly) {
      setSelectedDate(null);
      setSelectedTime(null);
      setBookedTimes([]);
      return;
    }

    if (selectedDateOnly.getTime() === cutoffDateOnly.getTime() && selectedTime) {
      const [sh, sm] = selectedTime.split(":").map(Number);
      const selectedMinutes = sh * 60 + (sm || 0);
      const cutoffMinutes = cutoff.getHours() * 60 + cutoff.getMinutes();
      if (selectedMinutes < cutoffMinutes) setSelectedTime(null);
    }
  }, [salon, selectedDate, selectedTime]);

  // ------------------------
  // Actions
  // ------------------------
  const handleBookService = (serviceId: string) => {
    setSelectedService(serviceId);
    setBookingStep("time");
    scrollToWidget();
  };

  const toggleFavorite = async () => {
    if (!salon || !user) {
      alert("Log in om salons toe te voegen aan je favorieten");
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("salon_id", salon.supabaseId);
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          salon_id: salon.supabaseId,
        });
      }
      setIsFavorite((v) => !v);
    } catch (e) {
      console.error("Error toggling favorite:", e);
    }
  };

  // Reviews
  const handleOpenReviewModal = () => {
    // Prefill name from auth metadata if available
    const fallbackName =
      (user as any)?.user_metadata?.full_name ||
      (user as any)?.user_metadata?.name ||
      "";

    setReviewForm({
      name: fallbackName,
      rating: 0,
      text: "",
    });
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!salon) return;

    if (!reviewForm.rating) {
      alert("Selecteer alstublieft een aantal sterren.");
      return;
    }

    if (!reviewForm.text.trim()) {
      alert("Vul alstublieft je ervaring in.");
      return;
    }

    const { data, error } = await insertReviewSafe({
      salon_id: salon.supabaseId,
      rating: reviewForm.rating,
      comment: reviewForm.text,
    });

    if (error) {
      if (isNotAuthenticatedError(error)) {
        alert("Log in om een review te plaatsen.");
        return;
      }
      const msg = (error as any)?.message || JSON.stringify(error);
      console.error("Error saving review:", error);
      alert(`Er ging iets mis bij het opslaan van je review: ${msg}`);
      return;
    }

    // optimistic UI: voeg bovenaan toe
    const displayName = reviewForm.name?.trim() || (user ? "Jij" : "Anoniem");
    const newReview: ReviewVM = {
      id: data?.id ?? crypto.randomUUID(),
      user: displayName,
      rating: reviewForm.rating,
      text: reviewForm.text,
      created_at: data?.created_at,
      date: data?.created_at ? new Date(data.created_at).toLocaleDateString("nl-NL") : undefined,
    };

    setReviews((prev) => [newReview, ...prev]);
    setIsReviewModalOpen(false);
    setReviewForm({ name: "", rating: 0, text: "" });

    alert("Bedankt voor je review!");
  };

  const flagReview = async (reviewId: string) => {
    if (!user) {
      alert("Log in om een review te rapporteren.");
      return;
    }

    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          is_flagged: true,
          flagged_reason: "Gerapporteerd door gebruiker",
        })
        .eq("id", reviewId);

      if (error) throw error;
      alert("Review gerapporteerd. Een moderator zal deze beoordelen.");
    } catch (e) {
      console.error("Error flagging review:", e);
      alert("Er ging iets mis bij het rapporteren.");
    }
  };

  // Booking confirm
  const handleConfirmBooking = async () => {
    if (!salon || !currentService || !selectedDate || !selectedTime) return;

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const customerName =
        (authUser as any)?.user_metadata?.full_name ||
        (authUser as any)?.user_metadata?.name ||
        "Gast";

      const insertData: any = {
        salon_id: salon.supabaseId,
        salon_name: salon.name,
        service_id: currentService.id,
        service_name: currentService.name,
        date: toLocalDateString(selectedDate),
        time: normalizeTimeForDB(selectedTime),
        status: "confirmed",
        price: (currentService as any)?.price || 0,
        customer_name: customerName,
        user_id: authUser?.id || null,
      };

      const { error } = await insertAppointmentSafe(insertData);
      if (error) throw error;

      alert("Boeking succesvol!");
      setBookedTimes((prev) => [...prev, selectedTime]);
    } catch (e: any) {
      console.error("Booking error:", e);
      alert("Boeking mislukt: " + (e?.message || "Onbekende fout"));
    }
  };

  // ------------------------
  // Render states
  // ------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4" />
          <p className="text-stone-500">Salon laden...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-stone-50">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Salon niet gevonden</h1>
        <p className="text-stone-500 mb-6">
          De opgevraagde salon bestaat niet of de pagina is verplaatst.
        </p>
        {!subdomain && <Button onClick={() => (window.location.href = "/")}>Terug naar home</Button>}
      </div>
    );
  }

  // ------------------------
  // UI
  // ------------------------
  return (
    <div className="bg-stone-50 min-h-screen pb-12">
      {/* Header Image */}
      <div className="h-64 md:h-80 w-full overflow-hidden relative group">
        <img
          src={salon.image}
          alt={salon.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-12 text-white container mx-auto flex justify-between items-end">
          <div className="max-w-[80%]">
            <h1 className="text-2xl md:text-5xl font-bold leading-tight">{salon.name}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
              <span className="flex items-center text-xs md:text-base bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                <MapPin size={16} className="mr-1" /> {salon.city}
              </span>
              <span className="flex items-center text-xs md:text-base bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Star size={16} className="mr-1 fill-yellow-400 text-yellow-400" /> {salon.rating} (
                {reviews.length})
              </span>
            </div>
          </div>
          <button
            onClick={toggleFavorite}
            className={`p-3 rounded-full backdrop-blur-md transition-all hover:scale-105 shadow-lg ${
              isFavorite ? "bg-white text-red-500" : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
          >
            <Heart size={20} className={isFavorite ? "fill-red-500" : ""} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10 grid md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6 md:space-y-8">
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">Over {salon.name}</h2>
            <p className="text-stone-600 leading-relaxed mb-6 text-sm md:text-base">
              {salon.description}
            </p>

            {/* Contact */}
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
                    ? "border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                    : "border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                }`}
                title={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
              >
                <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
                {isFavorite ? "Favoriet" : "Toevoegen aan favorieten"}
              </button>
            </div>

            <div className="pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-stone-900 mb-2">Adres</h4>
                <p className="text-stone-500">
                  {salon.address}
                  <br />
                  {salon.zipCode} {salon.city}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-stone-900 mb-2">Openingstijden</h4>
                <div className="text-stone-500 text-sm space-y-1">
                  {(() => {
                    const hours = salon.openingHours || {};
                    const days = ["ma", "di", "wo", "do", "vr", "za", "zo"];
                    const dayNames = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

                    return days.map((day, index) => {
                      const dayData = hours[day];
                      if (dayData?.closed) {
                        return (
                          <div key={day}>
                            {dayNames[index]}: Gesloten
                          </div>
                        );
                      }
                      return (
                        <div key={day}>
                          {dayNames[index]}: {dayData?.start || "09:00"} - {dayData?.end || "18:00"}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </Card>

          {/* Services */}
          <div id="services-list">
            {(() => {
              const servicesByCategory = (salon.services || []).reduce((acc, service: any) => {
                const cat = service.category || "Overig";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(service);
                return acc;
              }, {} as Record<string, Service[]>);

              return Object.entries(servicesByCategory).map(([category, services]) => (
                <div key={category} className="mb-8">
                  <h2 className="text-xl font-bold mb-4 px-2">{category}</h2>
                  <div className="space-y-4">
                    {services.map((service: any) => (
                      <Card
                        key={service.id}
                        className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-200 transition-colors"
                      >
                        <div>
                          <h3 className="font-semibold text-stone-900 text-lg">{service.name}</h3>
                          <p className="text-sm text-stone-500 mb-2">{service.description}</p>
                          <div className="flex items-center gap-3 text-sm text-stone-500">
                            <span className="flex items-center">
                              <Clock size={14} className="mr-1" />{" "}
                              {service.durationMinutes ?? service.duration ?? "-"} min
                            </span>
                            <span className="flex items-center font-medium text-stone-900">
                              <Euro size={14} className="mr-1" /> {service.price}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleBookService(service.id)}
                          variant={selectedService === service.id ? "primary" : "outline"}
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
                <Edit3 size={16} className="mr-2" />{" "}
                <span className="hidden sm:inline">Schrijf een review</span>
                <span className="sm:hidden">Schrijf</span>
              </Button>
            </div>

            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-stone-100 last:border-0 pb-6 last:pb-0 animate-fadeIn"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-stone-900">{review.user}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? "fill-current" : "text-stone-200"}
                          />
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
                  {review.date && <p className="text-xs text-stone-400 mt-2">{review.date}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Booking widget */}
        <div className="relative">
          <div className="sticky top-24" id="booking-widget">
            <Card className="p-6 border-brand-100 shadow-lg transition-all duration-300">
              <h3 className="text-lg font-bold mb-4 border-b border-stone-100 pb-2">Je afspraak</h3>

              {!selectedService ? (
                <div className="text-center py-8 text-stone-500">
                  <p>Selecteer een dienst om te boeken.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex justify-between items-start animate-fadeIn">
                    <div>
                      <h4 className="font-medium text-stone-900">{currentService?.name}</h4>
                      <p className="text-xs text-stone-500 mt-1">
                        {currentService?.durationMinutes ?? currentService?.duration ?? "-"} min
                      </p>
                    </div>
                    <span className="font-bold text-stone-700">€{(currentService as any)?.price}</span>
                  </div>

                  {selectedService && bookingStep === "time" && (
                    <div className="animate-fadeIn">
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() => changeMonth(-1)}
                          className="p-1 hover:bg-stone-100 rounded-full"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <span className="font-semibold text-stone-800 capitalize">
                          {currentDate.toLocaleString("nl-NL", { month: "long", year: "numeric" })}
                        </span>
                        <button
                          onClick={() => changeMonth(1)}
                          className="p-1 hover:bg-stone-100 rounded-full"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 text-center text-xs text-stone-400 font-medium mb-2">
                        <div>Ma</div>
                        <div>Di</div>
                        <div>Wo</div>
                        <div>Do</div>
                        <div>Vr</div>
                        <div>Za</div>
                        <div>Zo</div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-6">
                        {[...Array(firstDayOfMonth(currentDate))].map((_, i) => (
                          <div key={`empty-${i}`} className="h-9" />
                        ))}
                        {[...Array(daysInMonth(currentDate))].map((_, i) => {
                          const d = i + 1;
                          const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                          const isSelected = selectedDate && isSameDay(selectedDate, dateObj);
                          const isPastDate = isPast(dateObj);
                          const isClosed = !isSalonOpen(dateObj);

                          const timesForDate = getAvailableTimes(dateObj);
                          const timesAfterLead = filterByLeadTime(dateObj, timesForDate);
                          const hasSelectableTimes = timesAfterLead.length > 0;
                          const isDisabled = isPastDate || isClosed || !hasSelectableTimes;

                          return (
                            <button
                              key={d}
                              disabled={isDisabled}
                              onClick={() => {
                                setSelectedDate(dateObj);
                                setSelectedTime(null);
                                fetchBookedTimes(dateObj);
                              }}
                              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all ${
                                isSelected
                                  ? "bg-brand-500 text-white font-bold shadow-md"
                                  : isDisabled
                                  ? "text-stone-300 cursor-not-allowed"
                                  : "text-stone-700 hover:bg-brand-50 hover:text-brand-600"
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>

                      {selectedDate && (
                        <div className="border-t border-stone-100 pt-4 animate-fadeIn">
                          <p className="text-sm font-medium text-stone-700 mb-3">Tijdstip:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {filterByLeadTime(selectedDate, getAvailableTimes(selectedDate))
                              .filter((t) => !bookedTimes.includes(t))
                              .map((time) => (
                                <button
                                  key={time}
                                  onClick={() => setSelectedTime(time)}
                                  className={`py-2 text-sm rounded-lg border transition-colors ${
                                    selectedTime === time
                                      ? "bg-brand-400 text-white border-brand-400 font-medium"
                                      : "border-stone-200 text-stone-600 hover:border-brand-300 hover:bg-brand-50"
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full mt-6"
                        onClick={() => setBookingStep("confirm")}
                        disabled={!selectedDate || !selectedTime}
                      >
                        Verder naar gegevens
                      </Button>
                    </div>
                  )}

                  {bookingStep === "confirm" && (
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
                          <span className="font-medium text-stone-900">{selectedTime}</span>
                        </div>
                        <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-base">
                          <span>Totaal</span>
                          <span>€{(currentService as any)?.price}</span>
                        </div>
                      </div>

                      <Button className="w-full" onClick={handleConfirmBooking}>
                        Bevestig Boeking
                      </Button>

                      <button
                        className="w-full text-center text-xs text-stone-400 hover:text-stone-600 underline"
                        onClick={() => setBookingStep("time")}
                      >
                        Wijzig datum of tijd
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <div className="mt-4 flex justify-center gap-4 text-xs text-stone-400">
              <span className="flex items-center">
                <Check size={12} className="mr-1" /> Gratis annuleren
              </span>
              <span className="flex items-center">
                <Check size={12} className="mr-1" /> Betaal in salon
              </span>
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
            Wat vond je van je ervaring bij{" "}
            <span className="font-semibold text-stone-900">{salon.name}</span>?
          </p>

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
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSubmitReview}>Plaats Review</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};