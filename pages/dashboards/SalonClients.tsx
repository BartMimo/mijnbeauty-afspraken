import React, { useState, useMemo, useEffect } from 'react';
import { Search, Mail, Users, Send, CheckCircle, ShieldAlert, Info, ArrowUpDown, ChevronUp, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { Button, Card, Input, Modal, Badge } from '../../components/UIComponents';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Client {
    id: string;
    name: string;
    email: string;
    lastVisit: string;
    totalVisits: number;
    marketingOptIn: boolean;
}

type SortKey = keyof Client;
type SortDirection = 'asc' | 'desc';

export const SalonClients: React.FC = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailForm, setEmailForm] = useState({ subject: '' });
    const [isSent, setIsSent] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Fetch clients from Supabase (appointments by this salon's customers)
    useEffect(() => {
        const fetchClients = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Get all appointments for this salon
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        profiles:user_id (full_name, email)
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Group by user and create client list
                const clientMap = new Map<string, Client>();
                
                (data || []).forEach((apt: any) => {
                    const userId = apt.user_id;
                    if (!clientMap.has(userId)) {
                        clientMap.set(userId, {
                            id: userId,
                            name: apt.profiles?.full_name || 'Unknown',
                            email: apt.profiles?.email || '',
                            lastVisit: apt.date,
                            totalVisits: 1,
                            marketingOptIn: true
                        });
                    } else {
                        const existing = clientMap.get(userId)!;
                        existing.totalVisits += 1;
                        if (new Date(apt.date) > new Date(existing.lastVisit)) {
                            existing.lastVisit = apt.date;
                        }
                    }
                });

                setClients(Array.from(clientMap.values()));
            } catch (err) {
                console.error('Error fetching clients:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [user]);

    // 1. Filter Clients based on Search
    const filteredClients = useMemo(() => {
        return clients.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [clients, searchQuery]);

    // 2. Sort Clients
    const sortedClients = useMemo(() => {
        let sortableItems = [...filteredClients];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key];
                let bValue: any = b[sortConfig.key];

                // Special handling for Dates (string format DD-MM-YYYY to Date object)
                if (sortConfig.key === 'lastVisit') {
                    const [da, ma, ya] = a.lastVisit.split('-').map(Number);
                    const [db, mb, yb] = b.lastVisit.split('-').map(Number);
                    aValue = new Date(ya, ma - 1, da).getTime();
                    bValue = new Date(yb, mb - 1, db).getTime();
                }
                
                // Normal comparison
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredClients, sortConfig]);

    // --- Handlers ---

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === sortedClients.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sortedClients.map(c => c.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Calculate Email Recipients logic
    const emailRecipients = useMemo(() => {
        const pool = selectedIds.length > 0 
            ? clients.filter(c => selectedIds.includes(c.id))
            : clients; // Default to all if nothing selected
            
        return pool.filter(c => c.marketingOptIn);
    }, [clients, selectedIds]);


    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Collect Emails
        const bccList = emailRecipients.map(c => c.email).join(',');

        // 2. Encode Content for URL
        const subject = encodeURIComponent(emailForm.subject);
        
        // 3. Create Mailto Link (No body, as user requested to write it in app)
        const mailtoLink = `mailto:?bcc=${bccList}&subject=${subject}`;

        // 4. Open Default Mail Client
        window.location.href = mailtoLink;
        
        // 5. Update UI
        setIsSent(true);
        setTimeout(() => {
            setIsSent(false);
            setIsEmailModalOpen(false);
            setEmailForm({ subject: '' });
            setSelectedIds([]); 
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-brand-500" size={32} />
            </div>
        );
    }
    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-stone-300 opacity-0 group-hover:opacity-50" />;
        return sortConfig.direction === 'asc' 
            ? <ChevronUp size={14} className="ml-1 text-brand-500" />
            : <ChevronDown size={14} className="ml-1 text-brand-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Klantenbestand</h1>
                    <p className="text-stone-500">Beheer je contacten en marketing</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={() => setIsEmailModalOpen(true)}>
                        <Mail className="mr-2" size={18} /> 
                        {selectedIds.length > 0 
                            ? `Mail Selectie (${selectedIds.length})` 
                            : 'Stuur Totaalmail'}
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-stone-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Zoek op naam of e-mailadres..." 
                        className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </Card>

            {/* Clients Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 border-b border-stone-100">
                            <tr>
                                <th className="w-10 px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                        checked={sortedClients.length > 0 && selectedIds.length === sortedClients.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th 
                                    className="px-6 py-4 font-medium text-stone-600 cursor-pointer hover:bg-stone-100 transition-colors group select-none"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">Naam <SortIcon columnKey="name" /></div>
                                </th>
                                <th 
                                    className="px-6 py-4 font-medium text-stone-600 cursor-pointer hover:bg-stone-100 transition-colors group select-none"
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center">E-mailadres <SortIcon columnKey="email" /></div>
                                </th>
                                <th 
                                    className="px-6 py-4 font-medium text-stone-600 cursor-pointer hover:bg-stone-100 transition-colors group select-none"
                                    onClick={() => handleSort('lastVisit')}
                                >
                                    <div className="flex items-center">Laatste Bezoek <SortIcon columnKey="lastVisit" /></div>
                                </th>
                                <th 
                                    className="px-6 py-4 font-medium text-stone-600 cursor-pointer hover:bg-stone-100 transition-colors group select-none"
                                    onClick={() => handleSort('totalVisits')}
                                >
                                    <div className="flex items-center">Bezoeken <SortIcon columnKey="totalVisits" /></div>
                                </th>
                                <th 
                                    className="px-6 py-4 font-medium text-stone-600 cursor-pointer hover:bg-stone-100 transition-colors group select-none"
                                    onClick={() => handleSort('marketingOptIn')}
                                >
                                    <div className="flex items-center">Marketing <SortIcon columnKey="marketingOptIn" /></div>
                                </th> 
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {sortedClients.length > 0 ? sortedClients.map(client => (
                                <tr key={client.id} className={`hover:bg-stone-50/50 transition-colors ${selectedIds.includes(client.id) ? 'bg-brand-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                            checked={selectedIds.includes(client.id)}
                                            onChange={() => toggleSelect(client.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-stone-900 flex items-center gap-3">
                                        <div className="h-8 w-8 bg-brand-50 rounded-full flex items-center justify-center text-brand-500">
                                            <Users size={14} />
                                        </div>
                                        {client.name}
                                    </td>
                                    <td className="px-6 py-4 text-stone-600">{client.email}</td>
                                    <td className="px-6 py-4 text-stone-500">{client.lastVisit}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="default">{client.totalVisits}x</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {client.marketingOptIn ? (
                                            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Toestemming</span>
                                        ) : (
                                            <span className="text-stone-400 text-xs font-medium bg-stone-100 px-2 py-1 rounded-full">Geen toestemming</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-stone-400">
                                        Geen klanten gevonden.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-stone-100 bg-stone-50 text-xs text-stone-500 flex justify-between items-center">
                    <span>Totaal {filteredClients.length} klanten weergegeven</span>
                    {selectedIds.length > 0 && <span className="font-semibold text-brand-600">{selectedIds.length} geselecteerd</span>}
                </div>
            </Card>

            {/* Email Modal */}
            <Modal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                title="Stuur e-mail naar klanten"
            >
                <form onSubmit={handleSendEmail} className="space-y-4">
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3 text-sm text-sky-800">
                        <div className="flex gap-3">
                            <ShieldAlert className="shrink-0" size={20} />
                            <div>
                                <p className="font-bold mb-1">Privacy & BCC</p>
                                <p>Dit opent je eigen e-mailprogramma (Outlook, Gmail, etc). De adressen worden automatisch in het <strong>BCC-veld</strong> geplaatst voor privacy.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center border-t border-sky-200 pt-2 mt-2">
                             <Info className="shrink-0" size={16} />
                             <p className="text-xs">
                                 Systeem filtert automatisch: alleen klanten met <strong>marketing-toestemming</strong> worden toegevoegd.
                             </p>
                        </div>
                    </div>

                    <div className="text-sm text-stone-500 mb-2 p-3 bg-stone-50 rounded-lg border border-stone-100 flex justify-between items-center">
                        <span className="flex flex-col">
                            <span>Geselecteerde doelgroep:</span>
                            {selectedIds.length > 0 ? (
                                <span className="text-xs text-stone-400">(Handmatige selectie)</span>
                            ) : (
                                <span className="text-xs text-stone-400">(Iedereen)</span>
                            )}
                        </span>
                        
                        <div className="text-right">
                             <span className="font-bold text-stone-800 bg-white px-2 py-1 rounded shadow-sm border border-stone-200 block">
                                {emailRecipients.length} ontvangers
                            </span>
                             {selectedIds.length > emailRecipients.length && (
                                <span className="text-xs text-red-400">
                                    ({selectedIds.length - emailRecipients.length} overgeslagen)
                                </span>
                             )}
                        </div>
                    </div>

                    <Input 
                        label="Onderwerp" 
                        placeholder="bv. Speciale Kerstactie!" 
                        required
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    />

                    {/* Placeholder Block instead of Textarea */}
                    <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 border-dashed text-center text-stone-600 my-4">
                         <div className="flex flex-col items-center gap-3">
                             <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-brand-500 shadow-sm border border-stone-100">
                                 <Mail size={20} />
                             </div>
                             <div>
                                <p className="font-semibold text-stone-800">Mail wordt opgesteld in jouw mail app</p>
                                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                                    Na het klikken op 'Open Mail App' opent direct jouw standaard e-mailprogramma. Je kunt daar je bericht typen en opmaken.
                                </p>
                             </div>
                         </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsEmailModalOpen(false)}>Annuleren</Button>
                        <Button type="submit" disabled={isSent || emailRecipients.length === 0}>
                            {isSent ? <span className="flex items-center"><CheckCircle size={16} className="mr-2"/> Geopend</span> : <span className="flex items-center"><ExternalLink size={16} className="mr-2"/> Open Mail App</span>}
                        </Button>
                    </div>
                    {emailRecipients.length === 0 && (
                        <p className="text-xs text-red-500 text-center">Niemand in de huidige selectie heeft toestemming gegeven voor marketing mails.</p>
                    )}
                </form>
            </Modal>
        </div>
    );
};