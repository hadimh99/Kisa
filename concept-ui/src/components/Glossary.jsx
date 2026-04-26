import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bookmark, BookOpen, ChevronRight, Library, Copy, Check, Share2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Glossary = ({ theme = 'light' }) => {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('az'); // 'az' or 'domain'
    const [selectedDomain, setSelectedDomain] = useState('Show All');
    const [savingId, setSavingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Dynamic Theme Colors
    const isDark = theme === 'dark';
    const isSepia = theme === 'sepia';

    const colors = {
        bg: isDark ? 'bg-[#0a0a0a]' : isSepia ? 'bg-[#FDFBF7]' : 'bg-[#F5F5F7]',
        cardBg: isDark ? 'bg-[#121212]' : isSepia ? 'bg-[#F8F5EE]' : 'bg-white',
        textPrimary: isDark ? 'text-white' : isSepia ? 'text-[#2D241C]' : 'text-[#1D1D1F]',
        textSecondary: isDark ? 'text-zinc-400' : isSepia ? 'text-[#5C4A3D]/80' : 'text-[#5C4A3D]/70',
        border: isDark ? 'border-zinc-800/80' : isSepia ? 'border-[#c6a87c]/30' : 'border-[#5C4A3D]/15',
        inputBg: isDark ? 'bg-[#121212]' : isSepia ? 'bg-[#FDFBF7]' : 'bg-white',
        divider: isDark ? 'bg-zinc-800' : isSepia ? 'bg-[#c6a87c]/30' : 'bg-[#5C4A3D]/15',
        toggleActive: isDark ? 'bg-zinc-800 text-white' : 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold',
        toggleInactive: isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-[#5C4A3D]/60 hover:text-[#5C4A3D]'
    };

    // Fetch Ontology Data with Instant Memory Cache
    useEffect(() => {
        const fetchOntology = async () => {
            // 1. INSTANT LOAD: Check if we have a saved copy on the user's device
            const savedDictionary = localStorage.getItem('kisa_glossary_cache');
            if (savedDictionary) {
                setTerms(JSON.parse(savedDictionary));
                setLoading(false); // Turn off the loading screen instantly!
            }

            try {
                // 2. BACKGROUND SYNC: Quietly ask the server for the newest updates
                const baseUrl = import.meta.env.VITE_API_URL || '';
                const response = await fetch(`${baseUrl}/api/ontology`);
                if (!response.ok) throw new Error('Failed to fetch ontology');
                const data = await response.json();

                const sortedData = data.sort((a, b) =>
                    (a.transliteration || '').localeCompare(b.transliteration || '')
                );

                // 3. SEAMLESS UPDATE: Apply the fresh data and save it to the device for next time
                setTerms(sortedData);
                localStorage.setItem('kisa_glossary_cache', JSON.stringify(sortedData));
                setLoading(false);
            } catch (error) {
                console.error("Glossary Fetch Error:", error);
                setLoading(false);
            }
        };

        fetchOntology();
    }, []);

    const filteredTerms = terms.filter(term =>
        (term.transliteration || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (term.primary_english || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (term.primary_arabic || '').includes(searchQuery)
    );

    const groupedAZ = filteredTerms.reduce((acc, term) => {
        const letter = (term.transliteration || 'A').charAt(0).toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(term);
        return acc;
    }, {});

    const groupedDomain = filteredTerms.reduce((acc, term) => {
        const domain = term.domain || 'Uncategorized';
        if (!acc[domain]) acc[domain] = [];
        acc[domain].push(term);
        return acc;
    }, {});

    const uniqueDomains = ['Show All', ...Object.keys(groupedDomain).sort()];

    const scrollToLetter = (letter) => {
        const element = document.getElementById(`letter-${letter}`);
        if (element) {
            // Offset for fixed header
            const y = element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const handleSaveToVault = async (term) => {
        setSavingId(term.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please sign in to save terms to your Vault.");
                setSavingId(null);
                return;
            }

            const vaultPayload = {
                user_id: session.user.id,
                content: term.definition,
                arabic_text: term.primary_arabic,
                source: term.primary_english,
                type: 'concept',
                note: `Transliteration: ${term.transliteration} | Domain: ${term.domain}`
            };

            const { error } = await supabase.from('vault_items').insert([vaultPayload]);
            if (error) throw error;

            setTimeout(() => setSavingId(null), 1000);
        } catch (error) {
            console.error("Vault Save Error:", error);
            setSavingId(null);
        }
    };

    const handleCopy = (term) => {
        const text = `${term.transliteration} (${term.primary_arabic})\n${term.primary_english}\n\n${term.definition}\n\n— Via Al-Kisa Glossary`;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(term.id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const handleShare = async (term) => {
        const shareData = {
            title: `${term.transliteration} - Al-Kisa Glossary`,
            text: `Learn about ${term.transliteration} (${term.primary_english}): ${term.definition}`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                handleCopy(term); // Fallback to copy
            }
        } catch (err) {
            console.log('Share dismissed or failed', err);
        }
    };

    const alphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    return (
        <div className={`min-h-screen font-sans pb-20 sm:pt-10 transition-colors duration-500 ${colors.bg}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative flex gap-8">

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="mb-6 sm:mb-10 pt-4 sm:pt-0">
                        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 flex items-center gap-3 tracking-tight ${colors.textPrimary}`}>
                            <Library className="w-7 h-7 sm:w-8 sm:h-8 text-[#c6a87c] shrink-0" />
                            Theological Glossary
                        </h1>
                        <p className={`text-sm sm:text-base leading-relaxed ${colors.textSecondary}`}>The master dictionary of Twelver Shia terminology. Save core concepts to your Study Vault for later revision.</p>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                        <div className="relative w-full md:flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-[#c6a87c] transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter dictionary..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full border rounded-xl py-3.5 pl-12 pr-6 outline-none shadow-sm transition-all focus:border-[#c6a87c] ${colors.inputBg} ${colors.border} ${colors.textPrimary}`}
                            />
                        </div>

                        <div className="flex w-full md:w-auto gap-2">
                            <div className={`flex p-1 rounded-xl border w-full md:w-auto ${colors.cardBg} ${colors.border}`}>
                                <button
                                    onClick={() => setViewMode('az')}
                                    className={`flex-1 md:flex-none px-5 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'az' ? colors.toggleActive : colors.toggleInactive}`}
                                >
                                    A-Z Index
                                </button>
                                <button
                                    onClick={() => setViewMode('domain')}
                                    className={`flex-1 md:flex-none px-5 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'domain' ? colors.toggleActive : colors.toggleInactive}`}
                                >
                                    Domains
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Domain Filter Dropdown (Only visible in Domain Mode) */}
                    {viewMode === 'domain' && uniqueDomains.length > 1 && (
                        <div className="mb-8 relative max-w-xs">
                            <select
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                className={`w-full appearance-none outline-none border rounded-xl py-3 px-4 pr-10 text-sm font-bold shadow-sm cursor-pointer transition-colors focus:border-[#c6a87c] ${colors.inputBg} ${colors.border} ${colors.textPrimary}`}
                            >
                                {uniqueDomains.map(domain => (
                                    <option key={domain} value={domain}>{domain}</option>
                                ))}
                            </select>
                            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${colors.textSecondary}`} />
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className={`flex justify-center py-20 text-sm tracking-widest uppercase font-bold ${colors.textSecondary}`}>
                            Loading Ontology Brain...
                        </div>
                    )}

                    {/* Dictionary Rendering */}
                    {!loading && (
                        <div className="space-y-10 sm:space-y-12">
                            {(viewMode === 'az' ? Object.keys(groupedAZ).sort() : Object.keys(groupedDomain).sort()).map(groupKey => {
                                // Skip if domain is filtered out
                                if (viewMode === 'domain' && selectedDomain !== 'Show All' && groupKey !== selectedDomain) return null;

                                const groupTerms = viewMode === 'az' ? groupedAZ[groupKey] : groupedDomain[groupKey];
                                if (!groupTerms || groupTerms.length === 0) return null;

                                return (
                                    <div key={groupKey} id={`letter-${groupKey}`} className="scroll-mt-24">
                                        <div className="flex items-center gap-4 mb-6">
                                            <h2 className="text-xl sm:text-2xl font-black text-[#c6a87c] whitespace-nowrap shrink-0">{groupKey}</h2>
                                            <div className={`h-px flex-1 ${colors.divider}`}></div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {groupTerms.map(term => (
                                                <div key={term.id} className={`border p-5 sm:p-6 rounded-2xl transition-colors group relative shadow-sm hover:border-[#c6a87c]/50 ${colors.cardBg} ${colors.border}`}>

                                                    {/* Card Actions (Top Right) */}
                                                    <div className="absolute top-4 right-4 flex items-center gap-1 sm:gap-2">
                                                        <button
                                                            onClick={() => handleShare(term)}
                                                            className={`p-2 transition-colors rounded-full ${colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}
                                                            title="Share"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopy(term)}
                                                            className={`p-2 transition-colors rounded-full ${colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}
                                                            title="Copy Definition"
                                                        >
                                                            {copiedId === term.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveToVault(term)}
                                                            disabled={savingId === term.id}
                                                            className={`p-2 transition-colors rounded-full ${savingId === term.id ? 'text-[#c6a87c]' : colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}
                                                            title="Save to Study Vault"
                                                        >
                                                            <Bookmark className={`w-4 h-4 ${savingId === term.id ? 'fill-[#c6a87c]' : ''}`} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-start justify-between mb-3 pr-28 sm:pr-32">
                                                        <div>
                                                            <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${colors.textPrimary}`}>{term.transliteration}</h3>
                                                            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#c6a87c] mt-1">{term.primary_english}</p>
                                                        </div>
                                                        {/* Force Arabic text to not overlap buttons on small mobile */}
                                                        <span className={`font-arabic text-xl sm:text-2xl ml-2 shrink-0 ${colors.textPrimary}`}>{term.primary_arabic}</span>
                                                    </div>

                                                    {viewMode === 'az' && term.domain && (
                                                        <span className={`inline-block border text-[9px] sm:text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 sm:mb-4 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-[#c6a87c]/10 border-[#c6a87c]/20 text-[#c6a87c] font-bold'}`}>
                                                            {term.domain}
                                                        </span>
                                                    )}

                                                    <p className={`text-sm sm:text-base leading-relaxed font-serif ${colors.textSecondary}`}>
                                                        {term.definition}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredTerms.length === 0 && (
                                <div className={`text-center py-20 font-bold uppercase tracking-widest text-sm ${colors.textSecondary}`}>
                                    No concepts match your search.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* The iOS-Style Rolodex (Desktop Only) */}
                {viewMode === 'az' && !loading && filteredTerms.length > 0 && (
                    <div className={`hidden lg:flex flex-col items-center sticky top-24 h-[calc(100vh-8rem)] w-8 py-4 border rounded-full shrink-0 shadow-sm ${colors.cardBg} ${colors.border}`}>
                        {alphabet.map(letter => {
                            const hasTerms = groupedAZ[letter] && groupedAZ[letter].length > 0;
                            return (
                                <button
                                    key={letter}
                                    onClick={() => scrollToLetter(letter)}
                                    disabled={!hasTerms}
                                    className={`flex-1 text-[10px] font-bold w-full transition-all ${hasTerms ? `${colors.textSecondary} hover:text-[#c6a87c] cursor-pointer hover:scale-150` : 'opacity-20 cursor-default'
                                        }`}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Glossary;