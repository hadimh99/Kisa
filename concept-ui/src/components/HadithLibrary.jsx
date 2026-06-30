// src/components/HadithLibrary.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Book, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Menu, X, Copy, Check, PenTool, History, Clock, Search, List, MapPin, Sparkles, Edit3, Save, MoreHorizontal, Share2, Link, BookmarkPlus } from 'lucide-react';
import ChapterTitleHeading from './ChapterTitleHeading';

// --- CORE TEXT PARSING ENGINE ---
export const slugifyHadithParam = (text) => {
    if (!text) return '';
    return text.toString()
        .normalize('NFD')                   // Decompose combined characters
        .replace(/[\u0300-\u036f]/g, '')    // Remove diacritics/accents
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')        // Remove remaining invalid chars
        .replace(/\s+/g, '-')               // Replace spaces with hyphens
        .replace(/-+/g, '-');               // Collapse multiple hyphens
};

export const slugifyVolume = (text) => {
    if (!text) return '';
    const numMatch = text.match(/\d+/);
    if (numMatch) return `vol-${numMatch[0]}`;
    return slugifyHadithParam(text);
};

const splitText = (text) => {
    const markers = ["in a marfu‘ manner who has narrated the following:", "in a marfu' manner who has narrated the following:", "in a marfu‘ manner the following:", "in a marfu' manner the following:", "who has narrated the following:", "said the following:", "who said:", "who has said:", "is narrated from", "narrated that:", "following Hadith:", "the following is narrated:", "said:"];
    for (let marker of markers) {
        if (text.includes(marker)) {
            const parts = text.split(marker);
            let rawChain = parts[0] + marker;
            // Trim surrounding spaces but PRESERVE a leading newline (intentional matn line-break)
            let bodyPart = parts.slice(1).join(marker).replace(/^[ \t]+|[ \t\n]+$/g, '');
            const segments = rawChain.split(/(\s+(?:from|narrated that|narrated from|who heard|who has said that|who said that|has said that|said that)\s+)/i);
            let chainSegments = [], bodySegments = [], foundNonImam = false;
            const blessingRegex = /\(\s*(as|a\.s\.?|s\.a\.?|sawa|s\.a\.w\.w\.?|r\.a\.?)\s*\)|\{\{AS\}\}|\{\{SAW\}\}/i;
            for (let i = segments.length - 1; i >= 0; i -= 2) {
                let chunk = segments[i], delimiter = i > 0 ? segments[i - 1] : "", hasBlessing = blessingRegex.test(chunk);
                if (hasBlessing && !foundNonImam) {
                    bodySegments.unshift(chunk);
                    let prevChunk = i >= 2 ? segments[i - 2] : null;
                    if (prevChunk && blessingRegex.test(prevChunk)) { if (delimiter) bodySegments.unshift(delimiter); }
                    else { if (delimiter) chainSegments.unshift(delimiter); }
                } else {
                    foundNonImam = true;
                    chainSegments.unshift(chunk);
                    if (delimiter) chainSegments.unshift(delimiter);
                }
            }
            let finalChain = chainSegments.join("").trim().replace(/(?:(?:from|narrated that|narrated from|who heard|who has said that|who said that|has said that|said that)\s*|,\s*)+$/i, "").trim();
            let finalBodyPrefix = bodySegments.join("").trim();
            let finalBody = finalBodyPrefix ? (finalBodyPrefix + " " + bodyPart) : bodyPart;
            finalBody = finalBody.replace(/^[:\s,‘'"]+/, "");
            if (finalBody.length > 0) finalBody = finalBody.charAt(0).toUpperCase() + finalBody.slice(1);
            return { chain: finalChain || null, body: finalBody };
        }
    }
    return { chain: null, body: text };
};

const formatParagraphs = (text) => {
    if (!text) return [];
    if (text.includes('\n')) return text.split('\n').filter(p => p.trim());
    if (text.length < 500) return [text];
    const rawSegments = text.split(/([.!?]["'”’]*\s*(?:\(\s*\d+\s*:\s*\d+\s*\))?\s+)/);
    const sentences = [];
    for (let i = 0; i < rawSegments.length; i += 2) {
        let sentence = rawSegments[i];
        if (rawSegments[i + 1]) sentence += rawSegments[i + 1];
        if (sentence.trim()) sentences.push(sentence);
    }
    let paragraphs = [], currentPara = "";
    sentences.forEach(sentence => {
        currentPara += sentence;
        const endsWithAcronym = /(a\.s\.\s*|s\.a\.\s*|a\.j\.\s*|r\.a\.\s*|sawa\s*)$/i.test(sentence);
        const insideQuote = ((currentPara.match(/[“‘]/g) || []).length > (currentPara.match(/[”’]/g) || []).length) || ((currentPara.match(/"/g) || []).length % 2 !== 0);
        if (((currentPara.length > 600 && !insideQuote) || currentPara.length > 1200) && !endsWithAcronym) {
            paragraphs.push(currentPara.trim()); currentPara = "";
        }
    });
    if (currentPara.trim()) paragraphs.push(currentPara.trim());
    return paragraphs;
};

const formatHadithText = (text) => {
    if (!text) return "";
    const { body } = splitText(text);
    return body;
};

// --- HONORIFIC CALLIGRAPHY RENDERING ---
// {{AS}} -> recoloured "alayhi al-salaam" calligraphy (public/alayhi-salam.svg) for the Imams.
// {{SAW}} -> the ﷺ glyph (U+FDFA, Amiri) for the Prophet.
const HONORIFIC_RE = /(\{\{AS\}\}|\{\{SAW\}\})/g;

const renderHonorifics = (text) => {
    if (text === null || text === undefined) return text;
    const str = String(text);
    if (!str.includes('{{')) return str;
    return str.split(HONORIFIC_RE).map((part, i) => {
        if (part === '{{AS}}') {
            return (
                <span
                    key={i}
                    role="img"
                    aria-label="ʿalayhi al-salām (peace be upon him)"
                    style={{
                        display: 'inline-block', width: '1.5em', height: '0.9em',
                        verticalAlign: '-0.08em', margin: '0 0.04em',
                        backgroundColor: 'currentColor',
                        WebkitMaskImage: 'url(/alayhi-salam.svg)', maskImage: 'url(/alayhi-salam.svg)',
                        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center', maskPosition: 'center',
                        WebkitMaskSize: 'contain', maskSize: 'contain',
                    }}
                />
            );
        }
        if (part === '{{SAW}}') {
            return (
                <span
                    key={i}
                    aria-label="ṣallā Allāhu ʿalayhi wa-ālihi wa-sallam"
                    style={{ fontFamily: "'Scheherazade New', 'Amiri', serif", fontSize: '0.95em', lineHeight: 1, verticalAlign: '0.02em', margin: '0 0.06em' }}
                >&#xFDFA;</span>
            );
        }
        return part;
    });
};

// Plain-text fallback for clipboard / Vault storage (no JSX).
const tokensToPlain = (text) => String(text || '')
    .replace(/\{\{AS\}\}/g, '(alayhi al-salaam)')
    .replace(/\{\{SAW\}\}/g, 'ﷺ');

// --- THE NEW ADMIN-ENABLED LIBRARY NODE ---
const LibraryHadithNode = ({ hadith, copiedId, handleCopyId, isAdmin }) => {
    const [showArabic, setShowArabic] = useState(false);
    const [showChain, setShowChain] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const arabicText = hadith.arabicText || hadith.ar || "";
    let englishText = hadith.englishText || hadith.en || "";

    let displayNum = hadith.hadith_number || hadith.id || "Unknown";
    const engMatch = String(englishText).match(/^[\s"'‘“\[\(]*(?:Unknown[\.\s]*)?(\d+)[\.\-:]?\s/i);
    if (engMatch) displayNum = engMatch[1];

    englishText = String(englishText).replace(/^[\s"'‘“\[\(]*(?:Unknown[\.\s]*)?(?:\d+[\.\-:]?\s*)?/i, "").trim();
    englishText = englishText.replace(/(who has said the following|said the following|who said|the following is narrated|who has narrated the following|in a marfu['‘] manner the following|in a marfu['‘] manner who has narrated the following)(?!\s*:)/gi, "$1:");
    if (englishText.length > 0) englishText = englishText.charAt(0).toUpperCase() + englishText.slice(1);

    const { chain: parsedChain, body: parsedBody } = splitText(englishText);

    const [currentBody, setCurrentBody] = useState(hadith.manual_body || parsedBody);
    const [currentChain, setCurrentChain] = useState(hadith.manual_chain || parsedChain || "");

    const [draftBody, setDraftBody] = useState(currentBody);
    const [draftChain, setDraftChain] = useState(currentChain);

    const paragraphs = formatParagraphs(currentBody);

    const isIntro = String(hadith.chapter || "").toLowerCase().includes('introduction');
    const isValidNum = displayNum && String(displayNum).toLowerCase() !== "unknown";
    const showNumber = isValidNum && !isIntro;

    const handleSaveEdit = async () => {
        setIsSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            alert("Authentication Error: You must be Signed In from the top menu to save edits to the global database.");
            setIsSaving(false);
            return;
        }

        const { data, error } = await supabase
            .from('kisa_hadiths')
            .update({ manual_body: draftBody, manual_chain: draftChain })
            .eq('id', String(hadith.id))
            .select();

        if (error || !data || data.length === 0) {
            console.error("Failed to save edit:", error);
            alert("Database Error: Failed to save edit to the cloud. Please check your permissions.");
        } else {
            setCurrentBody(draftBody);
            setCurrentChain(draftChain);
            hadith.manual_body = draftBody;
            hadith.manual_chain = draftChain;
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handleCancel = () => {
        setDraftBody(currentBody);
        setDraftChain(currentChain);
        setIsEditing(false);
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copyMode, setCopyMode] = useState(null);
    const [copiedAction, setCopiedAction] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    const bookStr = hadith.book || hadith.book_number || 'Unknown Book';
    const volStr = hadith.volume_number ? `Vol. ${hadith.volume_number}` : (hadith.volume ? `Vol. ${hadith.volume}` : '');
    const catStr = hadith.category || '';
    const chapStr = hadith.chapter || hadith.chapter_number || '';

    const cleanChapNum = chapStr.match(/\d+/);
    const formattedChap = cleanChapNum ? `Ch. ${cleanChapNum[0]}` : chapStr;

    const preciseReference = [bookStr, volStr, catStr, formattedChap, `Hadith ${displayNum}`].filter(Boolean).join(', ');

    const deepLink = `${window.location.origin}${window.location.pathname}?tab=hadith&book=${encodeURIComponent(bookStr)}&volume=${encodeURIComponent(volStr)}&category=${encodeURIComponent(catStr)}&chapter=${encodeURIComponent(chapStr)}`;

    const safeCopyToClipboard = (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(err => console.error('Clipboard failed', err));
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try { document.execCommand('copy'); } catch (error) { console.error('Fallback failed', error); }
            textArea.remove();
        }
    };

    const triggerActionFeedback = (actionKey, message) => {
        setCopiedAction(actionKey);
        if (message) setToastMessage(message);

        setTimeout(() => {
            setIsMenuOpen(false);
            setCopyMode(null);
            setCopiedAction(null);
        }, 800);

        if (message) {
            setTimeout(() => {
                const elements = Array.from(document.querySelectorAll('.hadith-block'));
                setToastMessage(null);
            }, 3000);
        }
    };

    const handleAddToVault = async (e) => {
        e.stopPropagation();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return alert("Please Sign In from the top menu to save to your Vault.");

        const { error } = await supabase.from('vault_items').insert([{
            user_id: session.user.id, content: tokensToPlain(currentBody), arabic_text: arabicText,
            source: preciseReference, type: 'hadith', chain: tokensToPlain(currentChain)
        }]);

        if (!error) {
            window.dispatchEvent(new Event('vault-updated'));
            triggerActionFeedback('vault', 'Added to Vault successfully!');
        } else {
            setIsMenuOpen(false);
        }
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        const shareData = { title: 'Al-Kisa Hadith Library', text: `Read this Hadith from ${bookStr}:\n\n"${currentBody.substring(0, 100)}..."`, url: deepLink };
        if (navigator.share && window.isSecureContext) {
            try { await navigator.share(shareData); } catch (err) { }
            setIsMenuOpen(false);
        } else {
            safeCopyToClipboard(deepLink);
            triggerActionFeedback('share', 'Link copied to clipboard');
        }
    };

    const handleCopyLink = (e) => {
        e.stopPropagation();
        safeCopyToClipboard(deepLink);
        triggerActionFeedback('link', 'Link copied to clipboard');
    };

    const handleCopyFormat = (e, format) => {
        e.stopPropagation();
        let textToCopy = "";

        const LRM = '\u200E';
        const separator = "──────────";
        const ltrBody = `${LRM}${tokensToPlain(currentBody)}`;
        const ltrChain = currentChain ? `${LRM}${tokensToPlain(currentChain)}` : "";
        const ltrRef = `${LRM}${preciseReference}`;

        if (format === 'ar') {
            textToCopy = `${arabicText}\n\n${ltrRef}`;
        } else if (format === 'en') {
            textToCopy = `${ltrBody}\n\n${ltrRef}`;
        } else if (format === 'ar_en') {
            textToCopy = `${arabicText}\n\n${separator}\n\n${ltrBody}\n\n${ltrRef}`;
        } else if (format === 'full') {
            const chainPart = ltrChain ? `${ltrChain}\n\n${separator}\n\n` : "";
            textToCopy = `${arabicText}\n\n${separator}\n\n${chainPart}${ltrBody}\n\n${ltrRef}`;
        }

        safeCopyToClipboard(textToCopy);
        triggerActionFeedback(format, 'Copied to clipboard');
    };

    return (
        <div className={`hadith-block group sm:border sm:rounded-2xl p-5 sm:p-6 sm:shadow-sm relative transition-all ${isEditing ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-[#151518] border-slate-200 dark:border-[#2d2d33] hover:border-[#c6a87c]/30'}`}>

            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-[#2D241C]/90 dark:bg-[#FAFAFA]/95 backdrop-blur-xl text-[#FDFBF7] dark:text-[#0A120E] px-6 py-3.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] text-[13px] sm:text-sm font-medium tracking-wide flex items-center gap-3 whitespace-nowrap"
                    >
                        <Check className="w-4 h-4 text-[#c6a87c] dark:text-[#5C4A3D]" /> {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex items-center gap-1 sm:gap-2">
                {/* --- THE ADMIN LOCK --- */}
                {!isEditing && isAdmin && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 sm:p-2 bg-slate-50 dark:bg-[#1c1c20] rounded-md sm:rounded-lg border border-slate-200 dark:border-[#2d2d33] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-slate-500 hover:text-[#c6a87c] cursor-pointer shadow-sm">
                        <Edit3 className="w-4 h-4" />
                    </button>
                )}

                <div className="relative">
                    <button onClick={() => { setIsMenuOpen(!isMenuOpen); setCopyMode(null); }} className="p-1.5 sm:p-2 rounded-md sm:rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-[#2d2d33] transition-colors text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1c20] hover:text-slate-800 dark:hover:text-[#FAFAFA] cursor-pointer">
                        <MoreHorizontal className="w-6 h-6" />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setCopyMode(null); }} />
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 5 }} className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white dark:bg-[#1c1c20] border border-slate-200 dark:border-[#2d2d33] rounded-xl shadow-2xl z-40 overflow-hidden flex flex-col p-2">

                                    {copyMode === 'selecting' ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); setCopyMode(null); }} className="w-full text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-[#FAFAFA] rounded-md transition-colors flex items-center gap-2 mb-1 cursor-pointer">
                                                <ChevronLeft className="w-5 h-5" /> Back
                                            </button>
                                            <div className="h-px w-full bg-slate-100 dark:bg-[#2d2d33] mb-1" />
                                            <button onClick={(e) => handleCopyFormat(e, 'ar')} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span>Arabic Only</span>
                                                {copiedAction === 'ar' && <Check className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                            <button onClick={(e) => handleCopyFormat(e, 'en')} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span>English Only</span>
                                                {copiedAction === 'en' && <Check className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                            <button onClick={(e) => handleCopyFormat(e, 'ar_en')} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span>Arabic & English</span>
                                                {copiedAction === 'ar_en' && <Check className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                            <button onClick={(e) => handleCopyFormat(e, 'full')} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span>All</span>
                                                {copiedAction === 'full' && <Check className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={handleAddToVault} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span className="flex items-center gap-3"><BookmarkPlus className="w-5 h-5 opacity-60" /> Add to Vault</span>
                                                {copiedAction === 'vault' && <Check className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setCopyMode('selecting'); }} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span className="flex items-center gap-3"><Copy className="w-5 h-5 opacity-60" /> Copy Hadith</span>
                                                <ChevronRight className="w-4 h-4 opacity-40" />
                                            </button>
                                            <button onClick={handleCopyLink} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span className="flex items-center gap-3"><Link className="w-5 h-5 opacity-60" /> Copy Link</span>
                                                {copiedAction === 'link' && <Check className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                            <button onClick={handleShare} className="w-full text-left px-3 py-3 text-sm font-medium text-slate-700 dark:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#2d2d33] rounded-md transition-colors flex items-center justify-between cursor-pointer">
                                                <span className="flex items-center gap-3"><Share2 className="w-5 h-5 opacity-60" /> Share...</span>
                                                {copiedAction === 'share' && <Check className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mb-3 mt-1">
                <button onClick={(e) => { e.stopPropagation(); setShowArabic(!showArabic); }} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-slate-500 hover:text-[#c6a87c] dark:text-slate-400">
                    {showArabic ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {showArabic ? "Hide Original Arabic" : "View Original Arabic"}
                </button>
                <AnimatePresence>
                    {showArabic && arabicText && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="p-4 sm:p-5 rounded-lg mt-2 mb-2 border bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                                <p className="font-arabic text-xl md:text-2xl text-right leading-[2.2] text-slate-700 dark:text-slate-300" dir="rtl" lang="ar">
                                    {arabicText}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {isEditing ? (
                <div className="mt-6 border-t border-amber-200/50 dark:border-amber-800/50 pt-5 flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 block">Edit Chain of Narrators</label>
                        <textarea
                            value={draftChain}
                            onChange={(e) => setDraftChain(e.target.value)}
                            className="w-full bg-white dark:bg-[#1c1c20] border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm italic font-sans text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y min-h-[80px]"
                            placeholder="Paste the extracted chain here..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 block">Edit English Matn (Core Text)</label>
                        <textarea
                            value={draftBody}
                            onChange={(e) => setDraftBody(e.target.value)}
                            className="w-full bg-white dark:bg-[#1c1c20] border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-lg sm:text-xl leading-relaxed font-serif text-slate-900 dark:text-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y min-h-[300px]"
                        />
                    </div>
                    <div className="sticky bottom-4 sm:bottom-6 z-50 flex justify-end gap-3 mt-4 p-3 bg-white/90 dark:bg-[#1c1c20]/90 backdrop-blur-xl border border-amber-200 dark:border-amber-800/80 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <button
                            onPointerDown={(e) => { e.preventDefault(); handleCancel(); }}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onPointerDown={(e) => { e.preventDefault(); if (!isSaving) handleSaveEdit(); }}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer flex items-center gap-2 shadow-md"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save</>}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="mb-5">
                        <button onClick={(e) => { e.stopPropagation(); setShowChain(!showChain); }} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-slate-500 hover:text-[#c6a87c] dark:text-slate-400">
                            {showChain ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {showChain ? "Hide Chain of Narrators" : "View Chain of Narrators"}
                        </button>
                        <AnimatePresence>
                            {showChain && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <p className="mt-2 p-3 rounded-lg text-sm italic font-sans border bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                                        {currentChain ? renderHonorifics(currentChain) : "Chain information not explicitly found in English text."}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#2d2d33] pt-5">
                        {paragraphs.map((para, idx) => (
                            <p key={idx} dir="ltr" className={`text-left text-lg sm:text-xl text-slate-900 dark:text-[#f8f8f8] leading-relaxed font-serif antialiased ${idx !== paragraphs.length - 1 ? 'mb-3' : ''}`}>
                                {(idx === 0 && showNumber) && (
                                    <span className="font-bold text-[#c6a87c] dark:text-[#d4b78f] text-xl sm:text-2xl mr-2 select-none">{displayNum}.</span>
                                )}
                                {renderHonorifics(para)}
                            </p>
                        ))}
                        {hadith.nonImamReport && (
                            <p dir="ltr" className="mt-4 text-xs sm:text-sm text-slate-500 dark:text-[#9a9a9a] italic leading-relaxed border-l-2 border-slate-200 dark:border-[#2d2d33] pl-3">
                                † This narration is reported on the authority of a transmitter rather than one of the Imams. Such reports are uncommon in this collection.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// --- LIBRARY COMPONENT ACCEPTS isAdmin ---
const HadithLibrary = ({ hadithData = [], externalTarget, isAdmin = false }) => {
    const [currentView, setCurrentView] = useState(() => localStorage.getItem('kisa_hl_view') || 'home');
    useEffect(() => { localStorage.setItem('kisa_hl_view', currentView); }, [currentView]);

    const navigate = useNavigate();
    const { book: urlBook, volume: urlVolume, category: urlCategory, chapter: urlChapter } = useParams();

    const handleNavigate = (loc) => {
        if (!loc || !loc.book) return;
        let url = `/hadith/${slugifyHadithParam(loc.book)}`;
        if (loc.volume) url += `/${slugifyVolume(loc.volume)}`;
        if (loc.category) url += `/${slugifyHadithParam(loc.category)}`;
        if (loc.chapter) url += `/${slugifyHadithParam(loc.chapter)}`;
        navigate(url);
    };

    const [searchQuery, setSearchQuery] = useState('');

    const [dashExpanded, setDashExpanded] = useState({});

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    const [isFabVisible, setIsFabVisible] = useState(true);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (currentView !== 'reader' || isMobileDrawerOpen) return;
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setIsFabVisible(false);
        } else if (previous > latest) {
            setIsFabVisible(true);
        }
    });

    useEffect(() => {
        const header = document.querySelector('header');
        if (isMobileDrawerOpen) {
            if (header) header.classList.add('force-header-visible');
            document.body.style.overflow = 'hidden';
        } else {
            if (header) header.classList.remove('force-header-visible');
            document.body.style.overflow = '';
        }
        return () => {
            if (header) header.classList.remove('force-header-visible');
            document.body.style.overflow = '';
        };
    }, [isMobileDrawerOpen]);

    const [activeLocation, setActiveLocation] = useState(() => {
        const saved = localStorage.getItem('kisa_hl_loc');
        return saved ? JSON.parse(saved) : { book: null, volume: null, category: null, chapter: null };
    });
    useEffect(() => { localStorage.setItem('kisa_hl_loc', JSON.stringify(activeLocation)); }, [activeLocation]);

    const [expandedBooks, setExpandedBooks] = useState({});
    const [expandedVolumes, setExpandedVolumes] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const topRef = useRef(null);

    const [readingProgress, setReadingProgress] = useState(() => {
        const saved = localStorage.getItem('kisa_hadith_progress');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        try {
            const savedData = JSON.parse(localStorage.getItem('kisa_hadith_progress') || '{}');
            let hasCorruption = false;
            Object.keys(savedData).forEach(key => {
                if (key.includes('undefined')) {
                    delete savedData[key];
                    hasCorruption = true;
                }
            });
            if (hasCorruption) {
                localStorage.setItem('kisa_hadith_progress', JSON.stringify(savedData));
                setReadingProgress(savedData);
            }
        } catch (e) { }
    }, []);

    const [isExploding, setIsExploding] = useState(false);
    const [resumeToast, setResumeToast] = useState(false);
    const lastSaveTimeRef = useRef(0);

    const getChapterKey = (loc) => `${loc.book}|${loc.volume}|${loc.category}|${loc.chapter}`;

    const { hierarchy, flatChapters, dashboardData } = useMemo(() => {
        const tree = {};
        const chaptersList = [];
        const dashboard = {};

        const safeData = Array.isArray(hadithData) ? hadithData : [];

        safeData.forEach(h => {
            const b = String(h.book || h.book_number || 'Unknown Book');
            const vStr = h.volume_number ? `Volume ${h.volume_number}` : (h.volume ? `Volume ${h.volume}` : h.bookId || 'Unknown Volume');
            const v = String(vStr);
            const cat = String(h.category || 'Unknown Category');
            const chap = String(h.chapter || h.chapter_number || 'Unknown Chapter');
            const chapKey = `${b}|${v}|${cat}|${chap}`;

            if (!tree[b]) tree[b] = {};
            if (!tree[b][v]) tree[b][v] = {};
            if (!tree[b][v][cat]) tree[b][v][cat] = {};
            if (!tree[b][v][cat][chap]) {
                tree[b][v][cat][chap] = [];
                chaptersList.push({ book: b, volume: v, category: cat, chapter: chap, key: chapKey });
            }
            tree[b][v][cat][chap].push(h);

            if (!dashboard[b]) dashboard[b] = { volumes: {} };
            if (!dashboard[b].volumes[v]) {
                dashboard[b].volumes[v] = {
                    id: `${b}-${v}`,
                    book: b,
                    volume: v,
                    chapterKeys: new Set(),
                    firstLocation: { book: b, volume: v, category: cat, chapter: chap }
                };
            }
            dashboard[b].volumes[v].chapterKeys.add(chapKey);
        });

        Object.values(dashboard).forEach(bData => {
            Object.values(bData.volumes).forEach(vData => {
                vData.chapterKeys = Array.from(vData.chapterKeys);
                vData.totalChapters = vData.chapterKeys.length;
            });
        });

        return { hierarchy: tree, flatChapters: chaptersList, dashboardData: dashboard };
    }, [hadithData]);

    const lastOpenedTargetRef = useRef(null);

    useEffect(() => {
        if (externalTarget && externalTarget.book && Object.keys(hierarchy).length > 0) {
            if (lastOpenedTargetRef.current === externalTarget) return;

            const findFuzzyKey = (obj, searchStrings) => {
                const keys = Object.keys(obj);
                for (let str of searchStrings) {
                    if (!str) continue;
                    const match = keys.find(k => k.toLowerCase().includes(str.toLowerCase()));
                    if (match) return match;
                }
                return keys[0];
            };

            const targetBookKey = findFuzzyKey(hierarchy, [externalTarget.book, 'kafi']);
            const bookNode = hierarchy[targetBookKey];

            if (bookNode) {
                const targetVolKey = findFuzzyKey(bookNode, [externalTarget.volume, '1']);
                const volNode = bookNode[targetVolKey];

                if (volNode) {
                    const targetCatKey = findFuzzyKey(volNode, [externalTarget.category, externalTarget.sub_book, 'intell', 'ignor']);
                    const catNode = volNode[targetCatKey];

                    if (catNode) {
                        const targetChapKey = findFuzzyKey(catNode, [externalTarget.chapter, externalTarget.category, 'intell', 'ignor']);

                        if (targetChapKey) {
                            lastOpenedTargetRef.current = externalTarget;
                            handleNavigate({
                                book: targetBookKey,
                                volume: targetVolKey,
                                category: targetCatKey,
                                chapter: targetChapKey
                            });
                        }
                    }
                }
            }
        }
    }, [externalTarget, hierarchy]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        const safeData = Array.isArray(hadithData) ? hadithData : [];
        return safeData.filter(h =>
            (h.englishText && String(h.englishText).toLowerCase().includes(query)) ||
            (h.arabicText && String(h.arabicText).includes(query)) ||
            (h.chapter && String(h.chapter).toLowerCase().includes(query))
        ).slice(0, 50);
    }, [searchQuery, hadithData]);

    const resumeLocation = useMemo(() => {
        const progressEntries = Object.entries(readingProgress);
        if (progressEntries.length === 0) return null;

        progressEntries.sort((a, b) => (b[1].lastAccessed || 0) - (a[1].lastAccessed || 0));
        const lastId = progressEntries[0][0];
        const lastStatus = progressEntries[0][1].status;

        if (lastStatus === 'in-progress') {
            const [book, volume, category, chapter] = lastId.split('|');
            return { book, volume, category, chapter };
        }
        return null;
    }, [readingProgress]);

    const openReader = (loc) => {
        if (!loc || !loc.book) return;

        const chapterKey = getChapterKey(loc);
        const currentSavedData = JSON.parse(localStorage.getItem('kisa_hadith_progress') || '{}');
        const currentStatus = currentSavedData[chapterKey]?.status || 'in-progress';

        const newData = {
            ...currentSavedData,
            [chapterKey]: {
                position: 0,
                percentage: 0,
                ...currentSavedData[chapterKey],
                status: currentStatus === 'completed' ? 'completed' : 'in-progress',
                lastAccessed: Date.now()
            }
        };

        localStorage.setItem('kisa_hadith_progress', JSON.stringify(newData));
        setReadingProgress(newData);

        setActiveLocation(loc);
        setCurrentView('reader');

        setExpandedBooks({ [loc.book]: true });
        setExpandedVolumes({ [`${loc.book}-${loc.volume}`]: true });
        setExpandedCategories({ [`${loc.book}-${loc.volume}-${loc.category}`]: true });

        // Keep URL perfectly synced when opening a chapter from dashboard or search
        handleNavigate(loc);
    };

    const closeReader = () => {
        if (activeLocation && activeLocation.chapter) {
            const chapterKey = getChapterKey(activeLocation);
            const currentSavedData = JSON.parse(localStorage.getItem('kisa_hadith_progress') || '{}');

            const y = window.scrollY;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (y / height) * 100 : 0;

            const currentStatus = currentSavedData[chapterKey]?.status || 'in-progress';
            const newStatus = currentStatus === 'completed' ? 'completed' : 'in-progress';

            currentSavedData[chapterKey] = {
                ...currentSavedData[chapterKey],
                position: y,
                percentage: scrolled,
                status: newStatus,
                lastAccessed: Date.now()
            };

            localStorage.setItem('kisa_hadith_progress', JSON.stringify(currentSavedData));
            setReadingProgress(currentSavedData);
        }

        setCurrentView('home');
        setSearchQuery('');
    };

    // URL -> State Synchronization
    useEffect(() => {
        if (!hierarchy || Object.keys(hierarchy).length === 0) return;

        if (urlBook) {
            const matchKey = (obj, slug, slugifier) => {
                if (!obj || !slug) return null;
                const safeSlug = decodeURIComponent(slug).toLowerCase();
                return Object.keys(obj).find(k => slugifier(k) === safeSlug);
            };

            const realBook = matchKey(hierarchy, urlBook, slugifyHadithParam);
            if (realBook) {
                const bookNode = hierarchy[realBook];
                let realVol = null, realCat = null, realChap = null;

                if (urlVolume) {
                    realVol = matchKey(bookNode, urlVolume, slugifyVolume);
                    if (realVol) {
                        const volNode = bookNode[realVol];
                        if (urlCategory) {
                            realCat = matchKey(volNode, urlCategory, slugifyHadithParam);
                            if (realCat) {
                                const catNode = volNode[realCat];
                                if (urlChapter) {
                                    realChap = matchKey(catNode, urlChapter, slugifyHadithParam);
                                }
                            }
                        }
                    }
                }

                // Strictly update local state without panicking or forcibly navigating
                const loc = { book: realBook, volume: realVol, category: realCat, chapter: realChap };

                if (realChap) {
                    // It's a valid chapter URL, open the reader
                    if (getChapterKey(activeLocation) !== getChapterKey(loc)) {
                        openReader(loc);
                    }
                } else {
                    // Valid parent URL but missing/invalid chapter. Just set the active location and expand.
                    setActiveLocation(loc);
                    setExpandedBooks(prev => ({ ...prev, [realBook]: true }));
                    if (realVol) setExpandedVolumes(prev => ({ ...prev, [`${realBook}-${realVol}`]: true }));
                    if (realCat) setExpandedCategories(prev => ({ ...prev, [`${realBook}-${realVol}-${realCat}`]: true }));
                    // If they are in the reader but the URL lacks a chapter, return to dashboard gracefully
                    if (currentView !== 'home') {
                        setCurrentView('home');
                        setSearchQuery('');
                    }
                }
            } else {
                // Invalid book, revert to dashboard
                if (currentView !== 'home') {
                    setCurrentView('home');
                    setSearchQuery('');
                }
            }
        } else {
            // Root /hadith URL, stay on dashboard
            if (currentView !== 'home') {
                setCurrentView('home');
                setSearchQuery('');
            }
        }
    }, [urlBook, urlVolume, urlCategory, urlChapter, hierarchy]);


    useEffect(() => {
        if (currentView !== 'reader' || !activeLocation.chapter) return;

        const chapterKey = getChapterKey(activeLocation);
        const savedData = JSON.parse(localStorage.getItem('kisa_hadith_progress') || '{}');
        const docData = savedData[chapterKey];

        if (docData && docData.position > 300) {
            window.scrollTo(0, 0);

            setTimeout(() => {
                const startY = 0;
                const targetY = docData.position;
                const distance = targetY - startY;

                const duration = Math.min(1800, Math.max(800, Math.abs(distance) * 0.15));
                let start = null;

                const cinematicScroll = (timestamp) => {
                    if (!start) start = timestamp;
                    const progress = timestamp - start;
                    const t = Math.min(progress / duration, 1);

                    const easeOut = 1 - Math.pow(1 - t, 4);
                    window.scrollTo(0, startY + (distance * easeOut));

                    if (progress < duration) {
                        window.requestAnimationFrame(cinematicScroll);
                    } else {
                        const elements = Array.from(document.querySelectorAll('.hadith-block'));
                        const targetEl = elements.find(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.top >= 0 && rect.top < window.innerHeight / 2;
                        }) || elements[0];

                        if (targetEl) {
                            targetEl.classList.add('bg-[#c6a87c]/20', 'dark:bg-[#c6a87c]/20', 'transition-colors', 'duration-1000');
                            setTimeout(() => targetEl.classList.remove('bg-[#c6a87c]/20', 'dark:bg-[#c6a87c]/20'), 2500);
                        }

                        setResumeToast(true);
                        setTimeout(() => setResumeToast(false), 3000);
                    }
                };
                window.requestAnimationFrame(cinematicScroll);
            }, 300);
        } else {
            window.scrollTo(0, 0);
        }

        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const y = window.scrollY;
                    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    const scrolled = height > 0 ? (y / height) * 100 : 0;

                    const now = Date.now();
                    if (now - lastSaveTimeRef.current > 1000) {
                        const currentSavedData = JSON.parse(localStorage.getItem('kisa_hadith_progress') || '{}');
                        const currentStatus = currentSavedData[chapterKey]?.status;

                        const newStatus = currentStatus === 'completed' ? 'completed' : 'in-progress';

                        currentSavedData[chapterKey] = {
                            ...currentSavedData[chapterKey],
                            position: y,
                            percentage: scrolled,
                            status: newStatus,
                            lastAccessed: now
                        };

                        localStorage.setItem('kisa_hadith_progress', JSON.stringify(currentSavedData));
                        setReadingProgress(currentSavedData);
                        lastSaveTimeRef.current = now;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [currentView, activeLocation]);

    const currentIndex = flatChapters.findIndex(c =>
        c.book === activeLocation.book && c.volume === activeLocation.volume &&
        c.category === activeLocation.category && c.chapter === activeLocation.chapter
    );
    const prevChapterInfo = currentIndex > 0 ? flatChapters[currentIndex - 1] : null;
    const nextChapterInfo = currentIndex !== -1 && currentIndex + 1 < flatChapters.length ? flatChapters[currentIndex + 1] : null;

    const handleNext = () => {
        if (!nextChapterInfo) return;
        const chapterKey = getChapterKey(activeLocation);
        const newProg = {
            ...readingProgress,
            [chapterKey]: { status: 'completed', lastAccessed: Date.now(), position: 0, percentage: 100 }
        };
        setReadingProgress(newProg);
        localStorage.setItem('kisa_hadith_progress', JSON.stringify(newProg));
        handleNavigate(nextChapterInfo);
    };

    const handlePrev = () => {
        if (!prevChapterInfo) return;
        handleNavigate(prevChapterInfo);
    };

    // SURGICAL FIX: Folders simply expand/collapse without touching the URL
    const toggleBook = (e, bookName) => {
        e.stopPropagation();
        setExpandedBooks(prev => ({ ...prev, [bookName]: !prev[bookName] }));
    };

    const toggleVolume = (e, bookName, volumeName, volumeKey) => {
        e.stopPropagation();
        setExpandedVolumes(prev => ({ ...prev, [volumeKey]: !prev[volumeKey] }));
    };

    const toggleCategory = (e, bookName, volumeName, categoryName, categoryKey) => {
        e.stopPropagation();
        setExpandedCategories(prev => ({ ...prev, [categoryKey]: !prev[categoryKey] }));
    };

    const renderSidebarContent = (isMobile) => (
        <div className="flex flex-col h-full bg-[#f7f7f9] dark:bg-[#151518]">
            {!isMobile && (
                <div className="p-5 border-b border-slate-200 dark:border-[#2d2d33] flex justify-between items-center bg-white dark:bg-[#252528] shrink-0">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Book className="w-4 h-4 text-[#c6a87c]" /> Collection Index
                    </h2>
                    <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
                </div>
            )}

            <div className={`px-4 pb-4 overflow-y-auto flex-1 smart-scrollbar ${isMobile ? 'pt-6' : 'pt-4'}`}>
                {Object.entries(hierarchy).map(([bookName, volumes]) => {
                    const isBookExpanded = expandedBooks[bookName];
                    const isActiveBook = activeLocation.book === bookName;

                    return (
                        <div key={bookName} className="mb-4">
                            <button
                                onClick={(e) => toggleBook(e, bookName)}
                                className={`w-full text-left font-serif font-bold text-xl mb-2 pl-2 border-l-2 flex items-center justify-between group cursor-pointer transition-colors text-slate-800 dark:text-[#ededf0] ${isActiveBook ? 'border-[#c6a87c]' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <span className="leading-tight pr-2">{bookName}</span>
                                <div className="flex items-center gap-2 shrink-0 pr-1">
                                    {isActiveBook && <div className="w-1.5 h-1.5 rounded-full bg-[#c6a87c] shadow-[0_0_6px_rgba(198,168,124,0.8)]" />}
                                    {isBookExpanded ? <ChevronUp className="w-4 h-4 opacity-50 group-hover:opacity-100" /> : <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />}
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isBookExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-2">
                                        {Object.entries(volumes).map(([volumeName, categories]) => {
                                            const volumeKey = `${bookName}-${volumeName}`;
                                            const isVolumeExpanded = expandedVolumes[volumeKey];
                                            const isActiveVolume = isActiveBook && activeLocation.volume === volumeName;

                                            return (
                                                <div key={volumeName} className="mb-3 mt-3">
                                                    <button
                                                        onClick={(e) => toggleVolume(e, bookName, volumeName, volumeKey)}
                                                        className="w-full text-left text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-between group cursor-pointer transition-colors py-1.5 px-2 rounded-md bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-[#ededf0]"
                                                    >
                                                        <span>{volumeName}</span>
                                                        <div className="flex items-center gap-2 shrink-0 pr-1">
                                                            {isActiveVolume && <div className="w-1.5 h-1.5 rounded-full bg-[#c6a87c] shadow-[0_0_6px_rgba(198,168,124,0.8)]" />}
                                                            {isVolumeExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> : <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />}
                                                        </div>
                                                    </button>

                                                    <AnimatePresence initial={false}>
                                                        {isVolumeExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-1">
                                                                {Object.entries(categories).map(([categoryName, chapters]) => {
                                                                    const categoryKey = `${bookName}-${volumeName}-${categoryName}`;
                                                                    const isCategoryExpanded = expandedCategories[categoryKey];
                                                                    const isActiveCategory = isActiveVolume && activeLocation.category === categoryName;

                                                                    return (
                                                                        <div key={categoryName} className="mb-1.5">
                                                                            <button
                                                                                onClick={(e) => toggleCategory(e, bookName, volumeName, categoryName, categoryKey)}
                                                                                className="w-full text-left text-xs font-bold py-2 px-2 rounded-md transition-colors flex items-center justify-between group cursor-pointer text-slate-700 dark:text-[#ededf0] hover:bg-slate-200/50 dark:hover:bg-[#1c1c20]"
                                                                            >
                                                                                <span className="pr-2 leading-snug flex-1">{categoryName}</span>
                                                                                <div className="flex items-center gap-2 shrink-0 pr-1">
                                                                                    {isActiveCategory && <div className="w-1.5 h-1.5 rounded-full bg-[#c6a87c] shadow-[0_0_6px_rgba(198,168,124,0.8)]" />}
                                                                                    {isCategoryExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> : <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />}
                                                                                </div>
                                                                            </button>

                                                                            <AnimatePresence initial={false}>
                                                                                {isCategoryExpanded && (
                                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex flex-col gap-0.5 border-l-2 border-slate-200 dark:border-[#2d2d33] ml-2 pl-2 mt-1">
                                                                                        {Object.keys(chapters).map((chapterName, chapterIdx) => {
                                                                                            const isActiveChapter = isActiveCategory && activeLocation.chapter === chapterName;
                                                                                            return (
                                                                                                <button
                                                                                                    key={chapterName}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        // SURGICAL FIX: Only Chapters trigger a URL navigation
                                                                                                        handleNavigate({ book: bookName, volume: volumeName, category: categoryName, chapter: chapterName });
                                                                                                        if (isMobile) setIsMobileDrawerOpen(false);
                                                                                                    }}
                                                                                                    className={`text-left text-xs py-2.5 px-3 rounded-lg transition-colors cursor-pointer flex items-start gap-2 ${isActiveChapter ? 'bg-[#c6a87c]/10 text-[#c6a87c] font-bold border border-[#c6a87c]/20' : 'text-slate-500 hover:text-slate-800 dark:text-[#9a9a9f] dark:hover:text-[#ededf0] hover:bg-slate-100 dark:hover:bg-[#1c1c20]'}`}
                                                                                                >
                                                                                                    <span className="font-mono opacity-50 pt-[1px] shrink-0">{chapterIdx + 1}.</span>
                                                                                                    <span>{chapterName}</span>
                                                                                                </button>
                                                                                            )
                                                                                        })}
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ============================================================================
    // VIEW 1: THE DASHBOARD
    // ============================================================================
    if (currentView === 'home') {
        let resumeChapIdx = -1;
        if (resumeLocation) {
            const catObj = hierarchy[resumeLocation.book]?.[resumeLocation.volume]?.[resumeLocation.category] || {};
            resumeChapIdx = Object.keys(catObj).indexOf(resumeLocation.chapter);
        }

        return (
            <div className="w-full min-h-screen pt-24 sm:pt-32 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col pointer-events-auto relative z-10">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl sm:text-5xl font-serif font-bold text-zinc-900 dark:text-white mb-3">Hadith Library</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">Explore foundational Twelver Shia collections.</p>
                </div>

                {resumeLocation && !searchQuery.trim() && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => openReader(resumeLocation)}
                        className="w-full bg-gradient-to-r from-[#c6a87c]/10 to-transparent border border-[#c6a87c]/30 hover:bg-[#c6a87c]/20 rounded-2xl p-6 sm:p-8 mb-12 cursor-pointer transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm group"
                    >
                        <div className="flex-1 w-full pr-4">
                            <div className="flex items-center flex-wrap gap-2 mb-3">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-[#c6a87c]" />
                                    <span className="text-[#c6a87c] font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                                        Continue Reading
                                    </span>
                                </div>
                                <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
                                <span className="text-zinc-500 dark:text-zinc-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                                    {resumeLocation.book}
                                </span>
                            </div>

                            <ChapterTitleHeading
                                chapterNumber={resumeChapIdx !== -1 ? resumeChapIdx + 1 : null}
                                chapterTitle={resumeLocation.chapter}
                                className="text-xl sm:text-2xl transition-colors group-hover:text-[#c6a87c] mb-2 line-clamp-2"
                            />
                            <p className="text-xs sm:text-sm font-serif text-zinc-500 dark:text-zinc-400">
                                {resumeLocation.volume} • {resumeLocation.category}
                            </p>

                            <div className="w-full max-w-[200px] h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-5 overflow-hidden">
                                <div className="h-full bg-[#c6a87c] transition-all duration-500" style={{ width: `${readingProgress[getChapterKey(resumeLocation)]?.percentage || 0}%` }} />
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1c1c1e] shadow-md border border-[#c6a87c]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <ChevronRight className="w-6 h-6 text-[#c6a87c]" />
                        </div>
                    </motion.div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); document.activeElement?.blur(); }} className="relative mb-12">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 sm:py-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#1c1c1e] shadow-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c6a87c] focus:border-transparent transition-all"
                        placeholder="Search all collections by specific words or chapters..."
                    />
                    {searchQuery.trim() && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                {searchResults.length} matches
                            </span>
                            <button type="button" onClick={() => setSearchQuery('')} className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </form>

                {searchQuery.trim() ? (
                    <div className="flex flex-col gap-5">
                        {searchResults.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500 italic">No matches found for "{searchQuery}"</div>
                        ) : (
                            searchResults.map((hadith, idx) => {
                                const b = String(hadith.book || hadith.book_number || 'Unknown Book');
                                const v = String(hadith.volume_number ? `Volume ${hadith.volume_number}` : (hadith.volume ? `Volume ${hadith.volume}` : hadith.bookId));
                                const cat = String(hadith.category || 'Unknown Category');
                                const chap = String(hadith.chapter || hadith.chapter_number || 'Unknown Chapter');

                                return (
                                    <div key={idx} onClick={() => openReader({ book: b, volume: v, category: cat, chapter: chap })} className="bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 cursor-pointer hover:shadow-lg hover:border-[#c6a87c]/50 transition-all duration-300 group">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex-wrap">
                                            <span>{b}</span> <ChevronRight className="w-3 h-3" />
                                            <span>{v}</span> <ChevronRight className="w-3 h-3" />
                                            <span className="text-[#c6a87c]">{chap}</span>
                                        </div>
                                        <p dir="ltr" className="text-left text-lg text-zinc-700 dark:text-zinc-300 font-serif leading-relaxed line-clamp-3">
                                            {renderHonorifics(formatHadithText(hadith.englishText))}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {Object.entries(dashboardData).map(([bookName, bookData]) => {
                            const volumesArray = Object.values(bookData.volumes).sort((a, b) => a.volume.localeCompare(b.volume));
                            const isExpanded = dashExpanded[bookName] !== false;

                            return (
                                <div key={bookName} className="bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all">
                                    <button onClick={() => setDashExpanded(prev => ({ ...prev, [bookName]: !isExpanded }))} className="flex items-center justify-between w-full p-5 sm:p-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#252528] transition-colors group">
                                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-3">
                                            <Book className="w-6 h-6 text-[#c6a87c]" /> {bookName}
                                        </h2>
                                        <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-[#c6a87c]/10 text-[#c6a87c]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-[#c6a87c]'}`}>
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-zinc-200 dark:border-zinc-800">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-5 sm:p-6 bg-zinc-50/50 dark:bg-[#161618]">
                                                    {volumesArray.map(vol => {
                                                        let completedChapters = 0;
                                                        vol.chapterKeys.forEach(key => {
                                                            if (readingProgress[key]?.status === 'completed') completedChapters++;
                                                        });
                                                        const progress = vol.totalChapters > 0 ? (completedChapters / vol.totalChapters) * 100 : 0;
                                                        const isCompleted = progress === 100 && vol.totalChapters > 0;

                                                        return (
                                                            <div key={vol.id} onClick={() => openReader(vol.firstLocation)} className="bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:border-[#c6a87c]/50 transition-all duration-300 flex flex-col justify-between group h-full relative overflow-hidden">
                                                                {progress > 0 && !isCompleted && (
                                                                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
                                                                        <div className="h-full bg-[#c6a87c]" style={{ width: `${progress}%` }} />
                                                                    </div>
                                                                )}
                                                                {isCompleted && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}

                                                                <div>
                                                                    <div className="mb-4">
                                                                        <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-[#252528] text-zinc-500 dark:text-zinc-400 px-2.5 py-1 rounded-md shadow-sm border border-zinc-200 dark:border-[#2d2d33]">
                                                                            {vol.totalChapters} Chapters
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-[#c6a87c] transition-colors">
                                                                        {vol.volume}
                                                                    </h3>
                                                                </div>

                                                                <div className="mt-8 flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                                                                    <span className="text-xs font-semibold uppercase tracking-wider">{progress > 0 ? 'Continue Reading' : 'Start Reading'}</span>
                                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ============================================================================
    // VIEW 2: THE READER
    // ============================================================================

    if (!activeLocation.chapter) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center pt-24 px-4 text-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Content could not be loaded.</h2>
                    <button onClick={() => navigate('/hadith')} className="px-6 py-2.5 bg-[#c6a87c] text-white font-bold rounded-lg uppercase tracking-wider text-xs cursor-pointer">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    const rawHadiths = hierarchy[activeLocation.book]?.[activeLocation.volume]?.[activeLocation.category]?.[activeLocation.chapter];
    const currentHadiths = Array.isArray(rawHadiths) ? rawHadiths : [];

    const currentCategoryChapters = hierarchy[activeLocation.book]?.[activeLocation.volume]?.[activeLocation.category] || {};
    const displayChapterIndex = Object.keys(currentCategoryChapters).indexOf(activeLocation.chapter);

    return (
        <div className="w-full min-h-screen pt-20 sm:pt-32 pb-32 flex flex-col items-center font-sans relative px-0 sm:px-6 lg:px-8" ref={topRef}>
            <style>{`
                .force-header-visible { transform: translateY(0) !important; }
            `}</style>

            <AnimatePresence>
                {resumeToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-[400] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 rounded-full shadow-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#c6a87c]" /> Resumed where you left off
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="md:hidden w-full max-w-[1400px] mx-auto mb-6 px-4 sm:px-0 flex justify-start pointer-events-auto">
                <button onClick={() => navigate('/hadith')} className="flex items-center gap-2 text-zinc-500 hover:text-[#c6a87c] transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Dashboard
                </button>
            </div>

            <div className="hidden md:block fixed top-32 left-8 z-50 transition-all duration-300 pointer-events-auto">
                <AnimatePresence>
                    {!sidebarOpen && (
                        <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onClick={() => setSidebarOpen(true)} className="p-3 bg-white dark:bg-[#252528] border border-slate-200 dark:border-[#2d2d33] shadow-xl rounded-full text-slate-500 hover:text-[#c6a87c] transition-colors cursor-pointer group">
                            <List className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isFabVisible && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                        className="md:hidden fixed bottom-6 right-3 z-[250] w-12 h-12 bg-white dark:bg-[#252528] text-[#c6a87c] border border-slate-200 dark:border-[#2d2d33] rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                        {isMobileDrawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-5 h-5" />}
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMobileDrawerOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileDrawerOpen(false)} className="md:hidden fixed inset-0 bg-black/40 z-[190] cursor-pointer backdrop-blur-sm" />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="md:hidden fixed top-12 sm:top-14 bottom-0 left-0 w-[85vw] max-w-[340px] bg-[#f7f7f9] dark:bg-[#151518] z-[200] shadow-2xl border-r border-slate-200 dark:border-[#2d2d33] flex flex-col overflow-hidden">
                            {renderSidebarContent(true)}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="w-full max-w-[1400px] mx-auto flex items-start gap-0 md:gap-8 lg:gap-12">

                <motion.div
                    animate={{ width: sidebarOpen ? 340 : 0, opacity: sidebarOpen ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="hidden md:flex shrink-0 overflow-hidden sticky top-28 self-start h-[calc(100vh-120px)] flex-col gap-4"
                >
                    <button onClick={() => navigate('/hadith')} className="flex items-center gap-2 text-zinc-500 hover:text-[#c6a87c] transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer pl-1 w-max">
                        <ChevronLeft className="w-4 h-4" /> Dashboard
                    </button>
                    <div className="w-[340px] flex-1 border border-slate-200 dark:border-[#2d2d33] rounded-2xl flex flex-col shadow-sm min-h-0 overflow-hidden">
                        {renderSidebarContent(false)}
                    </div>
                </motion.div>

                <div className="flex-1 min-w-0 w-full flex justify-center transition-all duration-500">
                    <div className="w-full max-w-4xl mx-auto">

                        <div className="flex items-center justify-between w-full mb-12 px-4 sm:px-0 mt-2">

                            <button
                                onClick={() => navigate('/hadith')}
                                className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1c1c20] hover:bg-white dark:hover:bg-[#2d2d33] rounded-full py-2 px-4 border border-slate-200 dark:border-[#2d2d33] shadow-sm transition-all text-slate-500 dark:text-slate-400 hover:text-[#c6a87c] dark:hover:text-[#c6a87c] text-[10px] sm:text-xs font-bold uppercase tracking-widest cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Library
                            </button>

                            <div className="flex items-center bg-slate-50 dark:bg-[#1c1c20] rounded-full p-1.5 border border-slate-200 dark:border-[#2d2d33] shadow-sm px-2 gap-1 sm:gap-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={!prevChapterInfo}
                                    className={`px-3 py-1.5 rounded-full transition-colors flex items-center justify-center ${prevChapterInfo ? 'hover:bg-white dark:hover:bg-[#2d2d33] text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm' : 'opacity-30 cursor-not-allowed text-slate-400'}`}
                                    title="Previous Chapter"
                                >
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <div className="w-px h-4 bg-slate-300 dark:bg-[#3d3d43] mx-1" />
                                <button
                                    onClick={handleNext}
                                    disabled={!nextChapterInfo}
                                    className={`px-3 py-1.5 rounded-full transition-colors flex items-center justify-center ${nextChapterInfo ? 'hover:bg-white dark:hover:bg-[#2d2d33] text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm' : 'opacity-30 cursor-not-allowed text-slate-400'}`}
                                    title="Next Chapter"
                                >
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-12 px-4 sm:px-0">
                            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center flex-wrap gap-2">
                                <span>{String(activeLocation.book)}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>{String(activeLocation.volume)}</span>
                                <ChevronRight className="w-3 h-3 text-[#c6a87c]" />
                                <span className="text-[#c6a87c]">{String(activeLocation.category)}</span>
                            </div>

                            <ChapterTitleHeading
                                chapterNumber={displayChapterIndex !== -1 ? displayChapterIndex + 1 : null}
                                chapterTitle={String(activeLocation.chapter)}
                                className="text-3xl sm:text-4xl md:text-5xl font-serif leading-[1.15] tracking-tight mb-6"
                            />

                            <div className="flex items-center mb-10">
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1c1c20] px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#2d2d33] shadow-sm flex items-center gap-1.5">
                                    <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c6a87c]" /> {currentHadiths.length} Narrations
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 sm:gap-8 px-4 sm:px-0">
                            {currentHadiths.map((hadith, index) => (
                                <LibraryHadithNode
                                    key={hadith.id || index}
                                    hadith={hadith}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-[#2d2d33] grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-24 px-4 sm:px-0">
                            {prevChapterInfo ? (
                                <div onClick={handlePrev} className="group flex flex-col justify-center p-6 bg-white dark:bg-[#151518] border border-slate-200 dark:border-[#2d2d33] rounded-2xl cursor-pointer hover:border-[#c6a87c]/50 hover:shadow-sm transition-all text-left">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                        <ChevronLeft className="w-4 h-4 text-[#c6a87c]" /> Previous
                                    </span>
                                    <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-[#ededf0] group-hover:text-[#c6a87c] transition-colors line-clamp-2">
                                        {prevChapterInfo.chapter}
                                    </h3>
                                    <span className="text-xs text-slate-500 mt-2 truncate">
                                        {prevChapterInfo.book} • {prevChapterInfo.volume}
                                    </span>
                                </div>
                            ) : <div />}

                            {nextChapterInfo ? (
                                <div onClick={handleNext} className="group flex flex-col justify-center p-6 bg-white dark:bg-[#151518] border border-slate-200 dark:border-[#2d2d33] rounded-2xl cursor-pointer hover:border-[#c6a87c]/50 hover:shadow-sm transition-all text-right items-end">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                        Next <ChevronRight className="w-4 h-4 text-[#c6a87c]" />
                                    </span>
                                    <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-[#ededf0] group-hover:text-[#c6a87c] transition-colors line-clamp-2">
                                        {nextChapterInfo.chapter}
                                    </h3>
                                    <span className="text-xs text-slate-500 mt-2 truncate">
                                        {nextChapterInfo.book} • {nextChapterInfo.volume}
                                    </span>
                                </div>
                            ) : <div />}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default HadithLibrary;