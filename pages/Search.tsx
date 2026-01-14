import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Filter, SlidersHorizontal, Heart, X, Loader2 } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { ServiceCategory } from '../types';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const initialLoc = searchParams.get('loc') || '';
  const initialDist = searchParams.get('dist') ? parseInt(searchParams.get('dist')!) : null;

  const [filters, setFilters] = useState({
      query: initialQuery,
      location: initialLoc,
      category: 'all' as string,
      distance: initialDist,
  });

  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch salons from Supabase
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const { data, error } = await supabase
          .from('salons')
          .select(`
            *,
            services(id, name, price)
          `);

        if (error) throw error;

        const transformed = (data || []).map((salon: any) => ({
          id: salon.slug || salon.id,
          name: salon.name,
          city: salon.city || '',
          address: salon.address || '',
          zipCode: '',
          rating: 4.5, // TODO: Calculate from reviews
          reviewCount: 0,
          services: (salon.services || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            category: ServiceCategory.Nails // Default for now
          }))
        }));

        setSalons(transformed);
      } catch (err) {
        console.error('Error fetching salons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, []);

  useEffect(() => {
      const savedFavs = JSON.parse(localStorage.getItem('user_favorites') || '[]');
      setFavorites(savedFavs);
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      let newFavs;
      if (favorites.includes(id)) {
          newFavs = favorites.filter(favId => favId !== id);
      } else {
          newFavs = [...favorites, id];
      }
      setFavorites(newFavs);
      localStorage.setItem('user_favorites', JSON.stringify(newFavs));
  };

  // Filter Logic
  const filteredSalons = salons.filter(salon => {
      const matchesQuery = salon.name.toLowerCase().includes(filters.query.toLowerCase()) || 
                           salon.services.some((s: any) => s.name.toLowerCase().includes(filters.query.toLowerCase()));
      const matchesLoc = salon.city.toLowerCase().includes(filters.location.toLowerCase()) ||
                         salon.zipCode.toLowerCase().includes(filters.location.toLowerCase());
      const matchesCat = filters.category === 'all' || salon.services.some((s: any) => s.category === filters.category);
      
      return matchesQuery && matchesLoc && matchesCat;
  });

  // Reusable Filter Form Component
  const FilterForm = () => (
      <div className="space-y-4">
        <div>
            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Zoeken</label>
            <Input 
                placeholder="Salon naam of behandeling" 
                value={filters.query}
                onChange={(e) => setFilters({...filters, query: e.target.value})}
            />
        </div>
        <div>
            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Locatie</label>
            <Input 
                placeholder="Postcode of stad" 
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
        </div>
        <div>
            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Categorie</label>
            <select 
                className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
                <option value="all">Alle categorieën</option>
                {Object.values(ServiceCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
        <div className="pt-4 border-t border-stone-100">
            <label className="text-sm font-medium text-stone-700 mb-3 block">Afstand</label>
            <div className="flex gap-2 flex-wrap">
                {[5, 10, 25, 50].map(dist => (
                    <button 
                        key={dist} 
                        onClick={() => setFilters({...filters, distance: dist})}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            filters.distance === dist 
                            ? 'bg-brand-50 border-brand-400 text-brand-600 font-medium' 
                            : 'border-stone-200 hover:border-brand-400 hover:text-brand-500 text-stone-600'
                        }`}
                    >
                        {dist} km
                    </button>
                ))}
            </div>
        </div>
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-6 flex gap-3">
          <Button variant="outline" className="flex-1 flex justify-center items-center" onClick={() => setShowMobileFilters(true)}>
              <SlidersHorizontal size={18} className="mr-2" /> Filters & Sorteren
          </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-1/4 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={20} className="text-brand-500" />
                <h2 className="font-bold text-lg text-stone-800">Filters</h2>
            </div>
            <FilterForm />
        </aside>

        {/* Mobile Filter Drawer (Overlay) */}
        {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
                <div className="fixed inset-y-0 right-0 w-full max-w-[320px] bg-white shadow-2xl p-6 overflow-y-auto animate-slideRight">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-xl text-stone-900">Filters</h2>
                        <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-stone-100 rounded-full text-stone-500">
                            <X size={20} />
                        </button>
                    </div>
                    <FilterForm />
                    <div className="mt-8 pt-4 border-t border-stone-100">
                        <Button className="w-full" onClick={() => setShowMobileFilters(false)}>
                            Toon {filteredSalons.length} resultaten
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* Results */}
        <div className="flex-1">
            <div className="mb-4 md:mb-6 flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold text-stone-900">
                    {loading ? 'Zoeken...' : `${filteredSalons.length} resultaten gevonden`}
                </h1>
                <div className="hidden md:flex items-center gap-2 text-sm text-stone-500">
                    <span>Sorteer op:</span>
                    <select className="bg-transparent font-medium text-stone-800 outline-none">
                        <option>Aanbevolen</option>
                        <option>Prijs: Laag - Hoog</option>
                        <option>Afstand</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-brand-500" size={32} />
                </div>
            ) : filteredSalons.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-stone-500 mb-4">Geen salons gevonden met de opgegeven filters.</p>
                    <Button onClick={() => setFilters({query: '', location: '', category: 'all', distance: null})}>
                        Reset filters
                    </Button>
                </Card>
            ) : (
            <div className="grid gap-6">
                {filteredSalons.map(salon => (
                    <Card key={salon.id} className="flex flex-col md:flex-row overflow-hidden hover:shadow-md transition-shadow">
                        <div className="w-full md:w-64 h-48 md:h-auto bg-stone-200 relative shrink-0">
                            <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
                            <button 
                                onClick={(e) => toggleFavorite(e, salon.id)}
                                className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm shadow-sm transition-transform hover:scale-110 ${favorites.includes(salon.id) ? 'bg-white/90 text-red-500' : 'bg-black/20 text-white hover:bg-black/30'}`}
                            >
                                <Heart size={20} className={favorites.includes(salon.id) ? "fill-red-500" : ""} />
                            </button>
                        </div>
                        <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-stone-900">{salon.name}</h3>
                                        <p className="text-stone-500 text-sm flex items-center mt-1">
                                            <MapPin size={14} className="mr-1" /> {salon.address}, {salon.city}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="bg-brand-50 text-brand-600 px-2 py-1 rounded-lg text-sm font-bold flex items-center">
                                            <Star size={14} className="fill-brand-600 mr-1" />
                                            {salon.rating}
                                        </div>
                                        <span className="text-xs text-stone-400 mt-1">{salon.reviewCount} reviews</span>
                                    </div>
                                </div>
                                <p className="mt-3 text-stone-600 text-sm line-clamp-2 leading-relaxed">
                                    {salon.description}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                     {salon.services.slice(0, 3).map(s => (
                                         <Badge key={s.id}>{s.name}</Badge>
                                     ))}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button className="w-full md:w-auto" onClick={() => navigate(`/salon/${salon.id}`)}>
                                    Bekijk & Boek
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};