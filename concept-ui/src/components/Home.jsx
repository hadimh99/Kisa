// src/components/Home.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Library as LibraryIcon, ChevronRight, Book, Play, X, ChevronDown, ChevronUp, RefreshCw, Sparkles, CalendarDays, Copy, Check, Moon } from 'lucide-react';
import dailyHadithsData from '../daily_hadiths.json';

// --- THE LITURGICAL ENGINE ---
const getLiturgicalContext = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isEve = hour >= 18;

    if (day === 4 && isEve) {
        return { message: "Eve of Friday • Laylat al-Jum'ah", recommendation: "Recommended: Surah Yasin", targetSurah: 36, icon: "🌙" };
    } else if (day === 5 && !isEve) {
        return { message: "Friday • Yawm al-Jum'ah", recommendation: "Recommended: Surah Al-Jumu'ah", targetSurah: 62, icon: "☀️" };
    } else if (isEve) {
        return { message: "Evening Reflection", recommendation: "Recommended: Surah Al-Waqi'ah", targetSurah: 56, icon: "🌙" };
    } else {
        return { message: "Daily Recitation", recommendation: "Recommended: Surah Yasin", targetSurah: 36, icon: "☀️" };
    }
};

// --- THE ZERO-STUTTER GHOST WRITER ---
const TrueGhostTypewriter = ({ text, delayMs = 1200, speedMs = 15, shouldReduceMotion, isInstant = false, onComplete }) => {
    const containerRef = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        hasAnimated.current = false;
    }, [text]);

    useEffect(() => {
        if (!containerRef.current || shouldReduceMotion || hasAnimated.current || !text) {
            if (shouldReduceMotion && onComplete && !hasAnimated.current) {
                hasAnimated.current = true;
                onComplete();
            }
            return;
        }

        const chars = containerRef.current.querySelectorAll('span.ghost-char');

        if (isInstant) {
            chars.forEach(char => char.style.opacity = '1');
            hasAnimated.current = true;
            if (onComplete) onComplete();
            return;
        }

        let i = 0;
        let timer;

        const revealNextChar = () => {
            if (i < chars.length) {
                chars[i].style.opacity = '1';
                i++;
                timer = setTimeout(revealNextChar, speedMs);
            } else {
                hasAnimated.current = true;
                if (onComplete) onComplete();
            }
        };

        const startTimer = setTimeout(revealNextChar, delayMs);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, delayMs, speedMs, shouldReduceMotion, isInstant]);

    if (shouldReduceMotion || !text) return <>{text}</>;

    const chunks = text.split(/(\s+)/);

    return (
        <span ref={containerRef}>
            {chunks.map((chunk, i) => {
                if (/\s+/.test(chunk)) {
                    return <span key={i}>{chunk}</span>;
                }
                return chunk.split('').map((char, j) => (
                    <span
                        key={`${i}-${j}`}
                        className="ghost-char"
                        style={{
                            opacity: (hasAnimated.current || isInstant) ? 1 : 0,
                            willChange: 'opacity'
                        }}
                    >
                        {char}
                    </span>
                ));
            })}
        </span>
    );
};

// --- THE UNIFIED PHYSICS ENGINE ---
const TouchableCard = ({ children, onClick, className, style, shouldReduceMotion, layout = false }) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleTap = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
        setTimeout(() => {
            if (onClick) onClick();
        }, 150);
    };

    if (shouldReduceMotion) {
        return <div className={className} style={style} onClick={onClick}>{children}</div>;
    }

    return (
        <motion.div
            layout={layout}
            style={style}
            className={`relative overflow-hidden cursor-pointer ${className}`}
            whileTap={{ scale: 0.96, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            onTapStart={() => setIsPressed(true)}
            onTapCancel={() => setIsPressed(false)}
            onTap={() => {
                setIsPressed(false);
                handleTap();
            }}
        >
            <div
                className="absolute inset-0 bg-black z-50 pointer-events-none transition-opacity duration-150 ease-out rounded-[inherit]"
                style={{ opacity: isPressed ? 0.08 : 0 }}
            />
            {children}
        </motion.div>
    );
};

export default function Home({
    setActiveTab,
    setQuranTarget,
    setQuranVerseTarget,
    setTranscriptTarget,
    setShowUpdates
}) {
    const [dailyHadith, setDailyHadith] = useState(null);
    const [showFocusModal, setShowFocusModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isTypingDone, setIsTypingDone] = useState(false);

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isShuffling, setIsShuffling] = useState(false);
    const [iconRotation, setIconRotation] = useState(0);

    const [showAnnouncement, setShowAnnouncement] = useState(false);

    const liturgicalContext = getLiturgicalContext();
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const getDayOfYear = () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            return Math.floor((now - start) / (1000 * 60 * 60 * 24));
        };

        const hadithArray = (dailyHadithsData && dailyHadithsData.length > 0)
            ? dailyHadithsData
            : [{
                arabic: "صَديقُ كُلِّ امْرِئٍ عَقْلُهُ، وَ عَدُوُّهُ جَهْلُهُ",
                english: "A person's friend is their intellect, and their enemy is their ignorance.",
                source: "Imam al-Rida (as)",
                book: "al-Kafi, Vol 1"
            }];

        const dayIndex = getDayOfYear() % hadithArray.length;
        setDailyHadith(hadithArray[dayIndex] || hadithArray[0]);

        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const hasSeenAnnouncement = localStorage.getItem('kisa_v5_announcement_seen');

        if (isLocalhost || !hasSeenAnnouncement) {
            const timer = setTimeout(() => {
                setShowAnnouncement(true);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismissAnnouncement = () => {
        setShowAnnouncement(false);
        localStorage.setItem('kisa_v5_announcement_seen', 'true');
    };

    const safeEnglish = dailyHadith?.english || "Translation unavailable.";
    const safeArabic = dailyHadith?.arabic || "";
    const safeSource = dailyHadith?.source || "Unknown Source";
    const safeBook = dailyHadith?.book || "Unknown Book";

    const handleCopy = (e) => {
        if (e) e.stopPropagation();
        if (!dailyHadith) return;

        const textToCopy = `"${safeEnglish}"\n\n${safeArabic ? safeArabic + '\n\n' : ''}— ${safeSource}\n${safeBook}\n\nVia Al-Kisa`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleShuffle = (e) => {
        if (e) e.stopPropagation();
        if (isShuffling || !dailyHadithsData || dailyHadithsData.length <= 1) return;

        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

        setIsShuffling(true);
        setIsInitialLoad(false);
        setShowFocusModal(false);
        setIconRotation(prev => prev + 360);

        let nextHadith;
        let attempts = 0;

        do {
            const randomIndex = Math.floor(Math.random() * dailyHadithsData.length);
            nextHadith = dailyHadithsData[randomIndex];
            attempts++;
        } while (
            (!nextHadith || !nextHadith.english || nextHadith.english === safeEnglish)
            && attempts < 20
        );

        if (!nextHadith || !nextHadith.english) {
            nextHadith = dailyHadithsData.find(h => h && h.english) || dailyHadith;
        }

        setDailyHadith(nextHadith);
        setTimeout(() => setIsShuffling(false), 300);
    };

    const handleTypingComplete = useCallback(() => {
        setIsTypingDone(true);
    }, []);

    const typingSpeedMs = 15;
    const typingStartDelayMs = 1200;
    const charCount = safeEnglish.replace(/\s+/g, '').length;

    const clampedCharCount = Math.min(charCount, 150);
    const revealDelayS = isInitialLoad
        ? (typingStartDelayMs / 1000) + ((clampedCharCount * typingSpeedMs) / 1000)
        : 0;

    const titleContainer = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
    };

    const titleWord = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const masterclassRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: masterclassRef, offset: ["start end", "end start"] });
    const bgY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? ["0%", "0%"] : ["-15%", "15%"]);

    return (
        <div className="w-full min-h-screen pt-20 sm:pt-28 pb-20 px-4 sm:px-6 md:px-8 overflow-y-auto hide-scroll flex flex-col items-center relative">

            <style>{`
                @keyframes masterclassShimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .run-shimmer {
                    background: linear-gradient(120deg, transparent 30%, rgba(198, 168, 124, 0.15) 50%, transparent 70%);
                    background-size: 200% 100%;
                    animation: masterclassShimmer 2s linear forwards;
                    animation-delay: 1.8s;
                }
            `}</style>

            {/* --- DEDICATED HADITH FOCUS MODAL --- */}
            <AnimatePresence>
                {showFocusModal && dailyHadith && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFocusModal(false)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[3001] overflow-hidden">
                            <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-6 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shrink-0">
                                <div>
                                    <h3 className="font-mono text-sm tracking-widest uppercase text-[#2D241C] dark:text-[#FAFAFA] font-bold mb-0.5 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#c6a87c]" /> Daily Hadith
                                    </h3>
                                </div>
                                <button onClick={() => setShowFocusModal(false)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0 self-start">
                                    <X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" />
                                </button>
                            </div>
                            <div className="p-6 sm:p-8 overflow-y-auto flex-grow smart-scrollbar flex flex-col">
                                {safeArabic && (
                                    <div className="mb-6">
                                        <p className="font-arabic text-3xl sm:text-4xl text-right leading-[2.2] text-[#2D241C] dark:text-slate-100" dir="rtl" lang="ar" style={{ fontFamily: '"Scheherazade New", "Noto Naskh Arabic", serif' }}>
                                            {safeArabic}
                                        </p>
                                    </div>
                                )}
                                <div className={safeArabic ? "border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 pt-6 flex-grow" : "flex-grow"}>
                                    <p className="text-xl sm:text-2xl text-[#2D241C] dark:text-[#FAFAFA] leading-[1.7] font-editorial mb-6">
                                        {safeEnglish}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest w-full mt-auto pt-6 border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20">
                                    <span className="text-[#5C4A3D] dark:text-[#FAFAFA]/90">{safeSource}</span>
                                    <span className="text-[#5C4A3D]/50 dark:text-[#c6a87c]/60 font-mono">{safeBook}</span>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20">
                                    <button onClick={handleShuffle} className="flex items-center gap-2 text-xs font-mono transition-colors px-4 py-2 rounded-md cursor-pointer text-[#5C4A3D] hover:text-[#2D241C] hover:bg-[#FDFBF7] dark:bg-[#c6a87c]/10 dark:hover:bg-[#c6a87c]/20 dark:text-[#c6a87c] dark:hover:text-[#FAFAFA]">
                                        <RefreshCw className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} /><span>Shuffle</span>
                                    </button>
                                    <button onClick={handleCopy} className={`flex items-center gap-2 text-xs font-mono transition-colors px-4 py-2 rounded-md cursor-pointer ${isCopied ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-[#5C4A3D] hover:text-[#2D241C] hover:bg-[#FDFBF7] dark:bg-[#c6a87c]/10 dark:hover:bg-[#c6a87c]/20 dark:text-[#c6a87c] dark:hover:text-[#FAFAFA]'}`}>
                                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}<span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAnnouncement && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-6 sm:bottom-10 left-0 right-0 flex justify-center z-[100] px-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto bg-[#FDFBF7]/90 dark:bg-[#151518]/90 backdrop-blur-xl border border-[#c6a87c]/30 shadow-[0_10px_40px_rgba(198,168,124,0.15)] rounded-2xl sm:rounded-full p-4 sm:py-3 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full max-w-xl">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-[#c6a87c]/10 flex items-center justify-center shrink-0 border border-[#c6a87c]/20">
                                    <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 text-[#c6a87c]" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-[#2D241C] dark:text-[#FAFAFA] leading-tight">Welcome to v5.0.0</p>
                                    <p className="text-xs text-[#5C4A3D]/80 dark:text-[#FAFAFA]/70">New masterclasses, sacred texts, and interactive study tools drop every Sunday.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                <button
                                    onClick={() => {
                                        dismissAnnouncement();
                                        if (setShowUpdates) setShowUpdates(true);
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-[#c6a87c] hover:bg-[#b09265] text-[#FDFBF7] dark:text-[#151518] text-xs font-bold uppercase tracking-widest rounded-xl sm:rounded-full transition-colors shadow-sm"
                                >
                                    Read Log
                                </button>
                                <button
                                    onClick={dismissAnnouncement}
                                    className="p-2 text-[#5C4A3D]/50 dark:text-[#FAFAFA]/50 hover:text-[#2D241C] dark:hover:text-[#FAFAFA] bg-[#5C4A3D]/5 dark:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-6xl mx-auto flex flex-col relative z-10">

                <div className="flex flex-col items-center text-center mb-8 mt-2 sm:mt-0">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ duration: 1.8, ease: "easeInOut" }}
                        className="font-arabic text-xl sm:text-2xl md:text-3xl text-[#c6a87c] mb-3 sm:mb-4"
                        dir="rtl"
                    >
                        ﷽
                    </motion.p>

                    <motion.h1
                        variants={titleContainer} initial="hidden" animate="show"
                        className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-[#2D241C] dark:text-[#FAFAFA] tracking-tight mb-2 flex gap-3 overflow-hidden justify-center flex-wrap"
                    >
                        {["Welcome", "to", "Al-Kisa"].map((word, i) => (
                            <motion.span key={i} variants={titleWord} className={word === "Al-Kisa" ? "italic text-[#c6a87c]" : ""}>
                                {word}
                            </motion.span>
                        ))}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                        className="text-sm sm:text-base text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 font-sans tracking-wide"
                    >
                        Master Twelver Shia belief through structured learning and primary sources
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
                    className="mb-3 sm:mb-6 flex justify-center w-full px-2"
                >
                    <TouchableCard
                        onClick={() => {
                            setQuranTarget(liturgicalContext.targetSurah);
                            setQuranVerseTarget(1);
                            setActiveTab('quran');
                        }}
                        shouldReduceMotion={shouldReduceMotion}
                        className="w-full max-w-lg flex items-center justify-center gap-3 sm:gap-4 px-5 py-3 sm:py-2.5 rounded-2xl sm:rounded-full bg-[#FDFBF7]/80 dark:bg-[#c6a87c]/10 border border-[#5C4A3D]/15 dark:border-[#c6a87c]/30 backdrop-blur-md shadow-sm group rounded-[inherit]"
                    >
                        <span className="text-2xl sm:text-xl shrink-0 origin-center animate-[pulse_3s_ease-in-out_infinite] inline-block">{liturgicalContext.icon}</span>
                        <div className="flex flex-col sm:flex-row sm:items-center text-center sm:text-left">
                            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#2D241C] dark:text-[#FAFAFA] leading-tight mb-0.5 sm:mb-0">{liturgicalContext.message}</span>
                            <span className="hidden sm:block text-[#5C4A3D]/30 dark:text-[#c6a87c]/40 mx-2 shrink-0">•</span>
                            <span className="text-[10px] sm:text-xs font-mono text-[#5C4A3D]/80 dark:text-[#c6a87c]/80 transition-colors leading-tight">{liturgicalContext.recommendation}</span>
                        </div>
                    </TouchableCard>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full mb-8 sm:mb-12 lg:items-stretch">

                    <motion.div
                        layout
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            opacity: { duration: 0.6, delay: 1.1, ease: "easeOut" },
                            y: { duration: 0.6, delay: 1.1, ease: "easeOut" },
                            layout: { duration: 0.3, ease: "easeOut" }
                        }}
                        className="w-full lg:w-[35%] order-1 lg:order-2 flex flex-col h-[320px] lg:h-[380px]"
                    >
                        <div className="flex-1 relative flex flex-col items-start justify-start text-left p-6 sm:p-8 rounded-[2rem] bg-[#FDFBF7]/80 dark:bg-[#151518]/60 border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-hidden">
                            <motion.div layout="position" className="flex items-center justify-between w-full mb-4 relative z-20 shrink-0">
                                <div className="flex items-center gap-2">
                                    <motion.span
                                        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.5, rotate: shouldReduceMotion ? 0 : -30 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1.4 }}
                                        className="font-serif text-3xl font-black text-[#c6a87c] leading-none translate-y-[3px] origin-center inline-block"
                                    >
                                        “
                                    </motion.span>
                                    <motion.span
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                                        className="text-[10px] font-bold uppercase tracking-widest text-[#c6a87c] mt-1"
                                    >
                                        Daily Hadith
                                    </motion.span>
                                </div>

                                <div className="flex items-center gap-2 z-30">
                                    <motion.button
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
                                        onClick={handleCopy}
                                        whileTap={{ scale: 0.85 }}
                                        className="p-2 rounded-full bg-[#c6a87c]/10 text-[#c6a87c] border border-[#c6a87c]/20 hover:bg-[#c6a87c]/20 transition-colors cursor-pointer"
                                        title="Copy Hadith"
                                    >
                                        <motion.div animate={{ scale: isCopied ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.2 }}>
                                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </motion.div>
                                    </motion.button>

                                    <motion.button
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
                                        onClick={handleShuffle}
                                        disabled={isShuffling}
                                        whileTap={{ scale: 0.85 }}
                                        className={`p-2 rounded-full bg-[#c6a87c]/10 text-[#c6a87c] border border-[#c6a87c]/20 hover:bg-[#c6a87c]/20 transition-colors cursor-pointer ${isShuffling ? 'opacity-50' : 'opacity-100'}`}
                                        title="Shuffle Hadith"
                                    >
                                        <motion.div
                                            animate={{ rotate: iconRotation }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </motion.div>
                                    </motion.button>
                                </div>
                            </motion.div>

                            {dailyHadith && (
                                <div className="flex-1 w-full flex flex-col relative z-10">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`content-${safeEnglish}`}
                                            initial={{ opacity: 0, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.15 } }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="flex flex-col w-full flex-1"
                                        >
                                            <p className={`font-editorial text-xl sm:text-2xl leading-[1.6] sm:leading-[1.6] antialiased line-clamp-4 mb-2 transition-colors duration-500 ${isTypingDone || !isInitialLoad ? 'text-[#2D241C] dark:text-[#FAFAFA]' : 'text-transparent dark:text-transparent'}`}>
                                                <span className="text-[#2D241C] dark:text-[#FAFAFA]">
                                                    <TrueGhostTypewriter
                                                        text={safeEnglish}
                                                        delayMs={typingStartDelayMs}
                                                        speedMs={typingSpeedMs}
                                                        shouldReduceMotion={shouldReduceMotion}
                                                        isInstant={!isInitialLoad}
                                                        onComplete={handleTypingComplete}
                                                    />
                                                </span>
                                            </p>

                                            {safeEnglish.length > 95 && (
                                                <div className="h-6 flex items-center w-full shrink-0">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFocusModal(true); }}
                                                        className="text-[10px] uppercase tracking-widest font-bold text-[#c6a87c] hover:text-[#5C4A3D] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer inline-flex items-center gap-1 w-max relative z-30"
                                                    >
                                                        Read Full Hadith <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="mt-4 lg:mt-5 flex flex-col w-full shrink-0">
                                                <div className="w-20 h-px bg-gradient-to-r from-[#c6a87c]/60 to-transparent mb-3 sm:mb-4 shrink-0" />

                                                <div className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-widest w-full shrink-0">
                                                    <span className="text-[#5C4A3D] dark:text-[#FAFAFA]/90">{safeSource}</span>
                                                    <span className="text-[#5C4A3D]/50 dark:text-[#c6a87c]/60 font-mono">{safeBook}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        ref={masterclassRef}
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.3, ease: "easeOut" }}
                        className="w-full lg:w-[65%] order-2 lg:order-1 flex flex-col h-[320px] lg:h-[380px]"
                    >
                        <TouchableCard
                            onClick={() => { setActiveTab('library'); setTranscriptTarget('know-your-imam-ep1'); }}
                            shouldReduceMotion={shouldReduceMotion}
                            className="w-full flex-1 relative rounded-[2rem] bg-[#1A1A1A] dark:bg-[#0E0E11] border border-[#c6a87c]/30 p-6 sm:p-8 lg:p-10 group overflow-hidden shadow-xl"
                        >
                            <div className="absolute inset-0 z-20 pointer-events-none run-shimmer rounded-[inherit] overflow-hidden" />

                            <motion.div style={{ y: bgY }} className="absolute inset-[-20%] z-0 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-1000 flex items-center justify-end pr-10">
                                <svg className="w-full h-full max-w-sm" viewBox="0 0 300 400" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="strokeFade" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#c6a87c" stopOpacity="0" />
                                            <stop offset="25%" stopColor="#c6a87c" stopOpacity="1" />
                                            <stop offset="75%" stopColor="#c6a87c" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#c6a87c" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M 250 -50 C 20 150, 20 300, 200 450" stroke="url(#strokeFade)" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-[2px] transition-all duration-1000" />
                                    <path d="M 270 -50 C 50 140, 50 310, 220 450" stroke="url(#strokeFade)" strokeWidth="0.5" opacity="0.6" strokeLinecap="round" className="group-hover:opacity-100 transition-opacity duration-1000" />
                                    <path d="M 290 -50 C 80 130, 80 320, 240 450" stroke="url(#strokeFade)" strokeWidth="0.25" opacity="0.3" strokeLinecap="round" className="group-hover:opacity-60 transition-opacity duration-1000" />
                                </svg>
                            </motion.div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-10 pointer-events-none rounded-[inherit]" />
                            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-1000 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay z-10 rounded-[inherit]" />

                            {/* FIXED: Single centered flex column to keep perfect proportions while aligning content perfectly to the left edge */}
                            <div className="relative z-30 w-full h-full flex flex-col justify-center items-start text-left">

                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full bg-[#c6a87c]/20 text-[#c6a87c] text-[10px] lg:text-xs uppercase font-bold tracking-widest mb-4 lg:mb-5 border border-[#c6a87c]/30 backdrop-blur-md shadow-sm">
                                    <Play className="w-3 h-3 lg:w-3.5 lg:h-3.5 fill-current" /> Featured Masterclass
                                </span>

                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-2 lg:mb-3 tracking-tight transition-colors duration-700">Know Your Imam</h2>

                                <p className="text-slate-300 text-sm sm:text-base lg:text-base leading-relaxed mb-5 lg:mb-6 font-sans max-w-xl">
                                    Explore an exclusive 50-lesson guided series on Knowing Your Imam — backed by hadith, Qur’an, and scholarly commentary, only here on al-Kisa.
                                </p>

                                <div className="flex items-center gap-2 text-white/60 transition-colors bg-white/5 w-fit px-5 py-2.5 lg:px-6 lg:py-3 rounded-full border border-white/10 backdrop-blur-md lg:text-base">
                                    <span className="text-xs lg:text-sm font-bold uppercase tracking-widest">Start Lesson 1 (Free)</span>
                                    <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 transition-transform" />
                                </div>

                            </div>
                        </TouchableCard>
                    </motion.div>
                </div>

                {/* --- THE ELEGANT SECTION DIVIDER --- */}
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
                    className="w-full flex items-center justify-center mb-8 sm:mb-10 relative z-10"
                >
                    <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#5C4A3D]/20 dark:via-[#c6a87c]/20 to-transparent" />

                    <div className="relative px-6 py-2 bg-[#FDFBF7]/80 dark:bg-[#151518]/80 backdrop-blur-md border border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 rounded-full flex items-center gap-2 shadow-sm">
                        <LibraryIcon className="w-3.5 h-3.5 text-[#5C4A3D]/60 dark:text-[#c6a87c]/70" />
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#5C4A3D]/80 dark:text-[#FAFAFA]/70">
                            The Core Collections
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full"
                >
                    {[
                        { id: 'quran', title: "Quran", icon: <BookOpen />, telemetry: "Divine Revelation", action: () => setActiveTab('quran') },
                        { id: 'duas', title: "Duas", icon: <Moon />, telemetry: "Sacred Supplications", action: () => setActiveTab('duas') },
                        { id: 'ziyarats', title: "Ziyarats", icon: <Sparkles />, telemetry: "Holy Visitations", action: () => setActiveTab('ziyarats') },
                        { id: 'library', title: "Scholarly Library", icon: <LibraryIcon />, telemetry: "Lectures & Commentary", action: () => setActiveTab('library') },
                        { id: 'hadith', title: "Hadith Library", icon: <Book />, telemetry: "14,500+ Narrations", action: () => setActiveTab('hadith') }
                    ].map((pillar) => (
                        <TouchableCard
                            key={pillar.id}
                            onClick={pillar.action}
                            shouldReduceMotion={shouldReduceMotion}
                            className="flex flex-col xl:flex-row items-center xl:items-start text-center xl:text-left gap-3 xl:gap-4 p-4 sm:p-5 rounded-2xl bg-[#FDFBF7]/60 dark:bg-[#151518]/60 backdrop-blur-md border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 hover:border-[#c6a87c]/50 hover:shadow-lg dark:hover:shadow-[0_5px_20px_rgba(198,168,124,0.1)] transition-colors group rounded-[inherit] h-full"
                        >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#c6a87c]/10 text-[#c6a87c] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                {React.cloneElement(pillar.icon, { className: 'w-4 h-4 sm:w-5 sm:h-5' })}
                            </div>
                            <div className="flex flex-col gap-1 xl:gap-0.5 justify-center mt-1 xl:mt-0">
                                <h3 className="font-serif text-sm sm:text-base text-[#2D241C] dark:text-[#FAFAFA] font-medium leading-tight">{pillar.title}</h3>
                                <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#5C4A3D]/60 dark:text-[#c6a87c]/60 transition-colors leading-tight">{pillar.telemetry}</p>
                            </div>
                        </TouchableCard>
                    ))}
                </motion.div>

            </div>
        </div>
    );
}