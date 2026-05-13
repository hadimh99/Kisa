import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TranscriptEditor from './TranscriptEditor';
import HadithManager from './HadithManager';
import BrainOntology from './BrainOntology';
import CMSDashboard from './CMSDashboard';
import { Lock, LogOut, LayoutDashboard, FileText, Database, BookOpen, Home, ArrowLeft } from 'lucide-react';

const KisaCommandCenter = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Core Module Routing State
    const [activeModule, setActiveModule] = useState('dashboard');

    // Cross-Module Routing States
    const [selectedEpisodeForEdit, setSelectedEpisodeForEdit] = useState(null);
    const [selectedHadithForEdit, setSelectedHadithForEdit] = useState(null);

    const handleEditEpisode = (episode) => {
        setSelectedEpisodeForEdit(episode);
        setActiveModule('transcripts');
    };

    const handleEditHadith = (hadithId) => {
        setSelectedHadithForEdit(hadithId);
        setActiveModule('hadiths');
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        setLoading(false);
    };

    const handleLogout = () => supabase.auth.signOut();

    if (!session) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-[#121212] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit
                    </button>
                    <div className="flex justify-center mb-6 mt-4">
                        <Lock className="w-12 h-12 text-[#c6a87c]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-8 font-sans">Kisa Command Center</h2>
                    <input
                        type="email"
                        placeholder="Admin Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white mb-4 focus:border-[#c6a87c] outline-none"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white mb-6 focus:border-[#c6a87c] outline-none"
                        required
                    />
                    <button type="submit" disabled={loading} className="w-full bg-[#c6a87c] hover:bg-[#b0956b] text-black font-bold py-3 rounded-lg transition-colors">
                        {loading ? 'Authenticating...' : 'Enter Vault'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        // Strict App Shell Layout: Fixed Height, Hidden Global Overflow
        <div className="h-screen w-full bg-[#0a0a0a] flex overflow-hidden text-zinc-300 font-sans">

            {/* Left Sidebar (Fixed) */}
            <div className="w-64 border-r border-zinc-800 bg-[#121212] p-6 flex flex-col h-full flex-shrink-0 z-20 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <LayoutDashboard className="text-[#c6a87c]" /> Al-Kisa CMS
                </h2>

                <nav className="flex-1 space-y-2 overflow-y-auto">
                    <button onClick={() => setActiveModule('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'dashboard' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <Home className="w-5 h-5" /> Command Center
                    </button>
                    <button onClick={() => setActiveModule('transcripts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'transcripts' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <FileText className="w-5 h-5" /> Transcripts
                    </button>
                    <button onClick={() => setActiveModule('hadiths')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'hadiths' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <BookOpen className="w-5 h-5" /> Hadith Library
                    </button>
                    <button onClick={() => setActiveModule('ontology')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'ontology' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <Database className="w-5 h-5" /> Brain Ontology
                    </button>
                </nav>

                <div className="border-t border-zinc-800 pt-6 mt-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit to Academy
                    </button>
                    <div className="px-4 mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Signed In As</p>
                        <p className="text-xs text-zinc-400 truncate">{session.user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>

            {/* Right Main Canvas (Scrollable) */}
            <div className="flex-1 p-8 overflow-y-auto relative bg-[#0a0a0a]">
                {activeModule === 'dashboard' && (
                    <div className="max-w-7xl mx-auto relative">
                        <CMSDashboard
                            supabase={supabase}
                            onEditHadith={handleEditHadith}
                        />
                    </div>
                )}

                {activeModule === 'transcripts' && (
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-2">Transcript Studio</h1>
                        <p className="text-zinc-400 mb-8">Ingest, format, and publish translated lectures.</p>
                        <TranscriptEditor
                            supabase={supabase}
                            selectedEpisodeForEdit={selectedEpisodeForEdit}
                            onEditEpisode={handleEditEpisode}
                        />
                    </div>
                )}

                {activeModule === 'hadiths' && (
                    <div className="max-w-6xl mx-auto relative">
                        <HadithManager
                            supabase={supabase}
                            selectedHadithForEdit={selectedHadithForEdit}
                            clearSelectedHadith={() => setSelectedHadithForEdit(null)}
                        />
                    </div>
                )}

                {activeModule === 'ontology' && (
                    <div className="max-w-7xl mx-auto relative">
                        <BrainOntology supabase="{supabase}" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KisaCommandCenter;