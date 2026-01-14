import React from 'react';
import { CheckCircle, Mail, Phone, MapPin, HelpCircle, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card } from '../components/UIComponents';
import { useNavigate } from 'react-router-dom';

// --- Shared Layout Wrapper for Text Pages ---
const PageLayout: React.FC<{ title: string; subtitle?: string; icon?: React.ElementType; children: React.ReactNode }> = ({ title, subtitle, icon: Icon, children }) => (
    <div className="min-h-screen bg-stone-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
                {Icon && (
                    <div className="mx-auto h-16 w-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-500 mb-6">
                        <Icon size={32} />
                    </div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{title}</h1>
                {subtitle && <p className="text-lg text-stone-600 max-w-2xl mx-auto">{subtitle}</p>}
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 md:p-12">
                {children}
            </div>
        </div>
    </div>
);

// --- About Us Page ---
export const AboutPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-stone-50">
            {/* Hero */}
            <section className="bg-white py-20 border-b border-stone-100">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6">Wij geloven in <span className="text-brand-400">jouw tijd</span></h1>
                    <p className="text-xl text-stone-600 leading-relaxed">
                        Mijn Beauty Afspraken is ontstaan vanuit een simpele frustratie: waarom is het boeken van een kapper of nagelstylist vaak nog zo ingewikkeld? Wij maken beauty toegankelijk voor iedereen.
                    </p>
                </div>
            </section>

            <section className="py-16 container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800" alt="Team working" className="rounded-3xl shadow-lg" />
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-stone-900">Onze Missie</h2>
                        <p className="text-stone-600">
                            Wij verbinden gepassioneerde beauty-professionals met klanten die op zoek zijn naar kwaliteit. Voor salons bieden we de tools om te groeien zonder technische kopzorgen. Voor klanten bieden we het gemak van 24/7 boeken.
                        </p>
                        <ul className="space-y-3">
                            {[
                                "Eerlijkheid en transparantie",
                                "Gemak staat voorop",
                                "Ondersteuning van lokale ondernemers",
                                "Innovatie in de beauty-branche"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center text-stone-700">
                                    <CheckCircle size={20} className="text-brand-400 mr-3" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-brand-50 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-stone-900 mb-8">Klaar om mee te doen?</h2>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" onClick={() => navigate('/search')}>Zoek een salon</Button>
                        <Button variant="outline" size="lg" onClick={() => navigate('/register?role=salon')}>Salon aanmelden</Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

// --- Help & Contact Page ---
export const HelpPage: React.FC = () => {
    const faqs = [
        { q: "Hoe kan ik een afspraak annuleren?", a: "Je kunt je afspraak annuleren via je account dashboard onder 'Mijn Afspraken'. Let op: sommige salons hanteren annuleringskosten bij annulering binnen 24 uur." },
        { q: "Moet ik direct online betalen?", a: "Nee, bij de meeste salons op ons platform betaal je pas in de salon zelf na je behandeling. Dit staat altijd duidelijk aangegeven bij het boeken." },
        { q: "Ik ben mijn wachtwoord vergeten, wat nu?", a: "Op de inlogpagina kun je klikken op 'Wachtwoord vergeten'. Je ontvangt dan een e-mail om een nieuw wachtwoord in te stellen." },
        { q: "Hoe meld ik mijn salon aan?", a: "Via de pagina 'Voor salons' kun je je binnen 2 minuten registreren. Je krijgt direct toegang tot je dashboard om je profiel in te richten." },
    ];

    return (
        <PageLayout title="Hulp & Contact" subtitle="We staan voor je klaar. Bekijk de veelgestelde vragen of neem contact op." icon={HelpCircle}>
            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-xl font-bold text-stone-900 mb-6">Veelgestelde vragen</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <details key={idx} className="group bg-stone-50 rounded-xl p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex items-center justify-between font-medium text-stone-900">
                                    {faq.q}
                                    <span className="ml-2 transition-transform group-open:rotate-180">
                                        <ChevronDown size={16} />
                                    </span>
                                </summary>
                                <p className="text-stone-600 mt-3 text-sm leading-relaxed">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h2 className="text-xl font-bold text-stone-900 mb-6">Neem contact op</h2>
                    <div className="space-y-6">
                        <Card className="p-6 border-l-4 border-l-brand-400">
                            <h3 className="font-bold text-stone-900 mb-2">Support Team</h3>
                            <p className="text-sm text-stone-600 mb-4">Wij reageren doorgaans binnen 4 uur op werkdagen.</p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center text-stone-700">
                                    <Mail size={18} className="mr-3 text-stone-400" />
                                    <a href="mailto:info@mijnbeautyafspraken.nl" className="hover:text-brand-500">info@mijnbeautyafspraken.nl</a>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

// --- Privacy Policy Page ---
export const PrivacyPage: React.FC = () => {
    return (
        <PageLayout title="Privacybeleid" icon={Shield}>
            <div className="prose prose-stone max-w-none">
                <p className="lead">Laatst bijgewerkt: 24 oktober 2023</p>
                
                <h3>1. Inleiding</h3>
                <p>Mijn Beauty Afspraken geeft om uw privacy. In dit beleid leggen we uit hoe we omgaan met uw persoonsgegevens wanneer u ons platform gebruikt om afspraken te boeken.</p>
                
                <h3>2. Welke gegevens verzamelen wij?</h3>
                <p>Wanneer u een account aanmaakt of een boeking plaatst, vragen wij om:</p>
                <ul>
                    <li>Naam en contactgegevens (e-mail, telefoonnummer)</li>
                    <li>Boekingsgeschiedenis</li>
                    <li>Voorkeuren voor communicatie</li>
                </ul>
                
                <h3>3. Hoe gebruiken wij uw gegevens?</h3>
                <p>Wij gebruiken uw gegevens uitsluitend om:</p>
                <ul>
                    <li>Uw boeking te bevestigen en door te geven aan de gekozen salon.</li>
                    <li>U herinneringen te sturen voor uw afspraak.</li>
                    <li>Onze dienstverlening te verbeteren.</li>
                </ul>
                
                <h3>4. Delen met derden</h3>
                <p>Uw gegevens worden alleen gedeeld met de salon waar u een afspraak boekt. Wij verkopen uw gegevens nooit aan derden voor marketingdoeleinden.</p>
                
                <h3>5. Uw rechten</h3>
                <p>U heeft altijd het recht om uw gegevens in te zien, te wijzigen of te laten verwijderen. Neem hiervoor contact op met onze support.</p>
            </div>
        </PageLayout>
    );
};

// --- Terms & Conditions Page ---
export const TermsPage: React.FC = () => {
    return (
        <PageLayout title="Algemene Voorwaarden" icon={FileText}>
             <div className="prose prose-stone max-w-none">
                <p className="lead">Door gebruik te maken van Mijn Beauty Afspraken gaat u akkoord met onderstaande voorwaarden.</p>
                
                <h3>1. Het Platform</h3>
                <p>Mijn Beauty Afspraken is een tussenplatform. Wij faciliteren de boeking, maar de overeenkomst voor de dienstverlening komt tot stand tussen u (de consument) en de salon.</p>
                
                <h3>2. Boekingen en Annuleringen</h3>
                <p>
                    Het maken van een boeking is bindend. Annuleren kan kosteloos tot 24 uur voor de afspraak, tenzij de salon specifieke andere voorwaarden hanteert. 
                    Bij "no-show" (niet komen opdagen zonder afmelding) heeft de salon het recht om de kosten in rekening te brengen.
                </p>
                
                <h3>3. Betalingen</h3>
                <p>Tenzij vooraf anders aangegeven, vinden betalingen plaats in de salon na afloop van de behandeling. De prijzen op het platform zijn indicatief; toeslagen voor extra werk (bijv. lang haar) kunnen van toepassing zijn.</p>
                
                <h3>4. Aansprakelijkheid</h3>
                <p>Mijn Beauty Afspraken is niet aansprakelijk voor de kwaliteit van de uitgevoerde behandelingen of schade voortvloeiend uit een bezoek aan een aangesloten salon.</p>
                
                <h3>5. Reviews</h3>
                <p>Reviews dienen op waarheid gebaseerd te zijn. Wij behouden ons het recht voor om reviews die strijdig zijn met onze richtlijnen te verwijderen.</p>
            </div>
        </PageLayout>
    );
};