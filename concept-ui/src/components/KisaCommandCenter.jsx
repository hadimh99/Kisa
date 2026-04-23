import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TranscriptEditor from './TranscriptEditor';
import HadithManager from './HadithManager';
import { Lock, LogOut, LayoutDashboard, FileText, Database, BookOpen } from 'lucide-react';

const KisaCommandCenter = () => {
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('transcripts');
    const [selectedEpisodeForEdit, setSelectedEpisodeForEdit] = useState(null);

    const handleEditEpisode = (episode) => {
        setSelectedEpisodeForEdit(episode);
        setActiveTab('transcripts');
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
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-[#121212] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                    <div className="flex justify-center mb-6">
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
        <div className="min-h-screen bg-[#0a0a0a] flex text-zinc-300 font-sans">
            <div className="w-64 border-r border-zinc-800 bg-[#121212] p-6 flex flex-col h-screen sticky top-0">
                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <LayoutDashboard className="text-[#c6a87c]" /> Al-Kisa CMS
                </h2>
                
                <nav className="flex-1 space-y-2">
                    <button onClick={() => setActiveTab('transcripts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'transcripts' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <FileText className="w-5 h-5" /> Transcripts
                    </button>
                    <button onClick={() => setActiveTab('hadiths')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'hadiths' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <BookOpen className="w-5 h-5" /> Hadith Library
                    </button>
                    <button onClick={() => setActiveTab('ontology')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'ontology' ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold' : 'hover:bg-zinc-800/50'}`}>
                        <Database className="w-5 h-5" /> Brain Ontology
                    </button>
                </nav>

                <div className="border-t border-zinc-800 pt-6">
                    <p className="text-xs text-zinc-500 mb-4 truncate">{session.user.email}</p>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'transcripts' && (
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
                
                {activeTab === 'hadiths' && (
                    <div className="max-w-6xl mx-auto relative">
                        <HadithManager supabase={supabase} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KisaCommandCenter;
