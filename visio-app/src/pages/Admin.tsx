import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Stethoscope, Users, MessagesSquare, Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import { api } from '../services/api';
import { getStoredUser } from '../services/auth';

type Tab = 'professions' | 'users' | 'groups';

interface Profession { id: string; name: string; description?: string | null; color?: string | null; isActive: boolean }
interface AdminUser { id: string; firstName: string; lastName: string; email: string; isAdmin?: boolean; profession?: { name: string } | null }
interface AdminGroup { id: string; name: string; createdBy?: { firstName: string; lastName: string }; members: { userId: string }[] }

const card = 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5';
const input = 'bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400';
const iconBtn = 'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer';

/** EPIC 8 : administration de la plateforme (spécialités, utilisateurs, groupes). Réservé aux administrateurs. */
const Admin: React.FC = () => {
    const me = getStoredUser();
    const [tab, setTab] = useState<Tab>('professions');
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [groups, setGroups] = useState<AdminGroup[]>([]);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);

    const run = useCallback(async (fn: () => Promise<unknown>, okMessage?: string) => {
        setError(''); setInfo('');
        try { await fn(); if (okMessage) setInfo(okMessage); }
        catch (e: any) { setError(e?.message || 'Une erreur est survenue'); }
    }, []);

    const reload = useCallback(async () => {
        await run(async () => {
            const [p, u, g] = await Promise.all([api.getProfessions(), api.getUsers(), api.getAllGroups()]);
            setProfessions(p); setUsers(u); setGroups(g);
        });
    }, [run]);

    useEffect(() => { reload(); }, [reload]);

    if (!me?.isAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
                <Shield className="w-10 h-10 text-red-400" />
                <p>Accès réservé aux administrateurs.</p>
                <Link to="/" className="text-cyan-400 hover:underline">Retour à l'accueil</Link>
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
        { id: 'professions', label: 'Spécialités', icon: <Stethoscope className="w-4 h-4" />, count: professions.length },
        { id: 'users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" />, count: users.length },
        { id: 'groups', label: 'Groupes', icon: <MessagesSquare className="w-4 h-4" />, count: groups.length },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
                <Link to="/" className="text-slate-400 hover:text-white" aria-label="Retour à l'accueil"><ArrowLeft className="w-5 h-5" /></Link>
                <Shield className="w-5 h-5 text-cyan-400" />
                <h1 className="text-lg font-semibold">Administration</h1>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                <div className="flex gap-2" role="tablist">
                    {tabs.map(t => (
                        <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors cursor-pointer ${tab === t.id ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                            {t.icon}{t.label}<span className="text-xs opacity-70">({t.count})</span>
                        </button>
                    ))}
                </div>

                {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-2">{error}</div>}
                {info && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm px-4 py-2">{info}</div>}

                {tab === 'professions' && (
                    <section className={card}>
                        <h2 className="font-medium mb-1">Spécialités médicales</h2>
                        <p className="text-xs text-slate-400 mb-4">Une spécialité désactivée n'est plus proposée à l'inscription ni lors de l'ajout de participants.</p>
                        <form className="flex flex-wrap gap-2 mb-5" onSubmit={e => {
                            e.preventDefault();
                            if (!newName.trim()) return;
                            run(async () => { await api.createProfession({ name: newName.trim(), description: newDesc.trim() || undefined, isActive: true }); setNewName(''); setNewDesc(''); await reload(); }, 'Spécialité créée');
                        }}>
                            <input className={input} placeholder="Nom (ex. Oncologie)" value={newName} onChange={e => setNewName(e.target.value)} aria-label="Nom de la spécialité" />
                            <input className={`${input} flex-1 min-w-[10rem]`} placeholder="Description (optionnelle)" value={newDesc} onChange={e => setNewDesc(e.target.value)} aria-label="Description" />
                            <button type="submit" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-medium cursor-pointer"><Plus className="w-4 h-4" />Ajouter</button>
                        </form>
                        <ul className="divide-y divide-white/5">
                            {professions.map(p => (
                                <li key={p.id} className="flex items-center gap-3 py-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || '#22d3ee' }} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${p.isActive ? '' : 'text-slate-500 line-through'}`}>{p.name}</p>
                                        {p.description && <p className="text-xs text-slate-500 truncate">{p.description}</p>}
                                    </div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={p.isActive} onChange={() => run(async () => { await api.updateProfession(p.id, { isActive: !p.isActive }); await reload(); })} />
                                        Active
                                    </label>
                                    <button className={iconBtn} aria-label={`Supprimer ${p.name}`} title="Supprimer"
                                        onClick={() => window.confirm(`Supprimer la spécialité « ${p.name} » ?`) && run(async () => { await api.deleteProfession(p.id); await reload(); }, 'Spécialité supprimée')}>
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                            {professions.length === 0 && <li className="py-3 text-sm text-slate-500">Aucune spécialité.</li>}
                        </ul>
                    </section>
                )}

                {tab === 'users' && (
                    <section className={card}>
                        <h2 className="font-medium mb-4">Utilisateurs</h2>
                        <ul className="divide-y divide-white/5">
                            {users.map(u => (
                                <li key={u.id} className="flex items-center gap-3 py-2.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">{u.firstName} {u.lastName} {u.isAdmin && <span className="ml-1 text-[10px] uppercase tracking-wide text-cyan-300 border border-cyan-400/40 rounded px-1">admin</span>}</p>
                                        <p className="text-xs text-slate-500 truncate">{u.email}{u.profession?.name ? ` · ${u.profession.name}` : ''}</p>
                                    </div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={!!u.isAdmin} disabled={u.id === me.id}
                                            onChange={() => run(async () => { await api.updateUser(u.id, { isAdmin: !u.isAdmin }); await reload(); }, 'Rôle mis à jour')} />
                                        Administrateur
                                    </label>
                                    <button className={`${iconBtn} disabled:opacity-30 disabled:cursor-not-allowed`} disabled={u.id === me.id} aria-label={`Supprimer ${u.email}`} title="Supprimer"
                                        onClick={() => window.confirm(`Supprimer définitivement ${u.firstName} ${u.lastName} ?`) && run(async () => { await api.deleteUser(u.id); await reload(); }, 'Utilisateur supprimé')}>
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {tab === 'groups' && (
                    <section className={card}>
                        <h2 className="font-medium mb-4">Groupes de discussion</h2>
                        <ul className="divide-y divide-white/5">
                            {groups.map(g => (
                                <li key={g.id} className="flex items-center gap-3 py-2.5">
                                    <div className="flex-1 min-w-0">
                                        {editingGroup?.id === g.id ? (
                                            <input autoFocus className={`${input} w-full`} value={editingGroup.name} aria-label="Nouveau nom du groupe"
                                                onChange={e => setEditingGroup({ id: g.id, name: e.target.value })} />
                                        ) : (
                                            <p className="text-sm">{g.name}</p>
                                        )}
                                        <p className="text-xs text-slate-500">{g.members.length} membre(s){g.createdBy ? ` · créé par ${g.createdBy.firstName} ${g.createdBy.lastName}` : ''}</p>
                                    </div>
                                    {editingGroup?.id === g.id ? (
                                        <>
                                            <button className={iconBtn} aria-label="Valider" onClick={() => editingGroup.name.trim() && run(async () => { await api.updateGroup(g.id, { name: editingGroup.name.trim() }); setEditingGroup(null); await reload(); }, 'Groupe renommé')}><Check className="w-4 h-4" /></button>
                                            <button className={iconBtn} aria-label="Annuler" onClick={() => setEditingGroup(null)}><X className="w-4 h-4" /></button>
                                        </>
                                    ) : (
                                        <button className={iconBtn} aria-label={`Renommer ${g.name}`} title="Renommer" onClick={() => setEditingGroup({ id: g.id, name: g.name })}><Pencil className="w-4 h-4" /></button>
                                    )}
                                    <button className={iconBtn} aria-label={`Supprimer ${g.name}`} title="Supprimer"
                                        onClick={() => window.confirm(`Supprimer le groupe « ${g.name} » ?`) && run(async () => { await api.deleteGroup(g.id); await reload(); }, 'Groupe supprimé')}>
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                            {groups.length === 0 && <li className="py-3 text-sm text-slate-500">Aucun groupe.</li>}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Admin;
