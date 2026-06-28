import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import HadithCard from './HadithCard';
import { useSearchContext } from '../contexts/SearchContext';

const ITEMS_PER_PAGE = 10;

// The cluster-detail modal (opens when a result cluster is selected), extracted
// from App.jsx. Search/cluster state comes from SearchContext; modalScrollRef +
// handleModalScroll are props because the ref is shared with an App-level effect
// that scrolls it on activeCluster change. Markup unchanged from inline.
export default function ClusterModal({ modalScrollRef, handleModalScroll, vaultItems }) {
  const {
    activeCluster,
    setActiveCluster,
    data,
    lengthFilter,
    setLengthFilter,
    currentPage,
    setCurrentPage,
    searchMode,
    handleVerseClick,
    handleCopyHadith,
    handleFindSimilar,
  } = useSearchContext();

  return (
    <AnimatePresence>
      {activeCluster !== null && data?.clusters && data.clusters[activeCluster] && (() => {
        const clusterItems = data.clusters[activeCluster].items || [];
        const filteredItems = clusterItems.filter(item => { if (lengthFilter === 'All') return true; const len = String(item.english_text || '').length; if (lengthFilter === 'Short') return len < 300; if (lengthFilter === 'Medium') return len >= 300 && len <= 1000; if (lengthFilter === 'Long') return len > 1000; return true; });
        const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1, safeCurrentPage = Math.min(currentPage, totalPages), startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE, paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCluster(null)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full sm:w-[90vw] max-w-[700px] h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[1001] border bg-[#EAE4D3] dark:bg-[#030A06] border-[#5C4A3D]/20 dark:border-[#c6a87c]/20`}>
              <div className={`flex justify-between items-center backdrop-blur-xl pt-5 pb-4 px-4 sm:px-6 z-10 border-b rounded-t-2xl shrink-0 bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20`}>
                <h2 className="text-lg sm:text-xl md:text-2xl font-mono font-normal tracking-tight truncate pr-4 text-[#2D241C] dark:text-[#FAFAFA]">{data.clusters[activeCluster].theme_label}</h2>
                <button onClick={() => setActiveCluster(null)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 sm:w-6 sm:h-6 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
              </div>
              <div className={`px-4 sm:px-6 py-3 border-b shrink-0 flex flex-wrap gap-2 items-center bg-[#F8F5EE]/40 dark:bg-black/20 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20`}>
                <div className="flex items-center gap-1.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 mr-1"><Filter className="w-3.5 h-3.5" /><span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Length:</span></div>
                {['All', 'Short', 'Medium', 'Long'].map(f => (<button key={f} onClick={() => { setLengthFilter(f); setCurrentPage(1); if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0; }} className={`px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors cursor-pointer ${lengthFilter === f ? 'bg-[#5C4A3D] dark:bg-[#c6a87c]/20 text-[#FAFAFA]' : 'bg-[#FDFBF7] dark:bg-[#c6a87c]/5 text-[#5C4A3D] dark:text-[#c6a87c] border border-[#5C4A3D]/15 dark:border-transparent hover:bg-[#EAE4D3] dark:hover:bg-[#c6a87c]/10'}`}>{f}</button>))}
                <span className="ml-auto text-[10px] sm:text-xs font-mono text-[#5C4A3D]/60 dark:text-[#c6a87c]/50">{filteredItems.length} matches</span>
              </div>
              <div ref={modalScrollRef} onScroll={handleModalScroll} className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto flex-grow smart-scrollbar">
                {filteredItems.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-[#5C4A3D]/50 dark:text-[#c6a87c]/50 italic mt-10"><p>No {lengthFilter.toLowerCase()} hadiths found.</p></div> : paginatedItems.map((item, idx) => (<HadithCard key={idx} item={item} onVerseClick={handleVerseClick} handleCopyHadith={handleCopyHadith} searchMode={searchMode} onFindSimilar={handleFindSimilar} vaultItems={vaultItems} />))}
                {totalPages > 1 && filteredItems.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 sm:pt-6 border-t border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 mt-2 sm:mt-4">
                    <button onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); modalScrollRef.current.scrollTop = 0; }} disabled={safeCurrentPage === 1} className={`flex items-center justify-center gap-1 w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${safeCurrentPage === 1 ? 'opacity-30 cursor-not-allowed text-[#5C4A3D]/50 dark:text-slate-500' : 'text-[#2D241C] dark:text-[#c6a87c] hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10'}`}><ChevronLeft className="w-5 h-5" /> Previous</button>
                    <span className="font-mono text-xs sm:text-sm text-[#5C4A3D]/60 dark:text-[#c6a87c]/60">Page {safeCurrentPage} of {totalPages}</span>
                    <button onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); modalScrollRef.current.scrollTop = 0; }} disabled={safeCurrentPage === totalPages} className={`flex items-center justify-center gap-1 w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${safeCurrentPage === totalPages ? 'opacity-30 cursor-not-allowed text-[#5C4A3D]/50 dark:text-slate-500' : 'text-[#2D241C] dark:text-[#c6a87c] hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10'}`}>Next <ChevronRight className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        );
      })()}
    </AnimatePresence>
  );
}
