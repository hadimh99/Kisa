import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Sparkles, Clock, PenTool } from 'lucide-react';
import DuaLibrary from './DuaLibrary';

export default function SpiritualHub({ children }) {
    const [activeTab, setActiveTab] = useState('quran');

    const tabs = [
        { id: 'quran', label: 'Quran' },
        { id: 'dua', label: 'Dua' },
        { id: 'ziyarat', label: 'Ziyarats' }
    ];

    return (
        <div className="w-full min-h-screen flex flex-col items-center relative pt-24">

            {/* --- REFINED LIST TOGGLE (ABSOLUTE POSITIONING SO IT SCROLLS AWAY) --- */}
            <div className="w-full px-4 sm:px-6 flex justify-center absolute top-2 sm:top-6 md:top-[38px] left-1/2 -translate-x-1/2 z-20 md:w-auto">
                <div className="flex items-center gap-1.5 md:gap-3 bg-[#FDFBF7]/80 dark:bg-[#0E0E11]/80 backdrop-blur-xl p-1 rounded-full border border-[#5C4A3D]/15 dark:border-zinc-800/80 shadow-sm md:h-[44px]">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-4 sm:px-6 py-2.5 sm:py-3 md:py-2 text-xs sm:text-sm md:text-xs font-bold tracking-widest uppercase rounded-full z-10 transition-colors duration-300 cursor-pointer ${isActive
                                        ? 'text-zinc-900 dark:text-[#FAFAFA]'
                                        : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-spiritual-tab-underline"
                                        className="absolute bottom-1 sm:bottom-1.5 md:bottom-1 left-4 sm:left-6 md:left-5 right-4 sm:right-6 md:right-5 h-px bg-[#c6a87c]"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- THE CONTENT AREA --- */}
            <div className="w-full flex-1 flex flex-col relative mt-2 md:mt-4">
                <AnimatePresence mode="wait">

                    {/* 1. QURAN TAB */}
                    {activeTab === 'quran' && (
                        <motion.div
                            key="quran"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            {children}
                        </motion.div>
                    )}

                    {/* 2. DUA TAB (NEW LIBRARY) */}
                    {activeTab === 'dua' && (
                        <motion.div
                            key="dua"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            {/* Note: Passed empty array for vaultItems as a placeholder for now */}
                            <DuaLibrary vaultItems={[]} />
                        </motion.div>
                    )}

                    {/* 3. ZIYARAT TAB (UNDER CONSTRUCTION) */}
                    {activeTab === 'ziyarat' && (
                        <motion.div
                            key="ziyarat-soon"
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}
                            className="w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center mt-12 sm:mt-16"
                        >
                            <div className="relative w-full overflow-hidden rounded-[2rem] bg-white/40 dark:bg-[#1A1A1A]/40 backdrop-blur-2xl border border-zinc-200 dark:border-[#c6a87c]/15 p-10 sm:p-16 flex flex-col items-center text-center shadow-xl">
                                <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#c6a87c]/10 blur-[80px] rounded-full pointer-events-none" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#c6a87c]/10 flex items-center justify-center mb-6 border border-[#c6a87c]/30 shadow-[0_0_30px_rgba(198,168,124,0.15)]">
                                        <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-[#c6a87c]" />
                                    </div>

                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#c6a87c]/10 text-zinc-500 dark:text-[#c6a87c] text-[10px] uppercase font-bold tracking-widest mb-4 border border-zinc-200 dark:border-[#c6a87c]/20">
                                        <PenTool className="w-3 h-3" /> Under Construction
                                    </span>

                                    <h2 className="text-3xl sm:text-4xl font-serif text-zinc-900 dark:text-[#FAFAFA] mb-4 tracking-tight">
                                        The Geography of Light
                                    </h2>

                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed font-sans mb-8">
                                        Our scholars and engineers are currently mathematically mapping the semantic links for the Ziyarat library. This module will integrate seamlessly with the foundational Hadith archives soon.
                                        <Sparkles className="inline-block w-4 h-4 ml-1.5 text-[#c6a87c]/60" />
                                    </p>

                                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs font-mono uppercase tracking-widest bg-zinc-100/50 dark:bg-black/20 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                                        <Clock className="w-4 h-4" /> Expected: Phase 2 Rollout
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}