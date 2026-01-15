import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Filter, SlidersHorizontal, Heart, X, Loader2, Tag, Clock } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UIComponents';
import { supabase } from '../lib/supabase';
import { ServiceCategory } from '../types';
import { useAuth } from '../context/AuthContext';

export const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const initialLoc = searchParams.get('loc') || '';
  const initialDist = searchParams.get('dist') ? parseInt(searchParams.get('dist')!) : null;
  const initialDealsFilter = searchParams.get('filter') === 'deals';

  const [filters, setFilters] = useState({
      query: initialQuery,
      location: initialLoc,
      category: 'all' as string,
      distance: initialDist,
      showDealsOnly: initialDealsFilter,
  });

  const [salons, setSalons] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch salons from Supabase - only active (approved) salons
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const { data, error } = await supabase
          .from('salons')
          .select(`
            *,
            services(id, name, price)
          `)
          .eq('status', 'active');

        if (error) throw error;

        const transformed = (data || []).map((salon: any) => ({
          id: salon.slug || salon.id,
          slug: salon.slug,
          uuid: salon.id,
          name: salon.name,
          city: salon.city || '',
          address: salon.address || '',
          zipCode: salon.zip_code || '',
          description: salon.description || '',
          image: salon.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
          rating: 4.5, // TODO: Calculate from reviews
          reviewCount: 0,
          services: (salon.services || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            category: ServiceCategory.NAILS // Default for now
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

  // Fetch deals from Supabase
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select(`
            *,
            salon:salons(id, name, slug, city, address, image_url)
          `)
          .eq('status', 'active');

        if (error) throw error;

        const transformed = (data || []).map((deal: any) => ({
          id: deal.id,
          serviceName: deal.service_name,
          description: deal.description,
          originalPrice: deal.original_price,
          discountPrice: deal.discount_price,
          date: deal.date,
          time: deal.time,
          salonName: deal.salon?.name || 'Salon',
          salonId: deal.salon?.slug || deal.salon?.id,
          salonCity: deal.salon?.city || '',
          salonAddress: deal.salon?.address || '',
          salonImage: deal.salon?.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
        }));

        setDeals(transformed);
      } catch (err) {
        console.error('Error fetching deals:', err);
      }
    };

    fetchDeals();
  }, []);

  // Fetch favorites from Supabase
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('salon_id')
          .eq('user_id', user.id);

        if (error) throw error;
        
        // Map salon UUIDs to slugs for favorites array
        const salonIds = (data || []).map(f => f.salon_id);
        
        // Get corresponding salon slugs
        if (salonIds.length > 0) {
          const { data: salonData } = await supabase
            .from('salons')
            .select('id, slug')
            .in('id', salonIds);
          
          const slugs = (salonData || []).map(s => s.slug || s.id);
          setFavorites(slugs);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setFavorites([]);
      }
    };

    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, salonSlug: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!user) {
        // Redirect to login if not authenticated
        navigate('/auth?redirect=/search');
        return;
      }

      try {
        // Get salon UUID from slug
        const { data: salonData } = await supabase
          .from('salons')
          .select('id')
          .eq('slug', salonSlug)
          .single();

        if (!salonData) return;

        const isFavorited = favorites.includes(salonSlug);

        if (isFavorited) {
          // Remove from favorites
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('salon_id', salonData.id);
          
          setFavorites(favorites.filter(id => id !== salonSlug));
        } else {
          // Add to favorites
          await supabase
            .from('favorites')
            .insert({ user_id: user.id, salon_id: salonData.id });
          
          setFavorites([...favorites, salonSlug]);
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
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

  // Filter deals
  const filteredDeals = deals.filter(deal => {
      const matchesQuery = deal.serviceName.toLowerCase().includes(filters.query.toLowerCase()) ||
                           deal.salonName.toLowerCase().includes(filters.query.toLowerCase());
      const matchesLoc = !filters.location || deal.salonCity.toLowerCase().includes(filters.location.toLowerCase());
      
      return matchesQuery && matchesLoc;
  });

  // Reusable Filter Form Component
  const FilterForm = () => (
      <div className="space-y-4">
        {/* Deals Toggle */}
        <div className="pb-4 border-b border-stone-100">
            <button
                onClick={() => setFilters({...filters, showDealsOnly: !filters.showDealsOnly})}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    filters.showDealsOnly 
                    ? 'border-brand-400 bg-brand-50 text-brand-700' 
                    : 'border-stone-200 hover:border-brand-300 text-stone-600'
                }`}
            >
                <span className="flex items-center font-medium">
                    <Tag size={18} className={`mr-2 ${filters.showDealsOnly ? 'text-brand-500' : 'text-stone-400'}`} />
                    Alleen deals tonen
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    filters.showDealsOnly ? 'border-brand-500 bg-brand-500' : 'border-stone-300'
                }`}>
                    {filters.showDealsOnly && <span className="text-white text-xs">✓</span>}
                </div>
            </button>
        </div>

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
        {!filters.showDealsOnly && (
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
        )}
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
                            Toon {filters.showDealsOnly ? filteredDeals.length : filteredSalons.length} resultaten
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* Results */}
        <div className="flex-1">
            <div className="mb-4 md:mb-6 flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold text-stone-900">
                    {loading ? 'Zoeken...' : filters.showDealsOnly 
                        ? `${filteredDeals.length} deals gevonden`
                        : `${filteredSalons.length} salons gevonden`
                    }
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
            ) : filters.showDealsOnly ? (
                /* Deals View */
                filteredDeals.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Tag size={48} className="mx-auto text-stone-300 mb-4" />
                        <p className="text-stone-500 mb-4">Geen deals gevonden met de opgegeven filters.</p>
                        <Button onClick={() => setFilters({...filters, query: '', location: '', showDealsOnly: false})}>
                            Bekijk alle salons
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDeals.map((deal) => {
                            const discount = Math.round(((deal.originalPrice - deal.discountPrice) / deal.originalPrice) * 100);
                            return (
                                <Card key={deal.id} className="overflow-hidden group hover:shadow-lg transition-all border-brand-100 flex flex-col relative">
                                    <div className="bg-brand-400 text-white px-3 py-1 text-xs font-bold absolute top-3 right-3 rounded-lg shadow-sm z-10">
                                        -{discount}%
                                    </div>
                                    <div className="h-40 bg-stone-200 relative">
                                        <img src={deal.salonImage} alt={deal.salonName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-5 flex flex-col flex-1 justify-between">
                                        <div className="mb-3">
                                            <h3 className="font-bold text-stone-900 text-lg truncate">{deal.serviceName}</h3>
                                            <p className="text-stone-500 text-sm flex items-center mt-1 truncate">
                                                <MapPin size={14} className="mr-1 shrink-0" /> {deal.salonName}
                                            </p>
                                            {deal.salonCity && (
                                                <p className="text-stone-400 text-xs mt-0.5">{deal.salonCity}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-xs font-medium bg-stone-100 text-stone-600 px-2 py-1 rounded flex items-center">
                                                    <Clock size={12} className="mr-1" /> {deal.date}, {deal.time}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-end border-t border-dashed border-stone-200 pt-4">
                                                <div>
                                                    <span className="text-sm text-stone-400 line-through">€{deal.originalPrice}</span>
                                                    <span className="text-xl font-bold text-brand-600 block">€{deal.discountPrice}</span>
                                                </div>
                                                <Button size="sm" onClick={() => navigate(`/salon/${deal.salonId}`)}>
                                                    Boek Nu
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )
            ) : (
                /* Salons View */
                filteredSalons.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-stone-500 mb-4">Geen salons gevonden met de opgegeven filters.</p>
                        <Button variant="outline" onClick={() => setFilters({query: '', location: '', category: 'all', distance: null, showDealsOnly: false})}>
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
                )
            )}
        </div>
      </div>
    </div>
  );
};