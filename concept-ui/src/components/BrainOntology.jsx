import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, X, Edit, Plus, Link as LinkIcon, Network, Save, AlertCircle, LayoutGrid, List, BookOpen, ChevronDown } from 'lucide-react';

const BrainOntology = ({ supabase }) => {
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorState, setErrorState] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [showDocs, setShowDocs] = useState(false);
    
    // Editor Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeConcept, setActiveConcept] = useState(null);
    const [formStatus, setFormStatus] = useState({ type: '', message: '' });

    // Mini-Forms State for New Additions
    const [newSynonym, setNewSynonym] = useState({ variant_text: '', language: 'English', weight: 1.0 });
    const [newRelation, setNewRelation] = useState({ target_concept_id: '', relation_type: 'requires' });

    const fetchOntology = async () => {
        setLoading(true);
        setErrorState(null);
        try {
            const { data, error } = await supabase
                .from('ontology_concepts')
                .select('*, ontology_synonyms(*), outgoing_relations:ontology_relations!ontology_relations_source_concept_id_fkey(*)')
                .order('domain', { ascending: true })
                .order('transliteration', { ascending: true });
                
            if (error) {
                console.error("Supabase PostgREST Error:", error);
                setErrorState(error);
            }
            setConcepts(data || []);
        } catch (error) {
            console.error("Fetch Error:", error);
            setErrorState({ message: error.message, details: 'JS catch block' });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOntology();
    }, [supabase]);

    const handleOpenDrawer = (concept) => {
        setActiveConcept(concept);
        setFormStatus({ type: '', message: '' });
        setNewSynonym({ variant_text: '', language: 'English', weight: 1.0 });
        setNewRelation({ target_concept_id: '', relation_type: 'requires' });
        setIsDrawerOpen(true);
    };

    const handleNewConcept = () => {
        setActiveConcept({
            transliteration: '',
            primary_arabic: '',
            root_letters: '',
            primary_english: '',
            domain: '',
            definition: '',
            ontology_synonyms: [],
            outgoing_relations: []
        });
        setFormStatus({ type: '', message: '' });
        setNewSynonym({ variant_text: '', language: 'English', weight: 1.0 });
        setNewRelation({ target_concept_id: '', relation_type: 'requires' });
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => setActiveConcept(null), 300);
    };

    const handleSaveConcept = async () => {
        const isNew = !activeConcept.id;
        setFormStatus({ type: 'loading', message: isNew ? 'Initializing Concept...' : 'Syncing Concept...' });
        try {
            const payload = {
                transliteration: activeConcept.transliteration,
                definition: activeConcept.definition,
                primary_english: activeConcept.primary_english,
                domain: activeConcept.domain,
                primary_arabic: activeConcept.primary_arabic,
                root_letters: activeConcept.root_letters
            };

            if (isNew) {
                const { data, error } = await supabase
                    .from('ontology_concepts')
                    .insert([payload])
                    .select();
                if (error) throw error;
                setFormStatus({ type: 'success', message: 'New concept initialized.' });
                // Update activeConcept with the returned ID so synonyms/relations can attach
                if (data && data[0]) setActiveConcept({ ...activeConcept, ...data[0] });
            } else {
                const { error } = await supabase
                    .from('ontology_concepts')
                    .update(payload)
                    .eq('id', activeConcept.id);
                if (error) throw error;
                setFormStatus({ type: 'success', message: 'Concept successfully updated.' });
            }
            fetchOntology();
        } catch (err) {
            setFormStatus({ type: 'error', message: err.message });
        }
    };

    const handleAddSynonym = async () => {
        if (!newSynonym.variant_text) return;
        setFormStatus({ type: 'loading', message: 'Injecting Synonym...' });
        try {
            const { error } = await supabase
                .from('ontology_synonyms')
                .insert([{
                    concept_id: activeConcept.id,
                    variant_text: newSynonym.variant_text,
                    language: newSynonym.language,
                    weight: parseFloat(newSynonym.weight) || 1.0
                }]);
            if (error) throw error;
            setFormStatus({ type: 'success', message: 'Synonym injected.' });
            setNewSynonym({ variant_text: '', language: 'English', weight: 1.0 });
            
            // Optimistic hook
            const updatedConcept = { ...activeConcept };
            if (!updatedConcept.ontology_synonyms) updatedConcept.ontology_synonyms = [];
            updatedConcept.ontology_synonyms.push({ variant_text: newSynonym.variant_text, language: newSynonym.language, weight: parseFloat(newSynonym.weight) || 1.0 });
            setActiveConcept(updatedConcept);
            fetchOntology();
        } catch (err) {
            setFormStatus({ type: 'error', message: err.message });
        }
    };

    const handleAddRelation = async () => {
        if (!newRelation.target_concept_id) return;
        setFormStatus({ type: 'loading', message: 'Weaving Relation Edge...' });
        try {
            const { error } = await supabase
                .from('ontology_relations')
                .insert([{
                    source_concept_id: activeConcept.id,
                    target_concept_id: newRelation.target_concept_id,
                    relation_type: newRelation.relation_type
                }]);
            if (error) throw error;
            setFormStatus({ type: 'success', message: 'Relation edge woven.' });
            setNewRelation({ target_concept_id: '', relation_type: 'requires' });
            
            fetchOntology();
            // Optional: Hard delay reload inner active state because of deeply nested query execution time
            setTimeout(() => {
                const refreshedConcept = concepts.find(c => c.id === activeConcept.id);
                if (refreshedConcept) setActiveConcept(refreshedConcept);
            }, 1000);
        } catch (err) {
            setFormStatus({ type: 'error', message: err.message });
        }
    };

    const filteredConcepts = concepts.filter(c => 
        (c.transliteration || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.primary_english || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.domain || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getConceptName = (id) => {
        const found = concepts.find(c => c.id === id);
        return found ? found.transliteration : 'Unknown Node';
    };

    // Color mapper for domains
    const getDomainColor = (domain) => {
        const d = (domain || '').toLowerCase();
        if (d.includes("aqa'id") || d.includes("theology")) return "bg-rose-900/30 text-rose-400 border-rose-900/50";
        if (d.includes("akhlaq") || d.includes("ethics")) return "bg-emerald-900/30 text-emerald-400 border-emerald-900/50";
        if (d.includes("fiqh") || d.includes("jurisprudence")) return "bg-blue-900/30 text-blue-400 border-blue-900/50";
        return "bg-zinc-800/50 text-zinc-400 border-zinc-700";
    };

    // Semantic weight pill styling
    const getWeightColor = (weight) => {
        if (weight >= 1.0) return "bg-green-500 text-black";
        if (weight >= 0.8) return "bg-amber-500 text-black";
        if (weight >= 0.5) return "bg-zinc-500 text-white";
        return "bg-red-500 text-white";
    };

    return (
        <div className="flex flex-col gap-6 w-full relative h-[85vh] overflow-hidden">
            {/* Top Navigation */}
            <div className="flex justify-between items-end border-b border-zinc-800 pb-4 shrink-0 px-2 mt-2">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Database className="w-8 h-8 text-[#c6a87c]" />
                        Brain Ontology Mapper
                    </h2>
                    <p className="text-zinc-400 mt-2 text-sm">Manage the 3-tiered relational theological knowledge graph architecture.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Search Theology Matrix..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-[#c6a87c] outline-none shadow-inner transition-colors"
                        />
                    </div>
                    <button 
                        onClick={handleNewConcept}
                        className="bg-[#c6a87c] hover:bg-[#b0956b] text-black font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-[#c6a87c]/10 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> New Concept
                    </button>
                    <div className="flex bg-[#121212] border border-zinc-800 rounded-xl overflow-hidden">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-[#c6a87c]' : 'text-zinc-600 hover:text-zinc-300'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-[#c6a87c]' : 'text-zinc-600 hover:text-zinc-300'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* How-To Toggle & Panel */}
            <div className="shrink-0 px-2">
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
                            <div className="bg-[#14171f] border border-zinc-800/80 rounded-2xl p-6 lg:p-8 mb-4 w-full">
                                <h3 className="text-lg font-bold text-white mb-1">Welcome to the Brain Ontology <span className="text-zinc-500 font-normal text-sm">(The Master Dictionary)</span></h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mt-2">This page is the "brain" of our search engine. It teaches the system how different theological terms, spellings, and translations all connect to the same core concept.</p>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-5 mt-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">1. What are we doing here?</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li>We are creating "Master Concepts". Think of these as the official dictionary entries for Twelver Shia theology.</li>
                                            <li>By adding <strong className="text-zinc-200">Synonyms & Spellings</strong>, we make sure that if a user searches for "Ghaybatul Kubra" or "Major Occultation", the search engine knows they are looking for "al-Ghaybat al-Kubra".</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">3. The Secret Weapon (Synonyms)</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li>This is the most important part! In <strong className="text-zinc-200">"Search Synonyms & Spellings"</strong>, add every possible way someone might type this concept.</li>
                                            <li><em>Example:</em> People often forget apostrophes or the "al-" prefix. Add "Sayhah", "Sufyani", etc.</li>
                                            <li><strong className="text-zinc-200">Match Strength:</strong> Exact matches = <strong className="text-green-400">1.0</strong>, loose matches = <strong className="text-amber-400">0.8</strong> or <strong className="text-zinc-300">0.5</strong>.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">2. How to Add or Edit a Concept</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li>Click <strong className="text-zinc-200">"+ New Concept"</strong> or the <strong className="text-zinc-200">"Edit" pencil</strong> on any existing card.</li>
                                            <li><strong className="text-zinc-200">Main Details:</strong> Fill in the English Title, Arabic Script, and Category.</li>
                                            <li><strong className="text-zinc-200">Definition:</strong> Write a brief, clear explanation of the term.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">4. Grid vs. List View</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li>Use <strong className="text-zinc-200">Grid View</strong> to see deep details and connections of a few concepts at once.</li>
                                            <li>Use <strong className="text-zinc-200">List View</strong> to quickly scroll through hundreds of terms and spot missing translations.</li>
                                        </ul>
                                    </div>

                                    <div className="lg:col-span-2 border-t border-zinc-800/60 pt-5 mt-1">
                                        <h4 className="text-xs font-bold text-[#c6a87c] uppercase tracking-widest mb-2">5. How does this affect the live site?</h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-sm leading-relaxed">
                                            <li><strong className="text-zinc-200">Instant Search Upgrades:</strong> Every synonym you add teaches the search bar a new word. If users type a messy spelling and get no results, adding that exact phrase here fixes it immediately.</li>
                                            <li><strong className="text-zinc-200">The Hover Tooltips:</strong> When users are reading texts on the live site, they can click on highlighted theological terms. The pop-up dictionary card they see pulls its text directly from the <strong className="text-zinc-200">English Title</strong> and <strong className="text-zinc-200">Definition</strong> you write here!</li>
                                            <li><strong className="text-zinc-200">Takeaway:</strong> You are actively programming the search engine's brain and educating the reader. Keep your definitions clear and add as many relevant synonyms as possible.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Grid Layout Container */}
            <div className="flex-1 overflow-y-auto px-2 pb-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                {loading && concepts.length === 0 ? (
                    <div className="flex justify-center items-center h-40 text-[#c6a87c] font-mono text-sm tracking-widest uppercase animate-pulse">
                        Synchronizing Ontology Engine...
                    </div>
                ) : !loading && concepts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <Network className="w-10 h-10 text-zinc-700" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-zinc-400 mb-2">The Ontology Matrix is empty.</h3>
                            <p className="text-sm text-zinc-600 max-w-md">No theological concepts have been mapped yet. Initialize your first concept to begin building the knowledge graph.</p>
                        </div>
                        <button 
                            onClick={handleNewConcept}
                            className="bg-[#c6a87c] hover:bg-[#b0956b] text-black font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-[#c6a87c]/20"
                        >
                            <Plus className="w-5 h-5" /> Initialize First Concept
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConcepts.map(c => (
                            <div key={c.id} className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col transition-all hover:border-zinc-600 group">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-[#c6a87c] font-serif">{c.transliteration}</h3>
                                    <div className="text-right">
                                        <div className="text-lg font-arabic text-zinc-200">{c.primary_arabic}</div>
                                        <div className="text-[10px] text-zinc-600 font-mono tracking-widest">{c.root_letters}</div>
                                    </div>
                                </div>
                                
                                {/* Sub-header */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/60">
                                    <span className="text-sm font-medium text-white">{c.primary_english}</span>
                                    {c.domain && (
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getDomainColor(c.domain)}`}>
                                            {c.domain}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Body */}
                                <div className="text-xs text-zinc-400 mb-6 flex-1 line-clamp-3 leading-relaxed">
                                    {c.definition || 'No definition encoded.'}
                                </div>
                                
                                {/* Synonym Pills */}
                                {c.ontology_synonyms && c.ontology_synonyms.length > 0 && (
                                    <div className="mb-5">
                                        <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5"><Database className="w-3 h-3"/> Semantic Variants</div>
                                        <div className="flex flex-wrap gap-2">
                                            {c.ontology_synonyms.map(syn => (
                                                <div key={syn.id || syn.variant_text} className="bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1 text-[11px] text-zinc-300 flex items-center gap-2">
                                                    {syn.variant_text}
                                                    <span className={`w-3 h-3 flex items-center justify-center rounded-full text-[7px] font-bold ${getWeightColor(syn.weight)}`}>
                                                        {syn.weight.toFixed(1).replace('.0', '')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Red Strings */}
                                {c.outgoing_relations && c.outgoing_relations.length > 0 && (
                                    <div className="mb-6 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                                        <div className="text-[10px] text-red-400/80 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5"><Network className="w-3 h-3"/> Theological Relations</div>
                                        <div className="flex flex-col gap-2">
                                            {c.outgoing_relations.map(rel => (
                                                <div key={rel.id} className="flex justify-between items-center text-[11px] border-b border-zinc-800/40 pb-1.5 last:border-0 last:pb-0">
                                                    <span className="text-zinc-500 font-mono tracking-wider">{rel.relation_type}</span>
                                                    <span className="text-red-400 font-medium">→ {getConceptName(rel.target_concept_id)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Card Button */}
                                <button 
                                    onClick={() => handleOpenDrawer(c)}
                                    className="mt-auto w-full py-2.5 rounded-lg bg-[#c6a87c]/10 text-[#c6a87c] hover:bg-[#c6a87c] hover:text-black font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-3.5 h-3.5" /> Configure Vector
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* LIST / TABLE VIEW */
                    <div className="bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-zinc-900/50 border-b border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 sticky top-0 z-10">
                            <div className="col-span-3">Term</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-2">English Title</div>
                            <div className="col-span-4">Synonyms</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>
                        {filteredConcepts.map(c => (
                            <div key={c.id} className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800/50 items-center hover:bg-zinc-900/50 transition-colors">
                                <div className="col-span-3">
                                    <div className="text-sm font-bold text-[#c6a87c] font-serif">{c.transliteration}</div>
                                    <div className="text-xs text-zinc-500 font-arabic mt-0.5">{c.primary_arabic}</div>
                                </div>
                                <div className="col-span-2">
                                    {c.domain ? (
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border inline-block ${getDomainColor(c.domain)}`}>
                                            {c.domain}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-600 text-xs">—</span>
                                    )}
                                </div>
                                <div className="col-span-2 text-sm text-zinc-300 truncate">{c.primary_english || '—'}</div>
                                <div className="col-span-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {c.ontology_synonyms && c.ontology_synonyms.length > 0 ? (
                                            c.ontology_synonyms.map(syn => (
                                                <span key={syn.id || syn.variant_text} className="bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5 text-[10px] text-zinc-400">
                                                    {syn.variant_text}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-zinc-600 text-[10px] italic">No aliases</span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button 
                                        onClick={() => handleOpenDrawer(c)}
                                        className="p-2 text-zinc-600 hover:text-[#c6a87c] hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Edit Concept"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* LOCKED SLIDING DRAW MODAL */}
            <AnimatePresence>
                {isDrawerOpen && activeConcept && (
                    <>
                        {/* Overlay backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseDrawer}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        
                        {/* Drawer Panel */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[#121212] border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-[#1c1c1e]">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Edit className="w-5 h-5 text-[#c6a87c]" /> Edit Concept
                                    </h3>
                                    <div className="text-xs text-[#c6a87c] font-mono tracking-widest uppercase mt-1">{activeConcept.id ? activeConcept.transliteration : 'New Concept'}</div>
                                </div>
                                <button onClick={handleCloseDrawer} className="p-2 text-zinc-500 hover:text-white bg-black rounded-lg transition-colors border border-zinc-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                                {/* Alerts */}
                                {formStatus.message && (
                                    <div className={`p-4 rounded-xl flex items-center text-xs font-bold tracking-widest shadow-md ${
                                        formStatus.type === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 
                                        formStatus.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 
                                        'bg-[#c6a87c]/10 text-[#c6a87c] border border-[#c6a87c]/30'
                                    }`}>
                                        <AlertCircle className="w-4 h-4 mr-2" /> {formStatus.message}
                                    </div>
                                )}

                                {/* CONCEPT CORE UPDATE FORM */}
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-4">Main Details</h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">English Title</label>
                                                <input 
                                                    value={activeConcept.primary_english || ''} 
                                                    onChange={e => setActiveConcept({...activeConcept, primary_english: e.target.value})}
                                                    className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-[#c6a87c]" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Category</label>
                                                <input 
                                                    value={activeConcept.domain || ''} 
                                                    onChange={e => setActiveConcept({...activeConcept, domain: e.target.value})}
                                                    className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-[#c6a87c]" 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Arabic Script</label>
                                                <input 
                                                    value={activeConcept.primary_arabic || ''} 
                                                    onChange={e => setActiveConcept({...activeConcept, primary_arabic: e.target.value})}
                                                    className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-[#c6a87c] text-right font-arabic" 
                                                    dir="rtl"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Arabic Root</label>
                                                <input 
                                                    value={activeConcept.root_letters || ''} 
                                                    onChange={e => setActiveConcept({...activeConcept, root_letters: e.target.value})}
                                                    className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-[#c6a87c] text-right font-arabic" 
                                                    dir="rtl"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Definition & Context</label>
                                            <textarea 
                                                value={activeConcept.definition || ''} 
                                                onChange={e => setActiveConcept({...activeConcept, definition: e.target.value})}
                                                className="w-full bg-black border border-zinc-800 rounded p-3 text-xs text-zinc-300 outline-none focus:border-[#c6a87c] resize-y"
                                                rows={4}
                                            />
                                        </div>
                                        <button 
                                            onClick={handleSaveConcept}
                                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] tracking-widest uppercase rounded flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Save className="w-3 h-3" /> {activeConcept.id ? 'Save Details' : 'Save New Concept'}
                                        </button>
                                    </div>
                                </div>

                                {/* SYNONYM INJECTOR */}
                                <div className="pt-6 border-t border-zinc-800">
                                    <h4 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-4">
                                        Search Synonyms & Spellings
                                    </h4>
                                    <div className="flex items-end gap-2 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 block">Alternative Search Term</label>
                                            <input 
                                                value={newSynonym.variant_text} 
                                                onChange={e => setNewSynonym({...newSynonym, variant_text: e.target.value})}
                                                placeholder="e.g. Divine Unity"
                                                className="w-full bg-black border border-zinc-700 rounded p-2 text-xs text-white outline-none" 
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 block">Match Strength</label>
                                            <select 
                                                value={newSynonym.weight} 
                                                onChange={e => setNewSynonym({...newSynonym, weight: e.target.value})}
                                                className="w-full bg-black border border-zinc-700 rounded p-2 text-xs text-white outline-none"
                                            >
                                                <option value="1.0">1.0</option>
                                                <option value="0.8">0.8</option>
                                                <option value="0.5">0.5</option>
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleAddSynonym}
                                            className="bg-green-600 hover:bg-green-500 text-white p-2.5 rounded transition-colors"
                                            title="Inject Synonym"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* RED STRING WEAVER */}
                                <div className="pt-6 border-t border-zinc-800">
                                    <h4 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-4 flex items-center justify-between">
                                        Theological Relations
                                        <span className="bg-red-900/20 text-red-500 border border-red-900/50 px-2 py-0.5 rounded text-[9px]">Red String Weaver</span>
                                    </h4>
                                    <div className="flex flex-col gap-3 p-4 bg-red-950/20 rounded-xl border border-red-900/30">
                                        <div>
                                            <label className="text-[9px] text-red-500/70 uppercase tracking-widest mb-1 block">Relationship Edge Type</label>
                                            <select 
                                                value={newRelation.relation_type} 
                                                onChange={e => setNewRelation({...newRelation, relation_type: e.target.value})}
                                                className="w-full bg-black border border-red-900/50 rounded p-2 text-xs text-red-200 outline-none"
                                            >
                                                <option value="requires">Requires</option>
                                                <option value="manifests_as">Manifests As</option>
                                                <option value="part_of">Part Of</option>
                                                <option value="contradicts">Contradicts</option>
                                                <option value="culminates_in">Culminates In</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-red-500/70 uppercase tracking-widest mb-1 block">Target Concept</label>
                                            <select 
                                                value={newRelation.target_concept_id} 
                                                onChange={e => setNewRelation({...newRelation, target_concept_id: e.target.value})}
                                                className="w-full bg-black border border-red-900/50 rounded p-2 text-xs text-red-200 outline-none"
                                            >
                                                <option value="">Select Target Concept...</option>
                                                {concepts.filter(c => c.id !== activeConcept.id).map(c => (
                                                    <option key={c.id} value={c.id}>{c.transliteration} ({c.domain})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleAddRelation}
                                            className="w-full py-2 bg-red-900 hover:bg-red-800 text-white font-bold text-[10px] tracking-widest uppercase rounded flex items-center justify-center gap-2 transition-colors mt-2"
                                        >
                                            <LinkIcon className="w-3 h-3" /> Weave Edge Map
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BrainOntology;
