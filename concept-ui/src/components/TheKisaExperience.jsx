import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import { BookOpen, Layers, Play, CheckCircle2, Quote, Shield, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';

// --- THE 3D CARD COMPONENTS ---
// Hardcoded backface-visibility into styles to prevent Tailwind config crashes
const CardFace = ({ isBack, children }) => (
    <div
        className={`absolute inset-0 w-full h-full bg-[#FDFBF7]/95 dark:bg-[#1A1A1E]/95 backdrop-blur-xl border border-[#5C4A3D]/10 dark:border-white/5 shadow-xl rounded-[2rem] p-6 md:p-8 flex flex-col justify-center items-center text-center ${isBack ? '[transform:rotateY(180deg)]' : ''}`}
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
        {children}
    </div>
);

const TactileCard = ({ layoutId, onClick, rotateY = 0, frontContent, backContent }) => (
    <motion.div
        layoutId={layoutId}
        onClick={onClick}
        animate={{ rotateY }}
        transition={{ type: "spring", stiffness: 60, damping: 16, mass: 0.8 }}
        className="relative w-full md:w-[300px] h-[180px] md:h-[400px] cursor-pointer group shrink-0"
        style={{ transformStyle: "preserve-3d" }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
    >
        <CardFace isBack={false}>{frontContent}</CardFace>
        <CardFace isBack={true}>{backContent}</CardFace>
    </motion.div>
);

// --- MAIN WIDGET ---
const TheKisaExperience = ({ setActiveTab, setTranscriptTarget }) => {
    // State Machine: 0 (Cover), 1 (Search), 2 (Tafsir), 3 (Sanctuary), 4 (Climax)
    const [step, setStep] = useState(0);
    const shouldReduceMotion = useReducedMotion();

    const handleNext = () => setStep(s => Math.min(s + 1, 4));

    // --- ACCESSIBILITY FALLBACK ---
    if (shouldReduceMotion) {
        return (
            <div className="w-full bg-[#050505] py-24 px-6 flex flex-col items-center text-center space-y-24 border-t border-[#c6a87c]/10 mt-10 rounded-3xl">
                <div className="max-w-2xl space-y-6">
                    <h2 className="text-3xl font-serif text-white">Find your meaning.</h2>
                    <p className="text-[#c6a87c]">Kisa understands your intent—connecting you instantly to the intimate words of the Ahl al-Bayt.</p>
                </div>
                <div className="w-full max-w-2xl flex flex-col items-center">
                    <h2 className="text-4xl font-serif text-white mb-6">Know Your Imam.</h2>
                    <button onClick={() => { setActiveTab('library'); setTranscriptTarget('know-your-imam-ep1'); }} className="px-8 py-4 bg-[#c6a87c] text-black font-bold uppercase tracking-widest rounded-full">Begin Lesson 1</button>
                </div>
            </div>
        );
    }

    // Dynamic Top Narrative Text
    const narratives = {
        0: "The Kisa Ecosystem",
        1: "1. The Semantic Engine",
        2: "2. The Unbroken Chain",
        3: "3. Your Theological Fortress",
        4: ""
    };

    return (
        <div className="relative w-full min-h-[85vh] md:min-h-[700px] flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#151518] border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 mt-10 py-12 overflow-hidden perspective-[1200px]">

            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,168,124,0.05)_0%,transparent_70%)] pointer-events-none" />

            {/* Dynamic Header */}
            <AnimatePresence mode="wait">
                {step < 4 && (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-10 md:top-20 z-20 text-center"
                    >
                        <span className="text-[#c6a87c] font-bold uppercase tracking-[0.25em] text-xs md:text-sm">
                            {narratives[step]}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- THE MORPHOLOGICAL UI DESK --- */}
            <LayoutGroup>
                <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 perspective-[1200px]">

                    {/* PHASE 1, 2, 3: LEFT CARD */}
                    <AnimatePresence>
                        {step >= 1 && step < 4 && (
                            <TactileCard
                                layoutId="card-left"
                                rotateY={step === 3 ? 180 : 0}
                                onClick={handleNext}
                                frontContent={
                                    step === 1 ? (
                                        <>
                                            <h3 className="text-3xl md:text-4xl font-serif text-[#c6a87c] italic mb-6 drop-shadow-sm">Wilayah</h3>
                                            <p className="font-mono text-sm text-[#5C4A3D]/40 dark:text-white/30 line-through mb-2">Al-Wilaya</p>
                                            <p className="font-mono text-sm text-[#5C4A3D]/40 dark:text-white/30 line-through">Imamat</p>
                                        </>
                                    ) : (
                                        <>
                                            <Quote className="text-[#c6a87c] w-8 h-8 md:w-10 md:h-10 mb-4 md:mb-6" />
                                            <h3 className="text-xl md:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2 md:mb-3">al-Kafi & Basair</h3>
                                            <p className="text-xs md:text-sm text-[#5C4A3D]/70 dark:text-white/50">The foundational traditions.</p>
                                        </>
                                    )
                                }
                                backContent={
                                    <>
                                        <Layers className="text-[#c6a87c] w-8 h-8 md:w-10 md:h-10 mb-4 md:mb-6" />
                                        <h3 className="text-xl md:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2 md:mb-3">The Vault</h3>
                                        <p className="text-xs md:text-sm text-[#5C4A3D]/70 dark:text-white/50">Save and highlight truths.</p>
                                    </>
                                }
                            />
                        )}
                    </AnimatePresence>

                    {/* PHASE 0, 1, 2, 3: CENTER CARD (The Anchor) */}
                    <AnimatePresence>
                        {step < 4 && (
                            <TactileCard
                                layoutId="card-center"
                                rotateY={step === 3 ? 180 : 0}
                                onClick={handleNext}
                                frontContent={
                                    step === 0 ? (
                                        <>
                                            <div className="w-16 h-16 bg-[#c6a87c]/10 rounded-full flex items-center justify-center mb-6 md:mb-8 border border-[#c6a87c]/30 shadow-inner">
                                                <Sparkles className="text-[#c6a87c] w-8 h-8" />
                                            </div>
                                            <h2 className="text-2xl md:text-4xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-3">The Sealed Text</h2>
                                            <p className="text-[#5C4A3D]/70 dark:text-white/50 text-sm md:text-base font-sans">Tap to unseal the architecture.</p>
                                        </>
                                    ) : step === 1 ? (
                                        <>
                                            <h2 className="text-2xl md:text-3xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-4">Find your meaning.</h2>
                                            <p className="text-[#5C4A3D]/80 dark:text-slate-300 text-sm md:text-base leading-relaxed px-2">
                                                Leave the noise behind. Kisa understands your intent—connecting you instantly to the intimate words of the Ahl al-Bayt.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="text-[#c6a87c] w-8 h-8 md:w-10 md:h-10 mb-4 md:mb-6" />
                                            <h3 className="text-xl md:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2 md:mb-3">The Quran</h3>
                                            <p className="text-xs md:text-sm text-[#5C4A3D]/70 dark:text-white/50">The Divine Revelation.</p>
                                        </>
                                    )
                                }
                                backContent={
                                    <>
                                        <CheckCircle2 className="text-[#c6a87c] w-8 h-8 md:w-10 md:h-10 mb-4 md:mb-6" />
                                        <h3 className="text-xl md:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2 md:mb-3">Active Mastery</h3>
                                        <p className="text-xs md:text-sm text-[#5C4A3D]/70 dark:text-white/50">Quizzes and tested retention.</p>
                                    </>
                                }
                            />
                        )}
                    </AnimatePresence>

                    {/* PHASE 2, 3: RIGHT CARD */}
                    <AnimatePresence>
                        {step >= 2 && step < 4 && (
                            <TactileCard
                                layoutId="card-right"
                                rotateY={step === 3 ? 180 : 0}
                                onClick={handleNext}
                                frontContent={
                                    <>
                                        <Shield className="text-[#c6a87c] w-8 h-8 md:w-10 md:h-10 mb-4 md:mb-6" />
                                        <h3 className="text-xl md:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2 md:mb-3">Commentary</h3>
                                        <p className="text-xs md:text-sm text-[#5C4A3D]/70 dark:text-white/50">Translated Arabic scholarship.</p>
                                    </>
                                }
                                backContent={
                                    <>
                                        <Sparkles className="text-[#c6a87c] w-8 h-8 md:w-10 md:h-10 mb-4 md:mb-6" />
                                        <h3 className="text-xl md:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2 md:mb-3">The Tone</h3>
                                        <p className="text-xs md:text-sm text-[#5C4A3D]/70 dark:text-white/50">Think and defend with confidence.</p>
                                    </>
                                }
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* --- PHASE 4: THE CLIMAX (Shared Element Morph) --- */}
                {/* The center card physically expands to swallow the entire screen */}
                <AnimatePresence>
                    {step === 4 && (
                        <motion.div
                            layoutId="card-center"
                            className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-6 text-center rounded-none md:rounded-[2rem]"
                        >
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-5xl md:text-7xl lg:text-[6rem] font-serif text-[#FAFAFA] tracking-tighter leading-none mb-8 drop-shadow-2xl"
                            >
                                Know Your Imam.
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-white/60 text-lg md:text-2xl font-sans font-light max-w-2xl leading-relaxed mb-12"
                            >
                                The engine is ready. The arsenal is yours. But tools without a Guide lead only to wandering. Step entirely out of doubt and become a truly educated, unshakable Shia Muslim.
                            </motion.p>

                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8, type: "spring" }}
                                onClick={() => { setActiveTab('library'); setTranscriptTarget('know-your-imam-ep1'); }}
                                className="relative flex flex-col items-center group cursor-pointer border-none bg-transparent"
                            >
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-[#c6a87c]/50 bg-[#c6a87c]/10 flex items-center justify-center group-hover:bg-[#c6a87c]/20 group-hover:border-[#c6a87c] group-hover:scale-105 transition-all duration-500 shadow-[0_0_40px_rgba(198,168,124,0.15)]">
                                    <Play className="w-8 h-8 md:w-10 md:h-10 fill-[#c6a87c] text-[#c6a87c] translate-x-1" />
                                </div>
                                <span className="absolute top-32 text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-[#c6a87c] group-hover:text-white transition-colors duration-300 whitespace-nowrap">
                                    Master the Faith
                                </span>
                            </motion.button>

                            <button
                                onClick={() => setStep(0)}
                                className="absolute bottom-8 text-white/30 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-bold bg-transparent border-none cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset Architecture
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </LayoutGroup>

            {/* Dynamic Instructional Footer */}
            <AnimatePresence mode="wait">
                {step < 4 && (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-6 md:bottom-10 z-20 flex items-center gap-2 text-[#5C4A3D]/60 dark:text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]"
                    >
                        {step === 0 && "Tap to begin"}
                        {step === 1 && "Tap to reveal the chain"}
                        {step === 2 && "Tap to flip the ecosystem"}
                        {step === 3 && "Tap to find your Guide"}
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 animate-[bounce_2s_infinite_horizontal]" />
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default TheKisaExperience;