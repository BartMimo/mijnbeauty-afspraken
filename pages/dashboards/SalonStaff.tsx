import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, User, Mail, Calendar, Edit2, Trash2, Clock, Check, Shield } from 'lucide-react';
import { Button, Card, Modal, Input } from '../../components/UIComponents';

// Helper types for the new schedule structure
type DaySchedule = {
    active: boolean;
    start: string;
    end: string;
};

type WeeklySchedule = {
    [key: string]: DaySchedule;
};

type Permissions = {
    canManageSchedule: boolean;
    canSeeRevenue: boolean;
    canManageSettings: boolean;
};

export const SalonStaff: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.startsWith('/salontest') ? '/salontest' : '/dashboard/salon';

    // Default schedule template
    const defaultSchedule: WeeklySchedule = {
        ma: { active: true, start: '09:00', end: '17:00' },
        di: { active: true, start: '09:00', end: '17:00' },
        wo: { active: true, start: '09:00', end: '17:00' },
        do: { active: true, start: '09:00', end: '17:00' },
        vr: { active: true, start: '09:00', end: '17:00' },
        za: { active: false, start: '10:00', end: '16:00' },
        zo: { active: false, start: '10:00', end: '16:00' },
    };
    
    const defaultPermissions: Permissions = {
        canManageSchedule: true,
        canSeeRevenue: false,
        canManageSettings: false
    };

    // State
    const [staff, setStaff] = useState<any[]>(() => {
        const saved = localStorage.getItem('salon_staff_v2'); 
        return saved ? JSON.parse(saved) : [
            { 
                id: 1, 
                name: 'Sarah Janssen', 
                role: 'Eigenaar / Stylist', 
                email: 'sarah@salon.nl', 
                schedule: { ...defaultSchedule },
                permissions: { canManageSchedule: true, canSeeRevenue: true, canManageSettings: true }
            },
            { 
                id: 2, 
                name: 'Mike de Boer', 
                role: 'Stylist', 
                email: 'mike@salon.nl', 
                schedule: {
                    ...defaultSchedule,
                    ma: { active: false, start: '09:00', end: '17:00' }, 
                    za: { active: true, start: '10:00', end: '15:00' }   
                },
                permissions: { ...defaultPermissions }
            },
        ];
    });

    useEffect(() => {
        localStorage.setItem('salon_staff_v2', JSON.stringify(staff));
    }, [staff]);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    
    // Form State
    const [formName, setFormName] = useState('');
    const [formRole, setFormRole] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formSchedule, setFormSchedule] = useState<WeeklySchedule>(defaultSchedule);
    const [formPermissions, setFormPermissions] = useState<Permissions>(defaultPermissions);

    // Actions
    const handleEdit = (member: any) => {
        setEditingStaff(member);
        setFormName(member.name);
        setFormRole(member.role);
        setFormEmail(member.email);
        setFormSchedule(member.schedule || defaultSchedule);
        setFormPermissions(member.permissions || defaultPermissions);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingStaff(null);
        setFormName('');
        setFormRole('');
        setFormEmail('');
        setFormSchedule(defaultSchedule);
        setFormPermissions(defaultPermissions);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if(window.confirm('Medewerker verwijderen?')) {
            setStaff(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSave = () => {
        const staffMember = {
            id: editingStaff ? editingStaff.id : Date.now(),
            name: formName,
            role: formRole,
            email: formEmail,
            schedule: formSchedule,
            permissions: formPermissions
        };

         if (editingStaff) {
            setStaff(prev => prev.map(s => s.id === editingStaff.id ? staffMember : s));
        } else {
            setStaff(prev => [...prev, staffMember]);
        }
        setIsModalOpen(false);
    };

    const handleScheduleChange = (day: string, field: keyof DaySchedule, value: any) => {
        setFormSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };
    
    const togglePermission = (key: keyof Permissions) => {
        setFormPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const days = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
    const dayLabels: {[key:string]: string} = { ma: 'Maandag', di: 'Dinsdag', wo: 'Woensdag', do: 'Donderdag', vr: 'Vrijdag', za: 'Zaterdag', zo: 'Zondag' };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Medewerkers</h1>
                    <p className="text-stone-500">Beheer je team, roosters en bevoegdheden</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus size={18} className="mr-2" /> Nieuwe Medewerker
                </Button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {staff.map(member => (
                    <Card key={member.id} className="p-6 relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-lg p-1 border border-stone-100 z-10">
                             <button onClick={() => handleEdit(member)} className="p-1.5 text-stone-400 hover:text-brand-500 hover:bg-brand-50 rounded">
                                <Edit2 size={16} />
                            </button>
                             <button onClick={() => handleDelete(member.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="h-20 w-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-3 border-2 border-white shadow-sm">
                                <User size={40} />
                            </div>
                            <h3 className="font-bold text-stone-900 text-lg">{member.name}</h3>
                            <p className="text-brand-500 font-medium text-sm">{member.role}</p>
                        </div>

                        <div className="space-y-3 text-sm text-stone-600">
                             <div className="flex items-center p-3 bg-stone-50 rounded-xl">
                                <Mail size={16} className="mr-3 text-stone-400" />
                                <span className="truncate">{member.email}</span>
                            </div>
                            
                            {/* Permission Badges */}
                            <div className="flex flex-wrap gap-1 mt-2">
                                {member.permissions?.canSeeRevenue && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">Omzet Inzien</span>}
                                {member.permissions?.canManageSchedule && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">Agenda Beheer</span>}
                            </div>

                            <div className="p-3 bg-stone-50 rounded-xl space-y-2 mt-2">
                                <div className="flex items-center text-stone-500 text-xs font-medium uppercase tracking-wider mb-2">
                                    <Calendar size={14} className="mr-2" /> Werktijden
                                </div>
                                <div className="space-y-1">
                                    {days.filter(d => member.schedule[d]?.active).map(day => (
                                        <div key={day} className="flex justify-between text-xs">
                                            <span className="font-medium text-stone-700 w-8 capitalize">{day}</span>
                                            <span className="text-stone-500">{member.schedule[day].start} - {member.schedule[day].end}</span>
                                        </div>
                                    ))}
                                    {Object.values(member.schedule).every((s: any) => !s.active) && (
                                        <span className="text-xs text-stone-400 italic">Geen werktijden ingesteld</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-stone-100 flex gap-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => navigate(`${basePath}/schedule`)}
                            >
                                Bekijk Agenda
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? "Medewerker Bewerken" : "Nieuwe Medewerker"}>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <Input 
                            label="Naam" 
                            value={formName} 
                            onChange={e => setFormName(e.target.value)} 
                            required
                        />
                        <Input 
                            label="Rol / Functie" 
                            value={formRole} 
                            onChange={e => setFormRole(e.target.value)} 
                            placeholder="bv. Stylist"
                        />
                        <Input 
                            label="E-mail" 
                            type="email"
                            value={formEmail} 
                            onChange={e => setFormEmail(e.target.value)} 
                        />
                    </div>
                    
                    {/* Permissions */}
                     <div className="border-t border-stone-100 pt-4">
                        <h3 className="font-bold text-stone-800 mb-3 flex items-center">
                            <Shield size={18} className="mr-2 text-brand-500" /> Bevoegdheden
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="perm_rev" 
                                    checked={formPermissions.canSeeRevenue}
                                    onChange={() => togglePermission('canSeeRevenue')}
                                    className="mr-3 h-4 w-4 text-brand-500 rounded border-stone-300" 
                                />
                                <label htmlFor="perm_rev" className="text-sm text-stone-700">Kan omzet en financiën inzien</label>
                            </div>
                             <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="perm_sched" 
                                    checked={formPermissions.canManageSchedule}
                                    onChange={() => togglePermission('canManageSchedule')}
                                    className="mr-3 h-4 w-4 text-brand-500 rounded border-stone-300" 
                                />
                                <label htmlFor="perm_sched" className="text-sm text-stone-700">Kan agenda van anderen beheren</label>
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="perm_set" 
                                    checked={formPermissions.canManageSettings}
                                    onChange={() => togglePermission('canManageSettings')}
                                    className="mr-3 h-4 w-4 text-brand-500 rounded border-stone-300" 
                                />
                                <label htmlFor="perm_set" className="text-sm text-stone-700">Kan salon instellingen wijzigen</label>
                            </div>
                        </div>
                     </div>

                    {/* Schedule Editor */}
                    <div className="border-t border-stone-100 pt-4">
                        <h3 className="font-bold text-stone-800 mb-3 flex items-center">
                            <Clock size={18} className="mr-2 text-brand-500" /> Werktijden
                        </h3>
                        <div className="space-y-2 bg-stone-50 p-4 rounded-xl">
                            {days.map(day => (
                                <div key={day} className="flex items-center gap-3">
                                    <div className="w-8 pt-1">
                                        <input 
                                            type="checkbox"
                                            checked={formSchedule[day].active}
                                            onChange={(e) => handleScheduleChange(day, 'active', e.target.checked)}
                                            className="h-4 w-4 text-brand-500 rounded border-stone-300 focus:ring-brand-400 cursor-pointer"
                                        />
                                    </div>
                                    <div className="w-24 text-sm font-medium text-stone-700">{dayLabels[day]}</div>
                                    
                                    <div className={`flex items-center gap-2 flex-1 transition-opacity ${formSchedule[day].active ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                        <input 
                                            type="time" 
                                            value={formSchedule[day].start}
                                            onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                                            className="h-8 w-full min-w-[80px] rounded-lg border border-stone-200 text-xs px-2 focus:outline-none focus:border-brand-400"
                                        />
                                        <span className="text-stone-400">-</span>
                                        <input 
                                            type="time" 
                                            value={formSchedule[day].end}
                                            onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                                            className="h-8 w-full min-w-[80px] rounded-lg border border-stone-200 text-xs px-2 focus:outline-none focus:border-brand-400"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2 sticky bottom-0 bg-white border-t border-stone-50">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuleren</Button>
                        <Button onClick={handleSave}>Opslaan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};