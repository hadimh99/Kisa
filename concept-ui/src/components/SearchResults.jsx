import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, ChevronDown, ChevronUp, ChevronRight, Check, Copy } from 'lucide-react';
import { KisaLogo } from './Icons';
import { useSearchContext } from '../contexts/SearchContext';

// The /search route results page (loading / empty / concept map + list views),
// extracted from App.jsx. Search state comes from SearchContext; theme, centerPos
// and windowWidth (layout domain) are props. Markup is unchanged from inline.
export default function SearchResults({ theme, centerPos, windowWidth }) {
  const {
    loading,
    loadingMessage,
    searchMode,
    data,
    viewMode,
    query,
    activeCluster,
    setActiveCluster,
    hoveredCluster,
    setHoveredCluster,
    anchorHadith,
    showAnchor,
    setShowAnchor,
    anchorCopied,
    setAnchorCopied,
    setShowAnchorModal,
    handleCopyHadith,
  } = useSearchContext();

  const isKeyword = searchMode === 'keyword';

  const getRadialPosition = (index, total, rx, ry) => {
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  };

  const uniqueBooks = data && data.clusters ? Array.from(new Set(data.clusters.flatMap(c => c.items ? c.items.map(item => item.book) : []))) : [];

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-32 min-h-[100dvh]">

      {/* STATE 1: LOADING */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} className="flex flex-col items-center justify-center min-h-[60vh] z-20">
          <div className="relative flex items-center justify-center">
            {!isKeyword ? (
              <>
                <motion.div className="w-32 h-32 rounded-full absolute bg-[#FDFBF7]/80 dark:bg-[#c6a87c]/10 blur-2xl" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div className="w-24 h-24 rounded-full absolute bg-[#c6a87c]/20 dark:bg-[#062116]/40 blur-xl" animate={{ scale: [1.2, 0.8, 1.2], rotate: 180 }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                <div className="w-16 h-16 rounded-full bg-[#FDFBF7]/90 dark:bg-[#020604]/60 backdrop-blur-md flex items-center justify-center border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shadow-[0_0_40px_rgba(253,251,247,0.8)] dark:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  <KisaLogo className="w-8 h-8 animate-pulse text-[#c6a87c]" />
                </div>
              </>
            ) : (
              <>
                <motion.div className="w-32 h-32 rounded-full absolute bg-[#FDFBF7]/80 dark:bg-[#c6a87c]/10 blur-xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                <div className="w-16 h-16 rounded-full bg-[#FDFBF7] dark:bg-[#030A06] border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 flex items-center justify-center shadow-lg">
                  <KisaLogo className="w-8 h-8 animate-pulse text-[#c6a87c]" />
                </div>
              </>
            )}
          </div>
          <motion.p className="mt-8 font-sans tracking-widest uppercase text-xs sm:text-sm font-semibold opacity-70 whitespace-nowrap text-center text-[#5C4A3D] dark:text-[#c6a87c]/80">
            {loadingMessage}
          </motion.p>
        </motion.div>
      )}

      {/* STATE 2: EMPTY OR NO RESULTS */}
      {!loading && (!data || (data.clusters?.length === 0 && data.total_results === 0)) && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2">No hadiths found</h2>
          <p className="text-[#5C4A3D]/70 dark:text-zinc-400 text-sm">Please try broadening your search or check your spelling.</p>
        </div>
      )}

      {/* STATE 3: RENDER RESULTS */}
      {!loading && data && (data.clusters?.length > 0 || data.total_results > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-8 w-full"
        >
          {viewMode === 'map' && !isKeyword && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center z-30 pointer-events-none">
                <motion.div layoutId="search-node" className="flex flex-col items-center justify-center pointer-events-auto cursor-pointer" onClick={() => setActiveCluster(null)}>
                  <div className="bg-[#FDFBF7]/80 dark:bg-[#020805]/60 px-6 sm:px-8 py-3 sm:py-4 flex flex-col items-center gap-2 backdrop-blur-xl border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 rounded-2xl shadow-[0_0_50px_rgba(45,36,28,0.06)] dark:shadow-[0_0_50px_rgba(198,168,124,0.1)] group hover:scale-105 transition-transform mt-8">
                    {anchorHadith ? (
                      <div className="flex flex-col items-center text-[#2D241C] dark:text-[#FAFAFA]">
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-xl sm:text-2xl font-medium whitespace-nowrap">Similar to</span>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#5C4A3D]/10 dark:bg-[#c6a87c]/20 flex items-center justify-center"><span className="text-[10px] sm:text-xs font-bold text-[#c6a87c]">{data.total_results}</span></div>
                        </div>
                        <ChevronDown className="w-4 h-4 opacity-50 mt-1 mb-1 animate-bounce text-[#5C4A3D] dark:text-[#c6a87c]" />
                        <button onClick={(e) => { e.stopPropagation(); setShowAnchorModal(true); }} className="flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#5C4A3D] dark:text-[#c6a87c] hover:text-[#2D241C] dark:hover:text-[#FAFAFA] bg-[#FDFBF7] dark:bg-[#c6a87c]/10 px-4 py-1.5 rounded-full transition-colors shadow-sm border border-[#5C4A3D]/15 dark:border-[#c6a87c]/30 hover:border-[#c6a87c]/40 dark:hover:border-[#c6a87c]/60">
                          <Sparkles className="w-3 h-3" /> View Source
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-[#2D241C] dark:text-[#FAFAFA]">
                        <span className="font-serif text-xl sm:text-2xl font-medium truncate max-w-[200px] sm:max-w-[280px]" title={query}>{query}</span>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#5C4A3D]/10 dark:bg-[#c6a87c]/20 flex items-center justify-center"><span className="text-[10px] sm:text-xs font-bold text-[#c6a87c]">{data.total_results}</span></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {(data.clusters || []).map((cluster, i) => {
                  const clusterCount = data.clusters ? Math.max(1, data.clusters.length) : 1;
                  const rx = Math.max(280, Math.min(centerPos.x - 150, 450));
                  const ry = Math.max(220, Math.min(centerPos.y - 140, 320));
                  const pos = getRadialPosition(i, clusterCount, rx, ry);
                  const color = theme === 'dark' ? '#c6a87c' : '#5C4A3D';
                  const isActive = activeCluster === i;
                  const isHovered = hoveredCluster === i;
                  return (<motion.line key={`line-${i}`} x1={centerPos.x} y1={centerPos.y} x2={centerPos.x + pos.x} y2={centerPos.y + pos.y} stroke={color} strokeWidth={isActive ? 2 : isHovered ? 1.5 : 1} strokeOpacity={isActive ? 0.5 : isHovered ? 0.3 : 0.1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: i * 0.2 }} className="transition-all duration-300" />);
                })}
              </svg>
              {(data.clusters || []).map((cluster, i) => {
                const clusterCount = data.clusters ? Math.max(1, data.clusters.length) : 1;
                const itemsLength = cluster.items ? cluster.items.length : 0;
                const rx = Math.max(280, Math.min(centerPos.x - 150, 450));
                const ry = Math.max(220, Math.min(centerPos.y - 140, 320));
                const pos = getRadialPosition(i, clusterCount, rx, ry);
                const color = theme === 'dark' ? '#c6a87c' : '#5C4A3D';
                const isActive = activeCluster === i;
                const isHovered = hoveredCluster === i;
                const isFaded = activeCluster !== null && !isActive;
                const isTopMatches = cluster.theme_label && cluster.theme_label.includes("Top Matches");
                const screenScale = Math.min(1, windowWidth / 1200);
                const baseScale = (isTopMatches ? 1.15 : 0.95) * screenScale;

                return (
                  <div key={`cluster-wrap-${i}`} className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center z-20 pointer-events-none">
                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: isFaded ? 0.2 : 1, x: pos.x, y: pos.y, scale: isActive ? baseScale * 1.05 : baseScale }} transition={{ type: "spring", stiffness: 60, delay: i * 0.1 }} className={`pointer-events-auto transition-all duration-300 mt-8 ${isFaded ? 'pointer-events-none grayscale blur-[2px]' : ''}`} onMouseEnter={() => setHoveredCluster(i)} onMouseLeave={() => setHoveredCluster(null)}>
                      <div onClick={() => setActiveCluster(isActive ? null : i)} className="flex flex-col justify-center cursor-pointer transition-all duration-400 relative group w-[220px] sm:w-[260px] bg-[#FDFBF7]/90 dark:bg-[#030A06]/90 backdrop-blur-2xl rounded-2xl px-5 py-4" style={{ border: `1px solid ${isActive || isHovered ? color : (theme === 'dark' ? 'rgba(198, 168, 124, 0.2)' : 'rgba(92, 74, 61, 0.15)')}`, boxShadow: isActive || isHovered ? `0 4px 20px ${theme === 'dark' ? 'rgba(198, 168, 124, 0.15)' : 'rgba(92, 74, 61, 0.15)'}` : '0 8px 32px rgba(0,0,0,0.08)' }}>
                        <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-md transition-all duration-300" style={{ backgroundColor: isActive || isHovered ? color : 'transparent' }} />
                        <div className="pl-2 relative z-10 flex flex-col text-left">
                          <h3 className="font-sans font-semibold text-sm sm:text-base leading-snug whitespace-normal break-words text-[#2D241C] dark:text-[#FAFAFA] group-hover:opacity-80 transition-opacity">{cluster.theme_label}</h3>
                          <div className="mt-2.5 flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <BookOpen className="w-3.5 h-3.5 text-[#5C4A3D] dark:text-[#c6a87c]" />
                            <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#5C4A3D] dark:text-[#c6a87c]">{itemsLength} Narrations</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="z-30 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-12 pointer-events-auto">
              <div className={`p-5 sm:p-6 rounded-xl mb-6 sm:mb-8 border shadow-sm ${anchorHadith ? 'mt-10' : ''} ${isKeyword ? 'bg-[#FDFBF7]/80 dark:bg-[#030A06]/80 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 backdrop-blur-xl' : 'bg-[#FDFBF7]/60 dark:bg-[#030A06]/80 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 backdrop-blur-xl'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className={`font-serif text-xl sm:text-2xl md:text-3xl font-normal tracking-tight break-words whitespace-normal leading-snug text-[#2D241C] dark:text-[#FAFAFA]`}>
                      {isKeyword ? 'Index Results:' : 'Search:'} <span className="italic text-[#c6a87c]">"{query}"</span>
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-3">{uniqueBooks.map((bookName, idx) => (<span key={idx} className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${isKeyword ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/10 text-[#5C4A3D] dark:text-[#c6a87c] border-[#5C4A3D]/15 dark:border-[#c6a87c]/30' : 'text-[#5C4A3D] dark:text-[#c6a87c] bg-[#F8F5EE]/60 dark:bg-[#c6a87c]/10 border-[#5C4A3D]/15 dark:border-[#c6a87c]/30'}`}>{bookName}</span>))}</div>
                  </div>
                  <div className={`flex gap-6 sm:border-l sm:pl-6 shrink-0 ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20'}`}>{!isKeyword && (<div><p className="text-[10px] uppercase tracking-widest text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 font-semibold mb-1">Themes</p><p className="font-mono text-xl text-[#2D241C] dark:text-[#FAFAFA]">{data.clusters ? data.clusters.length : 0}</p></div>)}<div><p className="text-[10px] uppercase tracking-widest text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 font-semibold mb-1">{isKeyword ? 'Matches' : 'Hadiths'}</p><p className="font-mono text-xl text-[#2D241C] dark:text-[#FAFAFA]">{data.total_results}</p></div></div>
                </div>

                {anchorHadith && (
                  <div className={`mt-5 pt-4 border-t ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20'}`}>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowAnchor(!showAnchor)}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 shrink-0 text-[#5C4A3D]/70 dark:text-[#c6a87c]/80" />
                        <span className="text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors break-words text-[#5C4A3D] dark:text-[#c6a87c] group-hover:text-[#2D241C] dark:group-hover:text-[#FAFAFA]">
                          View Anchored Source
                        </span>
                      </div>
                      <div className="p-1.5 shrink-0 rounded-full transition-colors bg-[#FDFBF7] dark:bg-[#c6a87c]/10 text-[#c6a87c] group-hover:bg-[#EAE4D3] dark:group-hover:bg-[#c6a87c]/20">
                        {showAnchor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {showAnchor && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pt-4 pb-2 text-sm sm:text-base font-serif leading-relaxed text-[#2D241C] dark:text-[#c6a87c]">
                            {anchorHadith.english_text}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              handleCopyHadith(anchorHadith);
                              setAnchorCopied(true);
                              setTimeout(() => setAnchorCopied(false), 2000);
                            }} className={`flex items-center gap-2 text-xs font-mono transition-colors px-3 py-1.5 rounded-md cursor-pointer ${anchorCopied ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-[#5C4A3D] hover:text-[#2D241C] dark:text-[#c6a87c]/80 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10'}`}>
                              {anchorCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}<span>{anchorCopied ? 'Copied!' : 'Copy Text'}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className={`flex flex-col border-t ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20'}`}>
                {(data.clusters || []).map((cluster, i) => {
                  const itemsLength = cluster.items ? cluster.items.length : 0;
                  return (
                    <motion.div key={`list-item-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => setActiveCluster(i)} className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 cursor-pointer border-b transition-all duration-300 ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/10 hover:bg-[#FDFBF7]/50 dark:hover:bg-[#c6a87c]/5' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/10 hover:bg-[#FDFBF7]/50 dark:hover:bg-[#c6a87c]/5'}`}>
                      <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-grow pr-8 sm:pr-0"><span className="font-mono text-sm sm:text-base font-medium pt-0.5 sm:pt-0 text-[#5C4A3D]/50 group-hover:text-[#2D241C] dark:text-[#c6a87c]/50 dark:group-hover:text-[#FAFAFA]">0{i + 1}</span><div><h3 className="font-mono text-base sm:text-lg lg:text-xl font-medium tracking-tight transition-colors text-[#2D241C] dark:text-[#c6a87c] group-hover:text-black dark:group-hover:text-[#FAFAFA]">{cluster.theme_label}</h3><div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2"><span className="font-mono text-[10px] sm:text-xs lg:text-sm text-[#5C4A3D]/70 dark:text-[#c6a87c]/60">[{itemsLength} {isKeyword ? 'entries' : 'narrations'}]</span></div></div></div>
                      <div className="absolute right-4 sm:relative sm:right-0 sm:opacity-0 group-hover:opacity-100 transform sm:translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 self-center"><ChevronRight className="w-5 h-5 text-[#5C4A3D] group-hover:text-[#2D241C] dark:text-[#c6a87c]/60 dark:group-hover:text-[#FAFAFA]" /></div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
