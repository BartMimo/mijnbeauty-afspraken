import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type LocationRow = {
  city: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800';

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
  const [location, setLocation] = useState(searchParams.get('loc') ?? '');
  const [category, setCategory] = useState<string>('all');
  const [showDealsOnly, setShowDealsOnly] = useState(
    searchParams.get('filter') === 'deals'
  );

  const [salons, setSalons] = useState<SalonVM[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [csvLocations, setCsvLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const perPage = 20;

  /* =======================
     Debounced geocode
  ======================= */

  const geocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geocode = (value: string) => {
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);

    geocodeTimeout.current = setTimeout(async () => {
      if (value.trim().length < 3) return;
      try {
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value + ', Netherlands'
          )}`
        );
      } catch {
        /* silent */
      }
    }, 500);
  };

  /* =======================
     Fetch CSV locations
  ======================= */

  useEffect(() => {
    fetch('/locations.csv')
      .then(r => r.ok ? r.text() : null)
      .then(txt => {
        if (!txt) return;
        const parsed = txt
          .split('\n')
          .map(l => l.split(','))
          .map(cols => ({
            city: cols[0]?.trim(),
            postcode: cols[1]?.trim(),
            latitude: parseFloat(cols[2]),
            longitude: parseFloat(cols[3]),
          }))
          .filter(r => r.city && r.postcode);
        setCsvLocations(parsed as LocationRow[]);
      })
      .catch(() => {});
  }, []);

  /* =======================
     Fetch DB locations
  ======================= */

  useEffect(() => {
    supabase
      .from('locations')
      .select('*')
      .order('city')
      .then(({ data }) => setLocations((data ?? []) as LocationRow[]))
      .catch(() => {});
  }, []);

  /* =======================
     Fetch salons
  ======================= */

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from('salons')
        .select(`*, services(id,name), categories, locations(latitude,longitude,city,postcode)`)
        .eq('status', 'active');

      if (!active || error) return;

      setSalons(
        (data ?? []).map((s: any): SalonVM => ({
          id: s.slug ?? s.id,
          slug: s.slug,
          name: s.name,
          city: s.locations?.city ?? '',
          address: s.address ?? '',
          zipCode: s.locations?.postcode ?? '',
          latitude: s.locations?.latitude,
          longitude: s.locations?.longitude,
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
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  /* =======================
     Filtering
  ======================= */

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const loc = location.toLowerCase().trim();

    return salons.filter(s => {
      if (showDealsOnly) return true;

      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.services?.some(sv => sv.name.toLowerCase().includes(q));

      const matchCategory =
        category === 'all' || s.categories?.includes(category);

      const matchLocation =
        !loc ||
        s.city.toLowerCase().includes(loc) ||
        s.zipCode?.startsWith(location);

      return matchQuery && matchCategory && matchLocation;
    });
  }, [salons, query, location, category, showDealsOnly]);

  /* =======================
     Pagination
  ======================= */

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));

  const paged = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  /* =======================
     Suggestions
  ======================= */

  const suggestions = useMemo(() => {
    const set = new Set<string>();
    [...locations, ...csvLocations].forEach(l => {
      if (l.city) set.add(l.city);
      if (l.postcode) set.add(l.postcode);
      if (l.city && l.postcode) set.add(`${l.postcode} - ${l.city}`);
    });
    salons.forEach(s => s.city && set.add(s.city));
    return Array.from(set).slice(0, 2000);
  }, [locations, csvLocations, salons]);

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

        <input
          list="locs"
          placeholder="Postcode of stad"
          value={location}
          onChange={e => {
            setLocation(e.target.value);
            geocode(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-stone-200 px-3"
        />

        <datalist id="locs">
          {suggestions.map(s => (
            <option key={s} value={s} />
          ))}
        </datalist>

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

              {/* Additional filters can be added here */}
              <div className="pt-4 border-t border-stone-200">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setQuery(''); 
                    setLocation(''); 
                    setCategory('all'); 
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
          <div className="mb-4 flex justify-between">
            <h1 className="font-bold text-xl">
              {loading ? 'Laden…' : `${total} salons gevonden`}
            </h1>
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
                      <h3 className="font-bold text-lg">{s.name}</h3>
                      <p className="text-sm text-stone-500">
                        <MapPin size={14} className="inline mr-1" />
                        {s.city}
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
                        <button className="p-2 rounded-full bg-stone-100">
                          <Heart />
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