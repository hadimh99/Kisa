// src/components/DuaLibrary.jsx

import React, { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { ChevronLeft, Heart, Sparkles, Bookmark, Copy, Check, ArrowUp, ShieldAlert, Info } from 'lucide-react';
import { supabase } from '../supabaseClient';

// --- 1. THE LINK TO YOUR EXTERNAL JSON FILE ---
import rawDuasData from '../duas.json';

// --- 2. SUB-COMPONENTS ---
const DuaBookmarkButton = ({ duaTitle, passageIdx, arText, enText, vaultItems = [] }) => {
    const sourceRef = `${duaTitle}, Passage ${passageIdx + 1}`;
    const isSaved = vaultItems.some(v => v.source === sourceRef && v.type === 'dua');

    const handleSaveClick = async (e) => {
        e.stopPropagation();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return alert("Please Sign In from the top menu to save to your Vault.");

        if (isSaved) {
            const savedItem = vaultItems.find(v => v.source === sourceRef && v.type === 'dua');
            if (savedItem) {
                await supabase.from('vault_items').delete().eq('id', savedItem.id);
                window.dispatchEvent(new Event('vault-updated'));
            }
            return;
        }

        const { error } = await supabase.from('vault_items').insert([{
            user_id: session.user.id, content: enText, arabic_text: arText, source: sourceRef, type: 'dua', note: ''
        }]);

        if (error) console.error("Supabase Error:", error);
        else window.dispatchEvent(new Event('vault-updated'));
    };

    return (
        <button onClick={handleSaveClick} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isSaved ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400'}`}>
            <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2} />
        </button>
    );
};

// --- 3. CORE COMPONENT ---
// FIXED: Added externalTarget to the destructured props
function DuaLibraryCore({ vaultItems = [], activeFontFamily = '"Scheherazade New", serif', externalTarget }) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedDua, setSelectedDua] = useState(null);
    const [copiedPassage, setCopiedPassage] = useState(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // --- GPU-ACCELERATED SCROLL MATH & REVEAL HEADER ---
    const { scrollYProgress, scrollY } = useScroll();
    const [isStickyVisible, setIsStickyVisible] = useState(false);

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Listens to scroll direction to trigger the elegant top bar
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (currentView !== 'reader') return;
        const previous = scrollY.getPrevious();

        if (latest > previous && latest > 300) {
            // Scrolling down (Hide it)
            setIsStickyVisible(false);
        } else if (previous > latest && latest > 300) {
            // Scrolling up (Reveal it)
            setIsStickyVisible(true);
        } else if (latest <= 300) {
            // At the top of the page (Hide it naturally)
            setIsStickyVisible(false);
        }
    });

    // Bulletproof extraction of the JSON file
    const safeDuasData = Array.isArray(rawDuasData) ? rawDuasData : (rawDuasData?.default ? rawDuasData.default : []);

    // --- NEW: THE ROUTING INTERCEPTOR HOOK ---
    // Instantly opens the reader view if App.jsx passes a specific Dua title via deep-link
    useEffect(() => {
        if (externalTarget) {
            const targetDua = safeDuasData.find(d => d.title.toLowerCase() === externalTarget.toLowerCase());
            if (targetDua) {
                window.scrollTo(0, 0);
                setSelectedDua(targetDua);
                setShowInfo(false);
                setIsStickyVisible(false);
                setCurrentView('reader');
            }
        }
    }, [externalTarget, safeDuasData]);

    useEffect(() => {
        if (currentView !== 'reader') return;
        const handleScroll = () => {
            if (window.scrollY > 600) setShowBackToTop(true);
            else setShowBackToTop(false);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [currentView]);

    const handleCopy = (passage, idx) => {
        if (!selectedDua) return;
        navigator.clipboard.writeText(`${passage.arabic}\n\n${passage.transliteration ? passage.transliteration + '\n\n' : ''}${passage.english}\n\n— ${selectedDua.title}, Passage ${idx + 1}`);
        setCopiedPassage(idx);
        setTimeout(() => setCopiedPassage(null), 2000);
    };

    if (currentView === 'dashboard') {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-32">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl sm:text-5xl font-serif font-bold text-slate-900 dark:text-slate-50 mb-3">The Treasury of Supplications</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">Connect with the Divine through the profound and authenticated words of the Ahl al-Bayt.</p>
                </div>

                {safeDuasData.length === 0 ? (
                    <div className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <ShieldAlert className="w-12 h-12 text-amber-500 mb-4 opacity-80" />
                        <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-2">Database Empty</h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto font-sans">
                            Al-Kisa loaded <strong>duas.json</strong>, but no supplications were found. Make sure the file contains a valid JSON array.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {safeDuasData.map((dua) => (
                            <div key={dua.id} onClick={() => { window.scrollTo(0, 0); setSelectedDua(dua); setShowInfo(false); setIsStickyVisible(false); setCurrentView('reader'); }} className="group flex flex-col bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 cursor-pointer hover:border-amber-500/50 hover:shadow-xl dark:hover:shadow-[0_10px_40px_rgba(245,158,11,0.08)] transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800/50 text-amber-500">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                    <span className="font-arabic text-2xl sm:text-3xl text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" dir="rtl">{dua.arabicTitle}</span>
                                </div>
                                <div className="relative z-10 flex-grow flex flex-col">
                                    <h3 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-50 mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{dua.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{dua.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (currentView === 'reader' && selectedDua) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-32 relative">

                {/* --- THE 144HZ CINEMATIC PROGRESS BAR --- */}
                <div className="fixed top-0 left-0 right-0 h-1.5 bg-transparent z-[200] pointer-events-none">
                    <motion.div
                        className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] origin-left"
                        style={{ scaleX }}
                    />
                </div>

                {/* --- NEW: ULTRA-SLIM SCROLL-UP HUD (FLUSH TO CEILING) --- */}
                <AnimatePresence>
                    {isStickyVisible && (
                        <motion.div
                            initial={{ y: '-100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '-100%', opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            // FIX 1: Snapped to top-0 to kill the gap. 
                            // FIX 2: Swapped fixed heights for tight padding (pt-1.5 pb-1) to make it razor thin.
                            className="fixed top-0 left-0 right-0 z-[70] pt-1.5 pb-1 sm:pt-2 sm:pb-1 bg-[#FDFBF7]/95 dark:bg-[#0e0e11]/95 backdrop-blur-xl border-b border-amber-500/10 dark:border-[#c6a87c]/15 shadow-sm flex items-center justify-center gap-2.5 sm:gap-3 pointer-events-none"
                        >
                            <span className="font-serif font-bold text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-slate-500 dark:text-zinc-400 mt-px">
                                {selectedDua.title}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-amber-500/40 dark:bg-[#c6a87c]/40" />
                            <span className="font-arabic font-semibold text-xs sm:text-sm text-amber-600 dark:text-[#c6a87c] leading-none" dir="rtl" style={{ fontFamily: activeFontFamily }}>
                                {selectedDua.arabicTitle}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showBackToTop && (
                        <motion.button initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 z-[90] w-12 h-12 bg-amber-600/90 dark:bg-amber-500/90 backdrop-blur-md text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-amber-700 dark:hover:bg-amber-400 hover:scale-105 transition-all cursor-pointer border border-white/20">
                            <ArrowUp className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-amber-600 dark:hover:text-amber-500 mb-10 text-sm font-bold uppercase tracking-widest transition-colors cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Back to Treasury
                </button>

                {/* --- HEADER WITH INFO TOGGLE --- */}
                <div className="text-center mb-8 sm:mb-12 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <p className="text-amber-600 dark:text-amber-500 font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold m-0">Supplication</p>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-arabic font-bold text-slate-900 dark:text-slate-50 mb-6 leading-[1.5]" style={{ fontFamily: activeFontFamily }} dir="rtl">
                        {selectedDua.arabicTitle}
                    </h1>

                    <div className="flex items-center justify-center gap-3">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-700 dark:text-slate-300">{selectedDua.title}</h2>
                        {selectedDua.significance && (
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className={`p-1.5 rounded-full transition-colors cursor-pointer border ${showInfo ? 'bg-amber-100 border-amber-200 text-amber-600 dark:bg-amber-900/40 dark:border-amber-500/50 dark:text-amber-400' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200 dark:bg-[#1a1a1a] dark:border-slate-800 dark:text-slate-500 dark:hover:text-amber-400 dark:hover:border-amber-500/30'}`}
                                title="Read Historical Significance"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* --- THE EXPANDABLE INFO BLOCK --- */}
                    <AnimatePresence>
                        {showInfo && selectedDua.significance && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                className="overflow-hidden w-full max-w-2xl mt-6"
                            >
                                <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 text-left relative shadow-sm">
                                    <h3 className="font-bold font-serif text-slate-900 dark:text-slate-100 mb-4 text-lg flex items-center gap-2">
                                        <Info className="w-4 h-4 text-amber-500" /> Significance
                                    </h3>
                                    <div className="space-y-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 font-serif leading-relaxed">
                                        {selectedDua.significance.split('\n\n').map((para, i) => (
                                            <p key={i}>{para}</p>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- UNIVERSAL PRE-DUA INVOCATIONS --- */}
                <div className="flex flex-col items-center justify-center w-full mb-12 sm:mb-16 relative z-10">
                    <p
                        className="font-arabic font-semibold text-xl sm:text-2xl text-[#c6a87c] dark:text-[#c6a87c]/90 mb-5 tracking-wide"
                        dir="rtl"
                        style={{ fontFamily: activeFontFamily }}
                    >
                        اَللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ
                    </p>
                    <p
                        className="font-arabic font-semibold text-4xl sm:text-[44px] text-slate-800 dark:text-[#FAFAFA] leading-normal"
                        dir="rtl"
                        style={{ fontFamily: activeFontFamily }}
                    >
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </p>
                    <div className="w-12 h-px bg-[#c6a87c]/40 mt-10" />
                </div>

                {/* --- DUA PASSAGES (CENTERED EDITORIAL LAYOUT) --- */}
                <div className="flex flex-col items-center w-full">
                    {selectedDua.content.map((passage, idx) => (
                        <div
                            key={idx}
                            className="w-full py-10 sm:py-14 border-b border-[#c6a87c]/20 dark:border-zinc-800/60 first:pt-0 relative group flex flex-col items-center text-center transition-colors duration-500 px-12 md:px-24 lg:px-32"
                        >

                            {/* --- EDITORIAL FRACTION NUMBERING --- */}
                            <div className="absolute left-4 sm:left-6 lg:left-10 top-12 sm:top-16 flex items-baseline font-mono select-none pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                                <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-zinc-600 tracking-widest">
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] sm:text-xs text-slate-300 dark:text-zinc-700/60 ml-1 tracking-wider">
                                    / {selectedDua.content.length}
                                </span>
                            </div>

                            {/* 1. Arabic */}
                            <p
                                className="font-arabic font-semibold text-3xl sm:text-4xl lg:text-[42px] leading-[2.2] sm:leading-[2.4] text-slate-900 dark:text-[#FAFAFA] mb-5 max-w-3xl"
                                dir="rtl"
                                style={{ fontFamily: activeFontFamily }}
                            >
                                {passage.arabic}
                            </p>

                            {/* 2. Transliteration */}
                            {passage.transliteration && (
                                <p className="text-sm sm:text-[15px] font-medium text-slate-500 dark:text-[#c6a87c]/80 italic mb-5 leading-relaxed max-w-2xl">
                                    {passage.transliteration}
                                </p>
                            )}

                            {/* 3. English */}
                            <p className="text-lg sm:text-xl font-serif text-slate-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
                                {passage.english}
                            </p>

                            {/* 4. Tools */}
                            <div className="mt-8 flex justify-center items-center gap-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={() => handleCopy(passage, idx)}
                                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border px-4 py-2 rounded-full shadow-sm transition-colors cursor-pointer ${copiedPassage === idx ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30' : 'text-slate-500 border-slate-200 bg-white hover:bg-slate-50 dark:bg-transparent dark:border-zinc-700/50 dark:hover:bg-zinc-800/50'}`}
                                >
                                    {copiedPassage === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedPassage === idx ? 'Copied!' : 'Copy'}</span>
                                </button>
                                <DuaBookmarkButton
                                    duaTitle={selectedDua.title}
                                    passageIdx={idx}
                                    arText={passage.arabic}
                                    enText={passage.english}
                                    vaultItems={vaultItems}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}

// --- 4. THE ERROR BOUNDARY (THE SHIELD) ---
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) {
        console.error("DuaLibrary Crash Details:", error, errorInfo);
        this.setState({ errorInfo });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full max-w-3xl mx-auto mt-20 p-8 bg-red-50 border border-red-200 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 text-red-600 mb-4"><ShieldAlert className="w-8 h-8" /><h2 className="text-2xl font-bold font-sans">Component Crash Detected</h2></div>
                    <p className="text-red-800 font-medium mb-6">Al-Kisa caught a fatal error in DuaLibrary before it could white-screen the app.</p>
                    <div className="bg-red-100 p-4 rounded-xl overflow-x-auto">
                        <p className="font-mono text-sm text-red-900 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                        <pre className="text-[10px] text-red-800/80 mt-2 whitespace-pre-wrap leading-relaxed">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function DuaLibrary(props) {
    return <ErrorBoundary><DuaLibraryCore {...props} /></ErrorBoundary>;
}