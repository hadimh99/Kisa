// src/components/CourseLibrary.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { PlaySquare, Sparkles, BookOpen } from 'lucide-react';

const CourseLibrary = () => {
    return (
        <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl w-full flex flex-col items-center text-center"
            >
                {/* Iconography */}
                <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-[#1c1c1e] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 rounded-full bg-[#c6a87c]/10 animate-pulse" />
                    <PlaySquare className="w-8 h-8 text-[#c6a87c] relative z-10 ml-1" />
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
                    Structured Courses
                </h1>

                {/* Coming Soon Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-[#c6a87c]/10 border border-amber-200 dark:border-[#c6a87c]/30 mb-8">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-[#c6a87c]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-[#d4b78f]">
                        Coming Soon
                    </span>
                </div>

                <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-12 max-w-lg font-sans">
                    We are currently recording exclusive, long-form educational series. Check back soon for structured theological video courses.
                </p>

                {/* Divider */}
                <div className="w-24 h-[1.5px] bg-zinc-200 dark:bg-zinc-800 mb-12" />

                {/* Hadith Block */}
                <div className="bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#c6a87c]" />

                    <div className="flex flex-col items-center text-center">
                        <BookOpen className="w-5 h-5 text-zinc-300 dark:text-zinc-700 mb-4 group-hover:text-[#c6a87c] transition-colors" />

                        <p className="text-lg sm:text-xl font-serif italic text-zinc-800 dark:text-zinc-200 leading-relaxed mb-6">
                            "Seek knowledge and adorn it with forbearance and dignity. Be humble to those whom you teach and to those from whom you learn."
                        </p>

                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                                Imam Ja'far al-Sadiq (a.s.)
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1">
                                Al-Kafi, Vol. 1, Book 2, Hadith 4
                            </span>
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default CourseLibrary;
