import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Book, Hash, ChevronDown, ChevronUp, Save, X, AlertCircle, Send, BookOpen } from 'lucide-react';

const HadithManager = ({ supabase, selectedHadithForEdit, clearSelectedHadith }) => {
    const [hadiths, setHadiths] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [showDocs, setShowDocs] = useState(false);

    // Filters
    const [bookFilter, setBookFilter] = useState('Al-Kāfi');
    const [volumeFilter, setVolumeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [chapterFilter, setChapterFilter] = useState('all');
    const [numberFilter, setNumberFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('unedited');
    const [hierarchyMap, setHierarchyMap] = useState([]);

    // Tab Router & Queue State
    const [activeTab, setActiveTab] = useState('queue');
    const [activityLog, setActivityLog] = useState([]);

    // Collaborative Flagging Mode
    const [reviewQueueMode, setReviewQueueMode] = useState(false);
    const [assignmentFilter, setAssignmentFilter] = useState('ALL ASSIGNMENTS');

    // Inline Editor State
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [formData, setFormData] = useState({});

    // Macro Analytics Engine
    const [metrics, setMetrics] = useState({
        total: 0,
        completed: 0,
        matrix: {},
        sparkline: [],
        velocity: 0,
        etaDays: 0
    });
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [isMatrixOpen, setIsMatrixOpen] = useState(false);

    // INTERCEPT CLICKS FROM CMS DASHBOARD
    useEffect(() => {
        if (selectedHadithForEdit) {
            const loadSpecificHadith = async () => {
                setLoading(true);
                const { data, error } = await supabase.from('kisa_hadiths').select('*').eq('id', selectedHadithForEdit).single();
                if (data && !error) {
                    setReviewQueueMode(true);
                    setActiveTab('queue');
                    setHadiths([data]);

                    setExpandedRowId(data.id);
                    setFormData({
                        id: data.id,
                        manual_chain: data.manual_chain || '',
                        manual_body: data.manual_body || data.english_text || data.englishText || '',
                        arabicText: data.arabic_text || data.arabicText || '',
                        is_flagged: data.is_flagged || false,
                        assigned_to: data.assigned_to || 'UNASSIGNED',
                        internal_notes: data.internal_notes || ''
                    });

                    if (clearSelectedHadith) clearSelectedHadith();
                }
                setLoading(false);
            };
            loadSpecificHadith();
        }
    }, [selectedHadithForEdit, supabase, clearSelectedHadith]);

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

    // Crunch Analytics Data Engine
    useEffect(() => {
        const fetchMetrics = async () => {
            setMetricsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('kisa_hadiths')
                    .select('id, book, volume, manual_body, updated_at')
                    .is('is_trashed', false)
                    .limit(50000);

                if (error) throw error;
                if (!data) return;

                let total = data.length;
                let completed = 0;
                let matrix = {};
                let recentEdits = [];

                const now = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);

                data.forEach(row => {
                    const isCompleted = row.manual_body !== null;
                    if (isCompleted) completed++;

                    const b = row.book || 'Unknown Book';
                    const v = row.volume || 'Unknown Volume';
                    if (!matrix[b]) matrix[b] = {};
                    if (!matrix[b][v]) matrix[b][v] = { total: 0, completed: 0 };

                    matrix[b][v].total++;
                    if (isCompleted) matrix[b][v].completed++;

                    if (isCompleted && row.updated_at) {
                        const updatedDate = new Date(row.updated_at);
                        if (updatedDate >= sevenDaysAgo && updatedDate <= now) {
                            recentEdits.push(updatedDate);
                        }
                    }
                });

                let sparkline = Array(7).fill(0);
                recentEdits.forEach(date => {
                    const diffTime = Math.abs(now - date);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 7) {
                        sparkline[6 - diffDays]++;
                    }
                });

                const totalRecentEdits = sparkline.reduce((a, b) => a + b, 0);
                const velocity = totalRecentEdits / 7;
                const etaDays = velocity > 0 ? Math.ceil((total - completed) / velocity) : Infinity;

                setMetrics({
                    total,
                    completed,
                    matrix,
                    sparkline,
                    velocity: velocity.toFixed(1),
                    etaDays
                });

            } catch (error) {
                console.error("Macro Analytics Fetch Error:", error);
            } finally {
                setMetricsLoading(false);
            }
        };

        fetchMetrics();
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

            if (reviewQueueMode) {
                query = query.is('is_flagged', true);
                if (assignmentFilter !== 'ALL ASSIGNMENTS') {
                    query = query.eq('assigned_to', assignmentFilter);
                }
            } else {
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
            }

            query = query.is('is_trashed', false);
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

    useEffect(() => {
        if (activeTab === 'queue' && !selectedHadithForEdit) {
            const bounce = setTimeout(() => {
                fetchHadiths();
            }, 500);
            return () => clearTimeout(bounce);
        }
    }, [bookFilter, volumeFilter, categoryFilter, chapterFilter, numberFilter, statusFilter, activeTab, reviewQueueMode, assignmentFilter, selectedHadithForEdit]);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivity();
        }
    }, [activeTab]);

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('kisa_hadiths')
                .select('*')
                .or('manual_body.not.is.null,is_trashed.eq.true')
                .order('updated_at', { ascending: false, nullsFirst: false })
                .limit(50);
            if (error) throw error;
            setActivityLog(data || []);
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to fetch activity log.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSoftDelete = async (id) => {
        setStatus({ type: 'loading', message: 'Moving to Trash...' });
        try {
            const { error } = await supabase
                .from('kisa_hadiths')
                .update({ is_trashed: true, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            setStatus({ type: 'success', message: `Moved Hadith #${id} to Trash.` });
            setExpandedRowId(null);
            if (activeTab === 'queue') fetchHadiths();
            if (activeTab === 'activity') fetchActivity();
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    const handleRestore = async (id) => {
        setStatus({ type: 'loading', message: 'Restoring from Trash...' });
        try {
            const { error } = await supabase
                .from('kisa_hadiths')
                .update({ is_trashed: false, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            setStatus({ type: 'success', message: `Restored Hadith #${id}.` });
            fetchActivity();
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

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
                arabicText: item.arabic_text || item.arabicText || '',
                is_flagged: item.is_flagged || false,
                assigned_to: item.assigned_to || 'UNASSIGNED',
                internal_notes: item.internal_notes || ''
            });
            setStatus({ type: '', message: '' });
        }
    };

    const handleFormChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // The Magic Wand Auto-Formatter
    const handleMagicWand = () => {
        if (!formData.manual_body) return;
        let text = formData.manual_body;

        text = text.replace(/\(as\)/gi, '(a.s.)');
        text = text.replace(/\(a\.s\)/gi, '(a.s.)');
        text = text.replace(/\(saw\)/gi, '(s.a.w.)');
        text = text.replace(/\ballah\b/gi, 'Allah');
        text = text.replace(/\bprophet\b/gi, 'Prophet');
        text = text.replace(/  +/g, ' ');

        setFormData(prev => ({ ...prev, manual_body: text }));
        setStatus({ type: 'success', message: 'Magic Wand applied! Review the changes.' });
    };

    // Save as Draft Logic
    const handleSaveAsDraft = () => {
        setFormData(prev => ({
            ...prev,
            is_flagged: true,
            assigned_to: 'MASTER ADMIN',
            internal_notes: prev.internal_notes ? `[WIP DRAFT] ${prev.internal_notes}` : '[WIP DRAFT] Saved to finish later.'
        }));
        setTimeout(handleUpdate, 100);
    };

    const handleUpdate = async () => {
        setStatus({ type: 'loading', message: 'Syncing to Kisa Brain...' });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || 'Admin';
            const formattedUser = userEmail.split('@')[0];

            const { data, error } = await supabase
                .from('kisa_hadiths')
                .update({
                    manual_chain: formData.manual_chain,
                    manual_body: formData.manual_body,
                    arabicText: formData.arabicText,
                    is_flagged: formData.is_flagged || false,
                    assigned_to: formData.is_flagged ? formData.assigned_to : null,
                    internal_notes: formData.internal_notes || null,
                    last_edited_by: userEmail,
                    updated_at: new Date().toISOString()
                })
                .eq('id', formData.id)
                .select();

            if (error) throw new Error(error.message);

            // Write to Activity Ledger
            await supabase.from('cms_activity_logs').insert([{
                user_name: formattedUser,
                action_type: formData.is_flagged ? 'Flagged/Drafted Hadith' : 'Cleaned Hadith',
                details: `Saved Volume ${data[0].volume} #${data[0].hadith_number}`
            }]);

            setStatus({ type: 'success', message: `Successfully updated Hadith #${formData.id}` });
            setExpandedRowId(null);
            setFormData({});

            if (activeTab === 'queue') fetchHadiths();
            if (activeTab === 'activity') fetchActivity();

        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    const handleSaveAndNext = async () => {
        setStatus({ type: 'loading', message: 'Syncing & Loading Next...' });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || 'Unknown Admin';
            const formattedUser = userEmail.split('@')[0];

            const { data, error } = await supabase
                .from('kisa_hadiths')
                .update({
                    manual_chain: formData.manual_chain,
                    manual_body: formData.manual_body,
                    arabicText: formData.arabicText,
                    is_flagged: formData.is_flagged || false,
                    assigned_to: formData.is_flagged ? formData.assigned_to : null,
                    internal_notes: formData.internal_notes || null,
                    last_edited_by: userEmail,
                    updated_at: new Date().toISOString()
                })
                .eq('id', formData.id)
                .select();

            if (error) throw new Error("Supabase Error: " + (error.message || JSON.stringify(error)));
            if (!data || data.length === 0) throw new Error("Empty write response from database.");

            // Write to Activity Ledger
            await supabase.from('cms_activity_logs').insert([{
                user_name: formattedUser,
                action_type: formData.is_flagged ? 'Flagged/Drafted Hadith' : 'Cleaned Hadith',
                details: `Saved Volume ${data[0].volume} #${data[0].hadith_number}`
            }]);

            const currentArray = activeTab === 'queue' ? hadiths : activityLog;
            const currentIndex = currentArray.findIndex(h => h.id === formData.id);
            const nextItem = currentArray[currentIndex + 1];

            if (nextItem) {
                setStatus({ type: 'success', message: `Saved #${formData.id}. Next loaded.` });
                setExpandedRowId(nextItem.id);
                setFormData({
                    id: nextItem.id,
                    manual_chain: nextItem.manual_chain || '',
                    manual_body: nextItem.manual_body || nextItem.english_text || nextItem.englishText || '',
                    arabicText: nextItem.arabic_text || nextItem.arabicText || '',
                    is_flagged: nextItem.is_flagged || false,
                    assigned_to: nextItem.assigned_to || 'UNASSIGNED',
                    internal_notes: nextItem.internal_notes || ''
                });
            } else {
                setStatus({ type: 'success', message: `Saved #${formData.id}. Queue Complete!` });
                setExpandedRowId(null);
                setFormData({});
            }

            if (activeTab === 'queue') fetchHadiths();
            if (activeTab === 'activity') fetchActivity();

        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    return (
        <div className="flex flex-col gap-6">

            {/* 1. Header Area */}
            <div className="flex flex-col border-b border-zinc-800 pb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                    <Book className="w-6 h-6 sm:w-8 sm:h-8 text-[#c6a87c]" />
                    The Hadith Library
                </h2>
                <p className="text-zinc-400 mt-2 text-sm sm:text-base">Manage the foundational narrations database. Search and edit core texts directly.</p>
            </div>

            {/* 2. How-To Toggle & Panel */}
            <div className="shrink-0">
                <button
                    onClick={() => setShowDocs(!showDocs)}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-[#c6a87c] transition-colors py-2"
                >
                    <BookOpen className="w-3.5 h-3.5" />
                    How to use this page
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showDocs ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {showDocs && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: 'clip' }}
                        >
                            <div className="bg-[#14171f] border border-zinc-800/80 rounded-2xl p-6 lg:p-8 mb-4 w-full mt-2">
                                <h3 className="text-lg font-bold text-white mb-1">Welcome to The Hadith Library <span className="text-zinc-500 font-normal text-sm">(The Core Database)</span></h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mt-2">This is the absolute heart of Al-Kisa. Here, we review, clean, and verify the foundational traditions of the Ahl al-Bayt. Your work here directly builds the database that the public will read.</p>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-5 mt-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">1. What are we doing here?</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li>We are processing over 14,000 raw, unedited narrations.</li>
                                            <li>Raw database imports often have messy OCR text, missing honorifics, or typos. Our job is to polish these texts into beautiful, highly readable, and accurate traditions.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">3. Tracking our progress</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li>The progress bar at the top tracks the total percentage of the library that has been cleaned.</li>
                                            <li>The "Velocity" metric shows how many edits the team is averaging per day, projecting our completion date.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">2. The editing workflow</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li><strong className="text-zinc-200">Standard Queue:</strong> This is the frontline. Filter by "Un-Edited Inbox" to find raw hadiths that need their first polish.</li>
                                            <li><strong className="text-zinc-200">Review Queue:</strong> If a hadith needs a second opinion or senior approval before going live, it gets pushed here.</li>
                                            <li><strong className="text-zinc-200">Filters:</strong> Use the drop-downs to target specific books (e.g., Al-Kafi), volumes, or chapters.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">4. How does this affect the live site?</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li><strong className="text-zinc-200">Direct Public Reading:</strong> The exact text formatting, punctuation, and capitalization you save here is exactly what the user reads on the front-end site.</li>
                                            <li><strong className="text-zinc-200">Search Accuracy:</strong> If a word is misspelled here, the search engine might fail to find it. Cleaning the text ensures the AI retrieves the right Hadith for the user's question.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. Metrics Dashboard */}
            {!metricsLoading && metrics.total > 0 && (
                <div className="bg-[#121212] border border-zinc-800 rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 shrink-0">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-white">{((metrics.completed / metrics.total) * 100).toFixed(1)}% <span className="text-zinc-500 font-light text-lg sm:text-xl">Comp</span></div>
                                    <div className="text-[10px] sm:text-xs font-mono text-[#c6a87c] tracking-widest uppercase mt-1 sm:mt-2">
                                        {metrics.completed.toLocaleString()} / {metrics.total.toLocaleString()} Narrations
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end justify-end">
                                    <div className="text-xs sm:text-sm text-zinc-300 font-bold tracking-wide">
                                        {metrics.etaDays === Infinity ? 'ETA: Need more data' : `Est: ${metrics.etaDays.toLocaleString()} Days`}
                                    </div>
                                    <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mt-1 bg-zinc-900 px-2 py-1 rounded inline-block w-max">
                                        Vel: {metrics.velocity} / Day
                                    </div>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-black border border-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#c6a87c]/30 via-[#c6a87c]/80 to-[#c6a87c] transition-all duration-1000 ease-out"
                                    style={{ width: `${(metrics.completed / metrics.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="w-full lg:w-64 h-16 sm:h-20 flex items-end justify-between gap-1 sm:gap-1.5 pt-2 sm:pt-4">
                            {metrics.sparkline.map((count, i) => {
                                const maxCount = Math.max(...metrics.sparkline, 1);
                                const heightPercentage = (count / maxCount) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                        <div
                                            className="w-full bg-[#c6a87c] rounded-t-[2px] transition-all duration-500 ease-out opacity-40 group-hover:opacity-100"
                                            style={{ height: `${heightPercentage}%`, minHeight: count > 0 ? '6px' : '2px' }}
                                        ></div>
                                        <div className="absolute -top-8 bg-[#1c1c1e] shadow-xl border border-zinc-700 text-white text-[9px] sm:text-[10px] font-mono px-2 sm:px-3 py-1 sm:py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity whitespace-nowrap">
                                            {count} edits
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMatrixOpen(!isMatrixOpen)}
                        className="w-full flex items-center justify-center gap-2 mt-6 pt-5 border-t border-zinc-800/50 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-[#c6a87c] transition-colors"
                    >
                        {isMatrixOpen ? 'Hide Library Matrix' : 'View Library Matrix'}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMatrixOpen ? 'rotate-180 text-[#c6a87c]' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isMatrixOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-6 pt-6">
                                    <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#c6a87c] mb-4 flex items-center justify-between">
                                        Active Volumes
                                        <span className="text-[9px] sm:text-[10px] bg-zinc-900 px-2 py-1 rounded text-zinc-500">Auto-Archives at 100%</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                                        {Object.entries(metrics.matrix).map(([bookName, volumes]) => {
                                            return Object.entries(volumes).map(([volName, stats]) => {
                                                const pct = (stats.completed / stats.total) * 100;
                                                if (pct >= 100) return null;
                                                return (
                                                    <div key={`active-${bookName}-${volName}`} className="bg-black/30 border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl p-4 sm:p-5 shadow-sm">
                                                        <div className="flex justify-between items-center mb-3 gap-2">
                                                            <div className="text-sm font-semibold text-zinc-300 truncate" title={bookName}>{bookName}</div>
                                                            <div className="text-[9px] sm:text-[10px] font-mono text-[#c6a87c] bg-[#c6a87c]/10 border border-[#c6a87c]/20 px-2 py-1 rounded whitespace-nowrap shrink-0">Vol {volName}</div>
                                                        </div>
                                                        <div className="flex justify-between items-end mb-2">
                                                            <span className="text-xs font-bold text-white">{pct.toFixed(0)}%</span>
                                                            <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono tracking-widest">{stats.completed} / {stats.total}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#c6a87c] opacity-80" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })}
                                    </div>

                                    <details className="mt-8 sm:mt-10 group border border-zinc-800/60 rounded-xl overflow-hidden bg-black/40 transition-all">
                                        <summary className="cursor-pointer p-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors flex items-center justify-between list-none">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500/70 group-open:text-green-500" />
                                                Completed Archives Vault
                                            </div>
                                            <div className="text-[9px] sm:text-[10px] bg-green-900/20 border border-green-900/40 text-green-400 px-2 py-1 rounded">Locked</div>
                                        </summary>
                                        <div className="p-4 sm:p-5 border-t border-zinc-800/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 bg-[#121212]">
                                            {Object.entries(metrics.matrix).map(([bookName, volumes]) => {
                                                return Object.entries(volumes).map(([volName, stats]) => {
                                                    const pct = (stats.completed / stats.total) * 100;
                                                    if (pct < 100) return null;
                                                    return (
                                                        <div key={`archived-${bookName}-${volName}`} className="border border-green-900/40 bg-green-900/10 rounded-lg p-3 flex justify-between items-center transition-opacity hover:opacity-80">
                                                            <div className="truncate text-[10px] sm:text-[11px] text-zinc-400 font-semibold pr-2" title={`${bookName} Volume ${volName}`}>{bookName} v{volName}</div>
                                                            <span className="text-[8px] sm:text-[9px] font-bold text-green-400 bg-green-900/40 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Mastered</span>
                                                        </div>
                                                    );
                                                });
                                            })}
                                        </div>
                                    </details>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* 4. Tab Router Buttons */}
            <div className="flex bg-[#121212] p-1 rounded-xl border border-zinc-800 shadow-xl overflow-hidden w-full mt-2">
                <button
                    onClick={() => { setActiveTab('queue'); setExpandedRowId(null); setStatus({ type: '', message: '' }); }}
                    className={`flex-1 px-4 sm:px-6 py-3 sm:py-2.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap rounded-lg ${activeTab === 'queue' ? 'bg-zinc-800/80 text-[#c6a87c] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Editing Queue
                </button>
                <button
                    onClick={() => { setActiveTab('activity'); setExpandedRowId(null); setStatus({ type: '', message: '' }); }}
                    className={`flex-1 px-4 sm:px-6 py-3 sm:py-2.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap rounded-lg ${activeTab === 'activity' ? 'bg-zinc-800/80 text-[#c6a87c] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Activity Log
                </button>
            </div>

            {/* 5. Filter Toggle Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-2">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setReviewQueueMode(false)} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${!reviewQueueMode ? 'bg-[#c6a87c] text-black shadow-lg shadow-[#c6a87c]/20' : 'bg-[#121212] border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}>Standard</button>
                    <button onClick={() => setReviewQueueMode(true)} className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 ${reviewQueueMode ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'bg-[#121212] border border-zinc-800 text-amber-500/50 hover:text-amber-500 hover:border-amber-900/50'}`}>Review <AlertCircle className="w-3.5 h-3.5 hidden sm:block" /></button>
                </div>

                {reviewQueueMode && (
                    <select
                        value={assignmentFilter}
                        onChange={(e) => setAssignmentFilter(e.target.value)}
                        className="w-full sm:w-auto bg-[#1c1c1e] text-amber-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-amber-900/50 rounded-lg px-4 py-2 outline-none shadow-inner cursor-pointer"
                    >
                        <option value="ALL ASSIGNMENTS">All Assignments</option>
                        <option value="UNASSIGNED">Unassigned</option>
                        <option value="MASTER ADMIN">Master Admin</option>
                        <option value="CO-ADMIN (PENDING)">Co-Admin (Pending)</option>
                    </select>
                )}
            </div>

            {/* Dropdown Filters */}
            {!reviewQueueMode && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-[#121212] p-4 sm:p-5 border border-zinc-800 rounded-2xl shadow-xl mt-1">
                    <select
                        value={bookFilter}
                        onChange={(e) => { setBookFilter(e.target.value); setVolumeFilter('all'); setCategoryFilter('all'); setChapterFilter('all'); }}
                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-2 sm:px-3 text-xs sm:text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer truncate"
                    >
                        <option value="all">All Sources</option>
                        {availableBooks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select
                        value={volumeFilter}
                        onChange={(e) => { setVolumeFilter(e.target.value); setCategoryFilter('all'); setChapterFilter('all'); }}
                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-2 sm:px-3 text-xs sm:text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer truncate"
                    >
                        <option value="all">All Volumes</option>
                        {availableVolumes.map(v => <option key={v} value={v}>Vol {v}</option>)}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setChapterFilter('all'); }}
                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-2 sm:px-3 text-xs sm:text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer truncate col-span-2 md:col-span-1"
                    >
                        <option value="all">All Categories</option>
                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={chapterFilter}
                        onChange={(e) => setChapterFilter(e.target.value)}
                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-2 sm:px-3 text-xs sm:text-sm text-white focus:border-[#c6a87c] outline-none cursor-pointer truncate col-span-2 md:col-span-1"
                    >
                        <option value="all">All Chapters</option>
                        {availableChapters.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <input
                        type="text"
                        placeholder="Hadith #"
                        value={numberFilter}
                        onChange={(e) => setNumberFilter(e.target.value)}
                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 px-2 sm:px-3 text-xs sm:text-sm text-white focus:border-[#c6a87c] outline-none shadow-inner"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-[#1c1c1e] font-bold border border-zinc-700/50 rounded-xl py-2 px-2 sm:px-3 text-[11px] sm:text-sm text-[#c6a87c] focus:border-[#c6a87c] outline-none cursor-pointer truncate"
                    >
                        <option value="unedited">Un-Edited Inbox</option>
                        <option value="edited">Edited Vault</option>
                        <option value="all">All Hadiths</option>
                    </select>
                </div>
            )}

            {status.message && (
                <div className={`p-3 sm:p-4 rounded-xl flex items-center text-xs sm:text-sm font-medium shadow-md ${status.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' :
                    status.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' :
                        'bg-blue-900/20 text-blue-400 border border-blue-900/50'
                    }`}>
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 shrink-0" />
                    {status.message}
                </div>
            )}

            {/* Main Table / Editor Render Block */}
            {(() => {
                const renderEditorPanel = (item) => (
                    <div
                        className="col-span-12 bg-[#1c1c1e] border-y border-[#c6a87c]/30 shadow-inner p-4 sm:p-6 lg:p-10 cursor-default focus:outline-none overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveAndNext();
                            }
                        }}
                        tabIndex={-1}
                    >
                        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6 border-b border-zinc-800 pb-3 sm:pb-4">
                            <span className="bg-[#c6a87c] text-black text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow">EDITING</span>
                            <span className="text-zinc-300 font-mono text-xs sm:text-sm truncate max-w-full">
                                {item.book} <span className="hidden sm:inline">•</span><br className="sm:hidden" /> Vol {item.volume} • Num {item.hadith_number}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 sm:gap-4 bg-amber-900/10 border border-amber-500/30 p-3 sm:p-5 rounded-xl mb-6 sm:mb-8 shadow-inner">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2 cursor-pointer w-full sm:w-auto">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_flagged || false}
                                        onChange={(e) => handleFormChange('is_flagged', e.target.checked)}
                                        className="w-4 h-4 accent-amber-500 cursor-pointer shrink-0"
                                    />
                                    Flag for Review
                                </label>
                                {formData.is_flagged && (
                                    <select
                                        value={formData.assigned_to || 'UNASSIGNED'}
                                        onChange={(e) => handleFormChange('assigned_to', e.target.value)}
                                        className="w-full sm:w-auto bg-black/50 border border-amber-500/30 text-amber-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded px-3 py-2 outline-none cursor-pointer hover:border-amber-500/60 transition-colors"
                                    >
                                        <option value="UNASSIGNED">Unassigned</option>
                                        <option value="MASTER ADMIN">Master Admin</option>
                                        <option value="CO-ADMIN (PENDING)">Co-Admin (Pending)</option>
                                    </select>
                                )}
                            </div>
                            <textarea
                                value={formData.internal_notes || ''}
                                onChange={(e) => handleFormChange('internal_notes', e.target.value)}
                                placeholder="Leave context or questions for the other admin..."
                                className="w-full bg-black/40 border border-amber-500/20 hover:border-amber-500/50 focus:border-amber-500/80 rounded-lg p-2.5 sm:p-3 text-zinc-300 font-sans text-xs sm:text-sm resize-y outline-none transition-all"
                                rows={2}
                            />
                        </div>

                        {/* Stacks to 1 column on mobile, 2 columns on desktop */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

                            {/* Left Side: English Fields */}
                            <div className="flex flex-col gap-6 sm:gap-8 min-w-0">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#c6a87c]">EDIT CHAIN OF NARRATORS</label>
                                    <textarea
                                        value={formData.manual_chain}
                                        onChange={(e) => handleFormChange('manual_chain', e.target.value)}
                                        className="w-full bg-black/40 border border-[#c6a87c]/50 hover:border-[#c6a87c] focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] rounded-lg p-3 sm:p-4 text-zinc-300 font-sans text-xs sm:text-sm resize-y outline-none transition-all shadow-sm break-words"
                                        rows={3}
                                    />
                                </div>

                                <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-3 sm:p-5 mb-1 sm:mb-2">
                                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                        <div className="bg-blue-900/20 p-2 sm:p-2.5 rounded-lg shrink-0 text-blue-400 self-start">
                                            ✨
                                        </div>
                                        <div className="flex-1 w-full">
                                            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">Magic Wand Tool</h4>
                                            <p className="text-[10px] sm:text-xs text-zinc-400 mb-3 sm:mb-4 leading-relaxed">
                                                Instantly clean up messy OCR spacing, standardize honorifics like <span className="text-zinc-300 bg-black px-1 rounded">(as)</span> to <span className="text-zinc-300 bg-black px-1 rounded">(a.s.)</span>, and capitalize core nouns like <strong>Allah</strong>.
                                                <br /><span className="text-amber-500/80 mt-1 block">Note: This does not save the text. You can review the changes below.</span>
                                            </p>
                                            <button
                                                onClick={handleMagicWand}
                                                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-900/50 rounded-lg text-[10px] sm:text-xs font-bold tracking-wider transition-colors shadow-sm flex justify-center"
                                            >
                                                Run Auto-Format Now
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#c6a87c]">EDIT ENGLISH MATN (CORE TEXT)</label>
                                    <textarea
                                        value={formData.manual_body}
                                        onChange={(e) => handleFormChange('manual_body', e.target.value)}
                                        className="w-full bg-black/40 border border-[#c6a87c]/50 hover:border-[#c6a87c] focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] rounded-lg p-3 sm:p-5 text-zinc-100 font-serif leading-relaxed text-sm sm:text-base resize-y min-h-[200px] sm:min-h-[250px] outline-none transition-all shadow-sm break-words"
                                    />
                                </div>
                            </div>

                            {/* Right Side: Arabic Text */}
                            <div className="flex flex-col gap-6 sm:gap-8 min-w-0">
                                <div className="flex flex-col gap-2 flex-1">
                                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#c6a87c] text-left lg:text-right">EDIT ARABIC TEXT</label>
                                    <textarea
                                        value={formData.arabicText}
                                        onChange={(e) => handleFormChange('arabicText', e.target.value)}
                                        dir="rtl"
                                        className="w-full h-full bg-black/40 border border-[#c6a87c]/50 hover:border-[#c6a87c] focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] rounded-lg p-3 sm:p-5 text-zinc-200 font-arabic text-lg sm:text-xl leading-[2.2] resize-y min-h-[200px] sm:min-h-[250px] outline-none transition-all shadow-sm flex-1 break-words"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-[#c6a87c]/20 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-4">
                            <div className="flex justify-center sm:justify-start">
                                <button
                                    onClick={() => handleSoftDelete(item.id)}
                                    disabled={status.type === 'loading'}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors text-center border border-transparent hover:border-red-900/50"
                                >
                                    Trash Hadith
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => handleExpandRow(item)}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs text-zinc-400 hover:text-white transition-colors text-center border border-transparent hover:border-zinc-700 rounded-md"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSaveAsDraft}
                                    disabled={status.type === 'loading'}
                                    className="w-full sm:w-auto justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs px-4 sm:px-6 py-3 rounded-md shadow-lg transition-all flex items-center gap-2 border border-zinc-600"
                                >
                                    Save as Draft
                                </button>

                                <button
                                    onClick={handleSaveAndNext}
                                    disabled={status.type === 'loading'}
                                    title="Cmd/Ctrl + Enter"
                                    className="w-full sm:w-auto justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs px-4 sm:px-6 py-3 rounded-md shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 border border-transparent hover:border-zinc-500"
                                >
                                    Save & Next
                                </button>

                                <button
                                    onClick={handleUpdate}
                                    disabled={status.type === 'loading'}
                                    className={`w-full sm:w-auto justify-center ${formData.is_flagged ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-500/20' : 'bg-[#c6a87c] hover:bg-[#b0956b] text-black'} font-bold uppercase tracking-widest text-[10px] sm:text-xs px-4 sm:px-8 py-3 rounded-md shadow-lg transition-all flex items-center gap-2 disabled:opacity-50`}
                                >
                                    {formData.is_flagged ? <Send className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />}
                                    <span className="truncate">{status.type === 'loading' ? 'Syncing...' : formData.is_flagged ? 'Send to Review' : 'Save Hadith'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );

                return (
                    activeTab === 'queue' ? (
                        <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh]">
                            {/* Hidden on mobile, shown on desktop */}
                            <div className="hidden sm:grid sm:grid-cols-12 gap-4 p-4 bg-zinc-900/50 border-b border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-500 sticky top-0 z-10">
                                <div className="col-span-1 hidden sm:block">ID</div>
                                <div className="col-span-3 sm:col-span-2">Source</div>
                                <div className="col-span-2 sm:col-span-1 text-center">Vol</div>
                                <div className="col-span-2 sm:col-span-1 text-center">Num</div>
                                <div className="col-span-4 sm:col-span-6">Matn Preview</div>
                                <div className="col-span-1 text-right"></div>
                            </div>

                            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                                {loading && hadiths.length === 0 ? (
                                    <div className="flex justify-center items-center h-40 text-zinc-500 font-mono text-sm tracking-widest uppercase">Fetching Kisa Brain...</div>
                                ) : hadiths.length === 0 ? (
                                    <div className="flex justify-center items-center h-40 text-zinc-600 font-bold tracking-widest uppercase text-sm">No Hadiths Found</div>
                                ) : (
                                    hadiths.map((item) => (
                                        <React.Fragment key={item.id}>
                                            <div
                                                className={`flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 border-b border-zinc-800/50 sm:items-center transition-colors cursor-pointer ${expandedRowId === item.id ? 'bg-[#1a1a1c] border-l-[3px] border-l-[#c6a87c]' :
                                                    item.is_flagged ? 'bg-amber-900/10 hover:bg-amber-900/20 border-l-[3px] border-l-amber-500' :
                                                        'hover:bg-zinc-900/50 hover:border-l-[3px] hover:border-l-zinc-700 border-l-[3px] border-l-transparent'
                                                    }`}
                                                onClick={() => handleExpandRow(item)}
                                            >
                                                {/* Mobile Header Box */}
                                                <div className="flex justify-between items-center sm:hidden w-full mb-1">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="text-sm font-semibold text-zinc-300 truncate">{item.book}</span>
                                                        <span className="text-[10px] font-mono text-zinc-400 bg-black/50 border border-zinc-700/50 rounded px-1.5 py-0.5 shrink-0">V{item.volume || '-'}</span>
                                                        <span className="text-[10px] font-mono text-zinc-400 bg-black/50 border border-zinc-700/50 rounded px-1.5 py-0.5 shrink-0">#{item.hadith_number || item.num || item.number || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center shrink-0">
                                                        {item.is_flagged && <AlertCircle className="w-4 h-4 text-amber-500 mr-2" />}
                                                        {expandedRowId === item.id ? <ChevronUp className="w-5 h-5 text-[#c6a87c]" /> : <ChevronDown className="w-5 h-5 text-zinc-600" />}
                                                    </div>
                                                </div>

                                                {/* Desktop Columns */}
                                                <div className="col-span-1 hidden sm:block text-xs font-mono text-zinc-600">{item.id.substring(0, 6)}...</div>
                                                <div className="col-span-2 hidden sm:block text-sm font-semibold text-zinc-300 truncate">{item.book}</div>
                                                <div className="col-span-1 hidden sm:block text-xs text-zinc-500 text-center bg-black/30 rounded py-1">{item.volume || '-'}</div>
                                                <div className="col-span-1 hidden sm:block text-xs text-zinc-500 text-center bg-black/30 rounded py-1">{item.hadith_number || item.num || item.number || '-'}</div>

                                                {/* Preview text (both mobile and desktop) */}
                                                <div className="col-span-12 sm:col-span-6 flex flex-col justify-center w-full min-w-0">
                                                    <div className="text-xs sm:text-sm text-zinc-400 truncate pr-0 sm:pr-4">{item.englishText || 'No translation provided.'}</div>
                                                    {item.internal_notes && (
                                                        <div className="mt-2 bg-amber-900/20 border-l-[3px] border-amber-500 p-2 rounded-r-lg w-full sm:max-w-[80%]">
                                                            <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
                                                                <span className="text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-widest">Internal Note</span>
                                                                <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono truncate">By {item.last_edited_by?.split('@')[0] || 'Unknown'} | {item.assigned_to || 'Unassigned'}</span>
                                                            </div>
                                                            <p className="text-[11px] sm:text-xs text-amber-100/80 italic line-clamp-2">{item.internal_notes}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Desktop Chevron */}
                                                <div className="col-span-1 hidden sm:flex justify-end items-center">
                                                    {item.is_flagged && <AlertCircle className="w-5 h-5 text-amber-500 mr-3" />}
                                                    {expandedRowId === item.id ? <ChevronUp className="w-5 h-5 text-[#c6a87c]" /> : <ChevronDown className="w-5 h-5 text-zinc-600" />}
                                                </div>
                                            </div>
                                            {expandedRowId === item.id && renderEditorPanel(item)}
                                        </React.Fragment>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh]">
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                                {loading && activityLog.length === 0 ? (
                                    <div className="flex justify-center items-center h-40 text-zinc-500 font-mono text-sm tracking-widest uppercase">Fetching Activity Log...</div>
                                ) : activityLog.length === 0 ? (
                                    <div className="flex justify-center items-center h-40 text-zinc-600 font-bold tracking-widest uppercase text-sm">No Recent Activity Recorded</div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {activityLog.map(item => (
                                            <React.Fragment key={item.id}>
                                                <div
                                                    onClick={() => !item.is_trashed && handleExpandRow(item)}
                                                    className={`p-3 sm:p-4 border rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 transition-all ${item.is_trashed ? 'bg-red-900/5 border-red-900/30' :
                                                        expandedRowId === item.id ? 'bg-[#1a1a1c] border-[#c6a87c]' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                                                            <span className="text-zinc-300 font-mono text-xs sm:text-sm truncate">{item.book} • Vol {item.volume} • Num {item.hadith_number}</span>
                                                            {item.is_trashed ? (
                                                                <span className="bg-red-900/30 text-red-500 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow border border-red-900/50 shrink-0">TRASHED</span>
                                                            ) : (
                                                                <span className="bg-[#c6a87c]/10 text-[#c6a87c] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow border border-[#c6a87c]/30 shrink-0">EDITED</span>
                                                            )}
                                                        </div>
                                                        <div className={`text-xs sm:text-sm truncate w-full ${item.is_trashed ? 'text-zinc-600 line-through' : 'text-zinc-400'}`}>
                                                            {item.englishText || 'No translation provided.'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:ml-4 border-t border-zinc-800/50 sm:border-0 pt-2 sm:pt-0 shrink-0">
                                                        <span className="text-[10px] sm:text-xs text-zinc-600 font-mono whitespace-nowrap">
                                                            {item.updated_at ? new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                        {item.is_trashed ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRestore(item.id); }}
                                                                className="bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors border border-zinc-600 shadow"
                                                            >
                                                                Restore
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center">
                                                                {expandedRowId === item.id ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#c6a87c]" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {expandedRowId === item.id && !item.is_trashed && renderEditorPanel(item)}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                );
            })()}
        </div>
    );
};

export default HadithManager;