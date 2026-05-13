import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, PlusCircle, AlertCircle, FolderOpen, Hash, Eye, EyeOff, ExternalLink, Library, Layers, Trash2, RefreshCw, BookOpen, ChevronDown } from 'lucide-react';

const TranscriptEditor = ({ supabase, selectedEpisodeForEdit, onEditEpisode }) => {
    const [rawJson, setRawJson] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [showDocs, setShowDocs] = useState(false);

    // Metadata Controls
    const [seriesName, setSeriesName] = useState('');
    const [episodeNumber, setEpisodeNumber] = useState('');
    const [isHidden, setIsHidden] = useState(false);

    // Track ID after save to auto-link
    const [savedId, setSavedId] = useState(null);

    // Vault Manager State
    const [vaultItems, setVaultItems] = useState([]);
    const [trashedItems, setTrashedItems] = useState([]);

    // Luminous Studio State
    const [parsedItems, setParsedItems] = useState([]);
    const [selectionParams, setSelectionParams] = useState(null);
    const [history, setHistory] = useState([]);
    const [previewTheme, setPreviewTheme] = useState('sepia');
    const [activeTab, setActiveTab] = useState('build');
    const [canvasTexts, setCanvasTexts] = useState({});

    const textareaRefs = useRef({});

    // Seamless Canvas Utilities
    const joinBlocksToString = (blocks) => {
        if (!Array.isArray(blocks)) return '';
        return blocks.map(b => {
            const text = b.text !== undefined ? b.text : (b.content || '');
            if (b.type === 'h2') return `## ${text}`;
            if (b.type === 'quote') return `> ${text}`;
            if (b.type === 'summary') return `✨ ${text}`;
            if (b.type === 'divider') return `---`;
            return text;
        }).join('\n\n');
    };

    const parseStringToBlocks = (text) => {
        if (!text) return [];
        return text.split('\n\n').map(blockText => {
            const trimmed = blockText.trim();
            if (trimmed.startsWith('## ')) return { type: 'h2', content: blockText.substring(3).trimStart() };
            if (trimmed.startsWith('> ')) return { type: 'quote', content: blockText.substring(2).trimStart() };
            if (trimmed.startsWith('✨ ')) return { type: 'summary', content: blockText.substring(2).trimStart() };
            if (trimmed === '---') return { type: 'divider', content: '' };
            return { type: 'paragraph', content: blockText };
        });
    };

    useEffect(() => {
        if (selectedEpisodeForEdit) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSeriesName(selectedEpisodeForEdit.series_name || '');
            setEpisodeNumber(selectedEpisodeForEdit.episode_number || '');
            setIsHidden(selectedEpisodeForEdit.is_hidden || false);

            let parsedContent = [];
            try {
                parsedContent = typeof selectedEpisodeForEdit.content === 'string'
                    ? JSON.parse(selectedEpisodeForEdit.content)
                    : selectedEpisodeForEdit.content;
                if (!Array.isArray(parsedContent)) parsedContent = [parsedContent];
            } catch {
                parsedContent = [];
            }

            setParsedItems([{
                id: selectedEpisodeForEdit.id,
                series_name: selectedEpisodeForEdit.series_name,
                episode_number: selectedEpisodeForEdit.episode_number,
                title: selectedEpisodeForEdit.title,
                speaker: selectedEpisodeForEdit.speaker,
                primary_theme: selectedEpisodeForEdit.primary_theme,
                source_link: selectedEpisodeForEdit.source_link,
                content: parsedContent
            }]);

            const textString = joinBlocksToString(parsedContent);
            setCanvasTexts({ 0: textString });

            // Force recalculation of height after text is set
            setTimeout(() => {
                if (textareaRefs.current[0]) {
                    textareaRefs.current[0].style.height = '0px';
                    textareaRefs.current[0].style.height = `${textareaRefs.current[0].scrollHeight}px`;
                }
            }, 50);
        }
    }, [selectedEpisodeForEdit]);

    const pushHistory = (state) => {
        setHistory(prev => [...prev, structuredClone(state)]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const newHistory = [...history];
        const previousState = newHistory.pop();
        setHistory(newHistory);
        setParsedItems(previousState);

        // Sync text and height
        const initialTexts = {};
        previousState.forEach((ep, i) => {
            initialTexts[i] = joinBlocksToString(ep.content);
        });
        setCanvasTexts(initialTexts);

        setTimeout(() => {
            Object.values(textareaRefs.current).forEach(ref => {
                if (ref) {
                    ref.style.height = '0px';
                    ref.style.height = `${ref.scrollHeight}px`;
                }
            });
        }, 50);
    };

    useEffect(() => {
        const handleGlobalClick = () => {
            if (selectionParams) setSelectionParams(null);
        };
        window.addEventListener('mousedown', handleGlobalClick);
        return () => window.removeEventListener('mousedown', handleGlobalClick);
    }, [selectionParams]);

    useEffect(() => {
        try {
            if (!rawJson.trim()) {
                setParsedItems([]);
                return;
            }
            const parsed = JSON.parse(rawJson);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            setParsedItems(items);

            const initialTexts = {};
            items.forEach((ep, i) => {
                initialTexts[i] = joinBlocksToString(ep.content);
            });
            setCanvasTexts(initialTexts);
            setHistory([]);

            setTimeout(() => {
                Object.values(textareaRefs.current).forEach(ref => {
                    if (ref) {
                        ref.style.height = '0px';
                        ref.style.height = `${ref.scrollHeight}px`;
                    }
                });
            }, 50);
        } catch {
            // Wait for valid JSON
        }
    }, [rawJson]);

    // Canvas Handlers
    const handleCanvasChange = (itemIndex, newText, element) => {
        setCanvasTexts(prev => ({ ...prev, [itemIndex]: newText }));
        const updated = [...parsedItems];
        updated[itemIndex].content = parseStringToBlocks(newText);
        setParsedItems(updated);

        // Dynamic Height recalculation
        if (element) {
            element.style.height = '0px';
            element.style.height = `${element.scrollHeight}px`;
        }
    };

    const applyFormatting = (prefix, suffix) => {
        pushHistory(parsedItems);
        if (!selectionParams) return;
        const { itemIndex, start, end } = selectionParams;

        const currentText = canvasTexts[itemIndex] || '';
        const before = currentText.substring(0, start);
        const selected = currentText.substring(start, end);
        const after = currentText.substring(end);

        const newText = before + prefix + selected + suffix + after;

        setCanvasTexts(prev => ({ ...prev, [itemIndex]: newText }));
        const updated = [...parsedItems];
        updated[itemIndex].content = parseStringToBlocks(newText);
        setParsedItems(updated);

        setSelectionParams(null);

        setTimeout(() => {
            if (textareaRefs.current[itemIndex]) {
                textareaRefs.current[itemIndex].style.height = '0px';
                textareaRefs.current[itemIndex].style.height = `${textareaRefs.current[itemIndex].scrollHeight}px`;
            }
        }, 50);
    };

    const renderSimulatorFormatting = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[\[.*?\]\]|\~\~.*?\~\~)/g);

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={index} className="italic font-editorial">{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('[[') && part.endsWith(']]')) {
                return <span key={index} className="text-[#c6a87c] font-bold pb-[1px] cursor-pointer hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-1">{part.slice(2, -2)}</span>;
            }
            if (part.startsWith('~~') && part.endsWith('~~')) {
                return <span key={index}>{part.slice(2, -2)}</span>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    const fetchVaultItems = async () => {
        const { data, error } = await supabase
            .from('kisa_transcripts')
            .select('*')
            .eq('is_trashed', false)
            .order('series_priority', { ascending: true })
            .order('episode_number', { ascending: true });

        if (data && !error) setVaultItems(data);
    };

    const fetchTrashedItems = async () => {
        const { data, error } = await supabase
            .from('kisa_transcripts')
            .select('*')
            .eq('is_trashed', true)
            .order('series_name', { ascending: true })
            .order('episode_number', { ascending: true });

        if (data && !error) setTrashedItems(data);
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
        if (!error) { fetchVaultItems(); fetchTrashedItems(); }
    };

    const handleTrashSeries = async (targetSeriesName) => {
        if (window.confirm('WARNING: Are you sure you want to move this ENTIRE SERIES and all its episodes to the trash?')) {
            const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: true }).eq('series_name', targetSeriesName);
            if (!error) { fetchVaultItems(); fetchTrashedItems(); }
        }
    };

    const handleUpdateEpisode = async (id, newNumber) => {
        const { error } = await supabase.from('kisa_transcripts').update({ episode_number: parseInt(newNumber) || 1 }).eq('id', id);
        if (!error) fetchVaultItems();
    };

    const handleTrashItem = async (id) => {
        if (window.confirm('Are you sure you want to move this to the trash?')) {
            const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: true }).eq('id', id);
            if (!error) { fetchVaultItems(); fetchTrashedItems(); }
        }
    };

    const handleRestoreItem = async (id) => {
        const { error } = await supabase.from('kisa_transcripts').update({ is_trashed: false }).eq('id', id);
        if (!error) { fetchVaultItems(); fetchTrashedItems(); }
    };

    const handleIncinerateItem = async (id) => {
        if (window.confirm('WARNING: This will permanently delete this record from the database. This cannot be undone. Proceed?')) {
            const { error } = await supabase.from('kisa_transcripts').delete().eq('id', id);
            if (!error) { fetchTrashedItems(); }
        }
    };

    const handleSave = async () => {
        try {
            setStatus({ type: 'loading', message: 'Publishing active session payload...' });
            setSavedId(null);

            if (parsedItems.length === 0) throw new Error("No active parsed content available to save.");

            const payload = parsedItems.map((item, index) => ({
                id: item.id,
                series_name: seriesName || item.series_name || item.series || 'Uncategorized',
                episode_number: parseInt(episodeNumber) + index || item.episode_number || index + 1,
                title: item.title,
                speaker: item.speaker || 'Sheikh al-Ghizzi',
                primary_theme: item.primary_theme || 'General Theology',
                source_link: item.source_link || null,
                content: parseStringToBlocks(canvasTexts[index] || ''),
                is_hidden: isHidden
            }));

            setStatus({ type: 'loading', message: 'Syncing to Kisa Brain...' });

            const { data, error } = await supabase.from('kisa_transcripts').upsert(payload, { onConflict: 'id' }).select();

            if (error) throw new Error("Supabase Error: " + (error.message || JSON.stringify(error)));
            if (!data || data.length === 0) throw new Error("Empty write response from database.");

            setSavedId(payload[0].id);
            setStatus({ type: 'success', message: `Successfully published ${payload.length} episode(s) to the Vault!` });

            fetchVaultItems();

        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    const uniqueSeriesObjs = Array.from(new Set(vaultItems.map(item => item.series_name).filter(Boolean))).map(sName => {
        const seriesGroup = vaultItems.filter(i => i.series_name === sName);
        return { name: sName, priority: seriesGroup[0]?.series_priority || 0, isHidden: seriesGroup[0]?.is_hidden || false };
    });

    return (
        <div className="flex flex-col gap-6 font-sans">
            {/* FLOATING TOOLBAR */}
            {selectionParams && (
                <div
                    style={{ top: selectionParams.top, left: selectionParams.left, transform: 'translate(-50%, -100%)' }}
                    className="fixed z-50 flex items-center gap-1 bg-[#222] border border-zinc-700 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-lg p-1.5"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormatting('**', '**'); }} className="px-3 py-1.5 hover:bg-zinc-700 rounded text-sm text-zinc-300 font-bold transition-colors" title="Bold">B</button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormatting('*', '*'); }} className="px-3 py-1.5 hover:bg-zinc-700 rounded text-sm text-zinc-300 italic transition-colors font-serif" title="Italic">I</button>
                    <div className="w-[1px] h-5 bg-zinc-700 mx-1"></div>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormatting('[[', ']]'); }} className="px-3 py-1.5 hover:bg-zinc-700 rounded text-xs text-blue-400 font-bold tracking-widest uppercase transition-colors" title="Force Ontology Tooltip">Bridge</button>
                    <button onMouseDown={(e) => { e.preventDefault(); applyFormatting('~~', '~~'); }} className="px-3 py-1.5 hover:bg-zinc-700 rounded text-xs text-zinc-400 font-bold tracking-widest uppercase transition-colors" title="Hide False Tooltip Match">Mute</button>
                </div>
            )}

            {/* TOP ACTIONS BAR (Consolidated Header) */}
            <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                    {/* How-To Toggle */}
                    <button onClick={() => setShowDocs(!showDocs)} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-[#c6a87c] transition-colors py-2 w-max">
                        <BookOpen className="w-3.5 h-3.5" />
                        How to use this page
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showDocs ? 'rotate-180' : ''}`} />
                    </button>

                    {/* COMPACT TAB TOGGLE BAR */}
                    <div className="flex bg-[#121212] border border-zinc-800 rounded-lg p-1 shadow-md w-max">
                        <button onClick={() => setActiveTab('build')} className={`px-5 py-2 rounded-md font-bold text-xs tracking-widest uppercase transition-all ${activeTab === 'build' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>✏️ Build Mode</button>
                        <button onClick={() => setActiveTab('preview')} className={`px-5 py-2 rounded-md font-bold text-xs tracking-widest uppercase transition-all ${activeTab === 'preview' ? 'bg-[#c6a87c]/20 text-[#c6a87c] shadow-sm border border-[#c6a87c]/30' : 'text-zinc-500 hover:text-zinc-300'}`}>👁️ Live Preview</button>
                    </div>
                </div>

                {/* HOW TO DOCS PANEL */}
                <AnimatePresence>
                    {showDocs && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'clip' }}>
                            <div className="bg-[#14171f] border border-zinc-800/80 rounded-2xl p-6 lg:p-8 mb-2 w-full">
                                <h3 className="text-lg font-bold text-white mb-1">Welcome to Transcript Studio <span className="text-zinc-500 font-normal text-sm">(The Commentary Engine)</span></h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mt-2">This is where modern scholarship meets ancient texts. We use this studio to ingest the translated transcripts of Sheikh al-Ghizzi's lectures, converting raw subtitle data into readable, interactive articles.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* FULL WIDTH WORKSPACE */}
            <div className="flex flex-col w-full gap-8">

                {/* BUILD MODE: INGESTION, METADATA & CANVAS */}
                {activeTab === 'build' && (
                    <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><PlusCircle className="text-[#c6a87c] w-5 h-5" /> The Luminous Studio</h3>
                                <p className="text-sm text-zinc-400 mt-1">Paste raw JSON syntax below, or load an episode from the Vault.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="relative">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Series Name</label>
                                <input type="text" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3.5 text-white text-base focus:border-[#c6a87c] outline-none transition-all" />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Hash className="w-4 h-4" /> Episode Number</label>
                                <input type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3.5 text-white text-base focus:border-[#c6a87c] outline-none transition-all" />
                            </div>
                            <div className="relative flex flex-col justify-end">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Visibility</label>
                                <button onClick={() => setIsHidden(!isHidden)} className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-base font-medium transition-colors ${isHidden ? 'bg-zinc-900/50 border-zinc-700 text-zinc-400' : 'bg-[#c6a87c]/10 border-[#c6a87c]/50 text-[#c6a87c]'}`}>
                                    {isHidden ? 'Hidden (Draft)' : 'Live (Public)'}
                                    {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {parsedItems.length === 0 ? (
                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                placeholder='[ { "id": "ep1", "title": "...", "content": [ ... ] } ]'
                                className="w-full h-[60vh] bg-black/50 border border-zinc-800 rounded-xl p-6 text-zinc-300 font-mono text-sm focus:border-[#c6a87c] outline-none resize-none transition-all"
                            />
                        ) : (
                            <div className="flex flex-col gap-12 w-full">
                                {parsedItems.map((episode, itemIndex) => (
                                    <div key={itemIndex} className="bg-black/30 border border-[#c6a87c]/30 rounded-2xl shadow-lg overflow-hidden flex flex-col h-[70vh]">
                                        <div className="p-6 sm:p-8 bg-[#1a1a1a] border-b border-[#c6a87c]/20 shrink-0">
                                            <h4 className="text-[#c6a87c] font-bold text-xl flex items-center justify-between">
                                                <span>{episode.title}</span>
                                                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">{episode.id}</span>
                                            </h4>
                                        </div>
                                        <div className="flex-grow p-6 sm:p-10 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                                            <textarea
                                                ref={(el) => textareaRefs.current[itemIndex] = el}
                                                value={canvasTexts[itemIndex] || ''}
                                                onFocus={() => pushHistory(parsedItems)}
                                                onChange={(e) => {
                                                    setSelectionParams(null);
                                                    handleCanvasChange(itemIndex, e.target.value, e.target);
                                                }}
                                                onMouseUp={(e) => {
                                                    const start = e.target.selectionStart;
                                                    const end = e.target.selectionEnd;
                                                    if (start !== end) {
                                                        e.stopPropagation();
                                                        setSelectionParams({ itemIndex, start, end, top: e.clientY - 45, left: e.clientX });
                                                    }
                                                }}
                                                className="w-full bg-transparent border-0 outline-none resize-none whitespace-pre-wrap overflow-hidden font-editorial antialiased text-zinc-300"
                                                style={{ fontSize: '18px', lineHeight: 1.85 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* LIVE PREVIEW TAB */}
                {activeTab === 'preview' && (
                    <div className={`h-[75vh] overflow-y-auto rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] transition-colors duration-300 border border-zinc-800/80 flex flex-col w-full ${previewTheme === 'dark' ? 'bg-[#000000] text-zinc-300' : previewTheme === 'sepia' ? 'bg-[#FDFBF7] text-zinc-900' : 'bg-white text-black'}`} style={{ scrollbarWidth: 'thin', scrollbarColor: previewTheme === 'dark' ? '#3f3f46 transparent' : '#d4d4d8 transparent' }}>
                        <div className={`sticky top-0 z-10 p-4 border-b backdrop-blur-md flex justify-end shrink-0 ${previewTheme === 'dark' ? 'border-zinc-800/20' : 'border-black/5'}`}>
                            <div className={`flex items-center rounded-lg p-1 border ${previewTheme === 'dark' ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                                {['light', 'sepia', 'dark'].map(t => (
                                    <button key={t} onClick={() => setPreviewTheme(t)} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${previewTheme === t ? (previewTheme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black') : 'text-zinc-500 hover:text-zinc-400'}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                        <div className={`p-8 lg:p-20 antialiased max-w-4xl mx-auto w-full ${previewTheme === 'sepia' || previewTheme === 'light' ? 'font-editorial' : 'font-sans'}`} style={{ fontSize: '18px', lineHeight: 1.85 }}>
                            {parsedItems.map((episode, itemIndex) => (
                                <div key={`preview-${itemIndex}`}>
                                    {(episode.content || []).map((block, idx) => {
                                        const textValue = block.text !== undefined ? block.text : (block.content || '');
                                        if (block.type === 'h2') return <h2 key={idx} className={`font-bold mt-14 mb-6 tracking-tight ${previewTheme === 'dark' ? 'text-white' : 'text-zinc-900'}`} style={{ fontSize: '23.4px', lineHeight: 1.3 }}>{renderSimulatorFormatting(textValue)}</h2>;
                                        if (block.type === 'summary') return (
                                            <div key={idx} className={`border-l-4 border-[#c6a87c] p-6 sm:p-8 my-10 rounded-r-xl shadow-sm ${previewTheme === 'dark' ? 'bg-[#1c1c1e]' : 'bg-zinc-50'}`}>
                                                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#c6a87c] mb-3">Segment Summary</span>
                                                <div className={`font-medium font-editorial ${previewTheme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`} style={{ fontSize: '16px', lineHeight: 1.7 }}>{renderSimulatorFormatting(textValue)}</div>
                                            </div>
                                        );
                                        if (block.type === 'quote') return <blockquote key={idx} className={`pl-6 sm:pl-8 py-2 my-10 border-l-[3px] border-[#c6a87c] font-medium italic font-editorial ${previewTheme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`} style={{ fontSize: '20.7px', lineHeight: 1.6 }}>"{renderSimulatorFormatting(textValue)}"</blockquote>;
                                        if (block.type === 'divider') return <div key={idx} className="flex justify-center py-10"><span className={`w-12 h-1 rounded-full ${previewTheme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300'}`}></span></div>;
                                        return <div key={idx} className={`mb-6 text-left ${previewTheme === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>{renderSimulatorFormatting(textValue)}</div>;
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* UNIVERSAL ACTION BAR */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#121212] border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full">
                    <div className="flex-1 w-full">
                        {status.message && (
                            <div className={`p-4 rounded-lg flex items-center justify-between text-sm font-medium ${status.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : status.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-blue-900/20 text-blue-400 border border-blue-900/50'}`}>
                                <div className="flex items-center gap-3"><AlertCircle className="w-4 h-4" />{status.message}</div>
                                {status.type === 'success' && savedId && (
                                    <a href={`/?tab=transcripts&id=${savedId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-green-300 hover:text-white transition-colors bg-green-900/40 px-3 py-1.5 rounded-md text-xs uppercase tracking-widest">
                                        View Live <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                        {parsedItems.length > 0 && (
                            <>
                                <button onClick={handleUndo} disabled={history.length === 0} className="px-6 py-4 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md">Undo</button>
                                <button onClick={() => { setParsedItems([]); setRawJson(''); setHistory([]); if (onEditEpisode) onEditEpisode(null); }} className="px-6 py-4 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-red-900/40 hover:text-red-400 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors shadow-md">Clear</button>
                            </>
                        )}
                        <button onClick={handleSave} disabled={parsedItems.length === 0 || status.type === 'loading'} className="flex shrink-0 items-center gap-3 bg-[#c6a87c] hover:bg-[#b0956b] text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-[0_0_20px_rgba(198,168,124,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save className="w-5 h-5" />{status.type === 'loading' ? 'Syncing...' : 'Publish to Vault'}
                        </button>
                    </div>
                </div>
            </div>

            {/* GLOBAL SERIES RANKING UI */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="mb-6 pb-4 border-b border-zinc-800 border-dashed">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Layers className="text-[#c6a87c] w-5 h-5" />Global Series Ranking</h3>
                </div>
                <div className="flex flex-col gap-3 w-full">
                    {uniqueSeriesObjs.map(series => (
                        <div key={series.name} className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg transition-all gap-4 w-full ${series.isHidden ? 'bg-[#0a0a0a] border-zinc-900 opacity-75' : 'bg-black/50 border-zinc-800 hover:border-[#c6a87c]/30'}`}>
                            <div className="flex-1 font-semibold text-white whitespace-normal pr-4 flex items-center gap-2">
                                <span>{series.name}</span>
                                {series.isHidden && <span className="text-red-500 font-bold uppercase tracking-widest text-[9px] bg-red-900/20 px-1.5 py-0.5 rounded shrink-0">Hidden</span>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <input type="number" defaultValue={series.priority} onBlur={(e) => handleUpdateSeriesPriority(series.name, e.target.value)} className="w-16 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-white text-sm text-center outline-none" />
                                <button onClick={() => handleToggleSeriesVisibility(series.name, series.isHidden)} className="p-2 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white rounded-md transition-colors">{series.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                <button onClick={() => handleTrashSeries(series.name)} className="p-2 bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* VAULT LIBRARY MANAGER UI */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="mb-6 pb-4 border-b border-zinc-800 border-dashed"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Library className="text-[#c6a87c] w-5 h-5" />Vault Library Manager</h3></div>
                <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 w-full" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                    {vaultItems.map((item) => (
                        <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg transition-all gap-4 w-full ${item.is_hidden ? 'bg-[#0a0a0a] border-zinc-900 opacity-75' : 'bg-black/50 border-zinc-800 hover:border-[#c6a87c]/50'}`}>
                            <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#c6a87c]">{item.series_name}</span>
                                <h4 className="font-medium text-white">{item.title}</h4>
                                <span className="text-xs text-zinc-500">{item.id} {item.is_hidden && <span className="ml-2 text-red-500 font-bold uppercase tracking-widest text-[9px] bg-red-900/20 px-1.5 py-0.5 rounded">Hidden Draft</span>}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <input type="number" defaultValue={item.episode_number || 1} onBlur={(e) => handleUpdateEpisode(item.id, e.target.value)} className="w-16 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-white text-sm text-center outline-none" />
                                <button onClick={() => onEditEpisode && onEditEpisode(item)} className="p-2 sm:px-4 sm:py-2 bg-blue-900/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-md transition-colors flex items-center gap-1 font-bold text-xs uppercase tracking-widest shrink-0">✏️ Edit</button>
                                <button onClick={() => handleTrashItem(item.id)} className="p-2 bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TRASH BIN UI */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl mb-12">
                <div className="mb-6 pb-4 border-b border-zinc-800 border-dashed"><h3 className="text-xl font-bold text-red-500 flex items-center gap-2"><Trash2 className="text-red-500 w-5 h-5" />Trash Bin</h3></div>
                {trashedItems.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 font-bold uppercase tracking-widest text-sm">Trash is empty</div>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                        {trashedItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border border-red-900/30 bg-red-900/10 rounded-xl">
                                <div className="flex flex-col gap-1 min-w-0 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 truncate">{item.series_name}</span>
                                    <h4 className="text-sm font-bold text-zinc-400 line-through truncate">{item.title}</h4>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button onClick={() => handleRestoreItem(item.id)} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-md transition-colors text-xs font-bold uppercase tracking-widest"><RefreshCw className="w-3.5 h-3.5" /> Restore</button>
                                    <button onClick={() => handleIncinerateItem(item.id)} className="flex items-center gap-2 px-3 py-2 bg-red-900/50 text-red-400 hover:text-white rounded-md transition-colors text-xs font-bold uppercase tracking-widest">Incinerate</button>
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