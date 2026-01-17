import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingUp, Calendar, Shield, Zap, Users, Check, Globe } from 'lucide-react';
import { Button, Card } from '../components/UIComponents';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export const ForPartners: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-stone-900 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-stone-800/30 skew-x-12 translate-x-20"></div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                    Jouw salon, <span className="text-brand-400">volgeboekt.</span>
                </h1>
                <p className="text-lg text-stone-300 mb-8 max-w-xl">
                    Het alles-in-één platform voor beauty professionals. Beheer je agenda, trek nieuwe klanten aan en krijg direct je eigen professionele boekingspagina.
                </p>
                <div className="mt-8 flex items-center gap-4 text-sm text-stone-400">
                    <span className="flex items-center"><CheckCircle size={16} className="mr-2 text-brand-400" /> Geen creditcard nodig</span>
                    <span className="flex items-center"><CheckCircle size={16} className="mr-2 text-brand-400" />  Gratis</span>
                </div>
            </div>
            <div className="md:w-1/2 relative">
                {/* Abstract visualization of the dashboard */}
                <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 text-stone-900 rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                        <div className="font-bold text-lg">Dashboard</div>
                        <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">+24% boekingen</div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-xl transition-colors">
                                <div className="h-10 w-10 rounded-full bg-stone-200"></div>
                                <div className="flex-1">
                                    <div className="h-4 w-24 bg-stone-200 rounded mb-2"></div>
                                    <div className="h-3 w-16 bg-stone-100 rounded"></div>
                                </div>
                                <div className="h-8 w-20 bg-brand-50 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Dashboard Screenshots Slider */}
      <section className="py-20 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">Bekijk het dashboard</h2>
            <p className="text-stone-500 text-lg">Ontdek hoe eenvoudig het is om je salon te beheren met ons intuïtieve dashboard.</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              className="rounded-2xl shadow-2xl"
            >
              <SwiperSlide>
                <div className="aspect-video bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/dashboard-screenshot-1.png" 
                    alt="Dashboard overzicht" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="aspect-video bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/dashboard-screenshot-2.png" 
                    alt="Agenda beheer" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="aspect-video bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/dashboard-screenshot-3.png" 
                    alt="Klantenbeheer" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="aspect-video bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/dashboard-screenshot-4.png" 
                    alt="Statistieken" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="aspect-video bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/dashboard-screenshot-5.png" 
                    alt="Dashboard screenshot 5" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="aspect-video bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/dashboard-screenshot-6.png" 
                    alt="Dashboard screenshot 6" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="aspect-video bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/dashboard-screenshot-7.png" 
                    alt="Dashboard screenshot 7" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-stone-900 mb-4">Waarom partner worden?</h2>
                <p className="text-stone-500 text-lg">Wij nemen het gedoe uit het beheren van je salon, zodat jij je kunt focussen op waar je goed in bent.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { title: "Meer Zichtbaarheid", desc: "Word gevonden door duizenden klanten in jouw regio die op zoek zijn naar jouw diensten.", icon: Users },
                    { title: "Slimme Agenda", desc: "Een overzichtelijk planningssysteem dat 24/7 werkt, ook als jij gesloten bent.", icon: Calendar },
                    { title: "Jouw Eigen Website", desc: "Krijg direct een unieke link (jouwnaam.mijnbeautyafspraken.nl) om te delen op Instagram.", icon: Globe },
                    { title: "Deals Functie", desc: "Vul lege gaten in je agenda direct op door last-minute deals aan te bieden.", icon: Zap },
                    { title: "Statistieken", desc: "Krijg inzicht in jouw populairste behandelingen en klanttevredenheid.", icon: TrendingUp },
                    { title: "Veilige Betalingen", desc: "Laat klanten gewoon in de salon betalen.", icon: Shield },
                ].map((feature, idx) => (
                    <Card key={idx} className="p-8 hover:shadow-lg transition-shadow border-stone-100">
                        <div className="h-12 w-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500 mb-6">
                            <feature.icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                        <p className="text-stone-500 leading-relaxed">{feature.desc}</p>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-brand-50/50">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-stone-900 mb-4">Aanmelden is gratis</h2>
                    <p className="text-stone-500 text-lg">Geen abonnementskosten voor salons. Meld je aan en gebruik alle functies gratis.</p>
                </div>
                
                <Card className="relative overflow-hidden bg-white border-2 border-brand-100 shadow-xl rounded-3xl">
                    <div className="absolute top-0 right-0 bg-brand-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        GRATIS VOOR SALONS
                    </div>
                    <div className="grid md:grid-cols-2">
                        <div className="p-8 md:p-12 flex flex-col justify-center bg-stone-900 text-white">
                            <h3 className="text-xl font-medium text-stone-300 mb-2">Alles inbegrepen</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-bold text-white">GRATIS</span>
                            </div>
                            <p className="text-stone-300 mb-8">
                                Aanmelden is volledig gratis voor salons — geen abonnementskosten.
                            </p>
                            <Button size="lg" className="w-full bg-brand-400 hover:bg-brand-500 text-white border-none" onClick={() => navigate('/register?role=salon')}>
                                Start nu gratis
                            </Button>
                        </div>
                        <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
                            <h4 className="font-bold text-stone-900 mb-6 text-lg">Alles wat je nodig hebt:</h4>
                            <ul className="space-y-4">
                                {[
                                    "Onbeperkt aantal afspraken",
                                    "Jouw eigen website URL",
                                    "Agenda & klantenbeheer",
                                    "Deals & promoties plaatsen",
                                    "Statistieken dashboard",

                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-stone-600">
                                        <div className="mr-3 flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <Check size={14} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                      <h2 className="text-3xl font-bold text-stone-900 mb-6">In 3 stappen live</h2>
                      <div className="space-y-8">
                          {[
                              { step: 1, title: "Maak een account aan", desc: "Registreer je salon binnen 2 minuten. Geen technische kennis nodig." },
                              { step: 2, title: "Richt je profiel in", desc: "Voeg je diensten, prijzen, openingstijden en mooie foto's toe." },
                              { step: 3, title: "Ontvang boekingen", desc: "Zet je agenda open en verwelkom nieuwe klanten." }
                          ].map((item) => (
                              <div key={item.step} className="flex gap-4">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold">
                                      {item.step}
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-bold text-stone-900 mb-2">{item.title}</h3>
                                      <p className="text-stone-500">{item.desc}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="bg-stone-50 p-8 rounded-3xl shadow-lg border border-stone-100">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-stone-900">Klaar om te groeien?</h3>
                            <p className="text-stone-500 mt-2">Sluit je aan bij de snelst groeiende community.</p>
                        </div>
                        <Button 
                            size="lg" 
                            className="w-full mb-4"
                            onClick={() => navigate('/register?role=salon')}
                        >
                            Nu aanmelden
                        </Button>
                        <p className="text-center text-xs text-stone-400">
                            Door je aan te melden ga je akkoord met onze voorwaarden.
                        </p>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
};