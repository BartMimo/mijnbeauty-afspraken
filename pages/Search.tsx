import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, SlidersHorizontal, Heart, Loader2, Tag, Clock } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { ServiceCategory } from '../types';
import { useAuth } from '../context/AuthContext';

// Small types for the view model
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

export const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query defaults from URL
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [location, setLocation] = useState(() => searchParams.get('loc') || '');
  const [category, setCategory] = useState<string>(() => 'all');
  // afstandsfilter verwijderd
  const [showDealsOnly, setShowDealsOnly] = useState<boolean>(() => searchParams.get('filter') === 'deals');

  const [salons, setSalons] = useState<SalonVM[]>([]);
  const [locations, setLocations] = useState<{ city: string; postcode: string; latitude?: number; longitude?: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [csvLocations, setCsvLocations] = useState<{ city: string; postcode: string; latitude?: number; longitude?: number }[]>([]);
  const [page, setPage] = useState<number>(1);
  const perPage = 20;

  // Debounce helper
  function debounce<T extends (...args: any[]) => any>(fn: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    }) as T;
  }

  // Simple debounced geocoding to avoid rate limiting
  const geocode = useCallback(debounce(async (q: string) => {
    if (!q || q.trim().length < 3) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Netherlands')}`);
      if (!res.ok) return; // silence bad responses
      const data = await res.json();
      if (data && data.length > 0) {
        setLocationCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }
  }, 500), []);

  useEffect(() => {
    // Load static CSV fallback once
    (async () => {
      try {
        const r = await fetch('/locations.csv');
        if (!r.ok) return;
        const txt = await r.text();
        const rows = txt.split('\n').map(l => l.split(','));
        const parsed = rows
          .map(cols => ({ city: cols[0]?.trim(), postcode: cols[1]?.trim(), latitude: parseFloat(cols[2]), longitude: parseFloat(cols[3]) }))
          .filter(rw => rw.city && rw.postcode);
        setCsvLocations(parsed);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    // Fetch locations for suggestions
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from('locations').select('*').order('city', { ascending: true });
        if (error) throw error;
        setLocations((data || []) as any);
        console.log('Fetched', (data || []).length, 'locations');
      } catch (e) {
        console.error('Failed to fetch locations', e);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    // Fetch active salons
    const fetchSalons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('salons')
          .select(`*, services(id, name), categories, locations(latitude, longitude, city, postcode)`) // using related locations
          .eq('status', 'active');
        if (error) throw error;
        const res = (data || []).map((s: any) => ({
          id: s.slug || s.id,
          slug: s.slug,
          name: s.name,
          city: s.locations?.city || s.city || '',
          address: s.address || '',
          zipCode: s.locations?.postcode || s.zip_code || '',
          latitude: s.locations?.latitude || s.latitude,
          longitude: s.locations?.longitude || s.longitude,
          description: s.description || '',
          image: s.image_url || s.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
          rating: s.rating || 4.5,
          reviewCount: s.review_count || 0,
          categories: s.categories || [],
          services: (s.services || []).map((svc: any) => ({ id: svc.id, name: svc.name }))
        })) as SalonVM[];
        setSalons(res);
        console.log('Fetched', res.length, 'salons');
      } catch (e) {
        console.error('Failed to fetch salons', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSalons();
  }, []);

  // When user types a location string, try to resolve coords from DB/CSV/geocode
  useEffect(() => {
    const val = (location || '').trim();
    if (!val) {
      setLocationCoords(null);
      return;
    }

    const low = val.toLowerCase();

    // try DB exact matches first
    let match = locations.find(l => (`${l.postcode} - ${l.city}`.toLowerCase() === low) || (l.city.toLowerCase() === low) || (l.postcode === val) || (l.postcode && l.postcode.toLowerCase().startsWith(low)));
    if (match && match.latitude && match.longitude) {
      setLocationCoords({ lat: match.latitude, lng: match.longitude });
      return;
    }

    // CSV fallback
    match = csvLocations.find(c => (`${c.postcode} - ${c.city}`.toLowerCase() === low) || (c.city.toLowerCase() === low) || (c.postcode === val) || (c.postcode && c.postcode.toLowerCase().startsWith(low)));
    if (match && match.latitude && match.longitude) {
      setLocationCoords({ lat: match.latitude, lng: match.longitude });
      return;
    }

    // Geocode last
    geocode(location);
  }, [location, locations, csvLocations, geocode]);

  // Haversine
  // afstandsfilter verwijderd

  // Filtering logic
  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    return salons.filter(s => {
      if (showDealsOnly) return true; // deals are handled separately in the UI (we'll fetch deals later if needed)
      const matchQuery = !q || s.name.toLowerCase().includes(q) || (s.services || []).some(svc => svc.name.toLowerCase().includes(q));
      const matchCategory = category === 'all' || (s.categories || []).includes(category);
      const matchLocationText = !location || s.city.toLowerCase().includes(location.toLowerCase()) || (s.zipCode || '').startsWith(location);
      return matchQuery && matchCategory && matchLocationText;
    });
  }, [salons, query, category, location, locationCoords, showDealsOnly]);

  // Pagination
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);

  // Suggestions
  const suggestions = useMemo(() => {
    const s = new Set<string>();
    locations.forEach(l => { if (l.postcode && l.city) s.add(`${l.postcode} - ${l.city}`); if (l.city) s.add(l.city); if (l.postcode) s.add(l.postcode); });
    salons.forEach(sal => sal.city && s.add(sal.city));
    csvLocations.forEach(c => { if (c.postcode && c.city) s.add(`${c.postcode} - ${c.city}`); if (c.city) s.add(c.city); if (c.postcode) s.add(c.postcode); });
    return Array.from(s).slice(0, 2000);
  }, [locations, salons, csvLocations]);

  // Handlers
  const onSearch = () => { setPage(1); /* url sync could be added here */ };
  const resetFilters = () => { setQuery(''); setLocation(''); setCategory('all'); setShowDealsOnly(false); setPage(1); };

  // Simple UI render
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="flex-1">
          <Input placeholder="Zoek salon of behandeling" value={query} onChange={(e:any) => setQuery(e.target.value)} />
        </div>
        <div className="w-64">
          <input list="locs" placeholder="Postcode of stad" value={location} onChange={e => setLocation(e.target.value)} className="w-full h-11 rounded-xl border border-stone-200 px-3" />
          <datalist id="locs">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <div className="w-48 hidden lg:block">
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-11 rounded-xl border border-stone-200 px-3">
            <option value="all">Alle categorieën</option>
            {Object.values(ServiceCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Afstand/slider verwijderd */}
        <div className="flex items-center gap-2">
          <Button onClick={onSearch}>Zoek</Button>
          <Button variant="outline" onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-1/4">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center gap-2 mb-2"><SlidersHorizontal /> <h3 className="font-bold">Filters</h3></div>
            <div>
              <label className="text-sm">Locatie</label>
              <input list="locs-sidebar" placeholder="Postcode of stad" value={location} onChange={e => setLocation(e.target.value)} className="w-full h-11 rounded-xl border border-stone-200 px-3" />
              <datalist id="locs-sidebar">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div>
              <label className="text-sm">Categorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-11 rounded-xl border border-stone-200 px-3">
                <option value="all">Alle categorieën</option>
                {Object.values(ServiceCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Afstand/slider verwijderd */}
          </div>
        </aside>

        <main className="flex-1">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">{loading ? 'Laden...' : `${total} salons gevonden`}</h1>
            <div className="text-sm text-stone-500">Pagina {page} van {pages}</div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
          ) : paged.length === 0 ? (
            <Card className="p-8 text-center">Geen salons gevonden. Probeer filters te wijzigen.</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map(s => (
                <Card key={s.id} className="flex flex-col">
                  <div className="h-40 bg-stone-200 overflow-hidden"><img src={s.image} alt={s.name} className="w-full h-full object-cover" /></div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{s.name}</h3>
                      <p className="text-sm text-stone-500"><MapPin size={14} className="inline mr-1" />{s.address}{s.city ? `, ${s.city}` : ''}</p>
                      <p className="text-sm mt-2 text-stone-600 line-clamp-2">{s.description}</p>
                      <div className="mt-3 flex gap-2 flex-wrap">{(s.services || []).slice(0,3).map(sv => <Badge key={sv.id}>{sv.name}</Badge>)}</div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-stone-600">{s.rating} ★ • {s.reviewCount} reviews</div>
                      <div className="flex gap-2">
                        <Button onClick={() => navigate(`/salon/${s.id}`)}>Bekijk</Button>
                        <button onClick={() => console.log('fav toggle not implemented here')} className="p-2 rounded-full bg-stone-100"><Heart /></button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="mt-6 flex justify-center items-center gap-2">
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Vorige</Button>
            <div className="text-sm">{page}/{pages}</div>
            <Button variant="outline" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}>Volgende</Button>
          </div>
        </main>
      </div>
    </div>
  );
};