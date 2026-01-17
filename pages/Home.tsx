import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Scissors, CheckCircle, ArrowRight, Tag, Clock, Euro, Calendar, Loader2 } from 'lucide-react';
import { Button, Input, Card, Badge } from '../components/UIComponents';
import { supabase } from '../lib/supabase';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [deals, setDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);

  // Fetch deals from Supabase
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select(`
            *,
            salon:salons(id, name, slug)
          `)
          .limit(4);

        if (error) throw error;

        const transformed = (data || []).map((deal: any) => ({
          id: deal.id,
          serviceName: deal.service_name,
          originalPrice: deal.original_price,
          discountPrice: deal.discount_price,
          date: deal.date,
          time: deal.time,
          salonName: deal.salon?.name || 'Salon',
          salonId: deal.salon?.slug || deal.salon?.id
        }));

        setDeals(transformed);
      } catch (err) {
        console.error('Error fetching deals:', err);
      } finally {
        setLoadingDeals(false);
      }
    };

    fetchDeals();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Add default distance of 25km to search params
    navigate(`/search?q=${searchQuery}&loc=${location}&dist=25`);
  };

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-50 via-white to-sky-50 py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Al je <span className="text-brand-400">beauty-afspraken</span><br className="hidden md:block" /> op één plek.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base md:text-lg text-stone-600 px-4">
                Vind de beste salons bij jou in de buurt, bekijk reviews en boek direct een afspraak. Zonder gedoe.
            </p>

            {/* Search Box */}
            <div className="mx-auto mt-10 max-w-3xl px-2 md:px-0">
                <Card className="p-4 shadow-xl shadow-brand-100/50">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 md:gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute left-3 top-3 text-stone-400">
                                <Search size={20} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Welke behandeling zoek je?" 
                                className="w-full h-12 md:h-11 pl-10 pr-4 rounded-xl bg-stone-50 border-transparent focus:bg-white transition-colors outline-none text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 relative">
                            <div className="absolute left-3 top-3 text-stone-400">
                                <MapPin size={20} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Postcode of stad" 
                                className="w-full h-12 md:h-11 pl-10 pr-4 rounded-xl bg-stone-50 border-transparent focus:bg-white transition-colors outline-none text-base"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full md:w-auto h-12 md:h-11">
                            Zoeken
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
      </section>

      {/* Deals Section (Replaces Categories) */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-2">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 flex items-center">
                    <Tag className="mr-2 text-brand-500" size={24} /> Huidige Deals
                </h2>
                <p className="text-stone-500 mt-1 text-sm md:text-base">Last-minute plekken met hoge kortingen!</p>
            </div>
            <a href="/search?filter=deals" className="text-brand-400 font-medium hover:underline text-sm flex items-center">
                Bekijk alle deals <ArrowRight size={16} className="ml-1" />
            </a>
        </div>
        {loadingDeals ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
        ) : deals.length === 0 ? (
          <Card className="p-8 text-center bg-stone-50">
            <p className="text-stone-500">Momenteel zijn er geen actieve deals beschikbaar.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((deal) => {
                const discount = Math.round(((deal.originalPrice - deal.discountPrice) / deal.originalPrice) * 100);
                return (
                    <Card key={deal.id} className="overflow-hidden group hover:shadow-lg transition-all border-brand-100 flex flex-col h-full">
                         <div className="bg-brand-400 text-white px-3 py-1 text-xs font-bold absolute top-3 right-3 rounded-lg shadow-sm z-10">
                            -{discount}%
                        </div>
                        <div className="p-5 flex flex-col h-full justify-between">
                            <div className="mb-3">
                                <h3 className="font-bold text-stone-900 text-lg truncate">{deal.serviceName}</h3>
                                <p className="text-stone-500 text-sm flex items-center mt-1 truncate">
                                    <MapPin size={14} className="mr-1 shrink-0" /> {deal.salonName}
                                </p>
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
        )}
      </section>

      {/* How it works */}
      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
             <div className="text-center mb-8 md:mb-12">
                <h2 className="text-3xl font-bold text-stone-900">Zo werkt het</h2>
                <p className="text-stone-500 mt-2">In drie simpele stappen naar jouw nieuwe look</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
                {[
                    { title: "1. Zoek & Vergelijk", desc: "Filter op locatie, behandeling en prijs. Lees echte reviews.", icon: Search },
                    { title: "2. Kies een tijdstip", desc: "Bekijk direct de agenda van de salon en kies je moment.", icon: Calendar },
                    { title: "3. Boek & Geniet", desc: "Bevestig je afspraak. Je ontvangt direct een mailtje.", icon: CheckCircle }
                ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 mb-4 md:mb-6 shadow-sm">
                            <step.icon size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-2">{step.title}</h3>
                        <p className="text-stone-600 max-w-xs">{step.desc}</p>
                    </div>
                ))}
             </div>
        </div>
      </section>

      {/* Partner CTA - Split Layout */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
            {/* Dark Block */}
            <div className="bg-stone-900 text-white p-8 md:p-12 flex flex-col justify-center">
                <div className="mb-4 text-brand-400">
                    <Scissors size={48} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Heb je een eigen salon?</h2>
                <p className="text-stone-300 text-base md:text-lg mb-6">
                    Beheer je boekingen, vul last-minute gaten met onze Deals-functie en trek nieuwe klanten aan.
                </p>
                <ul className="space-y-3 mb-8 text-stone-300">
                    <li className="flex items-center"><CheckCircle size={18} className="mr-2 text-brand-400 shrink-0" /> Gratis aanmelden</li>
                    <li className="flex items-center"><CheckCircle size={18} className="mr-2 text-brand-400 shrink-0" /> Direct meer bereik</li>
                    <li className="flex items-center"><CheckCircle size={18} className="mr-2 text-brand-400 shrink-0" /> Vul lege plekken op</li>
                </ul>
            </div>
            
            {/* White Block */}
            <div className="bg-white p-8 md:p-12 flex flex-col justify-center items-start border-l border-stone-100">
                <h3 className="text-2xl font-bold text-stone-900 mb-4">Start vandaag nog</h3>
                <p className="text-stone-600 mb-8">
                    Sluit je aan bij andere salons en betaal geen opstartkosten.
                </p>
                <div className="flex flex-col w-full gap-4">
                     <Button size="lg" className="w-full justify-center" onClick={() => navigate('/register?role=salon')}>
                        Salon aanmelden
                    </Button>
                    <Button variant="outline" size="lg" className="w-full justify-center" onClick={() => navigate('/for-partners')}>
                        Meer informatie
                    </Button>
                </div>
            </div>
        </div>
      </section>
      
      {/* Lucide icon import fix for this specific file if needed, but imports are at top */}
      <div className="hidden"><Star /></div>
    </div>
  );
};