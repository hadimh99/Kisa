import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bookmark, BookOpen, ChevronRight, Library, Copy, Check, Share2, ChevronDown, LayoutGrid, List, ChevronUp } from 'lucide-react';
import { supabase } from '../supabaseClient'; // SURGICAL FIX: Direct Import!

const Glossary = ({ theme = 'light' }) => {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('az'); // 'az' or 'domain'
    const [selectedDomain, setSelectedDomain] = useState('Show All');

    // NEW STATES: Layout and Accordion
    const [layout, setLayout] = useState('grid'); // 'grid' or 'list'
    const [expandedId, setExpandedId] = useState(null); // Tracks which list item is open

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

    // Auto-switch to list view on mobile for better UX
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setLayout('list');
        }
    }, []);

    // SURGICAL FIX: Directly fetch from Supabase instead of a missing API route
    useEffect(() => {
        const fetchOntology = async () => {
            setLoading(true);
            const savedDictionary = localStorage.getItem('kisa_glossary_cache');
            if (savedDictionary) {
                setTerms(JSON.parse(savedDictionary));
                setLoading(false);
                // We don't return here so we can still fetch fresh data in the background
            }

            try {
                const { data, error } = await supabase
                    .from('ontology_concepts')
                    .select('*');

                if (error) throw error;

                const sortedData = data.sort((a, b) =>
                    (a.transliteration || '').localeCompare(b.transliteration || '')
                );

                setTerms(sortedData);
                localStorage.setItem('kisa_glossary_cache', JSON.stringify(sortedData));
            } catch (error) {
                console.error("Glossary Fetch Error:", error);
            } finally {
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
            const y = element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const handleSaveToVault = async (term, key) => {
        setSavingId(key); // Use the foolproof key here
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

    const handleCopy = (term, key) => {
        const text = `${term.transliteration} (${term.primary_arabic})\n${term.primary_english}\n\n${term.definition}\n\n— Via Al-Kisa Glossary`;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(key); // Use the foolproof key here
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
            if (navigator.share) await navigator.share(shareData);
            else handleCopy(term);
        } catch (err) {
            console.log('Share dismissed or failed', err);
        }
    };

    const alphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    return (
        <div className={`min-h-screen font-sans pb-20 sm:pt-10 transition-colors duration-500 ${colors.bg}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative flex gap-8">

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

                        <div className="flex w-full md:w-auto gap-2 sm:gap-4 justify-between md:justify-start">
                            {/* AZ vs Domain Toggle */}
                            <div className={`flex p-1 rounded-xl border w-full sm:w-auto ${colors.cardBg} ${colors.border}`}>
                                <button onClick={() => setViewMode('az')} className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'az' ? colors.toggleActive : colors.toggleInactive}`}>A-Z</button>
                                <button onClick={() => setViewMode('domain')} className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'domain' ? colors.toggleActive : colors.toggleInactive}`}>Domains</button>
                            </div>

                            {/* Grid vs List Layout Toggle */}
                            <div className={`hidden sm:flex p-1 rounded-xl border shrink-0 ${colors.cardBg} ${colors.border}`}>
                                <button onClick={() => setLayout('grid')} className={`p-2 rounded-lg transition-all ${layout === 'grid' ? colors.toggleActive : colors.toggleInactive}`} title="Card View">
                                    <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button onClick={() => setLayout('list')} className={`p-2 rounded-lg transition-all ${layout === 'list' ? colors.toggleActive : colors.toggleInactive}`} title="Compact List View">
                                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Domain Filter Dropdown */}
                    {viewMode === 'domain' && uniqueDomains.length > 1 && (
                        <div className="mb-8 relative max-w-xs">
                            <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className={`w-full appearance-none outline-none border rounded-xl py-3 px-4 pr-10 text-sm font-bold shadow-sm cursor-pointer transition-colors focus:border-[#c6a87c] ${colors.inputBg} ${colors.border} ${colors.textPrimary}`}>
                                {uniqueDomains.map(domain => <option key={domain} value={domain}>{domain}</option>)}
                            </select>
                            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${colors.textSecondary}`} />
                        </div>
                    )}

                    {loading && (
                        <div className={`flex justify-center py-20 text-sm tracking-widest uppercase font-bold ${colors.textSecondary}`}>
                            Loading Ontology Brain...
                        </div>
                    )}

                    {!loading && (
                        <div className="space-y-10 sm:space-y-12">
                            {(viewMode === 'az' ? Object.keys(groupedAZ).sort() : Object.keys(groupedDomain).sort()).map(groupKey => {
                                if (viewMode === 'domain' && selectedDomain !== 'Show All' && groupKey !== selectedDomain) return null;
                                const groupTerms = viewMode === 'az' ? groupedAZ[groupKey] : groupedDomain[groupKey];
                                if (!groupTerms || groupTerms.length === 0) return null;

                                return (
                                    <div key={groupKey} id={`letter-${groupKey}`} className="scroll-mt-24">
                                        <div className="flex items-center gap-4 mb-6">
                                            <h2 className="text-xl sm:text-2xl font-black text-[#c6a87c] whitespace-nowrap shrink-0">{groupKey}</h2>
                                            <div className={`h-px flex-1 ${colors.divider}`}></div>
                                        </div>

                                        {/* CONDITIONAL RENDERING: GRID vs LIST */}
                                        <div className={layout === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "flex flex-col gap-2 sm:gap-3"}>
                                            {groupTerms.map((term, index) => {
                                                // FOOLPROOF ID: Falls back to transliteration or index if database ID is missing
                                                const uniqueKey = term.id || term.transliteration || index;
                                                const isExpanded = expandedId === uniqueKey;

                                                if (layout === 'grid') {
                                                    // ----------------- GRID CARD VIEW -----------------
                                                    return (
                                                        <div key={uniqueKey} className={`border p-5 sm:p-6 rounded-2xl transition-colors group relative shadow-sm hover:border-[#c6a87c]/50 ${colors.cardBg} ${colors.border}`}>
                                                            <div className="absolute top-4 right-4 flex items-center gap-1 sm:gap-2">
                                                                <button onClick={() => handleShare(term)} className={`p-2 transition-colors rounded-full ${colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}><Share2 className="w-4 h-4" /></button>
                                                                <button onClick={() => handleCopy(term, uniqueKey)} className={`p-2 transition-colors rounded-full ${colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}>{copiedId === uniqueKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
                                                                <button onClick={() => handleSaveToVault(term, uniqueKey)} disabled={savingId === uniqueKey} className={`p-2 transition-colors rounded-full ${savingId === uniqueKey ? 'text-[#c6a87c]' : colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}><Bookmark className={`w-4 h-4 ${savingId === uniqueKey ? 'fill-[#c6a87c]' : ''}`} /></button>
                                                            </div>

                                                            <div className="flex items-start justify-between mb-3 pr-28 sm:pr-32">
                                                                <div>
                                                                    <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${colors.textPrimary}`}>{term.transliteration}</h3>
                                                                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#c6a87c] mt-1">{term.primary_english}</p>
                                                                </div>
                                                                <span className={`font-arabic text-xl sm:text-2xl ml-2 shrink-0 ${colors.textPrimary}`}>{term.primary_arabic}</span>
                                                            </div>

                                                            {viewMode === 'az' && term.domain && (
                                                                <span className={`inline-block border text-[9px] sm:text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 sm:mb-4 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-[#c6a87c]/10 border-[#c6a87c]/20 text-[#c6a87c] font-bold'}`}>{term.domain}</span>
                                                            )}
                                                            <p className={`text-sm sm:text-base leading-relaxed font-serif ${colors.textSecondary}`}>{term.definition}</p>
                                                        </div>
                                                    );
                                                } else {
                                                    // ----------------- COMPACT ACCORDION LIST VIEW (Left-Lit Monolith) -----------------
                                                    return (
                                                        <div key={uniqueKey} className={`border rounded-xl transition-all overflow-hidden ${colors.cardBg} ${isExpanded ? 'border-[#c6a87c]/40 shadow-sm' : colors.border}`}>
                                                            <button
                                                                onClick={() => setExpandedId(isExpanded ? null : uniqueKey)}
                                                                className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${!isExpanded && 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div>
                                                                        <h3 className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${isExpanded ? 'text-[#c6a87c]' : colors.textPrimary}`}>{term.transliteration}</h3>
                                                                        <p className="text-[10px] uppercase tracking-widest text-[#c6a87c] mt-0.5">{term.primary_english}</p>
                                                                    </div>
                                                                    <span className={`font-arabic text-lg sm:text-xl hidden sm:block opacity-80 ${colors.textPrimary}`}>{term.primary_arabic}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {viewMode === 'az' && term.domain && <span className={`hidden md:inline-block border text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-[#c6a87c]/10 border-[#c6a87c]/20 text-[#c6a87c]'}`}>{term.domain}</span>}
                                                                    <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-[#c6a87c]/10 text-[#c6a87c]' : colors.textSecondary}`}>
                                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                                                                            {/* The "Left-Lit" vertical accent line */}
                                                                            <div className="pl-4 sm:pl-5 border-l-2 border-[#c6a87c]/40 ml-1">
                                                                                <span className={`font-arabic text-xl sm:hidden block mb-3 opacity-90 ${colors.textPrimary}`}>{term.primary_arabic}</span>
                                                                                <p className={`text-sm sm:text-base leading-relaxed font-serif mb-5 ${colors.textSecondary}`}>{term.definition}</p>

                                                                                {/* Action buttons aligned to the left accent line for typographic symmetry */}
                                                                                <div className="flex items-center justify-start gap-1 sm:gap-2 pt-1">
                                                                                    <button onClick={() => handleShare(term)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase rounded-lg transition-colors ${colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}><Share2 className="w-3.5 h-3.5" /> Share</button>
                                                                                    <button onClick={() => handleCopy(term, uniqueKey)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase rounded-lg transition-colors ${colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}>{copiedId === uniqueKey ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} Copy</button>
                                                                                    <button onClick={() => handleSaveToVault(term, uniqueKey)} disabled={savingId === uniqueKey} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase rounded-lg transition-colors ${savingId === uniqueKey ? 'text-[#c6a87c]' : colors.textSecondary} hover:bg-[#c6a87c]/10 hover:text-[#c6a87c]`}><Bookmark className={`w-3.5 h-3.5 ${savingId === uniqueKey ? 'fill-[#c6a87c]' : ''}`} /> Save</button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                }
                                            })}
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

                {/* Rolodex */}
                {viewMode === 'az' && !loading && filteredTerms.length > 0 && (
                    <div className={`hidden lg:flex flex-col items-center sticky top-24 h-[calc(100vh-8rem)] w-8 py-4 border rounded-full shrink-0 shadow-sm ${colors.cardBg} ${colors.border}`}>
                        {alphabet.map(letter => {
                            const hasTerms = groupedAZ[letter] && groupedAZ[letter].length > 0;
                            return (
                                <button key={letter} onClick={() => scrollToLetter(letter)} disabled={!hasTerms} className={`flex-1 text-[10px] font-bold w-full transition-all ${hasTerms ? `${colors.textSecondary} hover:text-[#c6a87c] cursor-pointer hover:scale-150` : 'opacity-20 cursor-default'}`}>
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