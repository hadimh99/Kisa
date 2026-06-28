import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Sparkles, HelpCircle } from 'lucide-react';

// Main menu (mobile curtain / desktop dropdown) extracted from App.jsx (markup
// unchanged). onClose replaces the inline setShowMobileNav(false); onShowUpdates
// / onShowInfo carry the original open-modal-and-close-nav behaviour.
export default function MobileNav({
  open,
  onClose,
  theme,
  setTheme,
  setActiveTab,
  themeBg,
  themeBorder,
  onShowUpdates,
  onShowInfo,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-nav"
          exit={{ opacity: 1, transition: { duration: 0.5 } }} // Forces wrapper to stay alive on exit
          className="fixed left-0 right-0 bottom-0 top-12 sm:top-12 sm:bottom-auto sm:left-auto sm:right-0 sm:w-[320px] z-[490] pointer-events-none overflow-hidden sm:overflow-visible flex flex-col"
        >
          <motion.div
            initial={{ y: "-100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full h-full sm:h-auto overflow-y-auto px-6 py-8 flex flex-col gap-8 relative pointer-events-auto ${themeBg} sm:border sm:${themeBorder} sm:shadow-2xl sm:rounded-2xl`}
          >
            {/* Primary Navigation */}
            <div className="flex flex-col gap-6 md:hidden">
              {[
                { label: "Quran", tab: "quran" },
                { label: "Duas", tab: "duas" },
                { label: "Ziyarats", tab: "ziyarats" },
                { label: "Hadith Library", tab: "hadith" },
                { label: "Academy", tab: "library" }
              ].map((nav, idx) => (
                <button key={idx} onClick={() => { setActiveTab(nav.tab); onClose(); }} className="text-left text-3xl font-serif font-semibold tracking-tight text-[#2D241C] dark:text-[#FAFAFA] active:text-[#c6a87c] transition-colors">
                  {nav.label}
                </button>
              ))}
            </div>


            {/* Divider */}
            <div className="h-px w-full border-b border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 my-2 md:hidden" />

            {/* Utility Navigation */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-[#5C4A3D] dark:text-[#c6a87c] font-medium text-lg flex items-center gap-4">
                  {theme === 'dark' ? <Moon className="w-6 h-6 shrink-0" /> : <Sun className="w-6 h-6 shrink-0" />} Theme
                </span>
                <div className="flex items-center gap-4">
                  <button onClick={() => { setTheme('light'); onClose(); }} className={`w-8 h-8 rounded-full bg-[#F5F5F7] border shadow-sm transition-all cursor-pointer ${theme === 'light' ? 'border-[#1D1D1F] scale-110' : 'border-slate-300'}`} title="Light Mode" />
                  <button onClick={() => { setTheme('sepia'); onClose(); }} className={`w-8 h-8 rounded-full bg-[#FDFBF7] border shadow-sm transition-all cursor-pointer ${theme === 'sepia' ? 'border-[#c6a87c] scale-110' : 'border-[#EAE4D3]'}`} title="Sepia Mode" />
                  <button onClick={() => { setTheme('dark'); onClose(); }} className={`w-8 h-8 rounded-full bg-black border shadow-sm transition-all cursor-pointer ${theme === 'dark' ? 'border-[#F5F5F7] scale-110' : 'border-zinc-800'}`} title="Dark Mode" />
                </div>
              </div>

              <button onClick={onShowUpdates} className="flex items-center gap-4 text-left text-[#5C4A3D] dark:text-[#c6a87c] text-lg font-medium active:text-[#2D241C] dark:active:text-[#FAFAFA] transition-colors">
                <Sparkles className="w-6 h-6 shrink-0" /> Updates Log
              </button>
              <button onClick={onShowInfo} className="flex items-center gap-4 text-left text-[#5C4A3D] dark:text-[#c6a87c] text-lg font-medium active:text-[#2D241C] dark:active:text-[#FAFAFA] transition-colors">
                <HelpCircle className="w-6 h-6 shrink-0" /> Help & Guide
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
