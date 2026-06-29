// src/components/Home.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Library as LibraryIcon, X, RefreshCw, Copy, Check } from 'lucide-react';
import dailyHadithsData from '../daily_hadiths.json';
import KisaMotif from './KisaMotif';

// --- THE LITURGICAL ENGINE ---
const getLiturgicalContext = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isEve = hour >= 18;

    if (day === 4 && isEve) {
        return { message: "Eve of Friday • Laylat al-Jum'ah", recommendation: "Recommended: Surah Yasin", targetSurah: 36 };
    } else if (day === 5 && !isEve) {
        return { message: "Friday • Yawm al-Jum'ah", recommendation: "Recommended: Surah Al-Jumu'ah", targetSurah: 62 };
    } else if (isEve) {
        return { message: "Evening Reflection", recommendation: "Recommended: Surah Al-Waqi'ah", targetSurah: 56 };
    } else {
        return { message: "Daily Recitation", recommendation: "Recommended: Surah Yasin", targetSurah: 36 };
    }
};

// Subtle press feedback, respects reduced motion
const TouchableCard = ({ children, onClick, className, style, shouldReduceMotion }) => {
    if (shouldReduceMotion) return <div className={className} style={style} onClick={onClick}>{children}</div>;
    return (
        <motion.div whileTap={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className={className} style={style} onClick={onClick}>
            {children}
        </motion.div>
    );
};

export default function Home({
    setActiveTab,
    setQuranTarget,
    setQuranVerseTarget,
    setTranscriptTarget,
    setShowUpdates
}) {
    const [dailyHadith, setDailyHadith] = useState(null);
    const [showFocusModal, setShowFocusModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [iconRotation, setIconRotation] = useState(0);
    const [showAnnouncement, setShowAnnouncement] = useState(false);

    const mainScrollRef = useRef(null);
    const liturgicalContext = getLiturgicalContext();
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const getDayOfYear = () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            return Math.floor((now - start) / (1000 * 60 * 60 * 24));
        };
        const hadithArray = (dailyHadithsData && dailyHadithsData.length > 0) ? dailyHadithsData : [{
            arabic: "صَديقُ كُلِّ امْرِئٍ عَقْلُهُ، وَ عَدُوُّهُ جَهْلُهُ",
            english: "A person's friend is their intellect, and their enemy is their ignorance.",
            source: "Imam al-Rida (as)",
            book: "al-Kafi, Vol 1"
        }];
        const dayIndex = getDayOfYear() % hadithArray.length;
        setDailyHadith(hadithArray[dayIndex] || hadithArray[0]);

        const hasSeenAnnouncement = localStorage.getItem('kisa_v5_announcement_seen');
        if (!hasSeenAnnouncement) {
            const timer = setTimeout(() => setShowAnnouncement(true), 3500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismissAnnouncement = () => {
        setShowAnnouncement(false);
        localStorage.setItem('kisa_v5_announcement_seen', 'true');
    };

    const handleCopy = (e) => {
        if (e) e.stopPropagation();
        const textToCopy = `"${dailyHadith?.english}"\n\n${dailyHadith?.arabic ? dailyHadith.arabic + '\n\n' : ''}— ${dailyHadith?.source}\n${dailyHadith?.book}\n\nVia Al-Kisa`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleShuffle = (e) => {
        if (e) e.stopPropagation();
        if (isShuffling) return;
        setIsShuffling(true);
        setIconRotation(prev => prev + 360);
        const randomIndex = Math.floor(Math.random() * dailyHadithsData.length);
        setDailyHadith(dailyHadithsData[randomIndex]);
        setTimeout(() => setIsShuffling(false), 300);
    };

    const reveal = shouldReduceMotion
        ? {}
        : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } };

    const more = [
        { t: "The Quran", d: "Every verse, with the Ahl al-Bayt's commentary.", a: () => setActiveTab('quran') },
        { t: "Du'a & Ziyarat", d: "Daily devotions and visitations, beautifully set.", a: () => setActiveTab('duas') },
        { t: "Theological Glossary", d: "A plain A–Z of the tradition's language.", a: () => setActiveTab('glossary') },
    ];

    return (
        <div ref={mainScrollRef} className="hx-home">
            <style>{`
              .hx-home{
                --hx-serif:"Fraunces",Georgia,serif; --hx-sans:"Inter",system-ui,sans-serif;
                --ink:#231d15; --muted:#6d6151; --faint:#8a7f6e; --gold:#9c7327; --goldfill:#c9a14e; --btnink:#201a10;
                --hair:rgba(35,29,21,.10); --hair2:rgba(35,29,21,.18); --surface:#fbf8f1; --bg:#f5efe4; --tint:rgba(156,115,39,.07);
                font-family:var(--hx-sans); background:radial-gradient(120% 50% at 84% -6%, rgba(156,115,39,.06), transparent 55%), var(--bg);
                color:var(--ink); min-height:100vh; width:100%; padding:88px 22px 60px; -webkit-font-smoothing:antialiased;
              }
              :where(.dark) .hx-home{
                --ink:#efe9dd; --muted:#9b9486; --faint:#7f786b; --gold:#cda767; --goldfill:#cda767; --btnink:#16120a;
                --hair:rgba(236,230,218,.10); --hair2:rgba(236,230,218,.20); --surface:#17181c; --bg:#0f1012; --tint:rgba(205,167,103,.08);
                background:radial-gradient(110% 50% at 80% -6%, rgba(205,167,103,.10), transparent 52%), radial-gradient(90% 40% at 8% 120%, rgba(30,58,51,.22), transparent 60%), var(--bg);
              }
              .hx-wrap{ max-width:880px; margin:0 auto; }
              .hx-eyebrow{ display:flex; align-items:center; gap:11px; margin-bottom:18px; }
              .hx-eyebrow .ln{ width:30px; height:1px; background:var(--gold); opacity:.8; }
              .hx-eyebrow span{ font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); font-weight:600; }

              .hx-hero{ display:grid; grid-template-columns:1.32fr .88fr; gap:40px; align-items:center; padding:14px 0 30px; }
              .hx-h1{ font-family:var(--hx-serif); font-weight:500; font-size:clamp(34px,5vw,50px); line-height:1.05; letter-spacing:-.025em; color:var(--ink); max-width:13ch; margin:0; }
              .hx-h1 em{ font-style:normal; font-weight:600; color:var(--gold); }
              .hx-lede{ font-size:15px; line-height:1.6; color:var(--muted); max-width:33em; margin:18px 0 26px; }
              .hx-ctas{ display:flex; gap:13px; flex-wrap:wrap; }
              .hx-ctas.center{ justify-content:center; }
              .hx-btn{ font-size:13.5px; font-weight:600; padding:12px 22px; border-radius:10px; cursor:pointer; border:1px solid transparent; transition:transform .18s ease,border-color .18s ease,color .18s ease; }
              .hx-btn-primary{ background:var(--goldfill); color:var(--btnink); }
              .hx-btn-primary:hover{ transform:translateY(-1px); }
              .hx-btn-ghost{ background:transparent; color:var(--ink); border-color:var(--hair2); font-weight:550; }
              .hx-btn-ghost:hover{ border-color:var(--gold); color:var(--gold); }
              .hx-trust{ display:flex; gap:18px 20px; flex-wrap:wrap; margin-top:22px; }
              .hx-trust span{ display:inline-flex; align-items:center; gap:7px; font-size:12px; color:var(--muted); }
              .hx-trust svg{ width:14px; height:14px; color:var(--gold); }

              .hx-course{ border-radius:16px; overflow:hidden; border:1px solid var(--hair); background:var(--surface); box-shadow:0 16px 40px -26px rgba(0,0,0,.55); cursor:pointer; }
              .hx-cover{ position:relative; height:128px; background:radial-gradient(120% 120% at 80% 0%, #2a2722, #14130f); display:flex; align-items:flex-end; padding:13px; overflow:hidden; }
              .hx-cover-motif{ position:absolute; right:-22px; top:-22px; width:128px; height:128px; color:#cda767; opacity:.22; }
              .hx-free{ position:relative; font-size:10px; letter-spacing:.1em; text-transform:uppercase; font-weight:700; color:#16120a; background:#c9a14e; border-radius:6px; padding:4px 9px; }
              .hx-cbody{ padding:18px 20px 20px; }
              .hx-kicker{ font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); font-weight:600; }
              .hx-cbody h3{ font-family:var(--hx-serif); font-weight:500; font-size:24px; color:var(--ink); margin:8px 0; }
              .hx-cbody p{ font-size:12.5px; color:var(--muted); line-height:1.5; margin:0 0 16px; }
              .hx-start{ display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:700; color:var(--gold); }

              .hx-litwrap{ display:flex; justify-content:center; margin-bottom:18px; }
              .hx-lit{ display:inline-flex; align-items:center; gap:10px; padding:9px 16px; border-radius:999px; background:var(--surface); border:1px solid var(--hair); cursor:pointer; font-size:11.5px; }
              .hx-lit .m{ font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--ink); }
              .hx-lit .dot{ color:var(--faint); }
              .hx-lit .rec{ color:var(--muted); }

              .hx-daily{ position:relative; padding:26px 30px; border-radius:14px; background:var(--tint); border:1px solid var(--hair); margin-bottom:6px; }
              .hx-daily-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
              .hx-daily-actions{ display:flex; gap:8px; }
              .hx-daily-actions button{ width:30px; height:30px; border-radius:8px; border:1px solid var(--hair2); background:transparent; color:var(--muted); display:grid; place-items:center; cursor:pointer; }
              .hx-daily-actions button:hover{ color:var(--gold); border-color:var(--gold); }
              .hx-daily-actions svg{ width:14px; height:14px; }
              .hx-quote{ font-family:var(--hx-serif); font-style:italic; font-size:22px; line-height:1.42; color:var(--ink); margin:0; max-width:42ch; }
              .hx-attr{ margin-top:12px; font-size:12.5px; color:var(--muted); } .hx-attr b{ color:var(--ink); font-weight:600; }
              .hx-readfull{ margin-top:12px; background:none; border:none; padding:0; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gold); cursor:pointer; display:inline-flex; align-items:center; gap:5px; }

              .hx-manifesto{ position:relative; margin:30px -22px; padding:54px 22px; background:radial-gradient(120% 90% at 80% -10%, rgba(205,167,103,.13), transparent 60%), #14130f; color:#efe9dd; overflow:hidden; border-top:1px solid var(--hair); border-bottom:1px solid var(--hair); }
              .hx-mani-motif{ position:absolute; right:24px; top:50%; transform:translateY(-50%); width:230px; height:230px; color:#cda767; opacity:.09; }
              .hx-mani-in{ max-width:880px; margin:0 auto; position:relative; }
              .hx-mani-in .hx-eyebrow span{ color:#cda767; } .hx-mani-in .hx-eyebrow .ln{ background:#cda767; }
              .hx-mani-in h2{ font-family:var(--hx-serif); font-weight:500; font-size:clamp(24px,3.4vw,30px); line-height:1.3; color:#f3eee2; max-width:26ch; margin:0; }
              .hx-mani-in h2 em{ font-style:italic; color:#cda767; }
              .hx-rule{ height:1px; background:rgba(236,230,218,.16); margin:24px 0 18px; max-width:110px; }
              .hx-zahra{ font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:#cda767; font-weight:600; margin-bottom:9px; }
              .hx-zline{ font-family:var(--hx-serif); font-style:italic; font-size:17px; color:#d8d1c2; line-height:1.5; max-width:44ch; }

              .hx-explore{ padding-top:8px; }
              .hx-ehead{ display:flex; align-items:baseline; gap:14px; margin-bottom:20px; }
              .hx-ehead span:first-child{ font-family:var(--hx-serif); font-style:italic; font-size:18px; color:var(--ink); }
              .hx-ehead .ln{ flex:1; height:1px; background:var(--hair); }
              .hx-pillars{ display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:30px; }
              .hx-pillar{ position:relative; border:1px solid var(--hair); border-radius:15px; background:var(--surface); padding:26px; overflow:hidden; box-shadow:0 12px 30px -24px rgba(0,0,0,.5); cursor:pointer; }
              .hx-pillar-motif{ position:absolute; right:-26px; bottom:-26px; width:120px; height:120px; color:var(--ink); opacity:.06; }
              .hx-pic{ width:38px; height:38px; border-radius:10px; background:rgba(156,115,39,.12); display:grid; place-items:center; color:var(--gold); margin-bottom:14px; }
              .hx-pic svg{ width:20px; height:20px; }
              .hx-pk{ font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); font-weight:600; }
              .hx-pillar h3{ font-family:var(--hx-serif); font-weight:500; font-size:24px; color:var(--ink); margin:6px 0 8px; }
              .hx-pillar p{ font-size:13px; color:var(--muted); line-height:1.55; margin:0 0 16px; }
              .hx-link{ font-size:12.5px; font-weight:600; color:var(--ink); border-bottom:1px solid var(--gold); padding-bottom:2px; }

              .hx-mlabel{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); font-weight:600; margin-bottom:6px; }
              .hx-mrow{ display:flex; align-items:center; gap:16px; padding:16px 8px; border-bottom:1px solid var(--hair); cursor:pointer; border-radius:9px; transition:background .15s ease, padding .15s ease; }
              .hx-mrow:hover{ background:var(--tint); padding-left:14px; }
              .hx-mt{ font-family:var(--hx-serif); font-size:17px; color:var(--ink); min-width:170px; }
              .hx-md{ font-size:12.5px; color:var(--muted); flex:1; }
              .hx-mrow svg{ width:16px; height:16px; color:var(--gold); }

              .hx-closing{ text-align:center; padding:50px 0 20px; }
              .hx-closing h2{ font-family:var(--hx-serif); font-weight:500; font-size:clamp(24px,3.4vw,30px); color:var(--ink); margin:0 0 8px; }
              .hx-closing p{ font-size:14px; color:var(--muted); margin:0 0 20px; }

              @media(max-width:740px){
                .hx-hero{ grid-template-columns:1fr; gap:24px; }
                .hx-pillars{ grid-template-columns:1fr; }
                .hx-quote{ font-size:20px; }
                .hx-mrow{ flex-wrap:wrap; gap:4px; } .hx-mt{ min-width:0; }
                .hx-mani-motif{ display:none; }
              }
            `}</style>

            {/* --- DAILY HADITH FOCUS MODAL (unchanged) --- */}
            <AnimatePresence>
                {showFocusModal && dailyHadith && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFocusModal(false)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 w-full max-w-[600px] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
                            <div className="flex justify-between items-center pt-5 pb-4 px-6 border-b border-[#5C4A3D]/15">
                                <h3 className="font-mono text-sm uppercase text-[#c6a87c] font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> Daily Hadith</h3>
                                <button onClick={() => setShowFocusModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
                            </div>
                            <div className="p-8 overflow-y-auto max-h-[70vh]">
                                {dailyHadith.arabic && (
                                    <p className="font-arabic text-4xl text-right leading-[2.2] text-[#2D241C] dark:text-slate-100 mb-6" dir="rtl">{dailyHadith.arabic}</p>
                                )}
                                <p className="text-2xl text-[#2D241C] dark:text-[#FAFAFA] font-editorial mb-6">{dailyHadith.english}</p>
                                <div className="text-xs font-bold uppercase tracking-widest text-[#5C4A3D] dark:text-[#c6a87c]">{dailyHadith.source} — {dailyHadith.book}</div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ANNOUNCEMENT (unchanged) --- */}
            <AnimatePresence>
                {showAnnouncement && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-6 sm:bottom-10 left-0 right-0 flex justify-center z-[100] px-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto bg-[#FDFBF7]/90 dark:bg-[#151518]/90 backdrop-blur-xl border border-[#c6a87c]/30 shadow-[0_10px_40px_rgba(198,168,124,0.15)] rounded-2xl sm:rounded-full p-4 sm:py-3 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full max-w-xl">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-[#c6a87c]/10 flex items-center justify-center shrink-0 border border-[#c6a87c]/20">
                                    <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 text-[#c6a87c]" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-[#2D241C] dark:text-[#FAFAFA] leading-tight">Welcome to v5.0.0</p>
                                    <p className="text-xs text-[#5C4A3D]/80 dark:text-[#FAFAFA]/70">New masterclasses, sacred texts, and interactive study tools drop every Sunday.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                <button onClick={() => { dismissAnnouncement(); if (setShowUpdates) setShowUpdates(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-[#c6a87c] hover:bg-[#b09265] text-[#FDFBF7] dark:text-[#151518] text-xs font-bold uppercase tracking-widest rounded-xl sm:rounded-full transition-colors shadow-sm">Read Log</button>
                                <button onClick={dismissAnnouncement} className="p-2 text-[#5C4A3D]/50 dark:text-[#FAFAFA]/50 hover:text-[#2D241C] dark:hover:text-[#FAFAFA] bg-[#5C4A3D]/5 dark:bg-white/5 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="hx-wrap">
                {/* HERO */}
                <motion.section className="hx-hero"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                    <div className="hx-hl">
                        <div className="hx-eyebrow"><span className="ln" /><span>A Twelver Shia learning platform</span></div>
                        <h1 className="hx-h1">Know the <em>Ahl al-Bayt</em> as they asked to be known.</h1>
                        <p className="hx-lede">Learn the faith from its source — guided courses and the full hadith library, in the words of the Imams. No background needed.</p>
                        <div className="hx-ctas">
                            <button className="hx-btn hx-btn-primary" onClick={() => setActiveTab('library')}>Start here</button>
                            <button className="hx-btn hx-btn-ghost" onClick={() => setActiveTab('hadith')}>Explore the hadith →</button>
                        </div>
                        <div className="hx-trust">
                            <span><Check /> Verified primary sources</span>
                            <span><Check /> Reviewed by Shia experts</span>
                            <span><Check /> Free — no sign-up to read</span>
                        </div>
                    </div>

                    <TouchableCard shouldReduceMotion={shouldReduceMotion} className="hx-course" onClick={() => { setActiveTab('library'); setTranscriptTarget('the-third-testimony-ep1'); }}>
                        <div className="hx-cover">
                            <KisaMotif className="hx-cover-motif" />
                            <span className="hx-free">Lesson 1 · Free</span>
                        </div>
                        <div className="hx-cbody">
                            <div className="hx-kicker">Featured masterclass</div>
                            <h3>The Third Testimony</h3>
                            <p>The testimony of the Wilayah of Ali (a) — explained simply, from the sources.</p>
                            <span className="hx-start">Start lesson 1 <ChevronRight className="w-4 h-4" /></span>
                        </div>
                    </TouchableCard>
                </motion.section>

                {/* LITURGICAL RECITATION */}
                <div className="hx-litwrap">
                    <TouchableCard shouldReduceMotion={shouldReduceMotion} className="hx-lit" onClick={() => { setQuranTarget(liturgicalContext.targetSurah); setQuranVerseTarget(1); setActiveTab('quran'); }}>
                        <span className="m">{liturgicalContext.message}</span>
                        <span className="dot">•</span>
                        <span className="rec">{liturgicalContext.recommendation}</span>
                    </TouchableCard>
                </div>

                {/* DAILY HADITH */}
                <motion.div className="hx-daily" {...reveal}>
                    <div className="hx-daily-head">
                        <span className="hx-kicker">Daily Hadith</span>
                        <div className="hx-daily-actions">
                            <button onClick={handleCopy} aria-label="Copy hadith">{isCopied ? <Check /> : <Copy />}</button>
                            <button onClick={handleShuffle} disabled={isShuffling} aria-label="Show another hadith">
                                <motion.span style={{ display: 'grid' }} animate={{ rotate: iconRotation }}><RefreshCw /></motion.span>
                            </button>
                        </div>
                    </div>
                    <blockquote className="hx-quote">“{dailyHadith?.english}”</blockquote>
                    <div className="hx-attr"><b>{dailyHadith?.source}</b> · {dailyHadith?.book}</div>
                    {dailyHadith?.english?.length > 95 && (
                        <button className="hx-readfull" onClick={() => setShowFocusModal(true)}>Read full hadith <ChevronRight className="w-3 h-3" /></button>
                    )}
                </motion.div>

                {/* MANIFESTO — the distinction */}
                <motion.section className="hx-manifesto" {...reveal}>
                    <KisaMotif className="hx-mani-motif" />
                    <div className="hx-mani-in">
                        <div className="hx-eyebrow"><span className="ln" /><span>Why Al-Kisa</span></div>
                        <h2>Go straight to the source. Al-Kisa presents the faith in the words of the <em>Ahl al-Bayt</em> — the Imams' own teachings, not only what was later written about them.</h2>
                        <div className="hx-rule" />
                        <div className="hx-zahra">The Zahra'i approach</div>
                        <div className="hx-zline">Learning the religion as the household of the Prophet ﷺ themselves defined it — known as they asked to be known.</div>
                    </div>
                </motion.section>

                {/* WHERE TO BEGIN */}
                <section className="hx-explore">
                    <motion.div className="hx-ehead" {...reveal}><span>Where to begin</span><span className="ln" /></motion.div>
                    <motion.div className="hx-pillars" {...reveal}>
                        <TouchableCard shouldReduceMotion={shouldReduceMotion} className="hx-pillar" onClick={() => setActiveTab('library')}>
                            <KisaMotif className="hx-pillar-motif" />
                            <div className="hx-pic"><LibraryIcon /></div>
                            <div className="hx-pk">The Academy</div>
                            <h3>Study in sequence.</h3>
                            <p>Guided courses that build lesson by lesson — with revision and a scholarly library alongside.</p>
                            <span className="hx-link">Start learning →</span>
                        </TouchableCard>
                        <TouchableCard shouldReduceMotion={shouldReduceMotion} className="hx-pillar" onClick={() => setActiveTab('hadith')}>
                            <KisaMotif className="hx-pillar-motif" />
                            <div className="hx-pic"><Sparkles /></div>
                            <div className="hx-pk">Concept Search</div>
                            <h3>Ask by meaning.</h3>
                            <p>Search the whole hadith library by theme, not just keywords — and follow a narration to its kin.</p>
                            <span className="hx-link">Search the hadith →</span>
                        </TouchableCard>
                    </motion.div>
                    <motion.div {...reveal}>
                        <div className="hx-mlabel">Also on Al-Kisa</div>
                        {more.map((r) => (
                            <div key={r.t} className="hx-mrow" onClick={r.a}>
                                <span className="hx-mt">{r.t}</span>
                                <span className="hx-md">{r.d}</span>
                                <ChevronRight />
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* CLOSING */}
                <motion.section className="hx-closing" {...reveal}>
                    <h2>Begin where the knowledge begins.</h2>
                    <p>Pick a course and start learning — no account needed to read.</p>
                    <div className="hx-ctas center">
                        <button className="hx-btn hx-btn-primary" onClick={() => setActiveTab('library')}>Start here</button>
                        <button className="hx-btn hx-btn-ghost" onClick={() => setActiveTab('hadith')}>Explore the hadith →</button>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
