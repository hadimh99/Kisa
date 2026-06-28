import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Copy } from 'lucide-react';
import { useSearchContext } from '../contexts/SearchContext';

// The "Anchored Source" popup (map view → View Source on a Find-Similar search),
// extracted from App.jsx. State comes from SearchContext; activeFontFamily (font
// domain) is a prop. Markup unchanged from inline.
export default function AnchorModal({ activeFontFamily }) {
  const {
    showAnchorModal,
    setShowAnchorModal,
    anchorHadith,
    anchorCopied,
    setAnchorCopied,
    handleCopyHadith,
  } = useSearchContext();

  return (
    <AnimatePresence>
      {showAnchorModal && anchorHadith && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAnchorModal(false)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[5001] overflow-hidden">
            <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-6 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shrink-0">
              <div>
                <h3 className="font-mono text-sm tracking-widest uppercase text-[#2D241C] dark:text-[#FAFAFA] font-bold mb-0.5 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#c6a87c]" /> Anchored Source</h3>
                <p className="text-[10px] sm:text-xs text-[#5C4A3D]/60 dark:text-[#c6a87c]/60 font-mono m-0 leading-relaxed pr-4">
                  {anchorHadith.full_reference || `Book: ${anchorHadith.book}, Vol: ${anchorHadith.volume}, ${anchorHadith.sub_book}, Chapter: ${anchorHadith.chapter}`}
                </p>
              </div>
              <button onClick={() => setShowAnchorModal(false)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0 self-start"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto flex-grow smart-scrollbar">
              {anchorHadith.arabic_text && <div className="mb-6"><p className="font-arabic text-3xl sm:text-4xl text-right leading-[2.2] text-[#2D241C] dark:text-slate-100" dir="rtl" lang="ar" style={{ fontFamily: activeFontFamily, fontVariantLigatures: 'normal', fontFeatureSettings: '"ccmp" 1, "mark" 1, "mkmk" 1' }}>{anchorHadith.arabic_text}</p></div>}
              <div className={anchorHadith.arabic_text ? "border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 pt-6" : ""}><p className="text-base sm:text-lg text-[#5C4A3D] dark:text-[#c6a87c] leading-relaxed font-serif">{anchorHadith.english_text}</p></div>
              <div className="mt-6 flex justify-end pt-4 border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20">
                <button onClick={(e) => {
                  e.stopPropagation();
                  handleCopyHadith(anchorHadith);
                  setAnchorCopied(true);
                  setTimeout(() => setAnchorCopied(false), 2000);
                }} className={`flex items-center gap-2 text-xs font-mono transition-colors px-4 py-2 rounded-md cursor-pointer ${anchorCopied ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-[#5C4A3D] hover:text-[#2D241C] hover:bg-[#FDFBF7] dark:bg-[#c6a87c]/10 dark:hover:bg-[#c6a87c]/20 dark:text-[#c6a87c] dark:hover:text-[#FAFAFA]'}`}>
                  {anchorCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}<span>{anchorCopied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
