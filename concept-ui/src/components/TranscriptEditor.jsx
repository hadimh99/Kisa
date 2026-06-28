import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, FileText, Hash, Link as LinkIcon, User, AlertCircle, Wand2, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, Edit3, Library, RefreshCw, LayoutList, Clock, FolderGit2, Edit2, Check, Search, FileSearch, CheckSquare, Square, RefreshCcw, ShieldAlert } from 'lucide-react';

// Robust helper to render bold/italics in preview mode
const MarkdownPreview = ({ text, type }) => {
    if (!text) return null;
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
        .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="italic text-zinc-300">$1</em>');

    return <div
        className={`leading-relaxed ${type === 'quote' ? 'font-serif text-lg' : 'font-sans'}`}
        dangerouslySetInnerHTML={{ __html: html }}
    />;
};

// Auto-expanding Textarea Component
const AutoResizingTextarea = ({ value, onChange, className, placeholder }) => {
    const textareaRef = useRef(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);
    return (
        <textarea ref={textareaRef} value={value} onChange={onChange} className={`resize-none overflow-hidden block w-full ${className}`} placeholder={placeholder} rows={1} />
    );
};

// Regex escape helper
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const TranscriptEditor = ({ supabase }) => {
    const [activeView, setActiveTab] = useState('library');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Data stores
    const [existingEpisodes, setExistingEpisodes] = useState([]);
    const [trashedEpisodes, setTrashedEpisodes] = useState([]);
    const [seriesList, setSeriesList] = useState([]);

    // UI Toggles
    const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
    const [isSeriesManagerOpen, setIsSeriesManagerOpen] = useState(false);
    const [isRecentsOpen, setIsRecentsOpen] = useState(true);
    const [expandedLibrarySeries, setExpandedLibrarySeries] = useState({});
    const [rawText, setRawText] = useState('');

    // Series Renaming State
    const [editingSeriesName, setEditingSeriesName] = useState(null);
    const [newSeriesNameInput, setNewSeriesNameInput] = useState('');

    // Global Replace State
    const [replaceStep, setReplaceStep] = useState(1);
    const [replaceConfig, setReplaceConfig] = useState({
        find: '', replace: '', matchCase: false, wholeWord: false, setToDraft: false,
        blocks: { h2: true, p: true, summary: true, quote: false }
    });
    const [selectedForSearch, setSelectedForSearch] = useState([]);
    const [expandedScopeSeries, setExpandedScopeSeries] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [isExecutingReplace, setIsExecutingReplace] = useState(false);

    // Editor State
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [episodeId, setEpisodeId] = useState('');
    const [episodeData, setEpisodeData] = useState({
        series_name: '', title: '', speaker: '', source_link: '', is_hidden: false, series_priority: 0, episode_number: 1
    });
    const [blocks, setBlocks] = useState([]);

    useEffect(() => {
        fetchLibrary();
    }, []);

    const fetchLibrary = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('kisa_transcripts').select('*').order('updated_at', { ascending: false });
        if (!error && data) {
            const active = data.filter(ep => !ep.is_trashed);
            setExistingEpisodes(active);
            setTrashedEpisodes(data.filter(ep => ep.is_trashed));

            const uniqueSeriesMap = new Map();
            active.forEach(ep => {
                if (ep.series_name && !uniqueSeriesMap.has(ep.series_name)) {
                    uniqueSeriesMap.set(ep.series_name, ep.series_priority || 0);
                }
            });
            const sortedSeries = Array.from(uniqueSeriesMap.entries())
                .map(([name, order]) => ({ name, order }))
                .sort((a, b) => a.order - b.order);

            if (active.some(ep => !ep.series_name)) sortedSeries.push({ name: '', order: 999 });

            setSeriesList(sortedSeries);

            if (selectedForSearch.length === 0) setSelectedForSearch(active.map(ep => ep.id));
        }
        setLoading(false);
    };

    const loadEpisode = (ep) => {
        setEpisodeId(ep.id);
        setEpisodeData({
            series_name: ep.series_name || '', title: ep.title || '', speaker: ep.speaker || '',
            source_link: ep.source_link || '', is_hidden: ep.is_hidden || false,
            series_priority: ep.series_priority || 0, episode_number: ep.episode_number || 1
        });
        setBlocks((ep.content || []).map(b => ({ ...b, id: Math.random() })));
        setActiveTab('editor');
    };

    const resetForm = () => {
        setEpisodeId('');
        setEpisodeData({ series_name: '', title: '', speaker: '', source_link: '', is_hidden: false, series_priority: 0, episode_number: 1 });
        setBlocks([]);
        setStatus({ type: '', message: '' });
        setActiveTab('editor');
    };

    const handleSmartPaste = () => {
        if (!rawText.trim()) return;
        const lines = rawText.split(/\n+/);
        let newBlocks = [];
        let newMeta = { ...episodeData };
        let generatedId = episodeId;

        lines.forEach(line => {
            const text = line.trim();
            if (!text) return;
            if (text.toLowerCase().startsWith('series:')) { newMeta.series_name = text.substring(7).trim(); return; }
            if (text.toLowerCase().startsWith('title:')) {
                newMeta.title = text.substring(6).trim();
                if (!generatedId) generatedId = newMeta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return;
            }
            if (text.toLowerCase().startsWith('speaker:')) { newMeta.speaker = text.substring(8).trim(); return; }
            if (text.toLowerCase().startsWith('source link:')) { newMeta.source_link = text.substring(12).trim(); return; }

            if (text.toLowerCase().startsWith('overview')) newBlocks.push({ id: Math.random(), type: 'h2', text: text });
            else if (text.toLowerCase().startsWith('segment ')) {
                if (newBlocks.length > 0) newBlocks.push({ id: Math.random(), type: 'divider' });
                newBlocks.push({ id: Math.random(), type: 'h2', text: text });
            } else if (text.toLowerCase().startsWith('brief summary:')) {
                newBlocks.push({ id: Math.random(), type: 'summary', text: text.substring(14).trim() });
            } else if (text.toLowerCase().startsWith('quote:')) {
                newBlocks.push({ id: Math.random(), type: 'quote', text: text.substring(6).trim() });
            } else newBlocks.push({ id: Math.random(), type: 'p', text: text });
        });

        const existingSeries = seriesList.find(s => s.name === newMeta.series_name);
        if (existingSeries) newMeta.series_priority = existingSeries.order;

        const epsInNewSeries = existingEpisodes.filter(ep => (ep.series_name || '') === newMeta.series_name);
        newMeta.episode_number = epsInNewSeries.length > 0 ? Math.max(...epsInNewSeries.map(e => e.episode_number || 0)) + 1 : 1;

        setEpisodeData(newMeta);
        if (generatedId) setEpisodeId(generatedId);
        setBlocks(prev => [...prev, ...newBlocks]);
        setIsSmartPasteOpen(false);
        setRawText('');
    };

    const handleSave = async () => {
        setLoading(true);
        const cleanBlocks = blocks.map(({ id, ...rest }) => rest);

        // The public site orders/routes by episode_number, so it MUST be unique
        // within a series. New episodes (or any with a missing number) get
        // max(existing in series) + 1; existing episodes keep their number.
        let episodeNumber = episodeData.episode_number;
        const isExisting = existingEpisodes.some(ep => ep.id === episodeId);
        if (!isExisting || !episodeNumber) {
            const sameSeries = existingEpisodes.filter(ep => (ep.series_name || '') === episodeData.series_name && ep.id !== episodeId);
            episodeNumber = sameSeries.length > 0 ? Math.max(...sameSeries.map(e => e.episode_number || 0)) + 1 : 1;
        }

        const { error } = await supabase.from('kisa_transcripts').upsert([{
            id: episodeId, ...episodeData, episode_number: episodeNumber, content: cleanBlocks, is_trashed: false, updated_at: new Date().toISOString()
        }]);

        if (error) setStatus({ type: 'error', message: error.message });
        else {
            setStatus({ type: 'success', message: 'Published successfully!' });
            fetchLibrary();
            setTimeout(() => setActiveTab('library'), 1500);
        }
        setLoading(false);
    };

    // --- Global Search & Replace Logic ---
    const toggleScopeSeries = (seriesName, epsInSeries) => {
        const epIds = epsInSeries.map(ep => ep.id);
        const allSelected = epIds.every(id => selectedForSearch.includes(id));
        if (allSelected) setSelectedForSearch(prev => prev.filter(id => !epIds.includes(id)));
        else {
            const newSelection = [...selectedForSearch];
            epIds.forEach(id => { if (!newSelection.includes(id)) newSelection.push(id); });
            setSelectedForSearch(newSelection);
        }
    };

    const toggleScopeEpisode = (epId) => {
        if (selectedForSearch.includes(epId)) setSelectedForSearch(prev => prev.filter(id => id !== epId));
        else setSelectedForSearch(prev => [...prev, epId]);
    };

    const runGlobalSearch = () => {
        if (!replaceConfig.find.trim()) return setStatus({ type: 'error', message: 'Please enter a search term.' });
        if (selectedForSearch.length === 0) return setStatus({ type: 'error', message: 'No episodes selected in scope.' });

        setLoading(true);
        let flags = replaceConfig.matchCase ? 'g' : 'gi';
        let searchStr = escapeRegExp(replaceConfig.find);
        if (replaceConfig.wholeWord) searchStr = `\\b${searchStr}\\b`;

        let regex;
        try { regex = new RegExp(searchStr, flags); }
        catch (e) { setLoading(false); return setStatus({ type: 'error', message: 'Invalid search parameters.' }); }

        const results = [];
        const targetEps = existingEpisodes.filter(ep => selectedForSearch.includes(ep.id));

        targetEps.forEach(ep => {
            const epBlocks = ep.content || [];
            epBlocks.forEach(block => {
                if (!replaceConfig.blocks[block.type]) return;
                if (regex.test(block.text)) {
                    regex.lastIndex = 0;
                    const newText = block.text.replace(regex, replaceConfig.replace);
                    if (newText !== block.text) {
                        results.push({
                            epId: ep.id, epTitle: ep.title, seriesName: ep.series_name || 'Uncategorized',
                            blockId: block.id || Math.random(), blockType: block.type, oldText: block.text, newText: newText, selected: true
                        });
                    }
                }
            });
        });

        setSearchResults(results);
        setReplaceStep(2);
        setLoading(false);
    };

    const executeGlobalReplace = async () => {
        const approvedResults = searchResults.filter(r => r.selected);
        if (approvedResults.length === 0) {
            setReplaceStep(1);
            return setStatus({ type: 'success', message: 'No changes selected. Cancelled.' });
        }

        setIsExecutingReplace(true);
        setStatus({ type: '', message: '' });

        const updatesByEp = {};
        approvedResults.forEach(r => {
            if (!updatesByEp[r.epId]) updatesByEp[r.epId] = [];
            updatesByEp[r.epId].push(r);
        });

        const epIdsToUpdate = Object.keys(updatesByEp);
        let completedCount = 0;

        for (const epId of epIdsToUpdate) {
            const originalEp = existingEpisodes.find(e => e.id === epId);
            if (!originalEp) continue;

            const newContent = (originalEp.content || []).map(block => {
                const update = updatesByEp[epId].find(u => u.blockId === block.id || u.oldText === block.text);
                if (update) return { ...block, text: update.newText };
                return block;
            });

            const newHiddenStatus = replaceConfig.setToDraft ? true : originalEp.is_hidden;

            await supabase.from('kisa_transcripts').update({
                content: newContent, is_hidden: newHiddenStatus, updated_at: new Date().toISOString()
            }).eq('id', epId);

            completedCount++;
        }

        setIsExecutingReplace(false);
        setReplaceStep(1);
        setStatus({ type: 'success', message: `Successfully updated ${completedCount} episodes!` });
        fetchLibrary();
        setActiveTab('library');
    };

    // --- Series Rename and Reorder Logic ---
    const moveSeries = (index, direction) => {
        const newSeries = [...seriesList];
        if (direction === -1 && index > 0) {
            [newSeries[index], newSeries[index - 1]] = [newSeries[index - 1], newSeries[index]];
        } else if (direction === 1 && index < newSeries.length - 1) {
            [newSeries[index], newSeries[index + 1]] = [newSeries[index + 1], newSeries[index]];
        }
        setSeriesList(newSeries);
    };

    const handleSaveSeriesOrder = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try {
            const updates = seriesList.map((series, index) => {
                if (!series.name) return null;
                return supabase.from('kisa_transcripts').update({ series_priority: index }).eq('series_name', series.name);
            }).filter(Boolean);

            const results = await Promise.all(updates);

            // Check for silent Supabase column errors
            const firstError = results.find(res => res && res.error);
            if (firstError) throw new Error(firstError.error.message || "Database rejected save. Make sure series_priority exists.");

            setStatus({ type: 'success', message: 'Live series order updated successfully!' });
            fetchLibrary();
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
        setLoading(false);
    };

    const startRenamingSeries = (seriesName) => {
        setEditingSeriesName(seriesName);
        setNewSeriesNameInput(seriesName);
    };

    const confirmRenameSeries = async () => {
        if (!newSeriesNameInput.trim() || newSeriesNameInput === editingSeriesName) return setEditingSeriesName(null);
        const confirmMsg = `WARNING: Renaming "${editingSeriesName}" to "${newSeriesNameInput}" will update all episodes inside it.\n\nIf your live website uses the series name in its URL structure, those old URLs will break (404 Error).\n\nDo you want to proceed?`;
        if (!window.confirm(confirmMsg)) return setEditingSeriesName(null);

        setLoading(true);
        try {
            const { error } = await supabase.from('kisa_transcripts').update({ series_name: newSeriesNameInput, updated_at: new Date().toISOString() }).eq('series_name', editingSeriesName);
            if (error) throw error;
            setStatus({ type: 'success', message: `Successfully renamed series to "${newSeriesNameInput}"` });
            setEditingSeriesName(null);
            fetchLibrary();
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
        setLoading(false);
    };

    // --- INDIVIDUAL EPISODE REORDERING ---
    const moveEpisodeLocal = (epId, seriesName, direction) => {
        const seriesEps = existingEpisodes.filter(ep => (ep.series_name || '') === seriesName).sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
        const currentIndex = seriesEps.findIndex(ep => ep.id === epId);
        if ((direction === -1 && currentIndex === 0) || (direction === 1 && currentIndex === seriesEps.length - 1)) return;

        const targetIndex = currentIndex + direction;
        const newSeriesEps = [...seriesEps];
        [newSeriesEps[currentIndex], newSeriesEps[targetIndex]] = [newSeriesEps[targetIndex], newSeriesEps[currentIndex]];

        newSeriesEps.forEach((ep, idx) => { ep.episode_number = idx + 1; });

        setExistingEpisodes(prev => prev.map(ep => {
            const updatedEp = newSeriesEps.find(nep => nep.id === ep.id);
            return updatedEp ? { ...ep, episode_number: updatedEp.episode_number } : ep;
        }));
    };

    // NEW MAGIC AUTO-SORT FUNCTION
    const handleAutoSortSeries = (seriesName, e) => {
        e.stopPropagation();
        const seriesEps = existingEpisodes.filter(ep => (ep.series_name || '') === seriesName);

        // Smart regex to pull numbers out of strings like "Part 14", "Ep 2", etc.
        const extractNum = (title) => {
            const match = title.match(/(?:part|ep|episode)[\s-]*(\d+)/i);
            if (match) return parseInt(match[1], 10);
            const numMatch = title.match(/\b(\d+)\b/); // Fallback: grab any isolated number
            return numMatch ? parseInt(numMatch[1], 10) : 9999;
        };

        const sorted = [...seriesEps].sort((a, b) => extractNum(a.title) - extractNum(b.title));

        // Re-assign priorities based on sorted order
        sorted.forEach((ep, idx) => { ep.episode_number = idx + 1; });

        setExistingEpisodes(prev => prev.map(ep => {
            const updated = sorted.find(s => s.id === ep.id);
            return updated ? { ...ep, episode_number: updated.episode_number } : ep;
        }));

        setStatus({ type: 'success', message: 'Auto-sorted locally! Click "Publish Order" to lock it in.' });
    };

    const handleSaveEpisodeOrder = async (seriesName, e) => {
        e.stopPropagation();
        setLoading(true);
        const seriesEps = existingEpisodes.filter(ep => (ep.series_name || '') === seriesName);
        try {
            const updates = seriesEps.map(ep => supabase.from('kisa_transcripts').update({ episode_number: ep.episode_number }).eq('id', ep.id));
            const results = await Promise.all(updates);

            // Check for silent Supabase column errors!
            const firstError = results.find(res => res && res.error);
            if (firstError) throw new Error(firstError.error.message || "Database rejected save. Make sure the 'episode_number' column is strictly spelled correctly in Supabase.");

            setStatus({ type: 'success', message: 'Episode order published successfully!' });
            fetchLibrary(); // Force a clean sync with the DB
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
        setLoading(false);
    };

    // Trash Management Logic
    const handleSoftDelete = async (e, id) => {
        e.stopPropagation();
        setLoading(true);
        const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: true, updated_at: new Date().toISOString() }).eq('id', id);
        if (!error) { setStatus({ type: 'success', message: 'Moved to trash.' }); fetchLibrary(); }
        else setStatus({ type: 'error', message: error.message });
        setLoading(false);
    };

    const handleRestore = async (id) => {
        setLoading(true);
        const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: false, updated_at: new Date().toISOString() }).eq('id', id);
        if (!error) { setStatus({ type: 'success', message: 'Restored successfully.' }); fetchLibrary(); }
        else setStatus({ type: 'error', message: error.message });
        setLoading(false);
    };

    const handleHardDelete = async (id) => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;
        setLoading(true);
        const { error } = await supabase.from('kisa_transcripts').delete().eq('id', id);
        if (!error) { setStatus({ type: 'success', message: 'Permanently deleted.' }); fetchLibrary(); }
        else setStatus({ type: 'error', message: error.message });
        setLoading(false);
    };

    const moveBlock = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === blocks.length - 1)) return;
        const newBlocks = [...blocks];
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[index + direction];
        newBlocks[index + direction] = temp;
        setBlocks(newBlocks);
    };

    const addBlock = (type) => {
        setBlocks([...blocks, { id: Math.random(), type, text: '' }]);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Tab Navigation */}
            <div className="flex flex-wrap bg-[#121212] p-1 rounded-xl border border-zinc-800 self-start gap-1">
                <button onClick={() => setActiveTab('library')} className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeView === 'library' ? 'bg-zinc-800 text-[#c6a87c]' : 'text-zinc-500 hover:text-zinc-300'}`}>Library</button>
                <button onClick={resetForm} className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeView === 'editor' ? 'bg-zinc-800 text-[#c6a87c]' : 'text-zinc-500 hover:text-zinc-300'}`}>Editor</button>
                <button onClick={() => { setActiveTab('replace'); setReplaceStep(1); }} className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'replace' ? 'bg-blue-900/20 text-blue-400' : 'text-zinc-500 hover:text-blue-400'}`}><FileSearch className="w-3.5 h-3.5" /> Replace</button>
                <button onClick={() => setActiveTab('trash')} className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeView === 'trash' ? 'bg-red-900/20 text-red-500' : 'text-zinc-500 hover:text-red-400'}`}>Trash ({trashedEpisodes.length})</button>
            </div>

            {status.message && activeView !== 'editor' && (
                <div className={`p-4 rounded-xl flex items-center text-xs font-bold tracking-widest uppercase shadow-md ${status.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : status.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-blue-900/20 text-blue-400 border border-blue-900/50'}`}>
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {status.message}
                </div>
            )}

            {/* View Router */}
            {activeView === 'library' ? (
                <div className="flex flex-col gap-8">
                    {/* Library View */}
                    <div>
                        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 w-fit" onClick={() => setIsRecentsOpen(!isRecentsOpen)}>
                            <div className={`p-1 rounded bg-zinc-900 border border-zinc-800 transition-transform ${isRecentsOpen ? 'rotate-180' : ''}`}><ChevronDown className="w-3 h-3 text-zinc-400" /></div>
                            <h3 className="text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-[#c6a87c]" /> Recently Edited</h3>
                        </div>
                        <AnimatePresence>
                            {isRecentsOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch pb-2">
                                        <button onClick={resetForm} className="border-2 border-dashed border-zinc-800 bg-[#121212] rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 hover:border-[#c6a87c]/50 hover:bg-[#c6a87c]/5 transition-all gap-3 group min-h-[140px] shadow-sm">
                                            <Plus className="w-6 h-6 text-zinc-700 group-hover:text-[#c6a87c]" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-[#c6a87c]">New Episode</span>
                                        </button>
                                        {existingEpisodes.slice(0, 5).map(ep => (
                                            <div key={ep.id} onClick={() => loadEpisode(ep)} className="bg-[#121212] border border-zinc-800 p-4 rounded-2xl hover:border-[#c6a87c]/50 transition-all group flex flex-col h-full cursor-pointer relative shadow-sm hover:shadow-md">
                                                <span className="text-[10px] text-[#c6a87c] font-bold uppercase tracking-widest mb-1.5 line-clamp-1" title={ep.series_name}>{ep.series_name || 'Uncategorized'}</span>
                                                <h4 className="text-zinc-300 font-bold text-sm leading-snug line-clamp-3 mb-3 flex-1 group-hover:text-white transition-colors" title={ep.title}>{ep.title}</h4>
                                                <div className="flex justify-between items-center mt-auto pt-3 border-t border-zinc-800/50">
                                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest group-hover:text-[#c6a87c] transition-colors flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" /> Edit</span>
                                                    {ep.is_hidden && <span className="bg-amber-900/20 text-amber-500 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest shrink-0">Draft</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Series Manager */}
                    <div className="flex flex-col gap-6">
                        {seriesList.map((series) => {
                            const seriesEpisodes = existingEpisodes
                                .filter(ep => (ep.series_name || '') === series.name)
                                .sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));

                            if (seriesEpisodes.length === 0) return null;
                            const isExpanded = expandedLibrarySeries[series.name] ?? true;

                            return (
                                <div key={series.name || 'uncategorized'} className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                                    {/* Collapsible Series Header */}
                                    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-zinc-900/50 transition-colors" onClick={() => setExpandedLibrarySeries({ ...expandedLibrarySeries, [series.name]: !isExpanded })}>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <div className={`p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <h3 className="text-[#c6a87c] font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                                                <FolderGit2 className="w-4 h-4" /> {series.name || 'Uncategorized Episodes'}
                                            </h3>
                                            <span className="text-[10px] text-zinc-500 font-mono">({seriesEpisodes.length})</span>
                                        </div>

                                        <div className={`flex items-center gap-2 w-full sm:w-auto ${!isExpanded ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                                            <button onClick={(e) => handleAutoSortSeries(series.name, e)} disabled={loading} className="flex-1 sm:flex-none px-4 py-2 bg-purple-900/20 text-purple-400 border border-purple-900/50 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-2">
                                                <Wand2 className="w-3.5 h-3.5" /> Auto-Sort
                                            </button>
                                            <button onClick={(e) => handleSaveEpisodeOrder(series.name, e)} disabled={loading} className="flex-1 sm:flex-none px-4 py-2 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2">
                                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Publish Order
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expandable Grid */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-zinc-800">
                                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch bg-black/20">
                                                    {seriesEpisodes.map((ep, index) => (
                                                        <div key={ep.id} className="bg-[#121212] border border-zinc-800 p-5 rounded-2xl hover:border-[#c6a87c]/50 transition-all group flex flex-col h-full relative shadow-md">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pr-2 font-mono truncate">{ep.id}</span>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <div className="flex bg-zinc-900 border border-zinc-800 rounded">
                                                                        <button onClick={(e) => { e.stopPropagation(); moveEpisodeLocal(ep.id, series.name, -1); }} disabled={index === 0} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 border-r border-zinc-800" title="Move earlier"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                                                        <button onClick={(e) => { e.stopPropagation(); moveEpisodeLocal(ep.id, series.name, 1); }} disabled={index === seriesEpisodes.length - 1} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30" title="Move later"><ChevronRight className="w-3.5 h-3.5" /></button>
                                                                    </div>
                                                                    {ep.is_hidden && <span className="bg-amber-900/20 text-amber-500 border border-amber-900/50 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest">Draft</span>}
                                                                </div>
                                                            </div>
                                                            <h3 className="text-white font-bold mb-5 flex-1 leading-snug">{ep.title}</h3>
                                                            <div className="flex items-center gap-2 mt-auto">
                                                                <button onClick={() => loadEpisode(ep)} className="flex-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                                                                <button onClick={(e) => handleSoftDelete(e, ep.id)} className="p-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-500 hover:bg-red-900/20 hover:text-red-500 hover:border-red-900/50 transition-all" title="Move to Trash"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : activeView === 'replace' ? (
                // --- THE GLOBAL REPLACE COMMAND CENTER ---
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212] p-5 sm:p-6 rounded-2xl border border-zinc-800 shadow-xl">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileSearch className="w-6 h-6 text-blue-400" /> Global Replace Engine</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Surgically locate and update text across your entire database</p>
                        </div>
                        {replaceStep === 2 && (
                            <button onClick={() => setReplaceStep(1)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors bg-zinc-900 rounded-lg border border-zinc-800">Back to Settings</button>
                        )}
                    </div>

                    {replaceStep === 1 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* LEFT COLUMN: Config */}
                            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block font-bold">Find what:</label>
                                    <input type="text" value={replaceConfig.find} onChange={e => setReplaceConfig({ ...replaceConfig, find: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Ahlulbayt" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block font-bold">Replace with:</label>
                                    <input type="text" value={replaceConfig.replace} onChange={e => setReplaceConfig({ ...replaceConfig, replace: e.target.value })} className="w-full bg-blue-900/10 border border-blue-900/30 rounded-xl p-4 text-sm text-blue-100 outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Ahl al-Bayt" />
                                </div>

                                {/* Precision Toggles */}
                                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="hidden" checked={replaceConfig.matchCase} onChange={(e) => setReplaceConfig({ ...replaceConfig, matchCase: e.target.checked })} />
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${replaceConfig.matchCase ? 'bg-blue-600 border-blue-600' : 'bg-black border-zinc-700 group-hover:border-zinc-500'}`}>
                                            {replaceConfig.matchCase && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="text-xs text-zinc-300 font-bold uppercase tracking-widest">Match Case</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="hidden" checked={replaceConfig.wholeWord} onChange={(e) => setReplaceConfig({ ...replaceConfig, wholeWord: e.target.checked })} />
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${replaceConfig.wholeWord ? 'bg-blue-600 border-blue-600' : 'bg-black border-zinc-700 group-hover:border-zinc-500'}`}>
                                            {replaceConfig.wholeWord && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="text-xs text-zinc-300 font-bold uppercase tracking-widest">Whole Word</span>
                                    </label>
                                </div>

                                {/* Block Filters */}
                                <div className="border-t border-zinc-800 pt-6">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 block font-bold">Target Specific Blocks</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.keys(replaceConfig.blocks).map(type => (
                                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="hidden" checked={replaceConfig.blocks[type]} onChange={(e) => setReplaceConfig({ ...replaceConfig, blocks: { ...replaceConfig.blocks, [type]: e.target.checked } })} />
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${replaceConfig.blocks[type] ? 'bg-zinc-700 border-zinc-600' : 'bg-black border-zinc-800 group-hover:border-zinc-600'}`}>
                                                    {replaceConfig.blocks[type] && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">{type === 'h2' ? 'Headers' : type === 'p' ? 'Paragraphs' : type === 'summary' ? 'Summaries' : 'Quotes'}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-zinc-600 mt-3 leading-relaxed">Uncheck "Quotes" to protect historical Hadith & Quran verses from being altered during bulk replacements.</p>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Nested Scope Selector */}
                            <div className="bg-[#121212] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[600px]">
                                <div className="p-5 border-b border-zinc-800 bg-[#1c1c1e] flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Search Scope</h3>
                                        <span className="text-[10px] text-blue-400 font-mono mt-1">{selectedForSearch.length} Episodes Targeted</span>
                                    </div>
                                    <button onClick={() => setSelectedForSearch(selectedForSearch.length === existingEpisodes.length ? [] : existingEpisodes.map(ep => ep.id))} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold underline px-2 py-1">
                                        {selectedForSearch.length === existingEpisodes.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-3 flex-1 custom-scrollbar">
                                    {seriesList.map(series => {
                                        const epsInSeries = existingEpisodes.filter(ep => (ep.series_name || '') === series.name);
                                        if (epsInSeries.length === 0) return null;

                                        const epsSelected = epsInSeries.filter(ep => selectedForSearch.includes(ep.id));
                                        const isAllSelected = epsSelected.length === epsInSeries.length;
                                        const isPartiallySelected = epsSelected.length > 0 && !isAllSelected;
                                        const isExpanded = expandedScopeSeries[series.name];

                                        return (
                                            <div key={series.name || 'uncat'} className="mb-1">
                                                {/* Series Row */}
                                                <div className="flex items-center gap-2 p-2 hover:bg-zinc-900 rounded-lg transition-colors group">
                                                    <button onClick={() => setExpandedScopeSeries({ ...expandedScopeSeries, [series.name]: !isExpanded })} className="p-1 hover:bg-black rounded transition-colors text-zinc-500 group-hover:text-zinc-300">
                                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                                    </button>
                                                    <div className="cursor-pointer" onClick={() => toggleScopeSeries(series.name, epsInSeries)}>
                                                        {isAllSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> :
                                                            isPartiallySelected ? <div className="w-4 h-4 border border-blue-500/50 bg-blue-900/20 rounded flex items-center justify-center"><div className="w-2 h-2 bg-blue-500 rounded-sm" /></div> :
                                                                <Square className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />}
                                                    </div>
                                                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest truncate cursor-pointer select-none" onClick={() => toggleScopeSeries(series.name, epsInSeries)}>
                                                        {series.name || 'Uncategorized'} <span className="text-zinc-600 font-mono ml-1">({epsInSeries.length})</span>
                                                    </span>
                                                </div>

                                                {/* Episode Children */}
                                                {isExpanded && (
                                                    <div className="ml-8 pl-3 border-l border-zinc-800 flex flex-col gap-1 my-1">
                                                        {epsInSeries.map(ep => (
                                                            <div key={ep.id} className="flex items-center gap-3 p-1.5 hover:bg-zinc-900/50 rounded cursor-pointer group" onClick={() => toggleScopeEpisode(ep.id)}>
                                                                {selectedForSearch.includes(ep.id) ? <CheckSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <Square className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 shrink-0" />}
                                                                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 truncate select-none">{ep.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e]">
                                    <button onClick={runGlobalSearch} disabled={loading || selectedForSearch.length === 0 || !replaceConfig.find} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        {loading ? 'Scanning Database...' : 'Dry Run Preview'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- STEP 2: DRY RUN PREVIEW ---
                        <div className="flex flex-col gap-6">
                            <div className="bg-blue-900/10 border border-blue-900/30 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-blue-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Dry Run Complete</h3>
                                    <p className="text-xs text-blue-200/70 mt-1 font-mono">Found <strong className="text-white">{searchResults.length} matches</strong> across {new Set(searchResults.map(r => r.epId)).size} episodes.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer border border-zinc-700 bg-black px-3 py-2 rounded-lg hover:border-amber-500 transition-colors">
                                        <input type="checkbox" checked={replaceConfig.setToDraft} onChange={(e) => setReplaceConfig({ ...replaceConfig, setToDraft: e.target.checked })} className="accent-amber-500 w-4 h-4" />
                                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Revert affected to Draft</span>
                                    </label>
                                    <button onClick={executeGlobalReplace} disabled={isExecutingReplace || searchResults.filter(r => r.selected).length === 0} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2">
                                        {isExecutingReplace ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                        {isExecutingReplace ? 'Updating DB...' : 'Execute Replace'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {searchResults.length === 0 ? (
                                    <div className="bg-[#121212] border border-zinc-800 p-10 rounded-2xl text-center">
                                        <p className="text-zinc-500 font-bold uppercase tracking-widest">No matches found in the selected scope.</p>
                                    </div>
                                ) : (
                                    searchResults.map((result, index) => (
                                        <div key={index} className={`bg-[#121212] border transition-colors rounded-2xl p-5 ${result.selected ? 'border-zinc-700' : 'border-zinc-900 opacity-50'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] text-[#c6a87c] font-bold uppercase tracking-widest font-mono">{result.seriesName} &rarr; {result.blockType.toUpperCase()} BLOCK</span>
                                                    <span className="text-sm text-zinc-300 font-bold truncate max-w-[300px] sm:max-w-md">{result.epTitle}</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer bg-black border border-zinc-800 px-3 py-1.5 rounded hover:border-zinc-600 transition-colors">
                                                    <input type="checkbox" checked={result.selected} onChange={() => {
                                                        const newResults = [...searchResults];
                                                        newResults[index].selected = !newResults[index].selected;
                                                        setSearchResults(newResults);
                                                    }} className="accent-blue-500 w-3.5 h-3.5" />
                                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{result.selected ? 'Include' : 'Skip'}</span>
                                                </label>
                                            </div>

                                            {/* Diff View (Raw Text to show Markdown) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-4">
                                                    <span className="text-[9px] text-red-500/70 uppercase font-bold tracking-widest mb-2 block">Original</span>
                                                    <p className="text-xs text-red-200/80 font-mono whitespace-pre-wrap leading-relaxed">{result.oldText}</p>
                                                </div>
                                                <div className="bg-green-950/10 border border-green-900/30 rounded-xl p-4">
                                                    <span className="text-[9px] text-green-500/70 uppercase font-bold tracking-widest mb-2 block">Replacement</span>
                                                    <p className="text-xs text-green-200/80 font-mono whitespace-pre-wrap leading-relaxed">{result.newText}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : activeView === 'trash' ? (
                // Trash View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {trashedEpisodes.length === 0 ? <div className="col-span-full py-20 text-center text-sm font-bold uppercase tracking-widest text-zinc-600">Trash is empty</div> :
                        trashedEpisodes.map(ep => (
                            <div key={ep.id} className="bg-red-950/10 border border-red-900/30 p-5 rounded-2xl flex flex-col h-full relative">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">{ep.series_name}</span>
                                <h3 className="text-zinc-400 font-bold mt-1 mb-5 flex-1 line-through opacity-70 leading-snug">{ep.title}</h3>
                                <div className="flex items-center gap-2 mt-auto">
                                    <button onClick={() => handleRestore(ep.id)} className="flex-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Restore</button>
                                    <button onClick={() => handleHardDelete(ep.id)} className="flex-1 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-xs font-bold tracking-widest text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            ) : (
                // Editor View
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212] p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isPreviewMode ? 'bg-[#c6a87c] text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                                {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {isPreviewMode ? 'Back to Edit' : 'Live Preview'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
                            <select value={episodeData.is_hidden ? "true" : "false"} onChange={(e) => setEpisodeData({ ...episodeData, is_hidden: e.target.value === "true" })} className={`text-xs font-bold uppercase tracking-widest border rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors ${!episodeData.is_hidden ? 'bg-green-900/20 text-green-500 border-green-900/50' : 'bg-amber-900/20 text-amber-500 border-amber-900/50'}`}>
                                <option value="false">Live (Public)</option><option value="true">Hidden (Draft)</option>
                            </select>
                            <button onClick={() => setIsSmartPasteOpen(true)} className="flex-1 sm:flex-none bg-blue-900/20 text-blue-400 border border-blue-900/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:bg-blue-900/40 flex items-center justify-center gap-2"><Wand2 className="w-4 h-4" /> Smart Paste</button>
                            <button onClick={handleSave} disabled={loading} className="flex-1 sm:flex-none bg-[#c6a87c] hover:bg-[#b0956b] text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"><Save className="w-4 h-4" /> {loading ? 'Publishing...' : 'Publish'}</button>
                        </div>
                    </div>

                    {!isPreviewMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-5 sm:p-6 rounded-2xl border border-zinc-900">
                            <div className="md:col-span-2"><label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Episode URL Slug (ID)</label><input type="text" value={episodeId} onChange={e => setEpisodeId(e.target.value)} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-[#c6a87c] outline-none font-mono" /></div>
                            <div><label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Series</label><input type="text" value={episodeData.series_name} onChange={e => setEpisodeData({ ...episodeData, series_name: e.target.value })} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none" /></div>
                            <div><label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Speaker</label><input type="text" value={episodeData.speaker} onChange={e => setEpisodeData({ ...episodeData, speaker: e.target.value })} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none" /></div>
                            <div className="md:col-span-2"><label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Episode Title</label><input type="text" value={episodeData.title} onChange={e => setEpisodeData({ ...episodeData, title: e.target.value })} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none font-bold" /></div>
                            <div className="md:col-span-2"><label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">YouTube Source Link</label><div className="relative"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" /><input type="text" value={episodeData.source_link} onChange={e => setEpisodeData({ ...episodeData, source_link: e.target.value })} placeholder="https://youtu.be/..." className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-3 pl-10 pr-3 text-sm text-zinc-400 outline-none focus:border-[#c6a87c]" /></div></div>
                        </div>
                    )}

                    <div className={`rounded-2xl p-4 sm:p-6 min-h-[400px] ${isPreviewMode ? 'bg-black/20' : 'bg-[#121212] border border-zinc-800'}`}>
                        {!isPreviewMode && <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4"><h3 className="text-white font-bold tracking-widest uppercase text-sm">Transcript Blocks</h3><span className="text-[10px] text-zinc-500 font-mono">{blocks.length} Blocks</span></div>}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {blocks.map((block, index) => (
                                    <motion.div key={block.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className={`group relative transition-all ${isPreviewMode ? 'bg-transparent px-0' : `flex gap-3 rounded-xl border p-3 sm:p-4 ${block.type === 'h2' ? 'bg-zinc-900/50 border-zinc-700' : block.type === 'summary' ? 'bg-[#c6a87c]/5 border-[#c6a87c]/20' : block.type === 'quote' ? 'bg-amber-900/10 border-amber-500/20' : block.type === 'divider' ? 'bg-transparent border-dashed border-zinc-700 py-6' : 'bg-black/30 border-zinc-800'}`}`}>
                                        {!isPreviewMode ? (
                                            <>
                                                <div className="flex flex-col items-center gap-2 text-zinc-600 w-6 shrink-0 mt-1"><span className="text-[9px] font-mono font-bold">{index + 1}</span><div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="hover:text-white disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button><button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="hover:text-white disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button></div></div>
                                                <div className="flex-1 min-w-0">
                                                    {block.type === 'divider' ? (
                                                        <div className="h-full flex items-center justify-center"><div className="w-full h-px border-t border-dashed border-zinc-700"></div><span className="absolute bg-[#121212] px-3 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Section Divider</span></div>
                                                    ) : (
                                                        <><span className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 block ${block.type === 'h2' ? 'text-white' : block.type === 'summary' ? 'text-[#c6a87c]' : block.type === 'quote' ? 'text-amber-500' : 'text-zinc-500'}`}>{block.type === 'h2' ? 'Header (H2)' : block.type === 'p' ? 'Paragraph' : block.type}</span><AutoResizingTextarea value={block.text} onChange={(e) => setBlocks(blocks.map(b => b.id === block.id ? { ...b, text: e.target.value } : b))} className={`bg-transparent border-none outline-none ${block.type === 'h2' ? 'text-xl font-bold text-white' : block.type === 'summary' ? 'text-sm text-zinc-300 italic' : block.type === 'quote' ? 'text-base text-zinc-200 font-serif border-l-2 border-amber-500 pl-3' : 'text-sm text-zinc-400 font-serif leading-relaxed'}`} placeholder={`Enter ${block.type} text...`} /></>
                                                    )}
                                                </div>
                                                <button onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-start shrink-0"><Trash2 className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <div className="max-w-3xl mx-auto w-full">
                                                {block.type === 'h2' && <h2 className="text-2xl font-bold text-white mb-6 mt-10">{block.text}</h2>}
                                                {block.type === 'summary' && <div className="bg-[#1c1c1e] border-l-2 border-[#c6a87c] p-6 rounded-r-xl mb-8"><span className="text-[10px] font-bold text-[#c6a87c] uppercase tracking-[0.2em] block mb-3">Segment Summary</span><MarkdownPreview text={block.text} type="summary" /></div>}
                                                {block.type === 'quote' && <div className="border-l-2 border-[#c6a87c] pl-6 my-8 italic text-zinc-300"><MarkdownPreview text={block.text} type="quote" /></div>}
                                                {block.type === 'p' && <div className="mb-6 text-zinc-400 text-base"><MarkdownPreview text={block.text} type="p" /></div>}
                                                {block.type === 'divider' && <hr className="border-zinc-800 my-12" />}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        {!isPreviewMode && (
                            <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-zinc-800">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold w-full mb-2">Manually Add Block</span>
                                <button onClick={() => addBlock('h2')} className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors">Header</button>
                                <button onClick={() => addBlock('p')} className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors">Paragraph</button>
                                <button onClick={() => addBlock('summary')} className="px-3 py-2 bg-zinc-900 border border-[#c6a87c]/30 hover:border-[#c6a87c] rounded text-[10px] font-bold uppercase tracking-widest text-[#c6a87c] transition-colors">Summary Box</button>
                                <button onClick={() => addBlock('quote')} className="px-3 py-2 bg-zinc-900 border border-amber-500/30 hover:border-amber-500 rounded text-[10px] font-bold uppercase tracking-widest text-amber-500 transition-colors">Quote</button>
                                <button onClick={() => addBlock('divider')} className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors">Divider</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Smart Paste Modal */}
            <AnimatePresence>
                {isSmartPasteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSmartPasteOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl relative z-10 overflow-hidden">
                            <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-[#1c1c1e]">
                                <div><h3 className="text-lg font-bold text-white flex items-center gap-2"><Wand2 className="w-5 h-5 text-blue-400" /> Smart Paste Ingestor</h3></div>
                                <button onClick={() => setIsSmartPasteOpen(false)} className="p-2 text-zinc-500 hover:text-white bg-black rounded-lg border border-zinc-800"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="p-5 overflow-y-auto bg-black flex-1 flex flex-col gap-4">
                                <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Paste your raw translation text here..." className="w-full flex-1 min-h-[250px] bg-[#121212] border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 font-sans outline-none focus:border-blue-500/50 resize-none" />
                            </div>
                            <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e] flex justify-end gap-3 shrink-0">
                                <button onClick={() => setIsSmartPasteOpen(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleSmartPaste} disabled={!rawText.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2"><Wand2 className="w-4 h-4" /> Parse & Build JSON</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TranscriptEditor;