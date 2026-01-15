import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Check, X, ShieldAlert, CreditCard, Loader2 } from 'lucide-react';
import { Card, Badge, Button } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';

export const AdminDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenue: 0,
        salons: 0,
        bookings: 0,
        users: 0
    });
    const [bookingsByDay, setBookingsByDay] = useState<{ name: string; bookings: number }[]>([]);
    const [salonGrowth, setSalonGrowth] = useState<{ m: string; s: number }[]>([]);
    const [newSalons, setNewSalons] = useState<{ id: string; name: string; city: string; date: string }[]>([]);
    const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [{ data: salonsData }, { data: apptsData }, { data: profilesData }] = await Promise.all([
                    supabase.from('salons').select('id, name, city, created_at'),
                    supabase.from('appointments').select('id, date, price'),
                    supabase.from('profiles').select('id, created_at')
                ]);

                const salons = salonsData || [];
                const appointments = apptsData || [];
                const profiles = profilesData || [];

                const revenue = appointments.reduce((sum: number, a: any) => sum + (a.price || 0), 0);
                setStats({
                    revenue,
                    salons: salons.length,
                    bookings: appointments.length,
                    users: profiles.length
                });

                // New salons (latest 5)
                const latest = [...salons]
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        city: s.city || '-',
                        date: new Date(s.created_at).toLocaleDateString('nl-NL')
                    }));
                setNewSalons(latest);

                // Bookings by weekday (Mon..Sun)
                const dayLabels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
                const dayCounts = Array(7).fill(0);
                appointments.forEach((a: any) => {
                    if (!a.date) return;
                    const d = new Date(`${a.date}T00:00:00`);
                    const jsDay = d.getDay(); // 0=Sun..6=Sat
                    const idx = jsDay === 0 ? 6 : jsDay - 1; // map to Mon..Sun index
                    dayCounts[idx] += 1;
                });
                setBookingsByDay(dayLabels.map((name, i) => ({ name, bookings: dayCounts[i] })));

                // Salon growth last 6 months
                const now = new Date();
                const months = [] as { key: string; label: string }[];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    months.push({
                        key: `${d.getFullYear()}-${d.getMonth()}`,
                        label: d.toLocaleDateString('nl-NL', { month: 'short' })
                    });
                }
                const monthCounts = new Map(months.map(m => [m.key, 0]));
                salons.forEach((s: any) => {
                    if (!s.created_at) return;
                    const d = new Date(s.created_at);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (monthCounts.has(key)) monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
                });
                setSalonGrowth(months.map(m => ({ m: m.label, s: monthCounts.get(m.key) || 0 })));

                // Placeholder for moderation queue (no reviews moderation table yet)
                setFlaggedReviews([]);
            } catch (err) {
                console.error('Admin dashboard load failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    const data = useMemo(() => bookingsByDay, [bookingsByDay]);

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
                    <p className="text-3xl font-bold text-stone-900">€{stats.revenue.toFixed(0)}</p>
                    <p className="text-sm text-stone-500 mt-1">Totaal geboekt: {stats.bookings}</p>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-2">Actieve Salons</h3>
                    <p className="text-3xl font-bold text-stone-900">{stats.salons}</p>
                    <p className="text-sm text-stone-500 mt-1">Gebruikers: {stats.users}</p>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-6">Boekingen per weekdag</h3>
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-stone-400">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                                <Tooltip cursor={{fill: '#f5f5f4'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="bookings" fill="#fb7185" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-6">Groei Aantal Salons</h3>
                    <div className="h-64">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-stone-400">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salonGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="s" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4}} />
                            </LineChart>
                        </ResponsiveContainer>
                        )}
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
                            {flaggedReviews.length === 0 ? (
                                <div className="p-4 text-sm text-stone-500">Geen meldingen.</div>
                            ) : flaggedReviews.map((item) => (
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