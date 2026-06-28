import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Sparkles, Database, BookOpen, ChevronDown, Bookmark, Library as LibraryIcon, ChevronRight } from 'lucide-react';
import { AnimatedMenuIcon } from './Icons';
import { SOURCES } from '../constants';
import { useSearchContext } from '../contexts/SearchContext';

// The global search overlay (Apple curtain physics) extracted from App.jsx.
// All search state/handlers come from SearchContext; only themeBg (theme domain)
// is a prop. Markup is unchanged from the inline version.
export default function SearchOverlay({ themeBg }) {
  const {
    showSearchOverlay,
    setShowSearchOverlay,
    overlayMode,
    setOverlayMode,
    handleSearchSubmit,
    globalSearchRef,
    query,
    setQuery,
    searchMode,
    setSearchMode,
    setViewMode,
    showDropdown,
    setShowDropdown,
    sourceFilter,
    setSourceFilter,
    user,
    setActiveTab,
    executeSearch,
    setHadithTarget,
    setDuaTarget,
    setQuranTarget,
    setQuranVerseTarget,
    setTranscriptTarget,
  } = useSearchContext();

  const isKeyword = searchMode === 'keyword';

  return (
    <AnimatePresence>
      {showSearchOverlay && (
        <motion.div
          key="search-overlay"
          exit={{ opacity: 1, transition: { duration: 0.5 } }} // Forces wrapper to stay alive on exit
          className="fixed sm:inset-0 left-0 right-0 bottom-0 top-12 sm:top-0 z-[490] pointer-events-none overflow-hidden sm:overflow-auto flex flex-col"
        >
          {/* Desktop Only Close Button (Mobile naturally uses the global header master X) */}
          <div className="hidden sm:flex justify-end items-center h-14 px-6 lg:px-8 shrink-0 z-20 relative bg-inherit pointer-events-auto border-b border-transparent">
            <button onClick={() => setShowSearchOverlay(false)} className="w-7 h-7 flex items-center justify-center text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] cursor-pointer">
              <AnimatedMenuIcon isOpen={true} className="w-7 h-7" />
            </button>
          </div>

          <motion.div
            initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full h-full overflow-y-auto flex flex-col relative pointer-events-auto ${themeBg}`}
          >
            <div className="w-full max-w-3xl mx-auto px-6 pt-4 pb-6 sm:pt-2">

              {/* Dual-Mode Toggle */}
              <div className="flex justify-center mb-6">
                <div className="flex p-1 rounded-xl border bg-[#F8F5EE]/60 dark:bg-[#050505] border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shadow-sm w-full max-w-sm">
                  <button
                    onClick={() => setOverlayMode('global')}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${overlayMode === 'global' ? 'bg-[#FDFBF7] dark:bg-zinc-800 text-[#2D241C] dark:text-white shadow-sm' : 'text-[#5C4A3D]/60 dark:text-zinc-500 hover:text-[#5C4A3D] dark:hover:text-zinc-300'}`}
                  >
                    🌐 Platform Search
                  </button>
                  <button
                    onClick={() => setOverlayMode('advanced')}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${overlayMode === 'advanced' ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/10 text-[#2D241C] dark:text-[#c6a87c] shadow-sm border border-transparent dark:border-[#c6a87c]/20' : 'text-[#5C4A3D]/60 dark:text-zinc-500 hover:text-[#5C4A3D] dark:hover:text-zinc-300'}`}
                  >
                    🧠 Knowledge Graph
                  </button>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-0 w-6 h-6 sm:w-8 sm:h-8 text-[#5C4A3D]/80 dark:text-[#c6a87c]/80" strokeWidth={3} />
                <input
                  ref={globalSearchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={overlayMode === 'global' ? "Search the platform…" : "Deep search hadith…"}
                  className="w-full bg-transparent outline-none pl-12 sm:pl-14 pr-28 sm:pr-32 text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#2D241C] dark:text-[#FAFAFA] placeholder:text-[#5C4A3D]/80 dark:placeholder:text-[#c6a87c]/80 caret-[#c6a87c]"
                />
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 gap-1 sm:gap-2">
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="p-2 sm:p-3 text-[#5C4A3D]/40 dark:text-[#c6a87c]/40 hover:text-[#2D241C] dark:hover:text-[#FAFAFA] transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`p-2 sm:p-3 rounded-xl transition-all flex items-center justify-center ${query.trim() ? 'bg-[#c6a87c] text-[#1a1205] shadow-md hover:bg-[#d4b990] hover:scale-105 cursor-pointer' : 'bg-[#5C4A3D]/10 dark:bg-zinc-800/50 text-[#5C4A3D]/30 dark:text-zinc-600 cursor-not-allowed'}`}
                    disabled={!query.trim()}
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </form>

              {/* Spotlight Filters — Advanced Mode Only */}
              <AnimatePresence>
                {overlayMode === 'advanced' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
                      <div className="flex items-center rounded-lg p-1 border bg-[#F8F5EE]/60 dark:bg-[#020805]/60 border-[#5C4A3D]/15 dark:border-[#c6a87c]/10 shadow-inner w-full sm:w-auto">
                        <button type="button" onClick={() => { setSearchMode('concept'); setViewMode(window.innerWidth < 800 ? 'list' : 'map'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-1 sm:flex-none justify-center cursor-pointer ${!isKeyword ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/15 text-[#2D241C] dark:text-[#c6a87c] shadow-sm border border-[#5C4A3D]/15 dark:border-[#c6a87c]/30' : 'text-[#5C4A3D]/80 hover:text-[#2D241C] dark:text-[#c6a87c]/50 dark:hover:text-[#c6a87c] border border-transparent'}`}><Sparkles className="w-3.5 h-3.5 opacity-70" /> Concept</button>
                        <button type="button" onClick={() => { setSearchMode('keyword'); setViewMode('list'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-1 sm:flex-none justify-center cursor-pointer ${isKeyword ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/15 text-[#2D241C] dark:text-[#c6a87c] shadow-sm border border-[#5C4A3D]/15 dark:border-[#c6a87c]/30' : 'text-[#5C4A3D]/80 hover:text-[#2D241C] dark:text-[#c6a87c]/50 dark:hover:text-[#c6a87c] border border-transparent'}`}><Database className="w-3.5 h-3.5 opacity-70" /> Keyword</button>
                      </div>
                      <div className="relative flex items-center w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-[#5C4A3D]/80 dark:text-[#c6a87c]/70 mr-3 hidden sm:flex"><BookOpen className="w-4 h-4 opacity-70" /><span className="text-xs uppercase tracking-wider font-semibold">Source:</span></div>
                        <button type="button" onClick={() => setShowDropdown(!showDropdown)} className="flex items-center justify-between w-full sm:w-[220px] px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium border border-transparent cursor-pointer bg-[#F8F5EE]/60 dark:bg-[#020805]/60 text-[#2D241C] dark:text-[#c6a87c]/80 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 dark:hover:text-[#c6a87c] dark:hover:border-[#c6a87c]/20"><span className="truncate">{sourceFilter}</span><ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-2" /></button>
                        <AnimatePresence>
                          {showDropdown && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full mt-2 right-0 w-full sm:w-[220px] rounded-xl border shadow-xl overflow-hidden z-50 backdrop-blur-2xl bg-[#FDFBF7]/95 dark:bg-[#040F0B]/95 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20">
                              {(user ? ["All Twelver Sources", "My Vault", "al-Kafi", "Bihar al-Anwar", "Basa'ir al-Darajat"] : SOURCES).map((source) => (
                                <div key={source} onClick={() => { setSourceFilter(source); setShowDropdown(false); }} className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${sourceFilter === source ? 'bg-[#EAE4D3]/60 dark:bg-[#c6a87c]/15 text-[#2D241C] dark:text-[#FAFAFA] font-bold' : 'text-[#5C4A3D] dark:text-[#c6a87c]/80 hover:bg-[#F8F5EE] dark:hover:bg-[#c6a87c]/10 dark:hover:text-[#c6a87c]'}`}>
                                  {source === "My Vault" && <Bookmark className="w-3.5 h-3.5" />}
                                  {source}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full max-w-3xl mx-auto px-6 py-8 flex-grow">
              <h3 className="text-sm sm:text-base font-sans text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 mb-4">Quick Links</h3>
              <ul className="flex flex-col gap-1">
                {[
                  { label: "Search Hadiths for the concept of Bada", action: () => { setQuery('Bada'); setSearchMode('concept'); setActiveTab('search'); executeSearch('Bada', 'concept', sourceFilter, null, null, null, null); setShowSearchOverlay(false); } },

                  {
                    label: "Al-Kafi Volume 1 The Book of Intelligence and Ignorance", action: () => {
                      if (setHadithTarget) setHadithTarget({ book: "al-Kafi", volume: "1", category: "intell", chapter: "intell" });
                      setActiveTab('hadith');
                      setShowSearchOverlay(false);
                    }
                  },

                  {
                    label: "Dua Kumayl", action: () => {
                      if (setDuaTarget) setDuaTarget('Dua Kumayl');
                      setActiveTab('duas');
                      setShowSearchOverlay(false);
                    }
                  },

                  { label: "Quran verse 5:55", action: () => { setQuranTarget(5); setQuranVerseTarget(55); setActiveTab('quran'); setShowSearchOverlay(false); } },
                  { label: "Know Your Imam", action: () => { setTranscriptTarget('know-your-imam-ep1'); setActiveTab('library'); setShowSearchOverlay(false); } }
                ].map((link, idx) => (
                  <li key={idx}>
                    <button onClick={link.action} className="flex items-start gap-4 text-left w-full py-2.5 sm:py-3 transition-colors cursor-pointer group">
                      <span className="font-sans text-lg sm:text-xl text-[#2D241C]/70 dark:text-[#FAFAFA]/70 mt-[2px] sm:mt-[1px] group-hover:text-[#c6a87c] group-hover:translate-x-1 transition-all">→</span>
                      <span className="font-sans font-semibold text-base sm:text-[17px] tracking-tight text-[#2D241C] dark:text-[#FAFAFA] group-hover:text-[#c6a87c] leading-snug">{link.label}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* ADD THIS NEW GLOSSARY BLOCK HERE */}
              <div className="mt-8 border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/10 pt-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 mb-4">Dictionary</h3>
                <button
                  onClick={() => {
                    setActiveTab('glossary');
                    setShowSearchOverlay(false);
                  }}
                  className="w-full bg-[#F8F5EE]/60 dark:bg-[#c6a87c]/5 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 p-5 rounded-2xl flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#c6a87c]/20 p-3 rounded-xl text-[#c6a87c]">
                      <LibraryIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[#2D241C] dark:text-[#FAFAFA] font-bold text-base tracking-tight group-hover:text-[#c6a87c] transition-colors">Browse the Theological Glossary</h4>
                      <p className="text-[#5C4A3D]/70 dark:text-slate-400 text-xs mt-1 font-serif">Not sure what to search? Explore A-Z concepts.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#5C4A3D]/50 dark:text-[#c6a87c]/60 group-hover:text-[#c6a87c] transition-colors" />
                </button>
              </div>
              {/* END OF GLOSSARY BLOCK */}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
