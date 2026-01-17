import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Loader2 } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { ServiceCategory } from '../types';

// Salon categories for filtering
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

export const Zoeken: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    const fetchSalons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('salons')
          .select(`*, services(id, name), categories, locations(latitude, longitude, city, postcode)`) 
          .eq('status', 'active');
        if (error) throw error;
        const mapped = (data || []).map((s: any) => ({
          id: s.slug || s.id,
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
        }));
        setSalons(mapped);
      } catch (err) {
        console.error('Error fetching salons for /zoeken', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalons();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salons.filter(s => {
      const matchQuery = !q || s.name.toLowerCase().includes(q) || (s.services || []).some((sv: any) => sv.name.toLowerCase().includes(q));
      const matchCategory = category === 'all' || (s.categories || []).includes(category);
      return matchQuery && matchCategory;
    });
  }, [salons, query, category]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <Input placeholder="Zoek salon of behandeling" value={query} onChange={(e:any) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <div className="w-48">
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="w-full h-11 rounded-xl border border-stone-200 px-3">
            <option value="all">Alle types salons</option>
            {SALON_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setPage(1); /* explicit search trigger if needed */ }}>Zoek</Button>
          <Button variant="outline" onClick={() => { setQuery(''); setCategory('all'); setPage(1); }}>Reset</Button>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{loading ? 'Laden...' : `${total} salons gevonden`}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : paged.length === 0 ? (
        <Card className="p-8 text-center">Geen salons gevonden. Probeer een andere zoekopdracht of categorie.</Card>
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
                  <div className="mt-3 flex gap-2 flex-wrap">{(s.services || []).slice(0,3).map((sv:any) => <Badge key={sv.id}>{sv.name}</Badge>)}</div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-stone-600">{s.rating} ★ • {s.reviewCount} reviews</div>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/salon/${s.id}`)}>Bekijk</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center items-center gap-2">
        <Button variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Vorige</Button>
        <div className="text-sm">{page}/{pages}</div>
        <Button variant="outline" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}>Volgende</Button>
      </div>
    </div>
  );
};

export default Zoeken;