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
    const [bookingsByMonth, setBookingsByMonth] = useState<{ name: string; bookings: number }[]>([]);
    const [weeklyComparison, setWeeklyComparison] = useState<{ week: string; bookings: number; revenue: number }[]>([]);
    const [monthlyComparison, setMonthlyComparison] = useState<{ month: string; bookings: number; revenue: number }[]>([]);
    const [salonGrowth, setSalonGrowth] = useState<{ m: string; s: number }[]>([]);
    const [newSalons, setNewSalons] = useState<{ id: string; name: string; city: string; date: string }[]>([]);
    const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [{ data: salonsData }, { data: apptsData }, { data: profilesData }] = await Promise.all([
                    supabase.from('salons').select('id, name, city, created_at'),
                    supabase.from('appointments').select('id, date, price, status').or('status.eq.confirmed,status.eq.completed').lte('date', new Date().toISOString().split('T')[0]),
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

                // Bookings by month (last 12 months)
                const nowBookings = new Date();
                const bookingMonths = [];
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(nowBookings.getFullYear(), nowBookings.getMonth() - i, 1);
                    bookingMonths.push({
                        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                        label: d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' })
                    });
                }
                const bookingMonthCounts = new Map(bookingMonths.map(m => [m.key, 0]));
                appointments.forEach((a: any) => {
                    if (!a.date) return;
                    const d = new Date(a.date);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (bookingMonthCounts.has(key)) bookingMonthCounts.set(key, (bookingMonthCounts.get(key) || 0) + 1);
                });
                setBookingsByMonth(bookingMonths.map(m => ({ name: m.label, bookings: bookingMonthCounts.get(m.key) || 0 })));

                // Weekly comparison (last 8 weeks)
                const nowWeekly = new Date();
                const weeks = [];
                for (let i = 7; i >= 0; i--) {
                    const startOfWeek = new Date(nowWeekly);
                    startOfWeek.setDate(nowWeekly.getDate() - (nowWeekly.getDay() === 0 ? 7 : nowWeekly.getDay()) - (i * 7) + 1);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    
                    const weekLabel = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;
                    weeks.push({
                        start: startOfWeek,
                        end: endOfWeek,
                        label: weekLabel
                    });
                }
                
                const weeklyData = weeks.map(week => {
                    const weekBookings = appointments.filter((a: any) => {
                        if (!a.date) return false;
                        const appointmentDate = new Date(a.date);
                        // For current week, only count appointments up to today
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        if (appointmentDate > today) return false;
                        return appointmentDate >= week.start && appointmentDate <= week.end;
                    });
                    
                    return {
                        week: week.label,
                        bookings: weekBookings.length,
                        revenue: weekBookings.reduce((sum: number, a: any) => sum + (a.price || 0), 0)
                    };
                });
                setWeeklyComparison(weeklyData);

                // Monthly comparison (last 6 months)
                const nowMonthly = new Date();
                const monthlyData = [];
                for (let i = 5; i >= 0; i--) {
                    const monthStart = new Date(nowMonthly.getFullYear(), nowMonthly.getMonth() - i, 1);
                    const monthEnd = new Date(nowMonthly.getFullYear(), nowMonthly.getMonth() - i + 1, 0);
                    
                    const monthBookings = appointments.filter((a: any) => {
                        if (!a.date) return false;
                        const appointmentDate = new Date(a.date);
                        // For current month, only count appointments up to today
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        if (appointmentDate > today) return false;
                        return appointmentDate >= monthStart && appointmentDate <= monthEnd;
                    });
                    
                    monthlyData.push({
                        month: monthStart.toLocaleDateString('nl-NL', { month: 'long', year: '2-digit' }),
                        bookings: monthBookings.length,
                        revenue: monthBookings.reduce((sum: number, a: any) => sum + (a.price || 0), 0)
                    });
                }
                setMonthlyComparison(monthlyData);

                // Salon growth last 6 months
                const nowGrowth = new Date();
                const growthMonths = [] as { key: string; label: string }[];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(nowGrowth.getFullYear(), nowGrowth.getMonth() - i, 1);
                    growthMonths.push({
                        key: `${d.getFullYear()}-${d.getMonth()}`,
                        label: d.toLocaleDateString('nl-NL', { month: 'short' })
                    });
                }
                const growthMonthCounts = new Map(growthMonths.map(m => [m.key, 0]));
                salons.forEach((s: any) => {
                    if (!s.created_at) return;
                    const d = new Date(s.created_at);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (growthMonthCounts.has(key)) growthMonthCounts.set(key, (growthMonthCounts.get(key) || 0) + 1);
                });
                setSalonGrowth(growthMonths.map(m => ({ m: m.label, s: growthMonthCounts.get(m.key) || 0 })));

                // Fetch flagged reviews for moderation
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select(`
                        *,
                        profiles:user_id (full_name),
                        salons:salon_id (name)
                    `)
                    .eq('is_flagged', true)
                    .order('created_at', { ascending: false });

                if (reviewsData) {
                    setFlaggedReviews(reviewsData.map((r: any) => ({
                        id: r.id,
                        text: r.comment || '',
                        reason: r.flagged_reason || 'Gemeld',
                        date: new Date(r.created_at).toLocaleDateString('nl-NL'),
                        user: r.profiles?.full_name || 'Anoniem',
                        salon: r.salons?.name || 'Onbekende Salon'
                    })));
                }
            } catch (err) {
                console.error('Admin dashboard load failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    // Review moderation functions
    const approveReview = async (reviewId: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    is_flagged: false,
                    is_approved: true,
                    moderated_at: new Date().toISOString()
                })
                .eq('id', reviewId);

            if (error) throw error;

            // Remove from flagged reviews list
            setFlaggedReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error('Error approving review:', err);
            alert('Fout bij het goedkeuren van de review');
        }
    };

    const rejectReview = async (reviewId: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    is_approved: false,
                    moderated_at: new Date().toISOString()
                })
                .eq('id', reviewId);

            if (error) throw error;

            // Remove from flagged reviews list
            setFlaggedReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error('Error rejecting review:', err);
            alert('Fout bij het afkeuren van de review');
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm('Weet je zeker dat je deze review wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            // Remove from flagged reviews list
            setFlaggedReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error('Error deleting review:', err);
            alert('Fout bij het verwijderen van de review');
        }
    };

    const data = useMemo(() => bookingsByDay, [bookingsByDay]);
    const monthlyData = useMemo(() => bookingsByMonth, [bookingsByMonth]);

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-stone-900">Admin Overzicht</h1>
            
            {/* System Status / Billing */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card className="p-6 bg-stone-900 text-white border-none">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/10 rounded-lg"><ShieldAlert size={20} className="text-brand-300"/></div>
                        <div>
                            <h3 className="font-bold">Betalingen uitgeschakeld</h3>
                            <p className="text-xs text-stone-400">Registratie en betalingen zijn uitgeschakeld — salons zijn gratis</p>
                        </div>
                    </div>
                    <div className="text-xs text-stone-400 mt-2 pt-2 border-t border-white/10">
                        Geen facturen gegenereerd terwijl betalingen uit staan
                    </div>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-2">Totale Omzet</h3>
                    <p className="text-3xl font-bold text-stone-900">€{stats.revenue.toFixed(0)}</p>
                    <p className="text-sm text-stone-500 mt-1">Totaal boekingen: {stats.bookings}</p>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-2">Actieve Salons</h3>
                    <p className="text-3xl font-bold text-stone-900">{stats.salons}</p>
                    <p className="text-sm text-stone-500 mt-1">Gebruikers: {stats.users}</p>
                </Card>
                 <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-2">Deze Maand</h3>
                    <p className="text-3xl font-bold text-stone-900">{monthlyComparison[monthlyComparison.length - 1]?.bookings || 0}</p>
                    <p className="text-sm text-stone-500 mt-1">€{(monthlyComparison[monthlyComparison.length - 1]?.revenue || 0).toFixed(0)} omzet</p>
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

            {/* Monthly Bookings Chart */}
            <Card className="p-6">
                <h3 className="font-bold text-stone-800 mb-6">Boekingen per maand (laatste 12 maanden)</h3>
                <div className="h-64">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-stone-400">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                            <Tooltip cursor={{fill: '#f5f5f4'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    )}
                </div>
            </Card>

            {/* Comparison Tables */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Weekly Comparison Table */}
                <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-4">Wekelijkse Vergelijking</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-stone-200">
                                    <th className="text-left py-2 font-semibold text-stone-700">Week</th>
                                    <th className="text-right py-2 font-semibold text-stone-700">Boekingen</th>
                                    <th className="text-right py-2 font-semibold text-stone-700">Omzet</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeklyComparison.map((week, index) => (
                                    <tr key={index} className="border-b border-stone-100">
                                        <td className="py-2 text-stone-900">{week.week}</td>
                                        <td className="py-2 text-right text-stone-900">{week.bookings}</td>
                                        <td className="py-2 text-right text-stone-900">€{week.revenue.toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Monthly Comparison Table */}
                <Card className="p-6">
                    <h3 className="font-bold text-stone-800 mb-4">Maandelijkse Vergelijking</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-stone-200">
                                    <th className="text-left py-2 font-semibold text-stone-700">Maand</th>
                                    <th className="text-right py-2 font-semibold text-stone-700">Boekingen</th>
                                    <th className="text-right py-2 font-semibold text-stone-700">Omzet</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyComparison.map((month, index) => (
                                    <tr key={index} className="border-b border-stone-100">
                                        <td className="py-2 text-stone-900">{month.month}</td>
                                        <td className="py-2 text-right text-stone-900">{month.bookings}</td>
                                        <td className="py-2 text-right text-stone-900">€{month.revenue.toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                     <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => approveReview(item.id)}>Goedkeuren</Button>
                                     <Button size="sm" variant="danger" className="text-xs h-7" onClick={() => deleteReview(item.id)}>Verwijderen</Button>
                                 </div>
                             </div>
                        ))}
                     </div>
                </Card>
            </div>
        </div>
    );
};