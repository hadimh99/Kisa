import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// The verse popup (shown when a (surah:ayah) reference is clicked), extracted
// from App.jsx. Self-contained state, so it takes props rather than context.
// Markup unchanged from inline.
export default function QuranPopup({ popup, onClose, activeFontFamily }) {
  return (
    <AnimatePresence>
      {popup && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[3001] overflow-hidden">
            <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-6 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shrink-0">
              <div><h3 className="font-mono text-sm tracking-widest uppercase text-[#2D241C] dark:text-[#FAFAFA] font-bold mb-0.5">Surah {popup.data.surahName}</h3><p className="text-xs text-[#5C4A3D]/60 dark:text-[#c6a87c]/60 font-mono m-0">Verse {popup.ayah}</p></div>
              <button onClick={onClose} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto flex-grow smart-scrollbar">
              <div className="mb-6"><p className="font-arabic text-3xl sm:text-4xl text-right leading-[2.2] text-[#2D241C] dark:text-slate-100" dir="rtl" lang="ar" style={{ fontFamily: activeFontFamily, fontVariantLigatures: 'normal', fontFeatureSettings: '"ccmp" 1, "mark" 1, "mkmk" 1' }}>{popup.data.ar}</p></div>
              <div className="border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 pt-6"><p className="text-base sm:text-lg text-[#5C4A3D] dark:text-[#c6a87c] leading-relaxed font-serif">{popup.data.en}</p></div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
