import React, { useState, useEffect } from 'react';
import { Search, Filter, Book, Hash, ChevronDown, ChevronUp, Save, X, AlertCircle } from 'lucide-react';

const HadithManager = ({ supabase }) => {
    const [hadiths, setHadiths] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    
    // Filters
    const [bookFilter, setBookFilter] = useState('Al-Kāfi');
    const [volumeFilter, setVolumeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [chapterFilter, setChapterFilter] = useState('all');
    const [numberFilter, setNumberFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('unedited');
    const [hierarchyMap, setHierarchyMap] = useState([]);
    
    // Inline Editor State
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [formData, setFormData] = useState({});

    // Fetch hierarchy map on mount
    useEffect(() => {
        const fetchHierarchy = async () => {
            const { data, error } = await supabase
                .from('kisa_hadiths')
                .select('book, volume, category, chapter')
                .limit(20000);
            if (!error && data) setHierarchyMap(data);
        };
        fetchHierarchy();
    }, [supabase]);

    // Cascading Option Extractors
    const availableBooks = [...new Set(hierarchyMap.map(h => h.book).filter(Boolean))];
    const availableVolumes = [...new Set(hierarchyMap
        .filter(h => bookFilter === 'all' || h.book === bookFilter)
        .map(h => h.volume).filter(Boolean)
    )].sort((a, b) => parseInt(a) - parseInt(b));
    const availableCategories = [...new Set(hierarchyMap
        .filter(h => (bookFilter === 'all' || h.book === bookFilter) && (volumeFilter === 'all' || h.volume === volumeFilter))
        .map(h => h.category).filter(Boolean)
    )];
    const availableChapters = [...new Set(hierarchyMap
        .filter(h => (bookFilter === 'all' || h.book === bookFilter) && (volumeFilter === 'all' || h.volume === volumeFilter) && (categoryFilter === 'all' || h.category === categoryFilter))
        .map(h => h.chapter).filter(Boolean)
    )];

    // Fetch primary dataset
    const fetchHadiths = async () => {
        setLoading(true);
        try {
            let query = supabase.from('kisa_hadiths').select('*');
            
            if (bookFilter && bookFilter !== 'all') query = query.eq('book', bookFilter);
            if (volumeFilter && volumeFilter !== 'all') query = query.eq('volume', volumeFilter);
            if (categoryFilter && categoryFilter !== 'all') query = query.eq('category', categoryFilter);
            if (chapterFilter && chapterFilter !== 'all') query = query.eq('chapter', chapterFilter);
            if (numberFilter) query = query.eq('hadith_number', numberFilter);
            
            if (statusFilter === 'unedited') {
                query = query.is('manual_body', null);
            } else if (statusFilter === 'edited') {
                query = query.not('manual_body', 'is', null);
            }
            
            // Limit to 100 for high-speed local render, ordered chronologically
            const { data, error } = await query.limit(100);
            
            if (error) throw error;
            
            let sortedData = [];
            if (data && data.length > 0) {
                sortedData = data.sort((a, b) => {
                    const volA = parseInt(a.volume) || 0;
                    const volB = parseInt(b.volume) || 0;
                    if (volA !== volB) return volA - volB;
                    return parseInt(a.id) - parseInt(b.id);
                });
            }
            
            setHadiths(sortedData);
        } catch (error) {
            console.error("Fetch Error:", error);
            setStatus({ type: 'error', message: 'Failed to fetch hadiths from vault.' });
        } finally {
            setLoading(false);
        }
    };

    // Refetch on filter drop
    useEffect(() => {
        const bounce = setTimeout(() => {
            fetchHadiths();
        }, 500);
        return () => clearTimeout(bounce);
    }, [bookFilter, volumeFilter, categoryFilter, chapterFilter, numberFilter, statusFilter]);

    // Triggers Native Clone deployment
    const handleExpandRow = (item) => {
        if (expandedRowId === item.id) {
            setExpandedRowId(null);
            setFormData({});
        } else {
            setExpandedRowId(item.id);
            setFormData({
                id: item.id,
                manual_chain: item.manual_chain || '',
                manual_body: item.manual_body || item.english_text || item.englishText || '',
                arabicText: item.arabic_text || item.arabicText || ''
            });
            setStatus({ type: '', message: '' });
        }
    };

    const handleFormChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleUpdate = async () => {
        setStatus({ type: 'loading', message: 'Syncing to Kisa Brain...' });
        
        try {
            // Strict Update Protocol
            const { data, error } = await supabase
                .from('kisa_hadiths')
                .update({
                    manual_chain: formData.manual_chain,
                    manual_body: formData.manual_body,
                    arabicText: formData.arabicText
                })
                .eq('id', formData.id)
                .select();

            if (error) {
                console.error("SUPABASE ERROR:", error);
                alert("Supabase Error: " + (error.message || JSON.stringify(error)));
                throw new Error("Supabase Error: " + (error.message || JSON.stringify(error)));
            }
            
            if (!data || data.length === 0) {
                alert("Supabase Error: Empty write response.");
                throw new Error("Empty write response from database.");
            }

            setStatus({ type: 'success', message: `Successfully updated Hadith #${formData.id}` });
            
            setExpandedRowId(null);
            setFormData({});
            
            // Re-fetch to clear the row from Inbox Zero vanishing act
            fetchHadiths();

        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Book className="w-8 h-8 text-[#c6a87c]" />
                        The Hadith Library
                    </h2>
                    <p className="text-zinc-400 mt-2">Manage the foundational narrations database. Search and edit core texts directly.</p>
                </div>
            </div>

            {/* CASCADING FILTER CONTROLS */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-[#121212] p-5 border border-zinc-800 rounded-2xl shadow-xl">
                <select 
                    value={bookFilter}
                    onChange={(e) => { setBookFilter(e.target.value); setVolumeFilter('all'); setCategoryFilter('all'); setChapterFilter('all'); }}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer"
                >
                    <option value="all">All Sources</option>
                    {availableBooks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <select 
                    value={volumeFilter}
                    onChange={(e) => { setVolumeFilter(e.target.value); setCategoryFilter('all'); setChapterFilter('all'); }}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer"
                >
                    <option value="all">All Volumes</option>
                    {availableVolumes.map(v => <option key={v} value={v}>Vol {v}</option>)}
                </select>

                <select 
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setChapterFilter('all'); }}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer truncate"
                >
                    <option value="all">All Categories</option>
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select 
                    value={chapterFilter}
                    onChange={(e) => setChapterFilter(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer truncate"
                >
                    <option value="all">All Chapters</option>
                    {availableChapters.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <input 
                    type="text" 
                    placeholder="Hadith #" 
                    value={numberFilter}
                    onChange={(e) => setNumberFilter(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white focus:border-[#c6a87c] outline-none shadow-inner"
                />

                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-[#1c1c1e] font-bold border border-zinc-700/50 rounded-xl py-2 px-3 text-sm text-[#c6a87c] focus:border-[#c6a87c] outline-none cursor-pointer"
                >
                    <option value="unedited">Un-Edited Inbox</option>
                    <option value="edited">Edited Vault</option>
                    <option value="all">All Hadiths</option>
                </select>
            </div>

            {/* STATUS ALERTS */}
            {status.message && (
                <div className={`p-4 rounded-xl flex items-center text-sm font-medium shadow-md ${
                    status.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 
                    status.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 
                    'bg-blue-900/20 text-blue-400 border border-blue-900/50'
                }`}>
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    {status.message}
                </div>
            )}

            {/* GRAND INDEX UI */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh]">
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-zinc-900/50 border-b border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-500 sticky top-0 z-10">
                    <div className="col-span-1 hidden sm:block">ID</div>
                    <div className="col-span-3 sm:col-span-2">Source</div>
                    <div className="col-span-2 sm:col-span-1 text-center">Vol</div>
                    <div className="col-span-2 sm:col-span-1 text-center">Num</div>
                    <div className="col-span-4 sm:col-span-6">Matn Preview</div>
                    <div className="col-span-1 text-right"></div>
                </div>

                {/* Scroller */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                    {loading && hadiths.length === 0 ? (
                        <div className="flex justify-center items-center h-40 text-zinc-500 font-mono text-sm tracking-widest uppercase">Fetching Kisa Brain...</div>
                    ) : hadiths.length === 0 ? (
                        <div className="flex justify-center items-center h-40 text-zinc-600 font-bold tracking-widest uppercase text-sm">No Hadiths Found</div>
                    ) : (
                        hadiths.map((item) => (
                            <React.Fragment key={item.id}>
                                {/* Row */}
                                <div 
                                    className={`grid grid-cols-12 gap-4 p-4 border-b border-zinc-800/50 items-center transition-colors cursor-pointer ${
                                        expandedRowId === item.id ? 'bg-[#1a1a1c] border-l-[3px] border-l-[#c6a87c]' : 'hover:bg-zinc-900/50 hover:border-l-[3px] hover:border-l-zinc-700 border-l-[3px] border-l-transparent'
                                    }`}
                                    onClick={() => handleExpandRow(item)}
                                >
                                    <div className="col-span-1 hidden sm:block text-xs font-mono text-zinc-600">{item.id}</div>
                                    <div className="col-span-3 sm:col-span-2 text-sm font-semibold text-zinc-300 truncate">{item.book}</div>
                                    <div className="col-span-2 sm:col-span-1 text-xs text-zinc-500 text-center bg-black/30 rounded py-1">{item.volume || '-'}</div>
                                    <div className="col-span-2 sm:col-span-1 text-xs text-zinc-500 text-center bg-black/30 rounded py-1">{item.hadith_number || item.num || item.number || '-'}</div>
                                    <div className="col-span-4 sm:col-span-6 text-sm text-zinc-400 truncate pr-4">{item.englishText || 'No translation provided.'}</div>
                                    <div className="col-span-1 text-right flex justify-end">
                                        {expandedRowId === item.id ? <ChevronUp className="w-5 h-5 text-[#c6a87c]" /> : <ChevronDown className="w-5 h-5 text-zinc-600" />}
                                    </div>
                                </div>

                                {/* THE NATIVE CLONE (INLINE EXPANDED EDITOR) */}
                                {expandedRowId === item.id && (
                                    <div className="col-span-12 bg-[#1c1c1e] border-y border-[#c6a87c]/30 shadow-inner p-6 sm:p-10">
                                        <div className="flex items-center gap-2 mb-8 border-b border-zinc-800 pb-4">
                                            <span className="bg-[#c6a87c] text-black text-xs font-bold px-2 py-0.5 rounded shadow">EDITING</span>
                                            <span className="text-zinc-300 font-mono text-sm">{item.book} • Volume {item.volume} • Hadith {item.hadith_number}</span>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {/* Column A */}
                                            <div className="flex flex-col gap-8">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c6a87c]">EDIT CHAIN OF NARRATORS</label>
                                                    <textarea 
                                                        value={formData.manual_chain}
                                                        onChange={(e) => handleFormChange('manual_chain', e.target.value)}
                                                        className="w-full bg-black/40 border border-[#c6a87c]/50 hover:border-[#c6a87c] focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] rounded-lg p-4 text-zinc-300 font-sans text-sm resize-y outline-none transition-all shadow-sm"
                                                        rows={3}
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c6a87c]">EDIT ENGLISH MATN (CORE TEXT)</label>
                                                    <textarea 
                                                        value={formData.manual_body}
                                                        onChange={(e) => handleFormChange('manual_body', e.target.value)}
                                                        className="w-full bg-black/40 border border-[#c6a87c]/50 hover:border-[#c6a87c] focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] rounded-lg p-5 text-zinc-100 font-serif leading-relaxed text-base resize-y min-h-[250px] outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Column B */}
                                            <div className="flex flex-col gap-8">
                                                <div className="flex flex-col gap-2 flex-1">
                                                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c6a87c] text-right">EDIT ARABIC TEXT</label>
                                                    <textarea 
                                                        value={formData.arabicText}
                                                        onChange={(e) => handleFormChange('arabicText', e.target.value)}
                                                        dir="rtl"
                                                        className="w-full h-full bg-black/40 border border-[#c6a87c]/50 hover:border-[#c6a87c] focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] rounded-lg p-5 text-zinc-200 font-arabic text-xl leading-[2.2] resize-y min-h-[250px] outline-none transition-all shadow-sm flex-1"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10 pt-6 border-t border-[#c6a87c]/20 flex justify-end items-center gap-4">
                                            <button 
                                                onClick={() => handleExpandRow(item)}
                                                className="px-6 py-3 font-bold uppercase tracking-widest text-xs text-zinc-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleUpdate}
                                                disabled={status.type === 'loading'}
                                                className="bg-[#c6a87c] hover:bg-[#b0956b] text-black font-bold uppercase tracking-widest text-xs px-8 py-3 rounded-md shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                {status.type === 'loading' ? 'Syncing...' : 'Save Hadith'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HadithManager;
