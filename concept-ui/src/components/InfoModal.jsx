import { motion, AnimatePresence } from 'framer-motion';
import { X, Library as LibraryIcon, Search, LibraryBig, Sparkles, Layout, BookOpen, Clock } from 'lucide-react';
import { KisaLogo } from './Icons';

// "How to Use Al-Kisa" help modal extracted from App.jsx (markup unchanged; the
// inline setShowInfo(false) calls are now the onClose prop).
export default function InfoModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[2001]">
            <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-5 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 rounded-t-2xl shrink-0"><h2 className="text-lg sm:text-xl font-mono font-bold tracking-tight text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-2"><KisaLogo className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" />How to Use Al-Kisa</h2><button onClick={onClose} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button></div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-grow smart-scrollbar flex flex-col gap-6 text-[#5C4A3D] dark:text-[#c6a87c]">
              <div>
                <h3 className="font-bold text-base sm:text-lg mb-2 text-[#2D241C] dark:text-[#FAFAFA]">Welcome to Al-Kisa</h3>
                <p className="leading-relaxed text-xs sm:text-sm">Al-Kisa is a semantic search engine designed specifically to explore authentic Twelver Shia literature, prioritizing core texts like <i>al-Kafi</i>, <i>Bihar al-Anwar</i>, and <i>Basa'ir al-Darajat</i>. It maps verified texts mathematically so you can explore concepts without AI hallucinations.</p>
              </div>
              <hr className="border-[#5C4A3D]/10 dark:border-[#c6a87c]/10" />

              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3 text-[#2D241C] dark:text-[#FAFAFA]"><LibraryIcon className="w-4 h-4 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Features</h3>
                <div className="mb-4">
                  <h4 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 mb-1"><Search className="w-3.5 h-3.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Dual Search Engine</h4>
                  <ul className="flex flex-col gap-2 text-xs sm:text-sm pl-5 list-disc mb-2">
                    <li><b>Concept Mode:</b> Uses AI vector math to find underlying themes, even if exact words aren't used. Returns interactive thematic clusters.</li>
                    <li><b>Keyword Mode:</b> Strictly searches the exact English or Arabic text you type, functioning like a traditional database index.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 mb-1"><LibraryBig className="w-3.5 h-3.5 text-[#c6a87c]" /> Digital Archive (Transcript Library)</h4>
                  <p className="leading-relaxed text-xs sm:text-sm mb-2">Read meticulously structured and translated transcripts of foundational scholarly series (e.g., The File of Fatima). Features a premium editorial UI with automatic section summaries, bold emphasis, and a persistent reading state.</p>
                </div>
              </div>
              <hr className="border-[#5C4A3D]/10 dark:border-[#c6a87c]/10" />

              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3 text-[#2D241C] dark:text-[#FAFAFA]"><Sparkles className="w-4 h-4 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Advanced Features</h3>
                <ul className="flex flex-col gap-4 text-xs sm:text-sm leading-relaxed">
                  <li>
                    <b className="text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-1.5 mb-0.5"><Layout className="w-3.5 h-3.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Dynamic Concept Map</b>
                    Concept searches generate a beautiful, non-overlapping orbital map of themes. The "Top Matches" node is highlighted, and you can switch to a traditional List View at any time.
                  </li>
                  <li>
                    <b className="text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-1.5 mb-0.5"><Sparkles className="w-3.5 h-3.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Vector Hopping ("Find Similar")</b>
                    Click "Find Similar" on any hadith to use its mathematical signature to instantly discover related narrations. The original source is cleanly pinned to the top as an "Anchor" so you never lose your place.
                  </li>
                  <li>
                    <b className="text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-1.5 mb-0.5"><BookOpen className="w-3.5 h-3.5 text-amber-500" /> Reverse Quran Tafsir</b>
                    Read all 114 Surahs. If Al-Kisa detects narrations referencing a specific Ayah, a "Related Hadiths" button appears. Click it to open a seamless popup of contextual narrations.
                  </li>
                </ul>
              </div>
              <hr className="border-[#5C4A3D]/10 dark:border-[#c6a87c]/10" />

              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3 text-[#2D241C] dark:text-[#FAFAFA]"><Clock className="w-4 h-4 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Workflow & Study Tools</h3>
                <ul className="flex flex-col gap-3 text-xs sm:text-sm leading-relaxed list-disc pl-4">
                  <li><b className="text-[#2D241C] dark:text-[#FAFAFA]">Study History & Quick Resume:</b> Click the empty search bar to instantly resume your 5 most recent searches/recitations, or click the Clock icon to open your full History drawer.</li>
                  <li><b className="text-[#2D241C] dark:text-[#FAFAFA]">Source Filtering:</b> Use the Source dropdown to isolate searches strictly to specific books like <i>al-Kafi</i>.</li>
                  <li><b className="text-[#2D241C] dark:text-[#FAFAFA]">Smart Copy:</b> Click "Copy Text" on any Hadith or Anchored Source to instantly copy the full reference, Arabic text, Chain of Narrators, English translation, and a Kisa link to your clipboard.</li>
                </ul>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
