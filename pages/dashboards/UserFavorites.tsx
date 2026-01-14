import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { Card, Button, Badge } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const UserFavorites: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setFavorites([]);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('favorites')
                    .select(`
                        salon_id,
                        salons (
                            id,
                            slug,
                            name,
                            city,
                            address,
                            image_url,
                            description,
                            services (id, name)
                        )
                    `)
                    .eq('user_id', user.id);

                if (error) throw error;

                const transformed = (data || []).map((f: any) => ({
                    id: f.salons.slug || f.salons.id,
                    name: f.salons.name,
                    city: f.salons.city,
                    address: f.salons.address,
                    image: f.salons.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
                    description: f.salons.description,
                    rating: 4.5,
                    reviewCount: 0,
                    services: (f.salons.services || []).slice(0, 3).map((s: any) => ({
                        id: s.id,
                        name: s.name
                    }))
                }));

                setFavorites(transformed);
            } catch (err) {
                console.error('Error fetching favorites:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user]);

    const removeFavorite = async (e: React.MouseEvent, salonSlug: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) return;

        try {
            // Get salon UUID from slug
            const { data: salonData } = await supabase
                .from('salons')
                .select('id')
                .eq('slug', salonSlug)
                .single();

            if (!salonData) return;

            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('salon_id', salonData.id);

            setFavorites(favorites.filter(f => f.id !== salonSlug));
        } catch (err) {
            console.error('Error removing favorite:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-brand-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Mijn Favorieten</h1>
                <p className="text-stone-500">Salons die je hebt bewaard.</p>
            </div>

            {favorites.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {favorites.map(salon => (
                        <Card key={salon.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-48 bg-stone-200 relative">
                                <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
                                <button 
                                    onClick={(e) => removeFavorite(e, salon.id)}
                                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:scale-110 transition-transform shadow-sm"
                                    title="Verwijder uit favorieten"
                                >
                                    <Heart size={20} className="fill-red-500" />
                                </button>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-1">{salon.name}</h3>
                                    <p className="text-stone-500 text-sm flex items-center mb-3">
                                        <MapPin size={14} className="mr-1" /> {salon.city}
                                    </p>
                                    <div className="flex gap-2 flex-wrap mb-4">
                                         {salon.services.slice(0, 2).map((s: any) => (
                                             <Badge key={s.id}>{s.name}</Badge>
                                         ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-2">
                                     <div className="flex items-center text-sm font-bold text-stone-700">
                                        <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" />
                                        {salon.rating}
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/salon/${salon.id}`)}>
                                        Bekijken
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center bg-stone-50 border-dashed">
                    <Heart size={48} className="mx-auto text-stone-300 mb-4" />
                    <h3 className="text-lg font-medium text-stone-900">Nog geen favorieten</h3>
                    <p className="text-stone-500 mb-6">Je hebt nog geen salons aan je favorieten toegevoegd.</p>
                    <Button onClick={() => navigate('/search')}>
                        Ontdek Salons
                    </Button>
                </Card>
            )}
        </div>
    );
};