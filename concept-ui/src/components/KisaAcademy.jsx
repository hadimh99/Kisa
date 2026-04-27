// src/components/KisaAcademy.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlaySquare, ChevronLeft, Sparkles } from 'lucide-react';
import TranscriptLibrary from './TranscriptLibrary';
import CourseLibrary from './CourseLibrary';

const KisaAcademy = (props) => {
    const { externalDocTarget } = props;

    // State to track which section the user is currently viewing
    // 'hub' = the main landing page, 'archive' = Transcripts, 'courses' = Videos
    const [activeSection, setActiveSection] = useState('hub');

    // Auto-switch to archive when a transcript is requested from global routing
    useEffect(() => {
        if (externalDocTarget) {
            setActiveSection('archive');
        }
    }, [externalDocTarget]);

    // This intercepts the "Back" button clicks from inside the libraries
    const handleReturnToHub = () => {
        setActiveSection('hub');
    };

    if (activeSection === 'archive') {
        return (
            <div className="w-full flex flex-col kisa-academy-wrapper">
                <style>{`
                    /* CSS MAGIC: Hides the "Academy Hub" button when reading an individual transcript to prevent double back-buttons */
                    .kisa-academy-wrapper:has(#transcript-print-zone) .academy-back-wrapper {
                        display: none;
                    }
                    /* Adjusts the massive top padding of the transcript library home screen so it sits perfectly under our new button */
                    .kisa-academy-wrapper:not(:has(#transcript-print-zone)) .library-container > div {
                        padding-top: 1.5rem !important;
                    }
                    @media (min-width: 640px) {
                        .kisa-academy-wrapper:not(:has(#transcript-print-zone)) .library-container > div {
                            padding-top: 2rem !important;
                        }
                    }
                `}</style>

                {/* Native document flow ensures it NEVER overlaps the text below it */}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-2 flex justify-start academy-back-wrapper">
                    <button
                        onClick={handleReturnToHub}
                        className="flex items-center gap-2 text-zinc-500 hover:text-[#c6a87c] transition-colors text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#1c1c1e] px-4 py-2 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" /> Academy Hub
                    </button>
                </div>

                <div className="library-container w-full">
                    <TranscriptLibrary {...props} />
                </div>
            </div>
        );
    }

    if (activeSection === 'courses') {
        return (
            <div className="w-full flex flex-col">
                {/* FIXED: Added 'relative z-10' here to pull the button ABOVE the negative margin overlap below */}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-0 flex justify-start relative z-10">
                    <button
                        onClick={handleReturnToHub}
                        className="flex items-center gap-2 text-zinc-500 hover:text-[#c6a87c] transition-colors text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#1c1c1e] px-4 py-2 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" /> Academy Hub
                    </button>
                </div>
                {/* Pulls the placeholder content up to balance the spacing, placed beneath the button in z-index */}
                <div className="-mt-12 sm:-mt-16 relative z-0">
                    <CourseLibrary />
                </div>
            </div>
        );
    }

    // --- THE MASTERCLASS BENTO GRID HUB ---
    return (
        <div className="w-full min-h-screen pt-32 pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col pointer-events-auto">
            <div className="mb-12 text-center sm:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
                    Kisa Academy
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg sm:text-xl max-w-2xl font-sans">
                    A dedicated workspace for structured learning, featuring foundational video courses and a comprehensive digital archive of translated scholarly lectures.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
                {/* Route 1: Scholarly Library (Transcripts) */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection('archive')}
                    className="bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-[#c6a87c]/50 transition-all duration-300 cursor-pointer flex flex-col items-start group min-h-[320px] justify-between relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#c6a87c] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />

                    <div>
                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center border border-zinc-100 dark:border-zinc-700 mb-6 group-hover:bg-[#c6a87c]/10 transition-colors">
                            <BookOpen className="w-7 h-7 text-zinc-700 dark:text-zinc-300 group-hover:text-[#c6a87c] transition-colors" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 dark:text-white mb-3">Scholarly Library</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
                            Dive deep into 50+ hours of fully translated text transcripts. Features active recall modules, NotebookLM quizzes, and PDF exports.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-8 text-[10px] font-bold uppercase tracking-widest text-[#c6a87c]">
                        Enter Archive <ChevronLeft className="w-4 h-4 rotate-180" />
                    </div>
                </motion.div>

                {/* Route 2: Courses (Videos) */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection('courses')}
                    className="bg-zinc-900 dark:bg-[#151518] border border-zinc-800 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-lg hover:shadow-2xl hover:border-[#c6a87c]/50 transition-all duration-300 cursor-pointer flex flex-col items-start group min-h-[320px] justify-between relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#c6a87c] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />

                    <div>
                        <div className="flex items-center justify-between w-full mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 dark:bg-[#1c1c1e] flex items-center justify-center border border-zinc-700 dark:border-zinc-800 group-hover:bg-[#c6a87c]/10 transition-colors">
                                <PlaySquare className="w-7 h-7 text-white dark:text-zinc-300 group-hover:text-[#c6a87c] transition-colors ml-0.5" />
                            </div>
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                                <Sparkles className="w-3 h-3" /> New
                            </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">Structured Courses</h2>
                        <p className="text-zinc-400 font-sans leading-relaxed">
                            Original, long-form theological video lectures recorded exclusively for Al-Kisa.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-8 text-[10px] font-bold uppercase tracking-widest text-[#c6a87c]">
                        View Courses <ChevronLeft className="w-4 h-4 rotate-180" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default KisaAcademy;
