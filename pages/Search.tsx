import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, SlidersHorizontal, Heart, Loader2 } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { ServiceCategory } from '../types';
import { useAuth } from '../context/AuthContext';

/* =======================
   Salon Categories
======================= */

const SALON_CATEGORIES = [
    { value: 'Kapper', label: 'Kapsalon' },
    { value: 'Nagels', label: 'Nagelsalon' },
    { value: 'Wimpers', label: 'Wimper & Brow Studio' },
    { value: 'Massage', label: 'Massagesalon' },
    { value: 'Gezichtsbehandeling', label: 'Gezichtssalon' },
    { value: 'Huidverzorging', label: 'Huidverzorging' },
    { value: 'Make-up', label: 'Make-up Salon' },
    { value: 'Overig', label: 'Overig' },
];

/* =======================
   Types
======================= */

type SalonVM = {
  id: string;
  salonId: string; // Real UUID for database operations
  slug?: string;
  name: string;
  city: string;
  address?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  categories?: string[];
  services?: { id: string; name: string }[];
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800';

/* =======================
   Helper Functions
======================= */

// Geocode function - convert address to lat/lng
const geocodeAddress = async (address: string) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Netherlands')}&limit=1`);
    const data = await response.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/* =======================
   Component
======================= */

export const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* =======================
     State
  ======================= */

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<string>('all');

  // Location-based search state
  const [locationQuery, setLocationQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [locationLoading, setLocationLoading] = useState(false);

  const [salons, setSalons] = useState<SalonVM[]>([]);
  const [loading, setLoading] = useState(true);

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const perPage = 20;

  /* =======================
     Fetch salons
  ======================= */

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('salon_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        return;
      }

      setFavorites(new Set(data.map(f => f.salon_id)));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const toggleFavorite = async (salonId: string) => {
    if (!user) {
      alert('Log in om salons toe te voegen aan je favorieten');
      return;
    }

    const isFavorite = favorites.has(salonId);
    const newFavorites = new Set(favorites);

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('salon_id', salonId);
        
        newFavorites.delete(salonId);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            salon_id: salonId
          });
        
        newFavorites.add(salonId);
      }
      
      setFavorites(newFavorites);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from('salons')
        .select(`*, services(id,name), categories`)
        .eq('status', 'active');

      if (!active || error) return;

      setSalons(
        (data ?? []).map((s: any): SalonVM => ({
          id: s.slug ?? s.id,
          salonId: s.id, // Real UUID for database operations
          slug: s.slug,
          name: s.name,
          city: s.city ?? '',
          address: s.address ?? '',
          zipCode: s.zip_code ?? '',
          latitude: s.latitude,
          longitude: s.longitude,
          description: s.description ?? '',
          image: s.image_url ?? s.image ?? FALLBACK_IMAGE,
          rating: s.rating ?? 4.5,
          reviewCount: s.review_count ?? 0,
          categories: s.categories ?? [],
          services: (s.services ?? []).map((sv: any) => ({
            id: sv.id,
            name: sv.name,
          })),
        }))
      );

      setLoading(false);

      // Fetch favorites after salons are loaded
      await fetchFavorites();
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

  /* =======================
     Filtering
  ======================= */

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return salons.filter(s => {
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.services?.some(sv => sv.name.toLowerCase().includes(q));

      const matchCategory =
        category === 'all' || s.categories?.includes(category);

      // Location-based filtering
      const matchLocation = !userLocation || !s.latitude || !s.longitude ||
        calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude) <= searchRadius;

      return matchQuery && matchCategory && matchLocation;
    });
  }, [salons, query, category, userLocation, searchRadius]);

  /* =======================
     Location Search Handler
  ======================= */

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) {
      setUserLocation(null);
      setPage(1);
      return;
    }

    setLocationLoading(true);
    try {
      const coords = await geocodeAddress(locationQuery.trim());
      if (coords) {
        setUserLocation(coords);
        setPage(1);
      } else {
        alert('Adres niet gevonden. Probeer een ander adres.');
      }
    } catch (err) {
      alert('Fout bij het zoeken van het adres. Probeer het opnieuw.');
    } finally {
      setLocationLoading(false);
    }
  };

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));

  const paged = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  /* =======================
     UI
  ======================= */

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search bar - stays at top */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <Input
          placeholder="Zoek salon of behandeling"
          value={query}
          onChange={(e: any) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />

        <Button onClick={() => setPage(1)}>Zoek</Button>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar with filters */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h3 className="font-bold text-lg mb-4">Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Type salon
                </label>
                <select
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-11 rounded-xl border border-stone-200 px-3"
                >
                  <option value="all">Alle types salons</option>
                  {SALON_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Location-based search */}
              <div className="pt-4 border-t border-stone-200">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Zoek op locatie
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Bijv. Amsterdam, Utrecht..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleLocationSearch}
                      disabled={locationLoading}
                      size="sm"
                    >
                      {locationLoading ? <Loader2 size={16} className="animate-spin" /> : 'Zoek'}
                    </Button>
                  </div>

                  {userLocation && (
                    <div className="space-y-3">
                      <div className="text-xs text-green-600 font-medium">
                        ✓ Locatie gevonden
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Zoekradius: {searchRadius} km
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={searchRadius}
                          onChange={(e) => {
                            setSearchRadius(Number(e.target.value));
                            setPage(1);
                          }}
                          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-stone-500 mt-1">
                          <span>1 km</span>
                          <span>50 km</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUserLocation(null);
                          setLocationQuery('');
                          setPage(1);
                        }}
                        className="w-full"
                      >
                        Locatie wissen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional filters can be added here */}
              <div className="pt-4 border-t border-stone-200">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setQuery(''); 
                    setCategory('all'); 
                    setUserLocation(null);
                    setLocationQuery('');
                    setSearchRadius(10);
                    setPage(1); 
                  }}
                  className="w-full"
                >
                  Reset filters
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h1 className="font-bold text-xl">
                {loading ? 'Laden…' : `${total} salons gevonden`}
              </h1>
              {userLocation && (
                <p className="text-sm text-stone-500 mt-1">
                  Binnen {searchRadius} km van {locationQuery}
                </p>
              )}
            </div>
            <span className="text-sm text-stone-500">
              Pagina {page} van {pages}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" />
            </div>
          ) : paged.length === 0 ? (
            <Card className="p-8 text-center">
              Geen salons gevonden.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paged.map(s => (
                <Card key={s.id} className="flex flex-col">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{s.name}</h3>
                      </div>
                      <p className="text-sm text-stone-500">
                        <MapPin size={14} className="inline mr-1" />
                        {s.city}
                        {userLocation && s.latitude && s.longitude && (
                          <span className="ml-2 text-blue-600">
                            • {calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude).toFixed(1)} km
                          </span>
                        )}
                      </p>

                      <p className="text-sm mt-2 line-clamp-2 text-stone-600">
                        {s.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.services?.slice(0, 3).map(sv => (
                          <Badge key={sv.id}>{sv.name}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-stone-600">
                        {s.rating} ★ • {s.reviewCount} reviews
                      </span>

                      <div className="flex gap-2">
                        <Button onClick={() => navigate(`/salon/${s.id}`)}>
                          Bekijk
                        </Button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(s.salonId);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            favorites.has(s.salonId) 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600'
                          }`}
                        >
                          <Heart className={favorites.has(s.salonId) ? 'fill-current' : ''} size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Vorige
            </Button>
            <span className="text-sm">
              {page}/{pages}
            </span>
            <Button
              variant="outline"
              disabled={page === pages}
              onClick={() => setPage(p => Math.min(pages, p + 1))}
            >
              Volgende
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};