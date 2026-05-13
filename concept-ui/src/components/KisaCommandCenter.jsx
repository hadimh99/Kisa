import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TranscriptEditor from './TranscriptEditor';
import HadithManager from './HadithManager';
import BrainOntology from './BrainOntology';
import CMSDashboard from './CMSDashboard';
import { Lock, LogOut, LayoutDashboard, FileText, Database, BookOpen, Home, ArrowLeft, Menu, X } from 'lucide-react';

const KisaCommandCenter = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Core Module Routing State
    const [activeModule, setActiveModule] = useState('dashboard');

    // Mobile Drawer State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Cross-Module Routing States
    const [selectedEpisodeForEdit, setSelectedEpisodeForEdit] = useState(null);
    const [selectedHadithForEdit, setSelectedHadithForEdit] = useState(null);

    const handleEditEpisode = (episode) => {
        setSelectedEpisodeForEdit(episode);
        setActiveModule('transcripts');
        setIsMobileMenuOpen(false); // Close drawer on mobile
    };

    const handleEditHadith = (hadithId) => {
        setSelectedHadithForEdit(hadithId);
        setActiveModule('hadiths');
        setIsMobileMenuOpen(false); // Close drawer on mobile
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

    // Helper for Nav Links to auto-close the mobile drawer
    const handleNavClick = (moduleId) => {
        setActiveModule(moduleId);
        setIsMobileMenuOpen(false);
    };

    if (!session) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-[#121212] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit
                    </button>
                    <div className="flex justify-center mb-6 mt-6 sm:mt-4">
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
        // Switched to flex-col for mobile stacking, flex-row for desktop
        <div className="h-screen w-full bg-[#0a0a0a] flex flex-col md:flex-row overflow-hidden text-zinc-300 font-sans">

            {/* MOBILE HEADER (Hidden on Desktop) */}
            <div className="md:hidden flex items-center bg-[#121212] border-b border-zinc-800 p-4 shrink-0 z-30 gap-4">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <button
                    onClick={() => handleNavClick('dashboard')}
                    className="text-lg font-bold text-white flex items-center gap-2 cursor-pointer hover:text-[#c6a87c] transition-colors"
                >
                    <LayoutDashboard className="text-[#c6a87c] w-5 h-5" /> CMS
                </button>
            </div>

            {/* MOBILE OVERLAY BACKDROP */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* SIDEBAR (Absolute drawer on Mobile, Fixed column on Desktop) */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#121212] border-r border-zinc-800 p-6 flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex-shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <LayoutDashboard className="text-[#c6a87c]" /> Al-Kisa
                    </h2>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1.5 text-zinc-500 hover:text-white bg-black rounded-lg border border-zinc-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto">
                    <button onClick={() => handleNavClick('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'dashboard' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <Home className="w-5 h-5" /> Command Center
                    </button>
                    <button onClick={() => handleNavClick('transcripts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'transcripts' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <FileText className="w-5 h-5" /> Transcripts
                    </button>
                    <button onClick={() => handleNavClick('hadiths')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'hadiths' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <BookOpen className="w-5 h-5" /> Hadith Library
                    </button>
                    <button onClick={() => handleNavClick('ontology')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeModule === 'ontology' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
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
                    <div className="px-4 mb-4 hidden sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Signed In As</p>
                        <p className="text-xs text-zinc-400 truncate">{session.user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>

            {/* MAIN CANVAS (Adjusted padding for mobile) */}
            <div className="flex-1 overflow-y-auto relative bg-[#0a0a0a] p-4 sm:p-6 md:p-8">
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Transcript Studio</h1>
                        <p className="text-sm sm:text-base text-zinc-400 mb-6 sm:mb-8">Ingest, format, and publish translated lectures.</p>
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
                        <BrainOntology supabase={supabase} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KisaCommandCenter;