import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Bookmark, Layout, Database, Sparkles, BookOpen, Library as LibraryIcon, ChevronUp, ChevronDown, Trash2, List, ChevronLeft, ChevronRight, PenLine, Check, MoreHorizontal, FolderPlus, FolderMinus, Copy, LibraryBig } from 'lucide-react';
import { supabase } from '../supabaseClient';
import transcriptData from '../transcripts.json';
import quranData from '../quran.json';
import verseMap from '../verse_map.json';

export default function StudyVault({
    showVault,
    setShowVault,
    vaultItems,
    setVaultItems,
    fetchVaultItems,
    theme,
    activeFontFamily,
    setActiveTab,
    setQuranTarget,
    setQuranVerseTarget,
    setTranscriptTarget,
    setTranscriptHighlight,
    handleTafsirClick
}) {
    // --- LOCAL VAULT STATE ---
    const [vaultSearch, setVaultSearch] = useState('');
    const [selectedVaultItem, setSelectedVaultItem] = useState(null);
    const [vaultViewMode, setVaultViewMode] = useState('grid');
    const [noteText, setNoteText] = useState("");
    const [activeFolder, setActiveFolder] = useState('All');
    const [newFolderInput, setNewFolderInput] = useState('');
    const [movingItemId, setMovingItemId] = useState(null);
    const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
    const [activeCardMenu, setActiveCardMenu] = useState(null);
    const [cardMenuMode, setCardMenuMode] = useState('main');
    const [noteSaveStatus, setNoteSaveStatus] = useState('');
    const [showEditorArabic, setShowEditorArabic] = useState(false);
    const [showEditorChain, setShowEditorChain] = useState(false);
    const [localEmptyFolders, setLocalEmptyFolders] = useState([]);

    // --- DERIVED STATE & MEMOS ---
    const customFolders = useMemo(() => {
        const folders = new Set(localEmptyFolders);
        vaultItems.forEach(item => {
            if (item.folder_name) {
                item.folder_name.split(',').forEach(f => {
                    if (f.trim()) folders.add(f.trim());
                });
            }
        });
        return Array.from(folders).sort();
    }, [vaultItems, localEmptyFolders]);

    const filteredVaultItems = useMemo(() => {
        let filtered = vaultItems;
        if (activeFolder === 'Uncategorized') filtered = filtered.filter(item => !item.folder_name);
        else if (activeFolder === 'Quran') filtered = filtered.filter(item => item.type === 'quran');
        else if (activeFolder === 'Hadiths') filtered = filtered.filter(item => item.type === 'hadith' || !item.type);
        else if (activeFolder === 'Transcripts') filtered = filtered.filter(item => item.type === 'transcript');
        else if (activeFolder !== 'All') {
            filtered = filtered.filter(item => {
                if (!item.folder_name) return false;
                const folders = item.folder_name.split(',').map(f => f.trim());
                return folders.includes(activeFolder);
            });
        }

        if (vaultSearch.trim()) {
            const q = vaultSearch.toLowerCase();
            filtered = filtered.filter(item =>
                (item.content && item.content.toLowerCase().includes(q)) ||
                (item.source && item.source.toLowerCase().includes(q)) ||
                (item.note && item.note.toLowerCase().includes(q))
            );
        }
        return filtered;
    }, [vaultItems, activeFolder, vaultSearch]);

    let quranDetails = null;
    let vaultRelatedCount = 0;
    if (selectedVaultItem?.type === 'quran' && selectedVaultItem.source?.includes('Verse')) {
        const match = selectedVaultItem.source.match(/Surah (.+), Verse (\d+)/);
        if (match) {
            const vNum = parseInt(match[2]);
            let sId = null;
            for (let i = 1; i <= 114; i++) {
                if (quranData[`${i}:1`]?.surahName === match[1]) { sId = i; break; }
            }
            if (sId) {
                quranDetails = { surahId: sId, verseNum: vNum };
                vaultRelatedCount = verseMap[`${sId}:${vNum}`] || 0;
            }
        }
    }

    // --- FUNCTIONS ---
    const assignToFolder = async (itemId, folderName, mode = 'move') => {
        const item = vaultItems.find(i => i.id === itemId);
        let newFolderName = folderName;

        if (mode === 'add' && folderName) {
            let current = item.folder_name ? item.folder_name.split(',').map(f => f.trim()).filter(Boolean) : [];
            if (!current.includes(folderName)) current.push(folderName);
            newFolderName = current.join(', ');
        } else if (mode === 'remove' && folderName) {
            let current = item.folder_name ? item.folder_name.split(',').map(f => f.trim()).filter(Boolean) : [];
            current = current.filter(f => f !== folderName);
            newFolderName = current.length > 0 ? current.join(', ') : null;
        }

        setVaultItems(prev => prev.map(i => i.id === itemId ? { ...i, folder_name: newFolderName } : i));
        setMovingItemId(null);
        setActiveCardMenu(null);
        setCardMenuMode('main');

        const { error } = await supabase.from('vault_items').update({ folder_name: newFolderName }).eq('id', itemId);
        if (error) {
            alert(`Supabase Error: ${error.message}`);
            fetchVaultItems();
        }
    };

    const deleteFolder = async (e, folderToDelete) => {
        e.stopPropagation();
        if (!window.confirm(`Delete the collection "${folderToDelete}"?\n\nYour saved bookmarks will NOT be deleted, only the folder tag will be removed.`)) return;

        setLocalEmptyFolders(prev => prev.filter(f => f !== folderToDelete));

        const affectedItems = vaultItems.filter(item =>
            item.folder_name && item.folder_name.split(',').map(f => f.trim()).includes(folderToDelete)
        );

        if (affectedItems.length > 0) {
            setVaultItems(prev => prev.map(item => {
                if (!item.folder_name) return item;
                const folders = item.folder_name.split(',').map(f => f.trim()).filter(Boolean);
                if (folders.includes(folderToDelete)) {
                    const newFolders = folders.filter(f => f !== folderToDelete);
                    return { ...item, folder_name: newFolders.length > 0 ? newFolders.join(', ') : null };
                }
                return item;
            }));

            await Promise.all(affectedItems.map(item => {
                const folders = item.folder_name.split(',').map(f => f.trim()).filter(Boolean);
                const newFolders = folders.filter(f => f !== folderToDelete);
                const newFolderName = newFolders.length > 0 ? newFolders.join(', ') : null;
                return supabase.from('vault_items').update({ folder_name: newFolderName }).eq('id', item.id);
            }));
        }

        if (activeFolder === folderToDelete) {
            setActiveFolder('All');
            setSelectedVaultItem(null);
        }
    };

    if (!showVault) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setActiveCardMenu(null); setCardMenuMode('main'); }} className="fixed inset-0 z-[6000] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative w-full h-[100dvh] sm:h-full sm:max-w-[1400px] flex flex-col md:flex-row bg-white dark:bg-[#0e0e11] sm:border border-slate-200 dark:border-[#2d2d33] sm:rounded-2xl shadow-2xl overflow-hidden">

                {/* --- SIDEBAR NAVIGATOR --- */}
                <div className="w-full md:w-[260px] bg-[#f7f7f9] dark:bg-[#151518] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#2d2d33] flex flex-col shrink-0 z-20">
                    <div className="p-4 flex justify-between items-center shrink-0">
                        <h2 className="font-serif text-lg font-bold text-slate-800 dark:text-[#ededf0] flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-[#c6a87c]" /> Study Vault
                        </h2>
                        <button onClick={() => setShowVault(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-black/5 dark:bg-white/5 rounded-md"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="px-4 pb-4 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input type="text" value={vaultSearch} onChange={(e) => setVaultSearch(e.target.value)} placeholder="Search Vault..." className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#1c1c20] border border-slate-200 dark:border-[#2d2d33] rounded-md text-xs font-sans text-slate-800 dark:text-[#ededf0] placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                        </div>
                    </div>

                    <div className="hidden md:flex flex-col gap-5 overflow-y-auto smart-scrollbar flex-grow px-2 pb-4 min-h-0">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-3">Library</div>
                            <button onClick={() => { setActiveFolder('All'); setSelectedVaultItem(null); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between group ${activeFolder === 'All' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-[#9a9a9f] hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]'}`}>
                                <div className="flex items-center gap-2"><Layout className={`w-4 h-4 ${activeFolder === 'All' ? 'opacity-100' : 'opacity-70'}`} /> All Bookmarks</div>
                                <span className="text-[10px] font-mono opacity-50">{vaultItems.length}</span>
                            </button>
                            <button onClick={() => { setActiveFolder('Uncategorized'); setSelectedVaultItem(null); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between group ${activeFolder === 'Uncategorized' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-[#9a9a9f] hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]'}`}>
                                <div className="flex items-center gap-2"><Database className={`w-4 h-4 ${activeFolder === 'Uncategorized' ? 'opacity-100' : 'opacity-70'}`} /> Uncategorized</div>
                            </button>
                        </div>

                        <div>
                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-3">Sources</div>
                            <button onClick={() => { setActiveFolder('Hadiths'); setSelectedVaultItem(null); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors mb-1 flex items-center justify-between group ${activeFolder === 'Hadiths' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 shadow-sm' : 'text-slate-600 dark:text-[#9a9a9f] hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]'}`}>
                                <div className="flex items-center gap-2"><Sparkles className={`w-4 h-4 ${activeFolder === 'Hadiths' ? 'text-emerald-500' : 'opacity-70'}`} /> Hadiths</div>
                                <span className="text-[10px] font-mono opacity-50">{vaultItems.filter(i => i.type === 'hadith' || !i.type).length}</span>
                            </button>
                            <button onClick={() => { setActiveFolder('Quran'); setSelectedVaultItem(null); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors mb-1 flex items-center justify-between group ${activeFolder === 'Quran' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 shadow-sm' : 'text-slate-600 dark:text-[#9a9a9f] hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]'}`}>
                                <div className="flex items-center gap-2"><BookOpen className={`w-4 h-4 ${activeFolder === 'Quran' ? 'text-amber-500' : 'opacity-70'}`} /> Quran</div>
                                <span className="text-[10px] font-mono opacity-50">{vaultItems.filter(i => i.type === 'quran').length}</span>
                            </button>
                            <button onClick={() => { setActiveFolder('Transcripts'); setSelectedVaultItem(null); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between group ${activeFolder === 'Transcripts' ? 'bg-[#c6a87c]/10 text-[#c6a87c] dark:text-[#d4b78f] shadow-sm' : 'text-slate-600 dark:text-[#9a9a9f] hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]'}`}>
                                <div className="flex items-center gap-2"><LibraryIcon className={`w-4 h-4 ${activeFolder === 'Transcripts' ? 'text-[#c6a87c]' : 'opacity-70'}`} /> Library</div>
                                <span className="text-[10px] font-mono opacity-50">{vaultItems.filter(i => i.type === 'transcript').length}</span>
                            </button>
                        </div>

                        <div>
                            <button onClick={() => setIsCollectionsOpen(!isCollectionsOpen)} className="w-full flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-[#ededf0] uppercase tracking-widest mb-1 px-3 transition-colors cursor-pointer group">
                                <span>Collections</span>
                                {isCollectionsOpen ? <ChevronUp className="w-3 h-3 opacity-50 group-hover:opacity-100" /> : <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />}
                            </button>
                            <AnimatePresence>
                                {isCollectionsOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex flex-col">
                                        {customFolders.length === 0 ? (
                                            <span className="px-3 py-1 text-xs text-slate-400 dark:text-slate-600 italic">No custom folders.</span>
                                        ) : (
                                            customFolders.map(folder => (
                                                <button key={folder} onClick={() => { setActiveFolder(folder); setSelectedVaultItem(null); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between group ${activeFolder === folder ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-[#9a9a9f] hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]'}`}>
                                                    <div className="flex items-center gap-2 truncate"><Layout className={`w-3.5 h-3.5 ${activeFolder === folder ? 'opacity-100' : 'opacity-70'} shrink-0`} /> <span className="truncate">{folder}</span></div>
                                                    <span className="text-[10px] font-mono opacity-50 pl-2">{vaultItems.filter(i => i.folder_name && i.folder_name.split(',').map(f => f.trim()).includes(folder)).length}</span>
                                                </button>
                                            ))
                                        )}
                                        <div className="px-3 py-2 mt-1 relative group">
                                            <input
                                                type="text"
                                                value={newFolderInput}
                                                onChange={(e) => setNewFolderInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newFolderInput.trim()) {
                                                        setLocalEmptyFolders(prev => [...prev, newFolderInput.trim()]);
                                                        setActiveFolder(newFolderInput.trim());
                                                        setNewFolderInput('');
                                                    }
                                                }}
                                                placeholder="+ New Folder..."
                                                className="w-full bg-transparent border-b border-transparent focus:border-blue-500 text-sm text-slate-700 dark:text-[#ededf0] placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all py-1"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile Horizontal Sidebar */}
                    <div className="md:hidden flex items-center overflow-x-auto hide-scroll px-4 pb-3 gap-2 shrink-0 border-b border-slate-200 dark:border-[#2d2d33]">
                        {['All', 'Hadiths', 'Quran', 'Transcripts', ...customFolders].map(f => (
                            <button key={f} onClick={() => { setActiveFolder(f); setSelectedVaultItem(null); }} className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all border ${activeFolder === f ? 'bg-white dark:bg-[#2d2d33] text-blue-600 dark:text-blue-500 border-slate-300 dark:border-[#424248] shadow-sm' : 'bg-transparent text-slate-500 dark:text-[#9a9a9f] border-transparent hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- PANE 2 & 3: MAIN CONTENT AREA --- */}
                <div className="flex-grow flex flex-col min-h-0 bg-white dark:bg-[#0e0e11] relative">
                    <div className="px-6 py-4 flex items-center justify-between shrink-0 z-10">
                        <h1 className="text-xl md:text-2xl font-serif font-medium text-slate-800 dark:text-[#ededf0]">
                            {selectedVaultItem ? 'Reading Focus' : (activeFolder === 'All' ? 'All Bookmarks' : activeFolder)}
                        </h1>
                        {!selectedVaultItem && (
                            <div className="flex items-center gap-3">
                                {customFolders.includes(activeFolder) && (
                                    <button onClick={(e) => deleteFolder(e, activeFolder)} className="flex items-center justify-center p-2 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title={`Delete "${activeFolder}" Folder`}>
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="flex items-center bg-slate-100 dark:bg-[#1c1c20] rounded-full p-1 border border-slate-200 dark:border-[#2d2d33] shadow-sm">
                                    <button onClick={() => setVaultViewMode('grid')} className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer ${vaultViewMode === 'grid' ? 'bg-white dark:bg-[#2d2d33] text-blue-600 dark:text-blue-500 shadow-sm' : 'text-slate-500 dark:text-[#9a9a9f] hover:text-slate-800 dark:hover:text-[#ededf0]'}`} title="Grid View"><Layout className="w-4 h-4" /></button>
                                    <button onClick={() => setVaultViewMode('list')} className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer ${vaultViewMode === 'list' ? 'bg-white dark:bg-[#2d2d33] text-blue-600 dark:text-blue-500 shadow-sm' : 'text-slate-500 dark:text-[#9a9a9f] hover:text-slate-800 dark:hover:text-[#ededf0]'}`} title="List View"><List className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-y-auto smart-scrollbar relative z-10 px-4 sm:px-6 pb-24 md:pb-12 min-h-0">
                        <AnimatePresence mode="wait">
                            {selectedVaultItem ? (
                                <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-[#2d2d33]">
                                        <button onClick={() => { setSelectedVaultItem(null); }} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 dark:text-[#9a9a9f] dark:hover:text-blue-500 transition-colors cursor-pointer">
                                            <ChevronLeft className="w-4 h-4" /> Back
                                        </button>
                                    </div>

                                    <div className="mb-10 p-6 rounded-xl bg-slate-50 dark:bg-[#151518] border border-slate-200 dark:border-[#2d2d33] shadow-sm">
                                        <div className="mb-5 border-b border-slate-200 dark:border-[#2d2d33] pb-3 flex items-center justify-between">
                                            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-[#9a9a9f] leading-relaxed block">{selectedVaultItem.source}</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold ${selectedVaultItem.type === 'quran' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : selectedVaultItem.type === 'transcript' ? 'bg-[#c6a87c]/10 text-[#c6a87c] dark:text-[#d4b78f]' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'}`}>
                                                {selectedVaultItem.type === 'quran' ? <BookOpen className="w-3 h-3 inline mr-1" /> : selectedVaultItem.type === 'transcript' ? <LibraryIcon className="w-3 h-3 inline mr-1" /> : <Sparkles className="w-3 h-3 inline mr-1" />}
                                                {selectedVaultItem.type || 'hadith'}
                                            </span>
                                        </div>

                                        {selectedVaultItem.arabic_text && (
                                            selectedVaultItem.type === 'quran' ? (
                                                <div className="mb-8">
                                                    <p className="font-arabic text-3xl sm:text-4xl text-right leading-[2.4] sm:leading-[2.5] text-[#2D241C] dark:text-slate-100" dir="rtl" lang="ar" style={{ fontFamily: activeFontFamily }}>
                                                        {selectedVaultItem.arabic_text}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mb-4">
                                                    <button onClick={() => setShowEditorArabic(!showEditorArabic)} className="flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
                                                        {showEditorArabic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {showEditorArabic ? "Hide Original Arabic" : "View Original Arabic"}
                                                    </button>
                                                    <AnimatePresence>
                                                        {showEditorArabic && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                                <div className="p-4 sm:p-5 rounded-lg mt-2 mb-4 bg-white dark:bg-[#0e0e11] border border-slate-200 dark:border-[#2d2d33]">
                                                                    <p className="font-arabic text-xl md:text-2xl text-right leading-[2.2] text-slate-700 dark:text-slate-300" dir="rtl" lang="ar">
                                                                        {selectedVaultItem.arabic_text}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )
                                        )}

                                        {selectedVaultItem.chain && (
                                            <div className="mb-5">
                                                <button onClick={() => setShowEditorChain(!showEditorChain)} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-slate-400 hover:text-blue-500 dark:text-[#5d5d62] dark:hover:text-blue-400">
                                                    {showEditorChain ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} {showEditorChain ? "Hide Chain of Narrators" : "View Chain of Narrators"}
                                                </button>
                                                <AnimatePresence>
                                                    {showEditorChain && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                            <p className="mt-2 p-3 rounded-lg text-sm italic font-sans bg-white dark:bg-[#0e0e11] border border-slate-200 dark:border-[#2d2d33] text-slate-600 dark:text-[#9a9a9f]">
                                                                {selectedVaultItem.chain}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        {selectedVaultItem.type === 'transcript' ? (
                                            selectedVaultItem.content === '[Full Transcript Bookmarked]' ? (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-70">
                                                    <LibraryIcon className="w-12 h-12 mb-3 text-[#c6a87c]" />
                                                    <p className="font-serif text-lg text-slate-600 dark:text-[#9a9a9f]">Full Transcript Bookmarked</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-5">
                                                    {selectedVaultItem.content.split(/\n+/).map((para, i) => {
                                                        const pTrimmed = para.trim();
                                                        if (!pTrimmed) return null;
                                                        const sourceDoc = transcriptData.find(t => t.title === selectedVaultItem.source);
                                                        let matchedBlockType = 'p';
                                                        if (sourceDoc?.content) {
                                                            const match = sourceDoc.content.find(b => b.text && (b.text.includes(pTrimmed) || pTrimmed.includes(b.text)));
                                                            if (match) matchedBlockType = match.type;
                                                        }
                                                        const parseBold = (text) => text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                                                            return part;
                                                        });
                                                        if (matchedBlockType === 'quote') {
                                                            return <blockquote key={i} className="pl-5 py-2 my-2 border-l-[3px] border-[#c6a87c] font-medium text-slate-800 dark:text-[#ededf0] italic font-serif text-base sm:text-lg leading-[1.9]">"{parseBold(pTrimmed.replace(/^"|"$/g, ''))}"</blockquote>;
                                                        }
                                                        if (matchedBlockType === 'summary') {
                                                            return <div key={i} className="bg-slate-100 dark:bg-[#1c1c20] border-l-4 border-[#c6a87c] p-5 my-2 rounded-r-lg shadow-sm"><p className="font-serif text-base sm:text-lg">{parseBold(pTrimmed)}</p></div>;
                                                        }
                                                        return <p key={i} className="font-serif text-base sm:text-lg leading-[1.9] text-slate-800 dark:text-[#ededf0]">{parseBold(pTrimmed)}</p>;
                                                    })}
                                                </div>
                                            )
                                        ) : (
                                            <p className={`font-serif leading-[1.9] text-slate-800 dark:text-[#ededf0] whitespace-pre-wrap antialiased ${selectedVaultItem.type === 'quran' ? 'text-xl sm:text-2xl text-center' : 'text-base sm:text-lg'}`}>
                                                {selectedVaultItem.content}
                                            </p>
                                        )}

                                        <div className="mt-10 flex justify-end items-center gap-4 pt-5 border-t border-slate-200 dark:border-[#2d2d33]">
                                            {selectedVaultItem.type === 'transcript' && (
                                                <button
                                                    onClick={() => {
                                                        const doc = transcriptData.find(t => t.title === selectedVaultItem.source);
                                                        if (doc) {
                                                            setShowVault(false);
                                                            setActiveTab('library');
                                                            setTranscriptTarget(doc.id);
                                                            setTranscriptHighlight(selectedVaultItem.content === '[Full Transcript Bookmarked]' ? null : selectedVaultItem.content);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-100/50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md cursor-pointer shadow-sm"
                                                >
                                                    <LibraryIcon className="w-4 h-4" /> {selectedVaultItem.content === '[Full Transcript Bookmarked]' ? 'Read Transcript' : 'Go to Highlight'}
                                                </button>
                                            )}
                                            {selectedVaultItem.type === 'quran' && quranDetails && (
                                                <button
                                                    onClick={() => {
                                                        setShowVault(false);
                                                        setActiveTab('quran');
                                                        setQuranTarget(quranDetails.surahId);
                                                        setQuranVerseTarget(quranDetails.verseNum);
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-100/50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md cursor-pointer shadow-sm"
                                                >
                                                    <BookOpen className="w-4 h-4" /> Go to Verse
                                                </button>
                                            )}
                                            {selectedVaultItem.type === 'quran' && vaultRelatedCount > 0 && quranDetails && (
                                                <button
                                                    onClick={() => handleTafsirClick(quranDetails.surahId, quranDetails.verseNum)}
                                                    className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-amber-700 hover:text-amber-900 dark:text-amber-500 dark:hover:text-amber-400 transition-colors bg-amber-100/50 dark:bg-amber-900/20 px-3 py-1.5 rounded-md cursor-pointer shadow-sm"
                                                >
                                                    <LibraryBig className="w-4 h-4" /> Related Hadiths
                                                    <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded text-[10px] ml-1">{vaultRelatedCount}</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    await supabase.from('vault_items').delete().eq('id', selectedVaultItem.id);
                                                    fetchVaultItems();
                                                    setSelectedVaultItem(null);
                                                }}
                                                className={`p-1.5 rounded-full transition-colors cursor-pointer ${selectedVaultItem.type === 'transcript' ? 'text-[#c6a87c] hover:text-[#b09265]' : selectedVaultItem.type === 'quran' ? 'text-orange-500 hover:text-orange-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                                                title="Remove from Vault"
                                            >
                                                <Bookmark className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-grow flex flex-col pl-4 border-l-2 border-blue-500 relative mb-12">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <PenLine className="w-4 h-4 text-blue-500" />
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-[#9a9a9f]">Your Notes</h3>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <AnimatePresence>
                                                    {noteSaveStatus && (
                                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                                            <Check className="w-3.5 h-3.5" /> {noteSaveStatus}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                                <AnimatePresence>
                                                    {noteText !== (selectedVaultItem.note || "") && (
                                                        <motion.button
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setVaultItems(prev => prev.map(i => i.id === selectedVaultItem.id ? { ...i, note: noteText } : i));
                                                                setSelectedVaultItem(prev => ({ ...prev, note: noteText }));
                                                                supabase.from('vault_items').update({ note: noteText }).eq('id', selectedVaultItem.id);
                                                                setNoteSaveStatus('Saved!');
                                                                setTimeout(() => { setNoteSaveStatus(''); }, 1500);
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-600 transition-colors cursor-pointer"
                                                        >
                                                            Save Note
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const formatted = val.replace(/(^\s*|[.!?]\s+|\n\s*)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
                                                setNoteText(formatted);
                                            }}
                                            onBlur={() => {
                                                if (noteText !== (selectedVaultItem.note || "")) {
                                                    setVaultItems(prev => prev.map(i => i.id === selectedVaultItem.id ? { ...i, note: noteText } : i));
                                                    setSelectedVaultItem(prev => ({ ...prev, note: noteText }));
                                                    supabase.from('vault_items').update({ note: noteText }).eq('id', selectedVaultItem.id);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (noteText !== (selectedVaultItem.note || "")) {
                                                        setVaultItems(prev => prev.map(i => i.id === selectedVaultItem.id ? { ...i, note: noteText } : i));
                                                        setSelectedVaultItem(prev => ({ ...prev, note: noteText }));
                                                        supabase.from('vault_items').update({ note: noteText }).eq('id', selectedVaultItem.id);
                                                    }
                                                    setNoteSaveStatus('Saved!');
                                                    setTimeout(() => { setNoteSaveStatus(''); }, 1500);
                                                }
                                            }}
                                            placeholder="Type your reflections here... (Press Enter to save)"
                                            className="flex-grow w-full bg-transparent border-none outline-none text-base sm:text-lg font-serif text-slate-700 dark:text-[#ededf0] placeholder-slate-300 dark:placeholder-[#2d2d33] resize-none"
                                            style={{ minHeight: '150px' }}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                    {filteredVaultItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-center px-4 py-20 opacity-60">
                                            <Bookmark className="w-12 h-12 mb-4 text-slate-300 dark:text-[#2d2d33]" />
                                            <p className="text-lg font-serif text-slate-600 dark:text-[#9a9a9f]">No items found.</p>
                                        </div>
                                    ) : (
                                        <div className={vaultViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" : "flex flex-col gap-3 max-w-4xl mx-auto"}>
                                            {filteredVaultItems.map((item) => {
                                                const itemType = item.type || 'hadith';
                                                const isQuran = itemType === 'quran';
                                                const isTranscript = itemType === 'transcript';

                                                const getBadgeStyles = () => {
                                                    if (isQuran) return "bg-amber-500/10 text-amber-600 dark:text-amber-500";
                                                    if (isTranscript) return "bg-[#c6a87c]/10 text-[#c6a87c] dark:text-[#d4b78f]";
                                                    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500";
                                                };

                                                if (vaultViewMode === 'grid') {
                                                    return (
                                                        <div key={item.id} onClick={() => { setSelectedVaultItem(item); setNoteText(item.note || ""); setShowEditorArabic(false); setShowEditorChain(false); }} className="h-[240px] flex flex-col bg-white dark:bg-[#151518] border border-slate-200 dark:border-[#2d2d33] rounded-xl shadow-sm hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:border-slate-300 dark:hover:border-[#424248] transition-all cursor-pointer overflow-hidden relative group">
                                                            <div className={`h-1 w-full ${isQuran ? 'bg-amber-500/50' : isTranscript ? 'bg-[#c6a87c]/50' : 'bg-emerald-500/50'}`} />
                                                            <div className="p-5 flex-grow overflow-hidden relative">
                                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold ${getBadgeStyles()}`}>
                                                                        {isQuran ? <BookOpen className="w-3 h-3 inline mr-1" /> : isTranscript ? <LibraryIcon className="w-3 h-3 inline mr-1" /> : <Sparkles className="w-3 h-3 inline mr-1" />}
                                                                        {itemType}
                                                                    </span>
                                                                    {item.folder_name && item.folder_name.split(',').map((folderName, index) => {
                                                                        const f = folderName.trim();
                                                                        if (!f) return null;
                                                                        return (
                                                                            <span key={`badge-${item.id}-${index}`} className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold ${getBadgeStyles()}`}>
                                                                                <Layout className="w-3 h-3 inline mr-1" /> {f}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <p className="text-xs font-mono text-slate-400 dark:text-[#9a9a9f] font-bold mb-2 truncate">{item.source}</p>
                                                                {isQuran ? (
                                                                    <div className="flex flex-col gap-1.5">
                                                                        {item.arabic_text && (
                                                                            <p className="font-arabic text-sm sm:text-base text-right leading-snug text-slate-800 dark:text-slate-100" dir="rtl" lang="ar" style={{ fontFamily: activeFontFamily }}>
                                                                                {item.arabic_text}
                                                                            </p>
                                                                        )}
                                                                        <p className="font-serif text-xs sm:text-sm text-slate-600 dark:text-[#9a9a9f] leading-relaxed antialiased text-center italic">
                                                                            {item.content}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <p className="font-serif text-sm text-slate-700 dark:text-[#ededf0] leading-relaxed antialiased">
                                                                        {item.content}
                                                                    </p>
                                                                )}
                                                                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-[#151518] to-transparent pointer-events-none" />
                                                            </div>
                                                            <div className="px-5 py-3 border-t border-slate-100 dark:border-[#2d2d33] flex justify-between items-center bg-slate-50/50 dark:bg-[#1c1c20]/50 relative">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-mono text-slate-400 dark:text-[#5d5d62]">{new Date(item.created_at).toLocaleDateString()}</span>
                                                                    {item.note && <PenLine className="w-3.5 h-3.5 text-blue-500" title="Has Note" />}
                                                                </div>
                                                                <div className="relative">
                                                                    <button onClick={(e) => { e.stopPropagation(); setActiveCardMenu(activeCardMenu === item.id ? null : item.id); setCardMenuMode('main'); }} className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-[#5d5d62] dark:hover:text-white transition-colors rounded-md hover:bg-slate-200/50 dark:hover:bg-[#2d2d33]">
                                                                        <MoreHorizontal className="w-5 h-5" />
                                                                    </button>
                                                                    <AnimatePresence>
                                                                        {activeCardMenu === item.id && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveCardMenu(null); }} />
                                                                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 5 }} onClick={(e) => e.stopPropagation()} className="absolute bottom-full right-0 mb-2 w-52 bg-white dark:bg-[#1c1c20] border border-slate-200 dark:border-[#2d2d33] rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1">
                                                                                    {cardMenuMode === 'main' ? (
                                                                                        <>
                                                                                            <button onClick={(e) => { e.stopPropagation(); setCardMenuMode('add'); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between">
                                                                                                <span className="flex items-center gap-2"><FolderPlus className="w-3.5 h-3.5 opacity-60" /> Add to Folder...</span>
                                                                                                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                                                                                            </button>
                                                                                            <button onClick={(e) => { e.stopPropagation(); setCardMenuMode('move'); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between mt-1">
                                                                                                <span className="flex items-center gap-2"><Layout className="w-3.5 h-3.5 opacity-60" /> Move to Folder...</span>
                                                                                                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                                                                                            </button>
                                                                                            {!['All', 'Uncategorized', 'Quran', 'Hadiths', 'Transcripts'].includes(activeFolder) && (
                                                                                                <button onClick={(e) => { e.stopPropagation(); assignToFolder(item.id, activeFolder, 'remove'); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-colors flex items-center gap-2 mt-1">
                                                                                                    <FolderMinus className="w-3.5 h-3.5 opacity-80" /> Remove from "{activeFolder}"
                                                                                                </button>
                                                                                            )}
                                                                                            <div className="my-1 border-t border-slate-100 dark:border-[#2d2d33]" />
                                                                                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${item.source}\n\n${item.content}`); setActiveCardMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center gap-2">
                                                                                                <Copy className="w-3.5 h-3.5 opacity-60" /> Copy Text
                                                                                            </button>
                                                                                            <button onClick={async (e) => { e.stopPropagation(); await supabase.from('vault_items').delete().eq('id', item.id); fetchVaultItems(); setActiveCardMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2 mt-1">
                                                                                                <Trash2 className="w-3.5 h-3.5 opacity-60" /> Delete Bookmark
                                                                                            </button>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <button onClick={(e) => { e.stopPropagation(); setCardMenuMode('main'); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-[#9a9a9f] dark:hover:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center gap-2">
                                                                                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                                                                                            </button>
                                                                                            <div className="my-1 border-t border-slate-100 dark:border-[#2d2d33]" />
                                                                                            <div className="max-h-40 overflow-y-auto smart-scrollbar">
                                                                                                {customFolders.length === 0 ? (
                                                                                                    <span className="px-3 py-2 text-xs text-slate-400 italic block">No folders available.</span>
                                                                                                ) : (
                                                                                                    customFolders.map(f => (
                                                                                                        <button key={`action-${f}`} onClick={(e) => { e.stopPropagation(); assignToFolder(item.id, f, cardMenuMode); }} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-[#9a9a9f] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors truncate">
                                                                                                            {f}
                                                                                                        </button>
                                                                                                    ))
                                                                                                )}
                                                                                            </div>
                                                                                            {cardMenuMode === 'move' && item.folder_name && (
                                                                                                <button onClick={(e) => { e.stopPropagation(); assignToFolder(item.id, null, 'move'); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center gap-2 mt-1 border-t border-slate-100 dark:border-[#2d2d33]">
                                                                                                    Clear Folders
                                                                                                </button>
                                                                                            )}
                                                                                        </>
                                                                                    )}
                                                                                </motion.div>
                                                                            </>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div key={item.id} onClick={() => { setSelectedVaultItem(item); setNoteText(item.note || ""); setShowEditorArabic(false); setShowEditorChain(false); }} className="flex items-center justify-between p-4 bg-white dark:bg-[#151518] border border-slate-200 dark:border-[#2d2d33] rounded-lg hover:border-slate-300 dark:hover:border-[#424248] transition-colors cursor-pointer group">
                                                            <div className="flex items-center gap-4 overflow-hidden">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isQuran ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : isTranscript ? 'bg-[#c6a87c]/10 text-[#c6a87c] dark:text-[#d4b78f]' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'}`}>
                                                                    {isQuran ? <BookOpen className="w-4 h-4" /> : isTranscript ? <LibraryIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-800 dark:text-[#ededf0] truncate">{item.source}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-[#9a9a9f] truncate">{item.content.substring(0, 100)}...</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                                {item.note && <PenLine className="w-4 h-4 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />}
                                                                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-[#5d5d62] group-hover:text-slate-500 dark:group-hover:text-[#9a9a9f] transition-colors" />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
