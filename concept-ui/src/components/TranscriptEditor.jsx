import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, FileText, Hash, Link as LinkIcon, User, AlertCircle, Wand2, X, ChevronDown, ChevronUp, Eye, Edit3, Library, RefreshCw, LayoutList, Clock, FolderGit2, Edit2, Check } from 'lucide-react';

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
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className={`resize-none overflow-hidden block w-full ${className}`}
            placeholder={placeholder}
            rows={1}
        />
    );
};

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
    const [rawText, setRawText] = useState('');

    // Series Renaming State
    const [editingSeriesName, setEditingSeriesName] = useState(null);
    const [newSeriesNameInput, setNewSeriesNameInput] = useState('');

    // Editor State
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [episodeId, setEpisodeId] = useState('');
    const [episodeData, setEpisodeData] = useState({
        series_name: '',
        title: '',
        speaker: '',
        source_link: '',
        is_hidden: false,
        series_priority: 0
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

            if (active.some(ep => !ep.series_name)) {
                sortedSeries.push({ name: '', order: 999 });
            }

            setSeriesList(sortedSeries);
        }
        setLoading(false);
    };

    const loadEpisode = (ep) => {
        setEpisodeId(ep.id);
        setEpisodeData({
            series_name: ep.series_name || '',
            title: ep.title || '',
            speaker: ep.speaker || '',
            source_link: ep.source_link || '',
            is_hidden: ep.is_hidden || false,
            series_priority: ep.series_priority || 0
        });
        setBlocks((ep.content || []).map(b => ({ ...b, id: Math.random() })));
        setActiveTab('editor');
    };

    const resetForm = () => {
        setEpisodeId('');
        setEpisodeData({ series_name: '', title: '', speaker: '', source_link: '', is_hidden: false, series_priority: 0 });
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

            if (text.toLowerCase().startsWith('overview')) {
                newBlocks.push({ id: Math.random(), type: 'h2', text: text });
            } else if (text.toLowerCase().startsWith('segment ')) {
                if (newBlocks.length > 0) newBlocks.push({ id: Math.random(), type: 'divider' });
                newBlocks.push({ id: Math.random(), type: 'h2', text: text });
            } else if (text.toLowerCase().startsWith('brief summary:')) {
                newBlocks.push({ id: Math.random(), type: 'summary', text: text.substring(14).trim() });
            } else if (text.toLowerCase().startsWith('quote:')) {
                newBlocks.push({ id: Math.random(), type: 'quote', text: text.substring(6).trim() });
            } else {
                newBlocks.push({ id: Math.random(), type: 'p', text: text });
            }
        });

        const existingSeries = seriesList.find(s => s.name === newMeta.series_name);
        if (existingSeries) {
            newMeta.series_priority = existingSeries.order;
        }

        setEpisodeData(newMeta);
        if (generatedId) setEpisodeId(generatedId);
        setBlocks(prev => [...prev, ...newBlocks]);
        setIsSmartPasteOpen(false);
        setRawText('');
    };

    const handleSave = async () => {
        setLoading(true);
        const cleanBlocks = blocks.map(({ id, ...rest }) => rest);
        const { error } = await supabase.from('kisa_transcripts').upsert([{
            id: episodeId,
            ...episodeData,
            content: cleanBlocks,
            is_trashed: false,
            updated_at: new Date().toISOString()
        }]);

        if (error) setStatus({ type: 'error', message: error.message });
        else {
            setStatus({ type: 'success', message: 'Published successfully!' });
            fetchLibrary();
            setTimeout(() => setActiveTab('library'), 1500);
        }
        setLoading(false);
    };

    // --- Series Management Logic ---
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
                return supabase.from('kisa_transcripts')
                    .update({ series_priority: index })
                    .eq('series_name', series.name);
            }).filter(Boolean);

            await Promise.all(updates);
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
        if (!newSeriesNameInput.trim() || newSeriesNameInput === editingSeriesName) {
            setEditingSeriesName(null);
            return;
        }

        const confirmMsg = `WARNING: Renaming "${editingSeriesName}" to "${newSeriesNameInput}" will update all episodes inside it.\n\nIf your live website uses the series name in its URL structure, those old URLs will break (404 Error).\n\nDo you want to proceed?`;

        if (!window.confirm(confirmMsg)) {
            setEditingSeriesName(null);
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('kisa_transcripts')
                .update({ series_name: newSeriesNameInput, updated_at: new Date().toISOString() })
                .eq('series_name', editingSeriesName);

            if (error) throw error;

            setStatus({ type: 'success', message: `Successfully renamed series to "${newSeriesNameInput}"` });
            setEditingSeriesName(null);
            fetchLibrary();
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
        setLoading(false);
    };

    // --- Trash Management Logic ---
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

    // Block Management Logic
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

                    {/* RECENTS SECTION (Now Collapsible & Wider Grid) */}
                    <div>
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 w-fit"
                            onClick={() => setIsRecentsOpen(!isRecentsOpen)}
                        >
                            <div className={`p-1 rounded bg-zinc-900 border border-zinc-800 transition-transform ${isRecentsOpen ? 'rotate-180' : ''}`}>
                                <ChevronDown className="w-3 h-3 text-zinc-400" />
                            </div>
                            <h3 className="text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#c6a87c]" /> Recently Edited
                            </h3>
                        </div>

                        <AnimatePresence>
                            {isRecentsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    {/* Changed grid layout here for wider, shorter cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch pb-2">
                                        <button onClick={resetForm} className="border-2 border-dashed border-zinc-800 bg-[#121212] rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 hover:border-[#c6a87c]/50 hover:bg-[#c6a87c]/5 transition-all gap-3 group min-h-[140px] shadow-sm">
                                            <Plus className="w-6 h-6 text-zinc-700 group-hover:text-[#c6a87c]" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-[#c6a87c]">New Episode</span>
                                        </button>

                                        {existingEpisodes.slice(0, 5).map(ep => (
                                            <div key={ep.id} onClick={() => loadEpisode(ep)} className="bg-[#121212] border border-zinc-800 p-4 rounded-2xl hover:border-[#c6a87c]/50 transition-all group flex flex-col h-full cursor-pointer relative shadow-sm hover:shadow-md">
                                                {/* Re-added truncating limits to prevent extreme height, but added native 'title' tooltips! */}
                                                <span className="text-[10px] text-[#c6a87c] font-bold uppercase tracking-widest mb-1.5 line-clamp-1" title={ep.series_name}>{ep.series_name || 'Uncategorized'}</span>
                                                <h4 className="text-zinc-300 font-bold text-sm leading-snug line-clamp-3 mb-3 flex-1 group-hover:text-white transition-colors" title={ep.title}>{ep.title}</h4>

                                                <div className="flex justify-between items-center mt-auto pt-3 border-t border-zinc-800/50">
                                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest group-hover:text-[#c6a87c] transition-colors flex items-center gap-1">
                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                    </span>
                                                    {ep.is_hidden && <span className="bg-amber-900/20 text-amber-500 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest shrink-0">Draft</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* COLLAPSIBLE SERIES MANAGER */}
                    {seriesList.length > 0 && (
                        <div className="bg-[#121212] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-zinc-900/50 transition-colors" onClick={() => setIsSeriesManagerOpen(!isSeriesManagerOpen)}>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className={`p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-transform ${isSeriesManagerOpen ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                                            <LayoutList className="w-4 h-4 text-[#c6a87c]" /> Live Series Order & Naming
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Click to expand to rename series or rearrange their order</p>
                                    </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleSaveSeriesOrder(e); }} disabled={loading || !isSeriesManagerOpen} className={`w-full sm:w-auto bg-blue-900/20 text-blue-400 border border-blue-900/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-900/40 transition-all flex items-center justify-center gap-2 ${!isSeriesManagerOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Publish Order
                                </button>
                            </div>

                            <AnimatePresence>
                                {isSeriesManagerOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-zinc-800">
                                        <div className="p-4 sm:p-5 flex flex-col gap-2 bg-black/20">
                                            {seriesList.map((series, index) => {
                                                if (!series.name) return null;
                                                const isEditing = editingSeriesName === series.name;
                                                return (
                                                    <div key={series.name} className="flex flex-col sm:flex-row justify-between sm:items-center bg-[#121212] border border-zinc-800 p-3 rounded-xl hover:border-zinc-700 transition-colors gap-3">

                                                        {isEditing ? (
                                                            <div className="flex flex-1 items-center gap-2">
                                                                <input type="text" value={newSeriesNameInput} onChange={(e) => setNewSeriesNameInput(e.target.value)} className="w-full bg-black border border-blue-900/50 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500" autoFocus />
                                                                <button onClick={confirmRenameSeries} disabled={loading} className="p-2 bg-green-900/20 border border-green-900/50 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                                                                <button onClick={() => setEditingSeriesName(null)} className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-1 items-center gap-3 overflow-hidden group/title cursor-text" onClick={() => startRenamingSeries(series.name)}>
                                                                <span className="text-zinc-300 font-bold truncate text-sm flex-1">{series.name}</span>
                                                                <Edit2 className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                                                            </div>
                                                        )}

                                                        {!isEditing && (
                                                            <div className="flex gap-1 shrink-0 self-end sm:self-auto">
                                                                <button onClick={() => moveSeries(index, -1)} disabled={index === 0} className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                                                                <button onClick={() => moveSeries(index, 1)} disabled={index === seriesList.length - 2} className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* EPISODES GROUPED BY SERIES */}
                    <div className="flex flex-col gap-10">
                        {seriesList.map((series) => {
                            const seriesEpisodes = existingEpisodes.filter(ep => (ep.series_name || '') === series.name);
                            if (seriesEpisodes.length === 0) return null;

                            return (
                                <div key={series.name || 'uncategorized'}>
                                    <h3 className="text-[#c6a87c] font-bold tracking-widest uppercase text-xs mb-4 border-b border-zinc-800/60 pb-3 flex items-center gap-2">
                                        <FolderGit2 className="w-4 h-4" /> {series.name || 'Uncategorized Episodes'}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                                        {seriesEpisodes.map(ep => (
                                            <div key={ep.id} className="bg-[#121212] border border-zinc-800 p-5 rounded-2xl hover:border-[#c6a87c]/50 transition-all group flex flex-col h-full relative shadow-md">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pr-2 font-mono">{ep.id}</span>
                                                    {ep.is_hidden && (
                                                        <span className="bg-amber-900/20 text-amber-500 border border-amber-900/50 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest shrink-0">Draft</span>
                                                    )}
                                                </div>
                                                <h3 className="text-white font-bold mb-5 flex-1 leading-snug">{ep.title}</h3>
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <button onClick={() => loadEpisode(ep)} className="flex-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button onClick={(e) => handleSoftDelete(e, ep.id)} className="p-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-500 hover:bg-red-900/20 hover:text-red-500 hover:border-red-900/50 transition-all" title="Move to Trash">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : activeView === 'trash' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {trashedEpisodes.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-sm font-bold uppercase tracking-widest text-zinc-600">Trash is empty</div>
                    ) : (
                        trashedEpisodes.map(ep => (
                            <div key={ep.id} className="bg-red-950/10 border border-red-900/30 p-5 rounded-2xl flex flex-col h-full relative">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">{ep.series_name}</span>
                                <h3 className="text-zinc-400 font-bold mt-1 mb-5 flex-1 line-through opacity-70 leading-snug">{ep.title}</h3>
                                <div className="flex items-center gap-2 mt-auto">
                                    <button onClick={() => handleRestore(ep.id)} className="flex-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5" /> Restore
                                    </button>
                                    <button onClick={() => handleHardDelete(ep.id)} className="flex-1 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-xs font-bold tracking-widest text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Editor Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212] p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isPreviewMode ? 'bg-[#c6a87c] text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                                {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {isPreviewMode ? 'Back to Edit' : 'Live Preview'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
                            <select
                                value={episodeData.is_hidden ? "true" : "false"}
                                onChange={(e) => setEpisodeData({ ...episodeData, is_hidden: e.target.value === "true" })}
                                className={`text-xs font-bold uppercase tracking-widest border rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors ${!episodeData.is_hidden ? 'bg-green-900/20 text-green-500 border-green-900/50' : 'bg-amber-900/20 text-amber-500 border-amber-900/50'}`}
                            >
                                <option value="false">Live (Public)</option>
                                <option value="true">Hidden (Draft)</option>
                            </select>

                            <button onClick={() => setIsSmartPasteOpen(true)} className="flex-1 sm:flex-none bg-blue-900/20 text-blue-400 border border-blue-900/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:bg-blue-900/40 flex items-center justify-center gap-2">
                                <Wand2 className="w-4 h-4" /> Smart Paste
                            </button>
                            <button onClick={handleSave} disabled={loading} className="flex-1 sm:flex-none bg-[#c6a87c] hover:bg-[#b0956b] text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                                <Save className="w-4 h-4" /> {loading ? 'Publishing...' : 'Publish'}
                            </button>
                        </div>
                    </div>

                    {status.message && (
                        <div className={`p-4 rounded-xl flex items-center text-xs font-bold tracking-widest uppercase shadow-md ${status.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : status.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-blue-900/20 text-blue-400 border border-blue-900/50'}`}>
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {status.message}
                        </div>
                    )}

                    {/* Metadata Section */}
                    {!isPreviewMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-5 sm:p-6 rounded-2xl border border-zinc-900">
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Episode URL Slug (ID)</label>
                                <input type="text" value={episodeId} onChange={e => setEpisodeId(e.target.value)} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-[#c6a87c] outline-none font-mono" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Series</label>
                                <input type="text" value={episodeData.series_name} onChange={e => setEpisodeData({ ...episodeData, series_name: e.target.value })} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Speaker</label>
                                <input type="text" value={episodeData.speaker} onChange={e => setEpisodeData({ ...episodeData, speaker: e.target.value })} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Episode Title</label>
                                <input type="text" value={episodeData.title} onChange={e => setEpisodeData({ ...episodeData, title: e.target.value })} className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none font-bold" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">YouTube Source Link</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input type="text" value={episodeData.source_link} onChange={e => setEpisodeData({ ...episodeData, source_link: e.target.value })} placeholder="https://youtu.be/..." className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-3 pl-10 pr-3 text-sm text-zinc-400 outline-none focus:border-[#c6a87c]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Blocks Section */}
                    <div className={`rounded-2xl p-4 sm:p-6 min-h-[400px] ${isPreviewMode ? 'bg-black/20' : 'bg-[#121212] border border-zinc-800'}`}>
                        {!isPreviewMode && (
                            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                                <h3 className="text-white font-bold tracking-widest uppercase text-sm">Transcript Blocks</h3>
                                <span className="text-[10px] text-zinc-500 font-mono">{blocks.length} Blocks</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <AnimatePresence>
                                {blocks.map((block, index) => (
                                    <motion.div
                                        key={block.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`group relative transition-all ${isPreviewMode ? 'bg-transparent px-0' :
                                                `flex gap-3 rounded-xl border p-3 sm:p-4 ${block.type === 'h2' ? 'bg-zinc-900/50 border-zinc-700' :
                                                    block.type === 'summary' ? 'bg-[#c6a87c]/5 border-[#c6a87c]/20' :
                                                        block.type === 'quote' ? 'bg-amber-900/10 border-amber-500/20' :
                                                            block.type === 'divider' ? 'bg-transparent border-dashed border-zinc-700 py-6' :
                                                                'bg-black/30 border-zinc-800'
                                                }`
                                            }`}
                                    >
                                        {!isPreviewMode ? (
                                            <>
                                                {/* Drag Handles & Index */}
                                                <div className="flex flex-col items-center gap-2 text-zinc-600 w-6 shrink-0 mt-1">
                                                    <span className="text-[9px] font-mono font-bold">{index + 1}</span>
                                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="hover:text-white disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                                        <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="hover:text-white disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                                    </div>
                                                </div>

                                                {/* Auto-Resizing Content Input */}
                                                <div className="flex-1 min-w-0">
                                                    {block.type === 'divider' ? (
                                                        <div className="h-full flex items-center justify-center">
                                                            <div className="w-full h-px border-t border-dashed border-zinc-700"></div>
                                                            <span className="absolute bg-[#121212] px-3 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Section Divider</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 block ${block.type === 'h2' ? 'text-white' :
                                                                    block.type === 'summary' ? 'text-[#c6a87c]' :
                                                                        block.type === 'quote' ? 'text-amber-500' :
                                                                            'text-zinc-500'
                                                                }`}>
                                                                {block.type === 'h2' ? 'Header (H2)' : block.type === 'p' ? 'Paragraph' : block.type}
                                                            </span>
                                                            <AutoResizingTextarea
                                                                value={block.text}
                                                                onChange={(e) => setBlocks(blocks.map(b => b.id === block.id ? { ...b, text: e.target.value } : b))}
                                                                className={`bg-transparent border-none outline-none ${block.type === 'h2' ? 'text-xl font-bold text-white' :
                                                                        block.type === 'summary' ? 'text-sm text-zinc-300 italic' :
                                                                            block.type === 'quote' ? 'text-base text-zinc-200 font-serif border-l-2 border-amber-500 pl-3' :
                                                                                'text-sm text-zinc-400 font-serif leading-relaxed'
                                                                    }`}
                                                                placeholder={`Enter ${block.type} text...`}
                                                            />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Delete Action */}
                                                <button onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-start shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            /* THE LIVE PREVIEW RENDERER */
                                            <div className="max-w-3xl mx-auto w-full">
                                                {block.type === 'h2' && <h2 className="text-2xl font-bold text-white mb-6 mt-10">{block.text}</h2>}
                                                {block.type === 'summary' && (
                                                    <div className="bg-[#1c1c1e] border-l-2 border-[#c6a87c] p-6 rounded-r-xl mb-8">
                                                        <span className="text-[10px] font-bold text-[#c6a87c] uppercase tracking-[0.2em] block mb-3">Segment Summary</span>
                                                        <MarkdownPreview text={block.text} type="summary" />
                                                    </div>
                                                )}
                                                {block.type === 'quote' && (
                                                    <div className="border-l-2 border-[#c6a87c] pl-6 my-8 italic text-zinc-300">
                                                        <MarkdownPreview text={block.text} type="quote" />
                                                    </div>
                                                )}
                                                {block.type === 'p' && (
                                                    <div className="mb-6 text-zinc-400 text-base">
                                                        <MarkdownPreview text={block.text} type="p" />
                                                    </div>
                                                )}
                                                {block.type === 'divider' && <hr className="border-zinc-800 my-12" />}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Add Block Manual Controls */}
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

            {/* SMART PASTE MODAL */}
            <AnimatePresence>
                {isSmartPasteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSmartPasteOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl relative z-10 overflow-hidden">

                            <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-[#1c1c1e]">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Wand2 className="w-5 h-5 text-blue-400" /> Smart Paste Ingestor
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Auto-converts raw text into JSON blocks</p>
                                </div>
                                <button onClick={() => setIsSmartPasteOpen(false)} className="p-2 text-zinc-500 hover:text-white bg-black rounded-lg border border-zinc-800">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5 overflow-y-auto bg-black flex-1 flex flex-col gap-4">
                                <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl text-xs text-blue-200/70 leading-relaxed shrink-0">
                                    <strong className="text-blue-400 block mb-2 text-sm">How to use:</strong>
                                    Paste your collated English text here. Ensure specific sections start with the exact markers:
                                    <div className="flex flex-wrap gap-2 mt-3 mb-3">
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Series:</code>
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Title:</code>
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Speaker:</code>
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Source Link:</code>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Overview:</code>
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Segment [X]:</code>
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Brief Summary:</code>
                                        <code className="bg-black/50 border border-blue-900/30 px-2 py-1 rounded text-blue-300">Quote:</code>
                                    </div>
                                    <em className="block text-blue-400/50 mt-1">Everything else will become a standard paragraph.</em>
                                </div>

                                <textarea
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    placeholder="Paste your raw translation text here..."
                                    className="w-full flex-1 min-h-[250px] bg-[#121212] border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 font-sans outline-none focus:border-blue-500/50 resize-none"
                                />
                            </div>

                            <div className="p-5 border-t border-zinc-800 bg-[#1c1c1e] flex justify-end gap-3 shrink-0">
                                <button onClick={() => setIsSmartPasteOpen(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleSmartPaste} disabled={!rawText.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2">
                                    <Wand2 className="w-4 h-4" /> Parse & Build JSON
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TranscriptEditor;