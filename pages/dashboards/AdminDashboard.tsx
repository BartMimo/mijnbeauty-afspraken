import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Check, X, MoreHorizontal, ShieldAlert, CreditCard, ExternalLink } from 'lucide-react';
import { Card, Badge, Button } from '../../components/UIComponents';

export const AdminDashboard: React.FC = () => {
    const data = [
        { name: 'Ma', bookings: 40 },
        { name: 'Di', bookings: 30 },
        { name: 'Wo', bookings: 20 },
        { name: 'Do', bookings: 27 },
        { name: 'Vr', bookings: 68 },
        { name: 'Za', bookings: 90 },
        { name: 'Zo', bookings: 30 },
    ];

    const newSalons = [
        { id: 1, name: 'Beauty by Sophie', city: 'Amsterdam', date: '21-11-2023' },
        { id: 2, name: 'The Man Cave', city: 'Rotterdam', date: '20-11-2023' },
    ];
    
    // Mock Flagged Content
    const flaggedReviews = [
        { id: 1, salon: 'Barber Bros', user: 'Ontevreden Klant', text: 'Dit is echt k*t service, nooit heen gaan!', reason: 'Grof taalgebruik', date: 'Vandaag' },
        { id: 2, salon: 'Zen Massage', user: 'Bot', text: 'Koop nu crypto via...', reason: 'Spam', date: 'Gisteren' }
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-stone-900">Admin Overzicht</h1>
            
            {/* System Status / Billing */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 bg-stone-900 text-white border-none">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/10 rounded-lg"><CreditCard size={20} className="text-brand-300"/></div>
                        <div>
                            <h3 className="font-bold">Stripe Connect</h3>
                            <p className="text-xs text-stone-400">Automatische Facturatie</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                         <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                         <span className="text-sm font-medium">Systeem Actief</span>
                    </div>
                    <div className="text-xs text-stone-400 mt-2 pt-2 border-t border-white/10">
                        Laatste batch: Vandaag, 04:00 (124 facturen)
                    </div>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-2">Totale Omzet (Platform)</h3>
                    <p className="text-3xl font-bold text-stone-900">€12.450</p>
                    <p className="text-sm text-green-600 mt-1">+15% t.o.v. vorige maand</p>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-2">Actieve Salons</h3>
                    <p className="text-3xl font-bold text-stone-900">142</p>
                    <p className="text-sm text-stone-500 mt-1">12 in proefperiode</p>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-6">Boekingen per weekdag</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                                <Tooltip cursor={{fill: '#f5f5f4'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="bookings" fill="#fb7185" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-6">Groei Aantal Salons</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                                { m: 'Jan', s: 10 }, { m: 'Feb', s: 15 }, { m: 'Mrt', s: 22 }, 
                                { m: 'Apr', s: 35 }, { m: 'Mei', s: 45 }, { m: 'Jun', s: 60 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="s" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Pending Approvals */}
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-stone-900">Nieuwe aanmeldingen</h3>
                        <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/dashboard/admin/salons'}>Alles zien</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-stone-100">
                                {newSalons.map((salon) => (
                                    <tr key={salon.id} className="hover:bg-stone-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-stone-900">{salon.name}</div>
                                            <div className="text-xs text-stone-500">{salon.city}</div>
                                        </td>
                                        <td className="px-6 py-4"><Badge variant="warning">In afwachting</Badge></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                                                    <Check size={14} />
                                                </button>
                                                <button className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Content Moderation Queue */}
                <Card className="overflow-hidden border-red-100">
                     <div className="p-6 border-b border-red-100 bg-red-50/30 flex justify-between items-center">
                        <h3 className="font-bold text-stone-900 flex items-center">
                            <ShieldAlert size={18} className="mr-2 text-red-500"/> Moderatie Wachtrij
                        </h3>
                    </div>
                     <div className="divide-y divide-stone-100">
                        {flaggedReviews.map((item) => (
                             <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase">{item.reason}</span>
                                     <span className="text-xs text-stone-400">{item.date}</span>
                                 </div>
                                 <p className="text-sm text-stone-800 font-medium mb-1">"{item.text}"</p>
                                 <p className="text-xs text-stone-500">Door {item.user} bij <span className="font-semibold">{item.salon}</span></p>
                                 
                                 <div className="flex gap-2 mt-3">
                                     <Button size="sm" variant="outline" className="text-xs h-7">Negeren</Button>
                                     <Button size="sm" variant="danger" className="text-xs h-7">Verwijderen</Button>
                                 </div>
                             </div>
                        ))}
                     </div>
                </Card>
            </div>
        </div>
    );
};