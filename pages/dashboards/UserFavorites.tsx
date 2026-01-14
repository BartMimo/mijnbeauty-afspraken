import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, ArrowRight } from 'lucide-react';
import { Card, Button, Badge } from '../../components/UIComponents';
import { MOCK_SALONS } from '../../services/mockData';

export const UserFavorites: React.FC = () => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const savedFavs = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        setFavorites(savedFavs);
    }, []);

    const removeFavorite = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newFavs = favorites.filter(favId => favId !== id);
        setFavorites(newFavs);
        localStorage.setItem('user_favorites', JSON.stringify(newFavs));
    };

    const favoriteSalons = MOCK_SALONS.filter(salon => favorites.includes(salon.id));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Mijn Favorieten</h1>
                <p className="text-stone-500">Salons die je hebt bewaard.</p>
            </div>

            {favoriteSalons.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteSalons.map(salon => (
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
                                         {salon.services.slice(0, 2).map(s => (
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