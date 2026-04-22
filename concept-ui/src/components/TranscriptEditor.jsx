import React, { useState, useEffect } from 'react';
import { Save, PlusCircle, AlertCircle, FolderOpen, Hash, Eye, EyeOff, ExternalLink, Library, Layers, Trash2, RefreshCw } from 'lucide-react';

const TranscriptEditor = ({ supabase }) => {
    const [rawJson, setRawJson] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    
    // Metadata Controls
    const [seriesName, setSeriesName] = useState('');
    const [episodeNumber, setEpisodeNumber] = useState('');
    const [isHidden, setIsHidden] = useState(false);
    
    // Track ID after save to auto-link
    const [savedId, setSavedId] = useState(null);

    // Vault Manager State
    const [vaultItems, setVaultItems] = useState([]);
    const [trashedItems, setTrashedItems] = useState([]);

    const fetchVaultItems = async () => {
        const { data, error } = await supabase
            .from('kisa_transcripts')
            .select('*')
            .eq('is_trashed', false)
            .order('series_priority', { ascending: true })
            .order('episode_number', { ascending: true });
        
        if (data && !error) {
            setVaultItems(data);
        }
    };

    const fetchTrashedItems = async () => {
        const { data, error } = await supabase
            .from('kisa_transcripts')
            .select('*')
            .eq('is_trashed', true)
            .order('series_name', { ascending: true })
            .order('episode_number', { ascending: true });
        
        if (data && !error) {
            setTrashedItems(data);
        }
    };

    useEffect(() => {
        fetchVaultItems();
        fetchTrashedItems();
    }, []);

    const handleUpdateSeriesPriority = async (targetSeriesName, newPriority) => {
        const { error } = await supabase.from('kisa_transcripts').update({ series_priority: parseInt(newPriority) || 0 }).eq('series_name', targetSeriesName);
        if (!error) fetchVaultItems();
    };

    const handleToggleSeriesVisibility = async (targetSeriesName, currentHiddenState) => {
        const { error } = await supabase.from('kisa_transcripts').update({ is_hidden: !currentHiddenState }).eq('series_name', targetSeriesName);
        if (!error) {
            fetchVaultItems();
            fetchTrashedItems();
        }
    };

    const handleTrashSeries = async (targetSeriesName) => {
        if (window.confirm('WARNING: Are you sure you want to move this ENTIRE SERIES and all its episodes to the trash?')) {
            const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: true }).eq('series_name', targetSeriesName);
            if (!error) {
                fetchVaultItems();
                fetchTrashedItems();
            }
        }
    };

    const handleUpdateEpisode = async (id, newNumber) => {
        const { error } = await supabase.from('kisa_transcripts').update({ episode_number: parseInt(newNumber) || 1 }).eq('id', id);
        if (!error) fetchVaultItems();
    };

    const handleTrashItem = async (id) => {
        if (window.confirm('Are you sure you want to move this to the trash?')) {
            const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: true }).eq('id', id);
            if (!error) {
                fetchVaultItems();
                fetchTrashedItems();
            }
        }
    };

    const handleRestoreItem = async (id) => {
        const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: false }).eq('id', id);
        if (!error) {
            fetchVaultItems();
            fetchTrashedItems();
        }
    };

    const handleIncinerateItem = async (id) => {
        if (window.confirm('WARNING: This will permanently delete this record from the database. This cannot be undone. Proceed?')) {
            const { error } = await supabase.from('kisa_transcripts').delete().eq('id', id);
            if (!error) {
                fetchTrashedItems();
            }
        }
    };

    const handleSave = async () => {
        try {
            setStatus({ type: 'loading', message: 'Parsing AI JSON...' });
            setSavedId(null);

            const parsedData = JSON.parse(rawJson);
            
            if (Array.isArray(parsedData)) {
                if (parsedData.length === 0) throw new Error("Provided JSON array is empty.");
                if (!parsedData[0].id || !parsedData[0].title || !parsedData[0].content) {
                    throw new Error("Missing required fields. Ensure 'id', 'title', and 'content' array exist in your items.");
                }
            } else {
                if (!parsedData.id || !parsedData.title || !parsedData.content) {
                    throw new Error("Missing required fields. Ensure 'id', 'title', and 'content' array exist.");
                }
            }

            setStatus({ type: 'loading', message: 'Syncing to Kisa Brain...' });

            let payload = [];
            if (Array.isArray(parsedData)) {
                payload = parsedData.map((item, index) => ({
                    id: item.id,
                    series_name: seriesName || item.series_name || item.series || 'Uncategorized',
                    episode_number: parseInt(episodeNumber) + index || index + 1,
                    title: item.title,
                    speaker: item.speaker || 'Sheikh al-Ghizzi',
                    primary_theme: item.primary_theme || 'General Theology',
                    source_link: item.source_link || null,
                    content: item.content,
                    is_hidden: isHidden
                }));
            } else {
                payload = [{
                    id: parsedData.id,
                    series_name: seriesName || parsedData.series_name || parsedData.series || 'Uncategorized',
                    episode_number: parseInt(episodeNumber) || parsedData.episode_number || 1,
                    title: parsedData.title,
                    speaker: parsedData.speaker || 'Sheikh al-Ghizzi',
                    primary_theme: parsedData.primary_theme || 'General Theology',
                    source_link: parsedData.source_link || null,
                    content: parsedData.content,
                    is_hidden: isHidden
                }];
            }

            const { error } = await supabase.from('kisa_transcripts').upsert(payload);

            if (error) throw error;

            setSavedId(Array.isArray(parsedData) ? parsedData[0].id : parsedData.id);
            setStatus({ type: 'success', message: `Successfully published ${payload.length} episode(s) to the Vault!` });
            setRawJson('');
            
            // Refresh Vault Manager UI
            fetchVaultItems();

        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    const uniqueSeriesObjs = Array.from(new Set(vaultItems.map(item => item.series_name).filter(Boolean))).map(sName => {
        const seriesGroup = vaultItems.filter(i => i.series_name === sName);
        return {
            name: sName,
            priority: seriesGroup[0]?.series_priority || 0,
            isHidden: seriesGroup[0]?.is_hidden || false
        };
    });

    return (
        <div className="flex flex-col gap-10 font-sans">
            {/* DROPZONE EDITOR */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <PlusCircle className="text-[#c6a87c] w-5 h-5" />
                            Smart JSON Dropzone
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                            Configure metadata and paste the AI-generated JSON payload to ingest into the vault.
                        </p>
                    </div>
                </div>

                {/* METADATA CONTROL PANEL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5" /> Series Name
                        </label>
                        <input 
                            type="text" 
                            placeholder="e.g. The Mahdi Paradigm"
                            value={seriesName}
                            onChange={(e) => setSeriesName(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-[#c6a87c] outline-none"
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5" /> Episode Number
                        </label>
                        <input 
                            type="number" 
                            placeholder="e.g. 5"
                            value={episodeNumber}
                            onChange={(e) => setEpisodeNumber(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-[#c6a87c] outline-none"
                        />
                    </div>
                    <div className="relative flex flex-col justify-end">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Visibility</label>
                        <button 
                            onClick={() => setIsHidden(!isHidden)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-colors ${
                                isHidden 
                                    ? 'bg-zinc-900/50 border-zinc-700 text-zinc-400' 
                                    : 'bg-[#c6a87c]/10 border-[#c6a87c]/50 text-[#c6a87c]'
                            }`}
                        >
                            {isHidden ? 'Hidden (Draft)' : 'Live (Public)'}
                            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* JSON TEXTAREA */}
                <textarea
                    value={rawJson}
                    onChange={(e) => setRawJson(e.target.value)}
                    placeholder='[ { "id": "ep1", "title": "...", "content": [ ... ] } ]'
                    className="w-full h-64 bg-black/50 border border-zinc-800 rounded-xl p-4 text-zinc-300 font-mono text-sm focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] outline-none resize-y transition-all"
                />

                {/* STATUS AND ACTIONS */}
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-1 w-full">
                        {status.message && (
                            <div className={`p-4 rounded-lg flex items-center justify-between text-sm font-medium ${
                                status.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 
                                status.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 
                                'bg-blue-900/20 text-blue-400 border border-blue-900/50'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4" />
                                    {status.message}
                                </div>
                                
                                {/* SUCCESS LIVE LINK */}
                                {status.type === 'success' && savedId && (
                                    <a 
                                        href={`/?tab=transcripts&id=${savedId}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-green-300 hover:text-white transition-colors bg-green-900/40 px-3 py-1.5 rounded-md text-xs uppercase tracking-widest"
                                    >
                                        View Live <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!rawJson || status.type === 'loading'}
                        className="flex shrink-0 items-center gap-2 bg-[#c6a87c] hover:bg-[#b0956b] text-black px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {status.type === 'loading' ? 'Syncing...' : 'Publish to Vault'}
                    </button>
                </div>
            </div>

            {/* GLOBAL SERIES RANKING UI */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="mb-6 pb-4 border-b border-zinc-800 border-dashed">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Layers className="text-[#c6a87c] w-5 h-5" />
                        Global Series Ranking
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">Control the organic render order of parent series components.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {uniqueSeriesObjs.map(series => (
                        <div key={series.name} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition-all ${series.isHidden ? 'bg-[#0a0a0a] border-zinc-900 opacity-75' : 'bg-black/50 border-zinc-800 hover:border-[#c6a87c]/30'}`}>
                            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                <span className="text-sm font-bold text-white truncate max-w-[200px]">{series.name}</span>
                                {series.isHidden && <span className="text-red-500 font-bold uppercase tracking-widest text-[9px] bg-red-900/20 px-1.5 py-0.5 rounded">Hidden</span>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest hidden xl:block">Priority Rank:</span>
                                <input 
                                    type="number"
                                    defaultValue={series.priority}
                                    onBlur={(e) => handleUpdateSeriesPriority(series.name, e.target.value)}
                                    className="w-16 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-white text-sm text-center focus:border-[#c6a87c] outline-none"
                                />
                                <button 
                                    onClick={() => handleToggleSeriesVisibility(series.name, series.isHidden)}
                                    className="p-2 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-md transition-colors"
                                    title={series.isHidden ? "Make Public" : "Hide Entire Series"}
                                >
                                    {series.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button 
                                    onClick={() => handleTrashSeries(series.name)}
                                    className="p-2 bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                                    title="Trash Entire Series"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* VAULT LIBRARY MANAGER UI */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="mb-6 pb-4 border-b border-zinc-800 border-dashed flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Library className="text-[#c6a87c] w-5 h-5" />
                            Vault Library Manager
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">Manage and sequence individual `{vaultItems.length}` episodes.</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                    {vaultItems.map((item) => (
                        <div key={item.id} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${item.is_hidden ? 'bg-[#0a0a0a] border-zinc-900 opacity-75' : 'bg-black/50 border-zinc-800 hover:border-[#c6a87c]/50'}`}>
                            <div className="flex flex-col gap-1 min-w-0 pr-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#c6a87c] truncate">{item.series_name}</span>
                                <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                                <span className="text-xs text-zinc-500">{item.id} {item.is_hidden && <span className="ml-2 text-red-500 font-bold uppercase tracking-widest text-[9px] bg-red-900/20 px-1.5 py-0.5 rounded">Hidden Draft</span>}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest hidden sm:block">Episode:</span>
                                <input 
                                    type="number"
                                    defaultValue={item.episode_number || 1}
                                    onBlur={(e) => handleUpdateEpisode(item.id, e.target.value)}
                                    className="w-16 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-white text-sm text-center focus:border-[#c6a87c] outline-none"
                                />
                                <button 
                                    onClick={() => handleTrashItem(item.id)}
                                    className="p-2 bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                                    title="Move to Trash"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TRASH BIN UI */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl mb-12">
                <div className="mb-6 pb-4 border-b border-zinc-800 border-dashed flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                            <Trash2 className="text-red-500 w-5 h-5" />
                            Trash Bin
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">Manage deleted episodes. Soft deletions can be restored.</p>
                    </div>
                </div>
                
                {trashedItems.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 font-bold uppercase tracking-widest text-sm">
                        Trash is empty
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                        {trashedItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border border-red-900/30 bg-red-900/10 rounded-xl">
                                <div className="flex flex-col gap-1 min-w-0 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 truncate">{item.series_name}</span>
                                    <h4 className="text-sm font-bold text-zinc-400 line-through truncate">{item.title}</h4>
                                    <span className="text-xs text-zinc-600">{item.id}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button 
                                        onClick={() => handleRestoreItem(item.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors text-xs font-bold uppercase tracking-widest"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> Restore
                                    </button>
                                    <button 
                                        onClick={() => handleIncinerateItem(item.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-red-900/50 text-red-400 hover:text-white hover:bg-red-600 rounded-md transition-colors text-xs font-bold uppercase tracking-widest"
                                    >
                                        Incinerate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranscriptEditor;