import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CalendarDays } from 'lucide-react';
import { APP_UPDATES } from '../constants';

// Updates Log modal extracted from App.jsx (markup unchanged; the inline
// setShowUpdates(false) calls are now the onClose prop).
export default function UpdatesModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#2D241C]/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#FDFBF7] dark:bg-[#151518] border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[80vh] flex flex-col shadow-2xl rounded-[2rem] z-[2001] overflow-hidden">

            <div className="flex justify-between items-center bg-[#FDFBF7]/95 dark:bg-[#1c1c20]/95 backdrop-blur-xl pt-6 pb-5 px-6 sm:px-8 z-10 border-b border-[#5C4A3D]/10 dark:border-[#c6a87c]/10 shrink-0">
              <h2 className="text-xl sm:text-2xl font-serif tracking-tight text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#c6a87c]" />
                Updates Log
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-[#5C4A3D]/5 dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0">
                <X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-grow smart-scrollbar flex flex-col gap-8">

              {/* --- PERMANENT PLATFORM SCHEDULE NOTICE --- */}
              <div className="p-5 rounded-2xl bg-[#c6a87c]/10 border border-[#c6a87c]/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#c6a87c]/20 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-[#c6a87c]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2D241C] dark:text-[#FAFAFA] text-base mb-1 tracking-tight">The Sunday Drop</h3>
                  <p className="text-sm text-[#5C4A3D]/90 dark:text-slate-300 leading-relaxed font-serif">
                    Al-Kisa is a living library. We unlock new dimensions of the platform <strong className="text-[#c6a87c] font-bold">every Sunday</strong>—from fresh masterclass episodes and newly mapped Hadith volumes, to sacred liturgies and interactive study tools.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#5C4A3D]/10 dark:via-[#c6a87c]/20 to-transparent" />

              {APP_UPDATES.map((update, idx) => (
                <div key={idx} className="relative pl-6 sm:pl-8 border-l-[1.5px] border-[#5C4A3D]/15 dark:border-[#c6a87c]/20">

                  {/* The Premium Timeline Dot */}
                  <div className="absolute -left-[4.5px] top-2 w-2 h-2 rounded-full bg-[#c6a87c] ring-4 ring-[#FDFBF7] dark:ring-[#151518]" />

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 gap-1 sm:gap-4">
                    <h3 className="font-sans font-bold text-lg sm:text-xl text-[#2D241C] dark:text-[#FAFAFA] tracking-tight">{update.version}</h3>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#5C4A3D]/50 dark:text-[#c6a87c]/60">{update.date}</span>
                  </div>

                  <ul className="flex flex-col gap-3">
                    {update.changes.map((change, cIdx) => (
                      <li key={cIdx} className="text-sm sm:text-base text-[#5C4A3D]/90 dark:text-slate-300 flex items-start gap-3 leading-relaxed font-serif">
                        <span className="text-[#c6a87c] mt-2 font-bold text-[10px]">✦</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>

                </div>
              ))}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
